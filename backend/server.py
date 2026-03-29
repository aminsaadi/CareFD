from fastapi import FastAPI, APIRouter, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response as StarletteResponse
from pathlib import Path
import os
import logging

from app.database import client, check_db_connection
from app.utils import ENVIRONMENT, IS_PRODUCTION
from app.routers import (
    auth, providers, services, requests, bookings,
    reviews, favorites, chat, notifications, admin,
    subscriptions, clinics, team, subscriptions_upgrade,
    push, uploads, verification, contact
)

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
log_level = logging.DEBUG if not IS_PRODUCTION else logging.INFO
logging.basicConfig(
    level=log_level,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Include all routers
api_router.include_router(auth.router)
api_router.include_router(providers.router)
api_router.include_router(services.router)
api_router.include_router(requests.router)
api_router.include_router(bookings.router)
api_router.include_router(reviews.router)
api_router.include_router(favorites.router)
api_router.include_router(chat.router)
api_router.include_router(notifications.router)
api_router.include_router(admin.router)
api_router.include_router(subscriptions.router)
api_router.include_router(clinics.router)
api_router.include_router(team.router)
api_router.include_router(subscriptions_upgrade.router)
api_router.include_router(push.router)
api_router.include_router(uploads.router)
api_router.include_router(verification.router)
api_router.include_router(contact.router)

# Health check endpoint
@api_router.get("")
@api_router.get("/")
async def health_check():
    db_connected = await check_db_connection()
    return {
        "status": "ok" if db_connected else "degraded",
        "database": "connected" if db_connected else "disconnected"
    }

# Include the api router in the main app
app.include_router(api_router)

# Security headers middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'"
        response.headers["X-Permitted-Cross-Domain-Policies"] = "none"
        if IS_PRODUCTION:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


# Maintenance mode middleware
import time

_maintenance_cache = {"enabled": False, "message": "", "checked_at": 0}

class MaintenanceModeMiddleware(BaseHTTPMiddleware):
    """Block non-admin API requests when maintenance mode is enabled."""

    BYPASS_PATHS = {
        "/api", "/api/", "/api/settings/public", "/api/auth/login",
        "/api/admin/settings", "/api/admin/smtp-settings", "/api/admin/smtp-check",
        "/api/admin/test-email",
    }
    BYPASS_PREFIXES = ("/api/admin/",)

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Only intercept API requests (not static files / frontend)
        if not path.startswith("/api"):
            return await call_next(request)

        # Always allow bypass paths (health check, public settings, login, admin)
        if path in self.BYPASS_PATHS or any(path.startswith(p) for p in self.BYPASS_PREFIXES):
            return await call_next(request)

        # Check maintenance mode (cache for 30 seconds)
        now = time.time()
        if now - _maintenance_cache["checked_at"] > 30:
            from app.database import db
            settings = await db.site_settings.find_one({}, {"_id": 0, "maintenance_mode": 1, "maintenance_message": 1})
            _maintenance_cache["enabled"] = bool((settings or {}).get("maintenance_mode"))
            _maintenance_cache["message"] = (settings or {}).get("maintenance_message", "")
            _maintenance_cache["checked_at"] = now

        if not _maintenance_cache["enabled"]:
            return await call_next(request)

        # Check if user is admin (let admins through)
        auth_header = request.headers.get("authorization", "")
        token = None
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
        if not token:
            token = request.cookies.get("session_token")

        if token:
            from app.database import db
            session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0, "user_id": 1})
            if session:
                user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0, "role": 1})
                if user and user.get("role") == "admin":
                    return await call_next(request)

        msg = _maintenance_cache["message"] or "האתר במצב תחזוקה. נחזור בקרוב."
        return JSONResponse(
            status_code=503,
            content={"detail": msg, "maintenance": True}
        )


