import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, errorResponse, withErrorHandler } from "@/lib/api-utils";
import { sendVerificationEmail } from "@/lib/email";
import { v4 as uuid } from "uuid";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);

  const fullUser = await prisma.user.findUnique({ where: { id: user.id }, select: { emailVerified: true, email: true } });
  if (fullUser?.emailVerified) return errorResponse("האימייל כבר מאומת", 400);

  await prisma.emailVerification.deleteMany({ where: { userId: user.id } });
  const token = uuid();
  await prisma.emailVerification.create({
    data: { userId: user.id, email: fullUser!.email, token, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });

  await sendVerificationEmail(fullUser!.email, user.name, token);
  return json({ message: "נשלח מייל אימות חדש" });
});
