from fastapi import APIRouter, HTTPException, Header, Request
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid

from app.database import db
from app.models import *
from app.utils import get_current_user, send_email_async, create_notification

router = APIRouter()

@router.get("/clinics")
async def get_my_clinics(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Get provider's clinics"""
    user = await get_current_user(authorization, request)
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    clinics = await db.clinics.find(
        {"provider_id": provider["provider_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return {"clinics": clinics}

@router.post("/clinics")
async def create_clinic(
    clinic_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Create a new clinic/location"""
    user = await get_current_user(authorization, request)
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Check subscription
    tier = provider.get("subscription_tier", "free")
    plan = await db.subscription_plans.find_one({"tier": tier}, {"_id": 0})
    if not plan:
        plan = DEFAULT_PLANS[0]
    
    if not plan.get("has_clinic_management", False):
        raise HTTPException(status_code=403, detail="שדרג את המנוי שלך כדי לנהל קליניקות")
    
    max_clinics = plan.get("max_clinics", 0)
    if max_clinics != -1:
        current_count = await db.clinics.count_documents({"provider_id": provider["provider_id"]})
        if current_count >= max_clinics:
            raise HTTPException(status_code=403, detail=f"הגעת למגבלת הקליניקות ({max_clinics})")
    
    clinic = {
        "clinic_id": f"clinic_{uuid.uuid4().hex[:12]}",
        "provider_id": provider["provider_id"],
        "name": clinic_data.get("name", ""),
        "address": clinic_data.get("address", ""),
        "city": clinic_data.get("city", ""),
        "phone": clinic_data.get("phone", ""),
        "latitude": clinic_data.get("latitude"),
        "longitude": clinic_data.get("longitude"),
        "working_hours": clinic_data.get("working_hours", ""),
        "notes": clinic_data.get("notes", ""),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.clinics.insert_one(clinic)
    if "_id" in clinic:
        del clinic["_id"]
    
    return clinic

@router.put("/clinics/{clinic_id}")
async def update_clinic(
    clinic_id: str,
    clinic_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Update a clinic"""
    user = await get_current_user(authorization, request)
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    clinic = await db.clinics.find_one({"clinic_id": clinic_id, "provider_id": provider["provider_id"]})
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    
    allowed = ["name", "address", "city", "phone", "latitude", "longitude", "working_hours", "notes", "is_active"]
    update = {k: v for k, v in clinic_data.items() if k in allowed}
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.clinics.update_one({"clinic_id": clinic_id}, {"$set": update})
    return {"message": "Clinic updated"}

@router.delete("/clinics/{clinic_id}")
async def delete_clinic(
    clinic_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Delete a clinic"""
    user = await get_current_user(authorization, request)
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    result = await db.clinics.delete_one({"clinic_id": clinic_id, "provider_id": provider["provider_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Clinic not found")
    
    return {"message": "Clinic deleted"}

# ==================== TEAM MANAGEMENT ====================

