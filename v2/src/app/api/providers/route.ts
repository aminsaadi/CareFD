import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody, getSearchParams } from "@/lib/api-utils";
import { Prisma } from "@/generated/prisma/client";

// GET /api/providers - Search providers with filters
export const GET = withErrorHandler(async (req: NextRequest) => {
  const sp = getSearchParams(req);

  const search = sp.get("search") || undefined;
  const city = sp.get("city") || undefined;
  const category = sp.get("category") || undefined;
  const specialization = sp.get("specialization") || undefined;
  const providerType = sp.get("provider_type") || undefined;
  const serviceType = sp.get("service_type") || undefined;
  const minRating = sp.get("min_rating") ? parseFloat(sp.get("min_rating")!) : undefined;
  const minExperience = sp.get("min_experience") ? parseInt(sp.get("min_experience")!) : undefined;
  const verifiedOnly = sp.get("verified_only") === "true";
  const recommendedOnly = sp.get("recommended_only") === "true";
  const gender = sp.get("gender") || undefined;
  const languages = sp.get("languages")?.split(",").filter(Boolean);
  const healthFunds = sp.get("health_funds")?.split(",").filter(Boolean);
  const latitude = sp.get("latitude") ? parseFloat(sp.get("latitude")!) : undefined;
  const longitude = sp.get("longitude") ? parseFloat(sp.get("longitude")!) : undefined;
  const radiusKm = sp.get("radius_km") ? parseFloat(sp.get("radius_km")!) : undefined;
  const sortBy = sp.get("sort_by") || "rating";
  const skip = Math.max(0, parseInt(sp.get("skip") || "0"));
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") || "20")));

  // Build WHERE clause
  const where: Prisma.ProviderWhereInput = {
    AND: [
      // Must be verified
      {
        OR: [
          { isVerified: true },
          { verificationStatus: "verified" },
        ],
      },
    ],
  };

  const andConditions = where.AND as Prisma.ProviderWhereInput[];

  // Text search
  if (search) {
    andConditions.push({
      OR: [
        { businessName: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { professionName: { contains: search, mode: "insensitive" } },
        { specializationName: { contains: search, mode: "insensitive" } },
        { specializations: { has: search } },
        { expertise: { has: search } },
      ],
    });
  }

  // City filter
  if (city && !(latitude && longitude && radiusKm)) {
    andConditions.push({
      OR: [
        { city: { contains: city, mode: "insensitive" } },
        { serviceAreas: { has: city } },
      ],
    });
  }

  // Category (profession) filter
  if (category) {
    andConditions.push({
      OR: [
        { professionId: category },
        { professionName: { contains: category, mode: "insensitive" } },
        { specializations: { has: category } },
      ],
    });
  }

  // Specialization filter
  if (specialization) {
    andConditions.push({
      OR: [
        { specializationName: specialization },
        { specializationId: specialization },
        { specializations: { has: specialization } },
      ],
    });
  }

  // Provider type
  if (providerType) {
    andConditions.push({ providerType: providerType as Prisma.EnumProviderTypeFilter["equals"] });
  }

  // Service type
  if (serviceType) {
    andConditions.push({ serviceTypes: { has: serviceType } });
  }

  // Rating
  if (minRating) {
    andConditions.push({ rating: { gte: minRating } });
  }

  // Experience
  if (minExperience) {
    andConditions.push({ yearsExperience: { gte: minExperience } });
  }

  // Verified only
  if (verifiedOnly) {
    andConditions.push({ isVerified: true });
  }

  // Recommended only
  if (recommendedOnly) {
    andConditions.push({ isRecommended: true });
  }

  // Gender
  if (gender) {
    andConditions.push({ gender });
  }

  // Languages
  if (languages && languages.length > 0) {
    andConditions.push({ languages: { hasSome: languages } });
  }

  // Health funds
  if (healthFunds && healthFunds.length > 0) {
    andConditions.push({ healthFunds: { hasSome: healthFunds } });
  }

  // Determine sort
  let orderBy: Prisma.ProviderOrderByWithRelationInput = { rating: "desc" };
  if (sortBy === "reviews") orderBy = { totalReviews: "desc" };
  else if (sortBy === "newest") orderBy = { createdAt: "desc" };

  // If geo search, we need to fetch all matching then filter by distance
  const useGeoFilter = latitude !== undefined && longitude !== undefined;

  if (useGeoFilter) {
    // Fetch all matching providers (no pagination yet) for distance calculation
    const allProviders = await prisma.provider.findMany({
      where,
      orderBy,
      take: 500,
      include: {
        profession: { select: { name: true } },
      },
    });

    // Calculate distances in JS (PostGIS raw query alternative below)
    const withDistance = allProviders
      .map((p) => {
        if (p.latitude && p.longitude) {
          const dist = haversineDistance(latitude!, longitude!, p.latitude, p.longitude);
          return { ...p, distance_km: Math.round(dist * 10) / 10 };
        }
        return { ...p, distance_km: null as number | null };
      })
      .filter((p) => {
        if (radiusKm && p.distance_km !== null) return p.distance_km <= radiusKm;
        if (radiusKm && p.distance_km === null) return false;
        return true;
      });

    // Sort by distance if requested
    if (sortBy === "distance") {
      withDistance.sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity));
    }

    const total = withDistance.length;
    const paginated = withDistance.slice(skip, skip + limit);

    return json({
      providers: paginated.map((p) => formatProvider(p, p.distance_km)),
      total,
      skip,
      limit,
      filters_applied: { search, city, category, specialization, provider_type: providerType, service_type: serviceType, min_rating: minRating, radius_km: radiusKm, min_experience: minExperience, verified_only: verifiedOnly, recommended_only: recommendedOnly },
    });
  }

  // Non-geo query with direct pagination
  const [providers, total] = await Promise.all([
    prisma.provider.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        profession: { select: { name: true } },
      },
    }),
    prisma.provider.count({ where }),
  ]);

  return json({
    providers: providers.map((p) => formatProvider(p, null)),
    total,
    skip,
    limit,
    filters_applied: { search, city, category, specialization, provider_type: providerType, service_type: serviceType, min_rating: minRating, radius_km: radiusKm, min_experience: minExperience, verified_only: verifiedOnly, recommended_only: recommendedOnly },
  });
});

