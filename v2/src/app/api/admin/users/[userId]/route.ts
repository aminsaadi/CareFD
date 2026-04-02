import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody } from "@/lib/api-utils";

// GET /api/admin/users/:userId
export const GET = withErrorHandler(async (req: NextRequest, ctx) => {
  await requireAdmin(req);
  const { userId } = await ctx.params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      provider: { select: { id: true, businessName: true, isVerified: true, verificationStatus: true } },
      verificationDocuments: true,
    },
  });
  if (!user) return errorResponse("User not found", 404);
  return json(user);
});

// PUT /api/admin/users/:userId
export const PUT = withErrorHandler(async (req: NextRequest, ctx) => {
  await requireAdmin(req);
  const { userId } = await ctx.params;
  const body = await parseBody<any>(req);

  const data: any = {};
  if (body.name) data.name = body.name;
  if (body.role) data.role = body.role;
  if (body.is_suspended !== undefined) {
    data.isSuspended = body.is_suspended;
    data.suspendedAt = body.is_suspended ? new Date() : null;
    data.suspensionReason = body.suspension_reason;
  }
  if (body.password) data.passwordHash = await hashPassword(body.password);
  if (body.is_verified !== undefined) data.isVerified = body.is_verified;

  await prisma.user.update({ where: { id: userId }, data });
  return json({ message: "User updated" });
});

// DELETE /api/admin/users/:userId
export const DELETE = withErrorHandler(async (req: NextRequest, ctx) => {
  await requireAdmin(req);
  const { userId } = await ctx.params;
  await prisma.user.delete({ where: { id: userId } });
  return json({ message: "User deleted" });
});
