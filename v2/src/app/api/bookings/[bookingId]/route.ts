import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, errorResponse, withErrorHandler } from "@/lib/api-utils";

// GET /api/bookings/:bookingId
export const GET = withErrorHandler(async (req: NextRequest, ctx) => {
  const { bookingId } = await ctx.params;
  const user = await requireAuth(req);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: { select: { id: true, name: true, price: true, pricingType: true, serviceCategory: true } },
      reviews: { select: { id: true, rating: true } },
    },
  });
  if (!booking) return errorResponse("Booking not found", 404);

  // Authorization: user, provider, or admin
  if (user.role !== "admin") {
    const provider = await prisma.provider.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (booking.userId !== user.id && booking.providerId !== provider?.id) {
      return errorResponse("Not authorized", 403);
    }
  }

  return json(booking);
});
