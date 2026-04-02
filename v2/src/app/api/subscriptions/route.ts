import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody, getSearchParams } from "@/lib/api-utils";

// GET /api/subscriptions?action=my
export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const sub = await prisma.subscription.findFirst({
    where: { userId: user.id, status: "active" },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
  return json({ subscription: sub });
});

// POST /api/subscriptions - Create/upgrade
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const body = await parseBody<{ plan_id: string; billing_cycle?: string; paypal_subscription_id?: string }>(req);

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: body.plan_id } });
  if (!plan) return errorResponse("Plan not found", 404);

  // Cancel existing active subscription
  await prisma.subscription.updateMany({
    where: { userId: user.id, status: "active" },
    data: { status: "cancelled", cancelledAt: new Date() },
  });

  const provider = await prisma.provider.findUnique({ where: { userId: user.id }, select: { id: true } });

  const sub = await prisma.subscription.create({
    data: {
      userId: user.id,
      providerId: provider?.id,
      planId: plan.id,
      tier: plan.tier,
      billingCycle: (body.billing_cycle as "monthly" | "yearly") || "monthly",
      paypalSubscriptionId: body.paypal_subscription_id,
    },
  });

  // Update provider subscription tier
  if (provider) {
    await prisma.provider.update({ where: { id: provider.id }, data: { subscriptionTier: plan.tier } });
  }

  return json({ subscription_id: sub.id, tier: sub.tier, message: "המנוי הופעל" }, 201);
});

// PUT /api/subscriptions - Cancel
export const PUT = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const body = await parseBody<{ action: string }>(req);

  if (body.action === "cancel") {
    await prisma.subscription.updateMany({
      where: { userId: user.id, status: "active" },
      data: { status: "cancelled", cancelledAt: new Date() },
    });
    const provider = await prisma.provider.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (provider) {
      await prisma.provider.update({ where: { id: provider.id }, data: { subscriptionTier: "free" } });
    }
    return json({ message: "המנוי בוטל" });
  }

  return errorResponse("Invalid action", 400);
});
