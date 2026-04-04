import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, withErrorHandler, parseBody } from "@/lib/api-utils";

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  await prisma.pushSubscription.deleteMany({ where: { userId: user.id } });
  return json({ message: "Unsubscribed" });
});
