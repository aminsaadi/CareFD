import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, withErrorHandler } from "@/lib/api-utils";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { verificationStatus: true, verificationNotes: true, verificationSubmittedAt: true },
  });
  const docs = await prisma.verificationDocument.findMany({
    where: { userId: user.id },
    orderBy: { uploadedAt: "desc" },
  });

  return json({
    status: fullUser?.verificationStatus || "none",
    rejection_reason: fullUser?.verificationNotes,
    submitted_at: fullUser?.verificationSubmittedAt,
    documents: docs.map((d) => ({ name: d.fileName, type: d.documentType, status: d.status })),
  });
});
