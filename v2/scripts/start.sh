#!/bin/bash
set -e

echo "=== Running Prisma DB Push (create/sync tables) ==="
npx prisma db push --accept-data-loss

echo "=== Running search indexes migration ==="
psql "$DATABASE_URL" -f ./prisma/migrations/00_postgis_search/migration.sql || echo "Warning: migration SQL had issues (indexes may already exist)"

echo "=== Starting Next.js ==="
exec npx next start -p ${PORT:-8000}
