import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, withErrorHandler, getSearchParams } from "@/lib/api-utils";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const sp = getSearchParams(req);
  const status = sp.get("status");

  const where: any = { userId: user.id };
  if (status) where.status = status;

  const requests = await prisma.serviceRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { offers: { select: { id: true } } },
  });

  return json({
    requests: requests.map((r) => ({ ...r, offer_count: r.offers.length })),
  });
});
