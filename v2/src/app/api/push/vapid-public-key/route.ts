import { json, withErrorHandler } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async () => {
  return json({ public_key: process.env.VAPID_PUBLIC_KEY || "" });
});
