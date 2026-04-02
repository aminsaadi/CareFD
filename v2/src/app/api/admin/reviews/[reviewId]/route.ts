import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody } from "@/lib/api-utils";

export const PUT = withErrorHandler(async (req: NextRequest, ctx) => {
  const admin = await requireAdmin(req);
  const { reviewId } = await ctx.params;
  const body = await parseBody<{ action: "approve" | "reject"; notes?: string }>(req);

  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) return errorResponse("Review not found", 404);

  if (body.action === "approve") {
    await prisma.review.update({ where: { id: reviewId }, data: { status: "approved", approvedAt: new Date(), approvedBy: admin.id } });
    // Update provider average rating
    const stats = await prisma.review.aggregate({ where: { providerId: review.providerId, status: "approved" }, _avg: { rating: true }, _count: true });
    await prisma.provider.update({
      where: { id: review.providerId },
      data: { rating: stats._avg.rating || 0, totalReviews: stats._count },
    });
    return json({ message: "Review approved" });
  }

  if (body.action === "reject") {
    await prisma.review.update({ where: { id: reviewId }, data: { status: "rejected", adminNotes: body.notes } });
    return json({ message: "Review rejected" });
  }

  return errorResponse("Invalid action", 400);
});

export const DELETE = withErrorHandler(async (req: NextRequest, ctx) => {
  await requireAdmin(req);
  const { reviewId } = await ctx.params;
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) return errorResponse("Review not found", 404);
  await prisma.review.delete({ where: { id: reviewId } });
  // Recalculate provider rating
  const stats = await prisma.review.aggregate({ where: { providerId: review.providerId, status: "approved" }, _avg: { rating: true }, _count: true });
  await prisma.provider.update({ where: { id: review.providerId }, data: { rating: stats._avg.rating || 0, totalReviews: stats._count } });
  return json({ message: "Review deleted" });
});
