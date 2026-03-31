import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { json, withErrorHandler, getSearchParams } from "@/lib/api-utils";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);
  const sp = getSearchParams(req);
  const search = sp.get("search");
  const status = sp.get("status"); // pending, verified, rejected
  const skip = parseInt(sp.get("skip") || "0");
  const limit = Math.min(100, parseInt(sp.get("limit") || "20"));

  const where: any = {};
  if (search) {
    where.OR = [
      { businessName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status === "pending") where.verificationStatus = { in: ["pending", "documents_submitted"] };
  else if (status) where.verificationStatus = status;

  const [providers, total] = await Promise.all([
    prisma.provider.findMany({
      where, orderBy: { createdAt: "desc" }, skip, take: limit,
      include: { user: { select: { email: true, name: true } } },
    }),
    prisma.provider.count({ where }),
  ]);

  return json({ providers, total, skip, limit });
});
