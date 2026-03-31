import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { hashPassword, createToken } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody } from "@/lib/api-utils";
import { registerSchema } from "@/lib/validations/auth";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limiter";
import { v4 as uuid } from "uuid";

export const POST = withErrorHandler(async (req: NextRequest) => {
  rateLimit(req, "register", 10, 900); // 10 per 15 min per IP
  const body = await parseBody<unknown>(req);
  const data = registerSchema.parse(body);

  // Check if email already exists
  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
    select: { id: true },
  });
  if (existing) {
    return errorResponse("כתובת האימייל כבר רשומה במערכת", 409);
  }

  const passwordHash = await hashPassword(data.password);
  const userNumber = `U${Math.floor(1000000 + Math.random() * 9000000)}`;

  const user = await prisma.user.create({
    data: {
      userNumber,
      email: data.email.toLowerCase(),
      name: data.name,
      passwordHash,
      role: data.role,
      languagePreference: data.languagePreference,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      userNumber: true,
    },
  });

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

  // Create email verification token
  const verificationToken = uuid();
  await prisma.emailVerification.create({
    data: {
      userId: user.id,
      email: user.email,
      token: verificationToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    },
  });

  // Send verification email (non-blocking)
  sendVerificationEmail(user.email, data.name, verificationToken).catch(() => {});

  return json({
    user: {
      user_id: user.id,
      user_number: user.userNumber,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    token,
    message: "הרשמה בוצעה בהצלחה",
  }, 201);
});
