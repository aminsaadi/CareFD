import prisma from "@/lib/db";
import { json, withErrorHandler } from "@/lib/api-utils";

// GET /api/providers/filters/options
export const GET = withErrorHandler(async () => {
  const [professions, distinctCities] = await Promise.all([
    prisma.profession.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        subProfessions: {
          orderBy: { sortOrder: "asc" },
          include: { categories: true },
        },
      },
    }),
    prisma.provider.findMany({
      where: { city: { not: null } },
      select: { city: true },
      distinct: ["city"],
    }),
  ]);

  const cities = distinctCities
    .map((p) => p.city!)
    .filter(Boolean)
    .sort();

  const categories = professions.map((prof) => ({
    id: prof.id,
    name: prof.name,
    name_en: prof.nameEn,
    icon: prof.icon,
  }));

  return json({
    cities: cities.length > 0 ? cities : ["תל אביב", "ירושלים", "חיפה", "באר שבע", "רמת גן", "הרצליה"],
    categories,
    professions: professions.map((p) => ({
      profession_id: p.id,
      name: p.name,
      name_en: p.nameEn,
      icon: p.icon,
      specializations: p.specializations,
      sub_professions: p.subProfessions.map((sp) => ({
        sub_profession_id: sp.id,
        name: sp.name,
        name_en: sp.nameEn,
        categories: sp.categories.map((c) => ({
          category_id: c.id,
          name: c.name,
          name_en: c.nameEn,
        })),
      })),
    })),
    service_types: [
      { id: "home_visit", name: "ביקור בית", name_en: "Home Visit" },
      { id: "clinic_visit", name: "ביקור במרפאה", name_en: "Clinic Visit" },
      { id: "video_call", name: "טלרפואה", name_en: "Video Call" },
      { id: "phone_call", name: "שיחה טלפונית", name_en: "Phone Call" },
    ],
    provider_types: [
      { id: "individual", name: "עצמאי", name_en: "Individual" },
      { id: "clinic", name: "מרפאה", name_en: "Clinic" },
      { id: "company", name: "חברה", name_en: "Company" },
    ],
    rating_options: [
      { value: 4.5, label: "4.5+ כוכבים" },
      { value: 4.0, label: "4.0+ כוכבים" },
      { value: 3.5, label: "3.5+ כוכבים" },
      { value: 3.0, label: "3.0+ כוכבים" },
    ],
    experience_options: [
      { value: 1, label: "שנה+" },
      { value: 3, label: "3 שנים+" },
      { value: 5, label: "5 שנים+" },
      { value: 10, label: "10 שנים+" },
    ],
    gender_options: [
      { value: "male", label: "זכר", label_en: "Male" },
      { value: "female", label: "נקבה", label_en: "Female" },
      { value: "other", label: "אחר", label_en: "Other" },
    ],
    language_options: [
      { value: "hebrew", label: "עברית" },
      { value: "arabic", label: "ערבית" },
      { value: "english", label: "אנגלית" },
      { value: "russian", label: "רוסית" },
      { value: "french", label: "צרפתית" },
      { value: "amharic", label: "אמהרית" },
    ],
  });
});
