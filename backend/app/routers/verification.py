from fastapi import APIRouter, HTTPException, Header, Request
from typing import Optional, List
from datetime import datetime, timezone
import uuid

from app.database import db
from app.models import NotificationType
from app.utils import get_current_user, send_email_async, create_notification

router = APIRouter()

@router.get("/verification/status")
async def get_verification_status(authorization: Optional[str] = Header(None), request: Request = None):
    """Get current user's verification status"""
    user = await get_current_user(authorization, request)
    
    # For providers, check provider verification status
    if user.get("role") == UserRole.PROVIDER:
        provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
        if provider:
            return {
                "status": provider.get("verification_status", "pending"),
                "documents": provider.get("verification_documents", []),
                "notes": provider.get("verification_notes"),
                "is_verified": provider.get("is_verified", False),
                "user_type": "provider"
            }
    
    # For regular users
    return {
        "status": user.get("verification_status", "none"),
        "documents": user.get("verification_documents", []),
        "notes": user.get("verification_notes"),
        "is_verified": user.get("is_verified", False),
        "user_type": "user"
    }


@router.post("/verification/request")
async def submit_verification_request(
    request: Request,
    authorization: Optional[str] = Header(None),
    id_card: UploadFile = File(None),
    id_card_back: UploadFile = File(None),
    professional_license: UploadFile = File(None),
    additional_doc: UploadFile = File(None),
    notes: str = ""
):
    """Submit verification request with document uploads"""
    user = await get_current_user(authorization, request)
    
    # Get user_type from form
    form = await request.form()
    user_type = form.get("user_type", "user")
    notes_text = form.get("notes", "")
    
    documents = []
    
    # Process each uploaded file
    async def save_file(upload_file: UploadFile, doc_type: str):
        if not upload_file or not upload_file.filename:
            return None
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
        if upload_file.content_type not in allowed_types:
            return None
        
        # Generate unique filename
        ext = upload_file.filename.split('.')[-1]
        filename = f"{user['user_id']}_{doc_type}_{uuid.uuid4().hex[:8]}.{ext}"
        file_path = UPLOAD_DIR / filename
        
        # Save file
        with open(file_path, "wb") as f:
            content = await upload_file.read()
            f.write(content)
        
        return {
            "document_id": f"doc_{uuid.uuid4().hex[:12]}",
            "document_type": doc_type,
            "file_url": f"/api/files/{filename}",
            "file_name": upload_file.filename,
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "status": "pending"
        }
    
    # Save documents
    if id_card:
        doc = await save_file(id_card, "id_card")
        if doc: documents.append(doc)
    
    if id_card_back:
        doc = await save_file(id_card_back, "id_card_back")
        if doc: documents.append(doc)
    
    if professional_license:
        doc = await save_file(professional_license, "professional_license")
        if doc: documents.append(doc)
    
    if additional_doc:
        doc = await save_file(additional_doc, "additional_doc")
        if doc: documents.append(doc)
    
    if not documents:
        raise HTTPException(status_code=400, detail="At least one document is required")
    
    # Update based on user type
    if user.get("role") == UserRole.PROVIDER:
        # Update provider verification
        await db.providers.update_one(
            {"user_id": user["user_id"]},
            {
                "$set": {
                    "verification_status": VerificationStatus.DOCUMENTS_SUBMITTED,
                    "verification_notes": notes_text
                },
                "$push": {"verification_documents": {"$each": documents}}
            }
        )
    else:
        # Update user verification
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {
                "$set": {
                    "verification_status": "pending",
                    "verification_documents": documents,
                    "verification_notes": notes_text,
                    "verification_submitted_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
    
    # Notify admins
    admins = await db.users.find({"role": "admin"}, {"_id": 0, "user_id": 1, "email": 1}).to_list(100)
    for admin in admins:
        await create_notification(
            admin["user_id"],
            NotificationType.SYSTEM,
            "בקשת אימות חדשה",
            f"בקשת אימות חדשה התקבלה מ{user.get('name', 'משתמש')}",
            {"user_id": user["user_id"], "user_type": user_type}
        )
    
    return {"message": "Verification request submitted successfully", "documents_count": len(documents)}


@router.get("/admin/user-verifications")
async def admin_get_user_verifications(
    status: Optional[str] = None,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Get all user verification requests"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {"verification_status": {"$in": ["pending", "approved", "rejected"]}}
    if status:
        query["verification_status"] = status
    
    users = await db.users.find(
        query,
        {"_id": 0, "password_hash": 0}
    ).to_list(100)
    
    return {"verifications": users}


@router.put("/admin/user-verifications/{user_id}/approve")
async def admin_approve_user_verification(
    user_id: str,
    body: dict = None,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Approve a user verification request"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    notes = body.get("notes", "") if body else ""
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "verification_status": "approved",
                "is_verified": True,
                "verification_notes": notes
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Notify user
    await create_notification(
        user_id,
        NotificationType.SYSTEM,
        "החשבון אומת בהצלחה! ✅",
        "בקשת האימות שלך אושרה. כעת החשבון שלך מאומת.",
        {}
    )
    
    return {"message": "User verification approved"}


@router.put("/admin/user-verifications/{user_id}/reject")
async def admin_reject_user_verification(
    user_id: str,
    body: dict = None,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Reject a user verification request"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    reason = body.get("reason", "הבקשה נדחתה") if body else "הבקשה נדחתה"
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "verification_status": "rejected",
                "is_verified": False,
                "verification_notes": reason
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Notify user
    await create_notification(
        user_id,
        NotificationType.SYSTEM,
        "בקשת האימות נדחתה",
        f"בקשת האימות שלך נדחתה. סיבה: {reason}",
        {}
    )
    
    return {"message": "User verification rejected"}


# ==================== CONTACT FORM ====================

