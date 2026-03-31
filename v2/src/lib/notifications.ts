import prisma from "./db";
import type { NotificationType } from "@/generated/prisma/client";

/**
 * Create a notification for a user
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, unknown>
) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      data: data ? JSON.parse(JSON.stringify(data)) : undefined,
    },
  });
}

/**
 * Send push notification to user (stub – implement with web-push)
 */
export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  _data?: Record<string, unknown>
) {
  // TODO: Implement with web-push library
  // For now, just create in-app notification
  console.log(`[Push] To ${userId}: ${title} - ${body}`);
}
