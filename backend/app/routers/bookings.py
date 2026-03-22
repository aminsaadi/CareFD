from fastapi import APIRouter, HTTPException, Header, Request
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid

import os

from app.database import db
from app.models import Booking, BookingCreate, BookingStatus, ContactPerson, ServiceLocation, NotificationType
from app.utils import get_current_user, send_email_async, create_notification, send_push_to_user
from app.rate_limiter import rate_limiter, get_client_ip

SITE_URL = os.environ.get('SITE_URL', 'https://carefd.co.il').rstrip('/')

router = APIRouter()

@router.post("/bookings")
async def create_booking(
    booking_data: BookingCreate,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Create a booking with full details - supports both authenticated users and guests"""
    # Rate limit: 10 bookings per IP per 15 minutes
    if request:
        rate_limiter.check(f"create_booking:{get_client_ip(request)}", max_requests=10, window_seconds=900)

    # Check if this is a guest booking (must use bool() to avoid Python's and returning last truthy value)
    is_guest_booking = bool(booking_data.guest_booking and booking_data.guest_name and booking_data.guest_phone)
    
    user = None
    user_id = None
    user_name = None
    user_email = None
    
    if is_guest_booking:
        # Guest booking - no authentication required
        user_id = f"guest_{uuid.uuid4().hex[:12]}"
        user_name = booking_data.guest_name
        user_email = booking_data.guest_email
    else:
        # Authenticated booking
        try:
            user = await get_current_user(authorization, request)
            user_id = user["user_id"]
            user_name = user.get("name")
            user_email = user.get("email")
        except HTTPException:
            raise HTTPException(status_code=401, detail="Authentication required for non-guest bookings")
    
    # Get service
    service = await db.services.find_one({"service_id": booking_data.service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Get provider
    provider = await db.providers.find_one({"provider_id": service["provider_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Check if provider is verified
    if provider.get("verification_status") not in ["verified", None] and not provider.get("is_verified"):
        raise HTTPException(status_code=400, detail="Provider is not verified yet")
    
    # Check for conflicts (only when date is provided)
    if booking_data.booking_date:
        booking_date_str = booking_data.booking_date.isoformat()
        existing = await db.bookings.find_one({
            "provider_id": service["provider_id"],
            "booking_date": booking_date_str,
            "booking_time": booking_data.booking_time,
            "status": {"$in": ["pending", "confirmed", "in_progress"]}
        })
        
        if existing:
            raise HTTPException(status_code=400, detail="Time slot already booked")
    
    # Build contact person
    contact_person = None
    if booking_data.contact_person_name:
        contact_person = ContactPerson(
            name=booking_data.contact_person_name,
            phone=booking_data.contact_person_phone or booking_data.client_phone or booking_data.guest_phone,
            relationship=booking_data.contact_person_relationship
        )
    
    # Build service location
    service_location = None
    if booking_data.service_address or booking_data.guest_address:
        service_location = ServiceLocation(
            address=booking_data.service_address or booking_data.guest_address or "",
            city=booking_data.service_city or "",
            floor=booking_data.service_floor,
            apartment=booking_data.service_apartment,
            entry_code=booking_data.service_entry_code,
            notes=booking_data.service_notes,
            latitude=booking_data.service_latitude,
            longitude=booking_data.service_longitude
        )
    
    # Determine client details
    client_name = booking_data.client_name or booking_data.guest_name or user_name or "אורח"
    client_phone = booking_data.client_phone or booking_data.guest_phone or ""
    client_email = booking_data.client_email or booking_data.guest_email or user_email
    
    # Calculate pricing
    base_price = service.get("price", 0)
    hours_booked = booking_data.hours_booked
    travel_cost = 0
    weekend_addition = 0
    shipping_cost = 0
    
    # For hourly services, multiply by hours
    if service.get("service_category") == "hourly" and hours_booked:
        min_hours = service.get("minimum_hours", 1) or 1
        actual_hours = max(hours_booked, min_hours)
        base_price = base_price * actual_hours
    
    # Check if booking is on weekend (Friday after 14:00 or Saturday)
    is_weekend = False
    if booking_data.booking_date:
        booking_day = booking_data.booking_date.weekday()  # 4 = Friday, 5 = Saturday
        is_weekend = booking_day == 5 or (booking_day == 4 and booking_data.booking_time and booking_data.booking_time >= "14:00")
    
    if is_weekend and service.get("weekend_pricing_type", "none") != "none":
        weekend_pricing_type = service.get("weekend_pricing_type")
        weekend_price_addition = service.get("weekend_price_addition", 0) or 0
        
        if weekend_pricing_type == "percentage":
            weekend_addition = base_price * (weekend_price_addition / 100)
        elif weekend_pricing_type == "fixed":
            weekend_addition = weekend_price_addition
    
    # Travel cost
    if service.get("has_travel_cost") and booking_data.delivery_type == "home_visit":
        travel_cost = service.get("travel_cost", 0) or 0
    
    # Shipping cost (for products)
    if service.get("service_category") == "product" and service.get("has_shipping"):
        free_shipping_above = service.get("free_shipping_above", 0)
        if free_shipping_above and base_price >= free_shipping_above:
            shipping_cost = 0
        else:
            shipping_cost = service.get("shipping_cost", 0) or 0
    
    final_price = base_price + travel_cost + weekend_addition + shipping_cost
    
    # Build shipping address (for products)
    shipping_address = None
    if booking_data.shipping_address:
        shipping_address = ServiceLocation(
            address=booking_data.shipping_address,
            city=booking_data.shipping_city or "",
            notes=booking_data.shipping_postal_code
        )
    
    booking = Booking(
        user_id=user_id,
        provider_id=service["provider_id"],
        service_id=booking_data.service_id,
        booking_date=booking_data.booking_date,
        booking_time=booking_data.booking_time,
        service_name=service.get("name"),
        service_category=service.get("service_category"),
        delivery_type=booking_data.delivery_type,
        client_name=client_name,
        client_phone=client_phone,
        client_email=client_email,
        contact_person=contact_person,
        is_contact_same_as_requester=booking_data.is_contact_same_as_requester,
        service_location=service_location,
        shipping_address=shipping_address,
        hours_booked=hours_booked,
        selected_shift=booking_data.selected_shift,
        platform=booking_data.platform,
        num_sessions=booking_data.num_sessions,
        notes=booking_data.notes,
        special_requirements=booking_data.special_requirements,
        base_price=service.get("price", 0),
        travel_cost=travel_cost if travel_cost > 0 else None,
        weekend_addition=weekend_addition if weekend_addition > 0 else None,
        shipping_cost=shipping_cost if shipping_cost > 0 else None,
        final_price=final_price,
        provider_name=provider.get("business_name"),
        user_name=user_name or client_name,
        is_guest_booking=is_guest_booking
    )
    
    booking_dict = booking.model_dump()
    booking_dict['created_at'] = booking_dict['created_at'].isoformat()
    if booking_dict.get('booking_date'):
        booking_dict['booking_date'] = booking_dict['booking_date'].isoformat()
    if booking_dict.get('contact_person'):
        booking_dict['contact_person'] = dict(booking_dict['contact_person'])
    if booking_dict.get('service_location'):
        booking_dict['service_location'] = dict(booking_dict['service_location'])
    if booking_dict.get('shipping_address'):
        booking_dict['shipping_address'] = dict(booking_dict['shipping_address'])
    
    await db.bookings.insert_one(booking_dict)
    
    # Create notification for provider
    notification_client_name = user_name or client_name or "לקוח"
    booking_date_formatted = booking_data.booking_date.strftime('%d/%m/%Y') if booking_data.booking_date else "יתואם טלפונית"
    await create_notification(
        provider["user_id"],
        NotificationType.BOOKING_NEW,
        "הזמנה חדשה!",
        f"{notification_client_name} הזמין {service.get('name', 'שירות')} לתאריך {booking_date_formatted}",
        {"booking_id": booking.booking_id, "service_id": service["service_id"]}
    )
    await send_push_to_user(
        provider["user_id"],
        "הזמנה חדשה!",
        f"{notification_client_name} הזמין {service.get('name', 'שירות')} לתאריך {booking_date_formatted}",
        {"booking_id": booking.booking_id, "type": "booking_new"}
    )
    
    # Format booking date nicely
    booking_time_str = booking_data.booking_time or "יתואם טלפונית"
    
    # Send notification email to provider
    provider_user = await db.users.find_one({"user_id": provider["user_id"]}, {"_id": 0})
    if provider_user:
        await send_email_async(
            provider_user.get("email"),
            f"הזמנה -הזמנה חדשה #{booking.booking_number}",
            f"""
            <!DOCTYPE html>
            <html dir="rtl" lang="he">
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #00a99d, #0d5c63); color: white; padding: 30px; border-radius: 15px 15px 0 0; text-align: center;">
                    <h1 style="margin: 0;">הזמנה חדשה!</h1>
                    <p style="margin: 10px 0 0;">מספר הזמנה: {booking.booking_number}</p>
                </div>
                
                <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 15px 15px;">
                    <h2 style="color: #0d5c63; border-bottom: 2px solid #00a99d; padding-bottom: 10px;">פרטי ההזמנה</h2>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr><td style="padding: 10px 0; color: #666;">לקוח:</td><td style="padding: 10px 0; font-weight: bold;">{client_name}</td></tr>
                        <tr><td style="padding: 10px 0; color: #666;">טלפון:</td><td style="padding: 10px 0;">{client_phone or 'לא צוין'}</td></tr>
                        <tr><td style="padding: 10px 0; color: #666;">שירות:</td><td style="padding: 10px 0; font-weight: bold;">{service.get('name', 'שירות')}</td></tr>
                        <tr><td style="padding: 10px 0; color: #666;">תאריך:</td><td style="padding: 10px 0;">{booking_date_formatted}</td></tr>
                        <tr><td style="padding: 10px 0; color: #666;">שעה:</td><td style="padding: 10px 0;">{booking_time_str}</td></tr>
                        <tr><td style="padding: 10px 0; color: #666;">כתובת:</td><td style="padding: 10px 0;">{booking_data.service_address or booking_data.guest_address or 'לא צוין'}, {booking_data.service_city or ''}</td></tr>
                    </table>
                    
                    <div style="background: #fff3cd; padding: 15px; border-radius: 10px; margin: 20px 0;">
                        <strong>⚠️ סטטוס:</strong> ממתינה לאישורך
                    </div>
                    
                    <h3 style="color: #0d5c63;">סיכום מחירים</h3>
                    <table style="width: 100%; border-collapse: collapse; background: white; padding: 15px; border-radius: 10px;">
                        <tr><td style="padding: 8px 0;">מחיר בסיס:</td><td style="text-align: left;">₪{service.get('price', 0)}</td></tr>
                        {'<tr><td style="padding: 8px 0;">תוספת נסיעות:</td><td style="text-align: left;">₪' + str(travel_cost) + '</td></tr>' if travel_cost > 0 else ''}
                        {'<tr><td style="padding: 8px 0;">תוספת סופ"ש:</td><td style="text-align: left;">₪' + str(weekend_addition) + '</td></tr>' if weekend_addition > 0 else ''}
                        <tr style="border-top: 2px solid #00a99d;"><td style="padding: 10px 0; font-weight: bold;">סה"כ:</td><td style="text-align: left; font-weight: bold; color: #00a99d; font-size: 18px;">₪{final_price}</td></tr>
                    </table>
                    
                    {f'<div style="background: #e8f5f3; padding: 15px; border-radius: 10px; margin-top: 20px;"><strong>הערות:</strong> {booking_data.notes}</div>' if booking_data.notes else ''}
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="{SITE_URL}/provider/dashboard" style="background: #00a99d; color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">אשר את ההזמנה</a>
                    </div>
                </div>
            </body>
            </html>
            """
        )
    
    # Send confirmation email to client
    client_email_to_send = client_email or (user.get("email") if user else None)
    if client_email_to_send:
        await send_email_async(
            client_email_to_send,
            f"הזמנה -אישור קבלת הזמנה #{booking.booking_number}",
            f"""
            <!DOCTYPE html>
            <html dir="rtl" lang="he">
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #00a99d, #0d5c63); color: white; padding: 30px; border-radius: 15px 15px 0 0; text-align: center;">
                    <h1 style="margin: 0;">ההזמנה נשלחה בהצלחה!</h1>
                    <p style="margin: 10px 0 0;">מספר הזמנה: {booking.booking_number}</p>
                </div>
                
                <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 15px 15px;">
                    <div style="background: #d4edda; padding: 15px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
                        <span style="font-size: 30px;">✅</span>
                        <p style="margin: 10px 0 0; font-weight: bold; color: #155724;">ההזמנה התקבלה וממתינה לאישור הספק</p>
                    </div>
                    
                    <h2 style="color: #0d5c63; border-bottom: 2px solid #00a99d; padding-bottom: 10px;">סיכום ההזמנה</h2>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr><td style="padding: 10px 0; color: #666;">שירות:</td><td style="padding: 10px 0; font-weight: bold;">{service.get('name', 'שירות')}</td></tr>
                        <tr><td style="padding: 10px 0; color: #666;">ספק:</td><td style="padding: 10px 0;">{provider.get('business_name', 'ספק')}</td></tr>
                        <tr><td style="padding: 10px 0; color: #666;">תאריך:</td><td style="padding: 10px 0;">{booking_date_formatted}</td></tr>
                        <tr><td style="padding: 10px 0; color: #666;">שעה:</td><td style="padding: 10px 0;">{booking_time_str}</td></tr>
                        {'<tr><td style="padding: 10px 0; color: #666;">כתובת:</td><td style="padding: 10px 0;">' + (booking_data.service_address or booking_data.guest_address or '') + ', ' + (booking_data.service_city or '') + '</td></tr>' if booking_data.service_address or booking_data.guest_address else ''}
                    </table>
                    
                    <h3 style="color: #0d5c63; margin-top: 20px;">פירוט עלויות</h3>
                    <div style="background: white; padding: 20px; border-radius: 10px; border: 1px solid #e0e0e0;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr><td style="padding: 8px 0;">מחיר בסיס:</td><td style="text-align: left;">₪{service.get('price', 0)}</td></tr>
                            {'<tr><td style="padding: 8px 0;">תוספת נסיעות:</td><td style="text-align: left;">₪' + str(travel_cost) + '</td></tr>' if travel_cost > 0 else ''}
                            {'<tr><td style="padding: 8px 0;">תוספת סופ"ש:</td><td style="text-align: left;">₪' + str(weekend_addition) + '</td></tr>' if weekend_addition > 0 else ''}
                            {'<tr><td style="padding: 8px 0;">דמי משלוח:</td><td style="text-align: left;">₪' + str(shipping_cost) + '</td></tr>' if shipping_cost > 0 else ''}
                        </table>
                        <div style="border-top: 2px solid #00a99d; margin-top: 15px; padding-top: 15px;">
                            <strong style="font-size: 18px;">סה"כ לתשלום: </strong>
                            <span style="font-size: 24px; color: #00a99d; font-weight: bold; float: left;">₪{final_price}</span>
                        </div>
                    </div>
                    
                    <div style="background: #e8f5f3; padding: 20px; border-radius: 10px; margin-top: 20px;">
                        <h4 style="margin: 0 0 10px; color: #0d5c63;">מה הלאה?</h4>
                        <p style="margin: 0; color: #666;">הספק יבדוק את ההזמנה ויאשר אותה בהקדם. נעדכן אותך במייל ובהתראה באפליקציה.</p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="{SITE_URL}/dashboard" style="background: #00a99d; color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">צפה בהזמנות שלי</a>
                    </div>

                    <p style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
                        יש שאלות? צרו קשר דרך האתר
                    </p>
                </div>
            </body>
            </html>
            """
        )
    
    return booking.model_dump()

@router.get("/bookings")
async def get_bookings(
    authorization: Optional[str] = Header(None),
    request: Request = None,
    status: Optional[str] = None,
    provider_id: Optional[str] = None
):
    """Get user's bookings or provider's bookings"""
    user = await get_current_user(authorization, request)
    
    # Check if user is a provider
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    
    if provider_id:
        # Get bookings for specific provider (must be the owner)
        if not provider or provider["provider_id"] != provider_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        query = {"provider_id": provider_id}
    elif provider:
        # Provider viewing their own bookings
        query = {"provider_id": provider["provider_id"]}
    else:
        # Patient viewing their bookings
        query = {"user_id": user["user_id"]}
    
    if status:
        query["status"] = status
    
    bookings = await db.bookings.find(query, {"_id": 0}).to_list(100)
    
    return {"bookings": bookings}

@router.get("/bookings/my")
async def get_my_bookings(
    authorization: Optional[str] = Header(None),
    request: Request = None,
    status: Optional[str] = None
):
    """Get current user's bookings (as patient)"""
    user = await get_current_user(authorization, request)
    
    query = {"user_id": user["user_id"]}
    if status:
        query["status"] = status
    
    bookings = await db.bookings.find(query, {"_id": 0}).to_list(100)
    
    return {"bookings": bookings}

@router.get("/bookings/provider")
async def get_provider_bookings(
    authorization: Optional[str] = Header(None),
    request: Request = None,
    status: Optional[str] = None
):
    """Get bookings for current provider"""
    user = await get_current_user(authorization, request)
    
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    query = {"provider_id": provider["provider_id"]}
    if status:
        query["status"] = status
    
    bookings = await db.bookings.find(query, {"_id": 0}).to_list(100)
    
    return {"bookings": bookings}

@router.get("/bookings/{booking_id}")
async def get_booking_details(
    booking_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Get single booking details"""
    user = await get_current_user(authorization, request)
    
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check authorization - user or provider
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    is_owner = booking["user_id"] == user["user_id"]
    is_provider = provider and booking["provider_id"] == provider["provider_id"]
    is_admin = user.get("role") == "admin"
    
    if not (is_owner or is_provider or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Enrich with user info
    booking_user = await db.users.find_one({"user_id": booking["user_id"]}, {"_id": 0, "password_hash": 0})
    if booking_user:
        booking["user_info"] = {
            "name": booking_user.get("name"),
            "email": booking_user.get("email"),
            "phone": booking_user.get("phone"),
            "profile_image": booking_user.get("profile_image") or booking_user.get("picture")
        }
    
    # Enrich with provider info
    booking_provider = await db.providers.find_one({"provider_id": booking["provider_id"]}, {"_id": 0})
    if booking_provider:
        booking["provider_info"] = {
            "business_name": booking_provider.get("business_name"),
            "phone": booking_provider.get("phone"),
            "email": booking_provider.get("email"),
            "profile_image": booking_provider.get("profile_image")
        }
    
    # Enrich with service info
    service = await db.services.find_one({"service_id": booking["service_id"]}, {"_id": 0})
    if service:
        booking["service_info"] = {
            "name": service.get("name"),
            "description": service.get("description"),
            "price": service.get("price"),
            "duration_minutes": service.get("duration_minutes"),
            "service_category": service.get("service_category"),
            "delivery_types": service.get("delivery_types", [])
        }
    
    return booking


@router.put("/bookings/{booking_id}/request-change")
async def request_booking_change(
    booking_id: str,
    body: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Provider requests a change of date/time for a booking"""
    user = await get_current_user(authorization, request)
    
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if user is the provider
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider or booking["provider_id"] != provider["provider_id"]:
        raise HTTPException(status_code=403, detail="Only provider can request changes")
    
    new_date = body.get("new_date")
    new_time = body.get("new_time")
    reason = body.get("reason", "")
    
    if not new_date and not new_time:
        raise HTTPException(status_code=400, detail="Must provide new date or time")
    
    change_request = {
        "request_id": f"cr_{uuid.uuid4().hex[:8]}",
        "requested_by": user["user_id"],
        "requested_at": datetime.now(timezone.utc).isoformat(),
        "new_date": new_date,
        "new_time": new_time,
        "reason": reason,
        "status": "pending"
    }
    
    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$push": {"change_requests": change_request}}
    )
    
    # Notify client
    provider_name = provider.get("business_name", "הספק")
    date_str = new_date or ""
    time_str = new_time or ""
    change_desc = f"תאריך חדש: {date_str}" if new_date else ""
    if new_time:
        change_desc += f"{' | ' if change_desc else ''}שעה חדשה: {time_str}"
    
    await create_notification(
        booking["user_id"],
        NotificationType.BOOKING_CHANGE_REQUESTED,
        "בקשה לשינוי מועד",
        f"{provider_name} מבקש לשנות את מועד ההזמנה ל-{booking.get('service_name', 'שירות')}. {change_desc}. {('סיבה: ' + reason) if reason else ''}",
        {"booking_id": booking_id, "change_request": change_request}
    )
    await send_push_to_user(
        booking["user_id"],
        "בקשה לשינוי מועד",
        f"{provider_name} מבקש לשנות את מועד ההזמנה. {change_desc}",
        {"booking_id": booking_id, "type": "booking_change_requested"}
    )
    
    # Send email to client
    client_user = await db.users.find_one({"user_id": booking["user_id"]}, {"_id": 0})
    if client_user and client_user.get("email"):
        await send_email_async(
            client_user["email"],
            "הזמנה -בקשה לשינוי מועד הזמנה",
            f"""
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; border-radius: 15px 15px 0 0; text-align: center;">
                    <h1 style="margin: 0;">בקשה לשינוי מועד</h1>
                </div>
                <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 15px 15px;">
                    <p>שלום {client_user.get('name', 'לקוח')},</p>
                    <p>{provider_name} מבקש לשנות את מועד ההזמנה שלך:</p>
                    <div style="background: white; padding: 15px; border-radius: 10px; margin: 15px 0; border: 1px solid #e0e0e0;">
                        <p><strong>שירות:</strong> {booking.get('service_name', 'שירות')}</p>
                        {f'<p><strong>תאריך מבוקש:</strong> {new_date}</p>' if new_date else ''}
                        {f'<p><strong>שעה מבוקשת:</strong> {new_time}</p>' if new_time else ''}
                        {f'<p><strong>סיבה:</strong> {reason}</p>' if reason else ''}
                    </div>
                    <p>אנא היכנס לאזור האישי שלך לאשר או לדחות את הבקשה.</p>
                    <div style="text-align: center; margin-top: 20px;">
                        <a href="{SITE_URL}/dashboard" style="background: #00a99d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">לאזור האישי</a>
                    </div>
                </div>
            </div>
            """
        )
    
    return {"message": "Change request sent successfully", "change_request": change_request}


@router.put("/bookings/{booking_id}/respond-change")
async def respond_to_change_request(
    booking_id: str,
    body: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Client approves or rejects a change request"""
    user = await get_current_user(authorization, request)
    
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Only the client can respond to change requests")
    
    request_id = body.get("request_id")
    action = body.get("action")  # "approve" or "reject"
    
    if action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")
    
    change_requests = booking.get("change_requests", [])
    updated = False
    
    for cr in change_requests:
        if cr.get("request_id") == request_id and cr.get("status") == "pending":
            cr["status"] = "approved" if action == "approve" else "rejected"
            cr["responded_at"] = datetime.now(timezone.utc).isoformat()
            updated = True
            
            if action == "approve":
                # Update booking date/time
                update_fields = {"change_requests": change_requests}
                if cr.get("new_date"):
                    update_fields["booking_date"] = cr["new_date"]
                if cr.get("new_time"):
                    update_fields["booking_time"] = cr["new_time"]
                
                await db.bookings.update_one(
                    {"booking_id": booking_id},
                    {"$set": update_fields}
                )
                
                # Notify provider
                provider = await db.providers.find_one({"provider_id": booking["provider_id"]}, {"_id": 0})
                if provider:
                    await create_notification(
                        provider["user_id"],
                        NotificationType.SYSTEM,
                        "בקשת השינוי אושרה!",
                        f"הלקוח אישר את שינוי המועד ל-{booking.get('service_name', 'שירות')}",
                        {"booking_id": booking_id}
                    )
                    await send_push_to_user(
                        provider["user_id"],
                        "בקשת השינוי אושרה!",
                        f"הלקוח אישר את שינוי המועד ל-{booking.get('service_name', 'שירות')}",
                        {"booking_id": booking_id, "type": "booking_change_approved"}
                    )
            else:
                await db.bookings.update_one(
                    {"booking_id": booking_id},
                    {"$set": {"change_requests": change_requests}}
                )
                
                provider = await db.providers.find_one({"provider_id": booking["provider_id"]}, {"_id": 0})
                if provider:
                    await create_notification(
                        provider["user_id"],
                        NotificationType.SYSTEM,
                        "בקשת השינוי נדחתה",
                        f"הלקוח דחה את בקשת שינוי המועד ל-{booking.get('service_name', 'שירות')}",
                        {"booking_id": booking_id}
                    )
                    await send_push_to_user(
                        provider["user_id"],
                        "בקשת השינוי נדחתה",
                        f"הלקוח דחה את בקשת שינוי המועד ל-{booking.get('service_name', 'שירות')}",
                        {"booking_id": booking_id, "type": "booking_change_rejected"}
                    )
            break
    
    if not updated:
        raise HTTPException(status_code=404, detail="Change request not found or already responded")
    
    return {"message": f"Change request {action}d successfully"}


@router.put("/bookings/{booking_id}/cancel")
async def cancel_booking(
    booking_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Cancel a booking"""
    user = await get_current_user(authorization, request)
    
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check authorization
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    is_owner = booking["user_id"] == user["user_id"]
    is_provider = provider and booking["provider_id"] == provider["provider_id"]
    
    if not (is_owner or is_provider):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {
            "status": BookingStatus.CANCELLED,
            "cancelled_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Notify the other party
    if is_owner:
        # Client cancelled - notify provider
        target_provider = await db.providers.find_one({"provider_id": booking["provider_id"]}, {"_id": 0})
        if target_provider:
            await create_notification(
                target_provider["user_id"],
                NotificationType.BOOKING_CANCELLED,
                "הזמנה בוטלה",
                f"הלקוח ביטל את ההזמנה ל-{booking.get('service_name', 'שירות')}",
                {"booking_id": booking_id}
            )
            await send_push_to_user(
                target_provider["user_id"],
                "הזמנה בוטלה",
                f"הלקוח ביטל את ההזמנה ל-{booking.get('service_name', 'שירות')}",
                {"booking_id": booking_id, "type": "booking_cancelled"}
            )
            # Send email to provider
            provider_user = await db.users.find_one({"user_id": target_provider["user_id"]}, {"_id": 0})
            if provider_user and provider_user.get("email"):
                client_user = await db.users.find_one({"user_id": booking["user_id"]}, {"_id": 0})
                await send_email_async(
                    provider_user["email"],
                    "הזמנה -הזמנה בוטלה ❌",
                    f"""
                    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #e74c3c;">הזמנה בוטלה</h2>
                        <p>שלום {provider_user.get('name', 'ספק')},</p>
                        <p>הלקוח {client_user.get('name', 'לקוח') if client_user else 'לקוח'} ביטל את ההזמנה:</p>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin: 15px 0;">
                            <p><strong>שירות:</strong> {booking.get('service_name', 'שירות')}</p>
                            <p><strong>תאריך:</strong> {booking.get('booking_date', '')[:10]}</p>
                        </div>
                        <p>בברכה</p>
                    </div>
                    """
                )
    else:
        # Provider cancelled - notify client
        await create_notification(
            booking["user_id"],
            NotificationType.BOOKING_CANCELLED,
            "הזמנה בוטלה",
            f"הספק ביטל את ההזמנה ל-{booking.get('service_name', 'שירות')}",
            {"booking_id": booking_id}
        )
        await send_push_to_user(
            booking["user_id"],
            "הזמנה בוטלה",
            f"הספק ביטל את ההזמנה ל-{booking.get('service_name', 'שירות')}",
            {"booking_id": booking_id, "type": "booking_cancelled"}
        )
        # Send email to client
        client_user = await db.users.find_one({"user_id": booking["user_id"]}, {"_id": 0})
        if client_user and client_user.get("email"):
            provider_info = await db.providers.find_one({"provider_id": booking["provider_id"]}, {"_id": 0})
            await send_email_async(
                client_user["email"],
                "הזמנה -הזמנה בוטלה ❌",
                f"""
                <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #e74c3c;">הזמנה בוטלה</h2>
                    <p>שלום {client_user.get('name', 'לקוח')},</p>
                    <p>הספק {provider_info.get('business_name', 'ספק') if provider_info else 'ספק'} ביטל את ההזמנה:</p>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin: 15px 0;">
                        <p><strong>שירות:</strong> {booking.get('service_name', 'שירות')}</p>
                        <p><strong>תאריך:</strong> {booking.get('booking_date', '')[:10]}</p>
                    </div>
                    <p>מומלץ לחפש ספק חלופי.</p>
                    <p>בברכה</p>
                </div>
                """
            )
    
    return {"message": "Booking cancelled successfully"}

@router.put("/bookings/{booking_id}/confirm")
async def confirm_booking(
    booking_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Confirm a booking (provider only)"""
    user = await get_current_user(authorization, request)
    
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if user is the provider
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider or booking["provider_id"] != provider["provider_id"]:
        raise HTTPException(status_code=403, detail="Only provider can confirm bookings")
    
    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {
            "status": BookingStatus.CONFIRMED,
            "confirmed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Notify client
    await create_notification(
        booking["user_id"],
        NotificationType.BOOKING_CONFIRMED,
        "ההזמנה אושרה!",
        f"הספק אישר את ההזמנה ל-{booking.get('service_name', 'שירות')} בתאריך {booking.get('booking_date', '')[:10]}",
        {"booking_id": booking_id}
    )
    await send_push_to_user(
        booking["user_id"],
        "ההזמנה אושרה!",
        f"הספק אישר את ההזמנה ל-{booking.get('service_name', 'שירות')} בתאריך {booking.get('booking_date', '')[:10]}",
        {"booking_id": booking_id, "type": "booking_confirmed"}
    )
    
    # Send email to client about confirmed booking
    client_user = await db.users.find_one({"user_id": booking["user_id"]}, {"_id": 0})
    if client_user and client_user.get("email"):
        provider_info = await db.providers.find_one({"provider_id": booking["provider_id"]}, {"_id": 0})
        await send_email_async(
            client_user["email"],
            "הזמנה -ההזמנה שלך אושרה! ✅",
            f"""
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #19B8BA;">ההזמנה אושרה! 🎉</h1>
                </div>
                
                <p style="font-size: 16px; color: #1E4D5F;">שלום {client_user.get('name', 'לקוח')},</p>
                
                <p style="font-size: 16px; color: #4C6D7F;">
                    הספק אישר את ההזמנה שלך!
                </p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h3 style="color: #19B8BA; margin-top: 0;">פרטי ההזמנה:</h3>
                    <p><strong>שירות:</strong> {booking.get('service_name', 'שירות')}</p>
                    <p><strong>ספק:</strong> {provider_info.get('business_name', 'ספק') if provider_info else 'ספק'}</p>
                    <p><strong>תאריך:</strong> {booking.get('booking_date', '')[:10]}</p>
                    <p><strong>שעה:</strong> {booking.get('booking_time', 'לא צוין')}</p>
                    <p><strong>כתובת:</strong> {booking.get('service_address', 'לא צוין')}, {booking.get('service_city', '')}</p>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #888;">
                    <p>בברכה</p>
                </div>
            </div>
            """
        )
    
    return {"message": "Booking confirmed successfully"}

@router.put("/bookings/{booking_id}/reject")
async def reject_booking(
    booking_id: str,
    body: dict = None,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Reject a booking (provider only)"""
    user = await get_current_user(authorization, request)
    
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if user is the provider
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider or booking["provider_id"] != provider["provider_id"]:
        raise HTTPException(status_code=403, detail="Only provider can reject bookings")
    
    reason = body.get("reason", "") if body else ""
    
    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {
            "status": BookingStatus.REJECTED,
            "rejected_at": datetime.now(timezone.utc).isoformat(),
            "rejection_reason": reason
        }}
    )
    
    # Notify client
    await create_notification(
        booking["user_id"],
        NotificationType.BOOKING_CANCELLED,
        "ההזמנה נדחתה",
        f"לצערנו, הספק דחה את ההזמנה ל-{booking.get('service_name', 'שירות')}. {('סיבה: ' + reason) if reason else ''}",
        {"booking_id": booking_id}
    )
    await send_push_to_user(
        booking["user_id"],
        "ההזמנה נדחתה",
        f"הספק דחה את ההזמנה ל-{booking.get('service_name', 'שירות')}",
        {"booking_id": booking_id, "type": "booking_rejected"}
    )
    
    # Send email to client
    client_user = await db.users.find_one({"user_id": booking["user_id"]}, {"_id": 0})
    if client_user and client_user.get("email"):
        await send_email_async(
            client_user["email"],
            "הזמנה -ההזמנה נדחתה",
            f"""
            <!DOCTYPE html>
            <html dir="rtl" lang="he">
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #dc3545; color: white; padding: 30px; border-radius: 15px 15px 0 0; text-align: center;">
                    <h1 style="margin: 0;">ההזמנה נדחתה</h1>
                </div>
                <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 15px 15px;">
                    <p>שלום {client_user.get('name', 'לקוח')},</p>
                    <p>לצערנו, הספק דחה את ההזמנה שלך:</p>
                    <div style="background: white; padding: 15px; border-radius: 10px; margin: 15px 0;">
                        <p><strong>שירות:</strong> {booking.get('service_name', 'שירות')}</p>
                        <p><strong>תאריך:</strong> {booking.get('booking_date', '')[:10]}</p>
                        {f'<p><strong>סיבה:</strong> {reason}</p>' if reason else ''}
                    </div>
                    <p>מומלץ לחפש ספק חלופי באתר.</p>
                    <div style="text-align: center; margin-top: 20px;">
                        <a href="{SITE_URL}/providers" style="background: #00a99d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">חפש ספק אחר</a>
                    </div>
                </div>
            </body>
            </html>
            """
        )
    
    return {"message": "Booking rejected successfully"}

@router.put("/bookings/{booking_id}/hold")
async def hold_booking(
    booking_id: str,
    body: dict = None,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Put a booking on hold (provider only)"""
    user = await get_current_user(authorization, request)
    
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if user is the provider
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider or booking["provider_id"] != provider["provider_id"]:
        raise HTTPException(status_code=403, detail="Only provider can put bookings on hold")
    
    reason = body.get("reason", "") if body else ""
    
    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {
            "status": BookingStatus.ON_HOLD,
            "on_hold_at": datetime.now(timezone.utc).isoformat(),
            "hold_reason": reason
        }}
    )
    
    # Notify client
    await create_notification(
        booking["user_id"],
        NotificationType.SYSTEM,
        "ההזמנה הושהתה",
        f"ההזמנה ל-{booking.get('service_name', 'שירות')} הושהתה. {('סיבה: ' + reason) if reason else ''}",
        {"booking_id": booking_id}
    )
    await send_push_to_user(
        booking["user_id"],
        "ההזמנה הושהתה",
        f"ההזמנה ל-{booking.get('service_name', 'שירות')} הושהתה",
        {"booking_id": booking_id, "type": "booking_on_hold"}
    )
    
    return {"message": "Booking put on hold successfully"}

@router.put("/bookings/{booking_id}/provider-complete")
async def provider_complete_booking(
    booking_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Mark booking as completed by provider (awaiting client confirmation)"""
    user = await get_current_user(authorization, request)
    
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if user is the provider
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider or booking["provider_id"] != provider["provider_id"]:
        raise HTTPException(status_code=403, detail="Only provider can mark as completed")
    
    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {
            "status": BookingStatus.PROVIDER_COMPLETED,
            "provider_completed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Notify client to confirm completion
    await create_notification(
        booking["user_id"],
        NotificationType.BOOKING_PROVIDER_COMPLETED,
        "השירות הושלם - אנא אשר",
        f"הספק סימן שהשירות '{booking.get('service_name', '')}' הושלם. אנא אשר ודרג את השירות.",
        {"booking_id": booking_id, "provider_id": booking["provider_id"]}
    )
    await send_push_to_user(
        booking["user_id"],
        "השירות הושלם - אנא אשר",
        f"הספק סימן שהשירות '{booking.get('service_name', '')}' הושלם. אנא אשר ודרג.",
        {"booking_id": booking_id, "type": "booking_provider_completed"}
    )
    
    return {"message": "Booking marked as completed by provider"}

@router.put("/bookings/{booking_id}/client-confirm")
async def client_confirm_booking(
    booking_id: str,
    body: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Client confirms booking completion and records payment"""
    user = await get_current_user(authorization, request)
    
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if user is the client
    if booking["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Only client can confirm completion")
    
    # Check status
    if booking["status"] != BookingStatus.PROVIDER_COMPLETED:
        raise HTTPException(status_code=400, detail="Booking must be marked as completed by provider first")
    
    final_price = body.get("final_price")
    payment_notes = body.get("payment_notes")
    
    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {
            "status": BookingStatus.COMPLETED,
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "final_price": final_price,
            "payment_notes": payment_notes
        }}
    )
    
    # Notify provider
    provider = await db.providers.find_one({"provider_id": booking["provider_id"]}, {"_id": 0})
    if provider:
        await create_notification(
            provider["user_id"],
            NotificationType.BOOKING_COMPLETED,
            "הלקוח אישר את השלמת השירות!",
            f"הלקוח אישר שהשירות '{booking.get('service_name', '')}' הושלם בהצלחה.",
            {"booking_id": booking_id}
        )
        await send_push_to_user(
            provider["user_id"],
            "הלקוח אישר את השלמת השירות!",
            f"הלקוח אישר שהשירות '{booking.get('service_name', '')}' הושלם בהצלחה.",
            {"booking_id": booking_id, "type": "booking_completed"}
        )
    
    return {"message": "Booking completed successfully"}

@router.put("/bookings/{booking_id}/complete")
async def complete_booking(
    booking_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Mark booking as completed (provider only) - Legacy endpoint"""
    user = await get_current_user(authorization, request)
    
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if user is the provider
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider or booking["provider_id"] != provider["provider_id"]:
        raise HTTPException(status_code=403, detail="Only provider can complete bookings")
    
    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {
            "status": BookingStatus.PROVIDER_COMPLETED,
            "provider_completed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Notify client
    await create_notification(
        booking["user_id"],
        NotificationType.BOOKING_PROVIDER_COMPLETED,
        "השירות הושלם - אנא אשר",
        f"הספק סימן שהשירות '{booking.get('service_name', '')}' הושלם. אנא אשר ודרג את השירות.",
        {"booking_id": booking_id, "provider_id": booking["provider_id"]}
    )
    await send_push_to_user(
        booking["user_id"],
        "השירות הושלם - אנא אשר",
        f"הספק סימן שהשירות '{booking.get('service_name', '')}' הושלם. אנא אשר ודרג.",
        {"booking_id": booking_id, "type": "booking_provider_completed"}
    )
    
    return {"message": "Booking completed successfully"}

@router.put("/bookings/{booking_id}/status")
async def update_booking_status(
    booking_id: str,
    body: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Update booking status (provider only)"""
    user = await get_current_user(authorization, request)
    
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider or booking["provider_id"] != provider["provider_id"]:
        raise HTTPException(status_code=403, detail="Only provider can update booking status")
    
    new_status = body.get("status")
    valid_statuses = ["pending", "confirmed", "in_progress", "provider_completed", "completed", "cancelled"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    update_data = {"status": new_status}
    
    if new_status == "confirmed":
        update_data["confirmed_at"] = datetime.now(timezone.utc).isoformat()
    elif new_status == "provider_completed":
        update_data["provider_completed_at"] = datetime.now(timezone.utc).isoformat()
    elif new_status == "cancelled":
        update_data["cancelled_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": update_data}
    )
    
    # Notify client based on status
    notification_map = {
        "confirmed": (NotificationType.BOOKING_CONFIRMED, "ההזמנה אושרה!", "הספק אישר את ההזמנה"),
        "cancelled": (NotificationType.BOOKING_CANCELLED, "ההזמנה בוטלה", "הספק ביטל את ההזמנה"),
        "provider_completed": (NotificationType.BOOKING_PROVIDER_COMPLETED, "השירות הושלם", "הספק סימן שהשירות הושלם. אנא אשר.")
    }
    
    if new_status in notification_map:
        notif_type, title, message = notification_map[new_status]
        await create_notification(
            booking["user_id"],
            notif_type,
            title,
            message,
            {"booking_id": booking_id}
        )
        await send_push_to_user(
            booking["user_id"],
            title,
            message,
            {"booking_id": booking_id, "type": f"booking_{new_status}"}
        )
    
    return {"message": f"Booking status updated to {new_status}"}

