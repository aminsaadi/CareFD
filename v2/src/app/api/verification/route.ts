import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody } from "@/lib/api-utils";

// GET /api/verification - Get verification status
export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { verificationStatus: true, verificationNotes: true },
  });
  const docs = await prisma.verificationDocument.findMany({
    where: { userId: user.id },
    orderBy: { uploadedAt: "desc" },
  });

  return json({
    verification_status: fullUser?.verificationStatus || "none",
    verification_notes: fullUser?.verificationNotes,
    documents: docs,
  });
});

// POST /api/verification - Submit verification request
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const body = await parseBody<{ document_type: string; file_url: string; file_name?: string }>(req);

  if (!body.document_type || !body.file_url) return errorResponse("Document type and file URL required", 400);

  const doc = await prisma.verificationDocument.create({
    data: {
      userId: user.id,
      documentType: body.document_type as any,
      fileUrl: body.file_url,
      fileName: body.file_name || `${body.document_type}.pdf`,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { verificationStatus: "documents_submitted", verificationSubmittedAt: new Date() },
  });

  return json({ document_id: doc.id, message: "המסמך הועלה בהצלחה" }, 201);
});
