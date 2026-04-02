import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { json, withErrorHandler } from "@/lib/api-utils";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalUsers, totalProviders, totalBookings, totalServices, totalRequests,
    pendingProviders, todayBookings, monthlyRevenue, totalReviews, avgRating] = await Promise.all([
    prisma.user.count(),
    prisma.provider.count(),
    prisma.booking.count(),
    prisma.service.count({ where: { isActive: true } }),
    prisma.serviceRequest.count(),
    prisma.provider.count({ where: { verificationStatus: { in: ["pending", "documents_submitted"] } } }),
    prisma.booking.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.booking.aggregate({ where: { status: "completed", createdAt: { gte: monthStart } }, _sum: { finalPrice: true } }),
    prisma.review.count(),
    prisma.review.aggregate({ where: { status: "approved" }, _avg: { rating: true } }),
  ]);

  return json({
    total_users: totalUsers,
    total_providers: totalProviders,
    total_bookings: totalBookings,
    total_services: totalServices,
    total_requests: totalRequests,
    pending_providers: pendingProviders,
    today_bookings: todayBookings,
    monthly_revenue: monthlyRevenue._sum.finalPrice || 0,
    total_reviews: totalReviews,
    average_rating: avgRating._avg.rating || 0,
  });
});
