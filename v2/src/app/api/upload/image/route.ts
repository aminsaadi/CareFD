import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, errorResponse, withErrorHandler } from "@/lib/api-utils";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return errorResponse("No file provided", 400);

  if (!file.type.startsWith("image/")) return errorResponse("Only images allowed", 400);
  if (file.size > 5 * 1024 * 1024) return errorResponse("Max 5MB", 400);

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const ext = path.extname(file.name) || ".jpg";
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
  const filepath = path.join(uploadDir, filename);
  await writeFile(filepath, buffer);

  const url = `/uploads/${filename}`;

  await prisma.uploadedFile.create({
    data: { filename, fileSize: file.size, mimeType: file.type, url },
  });

  return json({ url });
});
