from fastapi import FastAPI, APIRouter, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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
        if IS_PRODUCTION:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

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
    allow_methods=["*"],
    allow_headers=["*"],
)

# Debug: test POST endpoint (only available in non-production)
if not IS_PRODUCTION:
    @api_router.post("/debug/test-post")
    async def test_post():
        return {"message": "POST works!", "cors_origins": cors_origins_env[:50] if cors_origins_env else "not set"}

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

    # Log all registered routes for debugging
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

    # Check SMTP configuration
    smtp_user = os.environ.get('SMTP_USER', '')
    smtp_password = os.environ.get('SMTP_PASSWORD', '')
    smtp_port_raw = os.environ.get('SMTP_PORT', '587')
    if smtp_user and smtp_password:
        logger.info(f"SMTP: Configured via env vars (user={smtp_user[:3]}***, port={smtp_port_raw})")
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
