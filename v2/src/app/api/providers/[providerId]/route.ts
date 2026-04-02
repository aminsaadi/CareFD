import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody } from "@/lib/api-utils";

// GET /api/providers/:providerId
export const GET = withErrorHandler(async (_req: NextRequest, ctx) => {
  const { providerId } = await ctx.params;

  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    include: {
      profession: { select: { id: true, name: true, nameEn: true } },
      specialization: { select: { id: true, name: true, nameEn: true } },
      availability: true,
      teamMembers: true,
      serviceCategories: true,
      services: { where: { isActive: true } },
    },
  });

  if (!provider) {
    return errorResponse("Provider not found", 404);
  }

  // Increment view count
  await prisma.provider.update({
    where: { id: providerId },
    data: { viewsCount: { increment: 1 } },
  });

  return json({
    provider_id: provider.id,
    provider_number: provider.providerNumber,
    user_id: provider.userId,
    provider_type: provider.providerType,
    business_name: provider.businessName,
    description: provider.description,
    about: provider.about,
    profile_image: provider.profileImage,
    gender: provider.gender,
    profession_id: provider.professionId,
    profession_name: provider.profession?.name || provider.professionName,
    specialization_id: provider.specializationId,
    specialization_name: provider.specialization?.name || provider.specializationName,
    expertise: provider.expertise,
    specializations: provider.specializations,
    location: {
      address: provider.address,
      city: provider.city,
      country: provider.country,
      latitude: provider.latitude,
      longitude: provider.longitude,
    },
    service_areas: provider.serviceAreas,
    availability: provider.availability.map((a) => ({
      day: a.day,
      shift: a.shift,
      start_time: a.startTime,
      end_time: a.endTime,
      is_available: a.isAvailable,
    })),
    team_members: provider.teamMembers.map((t) => ({
      member_id: t.id,
      name: t.name,
      role: t.role,
      specializations: t.specializations,
      picture: t.picture,
    })),
    service_categories: provider.serviceCategories.map((sc) => ({
      category_id: sc.categoryId,
      name: sc.name,
      profession_id: sc.professionId,
    })),
    services_list: provider.services.map((s) => ({
      service_id: s.id,
      name: s.name,
      description: s.description,
      price: s.price,
      pricing_type: s.pricingType,
      service_category: s.serviceCategory,
      delivery_types: s.deliveryTypes,
      is_active: s.isActive,
    })),
    languages: provider.languages,
    target_audience: provider.targetAudience,
    rating: provider.rating,
    total_reviews: provider.totalReviews,
    subscription_tier: provider.subscriptionTier,
    is_verified: provider.isVerified,
    is_recommended: provider.isRecommended,
    verification_status: provider.verificationStatus,
    phone: provider.phone,
    email: provider.email,
    website: provider.website,
    whatsapp_number: provider.whatsappNumber,
    show_phone: provider.showPhone,
    show_email: provider.showEmail,
    show_whatsapp: provider.showWhatsapp,
    years_experience: provider.yearsExperience,
    health_funds: provider.healthFunds,
    payment_methods: provider.paymentMethods,
    education: provider.education,
    certifications: provider.certifications,
    profile_color: provider.profileColor,
    views_count: provider.viewsCount + 1,
    created_at: provider.createdAt,
  });
});

// PUT /api/providers/:providerId
export const PUT = withErrorHandler(async (req: NextRequest, ctx) => {
  const { providerId } = await ctx.params;
  const user = await getCurrentUser(req);
  if (!user) return errorResponse("Unauthorized", 401);

  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: { userId: true },
  });
  if (!provider) return errorResponse("Provider not found", 404);
  if (provider.userId !== user.id && user.role !== "admin") {
    return errorResponse("Not authorized", 403);
  }

  const updates = await parseBody<Record<string, unknown>>(req);

  // Whitelist allowed fields
  const ALLOWED: Record<string, string> = {
    business_name: "businessName",
    description: "description",
    about: "about",
    profile_image: "profileImage",
    gender: "gender",
    provider_type: "providerType",
    profession_id: "professionId",
    profession_name: "professionName",
    specialization_id: "specializationId",
    specialization_name: "specializationName",
    specializations: "specializations",
    expertise: "expertise",
    profession_title: "professionTitle",
    phone: "phone",
    email: "email",
    website: "website",
    whatsapp_number: "whatsappNumber",
    show_phone: "showPhone",
    show_email: "showEmail",
    show_whatsapp: "showWhatsapp",
    service_areas: "serviceAreas",
    service_types: "serviceTypes",
    languages: "languages",
    target_audience: "targetAudience",
    years_experience: "yearsExperience",
    health_funds: "healthFunds",
    payment_methods: "paymentMethods",
    cancellation_policy: "cancellationPolicy",
    cancellation_notice_hours: "cancellationNoticeH",
    education: "education",
    certifications: "certifications",
    profile_color: "profileColor",
  };

  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (ALLOWED[key]) {
      data[ALLOWED[key]] = value;
    }
  }

  // Handle nested location
  if (updates.location && typeof updates.location === "object") {
    const loc = updates.location as Record<string, unknown>;
    if (loc.address !== undefined) data.address = loc.address;
    if (loc.city !== undefined) data.city = loc.city;
    if (loc.latitude !== undefined) data.latitude = loc.latitude;
    if (loc.longitude !== undefined) data.longitude = loc.longitude;
  }

  await prisma.provider.update({
    where: { id: providerId },
    data,
  });

  return json({ message: "Provider updated successfully" });
});
