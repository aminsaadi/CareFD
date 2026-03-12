from fastapi import APIRouter, HTTPException, Header, Request, Response
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid
import secrets
import os
import logging

from app.database import db
from app.models import User, UserRegister, UserLogin, UserSession, UserRole, Provider, ProviderRegister, NotificationType, VerificationStatus
from app.utils import get_current_user, send_email_async, create_notification, get_site_url, hash_password, verify_password, create_jwt_token

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/auth/register")
async def register(user_data: UserRegister):
    """Register new user with email/password"""
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        name=user_data.name,
        password_hash=hash_password(user_data.password),
        role=user_data.role,
        language_preference=user_data.language_preference,
        email_verified=False
    )
    
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    provider_id = None
    if user_data.role == UserRole.PROVIDER:
        provider = Provider(
            user_id=user.user_id,
            provider_type="individual",
            business_name=user.name,
            email=user.email,
            verification_status=VerificationStatus.PENDING,
            is_verified=False
        )
        
        provider_dict = provider.model_dump()
        provider_dict['created_at'] = provider_dict['created_at'].isoformat()
        provider_dict['verification_documents'] = []
        
        await db.providers.insert_one(provider_dict)
        provider_id = provider.provider_id
        
        admins = await db.users.find({"role": "admin"}, {"_id": 0, "user_id": 1, "email": 1}).to_list(100)
        for admin in admins:
            await create_notification(
                admin["user_id"],
                NotificationType.PROVIDER_NEW_REGISTRATION,
                "ספק חדש נרשם!",
                f"ספק חדש נרשם למערכת: {user.name}. נדרש אימות.",
                {"provider_id": provider.provider_id, "user_id": user.user_id}
            )
            frontend_url = await get_site_url()
            admin_link = f"{frontend_url}/admin/verification"
            await send_email_async(
                admin.get("email"),
                f"ספק חדש נרשם: {user.name}",
                f"""
                <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #1E4D5F;">ספק חדש נרשם!</h1>
                    </div>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                        <h3 style="color: #19B8BA; margin-top: 0;">פרטי הספק:</h3>
                        <p><strong>שם:</strong> {user.name}</p>
                        <p><strong>אימייל:</strong> {user.email}</p>
                        <p><strong>מספר ספק:</strong> {provider.provider_number}</p>
                    </div>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{admin_link}" style="background-color: #19B8BA; color: white; padding: 15px 40px; text-decoration: none; border-radius: 30px; font-size: 18px; font-weight: bold; display: inline-block;">
                            עבור לאימות ספקים
                        </a>
                    </div>
                </div>
                """
            )
    
    # Send email verification link
    verification_token = secrets.token_urlsafe(32)
    await db.email_verifications.insert_one({
        "token": verification_token,
        "user_id": user.user_id,
        "email": user.email,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
    })
    
    frontend_url = await get_site_url()
    verify_link = f"{frontend_url}/verify-email?token={verification_token}"
    
    await send_email_async(
        user.email,
        "CareLink - אימות כתובת הדואר האלקטרוני",
        f"""
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #19B8BA;">אימות כתובת דואר אלקטרוני</h1>
            </div>
            
            <p style="font-size: 16px; color: #1E4D5F;">שלום {user.name},</p>
            
            <p style="font-size: 16px; color: #4C6D7F;">
                תודה שנרשמת ל-CareLink!
                כדי להשלים את ההרשמה ולהפעיל את החשבון שלך, אנא אמת את כתובת הדואר האלקטרוני שלך.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{verify_link}" style="background-color: #19B8BA; color: white; padding: 15px 40px; text-decoration: none; border-radius: 30px; font-size: 18px; font-weight: bold; display: inline-block;">
                    אמת את המייל שלי
                </a>
            </div>
            
            <p style="font-size: 14px; color: #888; text-align: center;">
                הלינק תקף ל-24 שעות. אם לא ביקשת הרשמה, התעלם מהודעה זו.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #888;">
                <p>צוות CareLink</p>
            </div>
        </div>
        """
    )
    
    return {
        "message": "Registration successful. Please verify your email.",
        "email_verification_required": True,
        "user": {
            "user_id": user.user_id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "provider_id": provider_id
        }
    }

