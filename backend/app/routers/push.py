from fastapi import APIRouter, HTTPException, Header, Request
from typing import Optional, List
from datetime import datetime, timezone
import uuid

from app.database import db
from app.models import *
from app.utils import get_current_user, send_push_notification, send_push_to_user, VAPID_PUBLIC_KEY

router = APIRouter()

@router.get("/push/vapid-public-key")
async def get_vapid_public_key():
    """Get VAPID public key for push notification subscription"""
    if not VAPID_PUBLIC_KEY:
        raise HTTPException(status_code=503, detail="Push notifications not configured")
    return {"publicKey": VAPID_PUBLIC_KEY}

@router.post("/push/subscribe")
async def subscribe_push_notifications(
    subscription_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Subscribe user to push notifications"""
    user = await get_current_user(authorization, request)
    
    push_subscription = {
        "user_id": user["user_id"],
        "endpoint": subscription_data.get("endpoint"),
        "keys": subscription_data.get("keys"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Upsert to avoid duplicates
    await db.push_subscriptions.update_one(
        {"user_id": user["user_id"], "endpoint": subscription_data.get("endpoint")},
        {"$set": push_subscription},
        upsert=True
    )
    
    return {"message": "Push subscription saved"}

@router.delete("/push/unsubscribe")
async def unsubscribe_push_notifications(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Unsubscribe user from push notifications"""
    user = await get_current_user(authorization, request)
    
    await db.push_subscriptions.delete_many({"user_id": user["user_id"]})
    
    return {"message": "Push subscription removed"}

@router.get("/push/preferences")
async def get_push_preferences(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Get user's notification preferences"""
    user = await get_current_user(authorization, request)
    
    preferences = await db.notification_preferences.find_one(
        {"user_id": user["user_id"]},
        {"_id": 0}
    )
    
    if not preferences:
        # Default preferences
        preferences = {
            "user_id": user["user_id"],
            "new_booking": True,
            "booking_confirmed": True,
            "booking_cancelled": True,
            "new_message": True,
            "provider_verified": True,
            "system_updates": True,
            "marketing": False
        }
    
    return preferences

@router.put("/push/preferences")
async def update_push_preferences(
    preferences_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Update user's notification preferences"""
    user = await get_current_user(authorization, request)
    
    allowed_fields = ["new_booking", "booking_confirmed", "booking_cancelled", 
                     "new_message", "provider_verified", "system_updates", "marketing"]
    update_data = {k: v for k, v in preferences_data.items() if k in allowed_fields}
    update_data["user_id"] = user["user_id"]
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.notification_preferences.update_one(
        {"user_id": user["user_id"]},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "Preferences updated"}

@router.post("/admin/push/send")
async def admin_send_push_notification(
    notification_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Send push notification to users"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    title = notification_data.get("title", "")
    body = notification_data.get("body", "")
    target = notification_data.get("target", "all")  # all, providers, users, specific
    user_ids = notification_data.get("user_ids", [])
    icon = notification_data.get("icon", "/logo192.png")
    
    # Build query for target users
    query = {}
    if target == "providers":
        query["role"] = "provider"
    elif target == "users":
        query["role"] = {"$in": ["patient", "user"]}
    elif target == "specific":
        query["user_id"] = {"$in": user_ids}
    
    # Get users matching criteria
    users = await db.users.find(query, {"user_id": 1}).to_list(10000)
    user_ids_to_notify = [u["user_id"] for u in users]
    
    # Get push subscriptions for these users
    subscriptions = await db.push_subscriptions.find(
        {"user_id": {"$in": user_ids_to_notify}},
        {"_id": 0}
    ).to_list(10000)
    
    # Send actual push notifications
    success_count = 0
    failed_count = 0
    
    for sub in subscriptions:
        subscription_info = {
            "endpoint": sub.get("endpoint"),
            "keys": sub.get("keys")
        }
        try:
            if await send_push_notification(
                subscription_info, 
                title, 
                body, 
                {"from_admin": True, "target": target},
                icon
            ):
                success_count += 1
            else:
                failed_count += 1
        except Exception as e:
            logger.error(f"Error sending push to subscription: {e}")
            failed_count += 1
    
    # Create notification record
    notification_record = {
        "notification_id": f"push_{uuid.uuid4().hex[:12]}",
        "title": title,
        "body": body,
        "target": target,
        "recipients_count": len(subscriptions),
        "success_count": success_count,
        "failed_count": failed_count,
        "sent_by": admin["user_id"],
        "sent_at": datetime.now(timezone.utc).isoformat()
    }
    await db.push_notifications_sent.insert_one(notification_record)
    
    # Also create in-app notifications for these users
    for user_id in user_ids_to_notify:
        await create_notification(
            user_id,
            "system_announcement",
            title,
            body,
            {"from_admin": True, "push_notification": True}
        )
    
    return {
        "message": f"Notification sent: {success_count} success, {failed_count} failed",
        "notification_id": notification_record["notification_id"],
        "success_count": success_count,
        "failed_count": failed_count,
        "total_subscriptions": len(subscriptions)
    }

@router.get("/admin/push/history")
async def admin_get_push_history(
    authorization: Optional[str] = Header(None),
    request: Request = None,
    skip: int = 0,
    limit: int = 50
):
    """Admin: Get push notification history"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    history = await db.push_notifications_sent.find(
        {},
        {"_id": 0}
    ).sort("sent_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.push_notifications_sent.count_documents({})
    
    return {"history": history, "total": total}

# ==================== FILE UPLOAD ====================

