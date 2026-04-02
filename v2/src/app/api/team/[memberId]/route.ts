import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody } from "@/lib/api-utils";

// PUT /api/team/:memberId
export const PUT = withErrorHandler(async (req: NextRequest, ctx) => {
  const { memberId } = await ctx.params;
  const user = await requireAuth(req);
  const body = await parseBody<any>(req);
  const provider = await prisma.provider.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!provider) return errorResponse("Not authorized", 403);
  const member = await prisma.teamMember.findFirst({ where: { id: memberId, providerId: provider.id } });
  if (!member) return errorResponse("Member not found", 404);
  await prisma.teamMember.update({ where: { id: memberId }, data: { name: body.name, role: body.role, specializations: body.specializations, picture: body.picture } });
  return json({ message: "Updated" });
});

// DELETE /api/team/:memberId
export const DELETE = withErrorHandler(async (req: NextRequest, ctx) => {
  const { memberId } = await ctx.params;
  const user = await requireAuth(req);
  const provider = await prisma.provider.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!provider) return errorResponse("Not authorized", 403);
  await prisma.teamMember.deleteMany({ where: { id: memberId, providerId: provider.id } });
  return json({ message: "Deleted" });
});
