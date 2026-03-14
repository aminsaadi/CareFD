from fastapi import APIRouter, HTTPException, Header, Request
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid

from app.database import db
from app.models import ServiceRequest, RequestCreate, RequestStatus, Offer, OfferCreate, NotificationType
from app.utils import get_current_user, send_email_async, create_notification

router = APIRouter()

@router.post("/requests")
async def create_request(
    request_data: RequestCreate,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Create a service request"""
    user = await get_current_user(authorization, request)
    
    service_request = ServiceRequest(
        user_id=user["user_id"],
        **request_data.model_dump()
    )
    
    req_dict = service_request.model_dump()
    req_dict['created_at'] = req_dict['created_at'].isoformat()
    req_dict['updated_at'] = req_dict['updated_at'].isoformat()
    if req_dict.get('location'):
        req_dict['location'] = dict(req_dict['location'])
    
    await db.requests.insert_one(req_dict)
    
    return service_request.model_dump()

@router.get("/requests/{request_id}")
async def get_request(request_id: str):
    """Get a specific request"""
    request_doc = await db.requests.find_one({"request_id": request_id}, {"_id": 0})
    if not request_doc:
        raise HTTPException(status_code=404, detail="Request not found")
    return request_doc

@router.get("/requests")
async def get_requests(
    status: Optional[str] = None,
    specialization: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
):
    """Get service requests"""
    query = {}
    if status:
        query["status"] = status
    else:
        query["status"] = RequestStatus.OPEN
    
    if specialization:
        query["specialization"] = specialization
    
    requests = await db.requests.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.requests.count_documents(query)
    
    return {
        "requests": requests,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/requests/my")
async def get_my_requests(
    authorization: Optional[str] = Header(None),
    request: Request = None,
    status: Optional[str] = None
):
    """Get current user's requests"""
    user = await get_current_user(authorization, request)
    
    query = {"user_id": user["user_id"]}
    if status:
        query["status"] = status
    
    requests_list = await db.requests.find(query, {"_id": 0}).to_list(100)
    
    return {"requests": requests_list}

@router.post("/offers")
async def create_offer(
    offer_data: OfferCreate,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Create an offer for a request"""
    user = await get_current_user(authorization, request)
    
    # Get provider
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=403, detail="Only providers can create offers")
    
    # Check request exists
    service_request = await db.requests.find_one({"request_id": offer_data.request_id}, {"_id": 0})
    if not service_request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    offer = Offer(
        provider_id=provider["provider_id"],
        **offer_data.model_dump()
    )
    
    offer_dict = offer.model_dump()
    offer_dict['created_at'] = offer_dict['created_at'].isoformat()
    
    await db.offers.insert_one(offer_dict)
    
    return offer.model_dump()

@router.get("/requests/{request_id}/offers")
async def get_request_offers(request_id: str):
    """Get all offers for a request"""
    offers = await db.offers.find({"request_id": request_id}, {"_id": 0}).to_list(100)
    
    # Enhance with provider info
    for offer in offers:
        provider = await db.providers.find_one({"provider_id": offer["provider_id"]}, {"_id": 0})
        if provider:
            offer["provider"] = {
                "provider_id": provider["provider_id"],
                "business_name": provider.get("business_name"),
                "rating": provider.get("rating", 0)
            }
    
    return {"offers": offers}

@router.post("/offers/{offer_id}/accept")
async def accept_offer(
    offer_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Accept an offer"""
    user = await get_current_user(authorization, request)
    
    offer = await db.offers.find_one({"offer_id": offer_id}, {"_id": 0})
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    # Verify user owns the request
    service_request = await db.requests.find_one({"request_id": offer["request_id"]}, {"_id": 0})
    if service_request["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update offer status
    await db.offers.update_one(
        {"offer_id": offer_id},
        {"$set": {"status": "accepted"}}
    )
    
    # Update request status
    await db.requests.update_one(
        {"request_id": offer["request_id"]},
        {"$set": {"status": RequestStatus.IN_PROGRESS}}
    )
    
    return {"message": "Offer accepted"}

# ==================== BOOKING ROUTES ====================

