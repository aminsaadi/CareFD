import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, errorResponse, withErrorHandler } from "@/lib/api-utils";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);

  const sub = await prisma.subscription.findFirst({
    where: { userId: user.id, status: "active" },
  });
  if (!sub) return errorResponse("No active subscription", 404);

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: "cancelled", cancelledAt: new Date() },
  });

  return json({ message: "המנוי בוטל בהצלחה" });
});
