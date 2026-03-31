#!/bin/bash
set -e

echo "=== Running Prisma DB Push (create/sync tables) ==="
npx prisma db push --skip-generate

echo "=== Running PostGIS migration (extensions, triggers, indexes) ==="
psql "$DATABASE_URL" -f ./prisma/migrations/00_postgis_search/migration.sql || echo "PostGIS migration warning (may already exist)"

echo "=== Starting Next.js ==="
exec npx next start -p ${PORT:-8000}
