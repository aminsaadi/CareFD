import { NextRequest } from "next/server";
import { json, withErrorHandler, getSearchParams } from "@/lib/api-utils";
import { israeliLocalities } from "@/lib/data/localities";

// GET /api/localities - Get Israeli localities with coordinates
export const GET = withErrorHandler(async (req: NextRequest) => {
  const sp = getSearchParams(req);
  const query = sp.get("q") || undefined;
  const limit = Math.min(500, Math.max(1, parseInt(sp.get("limit") || "500")));

  let results = israeliLocalities;

  if (query) {
    results = israeliLocalities.filter((loc) => loc.name.includes(query));
  }

  return json({
    localities: results.slice(0, limit),
    total: israeliLocalities.length,
  });
});