// POST /api/providers - Register as provider
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const body = await parseBody<{
    provider_type?: string;
    business_name?: string;
    description?: string;
    specializations?: string[];
    location?: { address?: string; city?: string; latitude?: number; longitude?: number };
  }>(req);

  if (!user.emailVerified) return errorResponse("Email verification required", 403);

  // Check if already a provider
  const existing = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (existing) {
    return errorResponse("כבר קיים פרופיל ספק עבור משתמש זה", 400);
  }

  const providerNumber = `P${Math.floor(1000000 + Math.random() * 9000000)}`;

  const provider = await prisma.provider.create({
    data: {
      providerNumber,
      userId: user.id,
      providerType: (body.provider_type as "individual" | "company" | "clinic") || "individual",
      businessName: body.business_name,
      description: body.description,
      specializations: body.specializations || [],
      address: body.location?.address,
      city: body.location?.city,
      latitude: body.location?.latitude,
      longitude: body.location?.longitude,
    },
  });

  // Update user role
  await prisma.user.update({
    where: { id: user.id },
    data: { role: "provider" },
  });

  return json(formatProvider(provider, null), 201);
});

// ==================== HELPERS ====================

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function formatProvider(p: Record<string, unknown>, distanceKm: number | null) {
  return {
    provider_id: p.id,
    provider_number: p.providerNumber,
    user_id: p.userId,
    provider_type: p.providerType,
    business_name: p.businessName,
    description: p.description,
    about: p.about,
    profile_image: p.profileImage,
    gender: p.gender,
    profession_id: p.professionId,
    profession_name: p.professionName || (p as Record<string, Record<string, unknown>>).profession?.name,
    specialization_id: p.specializationId,
    specialization_name: p.specializationName,
    expertise: p.expertise,
    specializations: p.specializations,
    profession_title: p.professionTitle,
    location: {
      address: p.address,
      city: p.city,
      country: p.country,
      latitude: p.latitude,
      longitude: p.longitude,
    },
    service_areas: p.serviceAreas,
    languages: p.languages,
    target_audience: p.targetAudience,
    rating: p.rating,
    total_reviews: p.totalReviews,
    subscription_tier: p.subscriptionTier,
    is_verified: p.isVerified,
    is_recommended: p.isRecommended,
    verification_status: p.verificationStatus,
    phone: p.phone,
    email: p.email,
    website: p.website,
    whatsapp_number: p.whatsappNumber,
    show_phone: p.showPhone,
    show_email: p.showEmail,
    show_whatsapp: p.showWhatsapp,
    years_experience: p.yearsExperience,
    service_types: p.serviceTypes,
    views_count: p.viewsCount,
    health_funds: p.healthFunds,
    payment_methods: p.paymentMethods,
    profile_color: p.profileColor,
    created_at: p.createdAt,
    distance_km: distanceKm,
  };
}
