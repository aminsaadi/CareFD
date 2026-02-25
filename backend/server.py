from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
import os
import logging

from app.database import client
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
logging.basicConfig(
    level=logging.INFO,
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

# Include the api router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
