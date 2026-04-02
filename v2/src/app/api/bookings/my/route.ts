import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, withErrorHandler, getSearchParams } from "@/lib/api-utils";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const sp = getSearchParams(req);
  const status = sp.get("status");
  const skip = parseInt(sp.get("skip") || "0");
  const limit = Math.min(100, parseInt(sp.get("limit") || "20"));

  const where: any = { userId: user.id };
  if (status) where.status = status;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.booking.count({ where }),
  ]);

  return json({ bookings, total, skip, limit });
});
