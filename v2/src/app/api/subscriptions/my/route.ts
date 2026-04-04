import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, withErrorHandler } from "@/lib/api-utils";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const sub = await prisma.subscription.findFirst({
    where: { userId: user.id, status: "active" },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
  return json({
    subscription: sub ? {
      subscription_id: sub.id,
      plan_id: sub.planId,
      plan_name: sub.plan.nameHe || sub.plan.name,
      tier: sub.tier,
      status: sub.status,
      billing_cycle: sub.billingCycle,
      current_period_end: sub.endDate,
      trial_end: null,
    } : null,
  });
});
