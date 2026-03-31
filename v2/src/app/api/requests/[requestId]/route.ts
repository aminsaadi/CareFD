import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody, getSearchParams } from "@/lib/api-utils";
import { createNotification } from "@/lib/notifications";

// GET /api/requests/:requestId
export const GET = withErrorHandler(async (req: NextRequest, ctx) => {
  const { requestId } = await ctx.params;
  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    include: {
      user: { select: { id: true, name: true, picture: true } },
      offers: {
        include: { provider: { select: { id: true, businessName: true, profileImage: true, rating: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!request) return errorResponse("Request not found", 404);
  return json(request);
});

// PUT /api/requests/:requestId
export const PUT = withErrorHandler(async (req: NextRequest, ctx) => {
  const { requestId } = await ctx.params;
  const user = await requireAuth(req);
  const body = await parseBody<any>(req);

  const request = await prisma.serviceRequest.findUnique({ where: { id: requestId } });
  if (!request) return errorResponse("Request not found", 404);
  if (request.userId !== user.id && user.role !== "admin") return errorResponse("Not authorized", 403);

  // Handle cancel action
  if (body.action === "cancel") {
    await prisma.$transaction([
      prisma.serviceRequest.update({ where: { id: requestId }, data: { status: "cancelled", cancelledAt: new Date(), cancellationReason: body.reason } }),
      prisma.offer.updateMany({ where: { requestId, status: "pending" }, data: { status: "rejected", rejectedAt: new Date() } }),
    ]);
    return json({ message: "הבקשה בוטלה" });
  }

  if (body.action === "complete") {
    await prisma.serviceRequest.update({ where: { id: requestId }, data: { status: "completed" } });
    return json({ message: "הבקשה הושלמה" });
  }

  // Regular update
  const allowed = ["title", "description", "budget", "budget_type", "hours_needed", "urgency", "preferred_date", "preferred_time", "preferences"];
  const data: any = {};
  for (const key of allowed) {
    if (body[key] !== undefined) {
      const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      data[camel] = body[key];
    }
  }
  if (body.preferred_date) data.preferredDate = new Date(body.preferred_date);

  await prisma.serviceRequest.update({ where: { id: requestId }, data });
  return json({ message: "הבקשה עודכנה" });
});

// DELETE /api/requests/:requestId
export const DELETE = withErrorHandler(async (req: NextRequest, ctx) => {
  const { requestId } = await ctx.params;
  const user = await requireAuth(req);

  const request = await prisma.serviceRequest.findUnique({ where: { id: requestId } });
  if (!request) return errorResponse("Request not found", 404);
  if (request.userId !== user.id && user.role !== "admin") return errorResponse("Not authorized", 403);

  await prisma.$transaction([
    prisma.offer.deleteMany({ where: { requestId } }),
    prisma.serviceRequest.delete({ where: { id: requestId } }),
  ]);

  return json({ message: "הבקשה נמחקה" });
});
