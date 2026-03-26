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


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
