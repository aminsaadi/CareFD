import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { json, withErrorHandler, parseBody } from "@/lib/api-utils";

export const PUT = withErrorHandler(async (req: NextRequest, ctx) => {
  await requireAdmin(req);
  const { adId } = await ctx.params;
  const body = await parseBody<any>(req);
  await prisma.ad.update({ where: { id: adId }, data: { title: body.title, description: body.description, imageUrl: body.image_url, linkUrl: body.link_url, isActive: body.is_active } });
  return json({ message: "Updated" });
});

export const DELETE = withErrorHandler(async (req: NextRequest, ctx) => {
  await requireAdmin(req);
  const { adId } = await ctx.params;
  await prisma.ad.delete({ where: { id: adId } });
  return json({ message: "Deleted" });
});
