import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser, requireAuth } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody, getSearchParams } from "@/lib/api-utils";
import { createNotification } from "@/lib/notifications";

// POST /api/bookings - Create booking
export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await parseBody<any>(req);
  const isGuest = body.guest_booking && body.guest_name && body.guest_phone;

  let userId: string;
  let userName: string;
  let userEmail: string | null = null;

  if (isGuest) {
    userId = `guest_${crypto.randomUUID().slice(0, 12)}`;
    userName = body.guest_name;
    userEmail = body.guest_email;
  } else {
    const user = await requireAuth(req);
    userId = user.id;
    userName = user.name;
    userEmail = user.email;
  }

  // Get service
  const service = await prisma.service.findUnique({
    where: { id: body.service_id },
    include: { provider: { select: { id: true, userId: true, businessName: true, isVerified: true, verificationStatus: true } } },
  });
  if (!service) return errorResponse("Service not found", 404);
  if (!service.provider.isVerified && service.provider.verificationStatus !== "verified") {
    return errorResponse("Provider is not verified", 400);
  }

  // Check conflicts via transaction
  if (body.booking_date && body.booking_time) {
    const existing = await prisma.booking.findFirst({
      where: {
        providerId: service.providerId,
        bookingDate: new Date(body.booking_date),
        bookingTime: body.booking_time,
        status: { in: ["pending", "confirmed", "in_progress"] },
      },
    });
    if (existing) return errorResponse("Time slot already booked", 400);
  }

  // Calculate pricing
  let basePrice = service.price;
  const hoursBooked = body.hours_booked;
  let travelCost = 0;
  let weekendAddition = 0;
  let shippingCost = 0;

  if (service.serviceCategory === "hourly" && hoursBooked) {
    const minHours = service.minimumHours || 1;
    basePrice = basePrice * Math.max(hoursBooked, minHours);
  }

  if (body.booking_date) {
    const day = new Date(body.booking_date).getDay();
    const isWeekend = day === 6 || (day === 5 && body.booking_time >= "14:00");
    if (isWeekend && service.weekendPricingType !== "none") {
      const addition = service.weekendPriceAddition || 0;
      weekendAddition = service.weekendPricingType === "percentage" ? basePrice * (addition / 100) : addition;
    }
  }

  if (service.hasTravelCost && body.delivery_type === "home_visit") {
    travelCost = service.travelCost || 0;
  }

  if (service.serviceCategory === "product" && service.hasShipping) {
    if (service.freeShippingAbove && basePrice >= service.freeShippingAbove) {
      shippingCost = 0;
    } else {
      shippingCost = service.shippingCost || 0;
    }
  }

  const finalPrice = basePrice + travelCost + weekendAddition + shippingCost;
  const bookingNumber = `B${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const clientName = body.client_name || body.guest_name || userName;

  const booking = await prisma.booking.create({
    data: {
      bookingNumber,
      userId: isGuest ? userId : userId,
      providerId: service.providerId,
      serviceId: service.id,
      bookingDate: body.booking_date ? new Date(body.booking_date) : null,
      bookingTime: body.booking_time,
      serviceName: service.name,
      serviceCategory: service.serviceCategory,
      deliveryType: body.delivery_type,
      clientName: clientName,
      clientPhone: body.client_phone || body.guest_phone,
      clientEmail: body.client_email || body.guest_email || userEmail,
      contactPersonName: body.contact_person_name,
      contactPersonPhone: body.contact_person_phone,
      contactPersonRelation: body.contact_person_relationship,
      isContactSameAsRequester: body.is_contact_same_as_requester ?? true,
      serviceAddress: body.service_address || body.guest_address,
      serviceCity: body.service_city,
      serviceFloor: body.service_floor,
      serviceApartment: body.service_apartment,
      serviceEntryCode: body.service_entry_code,
      serviceLocationNotes: body.service_notes,
      serviceLatitude: body.service_latitude,
      serviceLongitude: body.service_longitude,
      shippingAddress: body.shipping_address,
      shippingCity: body.shipping_city,
      hoursBooked: hoursBooked,
      selectedShift: body.selected_shift,
      platform: body.platform,
      numSessions: body.num_sessions,
      notes: body.notes,
      specialRequirements: body.special_requirements,
      basePrice: service.price,
      travelCost: travelCost > 0 ? travelCost : null,
      weekendAddition: weekendAddition > 0 ? weekendAddition : null,
      shippingCost: shippingCost > 0 ? shippingCost : null,
      finalPrice,
      providerName: service.provider.businessName,
      userName: userName,
      isGuestBooking: isGuest,
    },
  });

  // Notify provider
  const dateFormatted = body.booking_date ? new Date(body.booking_date).toLocaleDateString("he-IL") : "יתואם טלפונית";
  await createNotification(
    service.provider.userId,
    "booking_new",
    "הזמנה חדשה!",
    `${clientName} הזמין ${service.name} לתאריך ${dateFormatted}`,
    { booking_id: booking.id, service_id: service.id }
  );

  return json({
    booking_id: booking.id,
    booking_number: booking.bookingNumber,
    status: booking.status,
    final_price: finalPrice,
    message: "ההזמנה נוצרה בהצלחה",
  }, 201);
});

// GET /api/bookings - List bookings (with filters)
export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const sp = getSearchParams(req);
  const status = sp.get("status");
  const skip = parseInt(sp.get("skip") || "0");
  const limit = Math.min(100, parseInt(sp.get("limit") || "20"));

  const where: any = {};

  if (user.role === "admin") {
    // Admin sees all
  } else if (user.role === "provider") {
    const provider = await prisma.provider.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (provider) where.providerId = provider.id;
  } else {
    where.userId = user.id;
  }

  if (status) where.status = status;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.booking.count({ where }),
  ]);

  return json({ bookings, total, skip, limit });
});
