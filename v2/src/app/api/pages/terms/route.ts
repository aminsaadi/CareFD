import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { json, withErrorHandler } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async () => {
  const page = await prisma.staticPage.findFirst({ where: { slug: "terms", isActive: true } });
  return json({ content: page?.content || null, title: page?.title || "תנאי שימוש" });
});
