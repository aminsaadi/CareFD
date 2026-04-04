import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, errorResponse, withErrorHandler } from "@/lib/api-utils";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const formData = await req.formData();
  const notes = formData.get("notes") as string || "";
  const docFields = ["id_card", "id_card_back", "professional_license", "additional_doc"];

  const docs: { documentType: string; fileUrl: string; fileName: string }[] = [];

  for (const field of docFields) {
    const file = formData.get(field) as File | null;
    if (!file) continue;
    // In production, upload to cloud storage. For now, store reference.
    docs.push({ documentType: field, fileUrl: `/uploads/${file.name}`, fileName: file.name });
  }

  if (docs.length === 0) return errorResponse("At least one document is required", 400);

  // Create verification documents
  for (const doc of docs) {
    await prisma.verificationDocument.create({
      data: { userId: user.id, documentType: "other", fileUrl: doc.fileUrl, fileName: doc.fileName, status: "pending" },
    });
  }

  // Update user verification status
  await prisma.user.update({
    where: { id: user.id },
    data: { verificationStatus: "pending", verificationNotes: notes || null, verificationSubmittedAt: new Date() },
  });

  return json({ message: "בקשת האימות נשלחה בהצלחה" });
});