@router.post("/auth/login")
async def login(credentials: UserLogin, response: Response):
    """Login with email/password"""
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user_doc.get("password_hash") or not verify_password(credentials.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check email verification (admins and existing users without the field are exempt)
    if user_doc.get("role") != "admin" and user_doc.get("email_verified") == False and "email_verified" in user_doc:
        raise HTTPException(
            status_code=403, 
            detail="email_not_verified"
        )
    
    session_token = create_jwt_token(user_doc["user_id"], user_doc["email"])
    session = UserSession(
        user_id=user_doc["user_id"],
        session_token=session_token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    
    session_dict = session.model_dump()
    session_dict['created_at'] = session_dict['created_at'].isoformat()
    session_dict['expires_at'] = session_dict['expires_at'].isoformat()
    
    await db.user_sessions.insert_one(session_dict)
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7*24*60*60,
        path="/"
    )
    
    return {
        "message": "Login successful",
        "user": {
            "user_id": user_doc["user_id"],
            "email": user_doc["email"],
            "name": user_doc["name"],
            "role": user_doc["role"],
            "language_preference": user_doc.get("language_preference", "he")
        },
        "session_token": session_token
    }


@router.get("/auth/verify-email")
async def verify_email(token: str):
    """Verify email address using the token from the verification link"""
    verification = await db.email_verifications.find_one({"token": token}, {"_id": 0})
    if not verification:
        raise HTTPException(status_code=400, detail="invalid_token")
    
    if datetime.fromisoformat(verification["expires_at"]) < datetime.now(timezone.utc):
        await db.email_verifications.delete_one({"token": token})
        raise HTTPException(status_code=400, detail="token_expired")
    
    await db.users.update_one(
        {"user_id": verification["user_id"]},
        {"$set": {"email_verified": True}}
    )
    
    await db.email_verifications.delete_many({"user_id": verification["user_id"]})
    
    return {"message": "Email verified successfully", "email": verification["email"]}


@router.post("/auth/resend-verification")
async def resend_verification(data: dict):
    """Resend email verification link"""
    email = data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email required")
    
    user_doc = await db.users.find_one({"email": email}, {"_id": 0})
    if not user_doc:
        return {"message": "If the email exists, a verification link has been sent"}
    
    if user_doc.get("email_verified"):
        return {"message": "Email already verified"}
    
    await db.email_verifications.delete_many({"user_id": user_doc["user_id"]})
    
    verification_token = secrets.token_urlsafe(32)
    await db.email_verifications.insert_one({
        "token": verification_token,
        "user_id": user_doc["user_id"],
        "email": email,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
    })
    
    frontend_url = await get_site_url()
    verify_link = f"{frontend_url}/verify-email?token={verification_token}"
    
    await send_email_async(
        email,
        "CareLink - אימות כתובת הדואר האלקטרוני",
        f"""
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #19B8BA;">אימות כתובת דואר אלקטרוני</h1>
            </div>
            <p style="font-size: 16px; color: #1E4D5F;">שלום {user_doc.get('name', '')},</p>
            <p style="font-size: 16px; color: #4C6D7F;">לחץ על הכפתור למטה כדי לאמת את כתובת הדואר האלקטרוני שלך.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{verify_link}" style="background-color: #19B8BA; color: white; padding: 15px 40px; text-decoration: none; border-radius: 30px; font-size: 18px; font-weight: bold; display: inline-block;">
                    אמת את המייל שלי
                </a>
            </div>
            <p style="font-size: 14px; color: #888; text-align: center;">הלינק תקף ל-24 שעות.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #888;">
                <p>צוות CareLink</p>
            </div>
        </div>
        """
    )
    
    return {"message": "Verification email sent"}

@router.post("/auth/setup-admin")
async def setup_admin(body: dict):
    """One-time setup endpoint to create initial admin user"""
    setup_key = body.get("setup_key")
    
    # Security: require a setup key from environment variable
    expected_key = os.environ.get("ADMIN_SETUP_KEY", "")
    if not expected_key or setup_key != expected_key:
        raise HTTPException(status_code=403, detail="Invalid setup key")
    
    email = body.get("email")
    password = body.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    name = body.get("name", "מנהל המערכת")
    
    # Check if admin already exists
    existing = await db.users.find_one({"email": email})
    if existing:
        # Update to admin role if not already
        await db.users.update_one(
            {"email": email},
            {"$set": {"role": "admin", "password_hash": hash_password(password)}}
        )
        return {"message": "Admin user updated", "email": email}
    
    # Create admin user
    user_number = f"U{uuid.uuid4().hex[:7].upper()}"
    admin_user = {
        "user_id": f"admin_{uuid.uuid4().hex[:12]}",
        "user_number": user_number,
        "email": email,
        "name": name,
        "password_hash": hash_password(password),
        "role": "admin",
        "phone": "",
        "is_verified": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "language_preference": "he"
    }
    
    await db.users.insert_one(admin_user)
    
    return {
        "message": "Admin user created successfully",
        "email": email,
        "note": "Please change the password after first login"
    }

@router.get("/auth/me")
async def get_me(authorization: Optional[str] = Header(None), request: Request = None):
    """Get current authenticated user"""
    user = await get_current_user(authorization, request)
    return user

@router.post("/auth/logout")
async def logout(authorization: Optional[str] = Header(None), request: Request = None, response: Response = None):
    """Logout user"""
    token = None
    
    if request:
        token = request.cookies.get("session_token")
    
    if not token and authorization:
        if authorization.startswith("Bearer "):
            token = authorization[7:]
        else:
            token = authorization
    
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    
    if response:
        response.delete_cookie("session_token", path="/")
    
    return {"message": "Logged out successfully"}

@router.post("/auth/forgot-password")
async def forgot_password(data: dict):
    """Send password reset email"""
    email = data.get("email", "").lower().strip()
    
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    # Find user by email
    user = await db.users.find_one({"email": email})
    
    # Always return success to prevent email enumeration
    if not user:
        return {"message": "If the email exists, a reset link has been sent"}
    
    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    # Store reset token
    await db.password_resets.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "user_id": user["user_id"],
            "token": reset_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    # In production, send email here
    # For now, log the reset link
    frontend_url = await get_site_url()
    reset_url = f"{frontend_url}/reset-password?token={reset_token}"
    logger.info(f"Password reset requested for {email}")
    
    # Send password reset email
    await send_email_async(
        email,
        "איפוס סיסמה - CareLink",
        f"""
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #19B8BA;">איפוס סיסמה</h1>
            </div>
            
            <p style="font-size: 16px; color: #1E4D5F;">שלום {user.get('name', 'משתמש')},</p>
            
            <p style="font-size: 16px; color: #4C6D7F;">
                קיבלנו בקשה לאיפוס הסיסמה שלך. לחץ על הכפתור למטה כדי לבחור סיסמה חדשה:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_url}" style="background-color: #19B8BA; color: white; padding: 15px 40px; text-decoration: none; border-radius: 30px; font-size: 18px; font-weight: bold; display: inline-block;">
                    איפוס סיסמה ➜
                </a>
            </div>
            
            <p style="font-size: 14px; color: #888;">
                הקישור תקף לשעה אחת בלבד.<br>
                אם לא ביקשת לאפס את הסיסמה, ניתן להתעלם מהודעה זו.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #888;">
                <p>צוות CareLink</p>
            </div>
        </div>
        """
    )
    
    return {"message": "If the email exists, a reset link has been sent"}

@router.get("/auth/reset-password/validate")
async def validate_reset_token(token: str):
    """Validate password reset token"""
    if not token:
        raise HTTPException(status_code=400, detail="Token is required")
    
    reset_doc = await db.password_resets.find_one({"token": token})
    
    if not reset_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    # Check if token is expired
    expires_at = datetime.fromisoformat(reset_doc["expires_at"].replace('Z', '+00:00'))
    if datetime.now(timezone.utc) > expires_at:
        await db.password_resets.delete_one({"token": token})
        raise HTTPException(status_code=400, detail="Token has expired")
    
    return {"valid": True}

@router.post("/auth/reset-password")
async def reset_password(data: dict):
    """Reset password with token"""
    token = data.get("token")
    new_password = data.get("new_password")
    
    if not token or not new_password:
        raise HTTPException(status_code=400, detail="Token and new password are required")
    
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Find reset request
    reset_doc = await db.password_resets.find_one({"token": token})
    
    if not reset_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    # Check if token is expired
    expires_at = datetime.fromisoformat(reset_doc["expires_at"].replace('Z', '+00:00'))
    if datetime.now(timezone.utc) > expires_at:
        await db.password_resets.delete_one({"token": token})
        raise HTTPException(status_code=400, detail="Token has expired")
    
    # Hash new password
    password_hash = hash_password(new_password)

    # Update user password
    await db.users.update_one(
        {"user_id": reset_doc["user_id"]},
        {"$set": {
            "password_hash": password_hash,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Delete reset token
    await db.password_resets.delete_one({"token": token})
    
    # Invalidate all sessions for this user
    await db.user_sessions.delete_many({"user_id": reset_doc["user_id"]})
    
    return {"message": "Password reset successfully"}

@router.put("/users/me")
async def update_user_info(
    user_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Update current user's personal info"""
    user = await get_current_user(authorization, request)
    
    allowed_fields = [
        "first_name", "last_name", "phone", "address", "city", 
        "profile_image", "profile_color", "date_of_birth", "gender"
    ]
    update_data = {}
    
    for field in allowed_fields:
        if field in user_data:
            update_data[field] = user_data[field]
    
    # Handle full name update
    if "first_name" in update_data or "last_name" in update_data:
        first = update_data.get("first_name") or user.get("first_name", "")
        last = update_data.get("last_name") or user.get("last_name", "")
        update_data["name"] = f"{first} {last}".strip()
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": update_data}
    )
    
    # Get updated user
    updated_user = await db.users.find_one(
        {"user_id": user["user_id"]},
        {"_id": 0, "password_hash": 0}
    )
    
    return {"message": "User info updated successfully", "user": updated_user}

@router.put("/users/me/password")
async def change_password(
    password_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Change current user's password"""
    user = await get_current_user(authorization, request)
    
    current_password = password_data.get("current_password")
    new_password = password_data.get("new_password")
    
    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail="נא למלא את כל השדות")
    
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="הסיסמה חייבת להכיל לפחות 6 תווים")
    
    # Get user with password
    db_user = await db.users.find_one({"user_id": user["user_id"]})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not verify_password(current_password, db_user.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="הסיסמה הנוכחית שגויה")
    
    # Hash and update new password
    hashed_password = hash_password(new_password)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "password_hash": hashed_password,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Password changed successfully"}

