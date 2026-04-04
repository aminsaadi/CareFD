import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody } from "@/lib/api-utils";

export const PUT = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const body = await parseBody<{
    first_name?: string; last_name?: string; phone?: string;
    address?: string; city?: string; profile_image?: string; profile_color?: string;
  }>(req);

  const name = [body.first_name, body.last_name].filter(Boolean).join(" ") || undefined;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: name,
      phone: body.phone,
      picture: body.profile_image,
    },
  });

  return json({ user: updated });
});
