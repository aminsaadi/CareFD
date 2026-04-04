import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);
  // Service types stored as JSON in site settings
  const settings = await prisma.siteSetting.findUnique({ where: { id: "main" } });
  const data = (settings?.data as Record<string, any>) || {};
  return json({ service_types: data.service_types || [] });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);
  const body = await parseBody<{ name: string; name_en?: string; description?: string; icon?: string; is_active?: boolean; requires_location?: boolean; minimum_hours?: number; has_shipping?: boolean }>(req);

  const settings = await prisma.siteSetting.findUnique({ where: { id: "main" } });
  const data = (settings?.data as Record<string, any>) || {};
  const types = data.service_types || [];
  const newType = { id: `st_${Date.now()}`, ...body, is_active: body.is_active ?? true };
  types.push(newType);

  await prisma.siteSetting.upsert({
    where: { id: "main" },
    update: { data: { ...data, service_types: types } },
    create: { id: "main", data: { service_types: types } },
  });

  return json(newType, 201);
});
