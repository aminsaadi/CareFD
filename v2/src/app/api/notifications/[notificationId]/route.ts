import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, errorResponse, withErrorHandler } from "@/lib/api-utils";

// PUT /api/notifications/:id - Mark as read
export const PUT = withErrorHandler(async (req: NextRequest, ctx) => {
  const { notificationId } = await ctx.params;
  const user = await requireAuth(req);

  const notif = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notif || notif.userId !== user.id) return errorResponse("Not found", 404);

  await prisma.notification.update({ where: { id: notificationId }, data: { isRead: true } });
  return json({ message: "סומן כנקרא" });
});

// DELETE /api/notifications/:id
export const DELETE = withErrorHandler(async (req: NextRequest, ctx) => {
  const { notificationId } = await ctx.params;
  const user = await requireAuth(req);

  const notif = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notif || notif.userId !== user.id) return errorResponse("Not found", 404);

  await prisma.notification.delete({ where: { id: notificationId } });
  return json({ message: "ההתראה נמחקה" });
});
