/**
 * PostGIS-powered search utilities for CareFD v2
 * Uses Prisma.$queryRaw (tagged template) for safe parameterized queries
 */
import prisma from "./db";
import { Prisma } from "@/generated/prisma/client";

interface GeoSearchParams {
  latitude: number;
  longitude: number;
  radiusKm: number;
  city?: string;
  professionId?: string;
  limit?: number;
  offset?: number;
  orderBy?: "distance" | "rating" | "reviews";
}

interface GeoSearchResult {
  id: string;
  distance_km: number;
  [key: string]: unknown;
}

// Whitelist of allowed ORDER BY columns to prevent injection
const ORDER_CLAUSES: Record<string, string> = {
  distance: "distance_km ASC",
  rating: "rating DESC NULLS LAST, distance_km ASC",
  reviews: "total_reviews DESC NULLS LAST, distance_km ASC",
};

/**
 * Search providers within a radius using PostGIS ST_DWithin.
 * All parameters are passed as $1, $2, etc. – no string interpolation.
 */
export async function searchProvidersByLocation({
  latitude,
  longitude,
  radiusKm,
  city,
  professionId,
  limit = 20,
  offset = 0,
  orderBy = "distance",
}: GeoSearchParams): Promise<{ providers: GeoSearchResult[]; total: number }> {
  const radiusMeters = radiusKm * 1000;

  // Count total – fully parameterized
  const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count
    FROM providers
    WHERE location IS NOT NULL
      AND ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
        ${radiusMeters}
      )
      AND (is_verified = true OR verification_status = 'verified')
      AND (${city}::text IS NULL OR city ILIKE '%' || ${city || ""} || '%')
      AND (${professionId}::text IS NULL OR profession_id = ${professionId || ""})
  `;

  const total = Number(countResult[0]?.count ?? 0);

  // Safe ORDER BY using whitelist (never interpolated from user input)
  const safeOrder = ORDER_CLAUSES[orderBy] || ORDER_CLAUSES.distance;

  // Fetch providers – use $queryRawUnsafe ONLY for the ORDER BY clause
  // which is whitelisted above (not user-controlled)
  const providers = await prisma.$queryRawUnsafe<GeoSearchResult[]>(`
    SELECT
      id, provider_number, user_id, provider_type,
      business_name, description, about, profile_image, gender,
      profession_id, profession_name, specialization_id, specialization_name,
      expertise, specializations, profession_title,
      address, city, country, latitude, longitude,
      service_areas, languages, target_audience,
      rating, total_reviews, subscription_tier,
      is_verified, is_recommended, verification_status,
      phone, email, website, whatsapp_number,
      show_phone, show_email, show_whatsapp,
      years_experience, service_types, views_count,
      health_funds, payment_methods, profile_color,
      created_at,
      ROUND(
        ST_Distance(
          location,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) / 1000.0,
        1
      ) as distance_km
    FROM providers
    WHERE location IS NOT NULL
      AND ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
      AND (is_verified = true OR verification_status = 'verified')
      AND ($6::text IS NULL OR city ILIKE '%' || $6 || '%')
      AND ($7::text IS NULL OR profession_id = $7)
    ORDER BY ${safeOrder}
    LIMIT $4 OFFSET $5
  `, longitude, latitude, radiusMeters, limit, offset,
     city || null, professionId || null);

  return { providers, total };
}

/**
 * Full-text fuzzy search using pg_trgm similarity.
 * Fully parameterized – no SQL injection risk.
 */
export async function fuzzySearchProviders(
  query: string,
  limit = 20,
  offset = 0
): Promise<{ providers: GeoSearchResult[]; total: number }> {
  const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count
    FROM providers
    WHERE (is_verified = true OR verification_status = 'verified')
      AND (
        similarity(COALESCE(business_name, ''), ${query}) > 0.2
        OR similarity(COALESCE(description, ''), ${query}) > 0.1
        OR similarity(COALESCE(profession_name, ''), ${query}) > 0.3
        OR business_name ILIKE '%' || ${query} || '%'
        OR description ILIKE '%' || ${query} || '%'
        OR profession_name ILIKE '%' || ${query} || '%'
        OR specialization_name ILIKE '%' || ${query} || '%'
      )
  `;

  const total = Number(countResult[0]?.count ?? 0);

  const providers = await prisma.$queryRaw<GeoSearchResult[]>`
    SELECT *,
      GREATEST(
        similarity(COALESCE(business_name, ''), ${query}),
        similarity(COALESCE(profession_name, ''), ${query}) * 1.5,
        similarity(COALESCE(description, ''), ${query}) * 0.5
      ) as relevance_score
    FROM providers
    WHERE (is_verified = true OR verification_status = 'verified')
      AND (
        similarity(COALESCE(business_name, ''), ${query}) > 0.2
        OR similarity(COALESCE(description, ''), ${query}) > 0.1
        OR similarity(COALESCE(profession_name, ''), ${query}) > 0.3
        OR business_name ILIKE '%' || ${query} || '%'
        OR description ILIKE '%' || ${query} || '%'
        OR profession_name ILIKE '%' || ${query} || '%'
        OR specialization_name ILIKE '%' || ${query} || '%'
      )
    ORDER BY relevance_score DESC, rating DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return { providers, total };
}
