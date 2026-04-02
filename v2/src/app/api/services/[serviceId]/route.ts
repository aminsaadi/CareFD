import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody } from "@/lib/api-utils";

// GET /api/services/:serviceId
export const GET = withErrorHandler(async (_req: NextRequest, ctx) => {
  const { serviceId } = await ctx.params;
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      provider: {
        select: {
          id: true, businessName: true, profileImage: true, rating: true, totalReviews: true,
          city: true, phone: true, isVerified: true, isRecommended: true, whatsappNumber: true,
          showPhone: true, showWhatsapp: true, professionName: true, specializationName: true,
        },
      },
    },
  });
  if (!service) return errorResponse("Service not found", 404);
  return json(service);
});

// PUT /api/services/:serviceId
export const PUT = withErrorHandler(async (req: NextRequest, ctx) => {
  const { serviceId } = await ctx.params;
  const user = await getCurrentUser(req as any);
  if (!user) return errorResponse("Unauthorized", 401);

  const service = await prisma.service.findUnique({ where: { id: serviceId }, select: { providerId: true } });
  if (!service) return errorResponse("Service not found", 404);

  const provider = await prisma.provider.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!provider) return errorResponse("Not a provider", 403);
  if (service.providerId !== provider.id && user.role !== "admin") return errorResponse("Not authorized", 403);

  const body = await parseBody<any>(req);
  const data: any = {};
  const fields = ["name", "description", "price", "pricingType", "serviceCategory", "deliveryTypes", "durationMinutes", "minimumHours", "isActive",
    "weekendPricingType", "weekendPriceAddition", "hasTravelCost", "travelCost", "hasShipping", "shippingCost", "freeShippingAbove",
    "stockQuantity", "numSessions", "seriesPrice", "sessionDurationMin"];

  for (const f of fields) {
    const snakeKey = f.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    if (body[snakeKey] !== undefined) data[f] = body[snakeKey];
    else if (body[f] !== undefined) data[f] = body[f];
  }

  await prisma.service.update({ where: { id: serviceId }, data });
  return json({ message: "Service updated" });
});

// DELETE /api/services/:serviceId
export const DELETE = withErrorHandler(async (req: NextRequest, ctx) => {
  const { serviceId } = await ctx.params;
  const user = await getCurrentUser(req as any);
  if (!user) return errorResponse("Unauthorized", 401);

  const service = await prisma.service.findUnique({ where: { id: serviceId }, select: { providerId: true } });
  if (!service) return errorResponse("Service not found", 404);

  const provider = await prisma.provider.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!provider) return errorResponse("Not a provider", 403);
  if (service.providerId !== provider.id && user.role !== "admin") return errorResponse("Not authorized", 403);

  await prisma.service.delete({ where: { id: serviceId } });
  return json({ message: "Service deleted" });
});
