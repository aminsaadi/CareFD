from fastapi import APIRouter, HTTPException, Header, Request
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid

from app.database import db
from app.models import Subscription, Payment, SubscriptionPlan
from app.utils import get_current_user, send_email_async, create_notification

router = APIRouter()

# Default subscription plans
DEFAULT_PLANS = [
    {
        "plan_id": "plan_free",
        "name": "Free",
        "name_he": "חינם",
        "tier": "free",
        "price_monthly": 0,
        "price_yearly": 0,
        "currency": "ILS",
        "features": {
            "profile_management": True,
            "chat_contact": True,
            "phone_contact": True,
            "whatsapp_contact": True,
            "clinic_management": False,
            "product_shipping": True,
            "promoted_profile": False,
            "recommended_badge": False,
            "team_management": False,
            "priority_support": False,
            "staff_support": False
        },
        "features_list": [
            "ניהול פרופיל מתקדם",
            "כפתור יצירת קשר בצ'אט",
            "כפתור יצירת קשר בטלפון",
            "כפתור יצירת קשר בוואצאפ",
            "שירות אחד בלבד",
            "עד 10 הזמנות בחודש"
        ],
        "max_services": 1,
        "max_bookings_per_month": 10,
        "max_clinics": 0,
        "max_team_members": 0,
        "has_promoted_profile": False,
        "has_recommended_badge": False,
        "has_team_management": False,
        "has_chat_contact": True,
        "has_phone_contact": True,
        "has_whatsapp_contact": True,
        "has_clinic_management": False,
        "has_product_shipping": True,
        "has_priority_support": False,
        "has_staff_support": False,
        "analytics_access": False,
        "is_active": True,
        "sort_order": 0
    },
    {
        "plan_id": "plan_pro",
        "name": "Pro",
        "name_he": "פרו",
        "tier": "pro",
        "price_monthly": 59,
        "price_yearly": 600,
        "currency": "ILS",
        "features": {
            "profile_management": True,
            "chat_contact": True,
            "phone_contact": True,
            "whatsapp_contact": True,
            "clinic_management": True,
            "product_shipping": True,
            "promoted_profile": True,
            "recommended_badge": True,
            "team_management": False,
            "priority_support": True,
            "staff_support": False
        },
        "features_list": [
            "ניהול פרופיל מתקדם",
            "כפתור יצירת קשר בצ'אט",
            "כפתור יצירת קשר בטלפון",
            "כפתור יצירת קשר בוואצאפ",
            "ניהול קליניקות / סניפים",
            "שירותים ללא הגבלה",
            "הזמנות ללא הגבלה",
            "ניהול שירות שליחת מוצר",
            "תווית פרופיל מומלץ",
            "פרופיל מקודם",
            "תמיכה ולווי צוות האתר"
        ],
        "max_services": -1,
        "max_bookings_per_month": -1,
        "max_clinics": 5,
        "max_team_members": 0,
        "has_promoted_profile": True,
        "has_recommended_badge": True,
        "has_team_management": False,
        "has_chat_contact": True,
        "has_phone_contact": True,
        "has_whatsapp_contact": True,
        "has_clinic_management": True,
        "has_product_shipping": True,
        "has_priority_support": True,
        "has_staff_support": False,
        "analytics_access": True,
        "is_active": True,
        "sort_order": 1
    },
    {
        "plan_id": "plan_gold",
        "name": "Gold",
        "name_he": "זהב",
        "tier": "gold",
        "price_monthly": 149,
        "price_yearly": 1500,
        "currency": "ILS",
        "features": {
            "profile_management": True,
            "chat_contact": True,
            "phone_contact": True,
            "whatsapp_contact": True,
            "clinic_management": True,
            "product_shipping": True,
            "promoted_profile": True,
            "recommended_badge": True,
            "team_management": True,
            "priority_support": True,
            "staff_support": True
        },
        "features_list": [
            "ניהול פרופיל מתקדם",
            "כפתור יצירת קשר בצ'אט",
            "כפתור יצירת קשר בטלפון",
            "כפתור יצירת קשר בוואצאפ",
            "ניהול קליניקות / סניפים",
            "שירותים ללא הגבלה",
            "הזמנות ללא הגבלה",
            "ניהול שירות שליחת מוצר",
            "תווית פרופיל מומלץ",
            "פרופיל מקודם",
            "ניהול צוות",
            "תמיכה ולווי צוות האתר"
        ],
        "max_services": -1,
        "max_bookings_per_month": -1,
        "max_clinics": -1,
        "max_team_members": -1,
        "has_promoted_profile": True,
        "has_recommended_badge": True,
        "has_team_management": True,
        "has_chat_contact": True,
        "has_phone_contact": True,
        "has_whatsapp_contact": True,
        "has_clinic_management": True,
        "has_product_shipping": True,
        "has_priority_support": True,
        "has_staff_support": True,
        "analytics_access": True,
        "is_active": True,
        "sort_order": 2
    }
]

