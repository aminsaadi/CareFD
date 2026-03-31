import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody } from "@/lib/api-utils";

export const PUT = withErrorHandler(async (req: NextRequest, ctx) => {
  await requireAdmin(req);
  const { postId } = await ctx.params;
  const body = await parseBody<any>(req);
  await prisma.blogPost.update({ where: { id: postId }, data: { title: body.title, slug: body.slug, content: body.content, author: body.author, isPublished: body.is_published } });
  return json({ message: "Updated" });
});

export const DELETE = withErrorHandler(async (req: NextRequest, ctx) => {
  await requireAdmin(req);
  const { postId } = await ctx.params;
  await prisma.blogPost.delete({ where: { id: postId } });
  return json({ message: "Deleted" });
});
