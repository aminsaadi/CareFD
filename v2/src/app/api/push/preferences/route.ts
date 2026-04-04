import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { json, withErrorHandler, parseBody } from "@/lib/api-utils";

// Push preferences stored in memory/cache for now
// In production, use a database table
const prefsStore = new Map<string, Record<string, boolean>>();

const defaultPrefs = {
  new_booking: true, booking_confirmation: true, new_message: true,
  verification_update: true, system_updates: true, marketing: false,
};

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  return json({ preferences: prefsStore.get(user.id) || defaultPrefs });
});

export const PUT = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const body = await parseBody<Record<string, boolean>>(req);
  prefsStore.set(user.id, { ...defaultPrefs, ...body });
  return json({ preferences: prefsStore.get(user.id) });
});
