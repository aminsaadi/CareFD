import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody } from "@/lib/api-utils";

export const PUT = withErrorHandler(async (req: NextRequest, ctx) => {
  await requireAdmin(req);
  const { regionId } = await ctx.params;
  const body = await parseBody<any>(req);

  if (body.action === "add_city") {
    const region = await prisma.region.findUnique({ where: { id: regionId } });
    if (!region) return errorResponse("Region not found", 404);
    if (!region.cities.includes(body.city)) {
      await prisma.region.update({ where: { id: regionId }, data: { cities: { push: body.city } } });
    }
    return json({ message: "City added" });
  }

  if (body.action === "remove_city") {
    const region = await prisma.region.findUnique({ where: { id: regionId } });
    if (!region) return errorResponse("Region not found", 404);
    await prisma.region.update({ where: { id: regionId }, data: { cities: region.cities.filter((c) => c !== body.city) } });
    return json({ message: "City removed" });
  }

  const data: any = {};
  if (body.name) data.name = body.name;
  if (body.name_en) data.nameEn = body.name_en;
  if (body.lat !== undefined) data.lat = body.lat;
  if (body.lng !== undefined) data.lng = body.lng;
  if (body.cities) data.cities = body.cities;

  await prisma.region.update({ where: { id: regionId }, data });
  return json({ message: "Updated" });
});

export const DELETE = withErrorHandler(async (req: NextRequest, ctx) => {
  await requireAdmin(req);
  const { regionId } = await ctx.params;
  await prisma.region.delete({ where: { id: regionId } });
  return json({ message: "Deleted" });
});
