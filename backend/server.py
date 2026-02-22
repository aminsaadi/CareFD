from fastapi import FastAPI, APIRouter, HTTPException, Header, Response, Request, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
from jose import jwt
import httpx
import resend
import asyncio
import shutil
import json
from pywebpush import webpush, WebPushException

ROOT_DIR = Path(__file__).parent
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
load_dotenv(ROOT_DIR / '.env')

# Helper function to generate unique user numbers
def generate_user_number():
    """Generate user number like U5566889"""
    return f"U{random.randint(1000000, 9999999)}"

def generate_provider_number():
    """Generate provider number like P7784569"""
    return f"P{random.randint(1000000, 9999999)}"

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

# VAPID Configuration for Push Notifications
VAPID_PUBLIC_KEY = os.environ.get('VAPID_PUBLIC_KEY', '')
VAPID_PRIVATE_KEY = os.environ.get('VAPID_PRIVATE_KEY', '')
VAPID_CLAIMS_EMAIL = os.environ.get('VAPID_CLAIMS_EMAIL', 'admin@carelink.co.il')

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

# User Models
class UserRole:
    PATIENT = "patient"
    PROVIDER = "provider"
    ADMIN = "admin"

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str = Field(default_factory=lambda: f"user_{uuid.uuid4().hex[:12]}")
    user_number: str = Field(default_factory=generate_user_number)
    email: EmailStr
    name: str
    phone: Optional[str] = None
    password_hash: Optional[str] = None
    role: str = UserRole.PATIENT
    language_preference: str = "he"  # he or ar
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_verified: bool = False
    is_suspended: bool = False
    suspended_at: Optional[datetime] = None
    suspension_reason: Optional[str] = None

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = UserRole.PATIENT
    language_preference: str = "he"
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    session_id: str = Field(default_factory=lambda: f"session_{uuid.uuid4().hex}")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Subscription Models
class SubscriptionTier:
    FREE = "free"
    PRO = "pro"
    PREMIUM = "premium"

class SubscriptionPlan(BaseModel):
    plan_id: str = Field(default_factory=lambda: f"plan_{uuid.uuid4().hex[:12]}")
    name: str  # Free, Pro, Premium
    name_he: str  # חינם, פרו, פרימיום
    tier: str  # free, pro, premium
    price_monthly: float  # 0, 99, 199
    price_yearly: float  # 0, 990, 1990
    currency: str = "ILS"
    features: List[str] = []
    max_services: int = 3  # -1 for unlimited
    max_bookings_per_month: int = 10  # -1 for unlimited
    priority_support: bool = False
    featured_listing: bool = False
    analytics_access: bool = False
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Subscription(BaseModel):
    subscription_id: str = Field(default_factory=lambda: f"sub_{uuid.uuid4().hex[:12]}")
    user_id: str
    provider_id: Optional[str] = None
    plan_id: str
    tier: str  # free, pro, premium
    status: str = "active"  # active, cancelled, expired, pending
    billing_cycle: str = "monthly"  # monthly, yearly
    start_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    end_date: Optional[datetime] = None
    next_billing_date: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    paypal_subscription_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Payment(BaseModel):
    payment_id: str = Field(default_factory=lambda: f"pay_{uuid.uuid4().hex[:12]}")
    user_id: str
    subscription_id: Optional[str] = None
    amount: float
    currency: str = "ILS"
    status: str = "pending"  # pending, completed, failed, refunded
    payment_method: str = "paypal"  # paypal, credit_card
    paypal_order_id: Optional[str] = None
    paypal_capture_id: Optional[str] = None
    description: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

# Provider Models
class ProviderType:
    INDIVIDUAL = "individual"
    COMPANY = "company"
    CLINIC = "clinic"

class TeamMember(BaseModel):
    member_id: str = Field(default_factory=lambda: f"member_{uuid.uuid4().hex[:12]}")
    name: str
    role: str  # "owner", "admin", "staff"
    specializations: List[str] = []
    picture: Optional[str] = None

class Location(BaseModel):
    address: str
    city: str
    country: str = "Israel"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    coverage_radius_km: Optional[float] = None

class Availability(BaseModel):
    day: str  # sunday, monday, tuesday, etc.
    shift: str  # morning, afternoon, evening, night
    start_time: Optional[str] = None  # "09:00" - optional custom time
    end_time: Optional[str] = None  # "17:00" - optional custom time
    is_available: bool = True

# Shift definitions
SHIFT_DEFINITIONS = {
    "morning": {"label": "בוקר", "label_en": "Morning", "default_start": "06:00", "default_end": "12:00"},
    "afternoon": {"label": "צהריים", "label_en": "Afternoon", "default_start": "12:00", "default_end": "18:00"},
    "evening": {"label": "ערב", "label_en": "Evening", "default_start": "18:00", "default_end": "22:00"},
    "night": {"label": "לילה", "label_en": "Night", "default_start": "22:00", "default_end": "06:00"},
}

class VerificationStatus:
    PENDING = "pending"
    DOCUMENTS_SUBMITTED = "documents_submitted"
    VERIFIED = "verified"
    REJECTED = "rejected"

class VerificationDocument(BaseModel):
    document_id: str = Field(default_factory=lambda: f"doc_{uuid.uuid4().hex[:12]}")
    document_type: str  # id_card, license, certificate, diploma
    file_url: str
    file_name: str
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "pending"  # pending, approved, rejected
    rejection_reason: Optional[str] = None

class Provider(BaseModel):
    model_config = ConfigDict(extra="ignore")
    provider_id: str = Field(default_factory=lambda: f"provider_{uuid.uuid4().hex[:12]}")
    provider_number: str = Field(default_factory=generate_provider_number)
    user_id: str
    provider_type: str  # individual, company, clinic
    business_name: Optional[str] = None
    description: Optional[str] = None
    about: Optional[str] = None  # תיאור מפורט אודות הספק
    profile_image: Optional[str] = None  # URL לתמונת פרופיל
    gender: Optional[str] = None  # male, female, other
    specializations: List[str] = []
    expertise: List[str] = []  # מומחיויות ספציפיות
    services: List[str] = []  # List of service_ids
    team_members: List[TeamMember] = []
    location: Optional[Location] = None
    service_areas: List[str] = []  # אזורי מתן שירות
    availability: List[Availability] = []
    languages: List[str] = []  # שפות: hebrew, arabic, english, russian, etc
    target_audience: List[str] = []  # קהל יעד: adults, children, youth, babies, women, elderly
    rating: float = 0.0
    total_reviews: int = 0
    subscription_tier: str = "free"  # free, pro, premium
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_verified: bool = False
    is_recommended: bool = False
    verification_status: str = VerificationStatus.PENDING
    verification_documents: List[VerificationDocument] = []
    verification_notes: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    years_experience: Optional[int] = None
    service_types: List[str] = []
    views_count: int = 0
    profession_title: Optional[str] = None  # רופא, אח מוסמך, פיזיותרפיסט, מרפא בעיסוק, סטודנט, מטפל

# Profession titles options
PROFESSION_TITLES = [
    {"value": "doctor", "label": "רופא", "label_en": "Doctor"},
    {"value": "nurse", "label": "אח/ות מוסמך/ת", "label_en": "Registered Nurse"},
    {"value": "physiotherapist", "label": "פיזיותרפיסט", "label_en": "Physiotherapist"},
    {"value": "occupational_therapist", "label": "מרפא/ה בעיסוק", "label_en": "Occupational Therapist"},
    {"value": "student", "label": "סטודנט/ית", "label_en": "Student"},
    {"value": "caregiver", "label": "מטפל/ת", "label_en": "Caregiver"},
    {"value": "psychologist", "label": "פסיכולוג/ית", "label_en": "Psychologist"},
    {"value": "social_worker", "label": "עובד/ת סוציאלי/ת", "label_en": "Social Worker"},
    {"value": "dietitian", "label": "דיאטן/ית", "label_en": "Dietitian"},
    {"value": "speech_therapist", "label": "קלינאי/ת תקשורת", "label_en": "Speech Therapist"},
]

# Gender options
GENDER_OPTIONS = [
    {"value": "male", "label": "זכר", "label_en": "Male"},
    {"value": "female", "label": "נקבה", "label_en": "Female"},
    {"value": "other", "label": "אחר", "label_en": "Other"},
]

# Language options
LANGUAGE_OPTIONS = [
    {"value": "hebrew", "label": "עברית", "label_en": "Hebrew"},
    {"value": "arabic", "label": "ערבית", "label_en": "Arabic"},
    {"value": "english", "label": "אנגלית", "label_en": "English"},
    {"value": "russian", "label": "רוסית", "label_en": "Russian"},
    {"value": "french", "label": "צרפתית", "label_en": "French"},
    {"value": "spanish", "label": "ספרדית", "label_en": "Spanish"},
    {"value": "amharic", "label": "אמהרית", "label_en": "Amharic"},
]

# Target audience options
TARGET_AUDIENCE_OPTIONS = [
    {"value": "adults", "label": "מבוגרים", "label_en": "Adults"},
    {"value": "children", "label": "ילדים", "label_en": "Children"},
    {"value": "youth", "label": "נוער", "label_en": "Youth"},
    {"value": "babies", "label": "תינוקות", "label_en": "Babies"},
    {"value": "women", "label": "נשים", "label_en": "Women"},
    {"value": "elderly", "label": "קשישים", "label_en": "Elderly"},
    {"value": "pregnant", "label": "נשים בהריון", "label_en": "Pregnant Women"},
    {"value": "postpartum", "label": "יולדות", "label_en": "Postpartum"},
]

class ProviderRegister(BaseModel):
    user_id: str
    provider_type: str
    business_name: Optional[str] = None
    description: Optional[str] = None
    specializations: List[str] = []
    location: Optional[Location] = None

# Service Models
class ServiceType:
    HOME_VISIT = "home_visit"
    CLINIC_VISIT = "clinic_visit"
    HOSPITAL = "hospital"
    VIDEO_CALL = "video_call"
    PHONE_CALL = "phone_call"
    PRODUCT = "product"

class PricingType:
    CONSULTATION = "consultation"
    PER_HOUR = "per_hour"
    HOME_VISIT = "home_visit"
    CLINIC_VISIT = "clinic_visit"

class Service(BaseModel):
    model_config = ConfigDict(extra="ignore")
    service_id: str = Field(default_factory=lambda: f"service_{uuid.uuid4().hex[:12]}")
    provider_id: str
    name: str
    description: str
    service_type: str  # home_visit, clinic_visit, etc.
    pricing_type: str  # consultation, per_hour, etc.
    price: float
    currency: str = "ILS"
    duration_minutes: Optional[int] = None
    minimum_hours: Optional[int] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ServiceCreate(BaseModel):
    name: str
    description: str
    service_type: str
    pricing_type: str
    price: float
    duration_minutes: Optional[int] = None
    minimum_hours: Optional[int] = None

# Request & Offer Models
class RequestStatus:
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class RequestType:
    IMMEDIATE = "immediate"
    SCHEDULED = "scheduled"
    ONE_TIME = "one_time"
    FOLLOW_UP = "follow_up"

class ServiceRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    request_id: str = Field(default_factory=lambda: f"request_{uuid.uuid4().hex[:12]}")
    user_id: str
    title: str
    description: str
    provider_type: Optional[str] = None
    specialization: Optional[str] = None
    service_type: Optional[str] = None
    location: Optional[Location] = None
    budget: Optional[float] = None
    request_type: str = RequestType.ONE_TIME
    status: str = RequestStatus.OPEN
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RequestCreate(BaseModel):
    title: str
    description: str
    provider_type: Optional[str] = None
    specialization: Optional[str] = None
    service_type: Optional[str] = None
    location: Optional[Location] = None
    budget: Optional[float] = None
    request_type: str = RequestType.ONE_TIME

class Offer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    offer_id: str = Field(default_factory=lambda: f"offer_{uuid.uuid4().hex[:12]}")
    request_id: str
    provider_id: str
    price: float
    pricing_type: str
    duration_days: Optional[int] = None
    message: str
    suggested_service_id: Optional[str] = None
    status: str = "pending"  # pending, accepted, rejected
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OfferCreate(BaseModel):
    request_id: str
    price: float
    pricing_type: str
    duration_days: Optional[int] = None
    message: str
    suggested_service_id: Optional[str] = None

# Booking Models
class BookingStatus:
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    PROVIDER_COMPLETED = "provider_completed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ContactPerson(BaseModel):
    name: str
    phone: str
    relationship: Optional[str] = None  # self, family, caregiver

class ServiceLocation(BaseModel):
    address: str
    city: str
    floor: Optional[str] = None
    apartment: Optional[str] = None
    entry_code: Optional[str] = None
    notes: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    booking_id: str = Field(default_factory=lambda: f"booking_{uuid.uuid4().hex[:12]}")
    user_id: str
    provider_id: str
    service_id: str
    booking_date: datetime
    booking_time: Optional[str] = None  # "09:00"
    status: str = BookingStatus.PENDING
    # Client details
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    client_email: Optional[str] = None
    # Contact person
    contact_person: Optional[ContactPerson] = None
    # Service location
    service_location: Optional[ServiceLocation] = None
    # Additional info
    notes: Optional[str] = None
    special_requirements: Optional[str] = None
    # Payment
    final_price: Optional[float] = None
    payment_notes: Optional[str] = None
    # Status timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    confirmed_at: Optional[datetime] = None
    provider_completed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    # Provider/Client names for easy display
    service_name: Optional[str] = None
    provider_name: Optional[str] = None
    user_name: Optional[str] = None
    # Guest booking flag
    is_guest_booking: bool = False

class BookingCreate(BaseModel):
    service_id: str
    booking_date: datetime
    booking_time: Optional[str] = None
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    client_email: Optional[str] = None
    contact_person_name: Optional[str] = None
    contact_person_phone: Optional[str] = None
    contact_person_relationship: Optional[str] = None
    service_address: Optional[str] = None
    service_city: Optional[str] = None
    service_floor: Optional[str] = None
    service_apartment: Optional[str] = None
    service_entry_code: Optional[str] = None
    service_notes: Optional[str] = None
    service_latitude: Optional[float] = None
    service_longitude: Optional[float] = None
    notes: Optional[str] = None
    special_requirements: Optional[str] = None
    # Guest booking fields
    guest_booking: bool = False
    guest_name: Optional[str] = None
    guest_email: Optional[str] = None
    guest_phone: Optional[str] = None
    guest_address: Optional[str] = None

# Review Models
class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    review_id: str = Field(default_factory=lambda: f"review_{uuid.uuid4().hex[:12]}")
    user_id: str
    provider_id: str
    booking_id: Optional[str] = None
    rating: float  # 1-5
    comment: str
    service_quality: Optional[int] = None  # 1-5
    punctuality: Optional[int] = None  # 1-5
    communication: Optional[int] = None  # 1-5
    price_value: Optional[int] = None  # 1-5
    would_recommend: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReviewCreate(BaseModel):
    provider_id: str
    booking_id: Optional[str] = None
    rating: float
    comment: str
    service_quality: Optional[int] = None
    punctuality: Optional[int] = None
    communication: Optional[int] = None
    price_value: Optional[int] = None
    would_recommend: bool = True

# Notification Models
class NotificationType:
    BOOKING_NEW = "booking_new"
    BOOKING_CONFIRMED = "booking_confirmed"
    BOOKING_CANCELLED = "booking_cancelled"
    BOOKING_COMPLETED = "booking_completed"
    BOOKING_PROVIDER_COMPLETED = "booking_provider_completed"
    PROVIDER_NEW_REGISTRATION = "provider_new_registration"
    PROVIDER_VERIFIED = "provider_verified"
    PROVIDER_REJECTED = "provider_rejected"
    PROVIDER_DOCUMENTS_SUBMITTED = "provider_documents_submitted"
    MESSAGE_NEW = "message_new"
    OFFER_NEW = "offer_new"
    OFFER_ACCEPTED = "offer_accepted"
    REVIEW_NEW = "review_new"
    SYSTEM = "system"
    MESSAGE_NEW = "message_new"
    OFFER_NEW = "offer_new"
    OFFER_ACCEPTED = "offer_accepted"
    REVIEW_NEW = "review_new"
    SYSTEM = "system"

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    notification_id: str = Field(default_factory=lambda: f"notif_{uuid.uuid4().hex[:12]}")
    user_id: str
    type: str
    title: str
    message: str
    data: Optional[dict] = None
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Chat Models
class ChatRoom(BaseModel):
    model_config = ConfigDict(extra="ignore")
    room_id: str = Field(default_factory=lambda: f"room_{uuid.uuid4().hex[:12]}")
    user_id: str
    provider_id: str
    request_id: Optional[str] = None
    booking_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_message_at: Optional[datetime] = None

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    message_id: str = Field(default_factory=lambda: f"msg_{uuid.uuid4().hex[:12]}")
    room_id: str
    sender_id: str
    sender_role: str  # patient or provider
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_read: bool = False

