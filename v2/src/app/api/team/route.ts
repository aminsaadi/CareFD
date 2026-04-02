import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody } from "@/lib/api-utils";

// GET /api/team
export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const provider = await prisma.provider.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!provider) return errorResponse("Provider not found", 404);
  const members = await prisma.teamMember.findMany({ where: { providerId: provider.id }, orderBy: { createdAt: "desc" } });
  return json({ team_members: members });
});

// POST /api/team
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const body = await parseBody<{ name: string; role: string; specializations?: string[]; picture?: string }>(req);
  const provider = await prisma.provider.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!provider) return errorResponse("Provider not found", 404);

  const member = await prisma.teamMember.create({
    data: { providerId: provider.id, name: body.name, role: body.role, specializations: body.specializations || [], picture: body.picture },
  });
  return json(member, 201);
});
