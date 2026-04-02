import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, withErrorHandler, getSearchParams } from "@/lib/api-utils";

// GET /api/notifications
export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const sp = getSearchParams(req);
  const unreadOnly = sp.get("unread_only") === "true";
  const skip = parseInt(sp.get("skip") || "0");
  const limit = Math.min(100, parseInt(sp.get("limit") || "20"));

  const where: any = { userId: user.id };
  if (unreadOnly) where.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
  ]);

  return json({ notifications, total, unread_count: unreadCount, skip, limit });
});

// PUT /api/notifications - Mark all as read
export const PUT = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  await prisma.notification.updateMany({ where: { userId: user.id, isRead: false }, data: { isRead: true } });
  return json({ message: "כל ההתראות סומנו כנקראו" });
});
