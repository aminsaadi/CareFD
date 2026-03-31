import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody } from "@/lib/api-utils";
import { createNotification } from "@/lib/notifications";

export const GET = withErrorHandler(async (req: NextRequest, ctx) => {
  await requireAdmin(req);
  const { providerId } = await ctx.params;
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    include: {
      user: { select: { email: true, name: true, phone: true } },
      services: true,
      verificationDocuments: true,
      teamMembers: true,
      availability: true,
    },
  });
  if (!provider) return errorResponse("Provider not found", 404);
  return json(provider);
});

export const PUT = withErrorHandler(async (req: NextRequest, ctx) => {
  await requireAdmin(req);
  const { providerId } = await ctx.params;
  const body = await parseBody<any>(req);

  // Handle special actions
  if (body.action === "verify") {
    await prisma.provider.update({ where: { id: providerId }, data: { isVerified: true, verificationStatus: "verified" } });
    const p = await prisma.provider.findUnique({ where: { id: providerId }, select: { userId: true } });
    if (p) await createNotification(p.userId, "provider_verified", "החשבון אומת!", "חשבון הספק שלך אומת בהצלחה. כעת הפרופיל שלך מופיע בחיפוש.", {});
    return json({ message: "Provider verified" });
  }

  if (body.action === "reject") {
    await prisma.provider.update({ where: { id: providerId }, data: { verificationStatus: "rejected", verificationNotes: body.notes } });
    const p = await prisma.provider.findUnique({ where: { id: providerId }, select: { userId: true } });
    if (p) await createNotification(p.userId, "provider_rejected", "האימות נדחה", body.notes || "בקשת האימות נדחתה", {});
    return json({ message: "Provider rejected" });
  }

  if (body.action === "recommend") {
    await prisma.provider.update({ where: { id: providerId }, data: { isRecommended: true } });
    return json({ message: "Provider recommended" });
  }

  if (body.action === "unrecommend") {
    await prisma.provider.update({ where: { id: providerId }, data: { isRecommended: false } });
    return json({ message: "Provider unrecommended" });
  }

  // Generic update
  const data: any = {};
  const allowed = ["businessName", "description", "isVerified", "isRecommended", "verificationStatus", "verificationNotes", "subscriptionTier"];
  for (const key of allowed) {
    const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    if (body[snakeKey] !== undefined) data[key] = body[snakeKey];
    if (body[key] !== undefined) data[key] = body[key];
  }
  if (Object.keys(data).length > 0) {
    await prisma.provider.update({ where: { id: providerId }, data });
  }
  return json({ message: "Updated" });
});

export const DELETE = withErrorHandler(async (req: NextRequest, ctx) => {
  await requireAdmin(req);
  const { providerId } = await ctx.params;
  // Cascade: delete services first
  await prisma.$transaction([
    prisma.service.deleteMany({ where: { providerId } }),
    prisma.provider.delete({ where: { id: providerId } }),
  ]);
  return json({ message: "Provider deleted" });
});
