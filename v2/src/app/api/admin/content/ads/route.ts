import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { json, withErrorHandler, parseBody } from "@/lib/api-utils";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);
  const ads = await prisma.ad.findMany({ orderBy: { createdAt: "desc" } });
  return json({ ads });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);
  const body = await parseBody<{ title: string; description?: string; image_url?: string; link_url?: string }>(req);
  const ad = await prisma.ad.create({ data: { title: body.title, description: body.description, imageUrl: body.image_url, linkUrl: body.link_url } });
  return json(ad, 201);
});
