from fastapi import APIRouter, HTTPException, Header, Request
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid
import asyncio
import re
import logging

from app.database import db
from app.models import (
    ServiceRequest, RequestCreate, RequestUpdate, RequestCancel, RequestStatus,
    Offer, OfferCreate, OfferStatus, NotificationType,
    Booking, BookingStatus, ChatRoom
)
from app.utils import get_current_user, send_email_async, create_notification, send_push_to_user

logger = logging.getLogger(__name__)

router = APIRouter()


# ==================== REQUEST ROUTES ====================

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
    if req_dict.get('preferred_date'):
        req_dict['preferred_date'] = req_dict['preferred_date'].isoformat()

    await db.requests.insert_one(req_dict)

    # Notify matching providers in background
    asyncio.create_task(
        _notify_matching_providers(service_request, user.get("name", "משתמש"))
    )

    return service_request.model_dump()


async def _notify_matching_providers(service_request: ServiceRequest, requester_name: str):
    """Find providers matching the request professions/specialization and notify them."""
    try:
        query = {"is_verified": True}
        conditions = []

        # Match by professions list (new field)
        professions = service_request.professions
        if professions and len(professions) > 0:
            conditions.append({"$or": [
                {"profession_id": {"$in": professions}},
                {"profession_name": {"$in": professions}},
                {"specialization_id": {"$in": professions}},
                {"specialization_name": {"$in": professions}},
                {"specializations": {"$in": professions}},
            ]})

        # Fallback: match by legacy specialization field
        spec = service_request.specialization
        if spec and not professions:
            conditions.append({"$or": [
                {"specializations": {"$in": [spec]}},
                {"specialization_name": spec},
                {"specialization_id": spec},
                {"profession_name": spec},
            ]})

        if service_request.service_type:
            conditions.append({"service_types": {"$in": [service_request.service_type]}})

        if service_request.provider_type:
            conditions.append({"provider_type": service_request.provider_type})

        if conditions:
            query["$and"] = conditions

        # Limit to 50 providers to avoid flooding
        providers = await db.providers.find(query, {"_id": 0, "user_id": 1, "business_name": 1}).to_list(50)

        if not providers:
            # Fallback: broader match on professions or specialization text
            fallback_or = []
            if professions and len(professions) > 0:
                for prof in professions:
                    escaped_prof = re.escape(prof)
                    fallback_or.extend([
                        {"profession_name": {"$regex": escaped_prof, "$options": "i"}},
                        {"specialization_name": {"$regex": escaped_prof, "$options": "i"}},
                        {"specializations": {"$regex": escaped_prof, "$options": "i"}},
                    ])
            elif spec:
                escaped_spec = re.escape(spec)
                fallback_or = [
                    {"specializations": {"$regex": escaped_spec, "$options": "i"}},
                    {"specialization_name": {"$regex": escaped_spec, "$options": "i"}},
                    {"profession_name": {"$regex": escaped_spec, "$options": "i"}},
                ]

            if fallback_or:
                fallback_query = {"is_verified": True, "$or": fallback_or}
                providers = await db.providers.find(fallback_query, {"_id": 0, "user_id": 1, "business_name": 1}).to_list(50)

        title_text = service_request.title
        urgency_labels = {"urgent": "דחוף", "high": "גבוהה", "medium": "בינונית", "low": "נמוכה"}
        urgency_label = urgency_labels.get(service_request.urgency, "")
        urgency_suffix = f" ({urgency_label})" if urgency_label else ""

        notified_user_ids = set()
        for provider in providers:
            uid = provider["user_id"]
            if uid == service_request.user_id or uid in notified_user_ids:
                continue
            notified_user_ids.add(uid)

            await create_notification(
                uid,
                NotificationType.REQUEST_NEW,
                "בקשה חדשה שמתאימה לך!",
                f"{requester_name} פרסם בקשה: \"{title_text}\"{urgency_suffix}",
                {"request_id": service_request.request_id}
            )
            await send_push_to_user(
                uid,
                "בקשה חדשה שמתאימה לך!",
                f"\"{title_text}\"{urgency_suffix}",
                {"request_id": service_request.request_id, "type": "request_new"}
            )

        logger.info(f"Notified {len(notified_user_ids)} providers about new request {service_request.request_id}")
    except Exception as e:
        logger.error(f"Failed to notify providers for request {service_request.request_id}: {e}")


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

    requests_list = await db.requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)

    return {"requests": requests_list}


