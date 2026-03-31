-- PostGIS extension and spatial search setup
-- This runs after Prisma creates the base tables

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable pg_trgm for Hebrew fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Update the location geography column from lat/lng
-- Trigger function to auto-update geography point from lat/lng columns
CREATE OR REPLACE FUNCTION update_provider_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  ELSE
    NEW.location = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on providers table
DROP TRIGGER IF EXISTS trg_provider_location ON providers;
CREATE TRIGGER trg_provider_location
  BEFORE INSERT OR UPDATE OF latitude, longitude ON providers
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_location();

-- Spatial index on the geography column
CREATE INDEX IF NOT EXISTS idx_providers_location_geo
  ON providers USING GIST (location);

-- Full-text search index on business_name and description (Hebrew + general)
CREATE INDEX IF NOT EXISTS idx_providers_business_name_trgm
  ON providers USING GIN (business_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_providers_description_trgm
  ON providers USING GIN (description gin_trgm_ops);

-- Composite indexes for common search patterns
CREATE INDEX IF NOT EXISTS idx_providers_verified_rating
  ON providers (is_verified, rating DESC);

CREATE INDEX IF NOT EXISTS idx_providers_city_verified
  ON providers (city, is_verified);

-- Services search indexes
CREATE INDEX IF NOT EXISTS idx_services_name_trgm
  ON services USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_services_description_trgm
  ON services USING GIN (description gin_trgm_ops);

-- Bookings date index for calendar queries
CREATE INDEX IF NOT EXISTS idx_bookings_provider_date
  ON bookings (provider_id, booking_date);

-- Notifications unread index
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, is_read, created_at DESC);

-- Chat messages room + date index
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_date
  ON chat_messages (room_id, created_at DESC);
