import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { json, withErrorHandler, parseBody } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);
  const settings = await prisma.siteSetting.findUnique({ where: { id: "main" } });
  const data = (settings?.data as Record<string, any>) || {};
  return json({ delivery_types: data.delivery_types || [] });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);
  const body = await parseBody<{ name: string; name_en?: string; description?: string; icon?: string; is_active?: boolean; requires_address?: boolean }>(req);

  const settings = await prisma.siteSetting.findUnique({ where: { id: "main" } });
  const data = (settings?.data as Record<string, any>) || {};
  const types = data.delivery_types || [];
  const newType = { id: `dt_${Date.now()}`, ...body, is_active: body.is_active ?? true };
  types.push(newType);

  await prisma.siteSetting.upsert({
    where: { id: "main" },
    update: { data: { ...data, delivery_types: types } },
    create: { id: "main", data: { delivery_types: types } },
  });

  return json(newType, 201);
});
