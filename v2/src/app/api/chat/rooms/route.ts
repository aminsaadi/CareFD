import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody, getSearchParams } from "@/lib/api-utils";

// POST /api/chat/rooms - Create or get existing chat room
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const body = await parseBody<{ provider_id: string; request_id?: string; booking_id?: string }>(req);

  // Check if room already exists
  const existing = await prisma.chatRoom.findFirst({
    where: {
      OR: [
        { userId: user.id, providerId: body.provider_id },
        // If user is provider, reverse lookup
      ],
    },
  });
  if (existing) return json({ room_id: existing.id, existing: true });

  const room = await prisma.chatRoom.create({
    data: {
      userId: user.id,
      providerId: body.provider_id,
      requestId: body.request_id,
      bookingId: body.booking_id,
    },
  });

  return json({ room_id: room.id, existing: false }, 201);
});

// GET /api/chat/rooms - Get user's chat rooms
export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const sp = getSearchParams(req);
  const includeArchived = sp.get("archived") === "true";

  const provider = await prisma.provider.findUnique({ where: { userId: user.id }, select: { id: true } });

  const rooms = await prisma.chatRoom.findMany({
    where: {
      OR: [
        { userId: user.id },
        ...(provider ? [{ providerId: provider.id }] : []),
      ],
      deletedBy: { isEmpty: true },
      ...(includeArchived ? {} : { NOT: { archivedBy: { has: user.id } } }),
    },
    orderBy: { lastMessageAt: { sort: "desc", nulls: "last" } },
    include: {
      user: { select: { id: true, name: true, picture: true } },
      provider: { select: { id: true, businessName: true, profileImage: true, userId: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { content: true, createdAt: true, senderId: true } },
    },
  });

  const result = rooms.map((room) => {
    const lastMsg = room.messages[0];
    return {
      room_id: room.id,
      user_id: room.userId,
      provider_id: room.providerId,
      user_name: room.user.name,
      user_picture: room.user.picture,
      provider_name: room.provider.businessName,
      provider_picture: room.provider.profileImage,
      last_message: lastMsg?.content,
      last_message_at: lastMsg?.createdAt || room.lastMessageAt,
      is_archived: room.archivedBy.includes(user.id),
      created_at: room.createdAt,
    };
  });

  return json({ rooms: result });
});
