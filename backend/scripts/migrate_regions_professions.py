"""
Migration script: Refresh regions and professions in the production database.

This script:
1. Drops the existing 'regions' and 'professions' collections
2. The app will auto-initialize them with the latest defaults on next API call

Usage:
    cd backend
    python -m scripts.migrate_regions_professions

Or with explicit env vars:
    MONGO_URL=mongodb+srv://... DB_NAME=carelink python -m scripts.migrate_regions_professions

Options:
    --dry-run    Show what would be done without making changes
    --regions    Only refresh regions
    --professions Only refresh professions
"""

import asyncio
import os
import sys
import logging

# Add parent dir to path so we can import app modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


async def migrate(dry_run=False, regions_only=False, professions_only=False):
    from app.database import db, check_db_connection

    # Verify connection
    connected = await check_db_connection()
    if not connected:
        logger.error("Cannot connect to MongoDB. Check MONGO_URL and DB_NAME env vars.")
        sys.exit(1)

    db_name = os.environ.get('DB_NAME', 'unknown').lower()
    logger.info(f"Connected to database: {db_name}")

    do_regions = not professions_only
    do_professions = not regions_only

    # --- Regions ---
    if do_regions:
        regions_count = await db.regions.count_documents({})
        logger.info(f"Current regions in DB: {regions_count}")

        if dry_run:
            logger.info("[DRY RUN] Would drop 'regions' collection")
        else:
            await db.regions.drop()
            logger.info("Dropped 'regions' collection")

            # Trigger re-initialization by importing and calling the builder
            from app.routers.admin import _build_default_regions_from_localities
            new_regions = _build_default_regions_from_localities()
            if new_regions:
                await db.regions.insert_many(new_regions)
                total_cities = sum(len(r.get('cities', [])) for r in new_regions)
                logger.info(f"Inserted {len(new_regions)} regions with {total_cities} cities")
            else:
                logger.warning("No default regions generated!")

    # --- Professions ---
    if do_professions:
        profs_count = await db.professions.count_documents({})
        logger.info(f"Current professions in DB: {profs_count}")

        if dry_run:
            logger.info("[DRY RUN] Would drop 'professions' collection")
        else:
            await db.professions.drop()
            logger.info("Dropped 'professions' collection")

            # Trigger re-initialization
            from app.routers.admin import _get_default_professions
            from datetime import datetime, timezone
            ts = datetime.now(timezone.utc).isoformat()
            new_profs = _get_default_professions(ts)
            if new_profs:
                await db.professions.insert_many(new_profs)
                total_sub = sum(len(p.get('sub_professions', [])) for p in new_profs)
                total_cats = sum(
                    len(c.get('categories', []))
                    for p in new_profs
                    for c in p.get('sub_professions', [])
                )
                logger.info(f"Inserted {len(new_profs)} professions, {total_sub} sub-professions, {total_cats} categories")
            else:
                logger.warning("No default professions generated!")

    logger.info("Migration complete!")


if __name__ == '__main__':
    args = sys.argv[1:]
    dry_run = '--dry-run' in args
    regions_only = '--regions' in args
    professions_only = '--professions' in args

    if dry_run:
        logger.info("=== DRY RUN MODE ===")

    asyncio.run(migrate(
        dry_run=dry_run,
        regions_only=regions_only,
        professions_only=professions_only,
    ))
