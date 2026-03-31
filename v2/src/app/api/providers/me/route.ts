import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, errorResponse, withErrorHandler } from "@/lib/api-utils";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const provider = await prisma.provider.findUnique({
    where: { userId: user.id },
    include: {
      services: { where: { isActive: true }, orderBy: { createdAt: "desc" } },
      teamMembers: true,
      availability: true,
      serviceCategories: true,
      clinics: true,
      verificationDocuments: true,
    },
  });
  if (!provider) return errorResponse("Provider profile not found", 404);
  return json(provider);
});
