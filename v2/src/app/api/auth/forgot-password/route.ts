import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { json, errorResponse, withErrorHandler, parseBody } from "@/lib/api-utils";
import { hashPassword } from "@/lib/auth";
import crypto from "crypto";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await parseBody<{ email: string }>(req);
  if (!body.email) return errorResponse("Email is required", 400);

  const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
  // Always return success to avoid email enumeration
  if (!user) return json({ message: "אם האימייל קיים במערכת, נשלח קישור לאיפוס סיסמה" });

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.passwordReset.create({
    data: { userId: user.id, token, expiresAt: new Date(Date.now() + 3600000) },
  });

  // TODO: Send email with reset link
  return json({ message: "אם האימייל קיים במערכת, נשלח קישור לאיפוס סיסמה" });
});