app.add_middleware(MaintenanceModeMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

# CORS: In production, require explicit origins. In staging/dev, allow all.
cors_origins_env = os.environ.get('CORS_ORIGINS', '')
if cors_origins_env:
    cors_origins = [origin.strip().rstrip('/') for origin in cors_origins_env.split(',')]
elif IS_PRODUCTION:
    # Include Railway URLs alongside the main domain
    cors_origins = [
        "https://carefd.com",
        "https://www.carefd.com",
        "https://carefdproduction.up.railway.app",
    ]
    # Also include RAILWAY_PUBLIC_DOMAIN if set
    railway_domain = os.environ.get('RAILWAY_PUBLIC_DOMAIN')
    if railway_domain:
        cors_origins.append(f"https://{railway_domain}")
    logger.warning(f"CORS_ORIGINS not set in production, using defaults: {cors_origins}")
else:
    cors_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
)

# Debug: test POST endpoint (only available in non-production)
if not IS_PRODUCTION:
    @api_router.post("/debug/test-post")
    async def test_post():
        return {"message": "POST works!"}

# Dynamic manifest.json endpoint - reads app settings from DB
@app.get("/manifest.json")
async def dynamic_manifest():
    """Serve a dynamic manifest.json based on admin app settings."""
    from app.database import db
    settings = await db.site_settings.find_one({}, {"_id": 0}) or {}

    manifest = {
        "short_name": settings.get("app_short_name") or settings.get("site_name") or "CareFD",
        "name": settings.get("app_name") or settings.get("site_name") or "CareFD - שירותי בריאות",
        "description": settings.get("app_description") or "CareFD - מחברים בין מטופלים לספקי שירותי בריאות",
        "start_url": "/",
        "display": "standalone",
        "theme_color": settings.get("app_theme_color") or "#19B8BA",
        "background_color": settings.get("app_background_color") or "#ffffff",
        "dir": "rtl",
        "lang": "he",
        "scope": "/",
        "orientation": "any",
        "icons": []
    }

    app_icon = settings.get("app_icon_url")
    if app_icon:
        manifest["icons"] = [
            {"src": app_icon, "type": "image/png", "sizes": "192x192", "purpose": "any maskable"},
            {"src": app_icon, "type": "image/png", "sizes": "512x512", "purpose": "any maskable"},
        ]
    else:
        manifest["icons"] = [
            {"src": "/logo192.png", "type": "image/png", "sizes": "192x192", "purpose": "any maskable"},
            {"src": "/logo512.png", "type": "image/png", "sizes": "512x512", "purpose": "any maskable"},
        ]

    return JSONResponse(content=manifest, headers={"Cache-Control": "no-cache, no-store, must-revalidate"})


@app.get("/robots.txt")
async def robots_txt():
    """Serve robots.txt for search engines."""
    content = """User-agent: *
Allow: /
Disallow: /admin/
Disallow: /dashboard
Disallow: /provider/dashboard
Disallow: /api/
Disallow: /chat/
Disallow: /chats

Sitemap: https://carefd.com/sitemap.xml
"""
    return StarletteResponse(content=content.strip(), media_type="text/plain")