class MessageCreate(BaseModel):
    room_id: str
    content: str

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, email: str) -> str:
    """Create a JWT token"""
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

async def get_current_user(authorization: Optional[str] = Header(None), request: Request = None) -> dict:
    """Get current user from token (cookie or header)"""
    token = None
    
    # Try to get token from cookie first
    if request:
        token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not token and authorization:
        if authorization.startswith("Bearer "):
            token = authorization[7:]
        else:
            token = authorization
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check session in database
    session_doc = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user_doc

async def send_email_async(recipient: str, subject: str, html_content: str):
    """Send email using Resend (async)"""
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set, skipping email")
        return
    
    params = {
        "from": SENDER_EMAIL,
        "to": [recipient],
        "subject": subject,
        "html": html_content
    }
    
    try:
        email = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent to {recipient}: {email.get('id')}")
        return email
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")

async def send_push_notification(subscription_info: dict, title: str, body: str, data: dict = None, icon: str = "/logo192.png"):
    """Send a Web Push notification to a single subscription"""
    if not VAPID_PRIVATE_KEY or not VAPID_PUBLIC_KEY:
        logger.warning("VAPID keys not configured, skipping push notification")
        return False
    
    payload = json.dumps({
        "title": title,
        "body": body,
        "icon": icon,
        "badge": "/logo192.png",
        "data": data or {},
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    try:
        webpush(
            subscription_info=subscription_info,
            data=payload,
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={"sub": f"mailto:{VAPID_CLAIMS_EMAIL}"}
        )
        logger.info(f"Push notification sent to endpoint: {subscription_info.get('endpoint', 'unknown')[:50]}...")
        return True
    except WebPushException as ex:
        logger.error(f"Push notification failed: {repr(ex)}")
        # Handle subscription expiry (410 Gone or 404 Not Found)
        if ex.response and ex.response.status_code in [404, 410]:
            # Remove invalid subscription
            await db.push_subscriptions.delete_one({"endpoint": subscription_info.get("endpoint")})
            logger.info("Removed invalid push subscription")
        return False
    except Exception as e:
        logger.error(f"Push notification error: {str(e)}")
        return False

async def send_push_to_user(user_id: str, title: str, body: str, data: dict = None):
    """Send push notifications to all devices of a specific user"""
    subscriptions = await db.push_subscriptions.find(
        {"user_id": user_id},
        {"_id": 0}
    ).to_list(100)
    
    success_count = 0
    for sub in subscriptions:
        subscription_info = {
            "endpoint": sub.get("endpoint"),
            "keys": sub.get("keys")
        }
        if await send_push_notification(subscription_info, title, body, data):
            success_count += 1
    
    return success_count

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    """Register new user with email/password"""
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        name=user_data.name,
        password_hash=hash_password(user_data.password),
        role=user_data.role,
        language_preference=user_data.language_preference
    )
    
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # If registering as a provider, create the provider profile automatically
    provider_id = None
    if user_data.role == UserRole.PROVIDER:
        provider = Provider(
            user_id=user.user_id,
            provider_type="individual",  # Default type
            business_name=user.name,  # Use user's name as initial business name
            email=user.email,
            verification_status=VerificationStatus.PENDING,
            is_verified=False
        )
        
        provider_dict = provider.model_dump()
        provider_dict['created_at'] = provider_dict['created_at'].isoformat()
        provider_dict['verification_documents'] = []
        
        await db.providers.insert_one(provider_dict)
        provider_id = provider.provider_id
        
        # Notify all admins about new provider registration
        admins = await db.users.find({"role": "admin"}, {"user_id": 1}).to_list(100)
        for admin in admins:
            await create_notification(
                admin["user_id"],
                NotificationType.PROVIDER_NEW_REGISTRATION,
                "ספק חדש נרשם!",
                f"ספק חדש נרשם למערכת: {user.name}. נדרש אימות.",
                {"provider_id": provider.provider_id, "user_id": user.user_id}
            )
        
        # Send welcome email to new provider with profile completion link
        profile_link = f"https://carelink.co.il/provider/edit"
        await send_email_async(
            user.email,
            "ברוכים הבאים ל-CareLink - השלימו את הפרופיל שלכם! 🎉",
            f"""
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #19B8BA;">ברוכים הבאים ל-CareLink!</h1>
                </div>
                
                <p style="font-size: 16px; color: #1E4D5F;">שלום {user.name},</p>
                
                <p style="font-size: 16px; color: #4C6D7F;">
                    תודה שנרשמת כספק שירותים בפלטפורמה שלנו! 
                    אנחנו שמחים לקבל אותך למשפחת CareLink.
                </p>
                
                <div style="background: linear-gradient(135deg, #19B8BA 0%, #1E4D5F 100%); padding: 25px; border-radius: 15px; margin: 25px 0;">
                    <h2 style="color: white; margin-top: 0;">📋 הצעדים הבאים:</h2>
                    <ol style="color: white; font-size: 15px; line-height: 2;">
                        <li>השלימו את פרטי הפרופיל שלכם</li>
                        <li>הוסיפו תמונת פרופיל מקצועית</li>
                        <li>הגדירו את שעות הזמינות שלכם</li>
                        <li>העלו מסמכי אימות (תעודות, רישיונות)</li>
                        <li>הוסיפו את השירותים שאתם מציעים</li>
                    </ol>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{profile_link}" style="background-color: #19B8BA; color: white; padding: 15px 40px; text-decoration: none; border-radius: 30px; font-size: 18px; font-weight: bold; display: inline-block;">
                        השלימו את הפרופיל עכשיו ➜
                    </a>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 25px;">
                    <h3 style="color: #1E4D5F; margin-top: 0;">💡 טיפ חשוב:</h3>
                    <p style="color: #4C6D7F; margin-bottom: 0;">
                        ספקים עם פרופיל מלא ומאומת מקבלים יותר הזמנות! 
                        השלימו את כל הפרטים כדי להגדיל את החשיפה שלכם.
                    </p>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #888;">
                    <p>צוות CareLink</p>
                    <p style="font-size: 12px;">אם יש לכם שאלות, אנחנו כאן לעזור!</p>
                </div>
            </div>
            """
        )
    else:
        # Send regular welcome email to users
        await send_email_async(
            user.email,
            "ברוכים הבאים ל-CareLink! 🎉",
            f"""
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #19B8BA;">ברוכים הבאים ל-CareLink!</h1>
                </div>
                
                <p style="font-size: 16px; color: #1E4D5F;">שלום {user.name},</p>
                
                <p style="font-size: 16px; color: #4C6D7F;">
                    תודה שנרשמת לפלטפורמה שלנו! 
                    כעת תוכלו לחפש ולהזמין שירותי בריאות מהספקים המובילים.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://carelink.co.il/providers" style="background-color: #19B8BA; color: white; padding: 15px 40px; text-decoration: none; border-radius: 30px; font-size: 18px; font-weight: bold; display: inline-block;">
                        חפשו ספקים עכשיו ➜
                    </a>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #888;">
                    <p>צוות CareLink</p>
                </div>
            </div>
            """
        )
    
    # Create session
    session_token = create_jwt_token(user.user_id, user.email)
    session = UserSession(
        user_id=user.user_id,
        session_token=session_token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    
    session_dict = session.model_dump()
    session_dict['created_at'] = session_dict['created_at'].isoformat()
    session_dict['expires_at'] = session_dict['expires_at'].isoformat()
    
    await db.user_sessions.insert_one(session_dict)
    
    return {
        "message": "Registration successful",
        "user": {
            "user_id": user.user_id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "provider_id": provider_id
        },
        "session_token": session_token
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin, response: Response):
    """Login with email/password"""
    # Find user
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not user_doc.get("password_hash") or not verify_password(credentials.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create session
    session_token = create_jwt_token(user_doc["user_id"], user_doc["email"])
    session = UserSession(
        user_id=user_doc["user_id"],
        session_token=session_token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    
    session_dict = session.model_dump()
    session_dict['created_at'] = session_dict['created_at'].isoformat()
    session_dict['expires_at'] = session_dict['expires_at'].isoformat()
    
    await db.user_sessions.insert_one(session_dict)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7*24*60*60,
        path="/"
    )
    
    return {
        "message": "Login successful",
        "user": {
            "user_id": user_doc["user_id"],
            "email": user_doc["email"],
            "name": user_doc["name"],
            "role": user_doc["role"],
            "language_preference": user_doc.get("language_preference", "he")
        },
        "session_token": session_token
    }

@api_router.post("/auth/setup-admin")
async def setup_admin(body: dict):
    """One-time setup endpoint to create initial admin user"""
    setup_key = body.get("setup_key")
    
    # Security: require a setup key
    if setup_key != "carelink_admin_setup_2026":
        raise HTTPException(status_code=403, detail="Invalid setup key")
    
    email = body.get("email", "admin@carelink.co.il")
    password = body.get("password", "Admin123!")
    name = body.get("name", "מנהל המערכת")
    
    # Check if admin already exists
    existing = await db.users.find_one({"email": email})
    if existing:
        # Update to admin role if not already
        await db.users.update_one(
            {"email": email},
            {"$set": {"role": "admin", "password_hash": hash_password(password)}}
        )
        return {"message": "Admin user updated", "email": email}
    
    # Create admin user
    user_number = f"U{uuid.uuid4().hex[:7].upper()}"
    admin_user = {
        "user_id": f"admin_{uuid.uuid4().hex[:12]}",
        "user_number": user_number,
        "email": email,
        "name": name,
        "password_hash": hash_password(password),
        "role": "admin",
        "phone": "",
        "is_verified": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "language_preference": "he"
    }
    
    await db.users.insert_one(admin_user)
    
    return {
        "message": "Admin user created successfully",
        "email": email,
        "password": password,
        "note": "Please change the password after first login"
    }

@api_router.get("/auth/session")
async def google_auth_session(session_id: str = Header(None, alias="X-Session-ID"), response: Response = None):
    """Handle Google OAuth session - get user data from Emergent Auth"""
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Call Emergent Auth API
    async with httpx.AsyncClient() as client:
        auth_response = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        auth_data = auth_response.json()
    
    # Check if user exists
    user_doc = await db.users.find_one({"email": auth_data["email"]}, {"_id": 0})
    
    if user_doc:
        # Update user data
        await db.users.update_one(
            {"email": auth_data["email"]},
            {"$set": {
                "name": auth_data.get("name", user_doc["name"]),
                "picture": auth_data.get("picture")
            }}
        )
        user_id = user_doc["user_id"]
    else:
        # Create new user
        user = User(
            email=auth_data["email"],
            name=auth_data.get("name", ""),
            picture=auth_data.get("picture"),
            role=UserRole.PATIENT,
            is_verified=True
        )
        
        user_dict = user.model_dump()
        user_dict['created_at'] = user_dict['created_at'].isoformat()
        
        await db.users.insert_one(user_dict)
        user_id = user.user_id
    
    # Create session
    session_token = auth_data.get("session_token") or create_jwt_token(user_id, auth_data["email"])
    session = UserSession(
        user_id=user_id,
        session_token=session_token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    
    session_dict = session.model_dump()
    session_dict['created_at'] = session_dict['created_at'].isoformat()
    session_dict['expires_at'] = session_dict['expires_at'].isoformat()
    
    await db.user_sessions.insert_one(session_dict)
    
    # Set cookie
    if response:
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7*24*60*60,
            path="/"
        )
    
    # Get updated user
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    
    return {
        "message": "Authentication successful",
        "user": user_doc,
        "session_token": session_token
    }

@api_router.get("/auth/me")
async def get_me(authorization: Optional[str] = Header(None), request: Request = None):
    """Get current authenticated user"""
    user = await get_current_user(authorization, request)
    return user

@api_router.post("/auth/logout")
async def logout(authorization: Optional[str] = Header(None), request: Request = None, response: Response = None):
    """Logout user"""
    token = None
    
    if request:
        token = request.cookies.get("session_token")
    
    if not token and authorization:
        if authorization.startswith("Bearer "):
            token = authorization[7:]
        else:
            token = authorization
    
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    
    if response:
        response.delete_cookie("session_token", path="/")
    
    return {"message": "Logged out successfully"}

@api_router.put("/users/me")
async def update_user_info(
    user_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Update current user's personal info"""
    user = await get_current_user(authorization, request)
    
    allowed_fields = ["first_name", "last_name", "phone", "address", "city"]
    update_data = {}
    
    for field in allowed_fields:
        if field in user_data:
            update_data[field] = user_data[field]
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": update_data}
    )
    
    return {"message": "User info updated successfully"}

@api_router.put("/users/me/password")
async def change_password(
    password_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Change current user's password"""
    user = await get_current_user(authorization, request)
    
    current_password = password_data.get("current_password")
    new_password = password_data.get("new_password")
    
    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail="נא למלא את כל השדות")
    
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="הסיסמה חייבת להכיל לפחות 6 תווים")
    
    # Get user with password
    db_user = await db.users.find_one({"user_id": user["user_id"]})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not pwd_context.verify(current_password, db_user.get("password", "")):
        raise HTTPException(status_code=400, detail="הסיסמה הנוכחית שגויה")
    
    # Hash and update new password
    hashed_password = pwd_context.hash(new_password)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "password": hashed_password,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Password changed successfully"}

# ==================== PROVIDER ROUTES ====================

@api_router.post("/providers")
async def create_provider(provider_data: ProviderRegister, authorization: Optional[str] = Header(None), request: Request = None):
    """Register as a provider"""
    user = await get_current_user(authorization, request)
    
    # Check if provider already exists
    existing = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Provider already exists")
    
    # Create provider with pending verification status
    provider = Provider(
        user_id=user["user_id"],
        provider_type=provider_data.provider_type,
        business_name=provider_data.business_name,
        description=provider_data.description,
        specializations=provider_data.specializations,
        location=provider_data.location,
        verification_status=VerificationStatus.PENDING,
        is_verified=False
    )
    
    provider_dict = provider.model_dump()
    provider_dict['created_at'] = provider_dict['created_at'].isoformat()
    if provider_dict.get('location'):
        provider_dict['location'] = dict(provider_dict['location'])
    provider_dict['verification_documents'] = []
    
    await db.providers.insert_one(provider_dict)
    
    # Update user role
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"role": UserRole.PROVIDER}}
    )
    
    # Notify all admins about new provider registration
    admins = await db.users.find({"role": "admin"}, {"user_id": 1}).to_list(100)
    for admin in admins:
        await create_notification(
            admin["user_id"],
            NotificationType.PROVIDER_NEW_REGISTRATION,
            "ספק חדש נרשם!",
            f"ספק חדש נרשם למערכת: {provider_data.business_name or user.get('name', 'ספק')}. נדרש אימות.",
            {"provider_id": provider.provider_id, "user_id": user["user_id"]}
        )
    
    return provider.model_dump(exclude={"created_at": False})

@api_router.get("/providers/me")
async def get_my_provider(authorization: Optional[str] = Header(None), request: Request = None):
    """Get current user's provider profile"""
    user = await get_current_user(authorization, request)
    
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    return provider

