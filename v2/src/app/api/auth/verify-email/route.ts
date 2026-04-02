import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { json, errorResponse, withErrorHandler, getSearchParams } from "@/lib/api-utils";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const token = getSearchParams(req).get("token");
  if (!token) {
    return errorResponse("Token is required", 400);
  }

  const verification = await prisma.emailVerification.findUnique({
    where: { token },
    include: { user: { select: { id: true, email: true } } },
  });

  if (!verification) {
    return errorResponse("טוקן לא תקין", 400);
  }

  if (verification.expiresAt < new Date()) {
    await prisma.emailVerification.delete({ where: { id: verification.id } });
    return errorResponse("הטוקן פג תוקף", 400);
  }

  // Mark email as verified
  await prisma.$transaction([
    prisma.user.update({
      where: { id: verification.userId },
      data: { emailVerified: true },
    }),
    prisma.emailVerification.deleteMany({
      where: { userId: verification.userId },
    }),
  ]);

  return json({ message: "האימייל אומת בהצלחה" });
});