@router.get("/requests/{request_id}")
async def get_request(
    request_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Get a specific request - requires authentication"""
    user = await get_current_user(authorization, request)

    request_doc = await db.requests.find_one({"request_id": request_id}, {"_id": 0})
    if not request_doc:
        raise HTTPException(status_code=404, detail="Request not found")

    # Authorization: allow owner, providers, and admins
    is_owner = request_doc["user_id"] == user["user_id"]
    is_provider = user.get("role") == "provider"
    is_admin = user.get("role") == "admin"
    if not (is_owner or is_provider or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized to view this request")

    # Enrich with user info (exclude sensitive fields like email)
    req_user = await db.users.find_one({"user_id": request_doc["user_id"]}, {"_id": 0, "name": 1, "picture": 1})
    if req_user:
        request_doc["user_name"] = req_user.get("name")
        request_doc["user_picture"] = req_user.get("picture")

    return request_doc


@router.get("/requests")
async def get_requests(
    status: Optional[str] = None,
    specialization: Optional[str] = None,
    urgency: Optional[str] = None,
    request_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Get service requests - requires authentication"""
    await get_current_user(authorization, request)
    query = {}
    if status:
        query["status"] = status
    else:
        query["status"] = RequestStatus.OPEN

    if specialization:
        query["$or"] = [
            {"specialization": specialization},
            {"professions": {"$in": [specialization]}}
        ]
    if urgency:
        query["urgency"] = urgency
    if request_type:
        query["request_type"] = request_type

    requests = await db.requests.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.requests.count_documents(query)

    return {
        "requests": requests,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.put("/requests/{request_id}")
async def update_request(
    request_id: str,
    update_data: RequestUpdate,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Update a request (only when status is open)"""
    user = await get_current_user(authorization, request)

    service_request = await db.requests.find_one({"request_id": request_id}, {"_id": 0})
    if not service_request:
        raise HTTPException(status_code=404, detail="Request not found")

    if service_request["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    if service_request["status"] != RequestStatus.OPEN:
        raise HTTPException(status_code=400, detail="Can only update open requests")

    # Build update dict from non-None fields
    updates = {}
    for field, value in update_data.model_dump(exclude_none=True).items():
        if field == "location" and value:
            updates[field] = dict(value) if hasattr(value, '__dict__') else value
        elif field == "preferred_date" and value:
            updates[field] = value.isoformat()
        else:
            updates[field] = value

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.requests.update_one(
        {"request_id": request_id},
        {"$set": updates}
    )

    updated = await db.requests.find_one({"request_id": request_id}, {"_id": 0})
    return updated


@router.put("/requests/{request_id}/cancel")
async def cancel_request(
    request_id: str,
    cancel_data: RequestCancel,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Cancel a request and reject all pending offers"""
    user = await get_current_user(authorization, request)

    service_request = await db.requests.find_one({"request_id": request_id}, {"_id": 0})
    if not service_request:
        raise HTTPException(status_code=404, detail="Request not found")

    if service_request["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    if service_request["status"] != RequestStatus.OPEN:
        raise HTTPException(status_code=400, detail="Can only cancel open requests")

    now = datetime.now(timezone.utc)

    # Cancel the request
    await db.requests.update_one(
        {"request_id": request_id},
        {"$set": {
            "status": RequestStatus.CANCELLED,
            "cancelled_at": now.isoformat(),
            "cancellation_reason": cancel_data.reason,
            "updated_at": now.isoformat()
        }}
    )

    # Reject all pending offers
    pending_offers = await db.offers.find(
        {"request_id": request_id, "status": OfferStatus.PENDING},
        {"_id": 0}
    ).to_list(100)

    await db.offers.update_many(
        {"request_id": request_id, "status": OfferStatus.PENDING},
        {"$set": {"status": OfferStatus.REJECTED, "rejected_at": now.isoformat()}}
    )

    # Notify all providers with pending offers
    for offer in pending_offers:
        provider = await db.providers.find_one({"provider_id": offer["provider_id"]}, {"_id": 0})
        if provider:
            await create_notification(
                provider["user_id"],
                NotificationType.REQUEST_CANCELLED,
                "בקשה בוטלה",
                f"הבקשה \"{service_request['title']}\" בוטלה על ידי המבקש",
                {"request_id": request_id, "offer_id": offer["offer_id"]}
            )
            await send_push_to_user(
                provider["user_id"],
                "בקשה בוטלה",
                f"הבקשה \"{service_request['title']}\" בוטלה",
                {"request_id": request_id, "type": "request_cancelled"}
            )

    return {"message": "Request cancelled"}


@router.put("/requests/{request_id}/complete")
async def complete_request(
    request_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Mark a request as completed"""
    user = await get_current_user(authorization, request)

    service_request = await db.requests.find_one({"request_id": request_id}, {"_id": 0})
    if not service_request:
        raise HTTPException(status_code=404, detail="Request not found")

    if service_request["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    if service_request["status"] != RequestStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Can only complete in-progress requests")

    now = datetime.now(timezone.utc)
    await db.requests.update_one(
        {"request_id": request_id},
        {"$set": {
            "status": RequestStatus.COMPLETED,
            "updated_at": now.isoformat()
        }}
    )

    return {"message": "Request completed"}


# ==================== OFFER ROUTES ====================

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

    # Check request exists and is open
    service_request = await db.requests.find_one({"request_id": offer_data.request_id}, {"_id": 0})
    if not service_request:
        raise HTTPException(status_code=404, detail="Request not found")

    if service_request["status"] != RequestStatus.OPEN:
        raise HTTPException(status_code=400, detail="Request is no longer open for offers")

    # Prevent duplicate offers from same provider
    existing_offer = await db.offers.find_one({
        "request_id": offer_data.request_id,
        "provider_id": provider["provider_id"],
        "status": {"$in": [OfferStatus.PENDING, OfferStatus.ACCEPTED]}
    })
    if existing_offer:
        raise HTTPException(status_code=400, detail="You already have an active offer on this request")

    offer = Offer(
        provider_id=provider["provider_id"],
        provider_name=provider.get("business_name"),
        provider_picture=provider.get("profile_image"),
        **offer_data.model_dump()
    )

    offer_dict = offer.model_dump()
    offer_dict['created_at'] = offer_dict['created_at'].isoformat()

    await db.offers.insert_one(offer_dict)

    # Increment offer count on request
    await db.requests.update_one(
        {"request_id": offer_data.request_id},
        {
            "$inc": {"offer_count": 1},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )

    # Notify request owner
    await create_notification(
        service_request["user_id"],
        NotificationType.OFFER_NEW,
        "הצעה חדשה!",
        f"{provider.get('business_name', 'ספק')} הגיש הצעה על הבקשה \"{service_request['title']}\" - ₪{offer.price}",
        {"request_id": offer_data.request_id, "offer_id": offer.offer_id}
    )
    await send_push_to_user(
        service_request["user_id"],
        "הצעה חדשה!",
        f"{provider.get('business_name', 'ספק')} הגיש הצעה - ₪{offer.price}",
        {"request_id": offer_data.request_id, "type": "offer_new"}
    )

    return offer.model_dump()


@router.get("/offers/my")
async def get_my_offers(
    authorization: Optional[str] = Header(None),
    request: Request = None,
    status: Optional[str] = None
):
    """Get current provider's offers"""
    user = await get_current_user(authorization, request)

    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=403, detail="Only providers can view their offers")

    query = {"provider_id": provider["provider_id"]}
    if status:
        query["status"] = status

    offers = await db.offers.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)

    # Enrich with request info
    for offer in offers:
        req = await db.requests.find_one({"request_id": offer["request_id"]}, {"_id": 0})
        if req:
            offer["request"] = {
                "request_id": req["request_id"],
                "title": req.get("title"),
                "status": req.get("status"),
                "budget": req.get("budget")
            }

    return {"offers": offers}


@router.get("/requests/{request_id}/offers")
async def get_request_offers(
    request_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Get offers for a request - owner sees all, providers see only their own"""
    user = None
    try:
        user = await get_current_user(authorization, request)
    except Exception:
        pass

    # Get the request to check ownership
    service_request = await db.requests.find_one({"request_id": request_id}, {"_id": 0})
    if not service_request:
        raise HTTPException(status_code=404, detail="Request not found")

    is_owner = user and user["user_id"] == service_request["user_id"]

    if is_owner:
        # Owner sees all offers
        offers = await db.offers.find({"request_id": request_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    elif user:
        # Providers see only their own offer
        provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
        if provider:
            offers = await db.offers.find(
                {"request_id": request_id, "provider_id": provider["provider_id"]},
                {"_id": 0}
            ).to_list(10)
        else:
            offers = []
    else:
        # Non-authenticated users see no offers
        offers = []

    # Enhance with provider info
    for offer in offers:
        provider = await db.providers.find_one({"provider_id": offer["provider_id"]}, {"_id": 0})
        if provider:
            offer["provider"] = {
                "provider_id": provider["provider_id"],
                "business_name": provider.get("business_name"),
                "rating": provider.get("rating", 0),
                "total_reviews": provider.get("total_reviews", 0),
                "specialization_name": provider.get("specialization_name"),
                "profile_image": provider.get("profile_image"),
                "is_verified": provider.get("is_verified", False)
            }

    return {"offers": offers}


@router.post("/offers/{offer_id}/accept")
async def accept_offer(
    offer_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Accept an offer - creates Booking, ChatRoom, sends notifications. Request stays open for other offers."""
    user = await get_current_user(authorization, request)

    # Atomically claim the offer to prevent race conditions
    claim_result = await db.offers.update_one(
        {"offer_id": offer_id, "status": OfferStatus.PENDING},
        {"$set": {"status": OfferStatus.ACCEPTED}}
    )
    if claim_result.matched_count == 0:
        offer_check = await db.offers.find_one({"offer_id": offer_id}, {"_id": 0})
        if not offer_check:
            raise HTTPException(status_code=404, detail="Offer not found")
        raise HTTPException(status_code=400, detail="Offer is no longer pending")

    offer = await db.offers.find_one({"offer_id": offer_id}, {"_id": 0})

    # Verify user owns the request
    service_request = await db.requests.find_one({"request_id": offer["request_id"]}, {"_id": 0})
    if not service_request:
        # Revert offer status
        await db.offers.update_one({"offer_id": offer_id}, {"$set": {"status": OfferStatus.PENDING}})
        raise HTTPException(status_code=404, detail="Request not found")

    if service_request["user_id"] != user["user_id"]:
        await db.offers.update_one({"offer_id": offer_id}, {"$set": {"status": OfferStatus.PENDING}})
        raise HTTPException(status_code=403, detail="Not authorized")

    now = datetime.now(timezone.utc)

    # Get provider info and verify they're still verified
    provider = await db.providers.find_one({"provider_id": offer["provider_id"]}, {"_id": 0})
    if not provider:
        await db.offers.update_one({"offer_id": offer_id}, {"$set": {"status": OfferStatus.PENDING}})
        raise HTTPException(status_code=404, detail="Provider not found")

    if not provider.get("is_verified") and provider.get("verification_status") != "verified":
        await db.offers.update_one({"offer_id": offer_id}, {"$set": {"status": OfferStatus.PENDING}})
        raise HTTPException(status_code=400, detail="הספק אינו מאומת יותר")

    # Resolve service info if suggested_service_id exists
    service = None
    service_id = offer.get("suggested_service_id") or f"from_request_{service_request['request_id']}"
    service_name = service_request["title"]
    if offer.get("suggested_service_id"):
        service = await db.services.find_one({"service_id": offer["suggested_service_id"]}, {"_id": 0})
        if service:
            service_name = service.get("name", service_name)

    # 1. Create Booking
    booking = Booking(
        user_id=user["user_id"],
        provider_id=offer["provider_id"],
        service_id=service_id,
        service_name=service_name,
        service_category=service.get("service_category") if service else None,
        client_name=user.get("name"),
        client_phone=user.get("phone"),
        client_email=user.get("email"),
        booking_date=service_request.get("preferred_date") if isinstance(service_request.get("preferred_date"), datetime) else None,
        base_price=offer["price"],
        final_price=offer["price"],
        notes=service_request.get("preferences"),
        provider_name=provider.get("business_name"),
        user_name=user.get("name")
    )

    booking_dict = booking.model_dump()
    booking_dict['created_at'] = booking_dict['created_at'].isoformat()
    if booking_dict.get('booking_date'):
        booking_dict['booking_date'] = booking_dict['booking_date'].isoformat()

    await db.bookings.insert_one(booking_dict)

    # 2. Create or update ChatRoom
    existing_room = await db.chat_rooms.find_one({
        "user_id": user["user_id"],
        "provider_id": offer["provider_id"]
    }, {"_id": 0})

    if existing_room:
        room_id = existing_room["room_id"]
        await db.chat_rooms.update_one(
            {"room_id": room_id},
            {"$set": {
                "request_id": service_request["request_id"],
                "booking_id": booking.booking_id
            }}
        )
    else:
        chat_room = ChatRoom(
            user_id=user["user_id"],
            provider_id=offer["provider_id"],
            request_id=service_request["request_id"],
            booking_id=booking.booking_id
        )
        room_dict = chat_room.model_dump()
        room_dict['created_at'] = room_dict['created_at'].isoformat()
        if room_dict.get('last_message_at'):
            room_dict['last_message_at'] = room_dict['last_message_at'].isoformat()
        await db.chat_rooms.insert_one(room_dict)
        room_id = chat_room.room_id

    # 3. Update accepted offer with acceptance timestamp
    await db.offers.update_one(
        {"offer_id": offer_id},
        {"$set": {"status": OfferStatus.ACCEPTED, "accepted_at": now.isoformat()}}
    )

    # 4. Update request - add booking to list, transition to in_progress
    await db.requests.update_one(
        {"request_id": offer["request_id"]},
        {
            "$push": {"booking_ids": booking.booking_id, "accepted_offer_ids": offer_id},
            "$set": {
                "status": RequestStatus.IN_PROGRESS,
                "accepted_offer_id": offer_id,
                "booking_id": booking.booking_id,
                "accepted_at": now.isoformat(),
                "updated_at": now.isoformat()
            }
        }
    )

    # 5. Notify accepted provider
    await create_notification(
        provider["user_id"],
        NotificationType.OFFER_ACCEPTED,
        "ההצעה שלך התקבלה!",
        f"ההצעה שלך על \"{service_request['title']}\" התקבלה! נוצרה הזמנה חדשה.",
        {
            "request_id": service_request["request_id"],
            "offer_id": offer_id,
            "booking_id": booking.booking_id,
            "room_id": room_id
        }
    )
    await send_push_to_user(
        provider["user_id"],
        "ההצעה שלך התקבלה!",
        f"ההצעה שלך על \"{service_request['title']}\" התקבלה!",
        {"booking_id": booking.booking_id, "type": "offer_accepted"}
    )

    return {
        "message": "Offer accepted",
        "booking_id": booking.booking_id,
        "booking_number": booking.booking_number,
        "room_id": room_id
    }


@router.post("/offers/{offer_id}/reject")
async def reject_offer(
    offer_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Reject a single offer (by request owner)"""
    user = await get_current_user(authorization, request)

    offer = await db.offers.find_one({"offer_id": offer_id}, {"_id": 0})
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    if offer["status"] != OfferStatus.PENDING:
        raise HTTPException(status_code=400, detail="Offer is no longer pending")

    service_request = await db.requests.find_one({"request_id": offer["request_id"]}, {"_id": 0})
    if service_request["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    now = datetime.now(timezone.utc)

    await db.offers.update_one(
        {"offer_id": offer_id},
        {"$set": {"status": OfferStatus.REJECTED, "rejected_at": now.isoformat()}}
    )

    # Notify provider
    provider = await db.providers.find_one({"provider_id": offer["provider_id"]}, {"_id": 0})
    if provider:
        await create_notification(
            provider["user_id"],
            NotificationType.OFFER_REJECTED,
            "ההצעה נדחתה",
            f"ההצעה שלך על \"{service_request['title']}\" נדחתה.",
            {"request_id": offer["request_id"], "offer_id": offer_id}
        )
        await send_push_to_user(
            provider["user_id"],
            "ההצעה נדחתה",
            f"ההצעה שלך על \"{service_request['title']}\" נדחתה.",
            {"request_id": offer["request_id"], "type": "offer_rejected"}
        )

    return {"message": "Offer rejected"}


@router.post("/offers/{offer_id}/withdraw")
async def withdraw_offer(
    offer_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Withdraw own offer (by provider)"""
    user = await get_current_user(authorization, request)

    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=403, detail="Only providers can withdraw offers")

    offer = await db.offers.find_one({"offer_id": offer_id}, {"_id": 0})
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    if offer["provider_id"] != provider["provider_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    if offer["status"] != OfferStatus.PENDING:
        raise HTTPException(status_code=400, detail="Can only withdraw pending offers")

    now = datetime.now(timezone.utc)

    await db.offers.update_one(
        {"offer_id": offer_id},
        {"$set": {"status": OfferStatus.WITHDRAWN, "withdrawn_at": now.isoformat()}}
    )

    # Decrement offer count on request
    await db.requests.update_one(
        {"request_id": offer["request_id"]},
        {"$inc": {"offer_count": -1}}
    )

    # Notify request owner
    service_request = await db.requests.find_one({"request_id": offer["request_id"]}, {"_id": 0})
    if service_request:
        await create_notification(
            service_request["user_id"],
            NotificationType.OFFER_WITHDRAWN,
            "הצעה נמשכה",
            f"{provider.get('business_name', 'ספק')} משך את ההצעה על \"{service_request['title']}\"",
            {"request_id": offer["request_id"], "offer_id": offer_id}
        )

    return {"message": "Offer withdrawn"}
