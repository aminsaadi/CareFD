import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody } from "@/lib/api-utils";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const body = await parseBody<{ endpoint: string; auth: string; p256dh: string }>(req);

  if (!body.endpoint || !body.auth || !body.p256dh) return errorResponse("Missing push subscription fields", 400);

  await prisma.pushSubscription.upsert({
    where: { userId_endpoint: { userId: user.id, endpoint: body.endpoint } },
    update: { auth: body.auth, p256dh: body.p256dh },
    create: { userId: user.id, endpoint: body.endpoint, auth: body.auth, p256dh: body.p256dh },
  });

  return json({ message: "Subscribed" });
});
