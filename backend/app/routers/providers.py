from fastapi import APIRouter, HTTPException, Header, Request, UploadFile, File
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid
import re
from pathlib import Path

from app.database import db, UPLOAD_DIR
from app.models import (Provider, ProviderRegister, VerificationDocument, VerificationStatus, NotificationType, UserRole,
    PROFESSION_TITLES, GENDER_OPTIONS, LANGUAGE_OPTIONS, TARGET_AUDIENCE_OPTIONS, SHIFT_DEFINITIONS)
from app.utils import get_current_user, send_email_async, create_notification, calculate_distance
from app.localities import ISRAEL_LOCALITIES, ALL_LOCALITIES, get_locality_coords, search_localities, get_all_localities, REGION_CENTERS, get_region_info, get_cities_in_region

router = APIRouter()

@router.post("/providers")
async def create_provider(provider_data: ProviderRegister, authorization: Optional[str] = Header(None), request: Request = None):
    """Register as a provider"""
    user = await get_current_user(authorization, request)
    
    # Check if provider already exists
    existing = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Provider already exists")
    
    # Create provider with pending verification status
    provider = Provider(
        user_id=user["user_id"],
        provider_type=provider_data.provider_type,
        business_name=provider_data.business_name,
        description=provider_data.description,
        specializations=provider_data.specializations,
        location=provider_data.location,
        verification_status=VerificationStatus.PENDING,
        is_verified=False
    )
    
    provider_dict = provider.model_dump()
    provider_dict['created_at'] = provider_dict['created_at'].isoformat()
    if provider_dict.get('location'):
        provider_dict['location'] = dict(provider_dict['location'])
    provider_dict['verification_documents'] = []
    
    await db.providers.insert_one(provider_dict)
    
    # Update user role
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"role": UserRole.PROVIDER}}
    )
    
    # Notify all admins about new provider registration
    admins = await db.users.find({"role": "admin"}, {"user_id": 1}).to_list(100)
    for admin in admins:
        await create_notification(
            admin["user_id"],
            NotificationType.PROVIDER_NEW_REGISTRATION,
            "ספק חדש נרשם!",
            f"ספק חדש נרשם למערכת: {provider_data.business_name or user.get('name', 'ספק')}. נדרש אימות.",
            {"provider_id": provider.provider_id, "user_id": user["user_id"]}
        )
    
    return provider.model_dump(exclude={"created_at": False})

@router.get("/providers/me")
async def get_my_provider(authorization: Optional[str] = Header(None), request: Request = None):
    """Get current user's provider profile"""
    user = await get_current_user(authorization, request)
    
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    return provider

