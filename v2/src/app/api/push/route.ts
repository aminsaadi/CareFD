import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody, getSearchParams } from "@/lib/api-utils";

// GET /api/push - Get VAPID public key
export const GET = withErrorHandler(async (req: NextRequest) => {
  const sp = getSearchParams(req);
  if (sp.get("action") === "vapid-key") {
    return json({ public_key: process.env.VAPID_PUBLIC_KEY || "" });
  }

  // Get user's push preferences
  const user = await requireAuth(req);
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId: user.id } });
  return json({ subscriptions, is_subscribed: subscriptions.length > 0 });
});

// POST /api/push - Subscribe to push
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const body = await parseBody<{ endpoint: string; auth: string; p256dh: string }>(req);

  if (!body.endpoint || !body.auth || !body.p256dh) return errorResponse("Missing push subscription fields", 400);

  await prisma.pushSubscription.upsert({
    where: { userId_endpoint: { userId: user.id, endpoint: body.endpoint } },
    update: { auth: body.auth, p256dh: body.p256dh },
    create: { userId: user.id, endpoint: body.endpoint, auth: body.auth, p256dh: body.p256dh },
  });

  return json({ message: "Push subscription saved" });
});

// DELETE /api/push - Unsubscribe
export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  await prisma.pushSubscription.deleteMany({ where: { userId: user.id } });
  return json({ message: "Push subscription removed" });
});
