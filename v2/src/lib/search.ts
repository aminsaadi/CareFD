/**
 * Search utilities for CareFD v2
 * Uses Haversine formula (pure SQL) for geo search - no PostGIS needed
 * Uses ILIKE for Hebrew text search (pg_trgm optional)
 */
import prisma from "./db";

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

// Haversine distance formula in SQL (returns km)
const HAVERSINE_SQL = `
  6371 * acos(
    LEAST(1.0, GREATEST(-1.0,
      cos(radians($1)) * cos(radians(latitude))
      * cos(radians(longitude) - radians($2))
      + sin(radians($1)) * sin(radians(latitude))
    ))
  )
`;

/**
 * Search providers within a radius using Haversine formula.
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

  // Count total
  const countResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(`
    SELECT COUNT(*) as count
    FROM providers
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      AND ${HAVERSINE_SQL} <= $3
      AND (is_verified = true OR verification_status = 'verified')
      AND ($6::text IS NULL OR city ILIKE '%' || $6 || '%')
      AND ($7::text IS NULL OR profession_id = $7)
  `, latitude, longitude, radiusKm, limit, offset,
     city || null, professionId || null);

  const total = Number(countResult[0]?.count ?? 0);

  // Safe ORDER BY using whitelist
  const safeOrder = ORDER_CLAUSES[orderBy] || ORDER_CLAUSES.distance;

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
      ROUND((${HAVERSINE_SQL})::numeric, 1) as distance_km
    FROM providers
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      AND ${HAVERSINE_SQL} <= $3
      AND (is_verified = true OR verification_status = 'verified')
      AND ($6::text IS NULL OR city ILIKE '%' || $6 || '%')
      AND ($7::text IS NULL OR profession_id = $7)
    ORDER BY ${safeOrder}
    LIMIT $4 OFFSET $5
  `, latitude, longitude, radiusKm, limit, offset,
     city || null, professionId || null);

  return { providers, total };
}

/**
 * Full-text search using ILIKE (works without pg_trgm extension).
 * Fully parameterized – no SQL injection risk.
 */
export async function fuzzySearchProviders(
  query: string,
  limit = 20,
  offset = 0
): Promise<{ providers: GeoSearchResult[]; total: number }> {
  const pattern = `%${query}%`;

  const countResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(`
    SELECT COUNT(*) as count
    FROM providers
    WHERE (is_verified = true OR verification_status = 'verified')
      AND (
        business_name ILIKE $1
        OR description ILIKE $1
        OR profession_name ILIKE $1
        OR specialization_name ILIKE $1
      )
  `, pattern);

  const total = Number(countResult[0]?.count ?? 0);

  const providers = await prisma.$queryRawUnsafe<GeoSearchResult[]>(`
    SELECT *,
      CASE
        WHEN business_name ILIKE $1 THEN 3
        WHEN profession_name ILIKE $1 THEN 2
        ELSE 1
      END as relevance_score
    FROM providers
    WHERE (is_verified = true OR verification_status = 'verified')
      AND (
        business_name ILIKE $1
        OR description ILIKE $1
        OR profession_name ILIKE $1
        OR specialization_name ILIKE $1
      )
    ORDER BY relevance_score DESC, rating DESC
    LIMIT $2 OFFSET $3
  `, pattern, limit, offset);

  return { providers, total };
}
