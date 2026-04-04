import prisma from "@/lib/db";
import { json, withErrorHandler } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

// GET /api/subscription-plans - Public endpoint
export const GET = withErrorHandler(async () => {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return json({ plans });
});
