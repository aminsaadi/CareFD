from fastapi import FastAPI, APIRouter, HTTPException, Header, Response, Request, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
import secrets
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
from jose import jwt
import httpx
import asyncio
import shutil
import json
from pywebpush import webpush, WebPushException
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

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

import certifi

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(
    mongo_url, 
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=30000,
    tls=True
)
db = client[os.environ['DB_NAME']]

# Configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'carelink.co.il@gmail.com')

# SMTP Configuration
SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')

# VAPID Configuration for Push Notifications
VAPID_PUBLIC_KEY = os.environ.get('VAPID_PUBLIC_KEY', '')
VAPID_PRIVATE_KEY = os.environ.get('VAPID_PRIVATE_KEY', '')
VAPID_CLAIMS_EMAIL = os.environ.get('VAPID_CLAIMS_EMAIL', 'admin@carelink.co.il')

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

# Log SMTP configuration status
if SMTP_USER and SMTP_PASSWORD:
    logger.info(f"SMTP configured with user: {SMTP_USER}")
else:
    logger.warning("SMTP not fully configured - emails will not be sent")

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
    # Verification fields for users
    verification_status: str = "none"  # none, pending, approved, rejected
    verification_documents: List[dict] = []
    verification_notes: Optional[str] = None
    verification_submitted_at: Optional[datetime] = None

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
    name: str  # Free, Pro, Gold
    name_he: str  # חינם, פרו, זהב
    tier: str  # free, pro, gold
    price_monthly: float  # 0, 59, 149
    price_yearly: float  # 0, 600, 0 (gold no yearly)
    currency: str = "ILS"
    features: dict = {}  # detailed feature flags
    features_list: List[str] = []  # human-readable features
    max_services: int = 1  # -1 for unlimited
    max_bookings_per_month: int = 10  # -1 for unlimited
    max_clinics: int = 0  # 0 = not allowed, -1 = unlimited
    max_team_members: int = 0  # 0 = not allowed, -1 = unlimited
    has_promoted_profile: bool = False
    has_recommended_badge: bool = False
    has_team_management: bool = False
    has_chat_contact: bool = True
    has_phone_contact: bool = True
    has_whatsapp_contact: bool = True
    has_clinic_management: bool = False
    has_product_shipping: bool = True
    has_priority_support: bool = False
    has_staff_support: bool = False
    analytics_access: bool = False
    is_active: bool = True
    sort_order: int = 0
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
    """Service delivery type - where is the service provided"""
    HOME_VISIT = "home_visit"       # בבית
    HOSPITAL = "hospital"           # בבית חולים / מוסד
    CLINIC = "clinic"               # בקליניקה
    VIRTUAL = "virtual"             # וירטואלי - טלפון/וידיאו

class ServiceCategory:
    """Service category - what kind of service"""
    VISIT = "visit"                 # שירות ביקור
    HOURLY = "hourly"               # שירות שעתי
    CONSULTATION = "consultation"   # שירות ייעוץ
    PRODUCT = "product"             # שירות מוצר

class PricingType:
    FIXED = "fixed"                 # מחיר קבוע
    PER_HOUR = "per_hour"           # לפי שעה
    PER_VISIT = "per_visit"         # לפי ביקור
    PER_UNIT = "per_unit"           # לפי יחידה (מוצר)

class WeekendPricingType:
    NONE = "none"                   # אין תוספת
    PERCENTAGE = "percentage"       # תוספת באחוזים
    FIXED = "fixed"                 # תוספת קבועה

class Service(BaseModel):
    model_config = ConfigDict(extra="ignore")
    service_id: str = Field(default_factory=lambda: f"service_{uuid.uuid4().hex[:12]}")
    service_number: str = Field(default_factory=lambda: f"S{uuid.uuid4().hex[:8].upper()}")  # מספר שירות
    provider_id: str
    name: str
    description: str
    
    # Service classification
    service_category: str = ServiceCategory.VISIT  # visit, hourly, consultation, product
    delivery_types: List[str] = []  # home_visit, hospital, clinic, virtual
    
    # Pricing
    pricing_type: str = PricingType.FIXED
    price: float
    currency: str = "ILS"
    
    # Hourly service specific
    minimum_hours: Optional[float] = None
    
    # Duration
    duration_minutes: Optional[int] = None
    
    # Weekend/Shabbat pricing
    weekend_pricing_type: str = WeekendPricingType.NONE
    weekend_price_addition: Optional[float] = None  # percentage or fixed amount
    
    # Travel cost
    has_travel_cost: bool = False
    travel_cost: Optional[float] = None
    travel_cost_per_km: Optional[float] = None  # Or per km
    
    # Product specific
    has_shipping: bool = False
    shipping_cost: Optional[float] = None
    free_shipping_above: Optional[float] = None  # Free shipping for orders above this amount
    
    # Stock (for products)
    stock_quantity: Optional[int] = None
    
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ServiceCreate(BaseModel):
    name: str
    description: str
    service_category: str = ServiceCategory.VISIT
    delivery_types: List[str] = []
    pricing_type: str = PricingType.FIXED
    price: float
    minimum_hours: Optional[float] = None
    duration_minutes: Optional[int] = None
    weekend_pricing_type: str = WeekendPricingType.NONE
    weekend_price_addition: Optional[float] = None
    has_travel_cost: bool = False
    travel_cost: Optional[float] = None
    travel_cost_per_km: Optional[float] = None
    has_shipping: bool = False
    shipping_cost: Optional[float] = None
    free_shipping_above: Optional[float] = None
    stock_quantity: Optional[int] = None

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
    PENDING = "pending"           # ממתינה לאישור
    CONFIRMED = "confirmed"       # מאושרת
    IN_PROGRESS = "in_progress"   # בביצוע
    PROVIDER_COMPLETED = "provider_completed"  # הספק סיים
    COMPLETED = "completed"       # הושלמה
    CANCELLED = "cancelled"       # בוטלה
    REJECTED = "rejected"         # נדחתה
    ON_HOLD = "on_hold"          # בהשהיה

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
    booking_number: str = Field(default_factory=lambda: f"B{uuid.uuid4().hex[:8].upper()}")  # מספר הזמנה
    user_id: str
    provider_id: str
    service_id: str
    booking_date: datetime
    booking_time: Optional[str] = None  # "09:00"
    status: str = BookingStatus.PENDING
    
    # Service details snapshot
    service_name: Optional[str] = None
    service_category: Optional[str] = None  # visit, hourly, consultation, product
    delivery_type: Optional[str] = None  # home_visit, hospital, clinic, virtual
    
    # Client details (requester)
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    client_email: Optional[str] = None
    
    # Contact person (can be different from requester)
    contact_person: Optional[ContactPerson] = None
    is_contact_same_as_requester: bool = True
    
    # Service location
    service_location: Optional[ServiceLocation] = None
    
    # For products - shipping address
    shipping_address: Optional[ServiceLocation] = None
    
    # Duration (for hourly services)
    hours_booked: Optional[float] = None
    
    # Additional info
    notes: Optional[str] = None
    special_requirements: Optional[str] = None
    
    # Pricing breakdown
    base_price: Optional[float] = None
    travel_cost: Optional[float] = None
    weekend_addition: Optional[float] = None
    shipping_cost: Optional[float] = None
    final_price: Optional[float] = None
    payment_notes: Optional[str] = None
    
    # Status timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    confirmed_at: Optional[datetime] = None
    provider_completed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    
    # Display names
    provider_name: Optional[str] = None
    user_name: Optional[str] = None
    
    # Guest booking flag
    is_guest_booking: bool = False

class BookingCreate(BaseModel):
    service_id: str
    booking_date: Optional[datetime] = None
    booking_time: Optional[str] = None
    delivery_type: Optional[str] = None  # home_visit, hospital, clinic, virtual
    
    # Client details
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    client_email: Optional[str] = None
    
    # Contact person (if different from requester)
    is_contact_same_as_requester: bool = True
    contact_person_name: Optional[str] = None
    contact_person_phone: Optional[str] = None
    contact_person_relationship: Optional[str] = None  # self, family, caregiver, friend
    
    # Service location
    service_address: Optional[str] = None
    service_city: Optional[str] = None
    service_floor: Optional[str] = None
    service_apartment: Optional[str] = None
    service_entry_code: Optional[str] = None
    service_notes: Optional[str] = None
    service_latitude: Optional[float] = None
    service_longitude: Optional[float] = None
    
    # For products - shipping address
    shipping_address: Optional[str] = None
    shipping_city: Optional[str] = None
    shipping_postal_code: Optional[str] = None
    
    # Duration (for hourly services)
    hours_booked: Optional[float] = None
    
    # Notes
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
    # Admin approval
    status: str = "pending"  # pending, approved, rejected
    admin_notes: Optional[str] = None
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None

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

def send_email_smtp(recipient: str, subject: str, html_content: str):
    """Send email using SMTP (synchronous)"""
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("SMTP not configured, skipping email")
        return None
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = SENDER_EMAIL
        msg['To'] = recipient
        
        # Attach HTML content
        html_part = MIMEText(html_content, 'html', 'utf-8')
        msg.attach(html_part)
        
        # Connect and send
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SENDER_EMAIL, recipient, msg.as_string())
        
        logger.info(f"Email sent successfully to {recipient}")
        return {"success": True, "recipient": recipient}
    except Exception as e:
        logger.error(f"Failed to send email to {recipient}: {str(e)}")
        return None

