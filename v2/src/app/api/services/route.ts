import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody, getSearchParams } from "@/lib/api-utils";
import { Prisma } from "@/generated/prisma/client";

// GET /api/services - Search services
export const GET = withErrorHandler(async (req: NextRequest) => {
  const sp = getSearchParams(req);

  const search = sp.get("search") || undefined;
  const serviceType = sp.get("service_type") || undefined;
  const serviceCategory = sp.get("service_category") || undefined;
  const priceMin = sp.get("price_min") ? parseFloat(sp.get("price_min")!) : undefined;
  const priceMax = sp.get("price_max") ? parseFloat(sp.get("price_max")!) : undefined;
  const city = sp.get("city") || undefined;
  const profession = sp.get("profession") || undefined;
  const gender = sp.get("gender") || undefined;
  const languages = sp.get("languages")?.split(",").filter(Boolean);
  const healthFunds = sp.get("health_funds")?.split(",").filter(Boolean);
  const minRating = sp.get("min_rating") ? parseFloat(sp.get("min_rating")!) : undefined;
  const verifiedOnly = sp.get("verified_only") === "true";
  const sortBy = sp.get("sort_by") || "popular";
  const skip = Math.max(0, parseInt(sp.get("skip") || "0"));
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") || "20")));

  // Build service-level filters
  const andConditions: Prisma.ServiceWhereInput[] = [{ isActive: true }];

  if (search) {
    andConditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { provider: { businessName: { contains: search, mode: "insensitive" } } },
      ],
    });
  }

  if (serviceType) {
    andConditions.push({ deliveryTypes: { has: serviceType } });
  }

  if (serviceCategory) {
    andConditions.push({ serviceCategory: serviceCategory as Prisma.EnumServiceCategoryFilter["equals"] });
  }

  if (priceMin !== undefined) {
    andConditions.push({ price: { gte: priceMin } });
  }

  if (priceMax !== undefined) {
    andConditions.push({ price: { lte: priceMax } });
  }

  // Provider-level filters via relation
  if (city) {
    andConditions.push({
      provider: { city: { contains: city, mode: "insensitive" } },
    });
  }

  if (profession) {
    andConditions.push({
      provider: {
        OR: [
          { professionName: { contains: profession, mode: "insensitive" } },
          { specializations: { has: profession } },
        ],
      },
    });
  }

  if (gender) {
    andConditions.push({ provider: { gender } });
  }

  if (languages && languages.length > 0) {
    andConditions.push({ provider: { languages: { hasSome: languages } } });
  }

  if (healthFunds && healthFunds.length > 0) {
    andConditions.push({ provider: { healthFunds: { hasSome: healthFunds } } });
  }

  if (minRating) {
    andConditions.push({ provider: { rating: { gte: minRating } } });
  }

  if (verifiedOnly) {
    andConditions.push({ provider: { isVerified: true } });
  }

  const fullWhere: Prisma.ServiceWhereInput = { AND: andConditions };

  // Sorting
  let orderBy: Prisma.ServiceOrderByWithRelationInput = { createdAt: "desc" };
  if (sortBy === "price_low") orderBy = { price: "asc" };
  else if (sortBy === "price_high") orderBy = { price: "desc" };
  else if (sortBy === "rating") orderBy = { provider: { rating: "desc" } };
  else if (sortBy === "newest") orderBy = { createdAt: "desc" };

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where: fullWhere,
      orderBy,
      skip,
      take: limit,
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
            rating: true,
            totalReviews: true,
            city: true,
            phone: true,
            gender: true,
            languages: true,
            healthFunds: true,
            specializations: true,
            professionTitle: true,
            isVerified: true,
            isRecommended: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    }),
    prisma.service.count({ where: fullWhere }),
  ]);

  return json({
    services: services.map((s) => ({
      service_id: s.id,
      service_number: s.serviceNumber,
      provider_id: s.providerId,
      name: s.name,
      description: s.description,
      service_category: s.serviceCategory,
      delivery_types: s.deliveryTypes,
      pricing_type: s.pricingType,
      price: s.price,
      currency: s.currency,
      duration_minutes: s.durationMinutes,
      is_active: s.isActive,
      created_at: s.createdAt,
      provider: {
        provider_id: s.provider.id,
        business_name: s.provider.businessName,
        rating: s.provider.rating,
        total_reviews: s.provider.totalReviews,
        location: { city: s.provider.city },
        phone: s.provider.phone,
        gender: s.provider.gender,
        languages: s.provider.languages,
        health_funds: s.provider.healthFunds,
        specializations: s.provider.specializations,
        profession_title: s.provider.professionTitle,
        is_verified: s.provider.isVerified,
        is_recommended: s.provider.isRecommended,
      },
    })),
    total,
    skip,
    limit,
  });
});

// POST /api/services - Create a service
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);

  const provider = await prisma.provider.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!provider) return errorResponse("Provider profile not found", 404);

  const body = await parseBody<{
    name: string;
    description: string;
    service_category?: string;
    delivery_types?: string[];
    pricing_type?: string;
    price: number;
    duration_minutes?: number;
    minimum_hours?: number;
    categories?: unknown[];
  }>(req);

  if (!body.name || body.price === undefined) {
    return errorResponse("Name and price are required", 400);
  }

  const serviceNumber = `S${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

  const service = await prisma.service.create({
    data: {
      serviceNumber,
      providerId: provider.id,
      name: body.name,
      description: body.description || "",
      serviceCategory: (body.service_category as "consultation" | "visit" | "product" | "hourly" | "procedure" | "series") || "visit",
      deliveryTypes: body.delivery_types || [],
      pricingType: (body.pricing_type as "fixed" | "per_hour" | "per_visit" | "per_unit" | "per_procedure" | "per_series") || "fixed",
      price: body.price,
      durationMinutes: body.duration_minutes,
      minimumHours: body.minimum_hours,
      categories: JSON.stringify(body.categories || []),
    },
  });

  return json({
    service_id: service.id,
    service_number: service.serviceNumber,
    name: service.name,
    price: service.price,
    message: "Service created successfully",
  }, 201);
});
