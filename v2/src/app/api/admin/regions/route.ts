import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { json, withErrorHandler, parseBody } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async () => {
  const regions = await prisma.region.findMany({ orderBy: { name: "asc" } });
  return json({ regions });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);
  const body = await parseBody<{ name: string; name_en?: string; cities?: string[]; lat?: number; lng?: number }>(req);
  const region = await prisma.region.create({
    data: { name: body.name, nameEn: body.name_en, cities: body.cities || [], lat: body.lat, lng: body.lng },
  });
  return json(region, 201);
});
