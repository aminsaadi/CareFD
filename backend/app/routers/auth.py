from fastapi import APIRouter, HTTPException, Header, Request, Response
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid
import secrets
import os

from app.database import db
from app.models import User, UserRegister, UserLogin, UserSession, UserRole, Provider, ProviderRegister, NotificationType, VerificationStatus
from app.utils import get_current_user, send_email_async, create_notification, hash_password, verify_password, create_jwt_token

router = APIRouter()

@router.post("/auth/register")
async def register(user_data: UserRegister):
    """Register new user with email/password"""
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        name=user_data.name,
        password_hash=hash_password(user_data.password),
        role=user_data.role,
        language_preference=user_data.language_preference
    )
    
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # If registering as a provider, create the provider profile automatically
    provider_id = None
    if user_data.role == UserRole.PROVIDER:
        provider = Provider(
            user_id=user.user_id,
            provider_type="individual",  # Default type
            business_name=user.name,  # Use user's name as initial business name
            email=user.email,
            verification_status=VerificationStatus.PENDING,
            is_verified=False
        )
        
        provider_dict = provider.model_dump()
        provider_dict['created_at'] = provider_dict['created_at'].isoformat()
        provider_dict['verification_documents'] = []
        
        await db.providers.insert_one(provider_dict)
        provider_id = provider.provider_id
        
        # Notify all admins about new provider registration
        admins = await db.users.find({"role": "admin"}, {"_id": 0, "user_id": 1, "email": 1}).to_list(100)
        for admin in admins:
            # In-app notification
            await create_notification(
                admin["user_id"],
                NotificationType.PROVIDER_NEW_REGISTRATION,
                "ספק חדש נרשם!",
                f"ספק חדש נרשם למערכת: {user.name}. נדרש אימות.",
                {"provider_id": provider.provider_id, "user_id": user.user_id}
            )
            # Email notification to admin
            admin_link = f"https://carelink.co.il/admin/verification"
            await send_email_async(
                admin.get("email"),
                f"🆕 ספק חדש נרשם: {user.name}",
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
                        <p><strong>תאריך הרשמה:</strong> {datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M')}</p>
                    </div>
                    
                    <p style="font-size: 16px; color: #4C6D7F;">
                        נדרש אימות לפני שהספק יוכל להציע שירותים בפלטפורמה.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{admin_link}" style="background-color: #19B8BA; color: white; padding: 15px 40px; text-decoration: none; border-radius: 30px; font-size: 18px; font-weight: bold; display: inline-block;">
                            עבור לאימות ספקים ➜
                        </a>
                    </div>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #888;">
                        <p>מערכת CareLink</p>
                    </div>
                </div>
                """
            )
        
        # Send welcome email to new provider with profile completion link
        profile_link = f"https://carelink.co.il/provider/edit"
        await send_email_async(
            user.email,
            "ברוכים הבאים ל-CareLink - השלימו את הפרופיל שלכם! 🎉",
            f"""
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #19B8BA;">ברוכים הבאים ל-CareLink!</h1>
                </div>
                
                <p style="font-size: 16px; color: #1E4D5F;">שלום {user.name},</p>
                
                <p style="font-size: 16px; color: #4C6D7F;">
                    תודה שנרשמת כספק שירותים בפלטפורמה שלנו! 
                    אנחנו שמחים לקבל אותך למשפחת CareLink.
                </p>
                
                <div style="background: linear-gradient(135deg, #19B8BA 0%, #1E4D5F 100%); padding: 25px; border-radius: 15px; margin: 25px 0;">
                    <h2 style="color: white; margin-top: 0;">📋 הצעדים הבאים:</h2>
                    <ol style="color: white; font-size: 15px; line-height: 2;">
                        <li>השלימו את פרטי הפרופיל שלכם</li>
                        <li>הוסיפו תמונת פרופיל מקצועית</li>
                        <li>הגדירו את שעות הזמינות שלכם</li>
                        <li>העלו מסמכי אימות (תעודות, רישיונות)</li>
                        <li>הוסיפו את השירותים שאתם מציעים</li>
                    </ol>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{profile_link}" style="background-color: #19B8BA; color: white; padding: 15px 40px; text-decoration: none; border-radius: 30px; font-size: 18px; font-weight: bold; display: inline-block;">
                        השלימו את הפרופיל עכשיו ➜
                    </a>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 25px;">
                    <h3 style="color: #1E4D5F; margin-top: 0;">💡 טיפ חשוב:</h3>
                    <p style="color: #4C6D7F; margin-bottom: 0;">
                        ספקים עם פרופיל מלא ומאומת מקבלים יותר הזמנות! 
                        השלימו את כל הפרטים כדי להגדיל את החשיפה שלכם.
                    </p>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #888;">
                    <p>צוות CareLink</p>
                    <p style="font-size: 12px;">אם יש לכם שאלות, אנחנו כאן לעזור!</p>
                </div>
            </div>
            """
        )
    else:
        # Send regular welcome email to users
        await send_email_async(
            user.email,
            "ברוכים הבאים ל-CareLink! 🎉",
            f"""
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #19B8BA;">ברוכים הבאים ל-CareLink!</h1>
                </div>
                
                <p style="font-size: 16px; color: #1E4D5F;">שלום {user.name},</p>
                
                <p style="font-size: 16px; color: #4C6D7F;">
                    תודה שנרשמת לפלטפורמה שלנו! 
                    כעת תוכלו לחפש ולהזמין שירותי בריאות מהספקים המובילים.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://carelink.co.il/providers" style="background-color: #19B8BA; color: white; padding: 15px 40px; text-decoration: none; border-radius: 30px; font-size: 18px; font-weight: bold; display: inline-block;">
                        חפשו ספקים עכשיו ➜
                    </a>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #888;">
                    <p>צוות CareLink</p>
                </div>
            </div>
            """
        )
    
    # Create session
    session_token = create_jwt_token(user.user_id, user.email)
    session = UserSession(
        user_id=user.user_id,
        session_token=session_token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    
    session_dict = session.model_dump()
    session_dict['created_at'] = session_dict['created_at'].isoformat()
    session_dict['expires_at'] = session_dict['expires_at'].isoformat()
    
    await db.user_sessions.insert_one(session_dict)
    
    return {
        "message": "Registration successful",
        "user": {
            "user_id": user.user_id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "provider_id": provider_id
        },
        "session_token": session_token
    }

@router.post("/auth/login")
async def login(credentials: UserLogin, response: Response):
    """Login with email/password"""
    # Find user
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not user_doc.get("password_hash") or not verify_password(credentials.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create session
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
    
    # Set cookie
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

@router.post("/auth/setup-admin")
async def setup_admin(body: dict):
    """One-time setup endpoint to create initial admin user"""
    setup_key = body.get("setup_key")
    
    # Security: require a setup key
    if setup_key != "carelink_admin_setup_2026":
        raise HTTPException(status_code=403, detail="Invalid setup key")
    
    email = body.get("email", "admin@carelink.co.il")
    password = body.get("password", "Admin123!")
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
        "password": password,
        "note": "Please change the password after first login"
    }

@router.get("/auth/session")
async def google_auth_session(session_id: str = Header(None, alias="X-Session-ID"), response: Response = None):
    """Handle Google OAuth session - get user data from Emergent Auth"""
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Call Emergent Auth API
    async with httpx.AsyncClient() as client:
        auth_response = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        auth_data = auth_response.json()
    
    # Check if user exists
    user_doc = await db.users.find_one({"email": auth_data["email"]}, {"_id": 0})
    
    if user_doc:
        # Update user data
        await db.users.update_one(
            {"email": auth_data["email"]},
            {"$set": {
                "name": auth_data.get("name", user_doc["name"]),
                "picture": auth_data.get("picture")
            }}
        )
        user_id = user_doc["user_id"]
    else:
        # Create new user
        user = User(
            email=auth_data["email"],
            name=auth_data.get("name", ""),
            picture=auth_data.get("picture"),
            role=UserRole.PATIENT,
            is_verified=True
        )
        
        user_dict = user.model_dump()
        user_dict['created_at'] = user_dict['created_at'].isoformat()
        
        await db.users.insert_one(user_dict)
        user_id = user.user_id
    
    # Create session
    session_token = auth_data.get("session_token") or create_jwt_token(user_id, auth_data["email"])
    session = UserSession(
        user_id=user_id,
        session_token=session_token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    
    session_dict = session.model_dump()
    session_dict['created_at'] = session_dict['created_at'].isoformat()
    session_dict['expires_at'] = session_dict['expires_at'].isoformat()
    
    await db.user_sessions.insert_one(session_dict)
    
    # Set cookie
    if response:
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7*24*60*60,
            path="/"
        )
    
    # Get updated user
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    
    return {
        "message": "Authentication successful",
        "user": user_doc,
        "session_token": session_token
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
    frontend_url = os.environ.get('FRONTEND_URL', os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:3000'))
    if '/api' in frontend_url:
        frontend_url = frontend_url.replace('/api', '')
    reset_url = f"{frontend_url}/reset-password?token={reset_token}"
    print(f"Password reset link for {email}: {reset_url}")
    
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
    password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
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
        {"_id": 0, "password": 0}
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

