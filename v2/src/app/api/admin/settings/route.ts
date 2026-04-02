import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { json, withErrorHandler, parseBody } from "@/lib/api-utils";

// GET /api/admin/settings
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);
  const settings = await prisma.siteSetting.findUnique({ where: { id: "main" } });
  const smtp = await prisma.smtpSetting.findUnique({ where: { id: "smtp_config" } });
  return json({ settings: settings?.data || {}, smtp: smtp || {} });
});

// PUT /api/admin/settings
export const PUT = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);
  const body = await parseBody<any>(req);

  if (body.smtp) {
    await prisma.smtpSetting.upsert({
      where: { id: "smtp_config" },
      update: { emailProvider: body.smtp.email_provider, senderEmail: body.smtp.sender_email, senderName: body.smtp.sender_name, credentials: body.smtp.credentials || {} },
      create: { id: "smtp_config", emailProvider: body.smtp.email_provider || "smtp", senderEmail: body.smtp.sender_email || "", senderName: body.smtp.sender_name || "CareFD", credentials: body.smtp.credentials || {} },
    });
    return json({ message: "SMTP settings updated" });
  }

  await prisma.siteSetting.upsert({
    where: { id: "main" },
    update: { data: body },
    create: { id: "main", data: body },
  });
  return json({ message: "Settings updated" });
});
