import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { json, withErrorHandler, getSearchParams } from "@/lib/api-utils";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);
  const sp = getSearchParams(req);
  const status = sp.get("status") || "pending";
  const skip = parseInt(sp.get("skip") || "0");
  const limit = parseInt(sp.get("limit") || "20");

  const where: any = {};
  if (status !== "all") where.status = status;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where, orderBy: { createdAt: "desc" }, skip, take: limit,
      include: {
        user: { select: { name: true, email: true } },
        provider: { select: { businessName: true } },
      },
    }),
    prisma.review.count({ where }),
  ]);

  return json({ reviews, total, skip, limit });
});
