import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, withErrorHandler } from "@/lib/api-utils";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);

  // Get provider info if exists
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let provider: any = null;
  if (user.role === "provider") {
    provider = await prisma.provider.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        providerNumber: true,
        businessName: true,
        isVerified: true,
        verificationStatus: true,
        subscriptionTier: true,
        profileImage: true,
      },
    });
  }

  return json({
    user: {
      user_id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      picture: user.picture,
      phone: user.phone,
      language_preference: user.languagePreference,
      is_verified: user.isVerified,
      email_verified: user.emailVerified,
    },
    provider: provider
      ? {
          provider_id: provider.id,
          provider_number: provider.providerNumber,
          business_name: provider.businessName,
          is_verified: provider.isVerified,
          verification_status: provider.verificationStatus,
          subscription_tier: provider.subscriptionTier,
          profile_image: provider.profileImage,
        }
      : null,
  });
});
