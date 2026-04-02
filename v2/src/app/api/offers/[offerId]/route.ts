import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody } from "@/lib/api-utils";
import { createNotification } from "@/lib/notifications";

// POST /api/offers/:offerId - Accept, reject, or withdraw offer
export const POST = withErrorHandler(async (req: NextRequest, ctx) => {
  const { offerId } = await ctx.params;
  const user = await requireAuth(req);
  const body = await parseBody<{ action: "accept" | "reject" | "withdraw" }>(req);

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      request: { select: { id: true, userId: true, title: true } },
      provider: { select: { id: true, userId: true, businessName: true } },
    },
  });
  if (!offer) return errorResponse("Offer not found", 404);

  const isRequestOwner = offer.request.userId === user.id;
  const isOfferProvider = offer.provider.userId === user.id;

  switch (body.action) {
    case "accept": {
      if (!isRequestOwner && user.role !== "admin") return errorResponse("Only request owner can accept", 403);
      if (offer.status !== "pending") return errorResponse("Offer is no longer pending", 400);

      // Accept offer + create booking + create chat room atomically
      await prisma.$transaction(async (tx) => {
        // Update offer - include status: "pending" in WHERE to prevent double acceptance
        const updated = await tx.offer.updateMany({ where: { id: offerId, status: "pending" }, data: { status: "accepted" } });
        if (updated.count === 0) throw new Error("Offer is no longer pending");

        // Update request
        await tx.serviceRequest.update({
          where: { id: offer.requestId },
          data: {
            acceptedOfferIds: { push: offerId },
          },
        });

        // Create chat room (if doesn't exist)
        const existingRoom = await tx.chatRoom.findUnique({
          where: { userId_providerId: { userId: user.id, providerId: offer.providerId } },
        });
        if (!existingRoom) {
          await tx.chatRoom.create({
            data: {
              userId: user.id,
              providerId: offer.providerId,
              requestId: offer.requestId,
            },
          });
        }
      });

      await createNotification(offer.provider.userId, "offer_accepted", "ההצעה התקבלה!", `ההצעה שלך לבקשה "${offer.request.title}" התקבלה`, { request_id: offer.requestId, offer_id: offerId });
      return json({ message: "ההצעה התקבלה" });
    }
    case "reject": {
      if (!isRequestOwner && user.role !== "admin") return errorResponse("Only request owner can reject", 403);
      if (offer.status !== "pending") return errorResponse("Offer is no longer pending", 400);

      await prisma.$transaction([
        prisma.offer.update({ where: { id: offerId }, data: { status: "rejected", rejectedAt: new Date() } }),
        prisma.serviceRequest.update({ where: { id: offer.requestId }, data: { offerCount: { decrement: 1 } } }),
      ]);

      await createNotification(offer.provider.userId, "offer_rejected", "ההצעה נדחתה", `ההצעה שלך לבקשה "${offer.request.title}" נדחתה`, { request_id: offer.requestId, offer_id: offerId });
      return json({ message: "ההצעה נדחתה" });
    }
    case "withdraw": {
      if (!isOfferProvider && user.role !== "admin") return errorResponse("Only offer provider can withdraw", 403);
      if (offer.status !== "pending") return errorResponse("Offer is no longer pending", 400);

      await prisma.$transaction([
        prisma.offer.update({ where: { id: offerId }, data: { status: "withdrawn", withdrawnAt: new Date() } }),
        prisma.serviceRequest.update({ where: { id: offer.requestId }, data: { offerCount: { decrement: 1 } } }),
      ]);

      await createNotification(offer.request.userId, "offer_withdrawn", "הצעה בוטלה", `${offer.provider.businessName} ביטל את ההצעה לבקשה "${offer.request.title}"`, { request_id: offer.requestId });
      return json({ message: "ההצעה בוטלה" });
    }
    default:
      return errorResponse("Invalid action", 400);
  }
});
