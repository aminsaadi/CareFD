import prisma from "@/lib/db";
import { json, withErrorHandler } from "@/lib/api-utils";

export const GET = withErrorHandler(async () => {
  const regions = await prisma.region.findMany({ orderBy: { name: "asc" } });
  return json({ regions: regions.map((r) => ({ region_id: r.id, name: r.name, name_en: r.nameEn, cities: r.cities, lat: r.lat, lng: r.lng })) });
});
