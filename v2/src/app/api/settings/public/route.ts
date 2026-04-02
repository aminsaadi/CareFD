import prisma from "@/lib/db";
import { json, withErrorHandler } from "@/lib/api-utils";

export const GET = withErrorHandler(async () => {
  const settings = await prisma.siteSetting.findUnique({ where: { id: "main" } });
  return json(settings?.data || {});
});
