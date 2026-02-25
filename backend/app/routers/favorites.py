from fastapi import APIRouter, HTTPException, Header, Request
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid

from app.database import db
from app.models import *
from app.utils import get_current_user, send_email_async, create_notification

router = APIRouter()

@router.post("/favorites/{provider_id}")
async def add_to_favorites(
    provider_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Add provider to favorites"""
    user = await get_current_user(authorization, request)
    
    # Check if already in favorites
    existing = await db.favorites.find_one({
        "user_id": user["user_id"],
        "provider_id": provider_id
    })
    
    if existing:
        return {"message": "Already in favorites", "is_favorite": True}
    
    favorite = {
        "favorite_id": f"fav_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "provider_id": provider_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.favorites.insert_one(favorite)
    
    return {"message": "Added to favorites", "is_favorite": True}

@router.delete("/favorites/{provider_id}")
async def remove_from_favorites(
    provider_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Remove provider from favorites"""
    user = await get_current_user(authorization, request)
    
    result = await db.favorites.delete_one({
        "user_id": user["user_id"],
        "provider_id": provider_id
    })
    
    return {"message": "Removed from favorites", "is_favorite": False}

@router.get("/favorites")
async def get_favorites(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Get user's favorite providers"""
    user = await get_current_user(authorization, request)
    
    favorites = await db.favorites.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    
    # Get provider details for each favorite
    provider_ids = [f["provider_id"] for f in favorites]
    providers = []
    
    for pid in provider_ids:
        provider = await db.providers.find_one({"provider_id": pid}, {"_id": 0})
        if provider:
            providers.append(provider)
    
    return {"favorites": providers}

@router.get("/favorites/check/{provider_id}")
async def check_favorite(
    provider_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Check if provider is in favorites"""
    user = await get_current_user(authorization, request)
    
    existing = await db.favorites.find_one({
        "user_id": user["user_id"],
        "provider_id": provider_id
    })
    
    return {"is_favorite": existing is not None}
