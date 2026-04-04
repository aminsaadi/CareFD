import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody } from "@/lib/api-utils";

export const PUT = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
  await requireAdmin(req);
  const { typeId } = await ctx.params;
  const body = await parseBody<Record<string, any>>(req);

  const settings = await prisma.siteSetting.findUnique({ where: { id: "main" } });
  const data = (settings?.data as Record<string, any>) || {};
  const types = (data.service_types || []) as any[];
  const idx = types.findIndex((t: any) => t.id === typeId);
  if (idx === -1) return errorResponse("Not found", 404);

  types[idx] = { ...types[idx], ...body };
  await prisma.siteSetting.update({ where: { id: "main" }, data: { data: { ...data, service_types: types } } });
  return json(types[idx]);
});

export const DELETE = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
  await requireAdmin(req);
  const { typeId } = await ctx.params;

  const settings = await prisma.siteSetting.findUnique({ where: { id: "main" } });
  const data = (settings?.data as Record<string, any>) || {};
  const types = (data.service_types || []) as any[];
  const filtered = types.filter((t: any) => t.id !== typeId);

  await prisma.siteSetting.update({ where: { id: "main" }, data: { data: { ...data, service_types: filtered } } });
  return json({ message: "Deleted" });
});
