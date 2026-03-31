import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, getSearchParams } from "@/lib/api-utils";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const provider = await prisma.provider.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!provider) return errorResponse("Provider profile not found", 404);

  const sp = getSearchParams(req);
  const status = sp.get("status");
  const skip = parseInt(sp.get("skip") || "0");
  const limit = Math.min(100, parseInt(sp.get("limit") || "20"));

  const where: any = { providerId: provider.id };
  if (status) where.status = status;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.booking.count({ where }),
  ]);

  return json({ bookings, total, skip, limit });
});
