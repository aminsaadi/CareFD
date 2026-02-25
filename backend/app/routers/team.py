from fastapi import APIRouter, HTTPException, Header, Request
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid

from app.database import db
from app.models import *
from app.utils import get_current_user, send_email_async, create_notification

router = APIRouter()

@router.get("/team")
async def get_my_team(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Get provider's team members"""
    user = await get_current_user(authorization, request)
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Check subscription
    tier = provider.get("subscription_tier", "free")
    plan = await db.subscription_plans.find_one({"tier": tier}, {"_id": 0})
    if not plan:
        plan = DEFAULT_PLANS[0]
    
    if not plan.get("has_team_management", False):
        raise HTTPException(status_code=403, detail="ניהול צוות זמין במנוי זהב בלבד")
    
    members = await db.team_members.find(
        {"provider_id": provider["provider_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return {"members": members}

@router.post("/team")
async def add_team_member(
    member_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Add a team member"""
    user = await get_current_user(authorization, request)
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    tier = provider.get("subscription_tier", "free")
    plan = await db.subscription_plans.find_one({"tier": tier}, {"_id": 0})
    if not plan:
        plan = DEFAULT_PLANS[0]
    
    if not plan.get("has_team_management", False):
        raise HTTPException(status_code=403, detail="ניהול צוות זמין במנוי זהב בלבד")
    
    max_members = plan.get("max_team_members", 0)
    if max_members != -1:
        current_count = await db.team_members.count_documents({"provider_id": provider["provider_id"]})
        if current_count >= max_members:
            raise HTTPException(status_code=403, detail=f"הגעת למגבלת חברי הצוות ({max_members})")
    
    member = {
        "member_id": f"member_{uuid.uuid4().hex[:12]}",
        "provider_id": provider["provider_id"],
        "name": member_data.get("name", ""),
        "role": member_data.get("role", ""),
        "phone": member_data.get("phone", ""),
        "email": member_data.get("email", ""),
        "specialization": member_data.get("specialization", ""),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.team_members.insert_one(member)
    if "_id" in member:
        del member["_id"]
    
    return member

@router.put("/team/{member_id}")
async def update_team_member(
    member_id: str,
    member_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Update team member"""
    user = await get_current_user(authorization, request)
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    allowed = ["name", "role", "phone", "email", "specialization", "is_active"]
    update = {k: v for k, v in member_data.items() if k in allowed}
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.team_members.update_one(
        {"member_id": member_id, "provider_id": provider["provider_id"]},
        {"$set": update}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    
    return {"message": "Member updated"}

@router.delete("/team/{member_id}")
async def delete_team_member(
    member_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Delete team member"""
    user = await get_current_user(authorization, request)
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    result = await db.team_members.delete_one(
        {"member_id": member_id, "provider_id": provider["provider_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    
    return {"message": "Member deleted"}

# ==================== SUBSCRIPTION UPGRADE (No Payment) ====================