@router.get("/subscription-plans")
async def get_subscription_plans():
    """Get all available subscription plans"""
    plans = await db.subscription_plans.find({"is_active": True}, {"_id": 0}).to_list(10)
    
    if not plans:
        # Initialize default plans
        for plan in DEFAULT_PLANS:
            plan["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.subscription_plans.update_one(
                {"plan_id": plan["plan_id"]},
                {"$set": plan},
                upsert=True
            )
        plans = DEFAULT_PLANS
    
    return {"plans": plans}

@router.get("/subscriptions/my")
async def get_my_subscription(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Get current user's subscription"""
    user = await get_current_user(authorization, request)
    
    subscription = await db.subscriptions.find_one(
        {"user_id": user["user_id"], "status": {"$in": ["active", "pending"]}},
        {"_id": 0}
    )
    
    if not subscription:
        # Return free tier as default
        return {
            "subscription": {
                "tier": "free",
                "status": "active",
                "plan_id": "plan_free"
            },
            "plan": DEFAULT_PLANS[0]
        }
    
    plan = await db.subscription_plans.find_one({"plan_id": subscription["plan_id"]}, {"_id": 0})
    
    return {"subscription": subscription, "plan": plan}

@router.post("/subscriptions/create")
async def create_subscription(
    subscription_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Create a new subscription (initiate payment)"""
    user = await get_current_user(authorization, request)
    
    plan_id = subscription_data.get("plan_id")
    billing_cycle = subscription_data.get("billing_cycle", "monthly")
    
    # Get plan details
    plan = await db.subscription_plans.find_one({"plan_id": plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Check if user already has active subscription
    existing = await db.subscriptions.find_one(
        {"user_id": user["user_id"], "status": "active"}
    )
    
    if existing and existing.get("tier") != "free":
        raise HTTPException(status_code=400, detail="You already have an active subscription")
    
    # Calculate amount
    amount = plan["price_monthly"] if billing_cycle == "monthly" else plan["price_yearly"]
    
    # For free plan, activate immediately
    if plan["tier"] == "free":
        subscription = Subscription(
            user_id=user["user_id"],
            plan_id=plan_id,
            tier=plan["tier"],
            status="active",
            billing_cycle=billing_cycle
        )
        await db.subscriptions.insert_one(subscription.model_dump())
        return {"subscription": subscription.model_dump(), "requires_payment": False}
    
    # For paid plans, create pending subscription and payment
    subscription = Subscription(
        user_id=user["user_id"],
        plan_id=plan_id,
        tier=plan["tier"],
        status="pending",
        billing_cycle=billing_cycle
    )
    
    payment = Payment(
        user_id=user["user_id"],
        subscription_id=subscription.subscription_id,
        amount=amount,
        description=f"מנוי {plan['name_he']} - {billing_cycle}"
    )
    
    await db.subscriptions.insert_one(subscription.model_dump())
    await db.payments.insert_one(payment.model_dump())
    
    return {
        "subscription": subscription.model_dump(),
        "payment": payment.model_dump(),
        "requires_payment": True,
        "amount": amount,
        "currency": "ILS"
    }

@router.post("/subscriptions/cancel")
async def cancel_subscription(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Cancel current subscription"""
    user = await get_current_user(authorization, request)
    
    subscription = await db.subscriptions.find_one(
        {"user_id": user["user_id"], "status": "active"}
    )
    
    if not subscription or subscription.get("tier") == "free":
        raise HTTPException(status_code=400, detail="No active paid subscription to cancel")
    
    await db.subscriptions.update_one(
        {"subscription_id": subscription["subscription_id"]},
        {"$set": {
            "status": "cancelled",
            "cancelled_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Reset provider tier to free
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if provider:
        await db.providers.update_one(
            {"user_id": user["user_id"]},
            {"$set": {"subscription_tier": "free", "is_recommended": False}}
        )
    
    return {"message": "המנוי בוטל. חזרת למנוי חינם."}

@router.get("/payments/history")
async def get_payment_history(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Get user's payment history"""
    user = await get_current_user(authorization, request)
    
    payments = await db.payments.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return {"payments": payments}

# PayPal Integration (placeholder - requires API keys)
@router.post("/payments/paypal/create-order")
async def create_paypal_order(
    order_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Create PayPal order for subscription payment"""
    user = await get_current_user(authorization, request)
    
    payment_id = order_data.get("payment_id")
    
    payment = await db.payments.find_one({"payment_id": payment_id, "user_id": user["user_id"]})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # TODO: Implement actual PayPal order creation when API keys are available
    # For now, return mock order ID for testing
    mock_order_id = f"PAYPAL_ORDER_{uuid.uuid4().hex[:12]}"
    
    await db.payments.update_one(
        {"payment_id": payment_id},
        {"$set": {"paypal_order_id": mock_order_id}}
    )
    
    return {
        "order_id": mock_order_id,
        "status": "CREATED",
        "message": "PayPal integration pending - API keys required"
    }

@router.post("/payments/paypal/capture-order")
async def capture_paypal_order(
    capture_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Capture PayPal order after approval"""
    user = await get_current_user(authorization, request)
    
    order_id = capture_data.get("order_id")
    
    payment = await db.payments.find_one({"paypal_order_id": order_id, "user_id": user["user_id"]})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # TODO: Implement actual PayPal capture when API keys are available
    # For now, simulate successful capture for testing
    capture_id = f"CAPTURE_{uuid.uuid4().hex[:12]}"
    
    # Update payment status
    await db.payments.update_one(
        {"payment_id": payment["payment_id"]},
        {"$set": {
            "status": "completed",
            "paypal_capture_id": capture_id,
            "completed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Activate subscription
    if payment.get("subscription_id"):
        end_date = datetime.now(timezone.utc) + timedelta(days=30)  # Monthly
        await db.subscriptions.update_one(
            {"subscription_id": payment["subscription_id"]},
            {"$set": {
                "status": "active",
                "start_date": datetime.now(timezone.utc).isoformat(),
                "end_date": end_date.isoformat(),
                "next_billing_date": end_date.isoformat()
            }}
        )
    
    return {
        "status": "COMPLETED",
        "capture_id": capture_id,
        "message": "Payment completed successfully (test mode)"
    }

# ==================== ADMIN SUBSCRIPTIONS ====================

@router.get("/admin/subscriptions")
async def admin_get_subscriptions(
    authorization: Optional[str] = Header(None),
    request: Request = None,
    status: Optional[str] = None,
    tier: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """Admin: Get all subscriptions"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if status:
        query["status"] = status
    if tier:
        query["tier"] = tier
    
    subscriptions = await db.subscriptions.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.subscriptions.count_documents(query)
    
    # Enrich with user info
    for sub in subscriptions:
        user = await db.users.find_one({"user_id": sub["user_id"]}, {"_id": 0, "name": 1, "email": 1, "user_number": 1})
        sub["user_name"] = user.get("name") if user else "Unknown"
        sub["user_email"] = user.get("email") if user else ""
        sub["user_number"] = user.get("user_number") if user else ""
    
    # Get stats
    total_active = await db.subscriptions.count_documents({"status": "active"})
    total_pro = await db.subscriptions.count_documents({"tier": "pro", "status": "active"})
    total_gold = await db.subscriptions.count_documents({"tier": "gold", "status": "active"})
    
    return {
        "subscriptions": subscriptions,
        "total": total,
        "stats": {
            "total_active": total_active,
            "total_pro": total_pro,
            "total_gold": total_gold
        }
    }

@router.get("/admin/payments")
async def admin_get_payments(
    authorization: Optional[str] = Header(None),
    request: Request = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """Admin: Get all payments"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if status:
        query["status"] = status
    
    payments = await db.payments.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.payments.count_documents(query)
    
    # Enrich with user info
    for payment in payments:
        user = await db.users.find_one({"user_id": payment["user_id"]}, {"_id": 0, "name": 1, "email": 1})
        payment["user_name"] = user.get("name") if user else "Unknown"
        payment["user_email"] = user.get("email") if user else ""
    
    # Calculate totals
    completed_payments = await db.payments.find({"status": "completed"}, {"amount": 1}).to_list(10000)
    total_revenue = sum(p.get("amount", 0) for p in completed_payments)
    
    return {
        "payments": payments,
        "total": total,
        "total_revenue": total_revenue
    }

@router.put("/admin/subscriptions/{subscription_id}")
async def admin_update_subscription(
    subscription_id: str,
    subscription_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update subscription"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    allowed_fields = ["status", "tier", "end_date"]
    update_data = {k: v for k, v in subscription_data.items() if k in allowed_fields}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    result = await db.subscriptions.update_one(
        {"subscription_id": subscription_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    return {"message": "Subscription updated"}

@router.put("/admin/subscription-plans/{plan_id}")
async def admin_update_plan(
    plan_id: str,
    plan_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update subscription plan"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    allowed_fields = [
        "name_he", "price_monthly", "price_yearly", "features", "features_list",
        "max_services", "max_bookings_per_month", "max_clinics", "max_team_members",
        "has_promoted_profile", "has_recommended_badge", "has_team_management",
        "has_chat_contact", "has_phone_contact", "has_whatsapp_contact",
        "has_clinic_management", "has_product_shipping", "has_priority_support",
        "has_staff_support", "analytics_access", "is_active", "sort_order"
    ]
    update_data = {k: v for k, v in plan_data.items() if k in allowed_fields}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    result = await db.subscription_plans.update_one(
        {"plan_id": plan_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    return {"message": "Plan updated"}

# ==================== CLINICS MANAGEMENT ====================

