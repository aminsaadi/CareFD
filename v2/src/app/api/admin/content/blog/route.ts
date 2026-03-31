import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { json, withErrorHandler, parseBody, getSearchParams } from "@/lib/api-utils";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);
  const sp = getSearchParams(req);
  const skip = parseInt(sp.get("skip") || "0");
  const limit = parseInt(sp.get("limit") || "20");
  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({ orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.blogPost.count(),
  ]);
  return json({ posts, total });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);
  const body = await parseBody<{ title: string; slug: string; content: string; author?: string; is_published?: boolean }>(req);
  const post = await prisma.blogPost.create({ data: { title: body.title, slug: body.slug, content: body.content, author: body.author, isPublished: body.is_published ?? false } });
  return json(post, 201);
});
