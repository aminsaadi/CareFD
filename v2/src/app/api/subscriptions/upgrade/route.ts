import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody } from "@/lib/api-utils";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const body = await parseBody<{ plan_id: string; billing_cycle?: string }>(req);

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: body.plan_id } });
  if (!plan) return errorResponse("Plan not found", 404);

  // Cancel existing
  await prisma.subscription.updateMany({
    where: { userId: user.id, status: "active" },
    data: { status: "cancelled", cancelledAt: new Date() },
  });

  const cycle = body.billing_cycle === "yearly" ? "yearly" : "monthly";
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + (cycle === "yearly" ? 12 : 1));

  const sub = await prisma.subscription.create({
    data: {
      userId: user.id,
      planId: plan.id,
      tier: plan.tier,
      status: "active",
      billingCycle: cycle,
      startDate: new Date(),
      endDate,
      nextBillingDate: endDate,
    },
  });

  return json({ subscription: sub });
});
