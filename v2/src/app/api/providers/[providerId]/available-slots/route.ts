import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { json, errorResponse, withErrorHandler, getSearchParams } from "@/lib/api-utils";

export const GET = withErrorHandler(async (req: NextRequest, ctx) => {
  const { providerId } = await ctx.params;
  const sp = getSearchParams(req);
  const date = sp.get("date");

  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: { id: true },
  });
  if (!provider) return errorResponse("Provider not found", 404);

  const availability = await prisma.providerAvailability.findMany({
    where: { providerId },
  });

  const bookingWhere: any = { providerId, status: { in: ["pending", "confirmed", "in_progress"] } };
  if (date) bookingWhere.bookingDate = { gte: new Date(date), lt: new Date(new Date(date).getTime() + 86400000) };

  const bookings = await prisma.booking.findMany({
    where: bookingWhere,
    select: { bookingDate: true, bookingTime: true },
  });

  const bookedSlots = bookings
    .filter((b) => b.bookingDate)
    .map((b) => `${b.bookingDate!.toISOString().split("T")[0]} ${b.bookingTime || ""}`);

  return json({
    availability: availability.map((a) => ({
      day: a.day, shift: a.shift, start_time: a.startTime, end_time: a.endTime, is_available: a.isAvailable,
    })),
    booked_slots: bookedSlots,
  });
});
