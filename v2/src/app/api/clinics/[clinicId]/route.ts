import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody } from "@/lib/api-utils";

export const PUT = withErrorHandler(async (req: NextRequest, ctx) => {
  const { clinicId } = await ctx.params;
  const user = await requireAuth(req);
  const body = await parseBody<any>(req);
  const provider = await prisma.provider.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!provider) return errorResponse("Not authorized", 403);
  await prisma.clinic.updateMany({ where: { id: clinicId, providerId: provider.id }, data: { name: body.name, address: body.address, city: body.city, phone: body.phone } });
  return json({ message: "Updated" });
});

export const DELETE = withErrorHandler(async (req: NextRequest, ctx) => {
  const { clinicId } = await ctx.params;
  const user = await requireAuth(req);
  const provider = await prisma.provider.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!provider) return errorResponse("Not authorized", 403);
  await prisma.clinic.deleteMany({ where: { id: clinicId, providerId: provider.id } });
  return json({ message: "Deleted" });
});
