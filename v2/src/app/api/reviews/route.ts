import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody, getSearchParams } from "@/lib/api-utils";
import { createNotification } from "@/lib/notifications";

// POST /api/reviews - Create review
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const body = await parseBody<any>(req);

  if (!body.provider_id || !body.rating || !body.comment) return errorResponse("provider_id, rating, and comment required", 400);
  if (body.rating < 1 || body.rating > 5) return errorResponse("Rating must be 1-5", 400);

  // If booking_id provided, verify completed booking
  if (body.booking_id) {
    const booking = await prisma.booking.findFirst({ where: { id: body.booking_id, userId: user.id, status: "completed" } });
    if (!booking) return errorResponse("Completed booking not found", 400);
    const existingReview = await prisma.review.findFirst({ where: { bookingId: body.booking_id, userId: user.id } });
    if (existingReview) return errorResponse("כבר כתבת ביקורת להזמנה זו", 400);
  }

  const review = await prisma.review.create({
    data: {
      userId: user.id,
      providerId: body.provider_id,
      bookingId: body.booking_id,
      rating: body.rating,
      comment: body.comment,
      serviceQuality: body.service_quality,
      punctuality: body.punctuality,
      communication: body.communication,
      priceValue: body.price_value,
      wouldRecommend: body.would_recommend ?? true,
    },
  });

  // Notify provider
  const provider = await prisma.provider.findUnique({ where: { id: body.provider_id }, select: { userId: true } });
  if (provider) {
    await createNotification(provider.userId, "review_new", "ביקורת חדשה", `קיבלת ביקורת חדשה עם דירוג ${body.rating} כוכבים`, { review_id: review.id });
  }

  return json({ review_id: review.id, message: "הביקורת נשלחה לאישור" }, 201);
});

// GET /api/reviews?provider_id=xxx - Get provider reviews
export const GET = withErrorHandler(async (req: NextRequest) => {
  const sp = getSearchParams(req);
  const providerId = sp.get("provider_id");
  const skip = parseInt(sp.get("skip") || "0");
  const limit = Math.min(50, parseInt(sp.get("limit") || "10"));

  if (!providerId) return errorResponse("provider_id required", 400);

  const [reviews, total, stats] = await Promise.all([
    prisma.review.findMany({
      where: { providerId, status: "approved" },
      orderBy: { createdAt: "desc" },
      skip, take: limit,
      include: { user: { select: { name: true, picture: true } } },
    }),
    prisma.review.count({ where: { providerId, status: "approved" } }),
    prisma.review.aggregate({ where: { providerId, status: "approved" }, _avg: { rating: true }, _count: true }),
  ]);

  return json({ reviews, total, average_rating: stats._avg.rating, total_reviews: stats._count, skip, limit });
});
