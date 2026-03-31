import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, getSearchParams } from "@/lib/api-utils";

// GET /api/chat/messages/:roomId - Get messages in room
export const GET = withErrorHandler(async (req: NextRequest, ctx) => {
  const { roomId } = await ctx.params;
  const user = await requireAuth(req);
  const sp = getSearchParams(req);
  const skip = parseInt(sp.get("skip") || "0");
  const limit = Math.min(100, parseInt(sp.get("limit") || "50"));

  const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
  if (!room) return errorResponse("Room not found", 404);

  const provider = await prisma.provider.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (room.userId !== user.id && room.providerId !== provider?.id && user.role !== "admin") {
    return errorResponse("Not authorized", 403);
  }

  const messages = await prisma.chatMessage.findMany({
    where: { roomId },
    orderBy: { createdAt: "asc" },
    skip,
    take: limit,
  });

  // Mark unread messages as read
  await prisma.chatMessage.updateMany({
    where: { roomId, senderId: { not: user.id }, isRead: false },
    data: { isRead: true },
  });

  return json({ messages, room_id: roomId });
});
