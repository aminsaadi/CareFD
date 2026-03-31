import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody } from "@/lib/api-utils";

// PUT /api/chat/rooms/:roomId - Archive/unarchive
export const PUT = withErrorHandler(async (req: NextRequest, ctx) => {
  const { roomId } = await ctx.params;
  const user = await requireAuth(req);
  const body = await parseBody<{ action: "archive" | "unarchive" }>(req);

  const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
  if (!room) return errorResponse("Room not found", 404);

  if (body.action === "archive") {
    if (!room.archivedBy.includes(user.id)) {
      await prisma.chatRoom.update({ where: { id: roomId }, data: { archivedBy: { push: user.id } } });
    }
  } else {
    await prisma.chatRoom.update({
      where: { id: roomId },
      data: { archivedBy: room.archivedBy.filter((id) => id !== user.id) },
    });
  }

  return json({ message: body.action === "archive" ? "הצ'אט הועבר לארכיון" : "הצ'אט שוחזר" });
});

// DELETE /api/chat/rooms/:roomId - Soft delete per user
export const DELETE = withErrorHandler(async (req: NextRequest, ctx) => {
  const { roomId } = await ctx.params;
  const user = await requireAuth(req);

  const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
  if (!room) return errorResponse("Room not found", 404);

  if (!room.deletedBy.includes(user.id)) {
    await prisma.chatRoom.update({ where: { id: roomId }, data: { deletedBy: { push: user.id } } });
  }

  return json({ message: "הצ'אט נמחק" });
});
