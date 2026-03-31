import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody } from "@/lib/api-utils";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const provider = await prisma.provider.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!provider) return errorResponse("Provider not found", 404);
  const clinics = await prisma.clinic.findMany({ where: { providerId: provider.id }, orderBy: { createdAt: "desc" } });
  return json({ clinics });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const body = await parseBody<{ name: string; address?: string; city?: string; phone?: string }>(req);
  const provider = await prisma.provider.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!provider) return errorResponse("Provider not found", 404);
  const clinic = await prisma.clinic.create({ data: { providerId: provider.id, name: body.name, address: body.address, city: body.city, phone: body.phone } });
  return json(clinic, 201);
});
