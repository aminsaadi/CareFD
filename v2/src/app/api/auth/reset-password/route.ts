import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody } from "@/lib/api-utils";
import { resetPasswordRequestSchema, resetPasswordSchema } from "@/lib/validations/auth";
import { v4 as uuid } from "uuid";

// POST /api/auth/reset-password - Request password reset
export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await parseBody<unknown>(req);
  const data = resetPasswordRequestSchema.parse(body);

  const user = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
    select: { id: true, email: true },
  });

  // Always return success to prevent email enumeration
  if (!user) {
    return json({ message: "אם הכתובת רשומה, נשלח אליה קישור לאיפוס סיסמה" });
  }

  // Delete old reset tokens
  await prisma.passwordReset.deleteMany({ where: { userId: user.id } });

  // Create new reset token
  const token = uuid();
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  // TODO: Send reset email via Resend/SMTP

  return json({ message: "אם הכתובת רשומה, נשלח אליה קישור לאיפוס סיסמה" });
});

// PUT /api/auth/reset-password - Execute password reset
export const PUT = withErrorHandler(async (req: NextRequest) => {
  const body = await parseBody<unknown>(req);
  const data = resetPasswordSchema.parse(body);

  const reset = await prisma.passwordReset.findUnique({
    where: { token: data.token },
  });

  if (!reset) {
    return errorResponse("טוקן לא תקין", 400);
  }

  if (reset.expiresAt < new Date()) {
    await prisma.passwordReset.delete({ where: { id: reset.id } });
    return errorResponse("הטוקן פג תוקף", 400);
  }

  const passwordHash = await hashPassword(data.password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: reset.userId },
      data: { passwordHash },
    }),
    prisma.passwordReset.deleteMany({ where: { userId: reset.userId } }),
    // Invalidate all sessions
    prisma.userSession.deleteMany({ where: { userId: reset.userId } }),
  ]);

  return json({ message: "הסיסמה שונתה בהצלחה" });
});
