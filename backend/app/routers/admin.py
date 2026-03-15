from fastapi import APIRouter, HTTPException, Header, Request
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid
import re

from app.database import db
from app.models import (
    UserRole, NotificationType, VerificationStatus, BookingStatus,
    SubscriptionTier, SubscriptionPlan
)
from app.utils import (
    get_current_user, send_email_async, create_notification,
    send_push_to_user, hash_password,
    SMTP_USER, SMTP_PASSWORD, SENDER_EMAIL as _SENDER_EMAIL,
    SMTP_HOST, SMTP_PORT, _get_smtp_settings
)

router = APIRouter()


@router.get("/admin/smtp-settings")
async def get_smtp_settings(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Get current SMTP settings"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    db_settings = await db.smtp_settings.find_one({"_id": "smtp_config"}, {"_id": 0})
    
    return {
        "source": "database" if db_settings else "environment",
        "sender_email": db_settings.get("sender_email", _SENDER_EMAIL) if db_settings else _SENDER_EMAIL,
        "smtp_host": db_settings.get("smtp_host", SMTP_HOST) if db_settings else SMTP_HOST,
        "smtp_port": db_settings.get("smtp_port", SMTP_PORT) if db_settings else SMTP_PORT,
        "smtp_user": db_settings.get("smtp_user", SMTP_USER) if db_settings else SMTP_USER,
        "smtp_password_set": bool(db_settings.get("smtp_password") if db_settings else SMTP_PASSWORD),
    }


@router.put("/admin/smtp-settings")
async def update_smtp_settings(
    data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update SMTP settings in database"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    settings = {
        "_id": "smtp_config",
        "sender_email": data.get("sender_email", ""),
        "smtp_host": data.get("smtp_host", "smtp.gmail.com"),
        "smtp_port": int(data.get("smtp_port", 587)),
        "smtp_user": data.get("smtp_user", ""),
        "smtp_password": data.get("smtp_password", ""),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": user.get("user_id")
    }
    
    await db.smtp_settings.replace_one({"_id": "smtp_config"}, settings, upsert=True)
    
    # Clear cache so new settings take effect immediately
    from app.utils import _smtp_cache
    _smtp_cache["settings"] = None
    _smtp_cache["fetched_at"] = None
    
    return {"message": "SMTP settings updated successfully"}


@router.get("/admin/smtp-check")
async def check_smtp_status(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Check SMTP configuration and test connection"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    import smtplib
    smtp_cfg = await _get_smtp_settings()
    smtp_login_ok = False
    smtp_error = None
    
    if smtp_cfg["smtp_user"] and smtp_cfg["smtp_password"]:
        try:
            with smtplib.SMTP(smtp_cfg["smtp_host"], smtp_cfg["smtp_port"], timeout=10) as server:
                server.starttls()
                server.login(smtp_cfg["smtp_user"], smtp_cfg["smtp_password"])
                smtp_login_ok = True
        except Exception as e:
            smtp_error = str(e)
    
    return {
        "sender_email": smtp_cfg["sender_email"],
        "smtp_host": smtp_cfg["smtp_host"],
        "smtp_port": smtp_cfg["smtp_port"],
        "smtp_user_set": bool(smtp_cfg["smtp_user"]),
        "smtp_password_set": bool(smtp_cfg["smtp_password"]),
        "smtp_login_ok": smtp_login_ok,
        "smtp_error": smtp_error
    }


@router.post("/admin/test-email")
async def admin_test_email(
    data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Send a test email to verify SMTP configuration"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    recipient = data.get("email", user.get("email"))
    if not recipient:
        raise HTTPException(status_code=400, detail="Email address required")
    
    smtp_cfg = await _get_smtp_settings()

    if not smtp_cfg["smtp_user"] or not smtp_cfg["smtp_password"]:
        raise HTTPException(
            status_code=400,
            detail="SMTP לא מוגדר. הגדר SMTP_USER ו-SMTP_PASSWORD בהגדרות או ב-env vars."
        )

    result = await send_email_async(
        recipient,
        "CareLink - בדיקת שליחת מייל",
        """
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #19B8BA;">בדיקת שליחת מייל</h2>
            <p>מייל זה נשלח כבדיקה מהמערכת.</p>
            <p>אם קיבלת את המייל הזה, שליחת המיילים עובדת כראוי.</p>
            <p>בברכה,<br>צוות CareLink</p>
        </div>
        """
    )

    if not result:
        raise HTTPException(
            status_code=500,
            detail="שליחת המייל נכשלה. בדוק את הלוגים לפרטים נוספים. אם משתמש ב-Gmail, ודא שאתה משתמש ב-App Password."
        )

    return {
        "success": True,
        "recipient": recipient,
        "smtp_status": {
            "source": "database" if (await db.smtp_settings.find_one({"_id": "smtp_config"})) else "environment",
            "smtp_host": smtp_cfg["smtp_host"],
            "smtp_port": smtp_cfg["smtp_port"],
            "sender_email": smtp_cfg["sender_email"]
        }
    }


@router.get("/admin/users")
async def admin_get_users(
    authorization: Optional[str] = Header(None),
    request: Request = None,
    role: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """Admin: Get all users"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if role:
        query["role"] = role
    if search:
        safe_search = re.escape(search)
        query["$or"] = [
            {"name": {"$regex": safe_search, "$options": "i"}},
            {"email": {"$regex": safe_search, "$options": "i"}}
        ]
    
    users = await db.users.find(
        query,
        {"_id": 0, "password_hash": 0}
    ).skip(skip).limit(limit).to_list(limit)
    
    total = await db.users.count_documents(query)
    
    return {"users": users, "total": total, "skip": skip, "limit": limit}

@router.put("/admin/users/{user_id}/role")
async def admin_update_user_role(
    user_id: str,
    role_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update user role"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    new_role = role_data.get("role")
    if new_role not in ["patient", "provider", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"role": new_role}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": f"User role updated to {new_role}"}

@router.delete("/admin/users/{user_id}")
async def admin_delete_user(
    user_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Delete user"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Don't allow deleting self
    if admin["user_id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    result = await db.users.delete_one({"user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted"}

@router.get("/admin/users/{user_id}")
async def admin_get_user_details(
    user_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Get detailed user information including provider data if applicable"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get provider data if user is a provider
    provider_data = None
    if user.get("role") == "provider":
        provider_data = await db.providers.find_one({"user_id": user_id}, {"_id": 0})
    
    # Get user's bookings count
    bookings_count = await db.bookings.count_documents({"user_id": user_id})
    
    # Get user's messages count
    messages_count = await db.messages.count_documents({"sender_id": user_id})
    
    return {
        "user": user,
        "provider": provider_data,
        "stats": {
            "bookings_count": bookings_count,
            "messages_count": messages_count
        }
    }

@router.put("/admin/users/{user_id}")
async def admin_update_user(
    user_id: str,
    user_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update user details"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Fields that can be updated
    allowed_fields = ["name", "email", "phone", "role", "is_verified"]
    update_data = {k: v for k, v in user_data.items() if k in allowed_fields}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User updated successfully"}

@router.put("/admin/users/{user_id}/password")
async def admin_reset_user_password(
    user_id: str,
    password_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Reset user password"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    new_password = password_data.get("new_password")
    if not new_password or len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Hash the new password
    password_hash = hash_password(new_password)
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": {
            "password_hash": password_hash,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Password updated successfully"}

@router.put("/admin/users/{user_id}/suspend")
async def admin_suspend_user(
    user_id: str,
    suspend_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Suspend or unsuspend a user"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Don't allow suspending self
    if admin["user_id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot suspend yourself")
    
    is_suspended = suspend_data.get("is_suspended", True)
    reason = suspend_data.get("reason", "")
    
    update_data = {
        "is_suspended": is_suspended,
        "suspension_reason": reason if is_suspended else None,
        "suspended_at": datetime.now(timezone.utc).isoformat() if is_suspended else None
    }
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # When suspending a user, also deactivate their provider profile
    if is_suspended:
        provider = await db.providers.find_one({"user_id": user_id}, {"_id": 0})
        if provider:
            await db.providers.update_one(
                {"user_id": user_id},
                {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
    
    # Send notification to user
    action = "הושעה" if is_suspended else "שוחרר מהשעיה"
    await create_notification(
        user_id,
        "account_status",
        f"החשבון שלך {action}",
        reason if is_suspended else "החשבון שלך חזר לפעילות מלאה.",
        {"suspended": is_suspended}
    )
    
    return {"message": f"User {'suspended' if is_suspended else 'unsuspended'} successfully"}

@router.post("/admin/users/{user_id}/message")
async def admin_send_message_to_user(
    user_id: str,
    message_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Send a private message to a user"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    subject = message_data.get("subject", "הודעה ממנהל המערכת")
    content = message_data.get("content", "")
    
    if not content:
        raise HTTPException(status_code=400, detail="Message content is required")
    
    # Create notification
    await create_notification(
        user_id,
        "admin_message",
        subject,
        content,
        {"from_admin": True, "admin_id": admin["user_id"]}
    )
    
    # Store in admin messages collection
    admin_message = {
        "message_id": f"admin_msg_{uuid.uuid4().hex[:12]}",
        "from_admin_id": admin["user_id"],
        "to_user_id": user_id,
        "subject": subject,
        "content": content,
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "is_read": False
    }
    await db.admin_messages.insert_one(admin_message)
    
    return {"message": "Message sent successfully"}

@router.get("/admin/users/{user_id}/verification-documents")
async def admin_get_user_verification_documents(
    user_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Get user's verification documents"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if user is a provider
    provider = await db.providers.find_one({"user_id": user_id}, {"_id": 0})
    if not provider:
        return {"documents": [], "verification_status": "not_provider"}
    
    return {
        "documents": provider.get("verification_documents", []),
        "verification_status": provider.get("verification_status", "pending"),
        "verification_notes": provider.get("verification_notes")
    }

@router.put("/admin/verification-documents/{document_id}/status")
async def admin_update_document_status(
    document_id: str,
    status_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Approve or reject a verification document"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    new_status = status_data.get("status")  # approved, rejected
    rejection_reason = status_data.get("rejection_reason", "")
    
    if new_status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.providers.update_one(
        {"verification_documents.document_id": document_id},
        {"$set": {
            "verification_documents.$.status": new_status,
            "verification_documents.$.rejection_reason": rejection_reason if new_status == "rejected" else None
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"message": f"Document {new_status}"}

# ==================== ADMIN SERVICES ====================

@router.get("/admin/services")
async def admin_get_services(
    authorization: Optional[str] = Header(None),
    request: Request = None,
    provider_id: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """Admin: Get all services"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if provider_id:
        query["provider_id"] = provider_id
    if category:
        query["category"] = category
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    services = await db.services.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.services.count_documents(query)
    
    # Enrich with provider info
    for service in services:
        provider = await db.providers.find_one(
            {"provider_id": service.get("provider_id")},
            {"_id": 0, "business_name": 1, "provider_number": 1}
        )
        if provider:
            service["provider_name"] = provider.get("business_name", "לא ידוע")
            service["provider_number"] = provider.get("provider_number", "")
    
    return {"services": services, "total": total}

@router.put("/admin/services/{service_id}")
async def admin_update_service(
    service_id: str,
    service_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update a service"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Fields that can be updated
    allowed_fields = ["name", "description", "price", "duration", "is_active", "category"]
    update_data = {k: v for k, v in service_data.items() if k in allowed_fields}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.services.update_one(
        {"service_id": service_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return {"message": "Service updated successfully"}

@router.delete("/admin/services/{service_id}")
async def admin_delete_service(
    service_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Delete a service"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.services.delete_one({"service_id": service_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return {"message": "Service deleted"}

@router.get("/admin/bookings")
async def admin_get_bookings(
    authorization: Optional[str] = Header(None),
    request: Request = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """Admin: Get all bookings"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if status:
        query["status"] = status
    
    bookings = await db.bookings.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.bookings.count_documents(query)
    
    return {"bookings": bookings, "total": total, "skip": skip, "limit": limit}

@router.get("/admin/providers")
async def admin_get_all_providers(
    search: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Get ALL providers (including unverified)"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    
    if search:
        query["$or"] = [
            {"business_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}}
        ]
    
    if status:
        if status == "verified":
            query["is_verified"] = True
        elif status == "pending":
            query["verification_status"] = "pending"
        elif status == "rejected":
            query["verification_status"] = "rejected"
    
    total = await db.providers.count_documents(query)
    providers = await db.providers.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Also get users with role=provider that don't have a provider record
    provider_user_ids = [p.get("user_id") for p in providers if p.get("user_id")]
    orphan_provider_users = await db.users.find(
        {"role": "provider", "user_id": {"$nin": provider_user_ids}},
        {"_id": 0, "password_hash": 0}
    ).to_list(100)
    
    # Convert orphan users to provider-like format
    for user in orphan_provider_users:
        providers.append({
            "provider_id": None,
            "user_id": user.get("user_id"),
            "business_name": user.get("name", "ספק ללא פרופיל"),
            "email": user.get("email"),
            "phone": user.get("phone", ""),
            "is_verified": False,
            "verification_status": "incomplete",
            "provider_number": user.get("user_number"),
            "needs_profile": True
        })
        total += 1
    
    return {
        "providers": providers,
        "total": total,
        "page": skip // limit + 1,
        "limit": limit
    }


@router.get("/admin/providers/pending")
async def admin_get_pending_providers(
    authorization: Optional[str] = Header(None),
    request: Request = None,
    skip: int = 0,
    limit: int = 50
):
    """Admin: Get providers pending verification"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {
        "$or": [
            {"verification_status": VerificationStatus.PENDING},
            {"verification_status": VerificationStatus.DOCUMENTS_SUBMITTED},
            {"is_verified": False, "verification_status": {"$exists": False}}
        ]
    }
    
    providers = await db.providers.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.providers.count_documents(query)
    
    # Enrich with user data
    for provider in providers:
        provider_user = await db.users.find_one({"user_id": provider["user_id"]}, {"_id": 0, "password_hash": 0})
        if provider_user:
            provider["user_info"] = provider_user
    
    return {"providers": providers, "total": total, "skip": skip, "limit": limit}


@router.get("/admin/providers/{provider_id}")
async def admin_get_provider_details(
    provider_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Get single provider details"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    provider = await db.providers.find_one({"provider_id": provider_id}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Count services
    services_count = await db.services.count_documents({"provider_id": provider_id})
    provider["services_count"] = services_count
    
    # Count bookings
    bookings_count = await db.bookings.count_documents({"provider_id": provider_id})
    provider["bookings_count"] = bookings_count
    
    # Get user info
    if provider.get("user_id"):
        user_doc = await db.users.find_one({"user_id": provider["user_id"]}, {"_id": 0, "password_hash": 0})
        if user_doc:
            provider["user_email"] = user_doc.get("email")
            provider["user_name"] = user_doc.get("name")
    
    return provider


@router.put("/admin/providers/{provider_id}")
async def admin_update_provider(
    provider_id: str,
    provider_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update provider profile"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Fields that can be updated by admin
    allowed_fields = [
        "business_name", "email", "phone", "address", "city", "bio",
        "experience_years", "years_experience", "specializations", "languages", "is_verified",
        "is_recommended", "provider_type", "license_number", "location", "is_active",
        # Complete profile editing fields
        "profession_title", "gender", "about", "description", "profile_image", "profile_color",
        "expertise", "target_audience", "service_areas", "availability", "website",
        # Profession hierarchy fields
        "profession_id", "profession_name", "specialization_id", "specialization_name",
        "service_categories",
        # New enhanced profile fields
        "health_funds", "payment_methods", "cancellation_policy", "cancellation_notice_hours",
        "show_phone", "show_email", "show_whatsapp", "whatsapp_number",
        "education", "certifications"
    ]
    
    update_data = {}
    for field in allowed_fields:
        if field in provider_data:
            update_data[field] = provider_data[field]
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.providers.update_one(
        {"provider_id": provider_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    return {"message": "Provider updated successfully"}



@router.put("/admin/providers/{provider_id}/verify")
async def admin_verify_provider(
    provider_id: str,
    body: dict = None,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Verify a provider (full approval)"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    notes = body.get("notes") if body else None
    
    result = await db.providers.update_one(
        {"provider_id": provider_id},
        {"$set": {
            "is_verified": True,
            "verification_status": VerificationStatus.VERIFIED,
            "verification_notes": notes
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Notify provider
    provider = await db.providers.find_one({"provider_id": provider_id}, {"_id": 0})
    if provider:
        await create_notification(
            provider["user_id"],
            NotificationType.PROVIDER_VERIFIED,
            "החשבון שלך אומת! 🎉",
            "הפרופיל שלך אומת בהצלחה. כעת הלקוחות יכולים להזמין שירותים ולראות שאתה ספק מאומת.",
            {"provider_id": provider_id}
        )
        
        # Send email
        provider_user = await db.users.find_one({"user_id": provider["user_id"]}, {"_id": 0})
        if provider_user:
            await send_email_async(
                provider_user.get("email"),
                "CareLink - החשבון שלך אומת!",
                f"""
                <h1>ברכות! החשבון שלך אומת 🎉</h1>
                <p>שלום {provider.get('business_name', 'ספק')},</p>
                <p>אנו שמחים לבשר לך שהפרופיל שלך אומת בהצלחה!</p>
                <p>כעת לקוחות יכולים לראות את תג האימות שלך ולהזמין את השירותים שלך.</p>
                <p>בהצלחה!</p>
                <p>צוות CareLink</p>
                """
            )
    
    return {"message": "Provider verified"}


@router.post("/admin/providers/create-from-user/{user_id}")
async def admin_create_provider_from_user(
    user_id: str,
    body: dict = None,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Create a provider profile for an orphaned provider user"""
    admin_user = await get_current_user(authorization, request)
    if admin_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if user exists and has role=provider
    target_user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if target_user.get("role") != "provider":
        raise HTTPException(status_code=400, detail="User is not a provider")
    
    # Check if provider profile already exists
    existing_provider = await db.providers.find_one({"user_id": user_id}, {"_id": 0})
    if existing_provider:
        raise HTTPException(status_code=400, detail="Provider profile already exists")
    
    # Create provider profile
    provider = Provider(
        user_id=user_id,
        provider_type=body.get("provider_type", "individual") if body else "individual",
        business_name=body.get("business_name", target_user.get("name", "ספק")) if body else target_user.get("name", "ספק"),
        email=target_user.get("email"),
        phone=target_user.get("phone"),
        verification_status=VerificationStatus.PENDING,
        is_verified=False
    )
    
    provider_dict = provider.model_dump()
    provider_dict['created_at'] = provider_dict['created_at'].isoformat()
    provider_dict['verification_documents'] = []
    
    await db.providers.insert_one(provider_dict)
    
    return {
        "message": "Provider profile created successfully",
        "provider_id": provider.provider_id,
        "provider_number": provider.provider_number
    }



@router.put("/admin/providers/{provider_id}/reject")
async def admin_reject_provider(
    provider_id: str,
    body: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Reject a provider verification"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    reason = body.get("reason", "הבקשה נדחתה")
    
    result = await db.providers.update_one(
        {"provider_id": provider_id},
        {"$set": {
            "is_verified": False,
            "verification_status": VerificationStatus.REJECTED,
            "verification_notes": reason
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Notify provider
    provider = await db.providers.find_one({"provider_id": provider_id}, {"_id": 0})
    if provider:
        await create_notification(
            provider["user_id"],
            NotificationType.PROVIDER_REJECTED,
            "בקשת האימות נדחתה",
            f"בקשת האימות שלך נדחתה. סיבה: {reason}",
            {"provider_id": provider_id, "reason": reason}
        )
    
    return {"message": "Provider verification rejected"}

@router.put("/admin/providers/{provider_id}/documents/{document_id}/approve")
async def admin_approve_document(
    provider_id: str,
    document_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Approve a specific document"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.providers.update_one(
        {"provider_id": provider_id, "verification_documents.document_id": document_id},
        {"$set": {"verification_documents.$.status": "approved"}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"message": "Document approved"}

@router.put("/admin/providers/{provider_id}/documents/{document_id}/reject")
async def admin_reject_document(
    provider_id: str,
    document_id: str,
    body: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Reject a specific document"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    reason = body.get("reason", "המסמך נדחה")
    
    result = await db.providers.update_one(
        {"provider_id": provider_id, "verification_documents.document_id": document_id},
        {"$set": {
            "verification_documents.$.status": "rejected",
            "verification_documents.$.rejection_reason": reason
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Notify provider
    provider = await db.providers.find_one({"provider_id": provider_id}, {"_id": 0})
    if provider:
        await create_notification(
            provider["user_id"],
            NotificationType.SYSTEM,
            "מסמך נדחה",
            f"אחד המסמכים שהעלית נדחה. סיבה: {reason}",
            {"provider_id": provider_id, "document_id": document_id}
        )
    
    return {"message": "Document rejected"}

# ==================== REGIONS MANAGEMENT ====================

@router.get("/regions")
async def get_regions():
    """Get all regions with cities"""
    regions = await db.regions.find({}, {"_id": 0}).to_list(100)
    
    # Return default regions if none exist - all cities in Israel
    if not regions:
        default_regions = [
            {
                "region_id": "tel_aviv",
                "name": "תל אביב",
                "name_en": "Tel Aviv",
                "cities": [
                    {"name": "תל אביב-יפו", "name_en": "Tel Aviv-Yafo", "lat": 32.0853, "lng": 34.7818},
                    {"name": "רמת גן", "name_en": "Ramat Gan", "lat": 32.0700, "lng": 34.8236},
                    {"name": "גבעתיים", "name_en": "Givatayim", "lat": 32.0714, "lng": 34.8122},
                    {"name": "בני ברק", "name_en": "Bnei Brak", "lat": 32.0833, "lng": 34.8333},
                    {"name": "חולון", "name_en": "Holon", "lat": 32.0158, "lng": 34.7875},
                    {"name": "בת ים", "name_en": "Bat Yam", "lat": 32.0231, "lng": 34.7503},
                    {"name": "הרצליה", "name_en": "Herzliya", "lat": 32.1663, "lng": 34.8463},
                    {"name": "רמת השרון", "name_en": "Ramat HaSharon", "lat": 32.1464, "lng": 34.8397},
                    {"name": "אור יהודה", "name_en": "Or Yehuda", "lat": 32.0300, "lng": 34.8536},
                    {"name": "אזור", "name_en": "Azor", "lat": 32.0240, "lng": 34.7930},
                    {"name": "קריית אונו", "name_en": "Kiryat Ono", "lat": 32.0633, "lng": 34.8556},
                    {"name": "יהוד-מונוסון", "name_en": "Yehud-Monosson", "lat": 32.0333, "lng": 34.8833},
                    {"name": "גני תקווה", "name_en": "Ganei Tikva", "lat": 32.0597, "lng": 34.8714},
                    {"name": "סביון", "name_en": "Savyon", "lat": 32.0470, "lng": 34.8770},
                    {"name": "כפר שמריהו", "name_en": "Kfar Shmaryahu", "lat": 32.1780, "lng": 34.8230}
                ]
            },
            {
                "region_id": "center",
                "name": "מרכז",
                "name_en": "Center",
                "cities": [
                    {"name": "פתח תקווה", "name_en": "Petah Tikva", "lat": 32.0841, "lng": 34.8878},
                    {"name": "ראשון לציון", "name_en": "Rishon LeZion", "lat": 31.9730, "lng": 34.7925},
                    {"name": "רחובות", "name_en": "Rehovot", "lat": 31.8928, "lng": 34.8113},
                    {"name": "נס ציונה", "name_en": "Ness Ziona", "lat": 31.9314, "lng": 34.7989},
                    {"name": "לוד", "name_en": "Lod", "lat": 31.9514, "lng": 34.8953},
                    {"name": "רמלה", "name_en": "Ramla", "lat": 31.9275, "lng": 34.8622},
                    {"name": "יבנה", "name_en": "Yavne", "lat": 31.8767, "lng": 34.7394},
                    {"name": "מודיעין-מכבים-רעות", "name_en": "Modi'in-Maccabim-Re'ut", "lat": 31.8978, "lng": 35.0100},
                    {"name": "ראש העין", "name_en": "Rosh HaAyin", "lat": 32.0956, "lng": 34.9567},
                    {"name": "אלעד", "name_en": "Elad", "lat": 32.0522, "lng": 34.9508},
                    {"name": "שוהם", "name_en": "Shoham", "lat": 31.9961, "lng": 34.9471},
                    {"name": "גבעת שמואל", "name_en": "Givat Shmuel", "lat": 32.0761, "lng": 34.8472},
                    {"name": "גדרה", "name_en": "Gedera", "lat": 31.8147, "lng": 34.7783},
                    {"name": "מזכרת בתיה", "name_en": "Mazkeret Batya", "lat": 31.8500, "lng": 34.8500},
                    {"name": "גן יבנה", "name_en": "Gan Yavne", "lat": 31.7833, "lng": 34.7000},
                    {"name": "קריית עקרון", "name_en": "Kiryat Ekron", "lat": 31.8589, "lng": 34.8247},
                    {"name": "כפר קאסם", "name_en": "Kafr Qasim", "lat": 32.1142, "lng": 34.9778},
                    {"name": "טייבה", "name_en": "Tayibe", "lat": 32.2667, "lng": 35.0000},
                    {"name": "קלנסווה", "name_en": "Qalansawe", "lat": 32.2833, "lng": 34.9833},
                    {"name": "טירה", "name_en": "Tira", "lat": 32.2333, "lng": 34.9500},
                    {"name": "חריש", "name_en": "Harish", "lat": 32.4570, "lng": 35.0440}
                ]
            },
            {
                "region_id": "haifa",
                "name": "חיפה",
                "name_en": "Haifa",
                "cities": [
                    {"name": "חיפה", "name_en": "Haifa", "lat": 32.7940, "lng": 34.9896},
                    {"name": "קריית ביאליק", "name_en": "Kiryat Bialik", "lat": 32.8333, "lng": 35.0833},
                    {"name": "קריית מוצקין", "name_en": "Kiryat Motzkin", "lat": 32.8389, "lng": 35.0750},
                    {"name": "קריית אתא", "name_en": "Kiryat Ata", "lat": 32.8000, "lng": 35.1000},
                    {"name": "קריית ים", "name_en": "Kiryat Yam", "lat": 32.8500, "lng": 35.0667},
                    {"name": "נשר", "name_en": "Nesher", "lat": 32.7700, "lng": 35.0400},
                    {"name": "טירת כרמל", "name_en": "Tirat Carmel", "lat": 32.7589, "lng": 34.9714},
                    {"name": "אום אל-פחם", "name_en": "Umm al-Fahm", "lat": 32.5170, "lng": 35.1530},
                    {"name": "באקה אל-גרבייה", "name_en": "Baqa al-Gharbiyye", "lat": 32.4180, "lng": 35.0400},
                    {"name": "דלית אל-כרמל", "name_en": "Daliyat al-Karmel", "lat": 32.6910, "lng": 35.0540},
                    {"name": "עוספיה", "name_en": "Isfiya", "lat": 32.7280, "lng": 35.0630}
                ]
            },
            {
                "region_id": "north",
                "name": "צפון",
                "name_en": "North",
                "cities": [
                    {"name": "נהריה", "name_en": "Nahariya", "lat": 33.0072, "lng": 35.0942},
                    {"name": "עכו", "name_en": "Acre", "lat": 32.9279, "lng": 35.0756},
                    {"name": "כרמיאל", "name_en": "Karmiel", "lat": 32.9136, "lng": 35.2961},
                    {"name": "צפת", "name_en": "Safed", "lat": 32.9646, "lng": 35.4960},
                    {"name": "טבריה", "name_en": "Tiberias", "lat": 32.7922, "lng": 35.5312},
                    {"name": "קריית שמונה", "name_en": "Kiryat Shmona", "lat": 33.2075, "lng": 35.5697},
                    {"name": "נצרת", "name_en": "Nazareth", "lat": 32.6996, "lng": 35.3035},
                    {"name": "נוף הגליל", "name_en": "Nof HaGalil", "lat": 32.7260, "lng": 35.3280},
                    {"name": "עפולה", "name_en": "Afula", "lat": 32.6074, "lng": 35.2893},
                    {"name": "בית שאן", "name_en": "Beit She'an", "lat": 32.4975, "lng": 35.4965},
                    {"name": "יקנעם", "name_en": "Yokneam", "lat": 32.6594, "lng": 35.1086},
                    {"name": "מגדל העמק", "name_en": "Migdal HaEmek", "lat": 32.6744, "lng": 35.2406},
                    {"name": "מעלות-תרשיחא", "name_en": "Ma'alot-Tarshiha", "lat": 33.0167, "lng": 35.2667},
                    {"name": "שלומי", "name_en": "Shlomi", "lat": 33.0747, "lng": 35.1428},
                    {"name": "שפרעם", "name_en": "Shefaram", "lat": 32.8060, "lng": 35.1710},
                    {"name": "טמרה", "name_en": "Tamra", "lat": 32.8560, "lng": 35.1980}
                ]
            },
            {
                "region_id": "sharon",
                "name": "השרון",
                "name_en": "Sharon",
                "cities": [
                    {"name": "נתניה", "name_en": "Netanya", "lat": 32.3286, "lng": 34.8567},
                    {"name": "רעננה", "name_en": "Ra'anana", "lat": 32.1836, "lng": 34.8708},
                    {"name": "כפר סבא", "name_en": "Kfar Saba", "lat": 32.1753, "lng": 34.9065},
                    {"name": "הוד השרון", "name_en": "Hod HaSharon", "lat": 32.1500, "lng": 34.8833},
                    {"name": "חדרה", "name_en": "Hadera", "lat": 32.4340, "lng": 34.9196},
                    {"name": "כפר יונה", "name_en": "Kfar Yona", "lat": 32.3167, "lng": 34.9333},
                    {"name": "פרדס חנה-כרכור", "name_en": "Pardes Hanna-Karkur", "lat": 32.4700, "lng": 34.9700},
                    {"name": "זכרון יעקב", "name_en": "Zikhron Ya'akov", "lat": 32.5714, "lng": 34.9522},
                    {"name": "בנימינה-גבעת עדה", "name_en": "Binyamina-Givat Ada", "lat": 32.5167, "lng": 34.9500},
                    {"name": "אור עקיבא", "name_en": "Or Akiva", "lat": 32.5081, "lng": 34.9181},
                    {"name": "קיסריה", "name_en": "Caesarea", "lat": 32.5000, "lng": 34.9000},
                    {"name": "קדימה-צורן", "name_en": "Kadima-Zoran", "lat": 32.2770, "lng": 34.9170},
                    {"name": "אבן יהודה", "name_en": "Even Yehuda", "lat": 32.2700, "lng": 34.8870}
                ]
            },
            {
                "region_id": "jerusalem",
                "name": "ירושלים",
                "name_en": "Jerusalem",
                "cities": [
                    {"name": "ירושלים", "name_en": "Jerusalem", "lat": 31.7683, "lng": 35.2137},
                    {"name": "בית שמש", "name_en": "Beit Shemesh", "lat": 31.7514, "lng": 34.9886},
                    {"name": "מעלה אדומים", "name_en": "Ma'ale Adumim", "lat": 31.7781, "lng": 35.3031},
                    {"name": "גבעת זאב", "name_en": "Giv'at Ze'ev", "lat": 31.8622, "lng": 35.1706},
                    {"name": "מבשרת ציון", "name_en": "Mevaseret Zion", "lat": 31.8028, "lng": 35.1525},
                    {"name": "מודיעין עילית", "name_en": "Modi'in Illit", "lat": 31.9333, "lng": 35.0439},
                    {"name": "ביתר עילית", "name_en": "Beitar Illit", "lat": 31.6953, "lng": 35.1128},
                    {"name": "אבו גוש", "name_en": "Abu Ghosh", "lat": 31.8081, "lng": 35.1108},
                    {"name": "צור הדסה", "name_en": "Tzur Hadassa", "lat": 31.7231, "lng": 35.0717},
                    {"name": "אפרת", "name_en": "Efrat", "lat": 31.6547, "lng": 35.1422}
                ]
            },
            {
                "region_id": "south",
                "name": "דרום",
                "name_en": "South",
                "cities": [
                    {"name": "באר שבע", "name_en": "Be'er Sheva", "lat": 31.2518, "lng": 34.7913},
                    {"name": "אשדוד", "name_en": "Ashdod", "lat": 31.8044, "lng": 34.6553},
                    {"name": "אשקלון", "name_en": "Ashkelon", "lat": 31.6688, "lng": 34.5743},
                    {"name": "אילת", "name_en": "Eilat", "lat": 29.5577, "lng": 34.9519},
                    {"name": "דימונה", "name_en": "Dimona", "lat": 31.0697, "lng": 35.0333},
                    {"name": "קריית גת", "name_en": "Kiryat Gat", "lat": 31.6061, "lng": 34.7717},
                    {"name": "שדרות", "name_en": "Sderot", "lat": 31.5247, "lng": 34.5967},
                    {"name": "אופקים", "name_en": "Ofakim", "lat": 31.3142, "lng": 34.6183},
                    {"name": "נתיבות", "name_en": "Netivot", "lat": 31.4222, "lng": 34.5892},
                    {"name": "ערד", "name_en": "Arad", "lat": 31.2614, "lng": 35.2128},
                    {"name": "ירוחם", "name_en": "Yeruham", "lat": 30.9897, "lng": 34.9300},
                    {"name": "מצפה רמון", "name_en": "Mitzpe Ramon", "lat": 30.6100, "lng": 34.8017},
                    {"name": "רהט", "name_en": "Rahat", "lat": 31.3928, "lng": 34.7542},
                    {"name": "קריית מלאכי", "name_en": "Kiryat Malakhi", "lat": 31.7308, "lng": 34.7472}
                ]
            },
            {
                "region_id": "judea_samaria",
                "name": "יהודה ושומרון",
                "name_en": "Judea and Samaria",
                "cities": [
                    {"name": "אריאל", "name_en": "Ariel", "lat": 32.1064, "lng": 35.1731},
                    {"name": "אלפי מנשה", "name_en": "Alfei Menashe", "lat": 32.1667, "lng": 35.0333},
                    {"name": "קרני שומרון", "name_en": "Karnei Shomron", "lat": 32.1667, "lng": 35.0833},
                    {"name": "עמנואל", "name_en": "Immanuel", "lat": 32.1556, "lng": 35.1589},
                    {"name": "קדומים", "name_en": "Kedumim", "lat": 32.1833, "lng": 35.1833},
                    {"name": "אלקנה", "name_en": "Elkana", "lat": 32.1100, "lng": 35.0310},
                    {"name": "בית אל", "name_en": "Beit El", "lat": 31.9420, "lng": 35.2230},
                    {"name": "עפרה", "name_en": "Ofra", "lat": 31.9570, "lng": 35.2660}
                ]
            },
            {
                "region_id": "golan",
                "name": "גולן",
                "name_en": "Golan Heights",
                "cities": [
                    {"name": "קצרין", "name_en": "Katzrin", "lat": 32.9920, "lng": 35.6910},
                    {"name": "חספין", "name_en": "Haspin", "lat": 32.7920, "lng": 35.8190},
                    {"name": "בני יהודה", "name_en": "Bnei Yehuda", "lat": 32.8920, "lng": 35.7210},
                    {"name": "מג'דל שמס", "name_en": "Majdal Shams", "lat": 33.2690, "lng": 35.7660},
                    {"name": "מסעדה", "name_en": "Mas'ade", "lat": 33.2310, "lng": 35.7630},
                    {"name": "בוקעאתא", "name_en": "Buq'ata", "lat": 33.2020, "lng": 35.7680}
                ]
            }
        ]
        # Insert defaults
        await db.regions.insert_many(default_regions)
        # Remove MongoDB _id from each region for JSON serialization
        for region in default_regions:
            if "_id" in region:
                del region["_id"]
        return {"regions": default_regions}
    
    return {"regions": regions}

@router.post("/admin/regions")
async def create_region(
    region_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Create a new region"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    region = {
        "region_id": f"region_{uuid.uuid4().hex[:8]}",
        "name": region_data.get("name"),
        "name_en": region_data.get("name_en", ""),
        "cities": region_data.get("cities", []),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.regions.insert_one(region)
    if "_id" in region:
        del region["_id"]
    
    return {"message": "Region created", "region": region}

@router.put("/admin/regions/{region_id}")
async def update_region(
    region_id: str,
    region_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update a region"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {}
    if "name" in region_data:
        update_data["name"] = region_data["name"]
    if "name_en" in region_data:
        update_data["name_en"] = region_data["name_en"]
    if "cities" in region_data:
        update_data["cities"] = region_data["cities"]
    
    result = await db.regions.update_one(
        {"region_id": region_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Region not found")
    
    return {"message": "Region updated"}

@router.delete("/admin/regions/{region_id}")
async def delete_region(
    region_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Delete a region"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.regions.delete_one({"region_id": region_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Region not found")
    
    return {"message": "Region deleted"}

@router.post("/admin/regions/{region_id}/cities")
async def add_city_to_region(
    region_id: str,
    city_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Add a city to a region"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    city_name = city_data.get("name") or city_data.get("city")
    if not city_name:
        raise HTTPException(status_code=400, detail="City name required")
    
    # Create city object with coordinates if provided
    city = {
        "name": city_name,
        "name_en": city_data.get("name_en", ""),
        "lat": city_data.get("lat"),
        "lng": city_data.get("lng")
    }
    
    result = await db.regions.update_one(
        {"region_id": region_id},
        {"$addToSet": {"cities": city}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Region not found")
    
    return {"message": f"City '{city_name}' added to region", "city": city}

@router.delete("/admin/regions/{region_id}/cities/{city_name}")
async def remove_city_from_region(
    region_id: str,
    city_name: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Remove a city from a region"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Decode URL-encoded city name
    from urllib.parse import unquote
    decoded_city_name = unquote(city_name)
    
    # Try removing city object (new format with name field)
    result = await db.regions.update_one(
        {"region_id": region_id},
        {"$pull": {"cities": {"name": decoded_city_name}}}
    )
    
    # If no change, try removing as string (old format)
    if result.modified_count == 0:
        result = await db.regions.update_one(
            {"region_id": region_id},
            {"$pull": {"cities": decoded_city_name}}
        )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Region not found")
    
    return {"message": f"City '{decoded_city_name}' removed from region"}

@router.put("/admin/providers/{provider_id}/recommend")
async def admin_recommend_provider(
    provider_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Set provider as recommended"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.providers.update_one(
        {"provider_id": provider_id},
        {"$set": {"is_recommended": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    return {"message": "Provider marked as recommended"}

@router.get("/admin/stats")
async def admin_get_stats(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Get platform statistics"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    stats = {
        "total_users": await db.users.count_documents({}),
        "total_providers": await db.providers.count_documents({}),
        "verified_providers": await db.providers.count_documents({"is_verified": True}),
        "total_services": await db.services.count_documents({"is_active": True}),
        "total_bookings": await db.bookings.count_documents({}),
        "pending_bookings": await db.bookings.count_documents({"status": "pending"}),
        "total_requests": await db.requests.count_documents({}),
        "open_requests": await db.requests.count_documents({"status": "open"}),
        "total_reviews": await db.reviews.count_documents({}),
        "total_messages": await db.messages.count_documents({})
    }
    
    # Get recent registrations (last 7 days)
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    stats["new_users_week"] = await db.users.count_documents({
        "created_at": {"$gte": week_ago}
    })
    stats["new_bookings_week"] = await db.bookings.count_documents({
        "created_at": {"$gte": week_ago}
    })
    
    return stats


@router.get("/stats/public")
async def get_public_stats():
    """Public: Get basic platform statistics for landing page"""
    stats = {
        "total_providers": await db.providers.count_documents({"is_verified": True}),
        "total_services": await db.services.count_documents({"is_active": True}),
        "total_users": await db.users.count_documents({"role": {"$in": ["patient", "user"]}}),
        "total_cities": len(await db.providers.distinct("city", {"is_verified": True, "city": {"$ne": None}}))
    }
    return stats



@router.post("/admin/notifications/broadcast")
async def admin_broadcast_notification(
    notif_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Broadcast notification to all users"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    title = notif_data.get("title")
    message = notif_data.get("message")
    target_role = notif_data.get("role")  # Optional: target specific role
    
    query = {}
    if target_role:
        query["role"] = target_role
    
    users = await db.users.find(query, {"user_id": 1}).to_list(10000)
    
    for u in users:
        await create_notification(
            u["user_id"],
            NotificationType.SYSTEM,
            title,
            message
        )
    
    return {"message": f"Notification sent to {len(users)} users"}

# ==================== ADMIN SETTINGS ====================

@router.get("/settings/public")
async def get_public_settings():
    """Get public site settings (no auth required)"""
    settings = await db.site_settings.find_one({}, {"_id": 0})
    if not settings:
        settings = {
            "contact_email": "info@carelink.co.il",
            "contact_phone": "03-1234567",
            "contact_address": "תל אביב, ישראל",
            "footer_text": "© 2025 CareLink. All rights reserved.",
            "social_facebook": "",
            "social_instagram": "",
            "social_twitter": "",
            "social_linkedin": "",
            "social_youtube": "",
            "footer_links": []
        }
    # Only return public fields
    public_fields = [
        "contact_email", "contact_phone", "contact_address",
        "footer_text", "social_facebook", "social_instagram",
        "social_twitter", "social_linkedin", "social_youtube",
        "footer_links", "site_name", "site_tagline"
    ]
    return {k: v for k, v in settings.items() if k in public_fields}

@router.get("/admin/settings")
async def admin_get_settings(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Get site settings"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    settings = await db.site_settings.find_one({}, {"_id": 0})
    if not settings:
        # Return default settings
        settings = {
            "site_name": "CareLink",
            "site_tagline": "Connecting Care Providers",
            "logo_url": "",
            "favicon_url": "",
            "contact_email": "info@carelink.co.il",
            "contact_phone": "03-1234567",
            "contact_address": "תל אביב, ישראל",
            "footer_text": "© 2024 CareLink. כל הזכויות שמורות.",
            "social_facebook": "",
            "social_instagram": "",
            "social_twitter": "",
            "social_linkedin": "",
            "social_youtube": "",
            "footer_links": [
                {"label": "אודות", "url": "/about"},
                {"label": "תנאי שימוש", "url": "/terms"},
                {"label": "מדיניות פרטיות", "url": "/privacy"},
                {"label": "צור קשר", "url": "/contact"}
            ],
            "maintenance_mode": False,
            "allow_registrations": True,
            "require_email_verification": True,
            "google_analytics_id": "",
            "meta_description": "",
            "meta_keywords": ""
        }
    return settings

@router.put("/admin/settings")
async def admin_update_settings(
    settings_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update site settings"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    settings_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.site_settings.update_one(
        {},
        {"$set": settings_data},
        upsert=True
    )
    
    return {"message": "Settings updated successfully"}

# ==================== SERVICE TYPES MANAGEMENT ====================

@router.get("/service-types")
async def get_service_types():
    """Get all service types for public use"""
    service_types = await db.service_types.find({}, {"_id": 0}).to_list(100)
    
    if not service_types:
        # Initialize default service types
        default_types = [
            {
                "type_id": "visit",
                "name": "שירות ביקור",
                "name_en": "Visit Service",
                "description": "שירות הניתן בביקור אחד",
                "icon": "home",
                "requires_location": True,
                "is_active": True
            },
            {
                "type_id": "hourly",
                "name": "שירות שעתי",
                "name_en": "Hourly Service",
                "description": "שירות המחושב לפי שעות",
                "icon": "clock",
                "requires_location": True,
                "has_minimum_hours": True,
                "is_active": True
            },
            {
                "type_id": "consultation",
                "name": "שירות ייעוץ",
                "name_en": "Consultation Service",
                "description": "שירות ייעוץ מקצועי",
                "icon": "message-circle",
                "requires_location": False,
                "is_active": True
            },
            {
                "type_id": "product",
                "name": "מוצר",
                "name_en": "Product",
                "description": "מוצר למכירה",
                "icon": "package",
                "requires_location": False,
                "has_shipping": True,
                "is_active": True
            }
        ]
        await db.service_types.insert_many(default_types)
        # Remove _id from response
        for t in default_types:
            if "_id" in t:
                del t["_id"]
        return {"service_types": default_types}
    
    return {"service_types": service_types}

@router.get("/delivery-types")
async def get_delivery_types():
    """Get all delivery types for public use"""
    delivery_types = await db.delivery_types.find({}, {"_id": 0}).to_list(100)
    
    if not delivery_types:
        # Initialize default delivery types
        default_types = [
            {
                "type_id": "home_visit",
                "name": "בבית",
                "name_en": "At Home",
                "description": "השירות יינתן בבית הלקוח",
                "icon": "home",
                "requires_address": True,
                "is_active": True
            },
            {
                "type_id": "hospital",
                "name": "בבית חולים / מוסד",
                "name_en": "Hospital / Institution",
                "description": "השירות יינתן בבית חולים או מוסד רפואי",
                "icon": "building",
                "requires_address": True,
                "is_active": True
            },
            {
                "type_id": "clinic",
                "name": "בקליניקה",
                "name_en": "At Clinic",
                "description": "השירות יינתן בקליניקה של הספק",
                "icon": "building-2",
                "requires_address": False,
                "is_active": True
            },
            {
                "type_id": "virtual",
                "name": "וירטואלי",
                "name_en": "Virtual",
                "description": "השירות יינתן בטלפון או וידאו",
                "icon": "video",
                "requires_address": False,
                "sub_types": ["phone", "video"],
                "is_active": True
            }
        ]
        await db.delivery_types.insert_many(default_types)
        # Remove _id from response
        for t in default_types:
            if "_id" in t:
                del t["_id"]
        return {"delivery_types": default_types}
    
    return {"delivery_types": delivery_types}

@router.get("/admin/service-types")
async def admin_get_service_types(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Get all service types"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    service_types = await db.service_types.find({}, {"_id": 0}).to_list(100)
    
    if not service_types:
        # Trigger initialization
        response = await get_service_types()
        return {"service_types": response["service_types"]}
    
    return {"service_types": service_types}

@router.post("/admin/service-types")
async def admin_create_service_type(
    type_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Create a new service type"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    service_type = {
        "type_id": f"type_{uuid.uuid4().hex[:8]}",
        "name": type_data.get("name"),
        "name_en": type_data.get("name_en", ""),
        "description": type_data.get("description", ""),
        "icon": type_data.get("icon", "box"),
        "requires_location": type_data.get("requires_location", True),
        "has_minimum_hours": type_data.get("has_minimum_hours", False),
        "has_shipping": type_data.get("has_shipping", False),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.service_types.insert_one(service_type)
    if "_id" in service_type:
        del service_type["_id"]
    
    return {"message": "Service type created", "service_type": service_type}

@router.put("/admin/service-types/{type_id}")
async def admin_update_service_type(
    type_id: str,
    type_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update a service type"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {k: v for k, v in type_data.items() if k in [
        "name", "name_en", "description", "icon", 
        "requires_location", "has_minimum_hours", "has_shipping", "is_active"
    ]}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.service_types.update_one(
        {"type_id": type_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service type not found")
    
    return {"message": "Service type updated"}

@router.delete("/admin/service-types/{type_id}")
async def admin_delete_service_type(
    type_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Delete a service type"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.service_types.delete_one({"type_id": type_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service type not found")
    
    return {"message": "Service type deleted"}

@router.get("/admin/delivery-types")
async def admin_get_delivery_types(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Get all delivery types"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    delivery_types = await db.delivery_types.find({}, {"_id": 0}).to_list(100)
    
    if not delivery_types:
        response = await get_delivery_types()
        return {"delivery_types": response["delivery_types"]}
    
    return {"delivery_types": delivery_types}

@router.post("/admin/delivery-types")
async def admin_create_delivery_type(
    type_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Create a new delivery type"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    delivery_type = {
        "type_id": f"delivery_{uuid.uuid4().hex[:8]}",
        "name": type_data.get("name"),
        "name_en": type_data.get("name_en", ""),
        "description": type_data.get("description", ""),
        "icon": type_data.get("icon", "map-pin"),
        "requires_address": type_data.get("requires_address", True),
        "sub_types": type_data.get("sub_types", []),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.delivery_types.insert_one(delivery_type)
    if "_id" in delivery_type:
        del delivery_type["_id"]
    
    return {"message": "Delivery type created", "delivery_type": delivery_type}

@router.put("/admin/delivery-types/{type_id}")
async def admin_update_delivery_type(
    type_id: str,
    type_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update a delivery type"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {k: v for k, v in type_data.items() if k in [
        "name", "name_en", "description", "icon", 
        "requires_address", "sub_types", "is_active"
    ]}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.delivery_types.update_one(
        {"type_id": type_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Delivery type not found")
    
    return {"message": "Delivery type updated"}

@router.delete("/admin/delivery-types/{type_id}")
async def admin_delete_delivery_type(
    type_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Delete a delivery type"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.delivery_types.delete_one({"type_id": type_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Delivery type not found")
    
    return {"message": "Delivery type deleted"}

# ==================== PUBLIC PROFESSIONS ====================

async def _ensure_professions_initialized():
    """Initialize default professions if collection is empty. Returns the professions list."""
    professions = await db.professions.find({}, {"_id": 0}).to_list(100)
    if professions:
        return professions
    # Trigger initialization via the admin logic
    ts = datetime.now(timezone.utc).isoformat()
    default_professions = _get_default_professions(ts)
    if default_professions:
        await db.professions.insert_many(default_professions)
        professions = default_professions
    return professions

@router.get("/professions")
async def get_public_professions():
    """Get all professions for public use (dropdowns, filters, etc.)"""
    professions = await _ensure_professions_initialized()

    if not professions:
        return {"professions": []}
    
    # Return simplified structure for public use
    public_professions = []
    for prof in professions:
        public_prof = {
            "profession_id": prof.get("profession_id"),
            "name": prof.get("name"),
            "name_en": prof.get("name_en"),
            "icon": prof.get("icon"),
            "specializations": prof.get("specializations", []),
            "sub_professions": [
                {
                    "sub_profession_id": sp.get("sub_profession_id"),
                    "name": sp.get("name"),
                    "name_en": sp.get("name_en"),
                    "categories": [
                        {"category_id": c.get("category_id"), "name": c.get("name"), "name_en": c.get("name_en")}
                        for c in sp.get("categories", [])
                    ]
                }
                for sp in prof.get("sub_professions", [])
            ]
        }
        public_professions.append(public_prof)
    
    return {"professions": public_professions}

# ==================== ADMIN PROFESSIONS ====================

@router.get("/admin/professions")
async def admin_get_professions(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Get all professions with hierarchy"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    professions = await db.professions.find({}, {"_id": 0}).to_list(100)
    
    if not professions:
        # Initialize default professions and save to DB
        ts = datetime.now(timezone.utc).isoformat()
        default_professions = _get_default_professions(ts)
        if default_professions:
            await db.professions.insert_many(default_professions)
            professions = default_professions

    return {"professions": professions}


def _get_default_professions(ts: str):
    """Return the default professions data for initialization."""
    return [
            # ==================== רפואה ====================
            {
                "profession_id": "prof_medicine",
                "name": "רפואה",
                "name_en": "Medicine",
                "icon": "stethoscope",
                "specializations": ["רפואת משפחה", "רפואה פנימית", "רפואת ילדים", "גריאטריה", "כירורגיה", "אורתופדיה", "קרדיולוגיה", "נוירולוגיה", "אורולוגיה", "גינקולוגיה", "עור ומין", "אף אוזן גרון", "רפואת עיניים", "אונקולוגיה", "אנדוקרינולוגיה", "גסטרואנטרולוגיה", "ריאות", "ראומטולוגיה", "רפואה דחופה", "הרדמה", "רדיולוגיה", "פתולוגיה", "רפואת ספורט", "רפואת כאב", "רפואה פיזיקלית ושיקום"],
                "sub_professions": [
                    {"sub_profession_id": "sub_family_med", "name": "רפואת משפחה", "name_en": "Family Medicine", "categories": [
                        {"category_id": "cat_home_visit", "name": "ביקור בית", "name_en": "Home Visit"},
                        {"category_id": "cat_checkup", "name": "בדיקה כללית", "name_en": "General Checkup"},
                        {"category_id": "cat_prescription", "name": "מתן מרשם", "name_en": "Prescription"},
                        {"category_id": "cat_referral", "name": "הפניה לבדיקות", "name_en": "Referral"},
                        {"category_id": "cat_chronic", "name": "ניהול מחלות כרוניות", "name_en": "Chronic Disease Management"},
                    ]},
                    {"sub_profession_id": "sub_internal", "name": "רפואה פנימית", "name_en": "Internal Medicine", "categories": [
                        {"category_id": "cat_internal_consult", "name": "ייעוץ פנימי", "name_en": "Internal Consultation"},
                        {"category_id": "cat_internal_followup", "name": "מעקב מחלות כרוניות", "name_en": "Chronic Follow-up"},
                    ]},
                    {"sub_profession_id": "sub_pediatrics", "name": "רפואת ילדים", "name_en": "Pediatrics", "categories": [
                        {"category_id": "cat_child_checkup", "name": "בדיקת ילדים", "name_en": "Child Checkup"},
                        {"category_id": "cat_vaccination", "name": "חיסונים", "name_en": "Vaccination"},
                        {"category_id": "cat_child_development", "name": "מעקב התפתחות", "name_en": "Development Follow-up"},
                    ]},
                    {"sub_profession_id": "sub_geriatrics", "name": "גריאטריה", "name_en": "Geriatrics", "categories": [
                        {"category_id": "cat_geriatric_assess", "name": "הערכה גריאטרית", "name_en": "Geriatric Assessment"},
                        {"category_id": "cat_dementia", "name": "טיפול בדמנציה", "name_en": "Dementia Care"},
                        {"category_id": "cat_fall_prevention", "name": "מניעת נפילות", "name_en": "Fall Prevention"},
                    ]},
                    {"sub_profession_id": "sub_surgery", "name": "כירורגיה", "name_en": "Surgery", "categories": [
                        {"category_id": "cat_pre_surgery", "name": "ייעוץ לפני ניתוח", "name_en": "Pre-Surgery Consultation"},
                        {"category_id": "cat_post_surgery", "name": "מעקב אחרי ניתוח", "name_en": "Post-Surgery Follow-up"},
                    ]},
                    {"sub_profession_id": "sub_orthopedics", "name": "אורתופדיה", "name_en": "Orthopedics", "categories": [
                        {"category_id": "cat_ortho_consult", "name": "ייעוץ אורתופדי", "name_en": "Orthopedic Consultation"},
                        {"category_id": "cat_joint_injection", "name": "הזרקה למפרק", "name_en": "Joint Injection"},
                        {"category_id": "cat_ortho_rehab", "name": "שיקום אורתופדי", "name_en": "Orthopedic Rehab"},
                    ]},
                    {"sub_profession_id": "sub_cardiology", "name": "קרדיולוגיה", "name_en": "Cardiology", "categories": [
                        {"category_id": "cat_cardio_consult", "name": "ייעוץ קרדיולוגי", "name_en": "Cardiology Consultation"},
                        {"category_id": "cat_ecg", "name": "בדיקת אק\"ג", "name_en": "ECG Test"},
                        {"category_id": "cat_holter", "name": "הולטר", "name_en": "Holter Monitor"},
                    ]},
                    {"sub_profession_id": "sub_neurology", "name": "נוירולוגיה", "name_en": "Neurology", "categories": [
                        {"category_id": "cat_neuro_consult", "name": "ייעוץ נוירולוגי", "name_en": "Neurology Consultation"},
                        {"category_id": "cat_eeg", "name": "בדיקת EEG", "name_en": "EEG Test"},
                    ]},
                    {"sub_profession_id": "sub_dermatology", "name": "עור ומין", "name_en": "Dermatology", "categories": [
                        {"category_id": "cat_skin_consult", "name": "ייעוץ עור", "name_en": "Skin Consultation"},
                        {"category_id": "cat_mole_check", "name": "בדיקת שומות", "name_en": "Mole Check"},
                        {"category_id": "cat_skin_treatment", "name": "טיפול עורי", "name_en": "Skin Treatment"},
                    ]},
                    {"sub_profession_id": "sub_ent", "name": "אף אוזן גרון", "name_en": "ENT", "categories": [
                        {"category_id": "cat_ent_consult", "name": "ייעוץ אא\"ג", "name_en": "ENT Consultation"},
                        {"category_id": "cat_hearing_test", "name": "בדיקת שמיעה", "name_en": "Hearing Test"},
                    ]},
                    {"sub_profession_id": "sub_ophthalmology", "name": "רפואת עיניים", "name_en": "Ophthalmology", "categories": [
                        {"category_id": "cat_eye_exam", "name": "בדיקת עיניים", "name_en": "Eye Exam"},
                        {"category_id": "cat_eye_pressure", "name": "בדיקת לחץ תוך עיני", "name_en": "Eye Pressure Test"},
                    ]},
                    {"sub_profession_id": "sub_urology", "name": "אורולוגיה", "name_en": "Urology", "categories": [
                        {"category_id": "cat_uro_consult", "name": "ייעוץ אורולוגי", "name_en": "Urology Consultation"},
                    ]},
                    {"sub_profession_id": "sub_gynecology", "name": "גינקולוגיה ומיילדות", "name_en": "Gynecology & Obstetrics", "categories": [
                        {"category_id": "cat_gyn_consult", "name": "ייעוץ גינקולוגי", "name_en": "Gynecology Consultation"},
                        {"category_id": "cat_pregnancy", "name": "מעקב הריון", "name_en": "Pregnancy Follow-up"},
                        {"category_id": "cat_ultrasound", "name": "אולטרסאונד", "name_en": "Ultrasound"},
                    ]},
                    {"sub_profession_id": "sub_oncology", "name": "אונקולוגיה", "name_en": "Oncology", "categories": [
                        {"category_id": "cat_onco_consult", "name": "ייעוץ אונקולוגי", "name_en": "Oncology Consultation"},
                        {"category_id": "cat_onco_followup", "name": "מעקב אונקולוגי", "name_en": "Oncology Follow-up"},
                    ]},
                    {"sub_profession_id": "sub_endocrine", "name": "אנדוקרינולוגיה", "name_en": "Endocrinology", "categories": [
                        {"category_id": "cat_diabetes", "name": "ניהול סוכרת", "name_en": "Diabetes Management"},
                        {"category_id": "cat_thyroid", "name": "בעיות בלוטת התריס", "name_en": "Thyroid Disorders"},
                    ]},
                    {"sub_profession_id": "sub_gastro", "name": "גסטרואנטרולוגיה", "name_en": "Gastroenterology", "categories": [
                        {"category_id": "cat_gastro_consult", "name": "ייעוץ גסטרו", "name_en": "Gastro Consultation"},
                    ]},
                    {"sub_profession_id": "sub_pulmonology", "name": "ריאות", "name_en": "Pulmonology", "categories": [
                        {"category_id": "cat_pulmo_consult", "name": "ייעוץ ריאות", "name_en": "Pulmonology Consultation"},
                        {"category_id": "cat_spirometry", "name": "בדיקת תפקודי ריאות", "name_en": "Spirometry"},
                    ]},
                    {"sub_profession_id": "sub_rheumatology", "name": "ראומטולוגיה", "name_en": "Rheumatology", "categories": [
                        {"category_id": "cat_rheuma_consult", "name": "ייעוץ ראומטולוגי", "name_en": "Rheumatology Consultation"},
                    ]},
                    {"sub_profession_id": "sub_sports_med", "name": "רפואת ספורט", "name_en": "Sports Medicine", "categories": [
                        {"category_id": "cat_sports_consult", "name": "ייעוץ רפואת ספורט", "name_en": "Sports Medicine Consultation"},
                        {"category_id": "cat_sports_rehab", "name": "שיקום ספורטיבי", "name_en": "Sports Rehabilitation"},
                    ]},
                    {"sub_profession_id": "sub_pain", "name": "רפואת כאב", "name_en": "Pain Medicine", "categories": [
                        {"category_id": "cat_pain_consult", "name": "ייעוץ כאב", "name_en": "Pain Consultation"},
                        {"category_id": "cat_pain_injection", "name": "הזרקות כאב", "name_en": "Pain Injections"},
                    ]},
                    {"sub_profession_id": "sub_emergency", "name": "רפואה דחופה", "name_en": "Emergency Medicine", "categories": [
                        {"category_id": "cat_urgent_visit", "name": "ביקור דחוף", "name_en": "Urgent Visit"},
                    ]},
                    {"sub_profession_id": "sub_pmr", "name": "רפואה פיזיקלית ושיקום", "name_en": "Physical Medicine & Rehabilitation", "categories": [
                        {"category_id": "cat_rehab_plan", "name": "תכנית שיקום", "name_en": "Rehabilitation Plan"},
                        {"category_id": "cat_disability_eval", "name": "הערכת נכות", "name_en": "Disability Evaluation"},
                    ]},
                ],
                "created_at": ts
            },
            # ==================== סיעוד ====================
            {
                "profession_id": "prof_nursing",
                "name": "סיעוד",
                "name_en": "Nursing",
                "icon": "heart-pulse",
                "specializations": ["סיעוד ביתי", "טיפול בקשישים", "סיעוד אחרי ניתוח", "טיפול פליאטיבי", "סיעוד ילדים", "סיעוד נפשי", "סיעוד אונקולוגי"],
                "sub_professions": [
                    {"sub_profession_id": "sub_home_care", "name": "סיעוד ביתי", "name_en": "Home Care", "categories": [
                        {"category_id": "cat_daily_care", "name": "טיפול יומיומי", "name_en": "Daily Care"},
                        {"category_id": "cat_wound_care", "name": "טיפול בפצעים", "name_en": "Wound Care"},
                        {"category_id": "cat_iv_therapy", "name": "עירוי תוך ורידי", "name_en": "IV Therapy"},
                        {"category_id": "cat_injections", "name": "הזרקות", "name_en": "Injections"},
                        {"category_id": "cat_catheter", "name": "טיפול בקטטר", "name_en": "Catheter Care"},
                        {"category_id": "cat_blood_test", "name": "בדיקות דם", "name_en": "Blood Tests"},
                        {"category_id": "cat_vitals", "name": "מדידת סימנים חיוניים", "name_en": "Vital Signs"},
                    ]},
                    {"sub_profession_id": "sub_elderly_care", "name": "טיפול בקשישים", "name_en": "Elderly Care", "categories": [
                        {"category_id": "cat_elderly_daily", "name": "סיוע יומיומי לקשיש", "name_en": "Daily Elderly Care"},
                        {"category_id": "cat_elderly_night", "name": "שמירת לילה", "name_en": "Night Watch"},
                        {"category_id": "cat_medication_mgmt", "name": "ניהול תרופות", "name_en": "Medication Management"},
                        {"category_id": "cat_companion", "name": "ליווי וחברה", "name_en": "Companion Care"},
                    ]},
                    {"sub_profession_id": "sub_post_op", "name": "סיעוד אחרי ניתוח", "name_en": "Post-Op Care", "categories": [
                        {"category_id": "cat_post_op_care", "name": "טיפול אחרי ניתוח", "name_en": "Post-Op Care"},
                        {"category_id": "cat_drain_care", "name": "טיפול בנקזים", "name_en": "Drain Care"},
                        {"category_id": "cat_stoma_care", "name": "טיפול בסטומה", "name_en": "Stoma Care"},
                    ]},
                    {"sub_profession_id": "sub_palliative", "name": "טיפול פליאטיבי", "name_en": "Palliative Care", "categories": [
                        {"category_id": "cat_palliative_care", "name": "טיפול תומך", "name_en": "Supportive Care"},
                        {"category_id": "cat_pain_mgmt", "name": "ניהול כאב", "name_en": "Pain Management"},
                    ]},
                    {"sub_profession_id": "sub_child_nursing", "name": "סיעוד ילדים", "name_en": "Pediatric Nursing", "categories": [
                        {"category_id": "cat_child_care", "name": "טיפול סיעודי לילדים", "name_en": "Pediatric Care"},
                        {"category_id": "cat_child_chronic", "name": "ליווי ילד כרוני", "name_en": "Chronic Child Care"},
                    ]},
                ],
                "created_at": ts
            },
            # ==================== רפואת שיניים ====================
            {
                "profession_id": "prof_dental",
                "name": "רפואת שיניים",
                "name_en": "Dentistry",
                "icon": "tooth",
                "specializations": ["רפואת שיניים כללית", "אורתודונטיה", "פריודונטיה", "אנדודונטיה", "כירורגיית פה ולסת", "רפואת שיניים לילדים", "שיקום הפה", "אסתטיקה דנטלית"],
                "sub_professions": [
                    {"sub_profession_id": "sub_general_dental", "name": "רפואת שיניים כללית", "name_en": "General Dentistry", "categories": [
                        {"category_id": "cat_dental_checkup", "name": "בדיקת שיניים", "name_en": "Dental Checkup"},
                        {"category_id": "cat_filling", "name": "סתימה", "name_en": "Filling"},
                        {"category_id": "cat_cleaning", "name": "ניקוי אבנית", "name_en": "Dental Cleaning"},
                        {"category_id": "cat_extraction", "name": "עקירת שן", "name_en": "Tooth Extraction"},
                    ]},
                    {"sub_profession_id": "sub_orthodontics", "name": "אורתודונטיה", "name_en": "Orthodontics", "categories": [
                        {"category_id": "cat_braces", "name": "יישור שיניים", "name_en": "Braces"},
                        {"category_id": "cat_invisalign", "name": "קשתיות שקופות", "name_en": "Clear Aligners"},
                    ]},
                    {"sub_profession_id": "sub_periodontics", "name": "פריודונטיה", "name_en": "Periodontics", "categories": [
                        {"category_id": "cat_gum_treatment", "name": "טיפול בחניכיים", "name_en": "Gum Treatment"},
                        {"category_id": "cat_implant", "name": "השתלת שיניים", "name_en": "Dental Implant"},
                    ]},
                    {"sub_profession_id": "sub_endodontics", "name": "אנדודונטיה", "name_en": "Endodontics", "categories": [
                        {"category_id": "cat_root_canal", "name": "טיפול שורש", "name_en": "Root Canal"},
                    ]},
                    {"sub_profession_id": "sub_child_dental", "name": "רפואת שיניים לילדים", "name_en": "Pediatric Dentistry", "categories": [
                        {"category_id": "cat_child_dental", "name": "טיפול שיניים לילדים", "name_en": "Children Dental Care"},
                    ]},
                    {"sub_profession_id": "sub_dental_aesthetic", "name": "אסתטיקה דנטלית", "name_en": "Dental Aesthetics", "categories": [
                        {"category_id": "cat_whitening", "name": "הלבנת שיניים", "name_en": "Teeth Whitening"},
                        {"category_id": "cat_veneers", "name": "ציפויי חרסינה", "name_en": "Veneers"},
                    ]},
                ],
                "created_at": ts
            },
            # ==================== טיפולי שיקום ====================
            {
                "profession_id": "prof_therapy",
                "name": "טיפולי שיקום",
                "name_en": "Rehabilitation Therapy",
                "icon": "activity",
                "specializations": ["פיזיותרפיה", "ריפוי בעיסוק", "קלינאות תקשורת", "פודיאטריה", "כירופרקטיקה"],
                "sub_professions": [
                    {"sub_profession_id": "sub_physio", "name": "פיזיותרפיה", "name_en": "Physiotherapy", "categories": [
                        {"category_id": "cat_physio_ortho", "name": "פיזיותרפיה אורתופדית", "name_en": "Orthopedic Physiotherapy"},
                        {"category_id": "cat_physio_neuro", "name": "פיזיותרפיה נוירולוגית", "name_en": "Neurological Physiotherapy"},
                        {"category_id": "cat_physio_sport", "name": "פיזיותרפיה ספורטיבית", "name_en": "Sports Physiotherapy"},
                        {"category_id": "cat_physio_resp", "name": "פיזיותרפיה נשימתית", "name_en": "Respiratory Physiotherapy"},
                        {"category_id": "cat_physio_pelvic", "name": "פיזיותרפיה של רצפת האגן", "name_en": "Pelvic Floor Physiotherapy"},
                        {"category_id": "cat_physio_child", "name": "פיזיותרפיה לילדים", "name_en": "Pediatric Physiotherapy"},
                    ]},
                    {"sub_profession_id": "sub_occupational", "name": "ריפוי בעיסוק", "name_en": "Occupational Therapy", "categories": [
                        {"category_id": "cat_ot_child", "name": "ריפוי בעיסוק לילדים", "name_en": "Pediatric OT"},
                        {"category_id": "cat_ot_adult", "name": "ריפוי בעיסוק למבוגרים", "name_en": "Adult OT"},
                        {"category_id": "cat_ot_sensory", "name": "טיפול סנסורי", "name_en": "Sensory Therapy"},
                        {"category_id": "cat_ot_hand", "name": "ריפוי בעיסוק - יד", "name_en": "Hand Therapy"},
                    ]},
                    {"sub_profession_id": "sub_speech", "name": "קלינאות תקשורת", "name_en": "Speech Therapy", "categories": [
                        {"category_id": "cat_speech_child", "name": "טיפול בדיבור לילדים", "name_en": "Children Speech Therapy"},
                        {"category_id": "cat_speech_adult", "name": "טיפול בדיבור למבוגרים", "name_en": "Adult Speech Therapy"},
                        {"category_id": "cat_swallowing", "name": "טיפול בבעיות בליעה", "name_en": "Swallowing Therapy"},
                        {"category_id": "cat_stuttering", "name": "טיפול בגמגום", "name_en": "Stuttering Therapy"},
                    ]},
                    {"sub_profession_id": "sub_podiatry", "name": "פודיאטריה", "name_en": "Podiatry", "categories": [
                        {"category_id": "cat_foot_care", "name": "טיפול כפות רגליים", "name_en": "Foot Care"},
                        {"category_id": "cat_orthotics", "name": "מדרסים", "name_en": "Orthotics"},
                    ]},
                    {"sub_profession_id": "sub_chiropractic", "name": "כירופרקטיקה", "name_en": "Chiropractic", "categories": [
                        {"category_id": "cat_spinal_adjust", "name": "יישור עמוד שדרה", "name_en": "Spinal Adjustment"},
                        {"category_id": "cat_back_pain", "name": "טיפול בכאבי גב", "name_en": "Back Pain Treatment"},
                    ]},
                ],
                "created_at": ts
            },
            # ==================== בריאות הנפש ====================
            {
                "profession_id": "prof_mental",
                "name": "בריאות הנפש",
                "name_en": "Mental Health",
                "icon": "brain",
                "specializations": ["פסיכולוגיה קלינית", "פסיכיאטריה", "פסיכותרפיה", "ייעוץ זוגי ומשפחתי", "טיפול בהתמכרויות", "נוירופסיכולוגיה", "טיפול קוגניטיבי-התנהגותי"],
                "sub_professions": [
                    {"sub_profession_id": "sub_clinical_psych", "name": "פסיכולוגיה קלינית", "name_en": "Clinical Psychology", "categories": [
                        {"category_id": "cat_psych_assess", "name": "אבחון פסיכולוגי", "name_en": "Psychological Assessment"},
                        {"category_id": "cat_psych_therapy", "name": "טיפול פסיכולוגי", "name_en": "Psychological Therapy"},
                        {"category_id": "cat_anxiety", "name": "טיפול בחרדה", "name_en": "Anxiety Treatment"},
                        {"category_id": "cat_depression", "name": "טיפול בדיכאון", "name_en": "Depression Treatment"},
                        {"category_id": "cat_trauma", "name": "טיפול בטראומה", "name_en": "Trauma Treatment"},
                    ]},
                    {"sub_profession_id": "sub_psychiatry", "name": "פסיכיאטריה", "name_en": "Psychiatry", "categories": [
                        {"category_id": "cat_psych_consult", "name": "ייעוץ פסיכיאטרי", "name_en": "Psychiatric Consultation"},
                        {"category_id": "cat_med_mgmt", "name": "ניהול תרופתי", "name_en": "Medication Management"},
                    ]},
                    {"sub_profession_id": "sub_couple_family", "name": "טיפול זוגי ומשפחתי", "name_en": "Couple & Family Therapy", "categories": [
                        {"category_id": "cat_couple_therapy", "name": "טיפול זוגי", "name_en": "Couple Therapy"},
                        {"category_id": "cat_family_therapy", "name": "טיפול משפחתי", "name_en": "Family Therapy"},
                    ]},
                    {"sub_profession_id": "sub_child_psych", "name": "פסיכולוגיית ילדים", "name_en": "Child Psychology", "categories": [
                        {"category_id": "cat_child_therapy", "name": "טיפול רגשי לילדים", "name_en": "Child Emotional Therapy"},
                        {"category_id": "cat_adhd", "name": "אבחון וטיפול ADHD", "name_en": "ADHD Diagnosis & Treatment"},
                        {"category_id": "cat_autism", "name": "טיפול בספקטרום האוטיזם", "name_en": "Autism Spectrum Treatment"},
                    ]},
                    {"sub_profession_id": "sub_addiction", "name": "טיפול בהתמכרויות", "name_en": "Addiction Treatment", "categories": [
                        {"category_id": "cat_addiction_consult", "name": "ייעוץ התמכרויות", "name_en": "Addiction Counseling"},
                    ]},
                    {"sub_profession_id": "sub_social_work", "name": "עבודה סוציאלית", "name_en": "Social Work", "categories": [
                        {"category_id": "cat_social_consult", "name": "ייעוץ סוציאלי", "name_en": "Social Counseling"},
                        {"category_id": "cat_rights", "name": "מיצוי זכויות", "name_en": "Rights Advocacy"},
                    ]},
                ],
                "created_at": ts
            },
            # ==================== תזונה ודיאטה ====================
            {
                "profession_id": "prof_nutrition",
                "name": "תזונה ודיאטה",
                "name_en": "Nutrition & Dietetics",
                "icon": "apple",
                "specializations": ["תזונה קלינית", "תזונת ספורט", "תזונת ילדים", "הפרעות אכילה", "תזונה לנשים בהריון"],
                "sub_professions": [
                    {"sub_profession_id": "sub_clinical_diet", "name": "דיאטה קלינית", "name_en": "Clinical Dietetics", "categories": [
                        {"category_id": "cat_diet_plan", "name": "תכנית תזונה", "name_en": "Nutrition Plan"},
                        {"category_id": "cat_diet_diabetes", "name": "תזונה לסוכרתיים", "name_en": "Diabetic Diet"},
                        {"category_id": "cat_weight_mgmt", "name": "ניהול משקל", "name_en": "Weight Management"},
                    ]},
                    {"sub_profession_id": "sub_sports_nutrition", "name": "תזונת ספורט", "name_en": "Sports Nutrition", "categories": [
                        {"category_id": "cat_sport_diet", "name": "תכנית תזונה לספורטאים", "name_en": "Sports Nutrition Plan"},
                    ]},
                    {"sub_profession_id": "sub_eating_disorders", "name": "הפרעות אכילה", "name_en": "Eating Disorders", "categories": [
                        {"category_id": "cat_eating_therapy", "name": "טיפול בהפרעות אכילה", "name_en": "Eating Disorder Therapy"},
                    ]},
                ],
                "created_at": ts
            },
            # ==================== רפואה משלימה ====================
            {
                "profession_id": "prof_alternative",
                "name": "רפואה משלימה",
                "name_en": "Alternative & Complementary Medicine",
                "icon": "leaf",
                "specializations": ["דיקור סיני", "נטורופתיה", "הומאופתיה", "עיסוי רפואי", "רפלקסולוגיה", "אוסטאופתיה"],
                "sub_professions": [
                    {"sub_profession_id": "sub_acupuncture", "name": "דיקור סיני", "name_en": "Acupuncture", "categories": [
                        {"category_id": "cat_acupuncture", "name": "טיפול בדיקור", "name_en": "Acupuncture Treatment"},
                        {"category_id": "cat_cupping", "name": "כוסות רוח", "name_en": "Cupping Therapy"},
                    ]},
                    {"sub_profession_id": "sub_naturopathy", "name": "נטורופתיה", "name_en": "Naturopathy", "categories": [
                        {"category_id": "cat_naturo_consult", "name": "ייעוץ נטורופתי", "name_en": "Naturopathic Consultation"},
                        {"category_id": "cat_herbal", "name": "רפואה בצמחים", "name_en": "Herbal Medicine"},
                    ]},
                    {"sub_profession_id": "sub_massage", "name": "עיסוי רפואי", "name_en": "Medical Massage", "categories": [
                        {"category_id": "cat_therapeutic_massage", "name": "עיסוי טיפולי", "name_en": "Therapeutic Massage"},
                        {"category_id": "cat_shiatsu", "name": "שיאצו", "name_en": "Shiatsu"},
                        {"category_id": "cat_reflexology", "name": "רפלקסולוגיה", "name_en": "Reflexology"},
                    ]},
                    {"sub_profession_id": "sub_osteopathy", "name": "אוסטאופתיה", "name_en": "Osteopathy", "categories": [
                        {"category_id": "cat_osteo_treatment", "name": "טיפול אוסטאופתי", "name_en": "Osteopathic Treatment"},
                    ]},
                    {"sub_profession_id": "sub_homeopathy", "name": "הומאופתיה", "name_en": "Homeopathy", "categories": [
                        {"category_id": "cat_homeo_consult", "name": "ייעוץ הומאופתי", "name_en": "Homeopathic Consultation"},
                    ]},
                ],
                "created_at": ts
            },
            # ==================== אופטומטריה ====================
            {
                "profession_id": "prof_optometry",
                "name": "אופטומטריה",
                "name_en": "Optometry",
                "icon": "eye",
                "specializations": ["בדיקות ראייה", "התאמת עדשות מגע", "ראייה ילדים"],
                "sub_professions": [
                    {"sub_profession_id": "sub_optometry_general", "name": "אופטומטריה כללית", "name_en": "General Optometry", "categories": [
                        {"category_id": "cat_vision_test", "name": "בדיקת ראייה", "name_en": "Vision Test"},
                        {"category_id": "cat_glasses", "name": "התאמת משקפיים", "name_en": "Glasses Fitting"},
                        {"category_id": "cat_contacts", "name": "התאמת עדשות מגע", "name_en": "Contact Lens Fitting"},
                    ]},
                ],
                "created_at": ts
            },
            # ==================== מיילדות ====================
            {
                "profession_id": "prof_midwifery",
                "name": "מיילדות",
                "name_en": "Midwifery",
                "icon": "baby",
                "specializations": ["ליווי הריון", "ליווי לידה", "ליווי לאחר לידה", "ייעוץ הנקה"],
                "sub_professions": [
                    {"sub_profession_id": "sub_pregnancy", "name": "ליווי הריון", "name_en": "Pregnancy Support", "categories": [
                        {"category_id": "cat_prenatal", "name": "הכנה ללידה", "name_en": "Prenatal Preparation"},
                        {"category_id": "cat_pregnancy_support", "name": "ליווי הריון", "name_en": "Pregnancy Companion"},
                    ]},
                    {"sub_profession_id": "sub_birth", "name": "ליווי לידה", "name_en": "Birth Support", "categories": [
                        {"category_id": "cat_doula", "name": "דולה", "name_en": "Doula"},
                        {"category_id": "cat_home_birth", "name": "לידה בבית", "name_en": "Home Birth"},
                    ]},
                    {"sub_profession_id": "sub_postpartum", "name": "לאחר לידה", "name_en": "Postpartum", "categories": [
                        {"category_id": "cat_postpartum_care", "name": "טיפול לאחר לידה", "name_en": "Postpartum Care"},
                        {"category_id": "cat_breastfeeding", "name": "ייעוץ הנקה", "name_en": "Breastfeeding Counseling"},
                    ]},
                ],
                "created_at": ts
            },
            # ==================== טיפולי סיוע ====================
            {
                "profession_id": "prof_caregiving",
                "name": "טיפול וסיוע",
                "name_en": "Caregiving & Assistance",
                "icon": "helping-hand",
                "specializations": ["מטפל סיעודי", "עזרה בבית", "ליווי רפואי", "שמירה פרטית"],
                "sub_professions": [
                    {"sub_profession_id": "sub_caregiver", "name": "מטפל/ת סיעודי/ת", "name_en": "Caregiver", "categories": [
                        {"category_id": "cat_daily_assist", "name": "סיוע יומיומי", "name_en": "Daily Assistance"},
                        {"category_id": "cat_night_shift", "name": "שמירת לילה", "name_en": "Night Shift"},
                        {"category_id": "cat_bathing", "name": "עזרה ברחצה והלבשה", "name_en": "Bathing & Dressing"},
                        {"category_id": "cat_mobility", "name": "סיוע בניידות", "name_en": "Mobility Assistance"},
                    ]},
                    {"sub_profession_id": "sub_medical_escort", "name": "ליווי רפואי", "name_en": "Medical Escort", "categories": [
                        {"category_id": "cat_hospital_escort", "name": "ליווי לבית חולים", "name_en": "Hospital Escort"},
                        {"category_id": "cat_doctor_escort", "name": "ליווי לרופא", "name_en": "Doctor Escort"},
                    ]},
                ],
                "created_at": ts
            },
    ]


@router.post("/admin/professions")
async def admin_create_profession(
    profession_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Create a new profession"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    profession = {
        "profession_id": f"prof_{uuid.uuid4().hex[:12]}",
        "name": profession_data.get("name"),
        "name_en": profession_data.get("name_en", ""),
        "icon": profession_data.get("icon", "briefcase"),
        "specializations": profession_data.get("specializations", []),
        "sub_professions": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.professions.insert_one(profession)
    
    return {"message": "Profession created", "profession": {k: v for k, v in profession.items() if k != "_id"}}

@router.put("/admin/professions/{profession_id}")
async def admin_update_profession(
    profession_id: str,
    profession_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update a profession"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {}
    if "name" in profession_data:
        update_data["name"] = profession_data["name"]
    if "name_en" in profession_data:
        update_data["name_en"] = profession_data["name_en"]
    if "icon" in profession_data:
        update_data["icon"] = profession_data["icon"]
    if "specializations" in profession_data:
        update_data["specializations"] = profession_data["specializations"]
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.professions.update_one(
        {"profession_id": profession_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Profession not found")
    
    return {"message": "Profession updated"}

@router.put("/admin/sub-professions/{sub_profession_id}")
async def admin_update_sub_profession(
    sub_profession_id: str,
    sub_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update a sub-profession"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_fields = {}
    if "name" in sub_data:
        update_fields["sub_professions.$.name"] = sub_data["name"]
    if "name_en" in sub_data:
        update_fields["sub_professions.$.name_en"] = sub_data["name_en"]
    
    result = await db.professions.update_one(
        {"sub_professions.sub_profession_id": sub_profession_id},
        {"$set": update_fields}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Sub-profession not found")
    
    return {"message": "Sub-profession updated"}

@router.post("/admin/professions/{profession_id}/sub-professions")
async def admin_create_sub_profession(
    profession_id: str,
    sub_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Create a sub-profession"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    sub_profession = {
        "sub_profession_id": f"sub_{uuid.uuid4().hex[:12]}",
        "name": sub_data.get("name"),
        "name_en": sub_data.get("name_en", ""),
        "categories": []
    }
    
    result = await db.professions.update_one(
        {"profession_id": profession_id},
        {"$push": {"sub_professions": sub_profession}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Profession not found")
    
    return {"message": "Sub-profession created", "sub_profession": sub_profession}

@router.post("/admin/sub-professions/{sub_profession_id}/categories")
async def admin_create_category(
    sub_profession_id: str,
    category_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Create a category under a sub-profession"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    category = {
        "category_id": f"cat_{uuid.uuid4().hex[:12]}",
        "name": category_data.get("name"),
        "name_en": category_data.get("name_en", "")
    }
    
    result = await db.professions.update_one(
        {"sub_professions.sub_profession_id": sub_profession_id},
        {"$push": {"sub_professions.$.categories": category}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Sub-profession not found")
    
    return {"message": "Category created", "category": category}

@router.delete("/admin/professions/{profession_id}")
async def admin_delete_profession(
    profession_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Delete a profession"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.professions.delete_one({"profession_id": profession_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Profession not found")
    
    return {"message": "Profession deleted"}

@router.delete("/admin/sub-professions/{sub_profession_id}")
async def admin_delete_sub_profession(
    sub_profession_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Delete a sub-profession"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.professions.update_one(
        {"sub_professions.sub_profession_id": sub_profession_id},
        {"$pull": {"sub_professions": {"sub_profession_id": sub_profession_id}}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Sub-profession not found")
    
    return {"message": "Sub-profession deleted"}

@router.delete("/admin/categories/{category_id}")
async def admin_delete_category(
    category_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Delete a category"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.professions.update_one(
        {"sub_professions.categories.category_id": category_id},
        {"$pull": {"sub_professions.$.categories": {"category_id": category_id}}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return {"message": "Category deleted"}

# ==================== ADMIN ADS ====================

@router.get("/admin/ads")
async def admin_get_ads(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Get all ads"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    ads = await db.ads.find({}, {"_id": 0}).to_list(100)
    return {"ads": ads}

@router.post("/admin/ads")
async def admin_create_ad(
    ad_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Create a new ad"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    ad = {
        "ad_id": f"ad_{uuid.uuid4().hex[:12]}",
        "title": ad_data.get("title"),
        "image_url": ad_data.get("image_url"),
        "link_url": ad_data.get("link_url", ""),
        "position": ad_data.get("position", "homepage_top"),
        "start_date": ad_data.get("start_date"),
        "end_date": ad_data.get("end_date"),
        "is_active": ad_data.get("is_active", True),
        "views": 0,
        "clicks": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.ads.insert_one(ad)
    
    return {"message": "Ad created", "ad": {k: v for k, v in ad.items() if k != "_id"}}

@router.put("/admin/ads/{ad_id}")
async def admin_update_ad(
    ad_id: str,
    ad_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update an ad"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    ad_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.ads.update_one(
        {"ad_id": ad_id},
        {"$set": ad_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ad not found")
    
    return {"message": "Ad updated"}

@router.delete("/admin/ads/{ad_id}")
async def admin_delete_ad(
    ad_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Delete an ad"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.ads.delete_one({"ad_id": ad_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ad not found")
    
    return {"message": "Ad deleted"}

# ==================== ADMIN BLOG ====================

@router.get("/admin/blog")
async def admin_get_blog_posts(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Get all blog posts"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    posts = await db.blog_posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"posts": posts}

@router.post("/admin/blog")
async def admin_create_blog_post(
    post_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Create a new blog post"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    post = {
        "post_id": f"post_{uuid.uuid4().hex[:12]}",
        "title": post_data.get("title"),
        "slug": post_data.get("slug", ""),
        "excerpt": post_data.get("excerpt", ""),
        "content": post_data.get("content", ""),
        "featured_image": post_data.get("featured_image", ""),
        "tags": post_data.get("tags", []),
        "is_published": post_data.get("is_published", False),
        "views": 0,
        "author_id": user.get("user_id"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.blog_posts.insert_one(post)
    
    return {"message": "Blog post created", "post": {k: v for k, v in post.items() if k != "_id"}}

@router.put("/admin/blog/{post_id}")
async def admin_update_blog_post(
    post_id: str,
    post_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update a blog post"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    post_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.blog_posts.update_one(
        {"post_id": post_id},
        {"$set": post_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Blog post not found")
    
    return {"message": "Blog post updated"}

@router.delete("/admin/blog/{post_id}")
async def admin_delete_blog_post(
    post_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Delete a blog post"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.blog_posts.delete_one({"post_id": post_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Blog post not found")
    
    return {"message": "Blog post deleted"}

# ==================== ADMIN BOOKINGS STATUS ====================

@router.put("/admin/bookings/{booking_id}/status")
async def admin_update_booking_status(
    booking_id: str,
    status_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update booking status"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    new_status = status_data.get("status")
    valid_statuses = ["pending", "confirmed", "in_progress", "completed", "cancelled"]
    
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    update_data = {"status": new_status}
    
    if new_status == "confirmed":
        update_data["confirmed_at"] = datetime.now(timezone.utc).isoformat()
    elif new_status == "completed":
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
    elif new_status == "cancelled":
        update_data["cancelled_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return {"message": f"Booking status updated to {new_status}"}

# ==================== PUBLIC PAGES ====================

@router.get("/pages/{slug}")
async def get_public_page(slug: str):
    """Get a public static page by slug"""
    page = await db.static_pages.find_one(
        {"slug": slug, "is_published": True},
        {"_id": 0}
    )
    
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    return page

# ==================== ADMIN PAGES (Static Pages) ====================

@router.get("/admin/pages")
async def admin_get_pages(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Get all static pages"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    pages = await db.static_pages.find({}, {"_id": 0}).to_list(100)
    
    if not pages:
        # Return default pages
        pages = [
            {"page_id": "page_about", "title": "אודות", "slug": "about", "content": "", "is_published": True},
            {"page_id": "page_terms", "title": "תנאי שימוש", "slug": "terms", "content": "", "is_published": True},
            {"page_id": "page_privacy", "title": "מדיניות פרטיות", "slug": "privacy", "content": "", "is_published": True},
            {"page_id": "page_contact", "title": "צור קשר", "slug": "contact", "content": "", "is_published": True}
        ]
    
    return {"pages": pages}

@router.post("/admin/pages")
async def admin_create_page(
    page_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Create a new static page"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    page = {
        "page_id": f"page_{uuid.uuid4().hex[:12]}",
        "title": page_data.get("title"),
        "slug": page_data.get("slug", ""),
        "content": page_data.get("content", ""),
        "is_published": page_data.get("is_published", False),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.static_pages.insert_one(page)
    
    return {"message": "Page created", "page": {k: v for k, v in page.items() if k != "_id"}}

@router.put("/admin/pages/{page_id}")
async def admin_update_page(
    page_id: str,
    page_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update a static page"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    page_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.static_pages.update_one(
        {"page_id": page_id},
        {"$set": page_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Page not found")
    
    return {"message": "Page updated"}

@router.delete("/admin/pages/{page_id}")
async def admin_delete_page(
    page_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Delete a static page"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.static_pages.delete_one({"page_id": page_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Page not found")
    
    return {"message": "Page deleted"}

# ==================== ADMIN FEATURED PROVIDERS ====================

@router.put("/admin/providers/{provider_id}/unrecommend")
async def admin_unrecommend_provider(
    provider_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Remove provider from recommended"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.providers.update_one(
        {"provider_id": provider_id},
        {"$set": {"is_recommended": False}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    return {"message": "Provider removed from recommended"}

@router.get("/admin/featured")
async def admin_get_featured_providers(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Get all featured/recommended providers"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    providers = await db.providers.find({"is_recommended": True}, {"_id": 0}).to_list(100)
    return {"providers": providers}

@router.delete("/admin/providers/clear-all")
async def admin_clear_all_providers(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Delete all providers (use with caution!)"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Delete all providers
    result = await db.providers.delete_many({})
    
    # Delete all services
    services_result = await db.services.delete_many({})
    
    return {
        "message": "All providers cleared",
        "providers_deleted": result.deleted_count,
        "services_deleted": services_result.deleted_count
    }

@router.delete("/admin/providers/{provider_id}")
async def admin_delete_provider(
    provider_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Delete a specific provider"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Delete provider
    result = await db.providers.delete_one({"provider_id": provider_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Delete provider's services
    await db.services.delete_many({"provider_id": provider_id})
    
    return {"message": "Provider deleted", "provider_id": provider_id}

@router.post("/admin/clear-cache")
async def admin_clear_cache(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Clear server-side cache"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # In a production environment, you might clear Redis cache or other caches here
    # For now, we'll just return success
    return {"message": "Cache cleared successfully", "timestamp": datetime.now(timezone.utc).isoformat()}

# ==================== ADMIN REPORTS ====================

@router.get("/admin/reports")
async def admin_get_reports(
    period: str = "month",  # week, month, year
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Get reports data for charts"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    now = datetime.now(timezone.utc)
    
    # Calculate date range based on period
    if period == "week":
        start_date = now - timedelta(days=7)
        date_format = "%d/%m"
        group_days = 1
    elif period == "year":
        start_date = now - timedelta(days=365)
        date_format = "%m/%Y"
        group_days = 30
    else:  # month (default)
        start_date = now - timedelta(days=30)
        date_format = "%d/%m"
        group_days = 1
    
    start_date_str = start_date.isoformat()
    
    # Get bookings in period
    bookings = await db.bookings.find(
        {"created_at": {"$gte": start_date_str}},
        {"_id": 0, "created_at": 1, "status": 1, "provider_id": 1, "provider_name": 1, "final_price": 1}
    ).to_list(10000)
    
    # Bookings over time
    bookings_by_date = {}
    for booking in bookings:
        try:
            created = booking.get("created_at", "")
            if isinstance(created, str) and created:
                date_obj = datetime.fromisoformat(created.replace("Z", "+00:00"))
                date_key = date_obj.strftime(date_format)
                bookings_by_date[date_key] = bookings_by_date.get(date_key, 0) + 1
        except:
            pass
    
    # Generate all dates in range for complete chart
    bookings_timeline = []
    current = start_date
    while current <= now:
        date_key = current.strftime(date_format)
        bookings_timeline.append({
            "date": date_key,
            "bookings": bookings_by_date.get(date_key, 0)
        })
        current += timedelta(days=group_days)
    
    # Status distribution
    status_counts = {"pending": 0, "confirmed": 0, "completed": 0, "cancelled": 0}
    for booking in bookings:
        status = booking.get("status", "pending")
        if status in status_counts:
            status_counts[status] += 1
    
    status_distribution = [
        {"name": "ממתינות", "value": status_counts["pending"], "color": "#f59e0b"},
        {"name": "מאושרות", "value": status_counts["confirmed"], "color": "#10b981"},
        {"name": "הושלמו", "value": status_counts["completed"], "color": "#3b82f6"},
        {"name": "בוטלו", "value": status_counts["cancelled"], "color": "#ef4444"}
    ]
    
    # Top providers by bookings
    provider_bookings = {}
    for booking in bookings:
        provider_name = booking.get("provider_name", "לא ידוע")
        provider_bookings[provider_name] = provider_bookings.get(provider_name, 0) + 1
    
    top_providers = sorted(
        [{"name": k, "bookings": v} for k, v in provider_bookings.items()],
        key=lambda x: x["bookings"],
        reverse=True
    )[:10]
    
    # Revenue calculation (from completed bookings with price)
    total_revenue = 0
    revenue_by_date = {}
    for booking in bookings:
        if booking.get("status") == "completed" and booking.get("final_price"):
            total_revenue += booking["final_price"]
            try:
                created = booking.get("created_at", "")
                if isinstance(created, str) and created:
                    date_obj = datetime.fromisoformat(created.replace("Z", "+00:00"))
                    date_key = date_obj.strftime(date_format)
                    revenue_by_date[date_key] = revenue_by_date.get(date_key, 0) + booking["final_price"]
            except:
                pass
    
    # New users in period
    users_in_period = await db.users.count_documents({"created_at": {"$gte": start_date_str}})
    
    # New providers in period
    providers_in_period = await db.providers.count_documents({"created_at": {"$gte": start_date_str}})
    
    # Reviews in period
    reviews_in_period = await db.reviews.count_documents({"created_at": {"$gte": start_date_str}})
    
    # Average rating
    all_reviews = await db.reviews.find({}, {"_id": 0, "rating": 1}).to_list(10000)
    avg_rating = sum(r.get("rating", 0) for r in all_reviews) / len(all_reviews) if all_reviews else 0
    
    return {
        "period": period,
        "summary": {
            "total_bookings": len(bookings),
            "total_revenue": total_revenue,
            "new_users": users_in_period,
            "new_providers": providers_in_period,
            "new_reviews": reviews_in_period,
            "avg_rating": round(avg_rating, 2)
        },
        "bookings_timeline": bookings_timeline,
        "status_distribution": status_distribution,
        "top_providers": top_providers,
        "revenue_by_date": [{"date": k, "revenue": v} for k, v in revenue_by_date.items()]
    }

# ==================== SUBSCRIPTION PLANS ====================

# Default subscription plans are defined in subscriptions.py

