import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody } from "@/lib/api-utils";
import { createNotification } from "@/lib/notifications";

// POST /api/chat/messages - Send message
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const body = await parseBody<{ room_id: string; content?: string; message_type?: string; attachment_url?: string; attachment_name?: string }>(req);

  if (!body.content?.trim() && !body.attachment_url) return errorResponse("Message must have content or attachment", 400);

  const room = await prisma.chatRoom.findUnique({
    where: { id: body.room_id },
    include: { provider: { select: { userId: true, businessName: true } }, user: { select: { id: true, name: true } } },
  });
  if (!room) return errorResponse("Room not found", 404);

  // Verify the authenticated user is a participant in this chat room
  const provider = await prisma.provider.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (room.userId !== user.id && room.providerId !== provider?.id && user.role !== "admin") {
    return errorResponse("Not authorized", 403);
  }

  const senderRole = user.id === room.userId ? "patient" : "provider";

  const message = await prisma.chatMessage.create({
    data: {
      roomId: body.room_id,
      senderId: user.id,
      senderRole,
      content: body.content || "",
      messageType: (body.message_type as "text" | "image" | "file") || "text",
      attachmentUrl: body.attachment_url,
      attachmentName: body.attachment_name,
    },
  });

  // Update room last_message_at
  await prisma.chatRoom.update({ where: { id: body.room_id }, data: { lastMessageAt: new Date() } });

  // Notify recipient
  const recipientId = user.id === room.userId ? room.provider.userId : room.userId;
  const senderName = user.id === room.userId ? room.user.name : room.provider.businessName;
  await createNotification(recipientId, "message_new", "הודעה חדשה", `${senderName}: ${(body.content || "קובץ").substring(0, 50)}`, { room_id: body.room_id });

  return json({
    message_id: message.id,
    room_id: message.roomId,
    sender_id: message.senderId,
    content: message.content,
    created_at: message.createdAt,
  }, 201);
});