async def send_email_async(recipient: str, subject: str, html_content: str):
    """Send email using SMTP (async wrapper)"""
    try:
        result = await asyncio.to_thread(send_email_smtp, recipient, subject, html_content)
        return result
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return None

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
        admins = await db.users.find({"role": "admin"}, {"_id": 0, "user_id": 1, "email": 1}).to_list(100)
        for admin in admins:
            # In-app notification
            await create_notification(
                admin["user_id"],
                NotificationType.PROVIDER_NEW_REGISTRATION,
                "ספק חדש נרשם!",
                f"ספק חדש נרשם למערכת: {user.name}. נדרש אימות.",
                {"provider_id": provider.provider_id, "user_id": user.user_id}
            )
            # Email notification to admin
            admin_link = f"https://carelink.co.il/admin/verification"
            await send_email_async(
                admin.get("email"),
                f"🆕 ספק חדש נרשם: {user.name}",
                f"""
                <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #1E4D5F;">ספק חדש נרשם!</h1>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                        <h3 style="color: #19B8BA; margin-top: 0;">פרטי הספק:</h3>
                        <p><strong>שם:</strong> {user.name}</p>
                        <p><strong>אימייל:</strong> {user.email}</p>
                        <p><strong>מספר ספק:</strong> {provider.provider_number}</p>
                        <p><strong>תאריך הרשמה:</strong> {datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M')}</p>
                    </div>
                    
                    <p style="font-size: 16px; color: #4C6D7F;">
                        נדרש אימות לפני שהספק יוכל להציע שירותים בפלטפורמה.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{admin_link}" style="background-color: #19B8BA; color: white; padding: 15px 40px; text-decoration: none; border-radius: 30px; font-size: 18px; font-weight: bold; display: inline-block;">
                            עבור לאימות ספקים ➜
                        </a>
                    </div>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #888;">
                        <p>מערכת CareLink</p>
                    </div>
                </div>
                """
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

@api_router.post("/auth/forgot-password")
async def forgot_password(data: dict):
    """Send password reset email"""
    email = data.get("email", "").lower().strip()
    
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    # Find user by email
    user = await db.users.find_one({"email": email})
    
    # Always return success to prevent email enumeration
    if not user:
        return {"message": "If the email exists, a reset link has been sent"}
    
    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    # Store reset token
    await db.password_resets.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "user_id": user["user_id"],
            "token": reset_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    # In production, send email here
    # For now, log the reset link
    frontend_url = os.environ.get('FRONTEND_URL', os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:3000'))
    if '/api' in frontend_url:
        frontend_url = frontend_url.replace('/api', '')
    reset_url = f"{frontend_url}/reset-password?token={reset_token}"
    print(f"Password reset link for {email}: {reset_url}")
    
    # Send password reset email
    await send_email_async(
        email,
        "איפוס סיסמה - CareLink",
        f"""
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #19B8BA;">איפוס סיסמה</h1>
            </div>
            
            <p style="font-size: 16px; color: #1E4D5F;">שלום {user.get('name', 'משתמש')},</p>
            
            <p style="font-size: 16px; color: #4C6D7F;">
                קיבלנו בקשה לאיפוס הסיסמה שלך. לחץ על הכפתור למטה כדי לבחור סיסמה חדשה:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_url}" style="background-color: #19B8BA; color: white; padding: 15px 40px; text-decoration: none; border-radius: 30px; font-size: 18px; font-weight: bold; display: inline-block;">
                    איפוס סיסמה ➜
                </a>
            </div>
            
            <p style="font-size: 14px; color: #888;">
                הקישור תקף לשעה אחת בלבד.<br>
                אם לא ביקשת לאפס את הסיסמה, ניתן להתעלם מהודעה זו.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #888;">
                <p>צוות CareLink</p>
            </div>
        </div>
        """
    )
    
    return {"message": "If the email exists, a reset link has been sent"}

@api_router.get("/auth/reset-password/validate")
async def validate_reset_token(token: str):
    """Validate password reset token"""
    if not token:
        raise HTTPException(status_code=400, detail="Token is required")
    
    reset_doc = await db.password_resets.find_one({"token": token})
    
    if not reset_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    # Check if token is expired
    expires_at = datetime.fromisoformat(reset_doc["expires_at"].replace('Z', '+00:00'))
    if datetime.now(timezone.utc) > expires_at:
        await db.password_resets.delete_one({"token": token})
        raise HTTPException(status_code=400, detail="Token has expired")
    
    return {"valid": True}

@api_router.post("/auth/reset-password")
async def reset_password(data: dict):
    """Reset password with token"""
    token = data.get("token")
    new_password = data.get("new_password")
    
    if not token or not new_password:
        raise HTTPException(status_code=400, detail="Token and new password are required")
    
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Find reset request
    reset_doc = await db.password_resets.find_one({"token": token})
    
    if not reset_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    # Check if token is expired
    expires_at = datetime.fromisoformat(reset_doc["expires_at"].replace('Z', '+00:00'))
    if datetime.now(timezone.utc) > expires_at:
        await db.password_resets.delete_one({"token": token})
        raise HTTPException(status_code=400, detail="Token has expired")
    
    # Hash new password
    password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Update user password
    await db.users.update_one(
        {"user_id": reset_doc["user_id"]},
        {"$set": {
            "password_hash": password_hash,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Delete reset token
    await db.password_resets.delete_one({"token": token})
    
    # Invalidate all sessions for this user
    await db.user_sessions.delete_many({"user_id": reset_doc["user_id"]})
    
    return {"message": "Password reset successfully"}

@api_router.put("/users/me")
async def update_user_info(
    user_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Update current user's personal info"""
    user = await get_current_user(authorization, request)
    
    allowed_fields = [
        "first_name", "last_name", "phone", "address", "city", 
        "profile_image", "date_of_birth", "gender"
    ]
    update_data = {}
    
    for field in allowed_fields:
        if field in user_data:
            update_data[field] = user_data[field]
    
    # Handle full name update
    if "first_name" in update_data or "last_name" in update_data:
        first = update_data.get("first_name") or user.get("first_name", "")
        last = update_data.get("last_name") or user.get("last_name", "")
        update_data["name"] = f"{first} {last}".strip()
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": update_data}
    )
    
    # Get updated user
    updated_user = await db.users.find_one(
        {"user_id": user["user_id"]},
        {"_id": 0, "password": 0}
    )
    
    return {"message": "User info updated successfully", "user": updated_user}

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
    if not verify_password(current_password, db_user.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="הסיסמה הנוכחית שגויה")
    
    # Hash and update new password
    hashed_password = hash_password(new_password)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "password_hash": hashed_password,
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
    
    # Check subscription service limit
    tier = provider.get("subscription_tier", "free")
    plan = await db.subscription_plans.find_one({"tier": tier}, {"_id": 0})
    if not plan:
        plan = DEFAULT_PLANS[0]
    max_services = plan.get("max_services", 1)
    if max_services != -1:
        current_count = await db.services.count_documents({"provider_id": provider["provider_id"]})
        if current_count >= max_services:
            raise HTTPException(
                status_code=403,
                detail=f"הגעת למגבלת השירותים במנוי שלך ({max_services}). שדרג את המנוי כדי להוסיף שירותים נוספים."
            )
    
    service = Service(
        provider_id=provider["provider_id"],
        **service_data.model_dump()
    )
    
    service_dict = service.model_dump()
    service_dict['created_at'] = service_dict['created_at'].isoformat()
    service_dict['updated_at'] = service_dict['updated_at'].isoformat()
    
    await db.services.insert_one(service_dict)
    if "_id" in service_dict:
        del service_dict["_id"]
    
    return service_dict

@api_router.put("/services/{service_id}")
async def update_service(
    service_id: str,
    service_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Update a service"""
    user = await get_current_user(authorization, request)
    
    # Get service
    service = await db.services.find_one({"service_id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Get provider and verify ownership
    provider = await db.providers.find_one({"provider_id": service["provider_id"]}, {"_id": 0})
    if not provider or provider["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Build update data
    allowed_fields = [
        "name", "description", "service_category", "delivery_types",
        "pricing_type", "price", "minimum_hours", "duration_minutes",
        "weekend_pricing_type", "weekend_price_addition",
        "has_travel_cost", "travel_cost", "travel_cost_per_km",
        "has_shipping", "shipping_cost", "free_shipping_above",
        "stock_quantity", "is_active"
    ]
    update_data = {k: v for k, v in service_data.items() if k in allowed_fields}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.services.update_one(
        {"service_id": service_id},
        {"$set": update_data}
    )
    
    return {"message": "Service updated successfully"}

@api_router.delete("/services/{service_id}")
async def delete_service(
    service_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Delete a service (provider-level)"""
    user = await get_current_user(authorization, request)
    
    # Get service
    service = await db.services.find_one({"service_id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Get provider and verify ownership
    provider = await db.providers.find_one({"provider_id": service["provider_id"]}, {"_id": 0})
    if not provider or provider["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Delete the service
    result = await db.services.delete_one({"service_id": service_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return {"message": "Service deleted successfully"}

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
    
    # Check for conflicts (only when date is provided)
    if booking_data.booking_date:
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
    
    # Calculate pricing
    base_price = service.get("price", 0)
    hours_booked = booking_data.hours_booked
    travel_cost = 0
    weekend_addition = 0
    shipping_cost = 0
    
    # For hourly services, multiply by hours
    if service.get("service_category") == "hourly" and hours_booked:
        min_hours = service.get("minimum_hours", 1) or 1
        actual_hours = max(hours_booked, min_hours)
        base_price = base_price * actual_hours
    
    # Check if booking is on weekend (Friday after 14:00 or Saturday)
    is_weekend = False
    if booking_data.booking_date:
        booking_day = booking_data.booking_date.weekday()  # 4 = Friday, 5 = Saturday
        is_weekend = booking_day == 5 or (booking_day == 4 and booking_data.booking_time and booking_data.booking_time >= "14:00")
    
    if is_weekend and service.get("weekend_pricing_type", "none") != "none":
        weekend_pricing_type = service.get("weekend_pricing_type")
        weekend_price_addition = service.get("weekend_price_addition", 0) or 0
        
        if weekend_pricing_type == "percentage":
            weekend_addition = base_price * (weekend_price_addition / 100)
        elif weekend_pricing_type == "fixed":
            weekend_addition = weekend_price_addition
    
    # Travel cost
    if service.get("has_travel_cost") and booking_data.delivery_type == "home_visit":
        travel_cost = service.get("travel_cost", 0) or 0
    
    # Shipping cost (for products)
    if service.get("service_category") == "product" and service.get("has_shipping"):
        free_shipping_above = service.get("free_shipping_above", 0)
        if free_shipping_above and base_price >= free_shipping_above:
            shipping_cost = 0
        else:
            shipping_cost = service.get("shipping_cost", 0) or 0
    
    final_price = base_price + travel_cost + weekend_addition + shipping_cost
    
    # Build shipping address (for products)
    shipping_address = None
    if booking_data.shipping_address:
        shipping_address = ServiceLocation(
            address=booking_data.shipping_address,
            city=booking_data.shipping_city or "",
            notes=booking_data.shipping_postal_code
        )
    
    booking = Booking(
        user_id=user_id,
        provider_id=service["provider_id"],
        service_id=booking_data.service_id,
        booking_date=booking_data.booking_date,
        booking_time=booking_data.booking_time,
        service_name=service.get("name"),
        service_category=service.get("service_category"),
        delivery_type=booking_data.delivery_type,
        client_name=client_name,
        client_phone=client_phone,
        client_email=client_email,
        contact_person=contact_person,
        is_contact_same_as_requester=booking_data.is_contact_same_as_requester,
        service_location=service_location,
        shipping_address=shipping_address,
        hours_booked=hours_booked,
        notes=booking_data.notes,
        special_requirements=booking_data.special_requirements,
        base_price=service.get("price", 0),
        travel_cost=travel_cost if travel_cost > 0 else None,
        weekend_addition=weekend_addition if weekend_addition > 0 else None,
        shipping_cost=shipping_cost if shipping_cost > 0 else None,
        final_price=final_price,
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
    if booking_dict.get('shipping_address'):
        booking_dict['shipping_address'] = dict(booking_dict['shipping_address'])
    
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
    
    # Format booking date nicely
    booking_date_formatted = booking_data.booking_date.strftime('%d/%m/%Y')
    booking_time_str = booking_data.booking_time or "יתואם טלפונית"
    
    # Send notification email to provider
    provider_user = await db.users.find_one({"user_id": provider["user_id"]}, {"_id": 0})
    if provider_user:
        await send_email_async(
            provider_user.get("email"),
            f"CareLink - הזמנה חדשה #{booking.booking_number}",
            f"""
            <!DOCTYPE html>
            <html dir="rtl" lang="he">
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #00a99d, #0d5c63); color: white; padding: 30px; border-radius: 15px 15px 0 0; text-align: center;">
                    <h1 style="margin: 0;">הזמנה חדשה!</h1>
                    <p style="margin: 10px 0 0;">מספר הזמנה: {booking.booking_number}</p>
                </div>
                
                <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 15px 15px;">
                    <h2 style="color: #0d5c63; border-bottom: 2px solid #00a99d; padding-bottom: 10px;">פרטי ההזמנה</h2>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr><td style="padding: 10px 0; color: #666;">לקוח:</td><td style="padding: 10px 0; font-weight: bold;">{client_name}</td></tr>
                        <tr><td style="padding: 10px 0; color: #666;">טלפון:</td><td style="padding: 10px 0;">{client_phone or 'לא צוין'}</td></tr>
                        <tr><td style="padding: 10px 0; color: #666;">שירות:</td><td style="padding: 10px 0; font-weight: bold;">{service.get('name', 'שירות')}</td></tr>
                        <tr><td style="padding: 10px 0; color: #666;">תאריך:</td><td style="padding: 10px 0;">{booking_date_formatted}</td></tr>
                        <tr><td style="padding: 10px 0; color: #666;">שעה:</td><td style="padding: 10px 0;">{booking_time_str}</td></tr>
                        <tr><td style="padding: 10px 0; color: #666;">כתובת:</td><td style="padding: 10px 0;">{booking_data.service_address or booking_data.guest_address or 'לא צוין'}, {booking_data.service_city or ''}</td></tr>
                    </table>
                    
                    <div style="background: #fff3cd; padding: 15px; border-radius: 10px; margin: 20px 0;">
                        <strong>⚠️ סטטוס:</strong> ממתינה לאישורך
                    </div>
                    
                    <h3 style="color: #0d5c63;">סיכום מחירים</h3>
                    <table style="width: 100%; border-collapse: collapse; background: white; padding: 15px; border-radius: 10px;">
                        <tr><td style="padding: 8px 0;">מחיר בסיס:</td><td style="text-align: left;">₪{service.get('price', 0)}</td></tr>
                        {'<tr><td style="padding: 8px 0;">תוספת נסיעות:</td><td style="text-align: left;">₪' + str(travel_cost) + '</td></tr>' if travel_cost > 0 else ''}
                        {'<tr><td style="padding: 8px 0;">תוספת סופ"ש:</td><td style="text-align: left;">₪' + str(weekend_addition) + '</td></tr>' if weekend_addition > 0 else ''}
                        <tr style="border-top: 2px solid #00a99d;"><td style="padding: 10px 0; font-weight: bold;">סה"כ:</td><td style="text-align: left; font-weight: bold; color: #00a99d; font-size: 18px;">₪{final_price}</td></tr>
                    </table>
                    
                    {f'<div style="background: #e8f5f3; padding: 15px; border-radius: 10px; margin-top: 20px;"><strong>הערות:</strong> {booking_data.notes}</div>' if booking_data.notes else ''}
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="https://carelink.co.il/provider/dashboard" style="background: #00a99d; color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">אשר את ההזמנה</a>
                    </div>
                </div>
            </body>
            </html>
            """
        )
    
    # Send confirmation email to client
    client_email_to_send = client_email or (user.get("email") if user else None)
    if client_email_to_send:
        await send_email_async(
            client_email_to_send,
            f"CareLink - אישור קבלת הזמנה #{booking.booking_number}",
            f"""
            <!DOCTYPE html>
            <html dir="rtl" lang="he">
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #00a99d, #0d5c63); color: white; padding: 30px; border-radius: 15px 15px 0 0; text-align: center;">
                    <h1 style="margin: 0;">ההזמנה נשלחה בהצלחה!</h1>
                    <p style="margin: 10px 0 0;">מספר הזמנה: {booking.booking_number}</p>
                </div>
                
                <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 15px 15px;">
                    <div style="background: #d4edda; padding: 15px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
                        <span style="font-size: 30px;">✅</span>
                        <p style="margin: 10px 0 0; font-weight: bold; color: #155724;">ההזמנה התקבלה וממתינה לאישור הספק</p>
                    </div>
                    
                    <h2 style="color: #0d5c63; border-bottom: 2px solid #00a99d; padding-bottom: 10px;">סיכום ההזמנה</h2>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr><td style="padding: 10px 0; color: #666;">שירות:</td><td style="padding: 10px 0; font-weight: bold;">{service.get('name', 'שירות')}</td></tr>
                        <tr><td style="padding: 10px 0; color: #666;">ספק:</td><td style="padding: 10px 0;">{provider.get('business_name', 'ספק')}</td></tr>
                        <tr><td style="padding: 10px 0; color: #666;">תאריך:</td><td style="padding: 10px 0;">{booking_date_formatted}</td></tr>
                        <tr><td style="padding: 10px 0; color: #666;">שעה:</td><td style="padding: 10px 0;">{booking_time_str}</td></tr>
                        {'<tr><td style="padding: 10px 0; color: #666;">כתובת:</td><td style="padding: 10px 0;">' + (booking_data.service_address or booking_data.guest_address or '') + ', ' + (booking_data.service_city or '') + '</td></tr>' if booking_data.service_address or booking_data.guest_address else ''}
                    </table>
                    
                    <h3 style="color: #0d5c63; margin-top: 20px;">פירוט עלויות</h3>
                    <div style="background: white; padding: 20px; border-radius: 10px; border: 1px solid #e0e0e0;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr><td style="padding: 8px 0;">מחיר בסיס:</td><td style="text-align: left;">₪{service.get('price', 0)}</td></tr>
                            {'<tr><td style="padding: 8px 0;">תוספת נסיעות:</td><td style="text-align: left;">₪' + str(travel_cost) + '</td></tr>' if travel_cost > 0 else ''}
                            {'<tr><td style="padding: 8px 0;">תוספת סופ"ש:</td><td style="text-align: left;">₪' + str(weekend_addition) + '</td></tr>' if weekend_addition > 0 else ''}
                            {'<tr><td style="padding: 8px 0;">דמי משלוח:</td><td style="text-align: left;">₪' + str(shipping_cost) + '</td></tr>' if shipping_cost > 0 else ''}
                        </table>
                        <div style="border-top: 2px solid #00a99d; margin-top: 15px; padding-top: 15px;">
                            <strong style="font-size: 18px;">סה"כ לתשלום: </strong>
                            <span style="font-size: 24px; color: #00a99d; font-weight: bold; float: left;">₪{final_price}</span>
                        </div>
                    </div>
                    
                    <div style="background: #e8f5f3; padding: 20px; border-radius: 10px; margin-top: 20px;">
                        <h4 style="margin: 0 0 10px; color: #0d5c63;">מה הלאה?</h4>
                        <p style="margin: 0; color: #666;">הספק יבדוק את ההזמנה ויאשר אותה בהקדם. נעדכן אותך במייל ובהתראה באפליקציה.</p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="https://carelink.co.il/dashboard" style="background: #00a99d; color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">צפה בהזמנות שלי</a>
                    </div>
                    
                    <p style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
                        יש שאלות? צרו קשר: support@carelink.co.il
                    </p>
                </div>
            </body>
            </html>
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
            # Send email to provider
            provider_user = await db.users.find_one({"user_id": target_provider["user_id"]}, {"_id": 0})
            if provider_user and provider_user.get("email"):
                client_user = await db.users.find_one({"user_id": booking["user_id"]}, {"_id": 0})
                await send_email_async(
                    provider_user["email"],
                    "CareLink - הזמנה בוטלה ❌",
                    f"""
                    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #e74c3c;">הזמנה בוטלה</h2>
                        <p>שלום {provider_user.get('name', 'ספק')},</p>
                        <p>הלקוח {client_user.get('name', 'לקוח') if client_user else 'לקוח'} ביטל את ההזמנה:</p>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin: 15px 0;">
                            <p><strong>שירות:</strong> {booking.get('service_name', 'שירות')}</p>
                            <p><strong>תאריך:</strong> {booking.get('booking_date', '')[:10]}</p>
                        </div>
                        <p>צוות CareLink</p>
                    </div>
                    """
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
        # Send email to client
        client_user = await db.users.find_one({"user_id": booking["user_id"]}, {"_id": 0})
        if client_user and client_user.get("email"):
            provider_info = await db.providers.find_one({"provider_id": booking["provider_id"]}, {"_id": 0})
            await send_email_async(
                client_user["email"],
                "CareLink - הזמנה בוטלה ❌",
                f"""
                <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #e74c3c;">הזמנה בוטלה</h2>
                    <p>שלום {client_user.get('name', 'לקוח')},</p>
                    <p>הספק {provider_info.get('business_name', 'ספק') if provider_info else 'ספק'} ביטל את ההזמנה:</p>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin: 15px 0;">
                        <p><strong>שירות:</strong> {booking.get('service_name', 'שירות')}</p>
                        <p><strong>תאריך:</strong> {booking.get('booking_date', '')[:10]}</p>
                    </div>
                    <p>מומלץ לחפש ספק חלופי.</p>
                    <p>צוות CareLink</p>
                </div>
                """
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
    
    # Send email to client about confirmed booking
    client_user = await db.users.find_one({"user_id": booking["user_id"]}, {"_id": 0})
    if client_user and client_user.get("email"):
        provider_info = await db.providers.find_one({"provider_id": booking["provider_id"]}, {"_id": 0})
        await send_email_async(
            client_user["email"],
            "CareLink - ההזמנה שלך אושרה! ✅",
            f"""
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #19B8BA;">ההזמנה אושרה! 🎉</h1>
                </div>
                
                <p style="font-size: 16px; color: #1E4D5F;">שלום {client_user.get('name', 'לקוח')},</p>
                
                <p style="font-size: 16px; color: #4C6D7F;">
                    הספק אישר את ההזמנה שלך!
                </p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h3 style="color: #19B8BA; margin-top: 0;">פרטי ההזמנה:</h3>
                    <p><strong>שירות:</strong> {booking.get('service_name', 'שירות')}</p>
                    <p><strong>ספק:</strong> {provider_info.get('business_name', 'ספק') if provider_info else 'ספק'}</p>
                    <p><strong>תאריך:</strong> {booking.get('booking_date', '')[:10]}</p>
                    <p><strong>שעה:</strong> {booking.get('booking_time', 'לא צוין')}</p>
                    <p><strong>כתובת:</strong> {booking.get('service_address', 'לא צוין')}, {booking.get('service_city', '')}</p>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #888;">
                    <p>צוות CareLink</p>
                </div>
            </div>
            """
        )
    
    return {"message": "Booking confirmed successfully"}

@api_router.put("/bookings/{booking_id}/reject")
async def reject_booking(
    booking_id: str,
    body: dict = None,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Reject a booking (provider only)"""
    user = await get_current_user(authorization, request)
    
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if user is the provider
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider or booking["provider_id"] != provider["provider_id"]:
        raise HTTPException(status_code=403, detail="Only provider can reject bookings")
    
    reason = body.get("reason", "") if body else ""
    
    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {
            "status": BookingStatus.REJECTED,
            "rejected_at": datetime.now(timezone.utc).isoformat(),
            "rejection_reason": reason
        }}
    )
    
    # Notify client
    await create_notification(
        booking["user_id"],
        NotificationType.BOOKING_CANCELLED,
        "ההזמנה נדחתה",
        f"לצערנו, הספק דחה את ההזמנה ל-{booking.get('service_name', 'שירות')}. {('סיבה: ' + reason) if reason else ''}",
        {"booking_id": booking_id}
    )
    
    # Send email to client
    client_user = await db.users.find_one({"user_id": booking["user_id"]}, {"_id": 0})
    if client_user and client_user.get("email"):
        await send_email_async(
            client_user["email"],
            "CareLink - ההזמנה נדחתה",
            f"""
            <!DOCTYPE html>
            <html dir="rtl" lang="he">
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #dc3545; color: white; padding: 30px; border-radius: 15px 15px 0 0; text-align: center;">
                    <h1 style="margin: 0;">ההזמנה נדחתה</h1>
                </div>
                <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 15px 15px;">
                    <p>שלום {client_user.get('name', 'לקוח')},</p>
                    <p>לצערנו, הספק דחה את ההזמנה שלך:</p>
                    <div style="background: white; padding: 15px; border-radius: 10px; margin: 15px 0;">
                        <p><strong>שירות:</strong> {booking.get('service_name', 'שירות')}</p>
                        <p><strong>תאריך:</strong> {booking.get('booking_date', '')[:10]}</p>
                        {f'<p><strong>סיבה:</strong> {reason}</p>' if reason else ''}
                    </div>
                    <p>מומלץ לחפש ספק חלופי באתר.</p>
                    <div style="text-align: center; margin-top: 20px;">
                        <a href="https://carelink.co.il/providers" style="background: #00a99d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">חפש ספק אחר</a>
                    </div>
                </div>
            </body>
            </html>
            """
        )
    
    return {"message": "Booking rejected successfully"}

@api_router.put("/bookings/{booking_id}/hold")
async def hold_booking(
    booking_id: str,
    body: dict = None,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Put a booking on hold (provider only)"""
    user = await get_current_user(authorization, request)
    
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if user is the provider
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider or booking["provider_id"] != provider["provider_id"]:
        raise HTTPException(status_code=403, detail="Only provider can put bookings on hold")
    
    reason = body.get("reason", "") if body else ""
    
    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {
            "status": BookingStatus.ON_HOLD,
            "on_hold_at": datetime.now(timezone.utc).isoformat(),
            "hold_reason": reason
        }}
    )
    
    # Notify client
    await create_notification(
        booking["user_id"],
        NotificationType.SYSTEM,
        "ההזמנה הושהתה",
        f"ההזמנה ל-{booking.get('service_name', 'שירות')} הושהתה. {('סיבה: ' + reason) if reason else ''}",
        {"booking_id": booking_id}
    )
    
    return {"message": "Booking put on hold successfully"}

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
    """Create a review - only allowed after booking is completed"""
    user = await get_current_user(authorization, request)
    
    # Check if booking_id is provided and if the booking is completed
    if review_data.booking_id:
        booking = await db.bookings.find_one({"booking_id": review_data.booking_id}, {"_id": 0})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Check if user is the booking owner
        if booking.get("user_id") != user["user_id"]:
            raise HTTPException(status_code=403, detail="You can only review your own bookings")
        
        # Check if booking is completed
        if booking.get("status") != BookingStatus.COMPLETED:
            raise HTTPException(status_code=400, detail="ניתן לכתוב חוות דעת רק לאחר השלמת ההזמנה")
        
        # Check if already reviewed
        existing_review = await db.reviews.find_one({
            "booking_id": review_data.booking_id,
            "user_id": user["user_id"]
        })
        if existing_review:
            raise HTTPException(status_code=400, detail="כבר כתבת חוות דעת להזמנה זו")
    
    review = Review(
        user_id=user["user_id"],
        status="pending",  # Requires admin approval
        **review_data.model_dump()
    )
    
    review_dict = review.model_dump()
    review_dict['created_at'] = review_dict['created_at'].isoformat()
    
    await db.reviews.insert_one(review_dict)
    
    # Mark booking as reviewed
    if review_data.booking_id:
        await db.bookings.update_one(
            {"booking_id": review_data.booking_id},
            {"$set": {"has_review": True, "review_id": review.review_id}}
        )
    
    # Notify admins about new review pending approval
    admins = await db.users.find({"role": "admin"}, {"_id": 0, "user_id": 1}).to_list(100)
    for admin in admins:
        await create_notification(
            admin["user_id"],
            NotificationType.SYSTEM,
            "חוות דעת חדשה ממתינה לאישור",
            f"משתמש {user.get('name', 'לקוח')} כתב חוות דעת חדשה",
            {"review_id": review.review_id, "provider_id": review_data.provider_id}
        )
    
    return {
        "message": "חוות הדעת נשלחה בהצלחה וממתינה לאישור מנהל",
        "review": review.model_dump()
    }

@api_router.get("/providers/{provider_id}/reviews")
async def get_provider_reviews(provider_id: str, skip: int = 0, limit: int = 20):
    """Get provider reviews - only approved reviews"""
    reviews = await db.reviews.find({
        "provider_id": provider_id,
        "status": "approved"  # Only show approved reviews
    }, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enhance with user info
    for review in reviews:
        user = await db.users.find_one({"user_id": review["user_id"]}, {"_id": 0, "password_hash": 0})
        if user:
            review["user"] = {
                "name": user.get("name"),
                "picture": user.get("picture")
            }
    
    return {"reviews": reviews}

@api_router.get("/reviews/my")
async def get_my_reviews(
    authorization: Optional[str] = Header(None),
    request: Request = None,
    skip: int = 0,
    limit: int = 50
):
    """Get current user's reviews"""
    user = await get_current_user(authorization, request)
    
    reviews = await db.reviews.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    
    # Enhance with provider info
    for review in reviews:
        provider = await db.providers.find_one(
            {"provider_id": review["provider_id"]},
            {"_id": 0, "business_name": 1, "profile_image": 1, "profession_title": 1}
        )
        if provider:
            review["provider"] = provider
    
    return {"reviews": reviews}

# ==================== ADMIN REVIEW MANAGEMENT ====================

@api_router.get("/admin/reviews")
async def admin_get_reviews(
    status: Optional[str] = None,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Get all reviews with optional status filter"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if status:
        query["status"] = status
    
    reviews = await db.reviews.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Enhance with user and provider info
    for review in reviews:
        user_info = await db.users.find_one({"user_id": review["user_id"]}, {"_id": 0, "name": 1, "email": 1})
        provider_info = await db.providers.find_one({"provider_id": review["provider_id"]}, {"_id": 0, "business_name": 1})
        review["user_info"] = user_info
        review["provider_info"] = provider_info
    
    return {"reviews": reviews}

@api_router.put("/admin/reviews/{review_id}/approve")
async def admin_approve_review(
    review_id: str,
    body: dict = None,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Approve a review"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    review = await db.reviews.find_one({"review_id": review_id}, {"_id": 0})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    await db.reviews.update_one(
        {"review_id": review_id},
        {"$set": {
            "status": "approved",
            "approved_at": datetime.now(timezone.utc).isoformat(),
            "approved_by": admin["user_id"],
            "admin_notes": body.get("notes", "") if body else ""
        }}
    )
    
    # Update provider rating with only approved reviews
    approved_reviews = await db.reviews.find({
        "provider_id": review["provider_id"],
        "status": "approved"
    }, {"_id": 0, "rating": 1}).to_list(1000)
    
    if approved_reviews:
        avg_rating = sum(r["rating"] for r in approved_reviews) / len(approved_reviews)
        await db.providers.update_one(
            {"provider_id": review["provider_id"]},
            {"$set": {
                "rating": round(avg_rating, 1),
                "total_reviews": len(approved_reviews)
            }}
        )
    
    # Notify user that review was approved
    await create_notification(
        review["user_id"],
        NotificationType.SYSTEM,
        "חוות הדעת שלך אושרה",
        "תודה! חוות הדעת שלך אושרה ומוצגת כעת באתר.",
        {"review_id": review_id, "provider_id": review["provider_id"]}
    )
    
    return {"message": "Review approved successfully"}

@api_router.put("/admin/reviews/{review_id}/reject")
async def admin_reject_review(
    review_id: str,
    body: dict = None,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Reject a review"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    reason = body.get("reason", "חוות הדעת לא עומדת בקריטריונים") if body else "חוות הדעת לא עומדת בקריטריונים"
    
    review = await db.reviews.find_one({"review_id": review_id}, {"_id": 0})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    await db.reviews.update_one(
        {"review_id": review_id},
        {"$set": {
            "status": "rejected",
            "rejected_at": datetime.now(timezone.utc).isoformat(),
            "rejected_by": admin["user_id"],
            "rejection_reason": reason
        }}
    )
    
    # Notify user
    await create_notification(
        review["user_id"],
        NotificationType.SYSTEM,
        "חוות הדעת נדחתה",
        f"חוות הדעת שלך נדחתה. סיבה: {reason}",
        {"review_id": review_id}
    )
    
    return {"message": "Review rejected successfully"}

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
    
    # Send notification to the other participant
    recipient_id = None
    sender_name = user.get("name", "משתמש")
    
    if sender_role == "provider":
        # Provider sent message -> notify user
        recipient_id = room["user_id"]
    else:
        # User sent message -> notify provider
        provider_doc = await db.providers.find_one({"provider_id": room["provider_id"]}, {"_id": 0})
        if provider_doc:
            recipient_id = provider_doc.get("user_id")
            sender_name = user.get("name", "לקוח")
    
    if recipient_id:
        await create_notification(
            recipient_id,
            "chat_message",
            "הודעה חדשה בצ'אט",
            f"{sender_name}: {message_data.content[:50]}{'...' if len(message_data.content) > 50 else ''}",
            {"room_id": message_data.room_id}
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

@api_router.put("/admin/users/{user_id}/password")
async def admin_reset_user_password(
    user_id: str,
    password_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Reset user password"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    new_password = password_data.get("new_password")
    if not new_password or len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Hash the new password
    password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": {
            "password_hash": password_hash,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Password updated successfully"}

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
    """Get all regions with cities"""
    regions = await db.regions.find({}, {"_id": 0}).to_list(100)
    
    # Return default regions if none exist - all cities in Israel
    if not regions:
        default_regions = [
            {
                "region_id": "north",
                "name": "צפון",
                "name_en": "North",
                "cities": [
                    {"name": "חיפה", "name_en": "Haifa", "lat": 32.7940, "lng": 34.9896},
                    {"name": "נהריה", "name_en": "Nahariya", "lat": 33.0072, "lng": 35.0942},
                    {"name": "עכו", "name_en": "Acre", "lat": 32.9279, "lng": 35.0756},
                    {"name": "כרמיאל", "name_en": "Karmiel", "lat": 32.9136, "lng": 35.2961},
                    {"name": "צפת", "name_en": "Safed", "lat": 32.9646, "lng": 35.4960},
                    {"name": "טבריה", "name_en": "Tiberias", "lat": 32.7922, "lng": 35.5312},
                    {"name": "קריית שמונה", "name_en": "Kiryat Shmona", "lat": 33.2075, "lng": 35.5697},
                    {"name": "נצרת", "name_en": "Nazareth", "lat": 32.6996, "lng": 35.3035},
                    {"name": "נצרת עילית", "name_en": "Nazareth Illit", "lat": 32.7260, "lng": 35.3280},
                    {"name": "עפולה", "name_en": "Afula", "lat": 32.6074, "lng": 35.2893},
                    {"name": "בית שאן", "name_en": "Beit She'an", "lat": 32.4975, "lng": 35.4965},
                    {"name": "קריית ביאליק", "name_en": "Kiryat Bialik", "lat": 32.8333, "lng": 35.0833},
                    {"name": "קריית מוצקין", "name_en": "Kiryat Motzkin", "lat": 32.8389, "lng": 35.0750},
                    {"name": "קריית ים", "name_en": "Kiryat Yam", "lat": 32.8500, "lng": 35.0667},
                    {"name": "קריית אתא", "name_en": "Kiryat Ata", "lat": 32.8000, "lng": 35.1000},
                    {"name": "יקנעם", "name_en": "Yokneam", "lat": 32.6594, "lng": 35.1086},
                    {"name": "מגדל העמק", "name_en": "Migdal HaEmek", "lat": 32.6744, "lng": 35.2406},
                    {"name": "מעלות-תרשיחא", "name_en": "Ma'alot-Tarshiha", "lat": 33.0167, "lng": 35.2667},
                    {"name": "שלומי", "name_en": "Shlomi", "lat": 33.0747, "lng": 35.1428}
                ]
            },
            {
                "region_id": "haifa",
                "name": "חיפה והקריות",
                "name_en": "Haifa Area",
                "cities": [
                    {"name": "חיפה", "name_en": "Haifa", "lat": 32.7940, "lng": 34.9896},
                    {"name": "קריית ביאליק", "name_en": "Kiryat Bialik", "lat": 32.8333, "lng": 35.0833},
                    {"name": "קריית מוצקין", "name_en": "Kiryat Motzkin", "lat": 32.8389, "lng": 35.0750},
                    {"name": "קריית ים", "name_en": "Kiryat Yam", "lat": 32.8500, "lng": 35.0667},
                    {"name": "קריית אתא", "name_en": "Kiryat Ata", "lat": 32.8000, "lng": 35.1000},
                    {"name": "נשר", "name_en": "Nesher", "lat": 32.7700, "lng": 35.0400},
                    {"name": "טירת כרמל", "name_en": "Tirat Carmel", "lat": 32.7589, "lng": 34.9714}
                ]
            },
            {
                "region_id": "sharon",
                "name": "השרון",
                "name_en": "Sharon",
                "cities": [
                    {"name": "נתניה", "name_en": "Netanya", "lat": 32.3286, "lng": 34.8567},
                    {"name": "הרצליה", "name_en": "Herzliya", "lat": 32.1663, "lng": 34.8463},
                    {"name": "רעננה", "name_en": "Ra'anana", "lat": 32.1836, "lng": 34.8708},
                    {"name": "כפר סבא", "name_en": "Kfar Saba", "lat": 32.1753, "lng": 34.9065},
                    {"name": "הוד השרון", "name_en": "Hod HaSharon", "lat": 32.1500, "lng": 34.8833},
                    {"name": "רמת השרון", "name_en": "Ramat HaSharon", "lat": 32.1464, "lng": 34.8397},
                    {"name": "חדרה", "name_en": "Hadera", "lat": 32.4340, "lng": 34.9196},
                    {"name": "כפר יונה", "name_en": "Kfar Yona", "lat": 32.3167, "lng": 34.9333},
                    {"name": "פרדס חנה-כרכור", "name_en": "Pardes Hanna-Karkur", "lat": 32.4700, "lng": 34.9700},
                    {"name": "זכרון יעקב", "name_en": "Zikhron Ya'akov", "lat": 32.5714, "lng": 34.9522},
                    {"name": "בנימינה", "name_en": "Binyamina", "lat": 32.5167, "lng": 34.9500},
                    {"name": "אור עקיבא", "name_en": "Or Akiva", "lat": 32.5081, "lng": 34.9181},
                    {"name": "קיסריה", "name_en": "Caesarea", "lat": 32.5000, "lng": 34.9000}
                ]
            },
            {
                "region_id": "center",
                "name": "מרכז",
                "name_en": "Center",
                "cities": [
                    {"name": "תל אביב-יפו", "name_en": "Tel Aviv-Yafo", "lat": 32.0853, "lng": 34.7818},
                    {"name": "רמת גן", "name_en": "Ramat Gan", "lat": 32.0700, "lng": 34.8236},
                    {"name": "גבעתיים", "name_en": "Givatayim", "lat": 32.0714, "lng": 34.8122},
                    {"name": "בני ברק", "name_en": "Bnei Brak", "lat": 32.0833, "lng": 34.8333},
                    {"name": "פתח תקווה", "name_en": "Petah Tikva", "lat": 32.0841, "lng": 34.8878},
                    {"name": "חולון", "name_en": "Holon", "lat": 32.0158, "lng": 34.7875},
                    {"name": "בת ים", "name_en": "Bat Yam", "lat": 32.0231, "lng": 34.7503},
                    {"name": "ראשון לציון", "name_en": "Rishon LeZion", "lat": 31.9730, "lng": 34.7925},
                    {"name": "רחובות", "name_en": "Rehovot", "lat": 31.8928, "lng": 34.8113},
                    {"name": "נס ציונה", "name_en": "Ness Ziona", "lat": 31.9314, "lng": 34.7989},
                    {"name": "לוד", "name_en": "Lod", "lat": 31.9514, "lng": 34.8953},
                    {"name": "רמלה", "name_en": "Ramla", "lat": 31.9275, "lng": 34.8622},
                    {"name": "יבנה", "name_en": "Yavne", "lat": 31.8767, "lng": 34.7394},
                    {"name": "ראש העין", "name_en": "Rosh HaAyin", "lat": 32.0956, "lng": 34.9567},
                    {"name": "אלעד", "name_en": "Elad", "lat": 32.0522, "lng": 34.9508},
                    {"name": "גני תקווה", "name_en": "Ganei Tikva", "lat": 32.0597, "lng": 34.8714},
                    {"name": "קריית אונו", "name_en": "Kiryat Ono", "lat": 32.0633, "lng": 34.8556},
                    {"name": "אור יהודה", "name_en": "Or Yehuda", "lat": 32.0300, "lng": 34.8536},
                    {"name": "יהוד-מונוסון", "name_en": "Yehud-Monosson", "lat": 32.0333, "lng": 34.8833},
                    {"name": "כפר קאסם", "name_en": "Kafr Qasim", "lat": 32.1142, "lng": 34.9778},
                    {"name": "טייבה", "name_en": "Tayibe", "lat": 32.2667, "lng": 35.0000},
                    {"name": "קלנסווה", "name_en": "Qalansawe", "lat": 32.2833, "lng": 34.9833},
                    {"name": "טירה", "name_en": "Tira", "lat": 32.2333, "lng": 34.9500}
                ]
            },
            {
                "region_id": "jerusalem",
                "name": "ירושלים והסביבה",
                "name_en": "Jerusalem Area",
                "cities": [
                    {"name": "ירושלים", "name_en": "Jerusalem", "lat": 31.7683, "lng": 35.2137},
                    {"name": "בית שמש", "name_en": "Beit Shemesh", "lat": 31.7514, "lng": 34.9886},
                    {"name": "מודיעין-מכבים-רעות", "name_en": "Modi'in-Maccabim-Re'ut", "lat": 31.8978, "lng": 35.0100},
                    {"name": "מעלה אדומים", "name_en": "Ma'ale Adumim", "lat": 31.7781, "lng": 35.3031},
                    {"name": "גבעת זאב", "name_en": "Giv'at Ze'ev", "lat": 31.8622, "lng": 35.1706},
                    {"name": "ביתר עילית", "name_en": "Beitar Illit", "lat": 31.6953, "lng": 35.1128},
                    {"name": "מבשרת ציון", "name_en": "Mevaseret Zion", "lat": 31.8028, "lng": 35.1525},
                    {"name": "אבו גוש", "name_en": "Abu Ghosh", "lat": 31.8081, "lng": 35.1108},
                    {"name": "צור הדסה", "name_en": "Tzur Hadassa", "lat": 31.7231, "lng": 35.0717}
                ]
            },
            {
                "region_id": "south",
                "name": "דרום",
                "name_en": "South",
                "cities": [
                    {"name": "באר שבע", "name_en": "Be'er Sheva", "lat": 31.2518, "lng": 34.7913},
                    {"name": "אשדוד", "name_en": "Ashdod", "lat": 31.8044, "lng": 34.6553},
                    {"name": "אשקלון", "name_en": "Ashkelon", "lat": 31.6688, "lng": 34.5743},
                    {"name": "אילת", "name_en": "Eilat", "lat": 29.5577, "lng": 34.9519},
                    {"name": "דימונה", "name_en": "Dimona", "lat": 31.0697, "lng": 35.0333},
                    {"name": "קריית גת", "name_en": "Kiryat Gat", "lat": 31.6061, "lng": 34.7717},
                    {"name": "שדרות", "name_en": "Sderot", "lat": 31.5247, "lng": 34.5967},
                    {"name": "אופקים", "name_en": "Ofakim", "lat": 31.3142, "lng": 34.6183},
                    {"name": "נתיבות", "name_en": "Netivot", "lat": 31.4222, "lng": 34.5892},
                    {"name": "ערד", "name_en": "Arad", "lat": 31.2614, "lng": 35.2128},
                    {"name": "ירוחם", "name_en": "Yeruham", "lat": 30.9897, "lng": 34.9300},
                    {"name": "מצפה רמון", "name_en": "Mitzpe Ramon", "lat": 30.6100, "lng": 34.8017},
                    {"name": "רהט", "name_en": "Rahat", "lat": 31.3928, "lng": 34.7542}
                ]
            },
            {
                "region_id": "shfela",
                "name": "שפלה",
                "name_en": "Shfela",
                "cities": [
                    {"name": "אשדוד", "name_en": "Ashdod", "lat": 31.8044, "lng": 34.6553},
                    {"name": "אשקלון", "name_en": "Ashkelon", "lat": 31.6688, "lng": 34.5743},
                    {"name": "קריית מלאכי", "name_en": "Kiryat Malakhi", "lat": 31.7308, "lng": 34.7472},
                    {"name": "גדרה", "name_en": "Gedera", "lat": 31.8147, "lng": 34.7783},
                    {"name": "קריית עקרון", "name_en": "Kiryat Ekron", "lat": 31.8589, "lng": 34.8247},
                    {"name": "מזכרת בתיה", "name_en": "Mazkeret Batya", "lat": 31.8500, "lng": 34.8500},
                    {"name": "גן יבנה", "name_en": "Gan Yavne", "lat": 31.7833, "lng": 34.7000}
                ]
            },
            {
                "region_id": "judea_samaria",
                "name": "יהודה ושומרון",
                "name_en": "Judea and Samaria",
                "cities": [
                    {"name": "אריאל", "name_en": "Ariel", "lat": 32.1064, "lng": 35.1731},
                    {"name": "מעלה אדומים", "name_en": "Ma'ale Adumim", "lat": 31.7781, "lng": 35.3031},
                    {"name": "ביתר עילית", "name_en": "Beitar Illit", "lat": 31.6953, "lng": 35.1128},
                    {"name": "מודיעין עילית", "name_en": "Modi'in Illit", "lat": 31.9333, "lng": 35.0439},
                    {"name": "גבעת זאב", "name_en": "Giv'at Ze'ev", "lat": 31.8622, "lng": 35.1706},
                    {"name": "אלפי מנשה", "name_en": "Alfei Menashe", "lat": 32.1667, "lng": 35.0333},
                    {"name": "קרני שומרון", "name_en": "Karnei Shomron", "lat": 32.1667, "lng": 35.0833},
                    {"name": "עמנואל", "name_en": "Immanuel", "lat": 32.1556, "lng": 35.1589},
                    {"name": "קדומים", "name_en": "Kedumim", "lat": 32.1833, "lng": 35.1833},
                    {"name": "אפרת", "name_en": "Efrat", "lat": 31.6547, "lng": 35.1422}
                ]
            }
        ]
        # Insert defaults
        await db.regions.insert_many(default_regions)
        # Remove MongoDB _id from each region for JSON serialization
        for region in default_regions:
            if "_id" in region:
                del region["_id"]
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
        "name_en": region_data.get("name_en", ""),
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
    if "name_en" in region_data:
        update_data["name_en"] = region_data["name_en"]
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
    
    city_name = city_data.get("name") or city_data.get("city")
    if not city_name:
        raise HTTPException(status_code=400, detail="City name required")
    
    # Create city object with coordinates if provided
    city = {
        "name": city_name,
        "name_en": city_data.get("name_en", ""),
        "lat": city_data.get("lat"),
        "lng": city_data.get("lng")
    }
    
    result = await db.regions.update_one(
        {"region_id": region_id},
        {"$addToSet": {"cities": city}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Region not found")
    
    return {"message": f"City '{city_name}' added to region", "city": city}

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
    
    # Decode URL-encoded city name
    from urllib.parse import unquote
    decoded_city_name = unquote(city_name)
    
    # Try removing city object (new format with name field)
    result = await db.regions.update_one(
        {"region_id": region_id},
        {"$pull": {"cities": {"name": decoded_city_name}}}
    )
    
    # If no change, try removing as string (old format)
    if result.modified_count == 0:
        result = await db.regions.update_one(
            {"region_id": region_id},
            {"$pull": {"cities": decoded_city_name}}
        )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Region not found")
    
    return {"message": f"City '{decoded_city_name}' removed from region"}

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

# ==================== SERVICE TYPES MANAGEMENT ====================

@api_router.get("/service-types")
async def get_service_types():
    """Get all service types for public use"""
    service_types = await db.service_types.find({}, {"_id": 0}).to_list(100)
    
    if not service_types:
        # Initialize default service types
        default_types = [
            {
                "type_id": "visit",
                "name": "שירות ביקור",
                "name_en": "Visit Service",
                "description": "שירות הניתן בביקור אחד",
                "icon": "home",
                "requires_location": True,
                "is_active": True
            },
            {
                "type_id": "hourly",
                "name": "שירות שעתי",
                "name_en": "Hourly Service",
                "description": "שירות המחושב לפי שעות",
                "icon": "clock",
                "requires_location": True,
                "has_minimum_hours": True,
                "is_active": True
            },
            {
                "type_id": "consultation",
                "name": "שירות ייעוץ",
                "name_en": "Consultation Service",
                "description": "שירות ייעוץ מקצועי",
                "icon": "message-circle",
                "requires_location": False,
                "is_active": True
            },
            {
                "type_id": "product",
                "name": "מוצר",
                "name_en": "Product",
                "description": "מוצר למכירה",
                "icon": "package",
                "requires_location": False,
                "has_shipping": True,
                "is_active": True
            }
        ]
        await db.service_types.insert_many(default_types)
        # Remove _id from response
        for t in default_types:
            if "_id" in t:
                del t["_id"]
        return {"service_types": default_types}
    
    return {"service_types": service_types}

@api_router.get("/delivery-types")
async def get_delivery_types():
    """Get all delivery types for public use"""
    delivery_types = await db.delivery_types.find({}, {"_id": 0}).to_list(100)
    
    if not delivery_types:
        # Initialize default delivery types
        default_types = [
            {
                "type_id": "home_visit",
                "name": "בבית",
                "name_en": "At Home",
                "description": "השירות יינתן בבית הלקוח",
                "icon": "home",
                "requires_address": True,
                "is_active": True
            },
            {
                "type_id": "hospital",
                "name": "בבית חולים / מוסד",
                "name_en": "Hospital / Institution",
                "description": "השירות יינתן בבית חולים או מוסד רפואי",
                "icon": "building",
                "requires_address": True,
                "is_active": True
            },
            {
                "type_id": "clinic",
                "name": "בקליניקה",
                "name_en": "At Clinic",
                "description": "השירות יינתן בקליניקה של הספק",
                "icon": "building-2",
                "requires_address": False,
                "is_active": True
            },
            {
                "type_id": "virtual",
                "name": "וירטואלי",
                "name_en": "Virtual",
                "description": "השירות יינתן בטלפון או וידאו",
                "icon": "video",
                "requires_address": False,
                "sub_types": ["phone", "video"],
                "is_active": True
            }
        ]
        await db.delivery_types.insert_many(default_types)
        # Remove _id from response
        for t in default_types:
            if "_id" in t:
                del t["_id"]
        return {"delivery_types": default_types}
    
    return {"delivery_types": delivery_types}

@api_router.get("/admin/service-types")
async def admin_get_service_types(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Get all service types"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    service_types = await db.service_types.find({}, {"_id": 0}).to_list(100)
    
    if not service_types:
        # Trigger initialization
        response = await get_service_types()
        return {"service_types": response["service_types"]}
    
    return {"service_types": service_types}

@api_router.post("/admin/service-types")
async def admin_create_service_type(
    type_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Create a new service type"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    service_type = {
        "type_id": f"type_{uuid.uuid4().hex[:8]}",
        "name": type_data.get("name"),
        "name_en": type_data.get("name_en", ""),
        "description": type_data.get("description", ""),
        "icon": type_data.get("icon", "box"),
        "requires_location": type_data.get("requires_location", True),
        "has_minimum_hours": type_data.get("has_minimum_hours", False),
        "has_shipping": type_data.get("has_shipping", False),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.service_types.insert_one(service_type)
    if "_id" in service_type:
        del service_type["_id"]
    
    return {"message": "Service type created", "service_type": service_type}

@api_router.put("/admin/service-types/{type_id}")
async def admin_update_service_type(
    type_id: str,
    type_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update a service type"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {k: v for k, v in type_data.items() if k in [
        "name", "name_en", "description", "icon", 
        "requires_location", "has_minimum_hours", "has_shipping", "is_active"
    ]}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.service_types.update_one(
        {"type_id": type_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service type not found")
    
    return {"message": "Service type updated"}

@api_router.delete("/admin/service-types/{type_id}")
async def admin_delete_service_type(
    type_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Delete a service type"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.service_types.delete_one({"type_id": type_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service type not found")
    
    return {"message": "Service type deleted"}

@api_router.get("/admin/delivery-types")
async def admin_get_delivery_types(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Get all delivery types"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    delivery_types = await db.delivery_types.find({}, {"_id": 0}).to_list(100)
    
    if not delivery_types:
        response = await get_delivery_types()
        return {"delivery_types": response["delivery_types"]}
    
    return {"delivery_types": delivery_types}

@api_router.post("/admin/delivery-types")
async def admin_create_delivery_type(
    type_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Create a new delivery type"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    delivery_type = {
        "type_id": f"delivery_{uuid.uuid4().hex[:8]}",
        "name": type_data.get("name"),
        "name_en": type_data.get("name_en", ""),
        "description": type_data.get("description", ""),
        "icon": type_data.get("icon", "map-pin"),
        "requires_address": type_data.get("requires_address", True),
        "sub_types": type_data.get("sub_types", []),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.delivery_types.insert_one(delivery_type)
    if "_id" in delivery_type:
        del delivery_type["_id"]
    
    return {"message": "Delivery type created", "delivery_type": delivery_type}

@api_router.put("/admin/delivery-types/{type_id}")
async def admin_update_delivery_type(
    type_id: str,
    type_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update a delivery type"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {k: v for k, v in type_data.items() if k in [
        "name", "name_en", "description", "icon", 
        "requires_address", "sub_types", "is_active"
    ]}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.delivery_types.update_one(
        {"type_id": type_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Delivery type not found")
    
    return {"message": "Delivery type updated"}

@api_router.delete("/admin/delivery-types/{type_id}")
async def admin_delete_delivery_type(
    type_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Delete a delivery type"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.delivery_types.delete_one({"type_id": type_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Delivery type not found")
    
    return {"message": "Delivery type deleted"}

# ==================== PUBLIC PROFESSIONS ====================

@api_router.get("/professions")
async def get_public_professions():
    """Get all professions for public use (dropdowns, filters, etc.)"""
    professions = await db.professions.find({}, {"_id": 0}).to_list(100)
    
    if not professions:
        # Return empty list if not initialized
        return {"professions": []}
    
    # Return simplified structure for public use
    public_professions = []
    for prof in professions:
        public_prof = {
            "profession_id": prof.get("profession_id"),
            "name": prof.get("name"),
            "name_en": prof.get("name_en"),
            "icon": prof.get("icon"),
            "specializations": prof.get("specializations", []),
            "sub_professions": [
                {
                    "sub_profession_id": sp.get("sub_profession_id"),
                    "name": sp.get("name"),
                    "name_en": sp.get("name_en"),
                    "categories": [
                        {"category_id": c.get("category_id"), "name": c.get("name"), "name_en": c.get("name_en")}
                        for c in sp.get("categories", [])
                    ]
                }
                for sp in prof.get("sub_professions", [])
            ]
        }
        public_professions.append(public_prof)
    
    return {"professions": public_professions}

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
        # Initialize default professions and save to DB
        default_professions = [
            {
                "profession_id": "prof_medicine",
                "name": "רפואה",
                "name_en": "Medicine",
                "icon": "stethoscope",
                "specializations": ["רפואת משפחה", "רפואה פנימית", "רפואת ילדים", "גריאטריה"],
                "sub_professions": [
                    {"sub_profession_id": "sub_family", "name": "רפואת משפחה", "name_en": "Family Medicine", "categories": [
                        {"category_id": "cat_home_visit", "name": "ביקור בית", "name_en": "Home Visit"},
                        {"category_id": "cat_checkup", "name": "בדיקה כללית", "name_en": "General Checkup"}
                    ]},
                    {"sub_profession_id": "sub_pediatrics", "name": "ילדים", "name_en": "Pediatrics", "categories": []},
                    {"sub_profession_id": "sub_geriatrics", "name": "גריאטריה", "name_en": "Geriatrics", "categories": []}
                ],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "profession_id": "prof_nursing",
                "name": "סיעוד",
                "name_en": "Nursing",
                "icon": "heart-pulse",
                "specializations": ["סיעוד ביתי", "טיפול בקשישים", "סיעוד אחרי ניתוח", "טיפול פליאטיבי"],
                "sub_professions": [
                    {"sub_profession_id": "sub_home_care", "name": "סיעוד ביתי", "name_en": "Home Care", "categories": []},
                    {"sub_profession_id": "sub_elderly_care", "name": "טיפול בקשישים", "name_en": "Elderly Care", "categories": []},
                    {"sub_profession_id": "sub_post_op", "name": "סיעוד אחרי ניתוח", "name_en": "Post-Op Care", "categories": []}
                ],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "profession_id": "prof_therapy",
                "name": "טיפולים",
                "name_en": "Therapy",
                "icon": "activity",
                "specializations": ["פיזיותרפיה", "ריפוי בעיסוק", "קלינאות תקשורת", "טיפול רגשי"],
                "sub_professions": [
                    {"sub_profession_id": "sub_physio", "name": "פיזיותרפיה", "name_en": "Physiotherapy", "categories": []},
                    {"sub_profession_id": "sub_occupational", "name": "ריפוי בעיסוק", "name_en": "Occupational Therapy", "categories": []},
                    {"sub_profession_id": "sub_speech", "name": "קלינאות תקשורת", "name_en": "Speech Therapy", "categories": []}
                ],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "profession_id": "prof_mental",
                "name": "בריאות הנפש",
                "name_en": "Mental Health",
                "icon": "brain",
                "specializations": ["פסיכולוגיה", "פסיכיאטריה", "טיפול קוגניטיבי", "טיפול משפחתי"],
                "sub_professions": [
                    {"sub_profession_id": "sub_psychology", "name": "פסיכולוגיה", "name_en": "Psychology", "categories": []},
                    {"sub_profession_id": "sub_psychiatry", "name": "פסיכיאטריה", "name_en": "Psychiatry", "categories": []}
                ],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "profession_id": "prof_alternative",
                "name": "רפואה משלימה",
                "name_en": "Alternative Medicine",
                "icon": "leaf",
                "specializations": ["דיקור סיני", "נטורופתיה", "הומאופתיה", "עיסוי רפואי"],
                "sub_professions": [
                    {"sub_profession_id": "sub_acupuncture", "name": "דיקור סיני", "name_en": "Acupuncture", "categories": []},
                    {"sub_profession_id": "sub_naturopathy", "name": "נטורופתיה", "name_en": "Naturopathy", "categories": []},
                    {"sub_profession_id": "sub_massage", "name": "עיסוי רפואי", "name_en": "Medical Massage", "categories": []}
                ],
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        # Save to database
        await db.professions.insert_many(default_professions)
        professions = default_professions
    
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
        "icon": profession_data.get("icon", "briefcase"),
        "specializations": profession_data.get("specializations", []),
        "sub_professions": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.professions.insert_one(profession)
    
    return {"message": "Profession created", "profession": {k: v for k, v in profession.items() if k != "_id"}}

@api_router.put("/admin/professions/{profession_id}")
async def admin_update_profession(
    profession_id: str,
    profession_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update a profession"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {}
    if "name" in profession_data:
        update_data["name"] = profession_data["name"]
    if "name_en" in profession_data:
        update_data["name_en"] = profession_data["name_en"]
    if "icon" in profession_data:
        update_data["icon"] = profession_data["icon"]
    if "specializations" in profession_data:
        update_data["specializations"] = profession_data["specializations"]
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.professions.update_one(
        {"profession_id": profession_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Profession not found")
    
    return {"message": "Profession updated"}

@api_router.put("/admin/sub-professions/{sub_profession_id}")
async def admin_update_sub_profession(
    sub_profession_id: str,
    sub_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Update a sub-profession"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_fields = {}
    if "name" in sub_data:
        update_fields["sub_professions.$.name"] = sub_data["name"]
    if "name_en" in sub_data:
        update_fields["sub_professions.$.name_en"] = sub_data["name_en"]
    
    result = await db.professions.update_one(
        {"sub_professions.sub_profession_id": sub_profession_id},
        {"$set": update_fields}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Sub-profession not found")
    
    return {"message": "Sub-profession updated"}

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

# ==================== PUBLIC PAGES ====================

@api_router.get("/pages/{slug}")
async def get_public_page(slug: str):
    """Get a public static page by slug"""
    page = await db.static_pages.find_one(
        {"slug": slug, "is_published": True},
        {"_id": 0}
    )
    
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    return page

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
        "features": {
            "profile_management": True,
            "chat_contact": True,
            "phone_contact": True,
            "whatsapp_contact": True,
            "clinic_management": False,
            "product_shipping": True,
            "promoted_profile": False,
            "recommended_badge": False,
            "team_management": False,
            "priority_support": False,
            "staff_support": False
        },
        "features_list": [
            "ניהול פרופיל מתקדם",
            "כפתור יצירת קשר בצ'אט",
            "כפתור יצירת קשר בטלפון",
            "כפתור יצירת קשר בוואצאפ",
            "שירות אחד בלבד",
            "עד 10 הזמנות בחודש"
        ],
        "max_services": 1,
        "max_bookings_per_month": 10,
        "max_clinics": 0,
        "max_team_members": 0,
        "has_promoted_profile": False,
        "has_recommended_badge": False,
        "has_team_management": False,
        "has_chat_contact": True,
        "has_phone_contact": True,
        "has_whatsapp_contact": True,
        "has_clinic_management": False,
        "has_product_shipping": True,
        "has_priority_support": False,
        "has_staff_support": False,
        "analytics_access": False,
        "is_active": True,
        "sort_order": 0
    },
    {
        "plan_id": "plan_pro",
        "name": "Pro",
        "name_he": "פרו",
        "tier": "pro",
        "price_monthly": 59,
        "price_yearly": 600,
        "currency": "ILS",
        "features": {
            "profile_management": True,
            "chat_contact": True,
            "phone_contact": True,
            "whatsapp_contact": True,
            "clinic_management": True,
            "product_shipping": True,
            "promoted_profile": True,
            "recommended_badge": True,
            "team_management": False,
            "priority_support": True,
            "staff_support": False
        },
        "features_list": [
            "ניהול פרופיל מתקדם",
            "כפתור יצירת קשר בצ'אט",
            "כפתור יצירת קשר בטלפון",
            "כפתור יצירת קשר בוואצאפ",
            "ניהול קליניקות / סניפים",
            "שירותים ללא הגבלה",
            "הזמנות ללא הגבלה",
            "ניהול שירות שליחת מוצר",
            "תווית פרופיל מומלץ",
            "פרופיל מקודם",
            "תמיכה ולווי צוות האתר"
        ],
        "max_services": -1,
        "max_bookings_per_month": -1,
        "max_clinics": 5,
        "max_team_members": 0,
        "has_promoted_profile": True,
        "has_recommended_badge": True,
        "has_team_management": False,
        "has_chat_contact": True,
        "has_phone_contact": True,
        "has_whatsapp_contact": True,
        "has_clinic_management": True,
        "has_product_shipping": True,
        "has_priority_support": True,
        "has_staff_support": False,
        "analytics_access": True,
        "is_active": True,
        "sort_order": 1
    },
    {
        "plan_id": "plan_gold",
        "name": "Gold",
        "name_he": "זהב",
        "tier": "gold",
        "price_monthly": 149,
        "price_yearly": 1500,
        "currency": "ILS",
        "features": {
            "profile_management": True,
            "chat_contact": True,
            "phone_contact": True,
            "whatsapp_contact": True,
            "clinic_management": True,
            "product_shipping": True,
            "promoted_profile": True,
            "recommended_badge": True,
            "team_management": True,
            "priority_support": True,
            "staff_support": True
        },
        "features_list": [
            "ניהול פרופיל מתקדם",
            "כפתור יצירת קשר בצ'אט",
            "כפתור יצירת קשר בטלפון",
            "כפתור יצירת קשר בוואצאפ",
            "ניהול קליניקות / סניפים",
            "שירותים ללא הגבלה",
            "הזמנות ללא הגבלה",
            "ניהול שירות שליחת מוצר",
            "תווית פרופיל מומלץ",
            "פרופיל מקודם",
            "ניהול צוות",
            "תמיכה ולווי צוות האתר"
        ],
        "max_services": -1,
        "max_bookings_per_month": -1,
        "max_clinics": -1,
        "max_team_members": -1,
        "has_promoted_profile": True,
        "has_recommended_badge": True,
        "has_team_management": True,
        "has_chat_contact": True,
        "has_phone_contact": True,
        "has_whatsapp_contact": True,
        "has_clinic_management": True,
        "has_product_shipping": True,
        "has_priority_support": True,
        "has_staff_support": True,
        "analytics_access": True,
        "is_active": True,
        "sort_order": 2
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
    
    # Reset provider tier to free
    provider = await db.providers.find_one({"user_id": user["user_id"]})
    if provider:
        await db.providers.update_one(
            {"user_id": user["user_id"]},
            {"$set": {"subscription_tier": "free", "is_recommended": False}}
        )
    
    return {"message": "המנוי בוטל. חזרת למנוי חינם."}

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
    total_gold = await db.subscriptions.count_documents({"tier": "gold", "status": "active"})
    
    return {
        "subscriptions": subscriptions,
        "total": total,
        "stats": {
            "total_active": total_active,
            "total_pro": total_pro,
            "total_gold": total_gold
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
    
    allowed_fields = [
        "name_he", "price_monthly", "price_yearly", "features", "features_list",
        "max_services", "max_bookings_per_month", "max_clinics", "max_team_members",
        "has_promoted_profile", "has_recommended_badge", "has_team_management",
        "has_chat_contact", "has_phone_contact", "has_whatsapp_contact",
        "has_clinic_management", "has_product_shipping", "has_priority_support",
        "has_staff_support", "analytics_access", "is_active", "sort_order"
    ]
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

# ==================== CLINICS MANAGEMENT ====================

@api_router.get("/clinics")
async def get_my_clinics(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Get provider's clinics"""
    user = await get_current_user(authorization, request)
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    clinics = await db.clinics.find(
        {"provider_id": provider["provider_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return {"clinics": clinics}

@api_router.post("/clinics")
async def create_clinic(
    clinic_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Create a new clinic/location"""
    user = await get_current_user(authorization, request)
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Check subscription
    tier = provider.get("subscription_tier", "free")
    plan = await db.subscription_plans.find_one({"tier": tier}, {"_id": 0})
    if not plan:
        plan = DEFAULT_PLANS[0]
    
    if not plan.get("has_clinic_management", False):
        raise HTTPException(status_code=403, detail="שדרג את המנוי שלך כדי לנהל קליניקות")
    
    max_clinics = plan.get("max_clinics", 0)
    if max_clinics != -1:
        current_count = await db.clinics.count_documents({"provider_id": provider["provider_id"]})
        if current_count >= max_clinics:
            raise HTTPException(status_code=403, detail=f"הגעת למגבלת הקליניקות ({max_clinics})")
    
    clinic = {
        "clinic_id": f"clinic_{uuid.uuid4().hex[:12]}",
        "provider_id": provider["provider_id"],
        "name": clinic_data.get("name", ""),
        "address": clinic_data.get("address", ""),
        "city": clinic_data.get("city", ""),
        "phone": clinic_data.get("phone", ""),
        "latitude": clinic_data.get("latitude"),
        "longitude": clinic_data.get("longitude"),
        "working_hours": clinic_data.get("working_hours", ""),
        "notes": clinic_data.get("notes", ""),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.clinics.insert_one(clinic)
    if "_id" in clinic:
        del clinic["_id"]
    
    return clinic

@api_router.put("/clinics/{clinic_id}")
async def update_clinic(
    clinic_id: str,
    clinic_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Update a clinic"""
    user = await get_current_user(authorization, request)
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    clinic = await db.clinics.find_one({"clinic_id": clinic_id, "provider_id": provider["provider_id"]})
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    
    allowed = ["name", "address", "city", "phone", "latitude", "longitude", "working_hours", "notes", "is_active"]
    update = {k: v for k, v in clinic_data.items() if k in allowed}
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.clinics.update_one({"clinic_id": clinic_id}, {"$set": update})
    return {"message": "Clinic updated"}

@api_router.delete("/clinics/{clinic_id}")
async def delete_clinic(
    clinic_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Delete a clinic"""
    user = await get_current_user(authorization, request)
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    result = await db.clinics.delete_one({"clinic_id": clinic_id, "provider_id": provider["provider_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Clinic not found")
    
    return {"message": "Clinic deleted"}

# ==================== TEAM MANAGEMENT ====================

@api_router.get("/team")
async def get_my_team(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Get provider's team members"""
    user = await get_current_user(authorization, request)
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Check subscription
    tier = provider.get("subscription_tier", "free")
    plan = await db.subscription_plans.find_one({"tier": tier}, {"_id": 0})
    if not plan:
        plan = DEFAULT_PLANS[0]
    
    if not plan.get("has_team_management", False):
        raise HTTPException(status_code=403, detail="ניהול צוות זמין במנוי זהב בלבד")
    
    members = await db.team_members.find(
        {"provider_id": provider["provider_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return {"members": members}

@api_router.post("/team")
async def add_team_member(
    member_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Add a team member"""
    user = await get_current_user(authorization, request)
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    tier = provider.get("subscription_tier", "free")
    plan = await db.subscription_plans.find_one({"tier": tier}, {"_id": 0})
    if not plan:
        plan = DEFAULT_PLANS[0]
    
    if not plan.get("has_team_management", False):
        raise HTTPException(status_code=403, detail="ניהול צוות זמין במנוי זהב בלבד")
    
    max_members = plan.get("max_team_members", 0)
    if max_members != -1:
        current_count = await db.team_members.count_documents({"provider_id": provider["provider_id"]})
        if current_count >= max_members:
            raise HTTPException(status_code=403, detail=f"הגעת למגבלת חברי הצוות ({max_members})")
    
    member = {
        "member_id": f"member_{uuid.uuid4().hex[:12]}",
        "provider_id": provider["provider_id"],
        "name": member_data.get("name", ""),
        "role": member_data.get("role", ""),
        "phone": member_data.get("phone", ""),
        "email": member_data.get("email", ""),
        "specialization": member_data.get("specialization", ""),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.team_members.insert_one(member)
    if "_id" in member:
        del member["_id"]
    
    return member

@api_router.put("/team/{member_id}")
async def update_team_member(
    member_id: str,
    member_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Update team member"""
    user = await get_current_user(authorization, request)
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    allowed = ["name", "role", "phone", "email", "specialization", "is_active"]
    update = {k: v for k, v in member_data.items() if k in allowed}
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.team_members.update_one(
        {"member_id": member_id, "provider_id": provider["provider_id"]},
        {"$set": update}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    
    return {"message": "Member updated"}

@api_router.delete("/team/{member_id}")
async def delete_team_member(
    member_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Delete team member"""
    user = await get_current_user(authorization, request)
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    result = await db.team_members.delete_one(
        {"member_id": member_id, "provider_id": provider["provider_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    
    return {"message": "Member deleted"}

# ==================== SUBSCRIPTION UPGRADE (No Payment) ====================

@api_router.post("/subscriptions/upgrade")
async def upgrade_subscription(
    body: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Upgrade subscription (infrastructure only, no payment)"""
    user = await get_current_user(authorization, request)
    plan_id = body.get("plan_id")
    billing_cycle = body.get("billing_cycle", "monthly")
    use_trial = body.get("use_trial", False)
    
    plan = await db.subscription_plans.find_one({"plan_id": plan_id, "is_active": True}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    
    # Check if user already used trial
    if use_trial:
        existing_trial = await db.subscriptions.find_one({
            "user_id": user["user_id"],
            "is_trial": True
        })
        if existing_trial:
            raise HTTPException(status_code=400, detail="כבר ניצלת את תקופת הניסיון. שדרג למנוי בתשלום.")
    
    # Cancel existing active subscription
    await db.subscriptions.update_many(
        {"user_id": user["user_id"], "status": "active"},
        {"$set": {"status": "cancelled", "cancelled_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Create new subscription
    now = datetime.now(timezone.utc)
    trial_end = (now + timedelta(days=30)).isoformat() if use_trial else None
    
    sub = {
        "subscription_id": f"sub_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "provider_id": provider["provider_id"] if provider else None,
        "plan_id": plan_id,
        "tier": plan["tier"],
        "status": "active",
        "billing_cycle": billing_cycle,
        "is_trial": use_trial,
        "trial_end_date": trial_end,
        "start_date": now.isoformat(),
        "created_at": now.isoformat()
    }
    
    await db.subscriptions.insert_one(sub)
    if "_id" in sub:
        del sub["_id"]
    
    # Update provider tier
    if provider:
        update_fields = {"subscription_tier": plan["tier"]}
        if plan.get("has_recommended_badge"):
            update_fields["is_recommended"] = True
        await db.providers.update_one(
            {"provider_id": provider["provider_id"]},
            {"$set": update_fields}
        )
    
    msg = "תקופת הניסיון החלה! 30 יום חינם" if use_trial else "המנוי שודרג בהצלחה"
    return {"message": msg, "subscription": sub, "plan": plan}

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


# ==================== USER VERIFICATION ====================

@api_router.get("/verification/status")
async def get_verification_status(authorization: Optional[str] = Header(None), request: Request = None):
    """Get current user's verification status"""
    user = await get_current_user(authorization, request)
    
    # For providers, check provider verification status
    if user.get("role") == UserRole.PROVIDER:
        provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
        if provider:
            return {
                "status": provider.get("verification_status", "pending"),
                "documents": provider.get("verification_documents", []),
                "notes": provider.get("verification_notes"),
                "is_verified": provider.get("is_verified", False),
                "user_type": "provider"
            }
    
    # For regular users
    return {
        "status": user.get("verification_status", "none"),
        "documents": user.get("verification_documents", []),
        "notes": user.get("verification_notes"),
        "is_verified": user.get("is_verified", False),
        "user_type": "user"
    }


@api_router.post("/verification/request")
async def submit_verification_request(
    request: Request,
    authorization: Optional[str] = Header(None),
    id_card: UploadFile = File(None),
    id_card_back: UploadFile = File(None),
    professional_license: UploadFile = File(None),
    additional_doc: UploadFile = File(None),
    notes: str = ""
):
    """Submit verification request with document uploads"""
    user = await get_current_user(authorization, request)
    
    # Get user_type from form
    form = await request.form()
    user_type = form.get("user_type", "user")
    notes_text = form.get("notes", "")
    
    documents = []
    
    # Process each uploaded file
    async def save_file(upload_file: UploadFile, doc_type: str):
        if not upload_file or not upload_file.filename:
            return None
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
        if upload_file.content_type not in allowed_types:
            return None
        
        # Generate unique filename
        ext = upload_file.filename.split('.')[-1]
        filename = f"{user['user_id']}_{doc_type}_{uuid.uuid4().hex[:8]}.{ext}"
        file_path = UPLOAD_DIR / filename
        
        # Save file
        with open(file_path, "wb") as f:
            content = await upload_file.read()
            f.write(content)
        
        return {
            "document_id": f"doc_{uuid.uuid4().hex[:12]}",
            "document_type": doc_type,
            "file_url": f"/api/files/{filename}",
            "file_name": upload_file.filename,
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "status": "pending"
        }
    
    # Save documents
    if id_card:
        doc = await save_file(id_card, "id_card")
        if doc: documents.append(doc)
    
    if id_card_back:
        doc = await save_file(id_card_back, "id_card_back")
        if doc: documents.append(doc)
    
    if professional_license:
        doc = await save_file(professional_license, "professional_license")
        if doc: documents.append(doc)
    
    if additional_doc:
        doc = await save_file(additional_doc, "additional_doc")
        if doc: documents.append(doc)
    
    if not documents:
        raise HTTPException(status_code=400, detail="At least one document is required")
    
    # Update based on user type
    if user.get("role") == UserRole.PROVIDER:
        # Update provider verification
        await db.providers.update_one(
            {"user_id": user["user_id"]},
            {
                "$set": {
                    "verification_status": VerificationStatus.DOCUMENTS_SUBMITTED,
                    "verification_notes": notes_text
                },
                "$push": {"verification_documents": {"$each": documents}}
            }
        )
    else:
        # Update user verification
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {
                "$set": {
                    "verification_status": "pending",
                    "verification_documents": documents,
                    "verification_notes": notes_text,
                    "verification_submitted_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
    
    # Notify admins
    admins = await db.users.find({"role": "admin"}, {"_id": 0, "user_id": 1, "email": 1}).to_list(100)
    for admin in admins:
        await create_notification(
            admin["user_id"],
            NotificationType.SYSTEM,
            "בקשת אימות חדשה",
            f"בקשת אימות חדשה התקבלה מ{user.get('name', 'משתמש')}",
            {"user_id": user["user_id"], "user_type": user_type}
        )
    
    return {"message": "Verification request submitted successfully", "documents_count": len(documents)}


@api_router.get("/admin/user-verifications")
async def admin_get_user_verifications(
    status: Optional[str] = None,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Get all user verification requests"""
    user = await get_current_user(authorization, request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {"verification_status": {"$in": ["pending", "approved", "rejected"]}}
    if status:
        query["verification_status"] = status
    
    users = await db.users.find(
        query,
        {"_id": 0, "password_hash": 0}
    ).to_list(100)
    
    return {"verifications": users}


@api_router.put("/admin/user-verifications/{user_id}/approve")
async def admin_approve_user_verification(
    user_id: str,
    body: dict = None,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Approve a user verification request"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    notes = body.get("notes", "") if body else ""
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "verification_status": "approved",
                "is_verified": True,
                "verification_notes": notes
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Notify user
    await create_notification(
        user_id,
        NotificationType.SYSTEM,
        "החשבון אומת בהצלחה! ✅",
        "בקשת האימות שלך אושרה. כעת החשבון שלך מאומת.",
        {}
    )
    
    return {"message": "User verification approved"}


@api_router.put("/admin/user-verifications/{user_id}/reject")
async def admin_reject_user_verification(
    user_id: str,
    body: dict = None,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Admin: Reject a user verification request"""
    admin = await get_current_user(authorization, request)
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    reason = body.get("reason", "הבקשה נדחתה") if body else "הבקשה נדחתה"
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "verification_status": "rejected",
                "is_verified": False,
                "verification_notes": reason
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Notify user
    await create_notification(
        user_id,
        NotificationType.SYSTEM,
        "בקשת האימות נדחתה",
        f"בקשת האימות שלך נדחתה. סיבה: {reason}",
        {}
    )
    
    return {"message": "User verification rejected"}


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
