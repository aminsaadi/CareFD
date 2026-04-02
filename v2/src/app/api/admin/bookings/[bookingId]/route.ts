import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody } from "@/lib/api-utils";

export const PUT = withErrorHandler(async (req: NextRequest, ctx) => {
  await requireAdmin(req);
  const { bookingId } = await ctx.params;
  const body = await parseBody<{ status: string }>(req);
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return errorResponse("Booking not found", 404);
  await prisma.booking.update({ where: { id: bookingId }, data: { status: body.status as any } });
  return json({ message: "Booking status updated" });
});
