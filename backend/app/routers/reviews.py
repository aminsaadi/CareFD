from fastapi import APIRouter, HTTPException, Header, Request
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid

from app.database import db
from app.models import Review, ReviewCreate, BookingStatus, NotificationType
from app.utils import get_current_user, send_email_async, create_notification, send_push_to_user

router = APIRouter()

@router.post("/reviews")
async def create_review(
    review_data: ReviewCreate,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Create a review - only allowed after booking is completed"""
    user = await get_current_user(authorization, request)
    
    # Check if booking_id is provided and if the booking is completed
    if review_data.booking_id:
        booking = await db.bookings.find_one({"booking_id": review_data.booking_id}, {"_id": 0})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Check if user is the booking owner
        if booking.get("user_id") != user["user_id"]:
            raise HTTPException(status_code=403, detail="You can only review your own bookings")
        
        # Check if booking is completed
        if booking.get("status") != BookingStatus.COMPLETED:
            raise HTTPException(status_code=400, detail="ניתן לכתוב חוות דעת רק לאחר השלמת ההזמנה")
        
        # Check if already reviewed
        existing_review = await db.reviews.find_one({
            "booking_id": review_data.booking_id,
            "user_id": user["user_id"]
        })
        if existing_review:
            raise HTTPException(status_code=400, detail="כבר כתבת חוות דעת להזמנה זו")
    
    review = Review(
        user_id=user["user_id"],
        status="pending",  # Requires admin approval
        **review_data.model_dump()
    )
    
    review_dict = review.model_dump()
    review_dict['created_at'] = review_dict['created_at'].isoformat()
    
    await db.reviews.insert_one(review_dict)
    
    # Mark booking as reviewed
    if review_data.booking_id:
        await db.bookings.update_one(
            {"booking_id": review_data.booking_id},
            {"$set": {"has_review": True, "review_id": review.review_id}}
        )
    
    # Notify admins about new review pending approval
    admins = await db.users.find({"role": "admin"}, {"_id": 0, "user_id": 1}).to_list(100)
    for admin in admins:
        await create_notification(
            admin["user_id"],
            NotificationType.SYSTEM,
            "חוות דעת חדשה ממתינה לאישור",
            f"משתמש {user.get('name', 'לקוח')} כתב חוות דעת חדשה",
            {"review_id": review.review_id, "provider_id": review_data.provider_id}
        )
        await send_push_to_user(
            admin["user_id"],
            "חוות דעת חדשה ממתינה לאישור",
            f"משתמש {user.get('name', 'לקוח')} כתב חוות דעת חדשה",
            {"review_id": review.review_id, "type": "new_review"}
        )
    
    # Notify provider about new review
    provider = await db.providers.find_one({"provider_id": review_data.provider_id}, {"_id": 0})
    if provider:
        await create_notification(
            provider["user_id"],
            NotificationType.SYSTEM,
            "חוות דעת חדשה!",
            f"לקוח כתב חוות דעת חדשה על השירות שלך. ממתינה לאישור מנהל.",
            {"review_id": review.review_id, "provider_id": review_data.provider_id}
        )
        await send_push_to_user(
            provider["user_id"],
            "חוות דעת חדשה!",
            f"לקוח כתב חוות דעת חדשה על השירות שלך",
            {"review_id": review.review_id, "type": "new_review_for_provider"}
        )
    
    return {
        "message": "חוות הדעת נשלחה בהצלחה וממתינה לאישור מנהל",
        "review": review.model_dump()
    }

@router.get("/providers/{provider_id}/reviews")
async def get_provider_reviews(provider_id: str, skip: int = 0, limit: int = 20):
    """Get provider reviews - only approved reviews"""
    reviews = await db.reviews.find({
        "provider_id": provider_id,
        "status": "approved"  # Only show approved reviews
    }, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enhance with user info
    for review in reviews:
        user = await db.users.find_one({"user_id": review["user_id"]}, {"_id": 0, "password_hash": 0})
        if user:
            review["user"] = {
                "name": user.get("name"),
                "picture": user.get("picture")
            }
    
    return {"reviews": reviews}

@router.get("/reviews/my")
async def get_my_reviews(
    authorization: Optional[str] = Header(None),
    request: Request = None,
    skip: int = 0,
    limit: int = 50
):
    """Get current user's reviews"""
    user = await get_current_user(authorization, request)
    
    reviews = await db.reviews.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    
    # Enhance with provider info
    for review in reviews:
        provider = await db.providers.find_one(
            {"provider_id": review["provider_id"]},
            {"_id": 0, "business_name": 1, "profile_image": 1, "profession_title": 1}
        )
        if provider:
            review["provider"] = provider
    
    return {"reviews": reviews}

# ==================== ADMIN REVIEW MANAGEMENT ====================

@router.get("/admin/reviews")
async def admin_get_reviews(
    status: Optional[str] = None,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Get all reviews with optional status filter"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if status:
        query["status"] = status
    
    reviews = await db.reviews.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Enhance with user and provider info
    for review in reviews:
        user_info = await db.users.find_one({"user_id": review["user_id"]}, {"_id": 0, "name": 1, "email": 1})
        provider_info = await db.providers.find_one({"provider_id": review["provider_id"]}, {"_id": 0, "business_name": 1})
        review["user_info"] = user_info
        review["provider_info"] = provider_info
    
    return {"reviews": reviews}

@router.put("/admin/reviews/{review_id}/approve")
async def admin_approve_review(
    review_id: str,
    body: dict = None,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Approve a review"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    review = await db.reviews.find_one({"review_id": review_id}, {"_id": 0})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    await db.reviews.update_one(
        {"review_id": review_id},
        {"$set": {
            "status": "approved",
            "approved_at": datetime.now(timezone.utc).isoformat(),
            "approved_by": admin["user_id"],
            "admin_notes": body.get("notes", "") if body else ""
        }}
    )
    
    # Update provider rating with only approved reviews
    approved_reviews = await db.reviews.find({
        "provider_id": review["provider_id"],
        "status": "approved"
    }, {"_id": 0, "rating": 1}).to_list(1000)
    
    if approved_reviews:
        avg_rating = sum(r["rating"] for r in approved_reviews) / len(approved_reviews)
        await db.providers.update_one(
            {"provider_id": review["provider_id"]},
            {"$set": {
                "rating": round(avg_rating, 1),
                "total_reviews": len(approved_reviews)
            }}
        )
    
    # Notify user that review was approved
    await create_notification(
        review["user_id"],
        NotificationType.SYSTEM,
        "חוות הדעת שלך אושרה",
        "תודה! חוות הדעת שלך אושרה ומוצגת כעת באתר.",
        {"review_id": review_id, "provider_id": review["provider_id"]}
    )
    await send_push_to_user(
        review["user_id"],
        "חוות הדעת שלך אושרה",
        "תודה! חוות הדעת שלך אושרה ומוצגת כעת באתר.",
        {"review_id": review_id, "type": "review_approved"}
    )
    
    # Notify provider about the approved review
    provider = await db.providers.find_one({"provider_id": review["provider_id"]}, {"_id": 0})
    if provider:
        await send_push_to_user(
            provider["user_id"],
            "חוות דעת חדשה פורסמה!",
            f"חוות דעת חדשה פורסמה בפרופיל שלך - דירוג: {review.get('rating', 'N/A')}",
            {"review_id": review_id, "type": "review_published"}
        )
    
    return {"message": "Review approved successfully"}

@router.put("/admin/reviews/{review_id}/reject")
async def admin_reject_review(
    review_id: str,
    body: dict = None,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Reject a review"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    reason = body.get("reason", "חוות הדעת לא עומדת בקריטריונים") if body else "חוות הדעת לא עומדת בקריטריונים"
    
    review = await db.reviews.find_one({"review_id": review_id}, {"_id": 0})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    await db.reviews.update_one(
        {"review_id": review_id},
        {"$set": {
            "status": "rejected",
            "rejected_at": datetime.now(timezone.utc).isoformat(),
            "rejected_by": admin["user_id"],
            "rejection_reason": reason
        }}
    )
    
    # Notify user
    await create_notification(
        review["user_id"],
        NotificationType.SYSTEM,
        "חוות הדעת נדחתה",
        f"חוות הדעת שלך נדחתה. סיבה: {reason}",
        {"review_id": review_id}
    )
    
    return {"message": "Review rejected successfully"}
