import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody } from "@/lib/api-utils";
import { sendContactEmail } from "@/lib/email";

// POST /api/contact
export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await parseBody<{ name: string; email: string; phone?: string; subject?: string; message: string }>(req);
  if (!body.name || !body.email || !body.message) return errorResponse("Name, email and message required", 400);

  // Validate name length
  if (body.name.length > 100) return errorResponse("Name too long (max 100 characters)", 400);

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) return errorResponse("Invalid email format", 400);

  // Validate message length
  if (body.message.length > 5000) return errorResponse("Message too long (max 5000 characters)", 400);

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

  // Send email notification to admin
  sendContactEmail(body.name, body.email, body.subject || "", body.message).catch(() => {});

  return json({ message: "ההודעה נשלחה בהצלחה" }, 201);
});
