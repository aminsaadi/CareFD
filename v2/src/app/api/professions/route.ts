import prisma from "@/lib/db";
import { json, withErrorHandler } from "@/lib/api-utils";
import { defaultProfessions } from "@/lib/seed/professions";

export const dynamic = "force-dynamic";

// GET /api/professions - Public endpoint for professions hierarchy
export const GET = withErrorHandler(async () => {
  let professions = await prisma.profession.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      subProfessions: {
        orderBy: { sortOrder: "asc" },
        include: {
          categories: true,
        },
      },
    },
  });

  // Auto-initialize if empty
  if (professions.length === 0) {
    await seedDefaultProfessions();
    professions = await prisma.profession.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        subProfessions: {
          orderBy: { sortOrder: "asc" },
          include: { categories: true },
        },
      },
    });
  }

  const result = professions.map((prof) => ({
    profession_id: prof.id,
    name: prof.name,
    name_en: prof.nameEn,
    icon: prof.icon,
    specializations: prof.specializations,
    sub_professions: prof.subProfessions.map((sub) => ({
      sub_profession_id: sub.id,
      name: sub.name,
      name_en: sub.nameEn,
      categories: sub.categories.map((cat) => ({
        category_id: cat.id,
        name: cat.name,
        name_en: cat.nameEn,
      })),
    })),
  }));

  return json({ professions: result });
});

async function seedDefaultProfessions() {
  for (const prof of defaultProfessions) {
    await prisma.profession.create({
      data: {
        id: prof.id,
        name: prof.name,
        nameEn: prof.nameEn,
        icon: prof.icon,
        specializations: prof.specializations,
        sortOrder: prof.sortOrder,
        subProfessions: {
          create: prof.subProfessions.map((sub, si) => ({
            id: sub.id,
            name: sub.name,
            nameEn: sub.nameEn,
            sortOrder: si,
            categories: {
              create: sub.categories.map((cat) => ({
                id: cat.id,
                name: cat.name,
                nameEn: cat.nameEn,
              })),
            },
          })),
        },
      },
    });
  }
}
