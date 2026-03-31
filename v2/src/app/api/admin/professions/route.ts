import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { json, withErrorHandler, parseBody } from "@/lib/api-utils";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);
  const professions = await prisma.profession.findMany({
    orderBy: { sortOrder: "asc" },
    include: { subProfessions: { orderBy: { sortOrder: "asc" }, include: { categories: true } } },
  });
  return json({ professions });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);
  const body = await parseBody<{ name: string; name_en?: string; icon?: string; specializations?: string[] }>(req);
  const count = await prisma.profession.count();
  const prof = await prisma.profession.create({
    data: { name: body.name, nameEn: body.name_en, icon: body.icon || "briefcase", specializations: body.specializations || [], sortOrder: count },
  });
  return json(prof, 201);
});
