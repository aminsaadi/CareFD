-- Search indexes for CareFD v2
-- No PostGIS required - uses Haversine formula for geo queries

-- Index on lat/lng for geo search
CREATE INDEX IF NOT EXISTS idx_providers_lat_lng
  ON providers (latitude, longitude) WHERE latitude IS NOT NULL;

-- Text search indexes (ILIKE-friendly)
CREATE INDEX IF NOT EXISTS idx_providers_business_name_lower
  ON providers (lower(business_name));

CREATE INDEX IF NOT EXISTS idx_providers_city_lower
  ON providers (lower(city));

-- Composite indexes for common search patterns
CREATE INDEX IF NOT EXISTS idx_providers_verified_rating
  ON providers (is_verified, rating DESC);

CREATE INDEX IF NOT EXISTS idx_providers_city_verified
  ON providers (city, is_verified);

-- Bookings date index for calendar queries
CREATE INDEX IF NOT EXISTS idx_bookings_provider_date
  ON bookings (provider_id, booking_date);

-- Notifications unread index
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, is_read, created_at DESC);

-- Chat messages room + date index
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_date
  ON chat_messages (room_id, created_at DESC);

-- Optional: pg_trgm for fuzzy Hebrew search (skip if not available)
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE INDEX IF NOT EXISTS idx_providers_business_name_trgm
    ON providers USING GIN (business_name gin_trgm_ops);
  CREATE INDEX IF NOT EXISTS idx_providers_description_trgm
    ON providers USING GIN (description gin_trgm_ops);
  CREATE INDEX IF NOT EXISTS idx_services_name_trgm
    ON services USING GIN (name gin_trgm_ops);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_trgm not available, skipping trigram indexes';
END $$;
