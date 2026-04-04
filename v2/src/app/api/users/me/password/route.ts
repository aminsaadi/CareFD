import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, verifyPassword, hashPassword } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody } from "@/lib/api-utils";

export const PUT = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const body = await parseBody<{ current_password: string; new_password: string }>(req);

  if (!body.current_password || !body.new_password) return errorResponse("Missing fields", 400);
  if (body.new_password.length < 6) return errorResponse("Password must be at least 6 characters", 400);

  const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!fullUser?.passwordHash) return errorResponse("Password not set", 400);

  const valid = await verifyPassword(body.current_password, fullUser.passwordHash);
  if (!valid) return errorResponse("סיסמה נוכחית שגויה", 400);

  const hashed = await hashPassword(body.new_password);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hashed } });

  return json({ message: "הסיסמה שונתה בהצלחה" });
});
