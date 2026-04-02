import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, getCurrentUser } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody, getSearchParams } from "@/lib/api-utils";
import { createNotification } from "@/lib/notifications";

// POST /api/requests - Create service request
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const body = await parseBody<any>(req);

  if (!body.title || !body.description) return errorResponse("Title and description required", 400);
  if (body.professions?.length > 3) return errorResponse("Maximum 3 professions", 400);

  const request = await prisma.serviceRequest.create({
    data: {
      userId: user.id,
      title: body.title,
      description: body.description,
      providerType: body.provider_type,
      specialization: body.specialization,
      professions: body.professions || [],
      serviceType: body.service_type,
      deliveryType: body.delivery_type,
      locationAddress: body.location?.address,
      locationCity: body.location?.city,
      locationLat: body.location?.latitude,
      locationLng: body.location?.longitude,
      budget: body.budget,
      budgetType: body.budget_type,
      hoursNeeded: body.hours_needed,
      requestType: body.request_type || "one_time",
      urgency: body.urgency || "medium",
      preferredDate: body.preferred_date ? new Date(body.preferred_date) : null,
      preferredTime: body.preferred_time,
      genderPreference: body.gender_preference,
      languagePreferences: body.language_preferences || [],
      preferences: body.preferences,
      addressNotes: body.address_notes,
      region: body.region,
    },
  });

  // Notify admins
  const admins = await prisma.user.findMany({ where: { role: "admin" }, select: { id: true } });
  for (const admin of admins) {
    await createNotification(admin.id, "request_new", "בקשת שירות חדשה", `${user.name} פרסם בקשה: ${body.title}`, { request_id: request.id });
  }

  return json({ request_id: request.id, message: "הבקשה נוצרה בהצלחה" }, 201);
});

// GET /api/requests - List requests
export const GET = withErrorHandler(async (req: NextRequest) => {
  const sp = getSearchParams(req);
  const status = sp.get("status");
  const professionId = sp.get("profession");
  const urgency = sp.get("urgency");
  const skip = parseInt(sp.get("skip") || "0");
  const limit = Math.min(100, parseInt(sp.get("limit") || "20"));

  const where: any = {};
  if (status) where.status = status;
  else where.status = { in: ["open", "in_progress"] };
  if (professionId) where.professions = { has: professionId };
  if (urgency) where.urgency = urgency;

  const user = await getCurrentUser(req as any);
  // Non-authenticated users only see open requests
  if (!user) where.status = "open";

  const [requests, total] = await Promise.all([
    prisma.serviceRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { user: { select: { id: true, name: true, picture: true } }, offers: { select: { id: true } } },
    }),
    prisma.serviceRequest.count({ where }),
  ]);

  return json({
    requests: requests.map((r) => ({
      ...r,
      user_name: r.user.name,
      user_picture: r.user.picture,
      offer_count: r.offers.length,
    })),
    total, skip, limit,
  });
});