@app.get("/sitemap.xml")
async def sitemap_xml():
    """Generate dynamic sitemap.xml with static pages and database content."""
    from datetime import datetime, timezone
    from app.database import db as sitemap_db

    base_url = "https://carefd.com"
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    urls = []

    # Static pages
    static_pages = [
        {"loc": "/", "priority": "1.0", "changefreq": "daily"},
        {"loc": "/providers", "priority": "0.9", "changefreq": "daily"},
        {"loc": "/services", "priority": "0.9", "changefreq": "daily"},
        {"loc": "/requests", "priority": "0.8", "changefreq": "daily"},
        {"loc": "/about", "priority": "0.7", "changefreq": "monthly"},
        {"loc": "/contact", "priority": "0.6", "changefreq": "monthly"},
        {"loc": "/privacy", "priority": "0.4", "changefreq": "yearly"},
        {"loc": "/terms", "priority": "0.4", "changefreq": "yearly"},
        {"loc": "/login", "priority": "0.5", "changefreq": "monthly"},
        {"loc": "/register", "priority": "0.5", "changefreq": "monthly"},
        {"loc": "/register/provider", "priority": "0.6", "changefreq": "monthly"},
    ]

    for page in static_pages:
        urls.append(
            f'  <url>\n'
            f'    <loc>{base_url}{page["loc"]}</loc>\n'
            f'    <lastmod>{today}</lastmod>\n'
            f'    <changefreq>{page["changefreq"]}</changefreq>\n'
            f'    <priority>{page["priority"]}</priority>\n'
            f'  </url>'
        )

    # Dynamic: Provider profiles
    try:
        providers = await sitemap_db.providers.find(
            {"is_verified": True},
            {"_id": 0, "provider_id": 1, "updated_at": 1}
        ).to_list(5000)
        for p in providers:
            lastmod = p.get("updated_at", today)
            if isinstance(lastmod, str) and "T" in lastmod:
                lastmod = lastmod.split("T")[0]
            elif not isinstance(lastmod, str):
                lastmod = today
            urls.append(
                f'  <url>\n'
                f'    <loc>{base_url}/providers/{p["provider_id"]}</loc>\n'
                f'    <lastmod>{lastmod}</lastmod>\n'
                f'    <changefreq>weekly</changefreq>\n'
                f'    <priority>0.8</priority>\n'
                f'  </url>'
            )
    except Exception:
        pass

    # Dynamic: Services (booking pages)
    try:
        services = await sitemap_db.services.find(
            {"is_active": {"$ne": False}},
            {"_id": 0, "service_id": 1, "updated_at": 1}
        ).to_list(5000)
        for s in services:
            lastmod = s.get("updated_at", today)
            if isinstance(lastmod, str) and "T" in lastmod:
                lastmod = lastmod.split("T")[0]
            elif not isinstance(lastmod, str):
                lastmod = today
            urls.append(
                f'  <url>\n'
                f'    <loc>{base_url}/book/{s["service_id"]}</loc>\n'
                f'    <lastmod>{lastmod}</lastmod>\n'
                f'    <changefreq>weekly</changefreq>\n'
                f'    <priority>0.7</priority>\n'
                f'  </url>'
            )
    except Exception:
        pass

    # Dynamic: CMS static pages
    try:
        pages = await sitemap_db.static_pages.find(
            {"is_published": True},
            {"_id": 0, "slug": 1, "updated_at": 1}
        ).to_list(100)
        for pg in pages:
            lastmod = pg.get("updated_at", today)
            if isinstance(lastmod, str) and "T" in lastmod:
                lastmod = lastmod.split("T")[0]
            elif not isinstance(lastmod, str):
                lastmod = today
            urls.append(
                f'  <url>\n'
                f'    <loc>{base_url}/page/{pg["slug"]}</loc>\n'
                f'    <lastmod>{lastmod}</lastmod>\n'
                f'    <changefreq>monthly</changefreq>\n'
                f'    <priority>0.6</priority>\n'
                f'  </url>'
            )
    except Exception:
        pass

    # Dynamic: Blog posts
    try:
        posts = await sitemap_db.blog_posts.find(
            {"status": "published"},
            {"_id": 0, "slug": 1, "updated_at": 1}
        ).to_list(500)
        for post in posts:
            lastmod = post.get("updated_at", today)
            if isinstance(lastmod, str) and "T" in lastmod:
                lastmod = lastmod.split("T")[0]
            elif not isinstance(lastmod, str):
                lastmod = today
            urls.append(
                f'  <url>\n'
                f'    <loc>{base_url}/blog/{post["slug"]}</loc>\n'
                f'    <lastmod>{lastmod}</lastmod>\n'
                f'    <changefreq>weekly</changefreq>\n'
                f'    <priority>0.7</priority>\n'
                f'  </url>'
            )
    except Exception:
        pass

    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls) + "\n"
        '</urlset>'
    )

    return StarletteResponse(
        content=xml,
        media_type="application/xml",
        headers={"Cache-Control": "public, max-age=3600"}
    )


