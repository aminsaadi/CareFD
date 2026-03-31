import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, withErrorHandler } from "@/lib/api-utils";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.slice(7);
  if (token) {
    await prisma.userSession.deleteMany({ where: { sessionToken: token } });
  }
  return json({ message: "התנתקת בהצלחה" });
});