@api_router.post("/providers/documents")
async def upload_verification_document(
    body: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Upload a verification document"""
    user = await get_current_user(authorization, request)
    
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    document_type = body.get("document_type")  # id_card, license, certificate, diploma
    file_url = body.get("file_url")
    file_name = body.get("file_name")
    
    if not document_type or not file_url:
        raise HTTPException(status_code=400, detail="Document type and file URL required")
    
    valid_types = ["id_card", "license", "certificate", "diploma", "other"]
    if document_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid document type. Must be one of: {valid_types}")
    
    document = VerificationDocument(
        document_type=document_type,
        file_url=file_url,
        file_name=file_name or f"{document_type}.pdf"
    )
    
    doc_dict = document.model_dump()
    doc_dict['uploaded_at'] = doc_dict['uploaded_at'].isoformat()
    
    # Add document to provider's documents list
    await db.providers.update_one(
        {"provider_id": provider["provider_id"]},
        {
            "$push": {"verification_documents": doc_dict},
            "$set": {"verification_status": VerificationStatus.DOCUMENTS_SUBMITTED}
        }
    )
    
    # Notify admins
    admins = await db.users.find({"role": "admin"}, {"user_id": 1}).to_list(100)
    for admin in admins:
        await create_notification(
            admin["user_id"],
            NotificationType.PROVIDER_DOCUMENTS_SUBMITTED,
            "מסמכי אימות הועלו",
            f"הספק {provider.get('business_name', 'ספק')} העלה מסמכי אימות לבדיקה.",
            {"provider_id": provider["provider_id"]}
        )
    
    return {"message": "Document uploaded successfully", "document": doc_dict}

@api_router.get("/providers/documents")
async def get_my_documents(authorization: Optional[str] = Header(None), request: Request = None):
    """Get current provider's verification documents"""
    user = await get_current_user(authorization, request)
    
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    return {
        "documents": provider.get("verification_documents", []),
        "verification_status": provider.get("verification_status", "pending"),
        "verification_notes": provider.get("verification_notes")
    }

@api_router.get("/providers/{provider_id}")
async def get_provider(provider_id: str):
    """Get provider details"""
    provider = await db.providers.find_one({"provider_id": provider_id}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Increment view count
    await db.providers.update_one(
        {"provider_id": provider_id},
        {"$inc": {"views_count": 1}}
    )
    
    # Get services
    services = await db.services.find({"provider_id": provider_id, "is_active": True}, {"_id": 0}).to_list(100)
    provider['services_list'] = services
    
    return provider

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in km using Haversine formula"""
    import math
    R = 6371  # Earth's radius in km
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

@api_router.get("/providers")
async def search_providers(
    # Text search
    search: Optional[str] = None,
    # Location filters
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius_km: Optional[float] = None,
    city: Optional[str] = None,
    # Category filters
    specialization: Optional[str] = None,
    specializations: Optional[str] = None,  # comma-separated list
    category: Optional[str] = None,
    # Rating filter
    min_rating: Optional[float] = None,
    # Provider filters
    provider_type: Optional[str] = None,
    service_type: Optional[str] = None,  # home_visit, clinic_visit, video_call, phone_call
    # Experience filter (years)
    min_experience: Optional[int] = None,
    # Verification filters
    verified_only: Optional[bool] = False,
    recommended_only: Optional[bool] = False,
    # Pagination
    skip: int = 0,
    limit: int = 20,
    # Sorting
    sort_by: Optional[str] = "rating",  # rating, distance, reviews
    sort_order: Optional[str] = "desc"
):
    """Advanced search for providers with filters"""
    query = {}
    
    # IMPORTANT: Only show verified/approved providers in public search
    query["verification_status"] = "verified"
    query["is_verified"] = True
    
    # Text search in business_name and description
    if search:
        query["$or"] = [
            {"business_name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"specializations": {"$in": [search]}}
        ]
    
    # City filter
    if city:
        query["location.city"] = {"$regex": city, "$options": "i"}
    
    # Specialization filter (single)
    if specialization:
        query["specializations"] = {"$in": [specialization]}
    
    # Multiple specializations filter
    if specializations:
        spec_list = [s.strip() for s in specializations.split(",")]
        query["specializations"] = {"$in": spec_list}
    
    # Category filter (maps to specializations)
    if category:
        category_mapping = {
            "nursing": ["סיעוד", "סיעוד ביתי", "טיפול בקשישים"],
            "physiotherapy": ["פיזיותרפיה", "שיקום", "שיקום לאחר ניתוח"],
            "doctor": ["רפואת משפחה", "רפואה פנימית"],
            "eldercare": ["גריאטריה", "טיפול בקשישים", "סיעוד"],
            "therapy": ["ריפוי בעיסוק", "ריפוי בדיבור"],
            "alternative": ["רפואה משלימה", "דיקור", "עיסוי רפואי"]
        }
        if category in category_mapping:
            query["specializations"] = {"$in": category_mapping[category]}
    
    # Provider type filter
    if provider_type:
        query["provider_type"] = provider_type
    
    # Service type filter (need to check services)
    if service_type:
        query["service_types"] = {"$in": [service_type]}
    
    # Rating filter
    if min_rating:
        query["rating"] = {"$gte": min_rating}
    
    # Verified filter
    if verified_only:
        query["is_verified"] = True
    
    # Recommended filter
    if recommended_only:
        query["is_recommended"] = True
    
    # Experience filter (in years)
    if min_experience:
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=min_experience * 365)
        query["created_at"] = {"$lte": cutoff_date.isoformat()}
    
    # Execute query
    providers = await db.providers.find(query, {"_id": 0}).to_list(1000)
    
    # Filter by distance if location provided
    if latitude is not None and longitude is not None:
        filtered_providers = []
        for provider in providers:
            if provider.get("location") and provider["location"].get("latitude") and provider["location"].get("longitude"):
                distance = calculate_distance(
                    latitude, longitude,
                    provider["location"]["latitude"],
                    provider["location"]["longitude"]
                )
                provider["distance_km"] = round(distance, 1)
                
                # Apply radius filter if specified
                if radius_km is None or distance <= radius_km:
                    filtered_providers.append(provider)
            elif not radius_km:
                # Include providers without coordinates if no radius filter
                provider["distance_km"] = None
                filtered_providers.append(provider)
        providers = filtered_providers
    
    # Sorting
    if sort_by == "distance" and latitude is not None:
        providers.sort(key=lambda x: x.get("distance_km") or float('inf'), reverse=(sort_order == "desc"))
    elif sort_by == "rating":
        providers.sort(key=lambda x: x.get("rating") or 0, reverse=(sort_order == "desc"))
    elif sort_by == "reviews":
        providers.sort(key=lambda x: x.get("total_reviews") or 0, reverse=(sort_order == "desc"))
    
    total = len(providers)
    
    # Apply pagination after filtering and sorting
    providers = providers[skip:skip + limit]
    
    return {
        "providers": providers,
        "total": total,
        "skip": skip,
        "limit": limit,
        "filters_applied": {
            "search": search,
            "city": city,
            "specialization": specialization,
            "category": category,
            "provider_type": provider_type,
            "service_type": service_type,
            "min_rating": min_rating,
            "radius_km": radius_km,
            "verified_only": verified_only,
            "recommended_only": recommended_only
        }
    }

# Get available filter options
@api_router.get("/providers/filters/options")
async def get_filter_options():
    """Get available filter options based on existing data"""
    # Get unique cities
    cities = await db.providers.distinct("location.city")
    cities = [c for c in cities if c]
    
    # Get unique specializations
    specializations = await db.providers.distinct("specializations")
    specializations = [s for s in specializations if s]
    
    # Get unique provider types
    provider_types = await db.providers.distinct("provider_type")
    
    # Category options
    categories = [
        {"id": "nursing", "name": "סיעוד", "name_en": "Nursing"},
        {"id": "physiotherapy", "name": "פיזיותרפיה", "name_en": "Physiotherapy"},
        {"id": "doctor", "name": "רופא בבית", "name_en": "Doctor"},
        {"id": "eldercare", "name": "טיפול בקשישים", "name_en": "Elder Care"},
        {"id": "therapy", "name": "ריפוי בעיסוק", "name_en": "Occupational Therapy"},
        {"id": "alternative", "name": "רפואה משלימה", "name_en": "Alternative Medicine"}
    ]
    
    # Service types
    service_types = [
        {"id": "home_visit", "name": "ביקור בית", "name_en": "Home Visit"},
        {"id": "clinic_visit", "name": "ביקור במרפאה", "name_en": "Clinic Visit"},
        {"id": "video_call", "name": "טלרפואה", "name_en": "Video Call"},
        {"id": "phone_call", "name": "שיחה טלפונית", "name_en": "Phone Call"}
    ]
    
    # Provider types with labels
    provider_type_options = [
        {"id": "individual", "name": "עצמאי", "name_en": "Individual"},
        {"id": "clinic", "name": "מרפאה", "name_en": "Clinic"},
        {"id": "company", "name": "חברה", "name_en": "Company"}
    ]
    
    # Rating options
    rating_options = [
        {"value": 4.5, "label": "4.5+ כוכבים"},
        {"value": 4.0, "label": "4.0+ כוכבים"},
        {"value": 3.5, "label": "3.5+ כוכבים"},
        {"value": 3.0, "label": "3.0+ כוכבים"}
    ]
    
    # Experience options
    experience_options = [
        {"value": 1, "label": "שנה+"},
        {"value": 3, "label": "3 שנים+"},
        {"value": 5, "label": "5 שנים+"},
        {"value": 10, "label": "10 שנים+"}
    ]
    
    # Radius options
    radius_options = [
        {"value": 5, "label": "5 ק\"מ"},
        {"value": 10, "label": "10 ק\"מ"},
        {"value": 25, "label": "25 ק\"מ"},
        {"value": 50, "label": "50 ק\"מ"},
        {"value": 100, "label": "100 ק\"מ"}
    ]
    
    # Shift options for availability
    shift_options = [
        {"value": "morning", "label": "בוקר", "label_en": "Morning", "default_start": "06:00", "default_end": "12:00"},
        {"value": "afternoon", "label": "צהריים", "label_en": "Afternoon", "default_start": "12:00", "default_end": "18:00"},
        {"value": "evening", "label": "ערב", "label_en": "Evening", "default_start": "18:00", "default_end": "22:00"},
        {"value": "night", "label": "לילה", "label_en": "Night", "default_start": "22:00", "default_end": "06:00"},
    ]
    
    # Days of week
    days_of_week = [
        {"value": "sunday", "label": "ראשון", "label_en": "Sunday"},
        {"value": "monday", "label": "שני", "label_en": "Monday"},
        {"value": "tuesday", "label": "שלישי", "label_en": "Tuesday"},
        {"value": "wednesday", "label": "רביעי", "label_en": "Wednesday"},
        {"value": "thursday", "label": "חמישי", "label_en": "Thursday"},
        {"value": "friday", "label": "שישי", "label_en": "Friday"},
        {"value": "saturday", "label": "שבת", "label_en": "Saturday"},
    ]
    
    return {
        "cities": sorted(cities) if cities else ["תל אביב", "ירושלים", "חיפה", "באר שבע", "רמת גן", "הרצליה", "פתח תקווה"],
        "specializations": sorted(specializations) if specializations else [],
        "categories": categories,
        "service_types": service_types,
        "provider_types": provider_type_options,
        "rating_options": rating_options,
        "experience_options": experience_options,
        "radius_options": radius_options,
        "profession_titles": PROFESSION_TITLES,
        "gender_options": GENDER_OPTIONS,
        "language_options": LANGUAGE_OPTIONS,
        "target_audience_options": TARGET_AUDIENCE_OPTIONS,
        "shift_options": shift_options,
        "days_of_week": days_of_week
    }

@api_router.put("/providers/{provider_id}")
async def update_provider(
    provider_id: str,
    updates: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Update provider details"""
    user = await get_current_user(authorization, request)
    
    provider = await db.providers.find_one({"provider_id": provider_id}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    if provider["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.providers.update_one(
        {"provider_id": provider_id},
        {"$set": updates}
    )
    
    return {"message": "Provider updated successfully"}

# ==================== SERVICE ROUTES ====================

@api_router.post("/services")
async def create_service(
    service_data: ServiceCreate,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Create a new service"""
    user = await get_current_user(authorization, request)
    
    # Get provider
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    service = Service(
        provider_id=provider["provider_id"],
        **service_data.model_dump()
    )
    
    service_dict = service.model_dump()
    service_dict['created_at'] = service_dict['created_at'].isoformat()
    
    await db.services.insert_one(service_dict)
    
    return service.model_dump()

@api_router.get("/services")
async def search_services(
    service_type: Optional[str] = None,
    specialization: Optional[str] = None,
    city: Optional[str] = None,
    max_price: Optional[float] = None,
    skip: int = 0,
    limit: int = 20
):
    """Search services"""
    # Build query
    service_query = {"is_active": True}
    if service_type:
        service_query["service_type"] = service_type
    if max_price:
        service_query["price"] = {"$lte": max_price}
    
    # Get services
    services = await db.services.find(service_query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    # Enhance with provider info
    for service in services:
        provider = await db.providers.find_one({"provider_id": service["provider_id"]}, {"_id": 0})
        if provider:
            service["provider"] = {
                "provider_id": provider["provider_id"],
                "business_name": provider.get("business_name"),
                "rating": provider.get("rating", 0),
                "location": provider.get("location")
            }
    
    # Apply additional filters
    if specialization:
        services = [s for s in services if s.get("provider", {}).get("specializations") and specialization in s["provider"]["specializations"]]
    
    if city:
        services = [s for s in services if s.get("provider", {}).get("location", {}).get("city") == city]
    
    total = len(services)
    
    return {
        "services": services,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@api_router.get("/services/my")
async def get_my_services(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Get services for current provider"""
    user = await get_current_user(authorization, request)
    
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    services = await db.services.find(
        {"provider_id": provider["provider_id"], "is_active": True},
        {"_id": 0}
    ).to_list(100)
    
    return {"services": services}

# ==================== REQUEST & OFFER ROUTES ====================

@api_router.post("/requests")
async def create_request(
    request_data: RequestCreate,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Create a service request"""
    user = await get_current_user(authorization, request)
    
    service_request = ServiceRequest(
        user_id=user["user_id"],
        **request_data.model_dump()
    )
    
    req_dict = service_request.model_dump()
    req_dict['created_at'] = req_dict['created_at'].isoformat()
    req_dict['updated_at'] = req_dict['updated_at'].isoformat()
    if req_dict.get('location'):
        req_dict['location'] = dict(req_dict['location'])
    
    await db.requests.insert_one(req_dict)
    
    return service_request.model_dump()

@api_router.get("/requests/{request_id}")
async def get_request(request_id: str):
    """Get a specific request"""
    request_doc = await db.requests.find_one({"request_id": request_id}, {"_id": 0})
    if not request_doc:
        raise HTTPException(status_code=404, detail="Request not found")
    return request_doc

@api_router.get("/requests")
async def get_requests(
    status: Optional[str] = None,
    specialization: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
):
    """Get service requests"""
    query = {}
    if status:
        query["status"] = status
    else:
        query["status"] = RequestStatus.OPEN
    
    if specialization:
        query["specialization"] = specialization
    
    requests = await db.requests.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.requests.count_documents(query)
    
    return {
        "requests": requests,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@api_router.get("/requests/my")
async def get_my_requests(
    authorization: Optional[str] = Header(None),
    request: Request = None,
    status: Optional[str] = None
):
    """Get current user's requests"""
    user = await get_current_user(authorization, request)
    
    query = {"user_id": user["user_id"]}
    if status:
        query["status"] = status
    
    requests_list = await db.requests.find(query, {"_id": 0}).to_list(100)
    
    return {"requests": requests_list}

@api_router.post("/offers")
async def create_offer(
    offer_data: OfferCreate,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Create an offer for a request"""
    user = await get_current_user(authorization, request)
    
    # Get provider
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=403, detail="Only providers can create offers")
    
    # Check request exists
    service_request = await db.requests.find_one({"request_id": offer_data.request_id}, {"_id": 0})
    if not service_request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    offer = Offer(
        provider_id=provider["provider_id"],
        **offer_data.model_dump()
    )
    
    offer_dict = offer.model_dump()
    offer_dict['created_at'] = offer_dict['created_at'].isoformat()
    
    await db.offers.insert_one(offer_dict)
    
    return offer.model_dump()

@api_router.get("/requests/{request_id}/offers")
async def get_request_offers(request_id: str):
    """Get all offers for a request"""
    offers = await db.offers.find({"request_id": request_id}, {"_id": 0}).to_list(100)
    
    # Enhance with provider info
    for offer in offers:
        provider = await db.providers.find_one({"provider_id": offer["provider_id"]}, {"_id": 0})
        if provider:
            offer["provider"] = {
                "provider_id": provider["provider_id"],
                "business_name": provider.get("business_name"),
                "rating": provider.get("rating", 0)
            }
    
    return {"offers": offers}

@api_router.post("/offers/{offer_id}/accept")
async def accept_offer(
    offer_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Accept an offer"""
    user = await get_current_user(authorization, request)
    
    offer = await db.offers.find_one({"offer_id": offer_id}, {"_id": 0})
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    # Verify user owns the request
    service_request = await db.requests.find_one({"request_id": offer["request_id"]}, {"_id": 0})
    if service_request["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update offer status
    await db.offers.update_one(
        {"offer_id": offer_id},
        {"$set": {"status": "accepted"}}
    )
    
    # Update request status
    await db.requests.update_one(
        {"request_id": offer["request_id"]},
        {"$set": {"status": RequestStatus.IN_PROGRESS}}
    )
    
    return {"message": "Offer accepted"}

# ==================== BOOKING ROUTES ====================

@api_router.post("/bookings")
async def create_booking(
    booking_data: BookingCreate,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Create a booking with full details - supports both authenticated users and guests"""
    
    # Check if this is a guest booking (must use bool() to avoid Python's and returning last truthy value)
    is_guest_booking = bool(booking_data.guest_booking and booking_data.guest_name and booking_data.guest_phone)
    
    user = None
    user_id = None
    user_name = None
    user_email = None
    
    if is_guest_booking:
        # Guest booking - no authentication required
        user_id = f"guest_{uuid.uuid4().hex[:12]}"
        user_name = booking_data.guest_name
        user_email = booking_data.guest_email
    else:
        # Authenticated booking
        try:
            user = await get_current_user(authorization, request)
            user_id = user["user_id"]
            user_name = user.get("name")
            user_email = user.get("email")
        except HTTPException:
            raise HTTPException(status_code=401, detail="Authentication required for non-guest bookings")
    
    # Get service
    service = await db.services.find_one({"service_id": booking_data.service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Get provider
    provider = await db.providers.find_one({"provider_id": service["provider_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Check if provider is verified
    if provider.get("verification_status") not in ["verified", None] and not provider.get("is_verified"):
        raise HTTPException(status_code=400, detail="Provider is not verified yet")
    
    # Check for conflicts
    booking_date_str = booking_data.booking_date.isoformat()
    existing = await db.bookings.find_one({
        "provider_id": service["provider_id"],
        "booking_date": booking_date_str,
        "booking_time": booking_data.booking_time,
        "status": {"$in": ["pending", "confirmed", "in_progress"]}
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Time slot already booked")
    
    # Build contact person
    contact_person = None
    if booking_data.contact_person_name:
        contact_person = ContactPerson(
            name=booking_data.contact_person_name,
            phone=booking_data.contact_person_phone or booking_data.client_phone or booking_data.guest_phone,
            relationship=booking_data.contact_person_relationship
        )
    
    # Build service location
    service_location = None
    if booking_data.service_address or booking_data.guest_address:
        service_location = ServiceLocation(
            address=booking_data.service_address or booking_data.guest_address or "",
            city=booking_data.service_city or "",
            floor=booking_data.service_floor,
            apartment=booking_data.service_apartment,
            entry_code=booking_data.service_entry_code,
            notes=booking_data.service_notes,
            latitude=booking_data.service_latitude,
            longitude=booking_data.service_longitude
        )
    
    # Determine client details
    client_name = booking_data.client_name or booking_data.guest_name or user_name or "אורח"
    client_phone = booking_data.client_phone or booking_data.guest_phone or ""
    client_email = booking_data.client_email or booking_data.guest_email or user_email
    
    booking = Booking(
        user_id=user_id,
        provider_id=service["provider_id"],
        service_id=booking_data.service_id,
        booking_date=booking_data.booking_date,
        booking_time=booking_data.booking_time,
        client_name=client_name,
        client_phone=client_phone,
        client_email=client_email,
        contact_person=contact_person,
        service_location=service_location,
        notes=booking_data.notes,
        special_requirements=booking_data.special_requirements,
        service_name=service.get("name"),
        provider_name=provider.get("business_name"),
        user_name=user_name or client_name,
        is_guest_booking=is_guest_booking
    )
    
    booking_dict = booking.model_dump()
    booking_dict['created_at'] = booking_dict['created_at'].isoformat()
    booking_dict['booking_date'] = booking_dict['booking_date'].isoformat()
    if booking_dict.get('contact_person'):
        booking_dict['contact_person'] = dict(booking_dict['contact_person'])
    if booking_dict.get('service_location'):
        booking_dict['service_location'] = dict(booking_dict['service_location'])
    
    await db.bookings.insert_one(booking_dict)
    
    # Create notification for provider
    notification_client_name = user_name or client_name or "לקוח"
    await create_notification(
        provider["user_id"],
        NotificationType.BOOKING_NEW,
        "הזמנה חדשה!",
        f"{notification_client_name} הזמין {service.get('name', 'שירות')} לתאריך {booking_data.booking_date.strftime('%d/%m/%Y')}",
        {"booking_id": booking.booking_id, "service_id": service["service_id"]}
    )
    
    # Send notification email to provider
    provider_user = await db.users.find_one({"user_id": provider["user_id"]}, {"_id": 0})
    if provider_user:
        await send_email_async(
            provider_user.get("email"),
            "CareLink - הזמנה חדשה!",
            f"""
            <h1>יש לך הזמנה חדשה!</h1>
            <p><strong>לקוח:</strong> {client_name}</p>
            <p><strong>שירות:</strong> {service.get('name', 'שירות')}</p>
            <p><strong>תאריך:</strong> {booking_data.booking_date.strftime('%d/%m/%Y')}</p>
            <p><strong>כתובת:</strong> {booking_data.service_address or booking_data.guest_address or 'לא צוין'}, {booking_data.service_city or ''}</p>
            <p>היכנס לדשבורד כדי לאשר את ההזמנה.</p>
            """
        )
    
    # Send confirmation email to client
    client_email_to_send = client_email or (user.get("email") if user else None)
    if client_email_to_send:
        await send_email_async(
            client_email_to_send,
            "CareLink - אישור הזמנה",
            f"""
            <h1>ההזמנה נשלחה בהצלחה!</h1>
            <p><strong>שירות:</strong> {service.get('name', 'שירות')}</p>
            <p><strong>ספק:</strong> {provider.get('business_name', 'ספק')}</p>
            <p><strong>תאריך:</strong> {booking_data.booking_date.strftime('%d/%m/%Y')}</p>
            <p>סטטוס: ממתין לאישור הספק</p>
            """
        )
    
    return booking.model_dump()

@api_router.get("/bookings")
async def get_bookings(
    authorization: Optional[str] = Header(None),
    request: Request = None,
    status: Optional[str] = None,
    provider_id: Optional[str] = None
):
    """Get user's bookings or provider's bookings"""
    user = await get_current_user(authorization, request)
    
    # Check if user is a provider
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    
    if provider_id:
        # Get bookings for specific provider (must be the owner)
        if not provider or provider["provider_id"] != provider_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        query = {"provider_id": provider_id}
    elif provider:
        # Provider viewing their own bookings
        query = {"provider_id": provider["provider_id"]}
    else:
        # Patient viewing their bookings
        query = {"user_id": user["user_id"]}
    
    if status:
        query["status"] = status
    
    bookings = await db.bookings.find(query, {"_id": 0}).to_list(100)
    
    return {"bookings": bookings}

@api_router.get("/bookings/my")
async def get_my_bookings(
    authorization: Optional[str] = Header(None),
    request: Request = None,
    status: Optional[str] = None
):
    """Get current user's bookings (as patient)"""
    user = await get_current_user(authorization, request)
    
    query = {"user_id": user["user_id"]}
    if status:
        query["status"] = status
    
    bookings = await db.bookings.find(query, {"_id": 0}).to_list(100)
    
    return {"bookings": bookings}

@api_router.get("/bookings/provider")
async def get_provider_bookings(
    authorization: Optional[str] = Header(None),
    request: Request = None,
    status: Optional[str] = None
):
    """Get bookings for current provider"""
    user = await get_current_user(authorization, request)
    
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    query = {"provider_id": provider["provider_id"]}
    if status:
        query["status"] = status
    
    bookings = await db.bookings.find(query, {"_id": 0}).to_list(100)
    
    return {"bookings": bookings}

@api_router.put("/bookings/{booking_id}/cancel")
async def cancel_booking(
    booking_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Cancel a booking"""
    user = await get_current_user(authorization, request)
    
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check authorization
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    is_owner = booking["user_id"] == user["user_id"]
    is_provider = provider and booking["provider_id"] == provider["provider_id"]
    
    if not (is_owner or is_provider):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {
            "status": BookingStatus.CANCELLED,
            "cancelled_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Notify the other party
    if is_owner:
        # Client cancelled - notify provider
        target_provider = await db.providers.find_one({"provider_id": booking["provider_id"]}, {"_id": 0})
        if target_provider:
            await create_notification(
                target_provider["user_id"],
                NotificationType.BOOKING_CANCELLED,
                "הזמנה בוטלה",
                f"הלקוח ביטל את ההזמנה ל-{booking.get('service_name', 'שירות')}",
                {"booking_id": booking_id}
            )
    else:
        # Provider cancelled - notify client
        await create_notification(
            booking["user_id"],
            NotificationType.BOOKING_CANCELLED,
            "הזמנה בוטלה",
            f"הספק ביטל את ההזמנה ל-{booking.get('service_name', 'שירות')}",
            {"booking_id": booking_id}
        )
    
    return {"message": "Booking cancelled successfully"}

@api_router.put("/bookings/{booking_id}/confirm")
async def confirm_booking(
    booking_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Confirm a booking (provider only)"""
    user = await get_current_user(authorization, request)
    
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if user is the provider
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider or booking["provider_id"] != provider["provider_id"]:
        raise HTTPException(status_code=403, detail="Only provider can confirm bookings")
    
    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {
            "status": BookingStatus.CONFIRMED,
            "confirmed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Notify client
    await create_notification(
        booking["user_id"],
        NotificationType.BOOKING_CONFIRMED,
        "ההזמנה אושרה!",
        f"הספק אישר את ההזמנה ל-{booking.get('service_name', 'שירות')} בתאריך {booking.get('booking_date', '')[:10]}",
        {"booking_id": booking_id}
    )
    
    return {"message": "Booking confirmed successfully"}

@api_router.put("/bookings/{booking_id}/provider-complete")
async def provider_complete_booking(
    booking_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Mark booking as completed by provider (awaiting client confirmation)"""
    user = await get_current_user(authorization, request)
    
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if user is the provider
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider or booking["provider_id"] != provider["provider_id"]:
        raise HTTPException(status_code=403, detail="Only provider can mark as completed")
    
    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {
            "status": BookingStatus.PROVIDER_COMPLETED,
            "provider_completed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Notify client to confirm completion
    await create_notification(
        booking["user_id"],
        NotificationType.BOOKING_PROVIDER_COMPLETED,
        "השירות הושלם - אנא אשר",
        f"הספק סימן שהשירות '{booking.get('service_name', '')}' הושלם. אנא אשר ודרג את השירות.",
        {"booking_id": booking_id, "provider_id": booking["provider_id"]}
    )
    
    return {"message": "Booking marked as completed by provider"}

@api_router.put("/bookings/{booking_id}/client-confirm")
async def client_confirm_booking(
    booking_id: str,
    body: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Client confirms booking completion and records payment"""
    user = await get_current_user(authorization, request)
    
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if user is the client
    if booking["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Only client can confirm completion")
    
    # Check status
    if booking["status"] != BookingStatus.PROVIDER_COMPLETED:
        raise HTTPException(status_code=400, detail="Booking must be marked as completed by provider first")
    
    final_price = body.get("final_price")
    payment_notes = body.get("payment_notes")
    
    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {
            "status": BookingStatus.COMPLETED,
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "final_price": final_price,
            "payment_notes": payment_notes
        }}
    )
    
    # Notify provider
    provider = await db.providers.find_one({"provider_id": booking["provider_id"]}, {"_id": 0})
    if provider:
        await create_notification(
            provider["user_id"],
            NotificationType.BOOKING_COMPLETED,
            "הלקוח אישר את השלמת השירות!",
            f"הלקוח אישר שהשירות '{booking.get('service_name', '')}' הושלם בהצלחה.",
            {"booking_id": booking_id}
        )
    
    return {"message": "Booking completed successfully"}

@api_router.put("/bookings/{booking_id}/complete")
async def complete_booking(
    booking_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Mark booking as completed (provider only) - Legacy endpoint"""
    user = await get_current_user(authorization, request)
    
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if user is the provider
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider or booking["provider_id"] != provider["provider_id"]:
        raise HTTPException(status_code=403, detail="Only provider can complete bookings")
    
    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {
            "status": BookingStatus.PROVIDER_COMPLETED,
            "provider_completed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Notify client
    await create_notification(
        booking["user_id"],
        NotificationType.BOOKING_PROVIDER_COMPLETED,
        "השירות הושלם - אנא אשר",
        f"הספק סימן שהשירות '{booking.get('service_name', '')}' הושלם. אנא אשר ודרג את השירות.",
        {"booking_id": booking_id, "provider_id": booking["provider_id"]}
    )
    
    return {"message": "Booking completed successfully"}

@api_router.put("/bookings/{booking_id}/status")
async def update_booking_status(
    booking_id: str,
    body: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Update booking status (provider only)"""
    user = await get_current_user(authorization, request)
    
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider or booking["provider_id"] != provider["provider_id"]:
        raise HTTPException(status_code=403, detail="Only provider can update booking status")
    
    new_status = body.get("status")
    valid_statuses = ["pending", "confirmed", "in_progress", "provider_completed", "completed", "cancelled"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    update_data = {"status": new_status}
    
    if new_status == "confirmed":
        update_data["confirmed_at"] = datetime.now(timezone.utc).isoformat()
    elif new_status == "provider_completed":
        update_data["provider_completed_at"] = datetime.now(timezone.utc).isoformat()
    elif new_status == "cancelled":
        update_data["cancelled_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": update_data}
    )
    
    # Notify client based on status
    notification_map = {
        "confirmed": (NotificationType.BOOKING_CONFIRMED, "ההזמנה אושרה!", "הספק אישר את ההזמנה"),
        "cancelled": (NotificationType.BOOKING_CANCELLED, "ההזמנה בוטלה", "הספק ביטל את ההזמנה"),
        "provider_completed": (NotificationType.BOOKING_PROVIDER_COMPLETED, "השירות הושלם", "הספק סימן שהשירות הושלם. אנא אשר.")
    }
    
    if new_status in notification_map:
        notif_type, title, message = notification_map[new_status]
        await create_notification(
            booking["user_id"],
            notif_type,
            title,
            message,
            {"booking_id": booking_id}
        )
    
    return {"message": f"Booking status updated to {new_status}"}

# ==================== REVIEW ROUTES ====================

@api_router.post("/reviews")
async def create_review(
    review_data: ReviewCreate,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Create a review"""
    user = await get_current_user(authorization, request)
    
    review = Review(
        user_id=user["user_id"],
        **review_data.model_dump()
    )
    
    review_dict = review.model_dump()
    review_dict['created_at'] = review_dict['created_at'].isoformat()
    
    await db.reviews.insert_one(review_dict)
    
    # Update provider rating
    reviews = await db.reviews.find({"provider_id": review_data.provider_id}, {"_id": 0}).to_list(1000)
    avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
    
    await db.providers.update_one(
        {"provider_id": review_data.provider_id},
        {"$set": {
            "rating": round(avg_rating, 1),
            "total_reviews": len(reviews)
        }}
    )
    
    return review.model_dump()

@api_router.get("/providers/{provider_id}/reviews")
async def get_provider_reviews(provider_id: str, skip: int = 0, limit: int = 20):
    """Get provider reviews"""
    reviews = await db.reviews.find({"provider_id": provider_id}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    # Enhance with user info
    for review in reviews:
        user = await db.users.find_one({"user_id": review["user_id"]}, {"_id": 0, "password_hash": 0})
        if user:
            review["user"] = {
                "name": user.get("name"),
                "picture": user.get("picture")
            }
    
    return {"reviews": reviews}

# ==================== FAVORITES ROUTES ====================

@api_router.post("/favorites/{provider_id}")
async def add_to_favorites(
    provider_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Add provider to favorites"""
    user = await get_current_user(authorization, request)
    
    # Check if already in favorites
    existing = await db.favorites.find_one({
        "user_id": user["user_id"],
        "provider_id": provider_id
    })
    
    if existing:
        return {"message": "Already in favorites", "is_favorite": True}
    
    favorite = {
        "favorite_id": f"fav_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "provider_id": provider_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.favorites.insert_one(favorite)
    
    return {"message": "Added to favorites", "is_favorite": True}

@api_router.delete("/favorites/{provider_id}")
async def remove_from_favorites(
    provider_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Remove provider from favorites"""
    user = await get_current_user(authorization, request)
    
    result = await db.favorites.delete_one({
        "user_id": user["user_id"],
        "provider_id": provider_id
    })
    
    return {"message": "Removed from favorites", "is_favorite": False}

@api_router.get("/favorites")
async def get_favorites(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Get user's favorite providers"""
    user = await get_current_user(authorization, request)
    
    favorites = await db.favorites.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    
    # Get provider details for each favorite
    provider_ids = [f["provider_id"] for f in favorites]
    providers = []
    
    for pid in provider_ids:
        provider = await db.providers.find_one({"provider_id": pid}, {"_id": 0})
        if provider:
            providers.append(provider)
    
    return {"favorites": providers}

@api_router.get("/favorites/check/{provider_id}")
async def check_favorite(
    provider_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Check if provider is in favorites"""
    user = await get_current_user(authorization, request)
    
    existing = await db.favorites.find_one({
        "user_id": user["user_id"],
        "provider_id": provider_id
    })
    
    return {"is_favorite": existing is not None}

# ==================== CHAT ROUTES ====================

@api_router.post("/chat/rooms")
async def create_chat_room(
    room_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Create a chat room"""
    user = await get_current_user(authorization, request)
    
    # Check if room already exists
    existing = await db.chat_rooms.find_one({
        "user_id": room_data.get("user_id"),
        "provider_id": room_data.get("provider_id")
    }, {"_id": 0})
    
    if existing:
        return existing
    
    chat_room = ChatRoom(
        user_id=room_data.get("user_id"),
        provider_id=room_data.get("provider_id"),
        request_id=room_data.get("request_id"),
        booking_id=room_data.get("booking_id")
    )
    
    room_dict = chat_room.model_dump()
    room_dict['created_at'] = room_dict['created_at'].isoformat()
    if room_dict.get('last_message_at'):
        room_dict['last_message_at'] = room_dict['last_message_at'].isoformat()
    
    await db.chat_rooms.insert_one(room_dict)
    
    return chat_room.model_dump()

@api_router.get("/chat/rooms")
async def get_chat_rooms(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Get user's chat rooms"""
    user = await get_current_user(authorization, request)
    
    # Check if user is a provider
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    
    if provider:
        query = {"provider_id": provider["provider_id"]}
    else:
        query = {"user_id": user["user_id"]}
    
    rooms = await db.chat_rooms.find(query, {"_id": 0}).sort("last_message_at", -1).to_list(100)
    
    # Enrich with user/provider info
    for room in rooms:
        if provider:
            # Provider viewing - get patient info
            patient = await db.users.find_one({"user_id": room["user_id"]}, {"_id": 0, "password_hash": 0})
            if patient:
                room["other_user"] = patient
        else:
            # Patient viewing - get provider info
            provider_info = await db.providers.find_one({"provider_id": room["provider_id"]}, {"_id": 0})
            if provider_info:
                room["other_user"] = provider_info
        
        # Get last message
        last_msg_cursor = db.messages.find(
            {"room_id": room["room_id"]},
            {"_id": 0}
        ).sort("created_at", -1).limit(1)
        last_msg_list = await last_msg_cursor.to_list(1)
        if last_msg_list:
            room["last_message"] = last_msg_list[0]
    
    return {"rooms": rooms}

@api_router.post("/chat/messages")
async def send_message(
    message_data: MessageCreate,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Send a message"""
    user = await get_current_user(authorization, request)
    
    # Verify room access
    room = await db.chat_rooms.find_one({"room_id": message_data.room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    # Check authorization
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    is_participant = (
        room["user_id"] == user["user_id"] or 
        (provider and room["provider_id"] == provider["provider_id"])
    )
    
    if not is_participant:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    sender_role = "provider" if provider else "patient"
    
    message = Message(
        room_id=message_data.room_id,
        sender_id=user["user_id"],
        sender_role=sender_role,
        content=message_data.content
    )
    
    message_dict = message.model_dump()
    message_dict['created_at'] = message_dict['created_at'].isoformat()
    
    await db.messages.insert_one(message_dict)
    
    # Update room's last_message_at
    await db.chat_rooms.update_one(
        {"room_id": message_data.room_id},
        {"$set": {"last_message_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return message.model_dump()

@api_router.get("/chat/messages/{room_id}")
async def get_messages(
    room_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None,
    skip: int = 0,
    limit: int = 50
):
    """Get messages in a room"""
    user = await get_current_user(authorization, request)
    
    # Verify room access
    room = await db.chat_rooms.find_one({"room_id": room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    # Check authorization
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    is_participant = (
        room["user_id"] == user["user_id"] or 
        (provider and room["provider_id"] == provider["provider_id"])
    )
    
    if not is_participant:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    messages = await db.messages.find(
        {"room_id": room_id},
        {"_id": 0}
    ).sort("created_at", 1).skip(skip).limit(limit).to_list(limit)
    
    # Mark messages as read
    await db.messages.update_many(
        {"room_id": room_id, "sender_id": {"$ne": user["user_id"]}, "is_read": False},
        {"$set": {"is_read": True}}
    )
    
    return {"messages": messages}

# ==================== NOTIFICATIONS ROUTES ====================

async def create_notification(user_id: str, notif_type: str, title: str, message: str, data: dict = None):
    """Helper function to create notifications"""
    notification = Notification(
        user_id=user_id,
        type=notif_type,
        title=title,
        message=message,
        data=data
    )
    notif_dict = notification.model_dump()
    notif_dict['created_at'] = notif_dict['created_at'].isoformat()
    await db.notifications.insert_one(notif_dict)
    return notification

@api_router.get("/notifications")
async def get_notifications(
    authorization: Optional[str] = Header(None),
    request: Request = None,
    unread_only: bool = False,
    skip: int = 0,
    limit: int = 50
):
    """Get user notifications"""
    user = await get_current_user(authorization, request)
    
    query = {"user_id": user["user_id"]}
    if unread_only:
        query["is_read"] = False
    
    notifications = await db.notifications.find(
        query, {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    unread_count = await db.notifications.count_documents({
        "user_id": user["user_id"],
        "is_read": False
    })
    
    return {
        "notifications": notifications,
        "unread_count": unread_count
    }

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Mark notification as read"""
    user = await get_current_user(authorization, request)
    
    result = await db.notifications.update_one(
        {"notification_id": notification_id, "user_id": user["user_id"]},
        {"$set": {"is_read": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification marked as read"}

@api_router.put("/notifications/read-all")
async def mark_all_notifications_read(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Mark all notifications as read"""
    user = await get_current_user(authorization, request)
    
    await db.notifications.update_many(
        {"user_id": user["user_id"], "is_read": False},
        {"$set": {"is_read": True}}
    )
    
    return {"message": "All notifications marked as read"}

@api_router.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Delete a notification"""
    user = await get_current_user(authorization, request)
    
    result = await db.notifications.delete_one({
        "notification_id": notification_id,
        "user_id": user["user_id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification deleted"}

# ==================== ADMIN ROUTES ====================

@api_router.get("/admin/users")
async def admin_get_users(
    authorization: Optional[str] = Header(None),
    request: Request = None,
    role: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """Admin: Get all users"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if role:
        query["role"] = role
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    users = await db.users.find(
        query,
        {"_id": 0, "password_hash": 0}
    ).skip(skip).limit(limit).to_list(limit)
    
    total = await db.users.count_documents(query)
    
    return {"users": users, "total": total, "skip": skip, "limit": limit}

@api_router.put("/admin/users/{user_id}/role")
async def admin_update_user_role(
    user_id: str,
    role_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update user role"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    new_role = role_data.get("role")
    if new_role not in ["patient", "provider", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"role": new_role}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": f"User role updated to {new_role}"}

@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(
    user_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Delete user"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Don't allow deleting self
    if admin["user_id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    result = await db.users.delete_one({"user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted"}

@api_router.get("/admin/users/{user_id}")
async def admin_get_user_details(
    user_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Get detailed user information including provider data if applicable"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get provider data if user is a provider
    provider_data = None
    if user.get("role") == "provider":
        provider_data = await db.providers.find_one({"user_id": user_id}, {"_id": 0})
    
    # Get user's bookings count
    bookings_count = await db.bookings.count_documents({"user_id": user_id})
    
    # Get user's messages count
    messages = await db.messages.find({"sender_id": user_id}).to_list(1000)
    messages_count = len(messages)
    
    return {
        "user": user,
        "provider": provider_data,
        "stats": {
            "bookings_count": bookings_count,
            "messages_count": messages_count
        }
    }

@api_router.put("/admin/users/{user_id}")
async def admin_update_user(
    user_id: str,
    user_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update user details"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Fields that can be updated
    allowed_fields = ["name", "email", "phone", "role", "is_verified"]
    update_data = {k: v for k, v in user_data.items() if k in allowed_fields}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User updated successfully"}

@api_router.put("/admin/users/{user_id}/suspend")
async def admin_suspend_user(
    user_id: str,
    suspend_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Suspend or unsuspend a user"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Don't allow suspending self
    if admin["user_id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot suspend yourself")
    
    is_suspended = suspend_data.get("is_suspended", True)
    reason = suspend_data.get("reason", "")
    
    update_data = {
        "is_suspended": is_suspended,
        "suspension_reason": reason if is_suspended else None,
        "suspended_at": datetime.now(timezone.utc).isoformat() if is_suspended else None
    }
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Send notification to user
    action = "הושעה" if is_suspended else "שוחרר מהשעיה"
    await create_notification(
        user_id,
        "account_status",
        f"החשבון שלך {action}",
        reason if is_suspended else "החשבון שלך חזר לפעילות מלאה.",
        {"suspended": is_suspended}
    )
    
    return {"message": f"User {'suspended' if is_suspended else 'unsuspended'} successfully"}

@api_router.post("/admin/users/{user_id}/message")
async def admin_send_message_to_user(
    user_id: str,
    message_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Send a private message to a user"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    subject = message_data.get("subject", "הודעה ממנהל המערכת")
    content = message_data.get("content", "")
    
    if not content:
        raise HTTPException(status_code=400, detail="Message content is required")
    
    # Create notification
    await create_notification(
        user_id,
        "admin_message",
        subject,
        content,
        {"from_admin": True, "admin_id": admin["user_id"]}
    )
    
    # Store in admin messages collection
    admin_message = {
        "message_id": f"admin_msg_{uuid.uuid4().hex[:12]}",
        "from_admin_id": admin["user_id"],
        "to_user_id": user_id,
        "subject": subject,
        "content": content,
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "is_read": False
    }
    await db.admin_messages.insert_one(admin_message)
    
    return {"message": "Message sent successfully"}

@api_router.get("/admin/users/{user_id}/verification-documents")
async def admin_get_user_verification_documents(
    user_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Get user's verification documents"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if user is a provider
    provider = await db.providers.find_one({"user_id": user_id}, {"_id": 0})
    if not provider:
        return {"documents": [], "verification_status": "not_provider"}
    
    return {
        "documents": provider.get("verification_documents", []),
        "verification_status": provider.get("verification_status", "pending"),
        "verification_notes": provider.get("verification_notes")
    }

@api_router.put("/admin/verification-documents/{document_id}/status")
async def admin_update_document_status(
    document_id: str,
    status_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Approve or reject a verification document"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    new_status = status_data.get("status")  # approved, rejected
    rejection_reason = status_data.get("rejection_reason", "")
    
    if new_status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.providers.update_one(
        {"verification_documents.document_id": document_id},
        {"$set": {
            "verification_documents.$.status": new_status,
            "verification_documents.$.rejection_reason": rejection_reason if new_status == "rejected" else None
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"message": f"Document {new_status}"}

# ==================== ADMIN SERVICES ====================

@api_router.get("/admin/services")
async def admin_get_services(
    authorization: Optional[str] = Header(None),
    request: Request = None,
    provider_id: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """Admin: Get all services"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if provider_id:
        query["provider_id"] = provider_id
    if category:
        query["category"] = category
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    services = await db.services.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.services.count_documents(query)
    
    # Enrich with provider info
    for service in services:
        provider = await db.providers.find_one(
            {"provider_id": service.get("provider_id")},
            {"_id": 0, "business_name": 1, "provider_number": 1}
        )
        if provider:
            service["provider_name"] = provider.get("business_name", "לא ידוע")
            service["provider_number"] = provider.get("provider_number", "")
    
    return {"services": services, "total": total}

@api_router.put("/admin/services/{service_id}")
async def admin_update_service(
    service_id: str,
    service_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update a service"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Fields that can be updated
    allowed_fields = ["name", "description", "price", "duration", "is_active", "category"]
    update_data = {k: v for k, v in service_data.items() if k in allowed_fields}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.services.update_one(
        {"service_id": service_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return {"message": "Service updated successfully"}

@api_router.delete("/admin/services/{service_id}")
async def admin_delete_service(
    service_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Delete a service"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.services.delete_one({"service_id": service_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return {"message": "Service deleted"}

@api_router.get("/admin/bookings")
async def admin_get_bookings(
    authorization: Optional[str] = Header(None),
    request: Request = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """Admin: Get all bookings"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if status:
        query["status"] = status
    
    bookings = await db.bookings.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.bookings.count_documents(query)
    
    return {"bookings": bookings, "total": total, "skip": skip, "limit": limit}

@api_router.get("/admin/providers")
async def admin_get_all_providers(
    search: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Get ALL providers (including unverified)"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    
    if search:
        query["$or"] = [
            {"business_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}}
        ]
    
    if status:
        if status == "verified":
            query["is_verified"] = True
        elif status == "pending":
            query["verification_status"] = "pending"
        elif status == "rejected":
            query["verification_status"] = "rejected"
    
    total = await db.providers.count_documents(query)
    providers = await db.providers.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Also get users with role=provider that don't have a provider record
    provider_user_ids = [p.get("user_id") for p in providers if p.get("user_id")]
    orphan_provider_users = await db.users.find(
        {"role": "provider", "user_id": {"$nin": provider_user_ids}},
        {"_id": 0, "password_hash": 0}
    ).to_list(100)
    
    # Convert orphan users to provider-like format
    for user in orphan_provider_users:
        providers.append({
            "provider_id": None,
            "user_id": user.get("user_id"),
            "business_name": user.get("name", "ספק ללא פרופיל"),
            "email": user.get("email"),
            "phone": user.get("phone", ""),
            "is_verified": False,
            "verification_status": "incomplete",
            "provider_number": user.get("user_number"),
            "needs_profile": True
        })
        total += 1
    
    return {
        "providers": providers,
        "total": total,
        "page": skip // limit + 1,
        "limit": limit
    }


@api_router.put("/admin/providers/{provider_id}")
async def admin_update_provider(
    provider_id: str,
    provider_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update provider profile"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Fields that can be updated by admin
    allowed_fields = [
        "business_name", "email", "phone", "address", "city", "bio",
        "experience_years", "years_experience", "specializations", "languages", "is_verified",
        "is_recommended", "provider_type", "license_number", "location",
        # Complete profile editing fields
        "profession_title", "gender", "about", "description", "profile_image", "profile_color",
        "expertise", "target_audience", "service_areas", "availability", "website",
        # New enhanced profile fields
        "health_funds", "payment_methods", "cancellation_policy", "cancellation_notice_hours",
        "show_phone", "show_email", "show_whatsapp", "whatsapp_number",
        "education", "certifications"
    ]
    
    update_data = {}
    for field in allowed_fields:
        if field in provider_data:
            update_data[field] = provider_data[field]
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.providers.update_one(
        {"provider_id": provider_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    return {"message": "Provider updated successfully"}



@api_router.put("/admin/providers/{provider_id}/verify")
async def admin_verify_provider(
    provider_id: str,
    body: dict = None,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Verify a provider (full approval)"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    notes = body.get("notes") if body else None
    
    result = await db.providers.update_one(
        {"provider_id": provider_id},
        {"$set": {
            "is_verified": True,
            "verification_status": VerificationStatus.VERIFIED,
            "verification_notes": notes
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Notify provider
    provider = await db.providers.find_one({"provider_id": provider_id}, {"_id": 0})
    if provider:
        await create_notification(
            provider["user_id"],
            NotificationType.PROVIDER_VERIFIED,
            "החשבון שלך אומת! 🎉",
            "הפרופיל שלך אומת בהצלחה. כעת הלקוחות יכולים להזמין שירותים ולראות שאתה ספק מאומת.",
            {"provider_id": provider_id}
        )
        
        # Send email
        provider_user = await db.users.find_one({"user_id": provider["user_id"]}, {"_id": 0})
        if provider_user:
            await send_email_async(
                provider_user.get("email"),
                "CareLink - החשבון שלך אומת!",
                f"""
                <h1>ברכות! החשבון שלך אומת 🎉</h1>
                <p>שלום {provider.get('business_name', 'ספק')},</p>
                <p>אנו שמחים לבשר לך שהפרופיל שלך אומת בהצלחה!</p>
                <p>כעת לקוחות יכולים לראות את תג האימות שלך ולהזמין את השירותים שלך.</p>
                <p>בהצלחה!</p>
                <p>צוות CareLink</p>
                """
            )
    
    return {"message": "Provider verified"}


@api_router.post("/admin/providers/create-from-user/{user_id}")
async def admin_create_provider_from_user(
    user_id: str,
    body: dict = None,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Create a provider profile for an orphaned provider user"""
    admin_user = await get_current_user(authorization, request)
    if admin_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if user exists and has role=provider
    target_user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if target_user.get("role") != "provider":
        raise HTTPException(status_code=400, detail="User is not a provider")
    
    # Check if provider profile already exists
    existing_provider = await db.providers.find_one({"user_id": user_id}, {"_id": 0})
    if existing_provider:
        raise HTTPException(status_code=400, detail="Provider profile already exists")
    
    # Create provider profile
    provider = Provider(
        user_id=user_id,
        provider_type=body.get("provider_type", "individual") if body else "individual",
        business_name=body.get("business_name", target_user.get("name", "ספק")) if body else target_user.get("name", "ספק"),
        email=target_user.get("email"),
        phone=target_user.get("phone"),
        verification_status=VerificationStatus.PENDING,
        is_verified=False
    )
    
    provider_dict = provider.model_dump()
    provider_dict['created_at'] = provider_dict['created_at'].isoformat()
    provider_dict['verification_documents'] = []
    
    await db.providers.insert_one(provider_dict)
    
    return {
        "message": "Provider profile created successfully",
        "provider_id": provider.provider_id,
        "provider_number": provider.provider_number
    }



@api_router.put("/admin/providers/{provider_id}/reject")
async def admin_reject_provider(
    provider_id: str,
    body: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Reject a provider verification"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    reason = body.get("reason", "הבקשה נדחתה")
    
    result = await db.providers.update_one(
        {"provider_id": provider_id},
        {"$set": {
            "is_verified": False,
            "verification_status": VerificationStatus.REJECTED,
            "verification_notes": reason
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Notify provider
    provider = await db.providers.find_one({"provider_id": provider_id}, {"_id": 0})
    if provider:
        await create_notification(
            provider["user_id"],
            NotificationType.PROVIDER_REJECTED,
            "בקשת האימות נדחתה",
            f"בקשת האימות שלך נדחתה. סיבה: {reason}",
            {"provider_id": provider_id, "reason": reason}
        )
    
    return {"message": "Provider verification rejected"}

@api_router.get("/admin/providers/pending")
async def admin_get_pending_providers(
    authorization: Optional[str] = Header(None),
    request: Request = None,
    skip: int = 0,
    limit: int = 50
):
    """Admin: Get providers pending verification"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {
        "$or": [
            {"verification_status": VerificationStatus.PENDING},
            {"verification_status": VerificationStatus.DOCUMENTS_SUBMITTED},
            {"is_verified": False, "verification_status": {"$exists": False}}
        ]
    }
    
    providers = await db.providers.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.providers.count_documents(query)
    
    # Enrich with user data
    for provider in providers:
        provider_user = await db.users.find_one({"user_id": provider["user_id"]}, {"_id": 0, "password_hash": 0})
        if provider_user:
            provider["user_info"] = provider_user
    
    return {"providers": providers, "total": total, "skip": skip, "limit": limit}

@api_router.put("/admin/providers/{provider_id}/documents/{document_id}/approve")
async def admin_approve_document(
    provider_id: str,
    document_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Approve a specific document"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.providers.update_one(
        {"provider_id": provider_id, "verification_documents.document_id": document_id},
        {"$set": {"verification_documents.$.status": "approved"}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"message": "Document approved"}

@api_router.put("/admin/providers/{provider_id}/documents/{document_id}/reject")
async def admin_reject_document(
    provider_id: str,
    document_id: str,
    body: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Reject a specific document"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    reason = body.get("reason", "המסמך נדחה")
    
    result = await db.providers.update_one(
        {"provider_id": provider_id, "verification_documents.document_id": document_id},
        {"$set": {
            "verification_documents.$.status": "rejected",
            "verification_documents.$.rejection_reason": reason
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Notify provider
    provider = await db.providers.find_one({"provider_id": provider_id}, {"_id": 0})
    if provider:
        await create_notification(
            provider["user_id"],
            NotificationType.SYSTEM,
            "מסמך נדחה",
            f"אחד המסמכים שהעלית נדחה. סיבה: {reason}",
            {"provider_id": provider_id, "document_id": document_id}
        )
    
    return {"message": "Document rejected"}

# ==================== REGIONS MANAGEMENT ====================

@api_router.get("/regions")
async def get_regions():
    """Get all regions"""
    regions = await db.regions.find({}, {"_id": 0}).to_list(100)
    
    # Return default regions if none exist
    if not regions:
        default_regions = [
            {"region_id": "north", "name": "צפון", "cities": ["חיפה", "נהריה", "עכו", "כרמיאל", "צפת", "טבריה", "קריות", "נצרת"]},
            {"region_id": "center", "name": "מרכז", "cities": ["תל אביב", "רמת גן", "פתח תקווה", "הרצליה", "רעננה", "נתניה", "ראשון לציון", "חולון"]},
            {"region_id": "south", "name": "דרום", "cities": ["באר שבע", "אשדוד", "אשקלון", "אילת", "דימונה", "קריית גת"]},
            {"region_id": "jerusalem", "name": "ירושלים והסביבה", "cities": ["ירושלים", "בית שמש", "מודיעין", "מעלה אדומים"]}
        ]
        # Insert defaults
        await db.regions.insert_many(default_regions)
        return {"regions": default_regions}
    
    return {"regions": regions}

@api_router.post("/admin/regions")
async def create_region(
    region_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Create a new region"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    region = {
        "region_id": f"region_{uuid.uuid4().hex[:8]}",
        "name": region_data.get("name"),
        "cities": region_data.get("cities", []),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.regions.insert_one(region)
    if "_id" in region:
        del region["_id"]
    
    return {"message": "Region created", "region": region}

@api_router.put("/admin/regions/{region_id}")
async def update_region(
    region_id: str,
    region_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update a region"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {}
    if "name" in region_data:
        update_data["name"] = region_data["name"]
    if "cities" in region_data:
        update_data["cities"] = region_data["cities"]
    
    result = await db.regions.update_one(
        {"region_id": region_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Region not found")
    
    return {"message": "Region updated"}

@api_router.delete("/admin/regions/{region_id}")
async def delete_region(
    region_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Delete a region"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.regions.delete_one({"region_id": region_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Region not found")
    
    return {"message": "Region deleted"}

@api_router.post("/admin/regions/{region_id}/cities")
async def add_city_to_region(
    region_id: str,
    city_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Add a city to a region"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    city_name = city_data.get("city")
    if not city_name:
        raise HTTPException(status_code=400, detail="City name required")
    
    result = await db.regions.update_one(
        {"region_id": region_id},
        {"$addToSet": {"cities": city_name}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Region not found")
    
    return {"message": f"City '{city_name}' added to region"}

@api_router.delete("/admin/regions/{region_id}/cities/{city_name}")
async def remove_city_from_region(
    region_id: str,
    city_name: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Remove a city from a region"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.regions.update_one(
        {"region_id": region_id},
        {"$pull": {"cities": city_name}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Region not found")
    
    return {"message": f"City '{city_name}' removed from region"}

@api_router.put("/admin/providers/{provider_id}/recommend")
async def admin_recommend_provider(
    provider_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Set provider as recommended"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.providers.update_one(
        {"provider_id": provider_id},
        {"$set": {"is_recommended": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    return {"message": "Provider marked as recommended"}

@api_router.get("/admin/stats")
async def admin_get_stats(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Get platform statistics"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    stats = {
        "total_users": await db.users.count_documents({}),
        "total_providers": await db.providers.count_documents({}),
        "verified_providers": await db.providers.count_documents({"is_verified": True}),
        "total_services": await db.services.count_documents({"is_active": True}),
        "total_bookings": await db.bookings.count_documents({}),
        "pending_bookings": await db.bookings.count_documents({"status": "pending"}),
        "total_requests": await db.requests.count_documents({}),
        "open_requests": await db.requests.count_documents({"status": "open"}),
        "total_reviews": await db.reviews.count_documents({}),
        "total_messages": await db.messages.count_documents({})
    }
    
    # Get recent registrations (last 7 days)
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    stats["new_users_week"] = await db.users.count_documents({
        "created_at": {"$gte": week_ago}
    })
    stats["new_bookings_week"] = await db.bookings.count_documents({
        "created_at": {"$gte": week_ago}
    })
    
    return stats


@api_router.get("/stats/public")
async def get_public_stats():
    """Public: Get basic platform statistics for landing page"""
    stats = {
        "total_providers": await db.providers.count_documents({"is_verified": True}),
        "total_services": await db.services.count_documents({"is_active": True}),
        "total_users": await db.users.count_documents({"role": {"$in": ["patient", "user"]}}),
        "total_cities": len(await db.providers.distinct("city", {"is_verified": True, "city": {"$ne": None}}))
    }
    return stats



@api_router.post("/admin/notifications/broadcast")
async def admin_broadcast_notification(
    notif_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Broadcast notification to all users"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    title = notif_data.get("title")
    message = notif_data.get("message")
    target_role = notif_data.get("role")  # Optional: target specific role
    
    query = {}
    if target_role:
        query["role"] = target_role
    
    users = await db.users.find(query, {"user_id": 1}).to_list(10000)
    
    for u in users:
        await create_notification(
            u["user_id"],
            NotificationType.SYSTEM,
            title,
            message
        )
    
    return {"message": f"Notification sent to {len(users)} users"}

# ==================== ADMIN SETTINGS ====================

@api_router.get("/settings/public")
async def get_public_settings():
    """Get public site settings (no auth required)"""
    settings = await db.site_settings.find_one({}, {"_id": 0})
    if not settings:
        settings = {
            "contact_email": "info@carelink.co.il",
            "contact_phone": "03-1234567",
            "contact_address": "תל אביב, ישראל",
            "footer_text": "© 2025 CareLink. All rights reserved.",
            "social_facebook": "",
            "social_instagram": "",
            "social_twitter": "",
            "social_linkedin": "",
            "social_youtube": "",
            "footer_links": []
        }
    # Only return public fields
    public_fields = [
        "contact_email", "contact_phone", "contact_address",
        "footer_text", "social_facebook", "social_instagram",
        "social_twitter", "social_linkedin", "social_youtube",
        "footer_links", "site_name", "site_tagline"
    ]
    return {k: v for k, v in settings.items() if k in public_fields}

@api_router.get("/admin/settings")
async def admin_get_settings(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Get site settings"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    settings = await db.site_settings.find_one({}, {"_id": 0})
    if not settings:
        # Return default settings
        settings = {
            "site_name": "CareLink",
            "site_tagline": "Connecting Care Providers",
            "logo_url": "",
            "favicon_url": "",
            "contact_email": "info@carelink.co.il",
            "contact_phone": "03-1234567",
            "contact_address": "תל אביב, ישראל",
            "footer_text": "© 2024 CareLink. כל הזכויות שמורות.",
            "social_facebook": "",
            "social_instagram": "",
            "social_twitter": "",
            "social_linkedin": "",
            "social_youtube": "",
            "footer_links": [
                {"label": "אודות", "url": "/about"},
                {"label": "תנאי שימוש", "url": "/terms"},
                {"label": "מדיניות פרטיות", "url": "/privacy"},
                {"label": "צור קשר", "url": "/contact"}
            ],
            "maintenance_mode": False,
            "allow_registrations": True,
            "require_email_verification": True,
            "google_analytics_id": "",
            "meta_description": "",
            "meta_keywords": ""
        }
    return settings

@api_router.put("/admin/settings")
async def admin_update_settings(
    settings_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update site settings"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    settings_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.site_settings.update_one(
        {},
        {"$set": settings_data},
        upsert=True
    )
    
    return {"message": "Settings updated successfully"}

# ==================== ADMIN PROFESSIONS ====================

@api_router.get("/admin/professions")
async def admin_get_professions(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Get all professions with hierarchy"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    professions = await db.professions.find({}, {"_id": 0}).to_list(100)
    
    if not professions:
        # Return default structure
        professions = [
            {
                "profession_id": "prof_medicine",
                "name": "רפואה",
                "name_en": "Medicine",
                "sub_professions": [
                    {"sub_profession_id": "sub_family", "name": "רפואת משפחה", "name_en": "Family Medicine", "categories": []},
                    {"sub_profession_id": "sub_pediatrics", "name": "ילדים", "name_en": "Pediatrics", "categories": []}
                ]
            },
            {
                "profession_id": "prof_nursing",
                "name": "סיעוד",
                "name_en": "Nursing",
                "sub_professions": [
                    {"sub_profession_id": "sub_home_care", "name": "סיעוד ביתי", "name_en": "Home Care", "categories": []}
                ]
            },
            {
                "profession_id": "prof_therapy",
                "name": "טיפול",
                "name_en": "Therapy",
                "sub_professions": [
                    {"sub_profession_id": "sub_physio", "name": "פיזיותרפיה", "name_en": "Physiotherapy", "categories": []},
                    {"sub_profession_id": "sub_occupational", "name": "ריפוי בעיסוק", "name_en": "Occupational Therapy", "categories": []}
                ]
            }
        ]
    
    return {"professions": professions}

@api_router.post("/admin/professions")
async def admin_create_profession(
    profession_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Create a new profession"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    profession = {
        "profession_id": f"prof_{uuid.uuid4().hex[:12]}",
        "name": profession_data.get("name"),
        "name_en": profession_data.get("name_en", ""),
        "sub_professions": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.professions.insert_one(profession)
    
    return {"message": "Profession created", "profession": {k: v for k, v in profession.items() if k != "_id"}}

@api_router.post("/admin/professions/{profession_id}/sub-professions")
async def admin_create_sub_profession(
    profession_id: str,
    sub_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Create a sub-profession"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    sub_profession = {
        "sub_profession_id": f"sub_{uuid.uuid4().hex[:12]}",
        "name": sub_data.get("name"),
        "name_en": sub_data.get("name_en", ""),
        "categories": []
    }
    
    result = await db.professions.update_one(
        {"profession_id": profession_id},
        {"$push": {"sub_professions": sub_profession}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Profession not found")
    
    return {"message": "Sub-profession created", "sub_profession": sub_profession}

@api_router.post("/admin/sub-professions/{sub_profession_id}/categories")
async def admin_create_category(
    sub_profession_id: str,
    category_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Create a category under a sub-profession"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    category = {
        "category_id": f"cat_{uuid.uuid4().hex[:12]}",
        "name": category_data.get("name"),
        "name_en": category_data.get("name_en", "")
    }
    
    result = await db.professions.update_one(
        {"sub_professions.sub_profession_id": sub_profession_id},
        {"$push": {"sub_professions.$.categories": category}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Sub-profession not found")
    
    return {"message": "Category created", "category": category}

@api_router.delete("/admin/professions/{profession_id}")
async def admin_delete_profession(
    profession_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Delete a profession"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.professions.delete_one({"profession_id": profession_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Profession not found")
    
    return {"message": "Profession deleted"}

@api_router.delete("/admin/sub-professions/{sub_profession_id}")
async def admin_delete_sub_profession(
    sub_profession_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Delete a sub-profession"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.professions.update_one(
        {"sub_professions.sub_profession_id": sub_profession_id},
        {"$pull": {"sub_professions": {"sub_profession_id": sub_profession_id}}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Sub-profession not found")
    
    return {"message": "Sub-profession deleted"}

@api_router.delete("/admin/categories/{category_id}")
async def admin_delete_category(
    category_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Delete a category"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.professions.update_one(
        {"sub_professions.categories.category_id": category_id},
        {"$pull": {"sub_professions.$.categories": {"category_id": category_id}}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return {"message": "Category deleted"}

# ==================== ADMIN ADS ====================

@api_router.get("/admin/ads")
async def admin_get_ads(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Get all ads"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    ads = await db.ads.find({}, {"_id": 0}).to_list(100)
    return {"ads": ads}

@api_router.post("/admin/ads")
async def admin_create_ad(
    ad_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Create a new ad"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    ad = {
        "ad_id": f"ad_{uuid.uuid4().hex[:12]}",
        "title": ad_data.get("title"),
        "image_url": ad_data.get("image_url"),
        "link_url": ad_data.get("link_url", ""),
        "position": ad_data.get("position", "homepage_top"),
        "start_date": ad_data.get("start_date"),
        "end_date": ad_data.get("end_date"),
        "is_active": ad_data.get("is_active", True),
        "views": 0,
        "clicks": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.ads.insert_one(ad)
    
    return {"message": "Ad created", "ad": {k: v for k, v in ad.items() if k != "_id"}}

@api_router.put("/admin/ads/{ad_id}")
async def admin_update_ad(
    ad_id: str,
    ad_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update an ad"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    ad_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.ads.update_one(
        {"ad_id": ad_id},
        {"$set": ad_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ad not found")
    
    return {"message": "Ad updated"}

@api_router.delete("/admin/ads/{ad_id}")
async def admin_delete_ad(
    ad_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Delete an ad"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.ads.delete_one({"ad_id": ad_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ad not found")
    
    return {"message": "Ad deleted"}

# ==================== ADMIN BLOG ====================

@api_router.get("/admin/blog")
async def admin_get_blog_posts(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Get all blog posts"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    posts = await db.blog_posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"posts": posts}

@api_router.post("/admin/blog")
async def admin_create_blog_post(
    post_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Create a new blog post"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    post = {
        "post_id": f"post_{uuid.uuid4().hex[:12]}",
        "title": post_data.get("title"),
        "slug": post_data.get("slug", ""),
        "excerpt": post_data.get("excerpt", ""),
        "content": post_data.get("content", ""),
        "featured_image": post_data.get("featured_image", ""),
        "tags": post_data.get("tags", []),
        "is_published": post_data.get("is_published", False),
        "views": 0,
        "author_id": user.get("user_id"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.blog_posts.insert_one(post)
    
    return {"message": "Blog post created", "post": {k: v for k, v in post.items() if k != "_id"}}

@api_router.put("/admin/blog/{post_id}")
async def admin_update_blog_post(
    post_id: str,
    post_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update a blog post"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    post_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.blog_posts.update_one(
        {"post_id": post_id},
        {"$set": post_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Blog post not found")
    
    return {"message": "Blog post updated"}

@api_router.delete("/admin/blog/{post_id}")
async def admin_delete_blog_post(
    post_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Delete a blog post"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.blog_posts.delete_one({"post_id": post_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Blog post not found")
    
    return {"message": "Blog post deleted"}

# ==================== ADMIN BOOKINGS STATUS ====================

@api_router.put("/admin/bookings/{booking_id}/status")
async def admin_update_booking_status(
    booking_id: str,
    status_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update booking status"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    new_status = status_data.get("status")
    valid_statuses = ["pending", "confirmed", "in_progress", "completed", "cancelled"]
    
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    update_data = {"status": new_status}
    
    if new_status == "confirmed":
        update_data["confirmed_at"] = datetime.now(timezone.utc).isoformat()
    elif new_status == "completed":
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
    elif new_status == "cancelled":
        update_data["cancelled_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return {"message": f"Booking status updated to {new_status}"}

# ==================== ADMIN PAGES (Static Pages) ====================

@api_router.get("/admin/pages")
async def admin_get_pages(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Get all static pages"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    pages = await db.static_pages.find({}, {"_id": 0}).to_list(100)
    
    if not pages:
        # Return default pages
        pages = [
            {"page_id": "page_about", "title": "אודות", "slug": "about", "content": "", "is_published": True},
            {"page_id": "page_terms", "title": "תנאי שימוש", "slug": "terms", "content": "", "is_published": True},
            {"page_id": "page_privacy", "title": "מדיניות פרטיות", "slug": "privacy", "content": "", "is_published": True},
            {"page_id": "page_contact", "title": "צור קשר", "slug": "contact", "content": "", "is_published": True}
        ]
    
    return {"pages": pages}

@api_router.post("/admin/pages")
async def admin_create_page(
    page_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Create a new static page"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    page = {
        "page_id": f"page_{uuid.uuid4().hex[:12]}",
        "title": page_data.get("title"),
        "slug": page_data.get("slug", ""),
        "content": page_data.get("content", ""),
        "is_published": page_data.get("is_published", False),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.static_pages.insert_one(page)
    
    return {"message": "Page created", "page": {k: v for k, v in page.items() if k != "_id"}}

@api_router.put("/admin/pages/{page_id}")
async def admin_update_page(
    page_id: str,
    page_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update a static page"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    page_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.static_pages.update_one(
        {"page_id": page_id},
        {"$set": page_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Page not found")
    
    return {"message": "Page updated"}

@api_router.delete("/admin/pages/{page_id}")
async def admin_delete_page(
    page_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Delete a static page"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.static_pages.delete_one({"page_id": page_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Page not found")
    
    return {"message": "Page deleted"}

# ==================== ADMIN FEATURED PROVIDERS ====================

@api_router.put("/admin/providers/{provider_id}/unrecommend")
async def admin_unrecommend_provider(
    provider_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Remove provider from recommended"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.providers.update_one(
        {"provider_id": provider_id},
        {"$set": {"is_recommended": False}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    return {"message": "Provider removed from recommended"}

@api_router.get("/admin/featured")
async def admin_get_featured_providers(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Get all featured/recommended providers"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    providers = await db.providers.find({"is_recommended": True}, {"_id": 0}).to_list(100)
    return {"providers": providers}

@api_router.delete("/admin/providers/clear-all")
async def admin_clear_all_providers(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Delete all providers (use with caution!)"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Delete all providers
    result = await db.providers.delete_many({})
    
    # Delete all services
    services_result = await db.services.delete_many({})
    
    return {
        "message": "All providers cleared",
        "providers_deleted": result.deleted_count,
        "services_deleted": services_result.deleted_count
    }

@api_router.delete("/admin/providers/{provider_id}")
async def admin_delete_provider(
    provider_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Delete a specific provider"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Delete provider
    result = await db.providers.delete_one({"provider_id": provider_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Delete provider's services
    await db.services.delete_many({"provider_id": provider_id})
    
    return {"message": "Provider deleted", "provider_id": provider_id}

@api_router.post("/admin/clear-cache")
async def admin_clear_cache(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Clear server-side cache"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # In a production environment, you might clear Redis cache or other caches here
    # For now, we'll just return success
    return {"message": "Cache cleared successfully", "timestamp": datetime.now(timezone.utc).isoformat()}

# ==================== ADMIN REPORTS ====================

@api_router.get("/admin/reports")
async def admin_get_reports(
    period: str = "month",  # week, month, year
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Get reports data for charts"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    now = datetime.now(timezone.utc)
    
    # Calculate date range based on period
    if period == "week":
        start_date = now - timedelta(days=7)
        date_format = "%d/%m"
        group_days = 1
    elif period == "year":
        start_date = now - timedelta(days=365)
        date_format = "%m/%Y"
        group_days = 30
    else:  # month (default)
        start_date = now - timedelta(days=30)
        date_format = "%d/%m"
        group_days = 1
    
    start_date_str = start_date.isoformat()
    
    # Get bookings in period
    bookings = await db.bookings.find(
        {"created_at": {"$gte": start_date_str}},
        {"_id": 0, "created_at": 1, "status": 1, "provider_id": 1, "provider_name": 1, "final_price": 1}
    ).to_list(10000)
    
    # Bookings over time
    bookings_by_date = {}
    for booking in bookings:
        try:
            created = booking.get("created_at", "")
            if isinstance(created, str) and created:
                date_obj = datetime.fromisoformat(created.replace("Z", "+00:00"))
                date_key = date_obj.strftime(date_format)
                bookings_by_date[date_key] = bookings_by_date.get(date_key, 0) + 1
        except:
            pass
    
    # Generate all dates in range for complete chart
    bookings_timeline = []
    current = start_date
    while current <= now:
        date_key = current.strftime(date_format)
        bookings_timeline.append({
            "date": date_key,
            "bookings": bookings_by_date.get(date_key, 0)
        })
        current += timedelta(days=group_days)
    
    # Status distribution
    status_counts = {"pending": 0, "confirmed": 0, "completed": 0, "cancelled": 0}
    for booking in bookings:
        status = booking.get("status", "pending")
        if status in status_counts:
            status_counts[status] += 1
    
    status_distribution = [
        {"name": "ממתינות", "value": status_counts["pending"], "color": "#f59e0b"},
        {"name": "מאושרות", "value": status_counts["confirmed"], "color": "#10b981"},
        {"name": "הושלמו", "value": status_counts["completed"], "color": "#3b82f6"},
        {"name": "בוטלו", "value": status_counts["cancelled"], "color": "#ef4444"}
    ]
    
    # Top providers by bookings
    provider_bookings = {}
    for booking in bookings:
        provider_name = booking.get("provider_name", "לא ידוע")
        provider_bookings[provider_name] = provider_bookings.get(provider_name, 0) + 1
    
    top_providers = sorted(
        [{"name": k, "bookings": v} for k, v in provider_bookings.items()],
        key=lambda x: x["bookings"],
        reverse=True
    )[:10]
    
    # Revenue calculation (from completed bookings with price)
    total_revenue = 0
    revenue_by_date = {}
    for booking in bookings:
        if booking.get("status") == "completed" and booking.get("final_price"):
            total_revenue += booking["final_price"]
            try:
                created = booking.get("created_at", "")
                if isinstance(created, str) and created:
                    date_obj = datetime.fromisoformat(created.replace("Z", "+00:00"))
                    date_key = date_obj.strftime(date_format)
                    revenue_by_date[date_key] = revenue_by_date.get(date_key, 0) + booking["final_price"]
            except:
                pass
    
    # New users in period
    users_in_period = await db.users.count_documents({"created_at": {"$gte": start_date_str}})
    
    # New providers in period
    providers_in_period = await db.providers.count_documents({"created_at": {"$gte": start_date_str}})
    
    # Reviews in period
    reviews_in_period = await db.reviews.count_documents({"created_at": {"$gte": start_date_str}})
    
    # Average rating
    all_reviews = await db.reviews.find({}, {"_id": 0, "rating": 1}).to_list(10000)
    avg_rating = sum(r.get("rating", 0) for r in all_reviews) / len(all_reviews) if all_reviews else 0
    
    return {
        "period": period,
        "summary": {
            "total_bookings": len(bookings),
            "total_revenue": total_revenue,
            "new_users": users_in_period,
            "new_providers": providers_in_period,
            "new_reviews": reviews_in_period,
            "avg_rating": round(avg_rating, 2)
        },
        "bookings_timeline": bookings_timeline,
        "status_distribution": status_distribution,
        "top_providers": top_providers,
        "revenue_by_date": [{"date": k, "revenue": v} for k, v in revenue_by_date.items()]
    }

# ==================== SUBSCRIPTION PLANS ====================

# Default subscription plans
DEFAULT_PLANS = [
    {
        "plan_id": "plan_free",
        "name": "Free",
        "name_he": "חינם",
        "tier": "free",
        "price_monthly": 0,
        "price_yearly": 0,
        "currency": "ILS",
        "features": [
            "עד 3 שירותים",
            "עד 10 הזמנות בחודש",
            "פרופיל בסיסי"
        ],
        "max_services": 3,
        "max_bookings_per_month": 10,
        "priority_support": False,
        "featured_listing": False,
        "analytics_access": False,
        "is_active": True
    },
    {
        "plan_id": "plan_pro",
        "name": "Pro",
        "name_he": "פרו",
        "tier": "pro",
        "price_monthly": 99,
        "price_yearly": 990,
        "currency": "ILS",
        "features": [
            "עד 10 שירותים",
            "הזמנות ללא הגבלה",
            "תמיכה בעדיפות",
            "סטטיסטיקות מתקדמות"
        ],
        "max_services": 10,
        "max_bookings_per_month": -1,
        "priority_support": True,
        "featured_listing": False,
        "analytics_access": True,
        "is_active": True
    },
    {
        "plan_id": "plan_premium",
        "name": "Premium",
        "name_he": "פרימיום",
        "tier": "premium",
        "price_monthly": 199,
        "price_yearly": 1990,
        "currency": "ILS",
        "features": [
            "שירותים ללא הגבלה",
            "הזמנות ללא הגבלה",
            "תמיכה VIP",
            "סטטיסטיקות מתקדמות",
            "הבלטה בתוצאות חיפוש",
            "תג ספק מומלץ"
        ],
        "max_services": -1,
        "max_bookings_per_month": -1,
        "priority_support": True,
        "featured_listing": True,
        "analytics_access": True,
        "is_active": True
    }
]

@api_router.get("/subscription-plans")
async def get_subscription_plans():
    """Get all available subscription plans"""
    plans = await db.subscription_plans.find({"is_active": True}, {"_id": 0}).to_list(10)
    
    if not plans:
        # Initialize default plans
        for plan in DEFAULT_PLANS:
            plan["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.subscription_plans.update_one(
                {"plan_id": plan["plan_id"]},
                {"$set": plan},
                upsert=True
            )
        plans = DEFAULT_PLANS
    
    return {"plans": plans}

@api_router.get("/subscriptions/my")
async def get_my_subscription(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Get current user's subscription"""
    user = await get_current_user(authorization, request)
    
    subscription = await db.subscriptions.find_one(
        {"user_id": user["user_id"], "status": {"$in": ["active", "pending"]}},
        {"_id": 0}
    )
    
    if not subscription:
        # Return free tier as default
        return {
            "subscription": {
                "tier": "free",
                "status": "active",
                "plan_id": "plan_free"
            },
            "plan": DEFAULT_PLANS[0]
        }
    
    plan = await db.subscription_plans.find_one({"plan_id": subscription["plan_id"]}, {"_id": 0})
    
    return {"subscription": subscription, "plan": plan}

@api_router.post("/subscriptions/create")
async def create_subscription(
    subscription_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Create a new subscription (initiate payment)"""
    user = await get_current_user(authorization, request)
    
    plan_id = subscription_data.get("plan_id")
    billing_cycle = subscription_data.get("billing_cycle", "monthly")
    
    # Get plan details
    plan = await db.subscription_plans.find_one({"plan_id": plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Check if user already has active subscription
    existing = await db.subscriptions.find_one(
        {"user_id": user["user_id"], "status": "active"}
    )
    
    if existing and existing.get("tier") != "free":
        raise HTTPException(status_code=400, detail="You already have an active subscription")
    
    # Calculate amount
    amount = plan["price_monthly"] if billing_cycle == "monthly" else plan["price_yearly"]
    
    # For free plan, activate immediately
    if plan["tier"] == "free":
        subscription = Subscription(
            user_id=user["user_id"],
            plan_id=plan_id,
            tier=plan["tier"],
            status="active",
            billing_cycle=billing_cycle
        )
        await db.subscriptions.insert_one(subscription.model_dump())
        return {"subscription": subscription.model_dump(), "requires_payment": False}
    
    # For paid plans, create pending subscription and payment
    subscription = Subscription(
        user_id=user["user_id"],
        plan_id=plan_id,
        tier=plan["tier"],
        status="pending",
        billing_cycle=billing_cycle
    )
    
    payment = Payment(
        user_id=user["user_id"],
        subscription_id=subscription.subscription_id,
        amount=amount,
        description=f"מנוי {plan['name_he']} - {billing_cycle}"
    )
    
    await db.subscriptions.insert_one(subscription.model_dump())
    await db.payments.insert_one(payment.model_dump())
    
    return {
        "subscription": subscription.model_dump(),
        "payment": payment.model_dump(),
        "requires_payment": True,
        "amount": amount,
        "currency": "ILS"
    }

@api_router.post("/subscriptions/cancel")
async def cancel_subscription(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Cancel current subscription"""
    user = await get_current_user(authorization, request)
    
    subscription = await db.subscriptions.find_one(
        {"user_id": user["user_id"], "status": "active"}
    )
    
    if not subscription or subscription.get("tier") == "free":
        raise HTTPException(status_code=400, detail="No active paid subscription to cancel")
    
    await db.subscriptions.update_one(
        {"subscription_id": subscription["subscription_id"]},
        {"$set": {
            "status": "cancelled",
            "cancelled_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Subscription cancelled successfully"}

@api_router.get("/payments/history")
async def get_payment_history(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Get user's payment history"""
    user = await get_current_user(authorization, request)
    
    payments = await db.payments.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return {"payments": payments}

# PayPal Integration (placeholder - requires API keys)
@api_router.post("/payments/paypal/create-order")
async def create_paypal_order(
    order_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Create PayPal order for subscription payment"""
    user = await get_current_user(authorization, request)
    
    payment_id = order_data.get("payment_id")
    
    payment = await db.payments.find_one({"payment_id": payment_id, "user_id": user["user_id"]})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # TODO: Implement actual PayPal order creation when API keys are available
    # For now, return mock order ID for testing
    mock_order_id = f"PAYPAL_ORDER_{uuid.uuid4().hex[:12]}"
    
    await db.payments.update_one(
        {"payment_id": payment_id},
        {"$set": {"paypal_order_id": mock_order_id}}
    )
    
    return {
        "order_id": mock_order_id,
        "status": "CREATED",
        "message": "PayPal integration pending - API keys required"
    }

@api_router.post("/payments/paypal/capture-order")
async def capture_paypal_order(
    capture_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Capture PayPal order after approval"""
    user = await get_current_user(authorization, request)
    
    order_id = capture_data.get("order_id")
    
    payment = await db.payments.find_one({"paypal_order_id": order_id, "user_id": user["user_id"]})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # TODO: Implement actual PayPal capture when API keys are available
    # For now, simulate successful capture for testing
    capture_id = f"CAPTURE_{uuid.uuid4().hex[:12]}"
    
    # Update payment status
    await db.payments.update_one(
        {"payment_id": payment["payment_id"]},
        {"$set": {
            "status": "completed",
            "paypal_capture_id": capture_id,
            "completed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Activate subscription
    if payment.get("subscription_id"):
        end_date = datetime.now(timezone.utc) + timedelta(days=30)  # Monthly
        await db.subscriptions.update_one(
            {"subscription_id": payment["subscription_id"]},
            {"$set": {
                "status": "active",
                "start_date": datetime.now(timezone.utc).isoformat(),
                "end_date": end_date.isoformat(),
                "next_billing_date": end_date.isoformat()
            }}
        )
    
    return {
        "status": "COMPLETED",
        "capture_id": capture_id,
        "message": "Payment completed successfully (test mode)"
    }

# ==================== ADMIN SUBSCRIPTIONS ====================

@api_router.get("/admin/subscriptions")
async def admin_get_subscriptions(
    authorization: Optional[str] = Header(None),
    request: Request = None,
    status: Optional[str] = None,
    tier: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """Admin: Get all subscriptions"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if status:
        query["status"] = status
    if tier:
        query["tier"] = tier
    
    subscriptions = await db.subscriptions.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.subscriptions.count_documents(query)
    
    # Enrich with user info
    for sub in subscriptions:
        user = await db.users.find_one({"user_id": sub["user_id"]}, {"_id": 0, "name": 1, "email": 1, "user_number": 1})
        sub["user_name"] = user.get("name") if user else "Unknown"
        sub["user_email"] = user.get("email") if user else ""
        sub["user_number"] = user.get("user_number") if user else ""
    
    # Get stats
    total_active = await db.subscriptions.count_documents({"status": "active"})
    total_pro = await db.subscriptions.count_documents({"tier": "pro", "status": "active"})
    total_premium = await db.subscriptions.count_documents({"tier": "premium", "status": "active"})
    
    return {
        "subscriptions": subscriptions,
        "total": total,
        "stats": {
            "total_active": total_active,
            "total_pro": total_pro,
            "total_premium": total_premium
        }
    }

@api_router.get("/admin/payments")
async def admin_get_payments(
    authorization: Optional[str] = Header(None),
    request: Request = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """Admin: Get all payments"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if status:
        query["status"] = status
    
    payments = await db.payments.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.payments.count_documents(query)
    
    # Enrich with user info
    for payment in payments:
        user = await db.users.find_one({"user_id": payment["user_id"]}, {"_id": 0, "name": 1, "email": 1})
        payment["user_name"] = user.get("name") if user else "Unknown"
        payment["user_email"] = user.get("email") if user else ""
    
    # Calculate totals
    completed_payments = await db.payments.find({"status": "completed"}, {"amount": 1}).to_list(10000)
    total_revenue = sum(p.get("amount", 0) for p in completed_payments)
    
    return {
        "payments": payments,
        "total": total,
        "total_revenue": total_revenue
    }

@api_router.put("/admin/subscriptions/{subscription_id}")
async def admin_update_subscription(
    subscription_id: str,
    subscription_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update subscription"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    allowed_fields = ["status", "tier", "end_date"]
    update_data = {k: v for k, v in subscription_data.items() if k in allowed_fields}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    result = await db.subscriptions.update_one(
        {"subscription_id": subscription_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    return {"message": "Subscription updated"}

@api_router.put("/admin/subscription-plans/{plan_id}")
async def admin_update_plan(
    plan_id: str,
    plan_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update subscription plan"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    allowed_fields = ["price_monthly", "price_yearly", "features", "max_services", "max_bookings_per_month", "is_active"]
    update_data = {k: v for k, v in plan_data.items() if k in allowed_fields}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    result = await db.subscription_plans.update_one(
        {"plan_id": plan_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    return {"message": "Plan updated"}

# ==================== PUSH NOTIFICATIONS ====================

@api_router.get("/push/vapid-public-key")
async def get_vapid_public_key():
    """Get VAPID public key for push notification subscription"""
    if not VAPID_PUBLIC_KEY:
        raise HTTPException(status_code=503, detail="Push notifications not configured")
    return {"publicKey": VAPID_PUBLIC_KEY}

@api_router.post("/push/subscribe")
async def subscribe_push_notifications(
    subscription_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Subscribe user to push notifications"""
    user = await get_current_user(authorization, request)
    
    push_subscription = {
        "user_id": user["user_id"],
        "endpoint": subscription_data.get("endpoint"),
        "keys": subscription_data.get("keys"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Upsert to avoid duplicates
    await db.push_subscriptions.update_one(
        {"user_id": user["user_id"], "endpoint": subscription_data.get("endpoint")},
        {"$set": push_subscription},
        upsert=True
    )
    
    return {"message": "Push subscription saved"}

@api_router.delete("/push/unsubscribe")
async def unsubscribe_push_notifications(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Unsubscribe user from push notifications"""
    user = await get_current_user(authorization, request)
    
    await db.push_subscriptions.delete_many({"user_id": user["user_id"]})
    
    return {"message": "Push subscription removed"}

@api_router.get("/push/preferences")
async def get_push_preferences(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Get user's notification preferences"""
    user = await get_current_user(authorization, request)
    
    preferences = await db.notification_preferences.find_one(
        {"user_id": user["user_id"]},
        {"_id": 0}
    )
    
    if not preferences:
        # Default preferences
        preferences = {
            "user_id": user["user_id"],
            "new_booking": True,
            "booking_confirmed": True,
            "booking_cancelled": True,
            "new_message": True,
            "provider_verified": True,
            "system_updates": True,
            "marketing": False
        }
    
    return preferences

@api_router.put("/push/preferences")
async def update_push_preferences(
    preferences_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Update user's notification preferences"""
    user = await get_current_user(authorization, request)
    
    allowed_fields = ["new_booking", "booking_confirmed", "booking_cancelled", 
                     "new_message", "provider_verified", "system_updates", "marketing"]
    update_data = {k: v for k, v in preferences_data.items() if k in allowed_fields}
    update_data["user_id"] = user["user_id"]
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.notification_preferences.update_one(
        {"user_id": user["user_id"]},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "Preferences updated"}

@api_router.post("/admin/push/send")
async def admin_send_push_notification(
    notification_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Send push notification to users"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    title = notification_data.get("title", "")
    body = notification_data.get("body", "")
    target = notification_data.get("target", "all")  # all, providers, users, specific
    user_ids = notification_data.get("user_ids", [])
    icon = notification_data.get("icon", "/logo192.png")
    
    # Build query for target users
    query = {}
    if target == "providers":
        query["role"] = "provider"
    elif target == "users":
        query["role"] = {"$in": ["patient", "user"]}
    elif target == "specific":
        query["user_id"] = {"$in": user_ids}
    
    # Get users matching criteria
    users = await db.users.find(query, {"user_id": 1}).to_list(10000)
    user_ids_to_notify = [u["user_id"] for u in users]
    
    # Get push subscriptions for these users
    subscriptions = await db.push_subscriptions.find(
        {"user_id": {"$in": user_ids_to_notify}},
        {"_id": 0}
    ).to_list(10000)
    
    # Send actual push notifications
    success_count = 0
    failed_count = 0
    
    for sub in subscriptions:
        subscription_info = {
            "endpoint": sub.get("endpoint"),
            "keys": sub.get("keys")
        }
        try:
            if await send_push_notification(
                subscription_info, 
                title, 
                body, 
                {"from_admin": True, "target": target},
                icon
            ):
                success_count += 1
            else:
                failed_count += 1
        except Exception as e:
            logger.error(f"Error sending push to subscription: {e}")
            failed_count += 1
    
    # Create notification record
    notification_record = {
        "notification_id": f"push_{uuid.uuid4().hex[:12]}",
        "title": title,
        "body": body,
        "target": target,
        "recipients_count": len(subscriptions),
        "success_count": success_count,
        "failed_count": failed_count,
        "sent_by": admin["user_id"],
        "sent_at": datetime.now(timezone.utc).isoformat()
    }
    await db.push_notifications_sent.insert_one(notification_record)
    
    # Also create in-app notifications for these users
    for user_id in user_ids_to_notify:
        await create_notification(
            user_id,
            "system_announcement",
            title,
            body,
            {"from_admin": True, "push_notification": True}
        )
    
    return {
        "message": f"Notification sent: {success_count} success, {failed_count} failed",
        "notification_id": notification_record["notification_id"],
        "success_count": success_count,
        "failed_count": failed_count,
        "total_subscriptions": len(subscriptions)
    }

@api_router.get("/admin/push/history")
async def admin_get_push_history(
    authorization: Optional[str] = Header(None),
    request: Request = None,
    skip: int = 0,
    limit: int = 50
):
    """Admin: Get push notification history"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    history = await db.push_notifications_sent.find(
        {},
        {"_id": 0}
    ).sort("sent_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.push_notifications_sent.count_documents({})
    
    return {"history": history, "total": total}

# ==================== FILE UPLOAD ====================

@api_router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Upload a file and return its URL"""
    user = await get_current_user(authorization, request)
    
    # Validate file type
    allowed_types = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    content_type = file.content_type
    if content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    # Validate file size (10MB max)
    max_size = 10 * 1024 * 1024
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    
    # Generate unique filename
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'bin'
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Generate URL
    base_url = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
    file_url = f"{base_url}/api/files/{unique_filename}"
    
    return {
        "url": file_url,
        "filename": unique_filename,
        "original_name": file.filename,
        "size": len(content)
    }

@api_router.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Upload an image file (for profile pictures)"""
    user = await get_current_user(authorization, request)
    
    # Validate file type - images only
    allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    content_type = file.content_type
    if content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only image files are allowed (JPEG, PNG, WebP, GIF)")
    
    # Validate file size (5MB max for images)
    max_size = 5 * 1024 * 1024
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail="Image too large (max 5MB)")
    
    # Generate unique filename
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    unique_filename = f"img_{uuid.uuid4().hex}.{ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Generate URL
    base_url = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
    file_url = f"{base_url}/api/files/{unique_filename}"
    
    return {
        "url": file_url,
        "filename": unique_filename,
        "original_name": file.filename,
        "size": len(content)
    }

@api_router.get("/files/{filename}")
async def get_file(filename: str):
    """Serve uploaded files"""
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Determine content type
    ext = filename.split('.')[-1].lower()
    content_types = {
        'pdf': 'application/pdf',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp'
    }
    content_type = content_types.get(ext, 'application/octet-stream')
    
    with open(file_path, "rb") as f:
        content = f.read()
    
    return Response(content=content, media_type=content_type)


# ==================== CONTACT FORM ====================

@api_router.post("/contact")
async def submit_contact_form(contact_data: dict):
    """Handle contact form submissions"""
    name = contact_data.get("name", "")
    email = contact_data.get("email", "")
    phone = contact_data.get("phone", "")
    subject = contact_data.get("subject", "")
    message = contact_data.get("message", "")
    
    if not name or not email or not message:
        raise HTTPException(status_code=400, detail="Name, email and message are required")
    
    # Save to database
    contact_record = {
        "contact_id": f"contact_{uuid.uuid4().hex[:12]}",
        "name": name,
        "email": email,
        "phone": phone,
        "subject": subject,
        "message": message,
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.contact_messages.insert_one(contact_record)
    
    # Notify admins
    admins = await db.users.find({"role": "admin"}, {"user_id": 1, "email": 1}).to_list(10)
    for admin in admins:
        await create_notification(
            admin["user_id"],
            "contact_form",
            "הודעה חדשה מטופס יצירת קשר",
            f"התקבלה הודעה מ-{name} בנושא: {subject}",
            {"contact_id": contact_record["contact_id"]}
        )
    
    # Send confirmation email to user
    await send_email_async(
        email,
        "קיבלנו את הפנייה שלך - CareLink",
        f"""
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #19B8BA;">תודה שפנית אלינו!</h2>
            <p>שלום {name},</p>
            <p>קיבלנו את הפנייה שלך ונחזור אליך בהקדם האפשרי.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <strong>נושא הפנייה:</strong> {subject}<br>
                <strong>ההודעה שלך:</strong><br>
                {message}
            </div>
            <p>בברכה,<br>צוות CareLink</p>
        </div>
        """
    )
    
    return {"message": "Contact form submitted successfully", "contact_id": contact_record["contact_id"]}



# Include the router in the main app
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
