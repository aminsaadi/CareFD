import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody } from "@/lib/api-utils";

// POST /api/contact
export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await parseBody<{ name: string; email: string; phone?: string; subject?: string; message: string }>(req);
  if (!body.name || !body.email || !body.message) return errorResponse("Name, email and message required", 400);

  const user = await getCurrentUser(req as any);

  await prisma.contactMessage.create({
    data: {
      userId: user?.id,
      name: body.name,
      email: body.email,
      phone: body.phone,
      subject: body.subject,
      message: body.message,
    },
  });

  return json({ message: "ההודעה נשלחה בהצלחה" }, 201);
});
