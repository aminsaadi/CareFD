import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { json, withErrorHandler, getSearchParams } from "@/lib/api-utils";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);
  const sp = getSearchParams(req);
  const status = sp.get("status");
  const skip = parseInt(sp.get("skip") || "0");
  const limit = Math.min(100, parseInt(sp.get("limit") || "20"));

  const where: any = {};
  if (status) where.status = status;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where, orderBy: { createdAt: "desc" }, skip, take: limit,
      include: {
        service: { select: { name: true } },
      },
    }),
    prisma.booking.count({ where }),
  ]);

  return json({ bookings, total, skip, limit });
});
