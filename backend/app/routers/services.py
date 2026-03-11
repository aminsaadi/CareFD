from fastapi import APIRouter, HTTPException, Header, Request
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid

from app.database import db
from app.models import Service, ServiceCreate, ServiceCategory
from app.utils import get_current_user, send_email_async, create_notification
from app.routers.subscriptions import DEFAULT_PLANS

router = APIRouter()

@router.post("/services")
async def create_service(
    service_data: ServiceCreate,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Create a new service"""
    user = await get_current_user(authorization, request)
    
    # Get provider
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Check subscription service limit
    tier = provider.get("subscription_tier", "free")
    plan = await db.subscription_plans.find_one({"tier": tier}, {"_id": 0})
    if not plan:
        plan = DEFAULT_PLANS[0]
    max_services = plan.get("max_services", 1)
    if max_services != -1:
        current_count = await db.services.count_documents({"provider_id": provider["provider_id"]})
        if current_count >= max_services:
            raise HTTPException(
                status_code=403,
                detail=f"הגעת למגבלת השירותים במנוי שלך ({max_services}). שדרג את המנוי כדי להוסיף שירותים נוספים."
            )
    
    service = Service(
        provider_id=provider["provider_id"],
        **service_data.model_dump()
    )
    
    service_dict = service.model_dump()
    service_dict['created_at'] = service_dict['created_at'].isoformat()
    service_dict['updated_at'] = service_dict['updated_at'].isoformat()
    
    await db.services.insert_one(service_dict)
    if "_id" in service_dict:
        del service_dict["_id"]
    
    return service_dict

@router.put("/services/{service_id}")
async def update_service(
    service_id: str,
    service_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Update a service"""
    user = await get_current_user(authorization, request)
    
    # Get service
    service = await db.services.find_one({"service_id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Get provider and verify ownership
    provider = await db.providers.find_one({"provider_id": service["provider_id"]}, {"_id": 0})
    if not provider or provider["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Build update data
    allowed_fields = [
        "name", "description", "service_category", "delivery_types",
        "pricing_type", "price", "minimum_hours", "duration_minutes",
        "weekend_pricing_type", "weekend_price_addition",
        "has_travel_cost", "travel_cost", "travel_cost_per_km",
        "has_shipping", "shipping_cost", "free_shipping_above",
        "stock_quantity", "is_active"
    ]
    update_data = {k: v for k, v in service_data.items() if k in allowed_fields}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.services.update_one(
        {"service_id": service_id},
        {"$set": update_data}
    )
    
    return {"message": "Service updated successfully"}

@router.delete("/services/{service_id}")
async def delete_service(
    service_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Delete a service (provider-level)"""
    user = await get_current_user(authorization, request)
    
    # Get service
    service = await db.services.find_one({"service_id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Get provider and verify ownership
    provider = await db.providers.find_one({"provider_id": service["provider_id"]}, {"_id": 0})
    if not provider or provider["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Delete the service
    result = await db.services.delete_one({"service_id": service_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return {"message": "Service deleted successfully"}

@router.get("/services")
async def search_services(
    service_type: Optional[str] = None,
    specialization: Optional[str] = None,
    city: Optional[str] = None,
    max_price: Optional[float] = None,
    skip: int = 0,
    limit: int = 20
):
    """Search services"""
    # Build query
    service_query = {"is_active": True}
    if service_type:
        service_query["service_type"] = service_type
    if max_price:
        service_query["price"] = {"$lte": max_price}
    
    # Get services
    services = await db.services.find(service_query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    # Enhance with provider info
    for service in services:
        provider = await db.providers.find_one({"provider_id": service["provider_id"]}, {"_id": 0})
        if provider:
            service["provider"] = {
                "provider_id": provider["provider_id"],
                "business_name": provider.get("business_name"),
                "rating": provider.get("rating", 0),
                "location": provider.get("location")
            }
    
    # Apply additional filters
    if specialization:
        services = [s for s in services if s.get("provider", {}).get("specializations") and specialization in s["provider"]["specializations"]]
    
    if city:
        services = [s for s in services if s.get("provider", {}).get("location", {}).get("city") == city]
    
    total = len(services)
    
    return {
        "services": services,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/services/my")
async def get_my_services(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Get services for current provider"""
    user = await get_current_user(authorization, request)
    
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    services = await db.services.find(
        {"provider_id": provider["provider_id"], "is_active": True},
        {"_id": 0}
    ).to_list(100)
    
    return {"services": services}

# ==================== REQUEST & OFFER ROUTES ====================

