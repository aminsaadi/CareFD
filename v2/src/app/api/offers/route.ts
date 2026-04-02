import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody } from "@/lib/api-utils";
import { createNotification } from "@/lib/notifications";

// POST /api/offers - Create offer on a request
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const body = await parseBody<any>(req);

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) return errorResponse("Provider profile required", 400);

  const request = await prisma.serviceRequest.findUnique({ where: { id: body.request_id } });
  if (!request) return errorResponse("Request not found", 404);
  if (request.status !== "open" && request.status !== "in_progress") return errorResponse("Request is not accepting offers", 400);

  // Check duplicate
  const existing = await prisma.offer.findFirst({ where: { requestId: body.request_id, providerId: provider.id, status: { in: ["pending", "accepted"] } } });
  if (existing) return errorResponse("כבר הגשת הצעה לבקשה זו", 400);

  const offer = await prisma.offer.create({
    data: {
      requestId: body.request_id,
      providerId: provider.id,
      userId: request.userId,
      price: body.price,
      pricingType: body.pricing_type || "fixed",
      durationDays: body.duration_days,
      message: body.message,
      suggestedServiceId: body.suggested_service_id,
      providerName: provider.businessName,
      providerPicture: provider.profileImage,
    },
  });

  // Update request offer count
  await prisma.serviceRequest.update({
    where: { id: body.request_id },
    data: { offerCount: { increment: 1 }, status: "in_progress" },
  });

  // Notify request owner
  await createNotification(request.userId, "offer_new", "הצעה חדשה!", `${provider.businessName || "ספק"} הגיש הצעה לבקשה "${request.title}"`, { request_id: request.id, offer_id: offer.id });

  return json({ offer_id: offer.id, message: "ההצעה נשלחה בהצלחה" }, 201);
});
