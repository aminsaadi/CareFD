import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, withErrorHandler, getSearchParams } from "@/lib/api-utils";

// POST /api/favorites/:providerId - Add favorite
export const POST = withErrorHandler(async (req: NextRequest, ctx) => {
  const { providerId } = await ctx.params;
  const user = await requireAuth(req);
  await prisma.favorite.upsert({
    where: { userId_providerId: { userId: user.id, providerId } },
    update: {},
    create: { userId: user.id, providerId },
  });
  return json({ message: "נוסף למועדפים" });
});

// DELETE /api/favorites/:providerId - Remove favorite
export const DELETE = withErrorHandler(async (req: NextRequest, ctx) => {
  const { providerId } = await ctx.params;
  const user = await requireAuth(req);
  await prisma.favorite.deleteMany({ where: { userId: user.id, providerId } });
  return json({ message: "הוסר מהמועדפים" });
});

// GET /api/favorites/:providerId - Check if favorited
export const GET = withErrorHandler(async (req: NextRequest, ctx) => {
  const { providerId } = await ctx.params;
  const user = await requireAuth(req);
  const fav = await prisma.favorite.findUnique({ where: { userId_providerId: { userId: user.id, providerId } } });
  return json({ is_favorited: !!fav });
});