@router.post("/providers/documents")
async def upload_verification_document(
    body: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Upload a verification document"""
    user = await get_current_user(authorization, request)
    
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    document_type = body.get("document_type")  # id_card, license, certificate, diploma
    file_url = body.get("file_url")
    file_name = body.get("file_name")
    
    if not document_type or not file_url:
        raise HTTPException(status_code=400, detail="Document type and file URL required")
    
    valid_types = ["id_card", "license", "certificate", "diploma", "other"]
    if document_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid document type. Must be one of: {valid_types}")
    
    document = VerificationDocument(
        document_type=document_type,
        file_url=file_url,
        file_name=file_name or f"{document_type}.pdf"
    )
    
    doc_dict = document.model_dump()
    doc_dict['uploaded_at'] = doc_dict['uploaded_at'].isoformat()
    
    # Add document to provider's documents list
    await db.providers.update_one(
        {"provider_id": provider["provider_id"]},
        {
            "$push": {"verification_documents": doc_dict},
            "$set": {"verification_status": VerificationStatus.DOCUMENTS_SUBMITTED}
        }
    )
    
    # Notify admins
    admins = await db.users.find({"role": "admin"}, {"user_id": 1}).to_list(100)
    for admin in admins:
        await create_notification(
            admin["user_id"],
            NotificationType.PROVIDER_DOCUMENTS_SUBMITTED,
            "מסמכי אימות הועלו",
            f"הספק {provider.get('business_name', 'ספק')} העלה מסמכי אימות לבדיקה.",
            {"provider_id": provider["provider_id"]}
        )
    
    return {"message": "Document uploaded successfully", "document": doc_dict}

@router.get("/providers/documents")
async def get_my_documents(authorization: Optional[str] = Header(None), request: Request = None):
    """Get current provider's verification documents"""
    user = await get_current_user(authorization, request)
    
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    return {
        "documents": provider.get("verification_documents", []),
        "verification_status": provider.get("verification_status", "pending"),
        "verification_notes": provider.get("verification_notes")
    }

@router.get("/providers/{provider_id}")
async def get_provider(provider_id: str):
    """Get provider details"""
    provider = await db.providers.find_one({"provider_id": provider_id}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    # Increment view count
    await db.providers.update_one(
        {"provider_id": provider_id},
        {"$inc": {"views_count": 1}}
    )

    # Resolve profession name from professions collection (in case it was renamed)
    if provider.get("profession_id"):
        profession = await db.professions.find_one(
            {"profession_id": provider["profession_id"]},
            {"_id": 0, "name": 1}
        )
        if profession and profession.get("name"):
            provider["profession_name"] = profession["name"]

    # Get services
    services = await db.services.find({"provider_id": provider_id, "is_active": True}, {"_id": 0}).to_list(100)
    provider['services_list'] = services

    return provider

@router.get("/providers")
async def search_providers(
    # Text search
    search: Optional[str] = None,
    # Location filters
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius_km: Optional[float] = None,
    city: Optional[str] = None,
    # Category filters
    specialization: Optional[str] = None,
    specializations: Optional[str] = None,  # comma-separated list
    category: Optional[str] = None,
    # Rating filter
    min_rating: Optional[float] = None,
    # Provider filters
    provider_type: Optional[str] = None,
    service_type: Optional[str] = None,  # home_visit, clinic_visit, video_call, phone_call
    # Experience filter (years)
    min_experience: Optional[int] = None,
    # Verification filters
    verified_only: Optional[bool] = False,
    recommended_only: Optional[bool] = False,
    # Pagination
    skip: int = 0,
    limit: int = 20,
    # Sorting
    sort_by: Optional[str] = "rating",  # rating, distance, reviews
    sort_order: Optional[str] = "desc"
):
    """Advanced search for providers with filters"""
    query = {"$and": []}
    
    # Only show verified providers in public search
    # Use $or to handle legacy data where only one field may be set
    query["$and"].append({
        "$or": [
            {"is_verified": True},
            {"verification_status": "verified"}
        ]
    })
    
    # Text search in business_name, description, profession, and specializations
    if search:
        safe_search = re.escape(search)
        search_or = [
            {"business_name": {"$regex": safe_search, "$options": "i"}},
            {"description": {"$regex": safe_search, "$options": "i"}},
            {"specializations": {"$regex": safe_search, "$options": "i"}},
            # Search in new hierarchy fields
            {"profession_name": {"$regex": safe_search, "$options": "i"}},
            {"specialization_name": {"$regex": safe_search, "$options": "i"}},
            {"expertise": {"$regex": safe_search, "$options": "i"}},
            {"service_categories.name": {"$regex": safe_search, "$options": "i"}},
        ]

        # Map Hebrew search terms to profession_title values (legacy support)
        matched_profession_values = []
        search_lower = search.strip()
        for prof in PROFESSION_TITLES:
            if search_lower in prof["label"] or prof["label"] in search_lower:
                matched_profession_values.append(prof["value"])
                continue
            for term in prof.get("search_terms", []):
                if search_lower in term or term in search_lower:
                    matched_profession_values.append(prof["value"])
                    break

        if matched_profession_values:
            search_or.append({"profession_title": {"$in": matched_profession_values}})

        search_or.append({"profession_title": {"$regex": safe_search, "$options": "i"}})

        query["$and"].append({"$or": search_or})

    # City / Region filter - check both provider location AND service_areas
    # When lat/lng/radius are provided, skip city text filter - distance filtering replaces it
    use_geo_filter = latitude is not None and longitude is not None and radius_km is not None
    if city and not use_geo_filter:
        region_info = get_region_info(city)
        if region_info:
            # It's a region - match provider's city OR service_areas
            region_cities = get_cities_in_region(city)
            region_tag = f"אזור: {city}"
            if region_cities:
                query["$and"].append({"$or": [
                    {"location.city": {"$in": region_cities}},
                    {"service_areas": {"$in": region_cities + [region_tag]}},
                ]})
            else:
                query["$and"].append({"$or": [
                    {"location.city": {"$regex": re.escape(city), "$options": "i"}},
                    {"service_areas": {"$regex": re.escape(city), "$options": "i"}},
                ]})
        else:
            # It's a specific city name - match location OR service_areas
            safe_city = re.escape(city)
            query["$and"].append({"$or": [
                {"location.city": {"$regex": safe_city, "$options": "i"}},
                {"service_areas": {"$regex": f"^{safe_city}$", "$options": "i"}},
            ]})
    
    # Specialization filter (single)
    if specialization:
        query["$and"].append({"$or": [
            {"specializations": {"$in": [specialization]}},
            {"specialization_name": specialization},
            {"specialization_id": specialization},
        ]})

    # Multiple specializations filter
    if specializations:
        spec_list = [s.strip() for s in specializations.split(",")]
        query["$and"].append({"$or": [
            {"specializations": {"$in": spec_list}},
            {"specialization_name": {"$in": spec_list}},
        ]})

    # Category filter - search by profession_id or profession_name
    if category:
        query["$and"].append({"$or": [
            {"profession_id": category},
            {"profession_name": {"$regex": re.escape(category), "$options": "i"}},
            {"service_categories.category_id": category},
            {"service_categories.profession_id": category},
            # Legacy fallback
            {"specializations": {"$regex": re.escape(category), "$options": "i"}},
        ]})
    
    # Provider type filter
    if provider_type:
        query["$and"].append({"provider_type": provider_type})

    # Service type filter (need to check services)
    if service_type:
        query["$and"].append({"service_types": {"$in": [service_type]}})

    # Rating filter
    if min_rating:
        query["$and"].append({"rating": {"$gte": min_rating}})

    # Verified filter
    if verified_only:
        query["$and"].append({"is_verified": True})

    # Recommended filter
    if recommended_only:
        query["$and"].append({"is_recommended": True})

    # Experience filter (in years)
    if min_experience:
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=min_experience * 365)
        query["$and"].append({"created_at": {"$lte": cutoff_date.isoformat()}})
    
    # Execute query
    providers = await db.providers.find(query, {"_id": 0}).to_list(1000)
    
    # Filter by distance if location provided
    if latitude is not None and longitude is not None:
        filtered_providers = []
        for provider in providers:
            if provider.get("location") and provider["location"].get("latitude") and provider["location"].get("longitude"):
                distance = calculate_distance(
                    latitude, longitude,
                    provider["location"]["latitude"],
                    provider["location"]["longitude"]
                )
                provider["distance_km"] = round(distance, 1)

                # Apply radius filter if specified
                if radius_km is None or distance <= radius_km:
                    filtered_providers.append(provider)
            elif not radius_km:
                # Include providers without coordinates if no radius filter
                provider["distance_km"] = None
                filtered_providers.append(provider)
            elif city and radius_km:
                # When radius is active but provider has no coordinates,
                # include if their city name matches the search city
                provider_city = (provider.get("location") or {}).get("city", "")
                provider_areas = provider.get("service_areas") or []
                region_info_check = get_region_info(city)
                if region_info_check:
                    region_cities_list = get_cities_in_region(city) or []
                    if provider_city in region_cities_list or any(a in region_cities_list for a in provider_areas):
                        provider["distance_km"] = None
                        filtered_providers.append(provider)
                elif (provider_city and re.search(re.escape(city), provider_city, re.IGNORECASE)) or city in provider_areas:
                    provider["distance_km"] = None
                    filtered_providers.append(provider)
        providers = filtered_providers
    
    # Sorting
    if sort_by == "distance" and latitude is not None:
        # Distance: always closest first (ascending), None values go last
        providers.sort(key=lambda x: x.get("distance_km") if x.get("distance_km") is not None else float('inf'))
    elif sort_by == "rating":
        providers.sort(key=lambda x: x.get("rating") or 0, reverse=True)
    elif sort_by == "reviews":
        providers.sort(key=lambda x: x.get("total_reviews") or 0, reverse=True)
    
    total = len(providers)
    
    # Apply pagination after filtering and sorting
    providers = providers[skip:skip + limit]

    # Resolve profession names from professions collection
    prof_ids = list({p.get("profession_id") for p in providers if p.get("profession_id")})
    if prof_ids:
        prof_docs = await db.professions.find(
            {"profession_id": {"$in": prof_ids}},
            {"_id": 0, "profession_id": 1, "name": 1}
        ).to_list(100)
        prof_name_map = {p["profession_id"]: p["name"] for p in prof_docs if p.get("name")}
        for prov in providers:
            pid = prov.get("profession_id")
            if pid and pid in prof_name_map:
                prov["profession_name"] = prof_name_map[pid]

    return {
        "providers": providers,
        "total": total,
        "skip": skip,
        "limit": limit,
        "filters_applied": {
            "search": search,
            "city": city,
            "specialization": specialization,
            "category": category,
            "provider_type": provider_type,
            "service_type": service_type,
            "min_rating": min_rating,
            "radius_km": radius_km,
            "verified_only": verified_only,
            "recommended_only": recommended_only
        }
    }

# Get available filter options
@router.get("/providers/filters/options")
async def get_filter_options():
    """Get available filter options based on existing data"""
    # Get unique cities
    cities = await db.providers.distinct("location.city")
    cities = [c for c in cities if c]
    
    # Get unique specializations
    specializations = await db.providers.distinct("specializations")
    specializations = [s for s in specializations if s]

    # Get unique provider types
    provider_types = await db.providers.distinct("provider_type")

    # Categories from admin professions hierarchy
    professions_data = await db.professions.find({}, {"_id": 0}).to_list(100)
    categories = []
    for prof in professions_data:
        categories.append({
            "id": prof.get("profession_id", ""),
            "name": prof.get("name", ""),
            "name_en": prof.get("name_en", ""),
            "icon": prof.get("icon", "briefcase"),
        })
    
    # Service types
    service_types = [
        {"id": "home_visit", "name": "ביקור בית", "name_en": "Home Visit"},
        {"id": "clinic_visit", "name": "ביקור במרפאה", "name_en": "Clinic Visit"},
        {"id": "video_call", "name": "טלרפואה", "name_en": "Video Call"},
        {"id": "phone_call", "name": "שיחה טלפונית", "name_en": "Phone Call"}
    ]
    
    # Provider types with labels
    provider_type_options = [
        {"id": "individual", "name": "עצמאי", "name_en": "Individual"},
        {"id": "clinic", "name": "מרפאה", "name_en": "Clinic"},
        {"id": "company", "name": "חברה", "name_en": "Company"}
    ]
    
    # Rating options
    rating_options = [
        {"value": 4.5, "label": "4.5+ כוכבים"},
        {"value": 4.0, "label": "4.0+ כוכבים"},
        {"value": 3.5, "label": "3.5+ כוכבים"},
        {"value": 3.0, "label": "3.0+ כוכבים"}
    ]
    
    # Experience options
    experience_options = [
        {"value": 1, "label": "שנה+"},
        {"value": 3, "label": "3 שנים+"},
        {"value": 5, "label": "5 שנים+"},
        {"value": 10, "label": "10 שנים+"}
    ]
    
    # Radius options
    radius_options = [
        {"value": 5, "label": "5 ק\"מ"},
        {"value": 10, "label": "10 ק\"מ"},
        {"value": 25, "label": "25 ק\"מ"},
        {"value": 50, "label": "50 ק\"מ"},
        {"value": 100, "label": "100 ק\"מ"}
    ]
    
    # Shift options for availability
    shift_options = [
        {"value": "morning", "label": "בוקר", "label_en": "Morning", "default_start": "06:00", "default_end": "12:00"},
        {"value": "afternoon", "label": "צהריים", "label_en": "Afternoon", "default_start": "12:00", "default_end": "18:00"},
        {"value": "evening", "label": "ערב", "label_en": "Evening", "default_start": "18:00", "default_end": "22:00"},
        {"value": "night", "label": "לילה", "label_en": "Night", "default_start": "22:00", "default_end": "06:00"},
    ]
    
    # Days of week
    days_of_week = [
        {"value": "sunday", "label": "ראשון", "label_en": "Sunday"},
        {"value": "monday", "label": "שני", "label_en": "Monday"},
        {"value": "tuesday", "label": "שלישי", "label_en": "Tuesday"},
        {"value": "wednesday", "label": "רביעי", "label_en": "Wednesday"},
        {"value": "thursday", "label": "חמישי", "label_en": "Thursday"},
        {"value": "friday", "label": "שישי", "label_en": "Friday"},
        {"value": "saturday", "label": "שבת", "label_en": "Saturday"},
    ]
    
    return {
        "cities": sorted(cities) if cities else ["תל אביב", "ירושלים", "חיפה", "באר שבע", "רמת גן", "הרצליה", "פתח תקווה"],
        "specializations": sorted(specializations) if specializations else [],
        "categories": categories,
        "professions": professions_data,  # Full hierarchy for provider forms
        "service_types": service_types,
        "provider_types": provider_type_options,
        "rating_options": rating_options,
        "experience_options": experience_options,
        "radius_options": radius_options,
        "profession_titles": PROFESSION_TITLES,
        "gender_options": GENDER_OPTIONS,
        "language_options": LANGUAGE_OPTIONS,
        "target_audience_options": TARGET_AUDIENCE_OPTIONS,
        "shift_options": shift_options,
        "days_of_week": days_of_week
    }

@router.put("/providers/{provider_id}")
async def update_provider(
    provider_id: str,
    updates: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Update provider details"""
    user = await get_current_user(authorization, request)
    
    provider = await db.providers.find_one({"provider_id": provider_id}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    if provider["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Whitelist allowed fields to prevent mass assignment attacks
    ALLOWED_FIELDS = {
        "business_name", "description", "phone", "email", "website",
        "provider_type", "location", "address", "city", "professions",
        "sub_professions", "categories", "languages", "education",
        "experience_years", "about", "specializations", "target_audiences",
        "profile_image", "cover_image", "gallery", "working_hours",
        "availability", "services", "social_links", "gender",
        "shifts", "travel_radius", "home_visit", "online_service",
        "instant_booking", "cancellation_policy", "payment_methods",
        "insurance_accepted", "certifications", "awards",
    }

    # Filter out any non-allowed fields
    filtered_updates = {k: v for k, v in updates.items() if k in ALLOWED_FIELDS}

    # Auto-geocode location if city is provided but coordinates are missing
    if "location" in filtered_updates and filtered_updates["location"]:
        loc = filtered_updates["location"]
        city_name = loc.get("city", "")
        if city_name and (not loc.get("latitude") or not loc.get("longitude")):
            coords = get_locality_coords(city_name)
            if coords:
                filtered_updates["location"]["latitude"] = coords["lat"]
                filtered_updates["location"]["longitude"] = coords["lng"]

    filtered_updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.providers.update_one(
        {"provider_id": provider_id},
        {"$set": filtered_updates}
    )
    
    return {"message": "Provider updated successfully"}

# ==================== LOCALITIES ROUTES ====================

@router.get("/localities")
async def get_localities(q: Optional[str] = None, limit: int = 500):
    """Get list of Israeli localities with coordinates"""
    all_locs = get_all_localities()
    if q:
        results = search_localities(q, limit)
    else:
        results = all_locs[:limit]
    return {"localities": results, "total": len(all_locs)}

@router.get("/localities/{city_name}/coords")
async def get_city_coords(city_name: str):
    """Get coordinates for a specific city"""
    coords = get_locality_coords(city_name)
    if not coords:
        raise HTTPException(status_code=404, detail="City not found")
    return coords

# ==================== SERVICE ROUTES ====================

