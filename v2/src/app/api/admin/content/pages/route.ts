import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { json, withErrorHandler, parseBody } from "@/lib/api-utils";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);
  const pages = await prisma.staticPage.findMany({ orderBy: { createdAt: "desc" } });
  return json({ pages });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);
  const body = await parseBody<{ title: string; slug: string; content: string; is_active?: boolean }>(req);
  const page = await prisma.staticPage.create({ data: { title: body.title, slug: body.slug, content: body.content, isActive: body.is_active ?? true } });
  return json(page, 201);
});
