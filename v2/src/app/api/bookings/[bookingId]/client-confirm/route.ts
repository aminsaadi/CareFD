import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody } from "@/lib/api-utils";

export const POST = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
  const user = await requireAuth(req);
  const { bookingId } = await ctx.params;
  const body = await parseBody<{ notes?: string }>(req);

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return errorResponse("Booking not found", 404);
  if (booking.userId !== user.id) return errorResponse("Unauthorized", 403);
  if (booking.status !== "provider_completed") return errorResponse("Booking not ready for confirmation", 400);

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "completed", completedAt: new Date(), paymentNotes: body.notes || undefined },
  });

  return json({ booking: updated });
});
