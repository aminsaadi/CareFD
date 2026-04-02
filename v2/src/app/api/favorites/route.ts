import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, withErrorHandler } from "@/lib/api-utils";

// GET /api/favorites
export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: {
      provider: { select: { id: true, businessName: true, profileImage: true, city: true, rating: true, totalReviews: true, professionName: true, isVerified: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return json({ favorites: favorites.map((f) => ({ ...f.provider, favorited_at: f.createdAt })) });
});
