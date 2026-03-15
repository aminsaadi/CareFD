from fastapi import APIRouter, HTTPException, Header, Request
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid
import re

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
        "name", "description", "service_category", "categories", "delivery_types",
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
    search: Optional[str] = None,
    service_type: Optional[str] = None,
    service_category: Optional[str] = None,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    city: Optional[str] = None,
    region: Optional[str] = None,
    profession: Optional[str] = None,
    gender: Optional[str] = None,
    languages: Optional[str] = None,
    health_funds: Optional[str] = None,
    min_rating: Optional[float] = None,
    verified_only: Optional[bool] = None,
    recommended_only: Optional[bool] = None,
    sort_by: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
):
    """Search services with comprehensive filtering, sorting, and provider enrichment"""
    # Build MongoDB query for the services collection
    service_query = {"is_active": True}

    # Text search with $regex (case-insensitive) on service name and description
    if search:
        escaped = re.escape(search)
        service_query["$or"] = [
            {"name": {"$regex": escaped, "$options": "i"}},
            {"description": {"$regex": escaped, "$options": "i"}},
        ]

    if service_type:
        service_query["service_type"] = service_type

    if service_category:
        service_query["service_category"] = service_category

    # Price range filters
    if price_min is not None or price_max is not None:
        price_filter = {}
        if price_min is not None:
            price_filter["$gte"] = price_min
        if price_max is not None:
            price_filter["$lte"] = price_max
        service_query["price"] = price_filter

    # Total count of services matching the DB query (before provider post-filters)
    total_before_filters = await db.services.count_documents(service_query)

    # Fetch services — we may need extra documents to compensate for post-fetch
    # filtering, so fetch a larger batch when provider-level filters are active.
    has_provider_filters = any([
        city, region, profession, gender, languages, health_funds,
        min_rating, verified_only, recommended_only,
        search,  # search also checks provider business_name post-fetch
    ])

    if has_provider_filters:
        # Fetch more to account for filtering losses
        fetch_limit = (skip + limit) * 5
        raw_services = await db.services.find(service_query, {"_id": 0}).to_list(fetch_limit)
    else:
        raw_services = await db.services.find(service_query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)

    # Enrich each service with full provider info
    provider_cache = {}
    for service in raw_services:
        pid = service.get("provider_id")
        if pid and pid not in provider_cache:
            provider_cache[pid] = await db.providers.find_one({"provider_id": pid}, {"_id": 0})

        provider = provider_cache.get(pid)
        if provider:
            total_reviews = provider.get("total_reviews") or provider.get("review_count", 0)
            service["provider"] = {
                "provider_id": provider.get("provider_id"),
                "business_name": provider.get("business_name"),
                "rating": provider.get("rating", 0),
                "total_reviews": total_reviews,
                "location": provider.get("location"),
                "phone": provider.get("phone"),
                "gender": provider.get("gender"),
                "languages": provider.get("languages", []),
                "health_funds": provider.get("health_funds", []),
                "specializations": provider.get("specializations", []),
                "profession": provider.get("profession"),
                "profession_title": provider.get("profession_title"),
                "is_verified": provider.get("is_verified", False),
                "is_recommended": provider.get("is_recommended", False),
            }

    services = raw_services

    # --- Post-fetch filters (provider-related fields) ---

    # Extend text search to provider business_name
    if search:
        pattern = re.compile(re.escape(search), re.IGNORECASE)
        services = [
            s for s in services
            if pattern.search(s.get("name", "") or "")
            or pattern.search(s.get("description", "") or "")
            or pattern.search(s.get("provider", {}).get("business_name", "") or "")
        ]

    if city:
        from app.localities import get_region_info, get_cities_in_region
        region_info_svc = get_region_info(city)
        if region_info_svc:
            region_cities_svc = get_cities_in_region(city) or []
            services = [
                s for s in services
                if (s.get("provider", {}).get("location") or {}).get("city") in region_cities_svc
            ]
        else:
            city_pattern = re.compile(re.escape(city), re.IGNORECASE)
            services = [
                s for s in services
                if city_pattern.search((s.get("provider", {}).get("location") or {}).get("city") or "")
            ]

    if region:
        region_pattern = re.compile(re.escape(region), re.IGNORECASE)
        services = [
            s for s in services
            if region_pattern.search((s.get("provider", {}).get("location") or {}).get("region") or "")
        ]

    if profession:
        profession_lower = profession.lower()
        services = [
            s for s in services
            if (
                (s.get("provider", {}).get("profession") or "").lower() == profession_lower
                or profession_lower in [
                    sp.lower() for sp in s.get("provider", {}).get("specializations", [])
                ]
            )
        ]

    if gender:
        services = [
            s for s in services
            if s.get("provider", {}).get("gender") == gender
        ]

    if languages:
        required_langs = {l.strip().lower() for l in languages.split(",") if l.strip()}
        services = [
            s for s in services
            if required_langs.issubset(
                {l.lower() for l in s.get("provider", {}).get("languages", [])}
            )
        ]

    if health_funds:
        required_funds = {f.strip().lower() for f in health_funds.split(",") if f.strip()}
        services = [
            s for s in services
            if required_funds.issubset(
                {f.lower() for f in s.get("provider", {}).get("health_funds", [])}
            )
        ]

    if min_rating is not None:
        services = [
            s for s in services
            if s.get("provider", {}).get("rating", 0) >= min_rating
        ]

    if verified_only:
        services = [
            s for s in services
            if s.get("provider", {}).get("is_verified") is True
        ]

    if recommended_only:
        services = [
            s for s in services
            if s.get("provider", {}).get("is_recommended") is True
        ]

    filtered_total = len(services)

    # --- Sorting ---
    if sort_by == "price_low":
        services.sort(key=lambda s: s.get("price") or 0)
    elif sort_by == "price_high":
        services.sort(key=lambda s: s.get("price") or 0, reverse=True)
    elif sort_by == "rating":
        services.sort(key=lambda s: s.get("provider", {}).get("rating", 0), reverse=True)
    elif sort_by == "newest":
        services.sort(key=lambda s: s.get("created_at", ""), reverse=True)
    elif sort_by == "popular":
        services.sort(
            key=lambda s: s.get("provider", {}).get("total_reviews", 0), reverse=True
        )

    # Apply pagination when provider filters were used (we fetched extra earlier)
    if has_provider_filters:
        services = services[skip: skip + limit]

    return {
        "services": services,
        "total": total_before_filters,
        "filtered_total": filtered_total,
        "skip": skip,
        "limit": limit,
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