# Serve frontend static files if available
STATIC_DIR = Path(__file__).parent / "static"
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR / "static")), name="frontend-static")

    @app.get("/{full_path:path}")
    async def serve_frontend(request: Request, full_path: str):
        """Serve React frontend for all non-API routes."""
        file_path = (STATIC_DIR / full_path).resolve()
        # Prevent path traversal - ensure resolved path is within STATIC_DIR
        if not str(file_path).startswith(str(STATIC_DIR.resolve())):
            return FileResponse(str(STATIC_DIR / "index.html"))
        if file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(STATIC_DIR / "index.html"))


@app.on_event("startup")
async def startup_db_client():
    """Verify database connection and environment on startup."""
    logger.info(f"Starting CareFD in {ENVIRONMENT} mode")

    # Log registered routes only in non-production (avoid leaking endpoint info)
    if not IS_PRODUCTION:
        logger.info("=== Registered Routes ===")
        for route in app.routes:
            if hasattr(route, 'methods') and hasattr(route, 'path'):
                logger.info(f"  {route.methods} {route.path}")
            elif hasattr(route, 'path'):
                logger.info(f"  MOUNT {route.path}")
        logger.info(f"=== Total: {len(app.routes)} routes ===")

    # Verify database connection
    logger.info("Checking MongoDB connection on startup...")
    connected = await check_db_connection()
    if not connected:
        logger.error("Application started but MongoDB is NOT connected!")
        logger.error("Check MONGO_URL and DB_NAME environment variables on Railway")
    else:
        logger.info("MongoDB connection verified successfully")
        # Clean up expired sessions on startup
        try:
            from datetime import datetime, timezone
            from app.database import db
            result = await db.user_sessions.delete_many({
                "expires_at": {"$lt": datetime.now(timezone.utc).isoformat()}
            })
            if result.deleted_count > 0:
                logger.info(f"Cleaned up {result.deleted_count} expired sessions")
        except Exception as e:
            logger.warning(f"Session cleanup failed: {e}")

        # Initialize default service types and delivery types if empty
        try:
            if await db.service_types.count_documents({}) == 0:
                default_service_types = [
                    {"type_id": "visit", "name": "שירות ביקור", "name_en": "Visit Service", "description": "שירות הניתן בביקור אחד", "icon": "home", "requires_location": True, "is_active": True},
                    {"type_id": "hourly", "name": "שירות שעתי", "name_en": "Hourly Service", "description": "שירות המחושב לפי שעות", "icon": "clock", "requires_location": True, "has_minimum_hours": True, "is_active": True},
                    {"type_id": "consultation", "name": "שירות ייעוץ", "name_en": "Consultation Service", "description": "שירות ייעוץ מקצועי", "icon": "message-circle", "requires_location": False, "is_active": True},
                    {"type_id": "product", "name": "מוצר", "name_en": "Product", "description": "מוצר למכירה", "icon": "package", "requires_location": False, "has_shipping": True, "is_active": True}
                ]
                await db.service_types.insert_many(default_service_types)
                logger.info("Initialized 4 default service types")

            if await db.delivery_types.count_documents({}) == 0:
                default_delivery_types = [
                    {"type_id": "home_visit", "name": "בבית", "name_en": "At Home", "description": "השירות יינתן בבית הלקוח", "icon": "home", "requires_address": True, "is_active": True},
                    {"type_id": "hospital", "name": "בבית חולים / מוסד", "name_en": "Hospital / Institution", "description": "השירות יינתן בבית חולים או מוסד רפואי", "icon": "building", "requires_address": True, "is_active": True},
                    {"type_id": "clinic", "name": "בקליניקה", "name_en": "At Clinic", "description": "השירות יינתן בקליניקה של הספק", "icon": "building-2", "requires_address": False, "is_active": True},
                    {"type_id": "virtual", "name": "וירטואלי", "name_en": "Virtual", "description": "השירות יינתן בטלפון או וידאו", "icon": "video", "requires_address": False, "sub_types": ["phone", "video"], "is_active": True}
                ]
                await db.delivery_types.insert_many(default_delivery_types)
                logger.info("Initialized 4 default delivery types")
        except Exception as e:
            logger.warning(f"Default data initialization failed: {e}")

    # Check SMTP configuration
    smtp_user = os.environ.get('SMTP_USER', '')
    smtp_password = os.environ.get('SMTP_PASSWORD', '')
    smtp_port_raw = os.environ.get('SMTP_PORT', '587')
    if smtp_user and smtp_password:
        logger.info(f"SMTP: Configured via env vars (port={smtp_port_raw})")
    else:
        logger.warning("SMTP: SMTP_USER/SMTP_PASSWORD not set in env vars. Checking DB settings on first email...")

    # Warn about missing optional config
    missing = []
    if not smtp_user:
        missing.append('SMTP_USER/SMTP_PASSWORD (email sending)')
    if not os.environ.get('VAPID_PRIVATE_KEY'):
        missing.append('VAPID keys (push notifications)')
    if not os.environ.get('ADMIN_SETUP_KEY'):
        missing.append('ADMIN_SETUP_KEY')
    if not os.environ.get('CORS_ORIGINS'):
        missing.append('CORS_ORIGINS')
    if not os.environ.get('SITE_URL'):
        missing.append('SITE_URL')

    if missing:
        logger.warning(f"Missing optional env vars: {', '.join(missing)}")

    # Migrate file URLs from absolute railway/domain URLs to relative paths
    try:
        from app.database import db as _db
        railway_patterns = [
            "https://carefd.up.railway.app/api/files/",
            "https://carefdproduction.up.railway.app/api/files/",
            "https://carefd.com/api/files/",
            "https://www.carefd.com/api/files/",
        ]
        total_fixed = 0
        for pattern in railway_patterns:
            # Fix profile_image in providers
            result = await _db.providers.update_many(
                {"profile_image": {"$regex": f"^{pattern.replace('.', '[.]')}"}},
                [{"$set": {"profile_image": {"$replaceAll": {"input": "$profile_image", "find": pattern, "replacement": "/api/files/"}}}}]
            )
            total_fixed += result.modified_count

            # Fix profile_image in users
            result = await _db.users.update_many(
                {"profile_image": {"$regex": f"^{pattern.replace('.', '[.]')}"}},
                [{"$set": {"profile_image": {"$replaceAll": {"input": "$profile_image", "find": pattern, "replacement": "/api/files/"}}}}]
            )
            total_fixed += result.modified_count

            # Fix file_url in uploaded_files
            result = await _db.uploaded_files.update_many(
                {"file_url": {"$regex": f"^{pattern.replace('.', '[.]')}"}},
                [{"$set": {"file_url": {"$replaceAll": {"input": "$file_url", "find": pattern, "replacement": "/api/files/"}}}}]
            )
            total_fixed += result.modified_count

            # Fix logo/images in site_settings
            for field in ["logo", "favicon", "og_image"]:
                result = await _db.site_settings.update_many(
                    {field: {"$regex": f"^{pattern.replace('.', '[.]')}"}},
                    [{"$set": {field: {"$replaceAll": {"input": f"${field}", "find": pattern, "replacement": "/api/files/"}}}}]
                )
                total_fixed += result.modified_count

        if total_fixed > 0:
            logger.info(f"Migrated {total_fixed} file URLs from absolute to relative paths")
    except Exception as e:
        logger.warning(f"File URL migration failed: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
