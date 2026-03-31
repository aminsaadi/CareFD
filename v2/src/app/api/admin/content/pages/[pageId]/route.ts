import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { json, withErrorHandler, parseBody } from "@/lib/api-utils";

export const PUT = withErrorHandler(async (req: NextRequest, ctx) => {
  await requireAdmin(req);
  const { pageId } = await ctx.params;
  const body = await parseBody<any>(req);
  await prisma.staticPage.update({ where: { id: pageId }, data: { title: body.title, slug: body.slug, content: body.content, isActive: body.is_active } });
  return json({ message: "Updated" });
});

export const DELETE = withErrorHandler(async (req: NextRequest, ctx) => {
  await requireAdmin(req);
  const { pageId } = await ctx.params;
  await prisma.staticPage.delete({ where: { id: pageId } });
  return json({ message: "Deleted" });
});
