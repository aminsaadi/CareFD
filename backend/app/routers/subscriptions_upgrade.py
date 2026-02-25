from fastapi import APIRouter, HTTPException, Header, Request
from typing import Optional
from datetime import datetime, timezone, timedelta
import uuid

from app.database import db
from app.models import Subscription, Payment
from app.utils import get_current_user, send_email_async, create_notification

router = APIRouter()

@router.post("/subscriptions/upgrade")
async def upgrade_subscription(
    body: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Upgrade subscription (infrastructure only, no payment)"""
    user = await get_current_user(authorization, request)
    plan_id = body.get("plan_id")
    billing_cycle = body.get("billing_cycle", "monthly")
    use_trial = body.get("use_trial", False)
    
    plan = await db.subscription_plans.find_one({"plan_id": plan_id, "is_active": True}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    
    # Check if user already used trial
    if use_trial:
        existing_trial = await db.subscriptions.find_one({
            "user_id": user["user_id"],
            "is_trial": True
        })
        if existing_trial:
            raise HTTPException(status_code=400, detail="כבר ניצלת את תקופת הניסיון. שדרג למנוי בתשלום.")
    
    # Cancel existing active subscription
    await db.subscriptions.update_many(
        {"user_id": user["user_id"], "status": "active"},
        {"$set": {"status": "cancelled", "cancelled_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Create new subscription
    now = datetime.now(timezone.utc)
    trial_end = (now + timedelta(days=30)).isoformat() if use_trial else None
    
    sub = {
        "subscription_id": f"sub_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "provider_id": provider["provider_id"] if provider else None,
        "plan_id": plan_id,
        "tier": plan["tier"],
        "status": "active",
        "billing_cycle": billing_cycle,
        "is_trial": use_trial,
        "trial_end_date": trial_end,
        "start_date": now.isoformat(),
        "created_at": now.isoformat()
    }
    
    await db.subscriptions.insert_one(sub)
    if "_id" in sub:
        del sub["_id"]
    
    # Update provider tier
    if provider:
        update_fields = {"subscription_tier": plan["tier"]}
        if plan.get("has_recommended_badge"):
            update_fields["is_recommended"] = True
        await db.providers.update_one(
            {"provider_id": provider["provider_id"]},
            {"$set": update_fields}
        )
    
    msg = "תקופת הניסיון החלה! 30 יום חינם" if use_trial else "המנוי שודרג בהצלחה"
    return {"message": msg, "subscription": sub, "plan": plan}

# ==================== PUSH NOTIFICATIONS ====================

