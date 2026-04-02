import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody } from "@/lib/api-utils";

export const PUT = withErrorHandler(async (req: NextRequest, ctx) => {
  await requireAdmin(req);
  const { professionId } = await ctx.params;
  const body = await parseBody<any>(req);

  // Add sub-profession
  if (body.action === "add_sub") {
    const sub = await prisma.subProfession.create({
      data: { professionId, name: body.name, nameEn: body.name_en },
    });
    return json(sub, 201);
  }

  // Add category to sub-profession
  if (body.action === "add_category") {
    const cat = await prisma.serviceCategoryDef.create({
      data: { subProfessionId: body.sub_profession_id, name: body.name, nameEn: body.name_en },
    });
    return json(cat, 201);
  }

  // Update profession
  const data: any = {};
  if (body.name) data.name = body.name;
  if (body.name_en) data.nameEn = body.name_en;
  if (body.icon) data.icon = body.icon;
  if (body.specializations) data.specializations = body.specializations;
  if (body.sort_order !== undefined) data.sortOrder = body.sort_order;

  await prisma.profession.update({ where: { id: professionId }, data });
  return json({ message: "Updated" });
});

export const DELETE = withErrorHandler(async (req: NextRequest, ctx) => {
  await requireAdmin(req);
  const { professionId } = await ctx.params;
  await prisma.profession.delete({ where: { id: professionId } });
  return json({ message: "Deleted" });
});
