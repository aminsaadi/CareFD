/**
 * PostGIS-powered search utilities for CareFD v2
 * Uses raw SQL for spatial queries that Prisma ORM can't express
 */
import prisma from "./db";

interface GeoSearchParams {
  latitude: number;
  longitude: number;
  radiusKm: number;
  where?: string; // Additional WHERE clause
  limit?: number;
  offset?: number;
  orderBy?: "distance" | "rating" | "reviews";
}

interface GeoSearchResult {
  id: string;
  distance_km: number;
  [key: string]: unknown;
}

/**
 * Search providers within a radius using PostGIS ST_DWithin
 * This is MUCH faster than fetching all providers and filtering in JS
 */
export async function searchProvidersByLocation({
  latitude,
  longitude,
  radiusKm,
  where = "",
  limit = 20,
  offset = 0,
  orderBy = "distance",
}: GeoSearchParams): Promise<{ providers: GeoSearchResult[]; total: number }> {
  const radiusMeters = radiusKm * 1000;

  // Count total
  const countResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(`
    SELECT COUNT(*) as count
    FROM providers
    WHERE location IS NOT NULL
      AND ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
      AND (is_verified = true OR verification_status = 'verified')
      ${where}
  `, longitude, latitude, radiusMeters);

  const total = Number(countResult[0]?.count ?? 0);

  // Build ORDER BY
  let orderClause = "distance_km ASC";
  if (orderBy === "rating") orderClause = "rating DESC NULLS LAST, distance_km ASC";
  if (orderBy === "reviews") orderClause = "total_reviews DESC NULLS LAST, distance_km ASC";

  // Fetch with distance
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
      ${where}
    ORDER BY ${orderClause}
    LIMIT $4 OFFSET $5
  `, longitude, latitude, radiusMeters, limit, offset);

  return { providers, total };
}

/**
 * Full-text fuzzy search using pg_trgm similarity
 * Supports Hebrew text with trigram matching
 */
export async function fuzzySearchProviders(
  query: string,
  limit = 20,
  offset = 0
): Promise<{ providers: GeoSearchResult[]; total: number }> {
  const countResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(`
    SELECT COUNT(*) as count
    FROM providers
    WHERE (is_verified = true OR verification_status = 'verified')
      AND (
        similarity(COALESCE(business_name, ''), $1) > 0.2
        OR similarity(COALESCE(description, ''), $1) > 0.1
        OR similarity(COALESCE(profession_name, ''), $1) > 0.3
        OR business_name ILIKE '%' || $1 || '%'
        OR description ILIKE '%' || $1 || '%'
        OR profession_name ILIKE '%' || $1 || '%'
        OR specialization_name ILIKE '%' || $1 || '%'
      )
  `, query);

  const total = Number(countResult[0]?.count ?? 0);

  const providers = await prisma.$queryRawUnsafe<GeoSearchResult[]>(`
    SELECT *,
      GREATEST(
        similarity(COALESCE(business_name, ''), $1),
        similarity(COALESCE(profession_name, ''), $1) * 1.5,
        similarity(COALESCE(description, ''), $1) * 0.5
      ) as relevance_score
    FROM providers
    WHERE (is_verified = true OR verification_status = 'verified')
      AND (
        similarity(COALESCE(business_name, ''), $1) > 0.2
        OR similarity(COALESCE(description, ''), $1) > 0.1
        OR similarity(COALESCE(profession_name, ''), $1) > 0.3
        OR business_name ILIKE '%' || $1 || '%'
        OR description ILIKE '%' || $1 || '%'
        OR profession_name ILIKE '%' || $1 || '%'
        OR specialization_name ILIKE '%' || $1 || '%'
      )
    ORDER BY relevance_score DESC, rating DESC
    LIMIT $2 OFFSET $3
  `, query, limit, offset);

  return { providers, total };
}
