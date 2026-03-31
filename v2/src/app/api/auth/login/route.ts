import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { verifyPassword, createToken } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody } from "@/lib/api-utils";
import { loginSchema } from "@/lib/validations/auth";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await parseBody<unknown>(req);
  const data = loginSchema.parse(body);

  const user = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      userNumber: true,
      passwordHash: true,
      isVerified: true,
      isSuspended: true,
      suspensionReason: true,
      picture: true,
      phone: true,
      languagePreference: true,
      emailVerified: true,
    },
  });

  if (!user || !user.passwordHash) {
    return errorResponse("אימייל או סיסמה שגויים", 401);
  }

  if (user.isSuspended) {
    return errorResponse(
      `החשבון שלך הושעה${user.suspensionReason ? `: ${user.suspensionReason}` : ""}`,
      403
    );
  }

  const valid = await verifyPassword(data.password, user.passwordHash);
  if (!valid) {
    return errorResponse("אימייל או סיסמה שגויים", 401);
  }

  const token = createToken({ userId: user.id, email: user.email, role: user.role });

  // Create session
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.userSession.create({
    data: {
      userId: user.id,
      sessionToken: token,
      expiresAt,
    },
  });

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
      },
    });
  }

  return json({
    user: {
      user_id: user.id,
      user_number: user.userNumber,
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
        }
      : null,
    token,
  });
});
