import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { json, withErrorHandler, getSearchParams } from "@/lib/api-utils";

// GET /api/admin/users
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);
  const sp = getSearchParams(req);
  const search = sp.get("search");
  const role = sp.get("role");
  const skip = parseInt(sp.get("skip") || "0");
  const limit = Math.min(100, parseInt(sp.get("limit") || "20"));

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (role) where.role = role;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip, take: limit,
      select: { id: true, userNumber: true, email: true, name: true, role: true, isVerified: true, isSuspended: true, emailVerified: true, createdAt: true, picture: true, phone: true },
    }),
    prisma.user.count({ where }),
  ]);

  return json({ users, total, skip, limit });
});
