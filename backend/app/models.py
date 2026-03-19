import uuid
import random
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator


def generate_user_number():
    return f"U{random.randint(1000000, 9999999)}"

def generate_provider_number():
    return f"P{random.randint(1000000, 9999999)}"


# ==================== USER MODELS ====================

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
    language_preference: str = "he"
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_verified: bool = False
    is_suspended: bool = False
    suspended_at: Optional[datetime] = None
    suspension_reason: Optional[str] = None
    verification_status: str = "none"
    verification_documents: List[dict] = []
    verification_notes: Optional[str] = None
    verification_submitted_at: Optional[datetime] = None
    email_verified: bool = False

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = UserRole.PATIENT
    language_preference: str = "he"

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        if not any(c.isalpha() for c in v):
            raise ValueError('Password must contain at least one letter')
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


# ==================== SUBSCRIPTION MODELS ====================

class SubscriptionTier:
    FREE = "free"
    PRO = "pro"
    PREMIUM = "premium"

class SubscriptionPlan(BaseModel):
    plan_id: str = Field(default_factory=lambda: f"plan_{uuid.uuid4().hex[:12]}")
    name: str
    name_he: str
    tier: str
    price_monthly: float
    price_yearly: float
    currency: str = "ILS"
    features: dict = {}
    features_list: List[str] = []
    max_services: int = 1
    max_bookings_per_month: int = 10
    max_clinics: int = 0
    max_team_members: int = 0
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
    tier: str
    status: str = "active"
    billing_cycle: str = "monthly"
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
    status: str = "pending"
    payment_method: str = "paypal"
    paypal_order_id: Optional[str] = None
    paypal_capture_id: Optional[str] = None
    description: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None


# ==================== PROVIDER MODELS ====================

class ProviderType:
    INDIVIDUAL = "individual"
    COMPANY = "company"
    CLINIC = "clinic"

class TeamMember(BaseModel):
    member_id: str = Field(default_factory=lambda: f"member_{uuid.uuid4().hex[:12]}")
    name: str
    role: str
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
    day: str
    shift: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    is_available: bool = True

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
    document_type: str
    file_url: str
    file_name: str
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "pending"
    rejection_reason: Optional[str] = None

class Provider(BaseModel):
    model_config = ConfigDict(extra="ignore")
    provider_id: str = Field(default_factory=lambda: f"provider_{uuid.uuid4().hex[:12]}")
    provider_number: str = Field(default_factory=generate_provider_number)
    user_id: str
    provider_type: str
    business_name: Optional[str] = None
    description: Optional[str] = None
    about: Optional[str] = None
    profile_image: Optional[str] = None
    gender: Optional[str] = None
    # Profession hierarchy (linked to admin professions collection)
    profession_id: Optional[str] = None          # מקצוע - e.g. "prof_nursing"
    profession_name: Optional[str] = None         # cached name - e.g. "סיעוד"
    specialization_id: Optional[str] = None       # התמחות - e.g. "sub_home_care"
    specialization_name: Optional[str] = None     # cached name - e.g. "סיעוד ביתי"
    expertise: List[str] = []                     # מומחיות - free text specific skills
    # Legacy fields (kept for backward compatibility)
    specializations: List[str] = []
    services: List[str] = []
    profession_title: Optional[str] = None
    # Service categories from admin hierarchy (what services the provider offers)
    service_categories: List[dict] = []           # [{category_id, name, profession_id}]
    team_members: List[TeamMember] = []
    location: Optional[Location] = None
    service_areas: List[str] = []
    availability: List[Availability] = []
    languages: List[str] = []
    target_audience: List[str] = []
    rating: float = 0.0
    total_reviews: int = 0
    subscription_tier: str = "free"
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

PROFESSION_TITLES = [
    {"value": "doctor", "label": "רופא", "label_en": "Doctor",
     "search_terms": ["רופא", "רופאה", "דוקטור", "רופא משפחה", "רופא ילדים", "פדיאטר"]},
    {"value": "nurse", "label": "אח/ות מוסמך/ת", "label_en": "Registered Nurse",
     "search_terms": ["אחות", "אח", "אחות/אח", "סיעוד", "אחות מוסמכת", "אחות מעשית", "אח מוסמך"]},
    {"value": "physiotherapist", "label": "פיזיותרפיסט", "label_en": "Physiotherapist",
     "search_terms": ["פיזיותרפיה", "פיזיותרפיסט", "פיזיותרפיסטית", "שיקום"]},
    {"value": "occupational_therapist", "label": "מרפא/ה בעיסוק", "label_en": "Occupational Therapist",
     "search_terms": ["ריפוי בעיסוק", "מרפא בעיסוק", "מרפאה בעיסוק"]},
    {"value": "student", "label": "סטודנט/ית", "label_en": "Student",
     "search_terms": ["סטודנט", "סטודנטית"]},
    {"value": "caregiver", "label": "מטפל/ת", "label_en": "Caregiver",
     "search_terms": ["מטפל", "מטפלת", "מטפל סיעודי", "מטפלת סיעודית", "טיפול סיעודי"]},
    {"value": "psychologist", "label": "פסיכולוג/ית", "label_en": "Psychologist",
     "search_terms": ["פסיכולוג", "פסיכולוגית", "פסיכולוגיה", "טיפול נפשי"]},
    {"value": "social_worker", "label": "עובד/ת סוציאלי/ת", "label_en": "Social Worker",
     "search_terms": ["עובד סוציאלי", "עובדת סוציאלית", "עבודה סוציאלית"]},
    {"value": "dietitian", "label": "דיאטן/ית", "label_en": "Dietitian",
     "search_terms": ["דיאטן", "דיאטנית", "דיאטה", "תזונה", "יועץ תזונה"]},
    {"value": "speech_therapist", "label": "קלינאי/ת תקשורת", "label_en": "Speech Therapist",
     "search_terms": ["קלינאי תקשורת", "קלינאית תקשורת", "דיבור", "תקשורת"]},
]

GENDER_OPTIONS = [
    {"value": "male", "label": "זכר", "label_en": "Male"},
    {"value": "female", "label": "נקבה", "label_en": "Female"},
    {"value": "other", "label": "אחר", "label_en": "Other"},
]

LANGUAGE_OPTIONS = [
    {"value": "hebrew", "label": "עברית", "label_en": "Hebrew"},
    {"value": "arabic", "label": "ערבית", "label_en": "Arabic"},
    {"value": "english", "label": "אנגלית", "label_en": "English"},
    {"value": "russian", "label": "רוסית", "label_en": "Russian"},
    {"value": "french", "label": "צרפתית", "label_en": "French"},
    {"value": "spanish", "label": "ספרדית", "label_en": "Spanish"},
    {"value": "amharic", "label": "אמהרית", "label_en": "Amharic"},
]

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


# ==================== SERVICE MODELS ====================

class ServiceType:
    """Where/how the service is delivered"""
    HOME = "home"                   # בבית הלקוח
    CLINIC = "clinic"               # בקליניקה
    HOSPITAL = "hospital"           # בבית חולים / מוסד
    VIRTUAL = "virtual"             # וירטואלי - זום, וואצאפ, טלפון, מייט
    DELIVERY = "delivery"           # משלוח

class ServiceCategory:
    """What kind of service"""
    CONSULTATION = "consultation"   # יעוץ - מחיר קבוע
    VISIT = "visit"                 # ביקור - שירות ביקור
    PRODUCT = "product"             # מוצר - פיזי או וירטואלי
    HOURLY = "hourly"               # שעתי - לפי שעות/משמרת
    PROCEDURE = "procedure"         # פעולה - מחיר לפי פעולה רפואית
    SERIES = "series"               # סדרה - סדרת טיפולים

class PricingType:
    FIXED = "fixed"                 # מחיר קבוע
    PER_HOUR = "per_hour"           # לפי שעה
    PER_VISIT = "per_visit"         # לפי ביקור
    PER_UNIT = "per_unit"           # לפי יחידה (מוצר)
    PER_PROCEDURE = "per_procedure" # לפי פעולה
    PER_SERIES = "per_series"       # לפי סדרה

class WeekendPricingType:
    NONE = "none"
    PERCENTAGE = "percentage"
    FIXED = "fixed"

class Service(BaseModel):
    model_config = ConfigDict(extra="ignore")
    service_id: str = Field(default_factory=lambda: f"service_{uuid.uuid4().hex[:12]}")
    service_number: str = Field(default_factory=lambda: f"S{uuid.uuid4().hex[:8].upper()}")
    provider_id: str
    name: str
    description: str
    service_category: str = ServiceCategory.VISIT
    # Links to admin profession categories (1-3 required)
    categories: List[dict] = []  # [{category_id, name, profession_id, profession_name}]
    delivery_types: List[str] = []
    pricing_type: str = PricingType.FIXED
    price: float
    currency: str = "ILS"
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
    # Series specific
    num_sessions: Optional[int] = None           # מספר מפגשים בסדרה
    series_price: Optional[float] = None          # מחיר כולל לסדרה (אם שונה מ-price * num_sessions)
    session_duration_minutes: Optional[int] = None # משך מפגש בודד
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ServiceCreate(BaseModel):
    name: str
    description: str
    service_category: str = ServiceCategory.VISIT
    categories: List[dict] = []  # [{category_id, name, profession_id, profession_name}]
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
    num_sessions: Optional[int] = None
    series_price: Optional[float] = None
    session_duration_minutes: Optional[int] = None


# ==================== REQUEST & OFFER MODELS ====================

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

class RequestUrgency:
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class OfferStatus:
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"
    EXPIRED = "expired"

class BudgetType:
    PER_HOUR = "per_hour"           # לשעה
    PER_TREATMENT = "per_treatment" # לטיפול
    PER_VISIT = "per_visit"         # לביקור

class ServiceRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    request_id: str = Field(default_factory=lambda: f"request_{uuid.uuid4().hex[:12]}")
    user_id: str
    title: str
    description: str
    provider_type: Optional[str] = None
    specialization: Optional[str] = None
    professions: List[str] = []                    # מקצוע - up to 3 profession IDs
    service_type: Optional[str] = None             # סוג שירות - synced with backend
    delivery_type: Optional[str] = None            # דרך מתן השירות
    location: Optional[Location] = None
    budget: Optional[float] = None
    budget_type: Optional[str] = None              # לשעה / לטיפול / לביקור
    hours_needed: Optional[int] = None             # מספר שעות דרושות (לשירות שעתי)
    request_type: str = RequestType.ONE_TIME
    urgency: Optional[str] = RequestUrgency.MEDIUM
    preferred_date: Optional[datetime] = None
    preferred_time: Optional[str] = None           # שעה רצויה
    gender_preference: Optional[str] = None        # העדפת מגדר
    language_preferences: List[str] = []           # העדפות שפה
    preferences: Optional[str] = None
    address_notes: Optional[str] = None            # הערות לכתובת
    region: Optional[str] = None                   # אזור
    status: str = RequestStatus.OPEN
    offer_count: int = 0
    accepted_offer_id: Optional[str] = None
    accepted_at: Optional[datetime] = None
    booking_id: Optional[str] = None
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RequestCreate(BaseModel):
    title: str
    description: str
    provider_type: Optional[str] = None
    specialization: Optional[str] = None
    professions: List[str] = []
    service_type: Optional[str] = None
    delivery_type: Optional[str] = None
    location: Optional[Location] = None
    budget: Optional[float] = None
    budget_type: Optional[str] = None
    hours_needed: Optional[int] = None
    request_type: str = RequestType.ONE_TIME
    urgency: Optional[str] = RequestUrgency.MEDIUM
    preferred_date: Optional[datetime] = None
    preferred_time: Optional[str] = None
    gender_preference: Optional[str] = None
    language_preferences: List[str] = []
    preferences: Optional[str] = None
    address_notes: Optional[str] = None
    region: Optional[str] = None

    @field_validator('professions')
    @classmethod
    def validate_professions(cls, v):
        if len(v) > 3:
            raise ValueError('You can select up to 3 professions')
        return v

    @field_validator('budget_type')
    @classmethod
    def validate_budget_type(cls, v):
        if v is None:
            return v
        allowed = [BudgetType.PER_HOUR, BudgetType.PER_TREATMENT, BudgetType.PER_VISIT]
        if v not in allowed:
            raise ValueError(f'budget_type must be one of: {", ".join(allowed)}')
        return v

    @field_validator('gender_preference')
    @classmethod
    def validate_gender_preference(cls, v):
        if v is None:
            return v
        allowed = ["male", "female", "no_preference"]
        if v not in allowed:
            raise ValueError(f'gender_preference must be one of: {", ".join(allowed)}')
        return v

    @field_validator('request_type')
    @classmethod
    def validate_request_type(cls, v):
        allowed = [RequestType.IMMEDIATE, RequestType.SCHEDULED, RequestType.ONE_TIME, RequestType.FOLLOW_UP]
        if v not in allowed:
            raise ValueError(f'request_type must be one of: {", ".join(allowed)}')
        return v

    @field_validator('urgency')
    @classmethod
    def validate_urgency(cls, v):
        if v is None:
            return v
        allowed = [RequestUrgency.LOW, RequestUrgency.MEDIUM, RequestUrgency.HIGH, RequestUrgency.URGENT]
        if v not in allowed:
            raise ValueError(f'urgency must be one of: {", ".join(allowed)}')
        return v

    @field_validator('provider_type')
    @classmethod
    def validate_provider_type(cls, v):
        if v is None:
            return v
        allowed = [ProviderType.INDIVIDUAL, ProviderType.COMPANY, ProviderType.CLINIC]
        if v not in allowed:
            raise ValueError(f'provider_type must be one of: {", ".join(allowed)}')
        return v

    @field_validator('budget')
    @classmethod
    def validate_budget(cls, v):
        if v is not None and v < 0:
            raise ValueError('budget must be a positive number')
        return v

    @field_validator('hours_needed')
    @classmethod
    def validate_hours_needed(cls, v):
        if v is not None and v < 1:
            raise ValueError('hours_needed must be at least 1')
        return v

class RequestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    provider_type: Optional[str] = None
    specialization: Optional[str] = None
    professions: Optional[List[str]] = None
    service_type: Optional[str] = None
    delivery_type: Optional[str] = None
    location: Optional[Location] = None
    budget: Optional[float] = None
    budget_type: Optional[str] = None
    hours_needed: Optional[int] = None
    request_type: Optional[str] = None
    urgency: Optional[str] = None
    preferred_date: Optional[datetime] = None
    preferred_time: Optional[str] = None
    gender_preference: Optional[str] = None
    language_preferences: Optional[List[str]] = None
    preferences: Optional[str] = None
    address_notes: Optional[str] = None
    region: Optional[str] = None

class RequestCancel(BaseModel):
    reason: Optional[str] = None

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
    provider_name: Optional[str] = None
    provider_picture: Optional[str] = None
    status: str = OfferStatus.PENDING
    rejected_at: Optional[datetime] = None
    withdrawn_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OfferCreate(BaseModel):
    request_id: str
    price: float
    pricing_type: str
    duration_days: Optional[int] = None
    message: str
    suggested_service_id: Optional[str] = None


# ==================== BOOKING MODELS ====================

class BookingStatus:
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    PROVIDER_COMPLETED = "provider_completed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REJECTED = "rejected"
    ON_HOLD = "on_hold"

class ContactPerson(BaseModel):
    name: str
    phone: str
    relationship: Optional[str] = None

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
    booking_number: str = Field(default_factory=lambda: f"B{uuid.uuid4().hex[:8].upper()}")
    user_id: str
    provider_id: str
    service_id: str
    booking_date: Optional[datetime] = None
    booking_time: Optional[str] = None
    status: str = BookingStatus.PENDING
    service_name: Optional[str] = None
    service_category: Optional[str] = None
    delivery_type: Optional[str] = None
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    client_email: Optional[str] = None
    contact_person: Optional[ContactPerson] = None
    is_contact_same_as_requester: bool = True
    service_location: Optional[ServiceLocation] = None
    shipping_address: Optional[ServiceLocation] = None
    hours_booked: Optional[float] = None
    selected_shift: Optional[str] = None
    platform: Optional[str] = None
    num_sessions: Optional[int] = None
    notes: Optional[str] = None
    special_requirements: Optional[str] = None
    base_price: Optional[float] = None
    travel_cost: Optional[float] = None
    weekend_addition: Optional[float] = None
    shipping_cost: Optional[float] = None
    final_price: Optional[float] = None
    payment_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    confirmed_at: Optional[datetime] = None
    provider_completed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    provider_name: Optional[str] = None
    user_name: Optional[str] = None
    is_guest_booking: bool = False
    change_requests: List[dict] = []

class BookingCreate(BaseModel):
    service_id: str
    booking_date: Optional[datetime] = None
    booking_time: Optional[str] = None
    delivery_type: Optional[str] = None
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    client_email: Optional[str] = None
    is_contact_same_as_requester: bool = True
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
    shipping_address: Optional[str] = None
    shipping_city: Optional[str] = None
    shipping_postal_code: Optional[str] = None
    hours_booked: Optional[float] = None
    selected_shift: Optional[str] = None
    platform: Optional[str] = None
    total_price: Optional[float] = None
    num_sessions: Optional[int] = None
    notes: Optional[str] = None
    special_requirements: Optional[str] = None
    guest_booking: bool = False
    guest_name: Optional[str] = None
    guest_email: Optional[str] = None
    guest_phone: Optional[str] = None
    guest_address: Optional[str] = None


# ==================== REVIEW MODELS ====================

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    review_id: str = Field(default_factory=lambda: f"review_{uuid.uuid4().hex[:12]}")
    user_id: str
    provider_id: str
    booking_id: Optional[str] = None
    rating: float
    comment: str
    service_quality: Optional[int] = None
    punctuality: Optional[int] = None
    communication: Optional[int] = None
    price_value: Optional[int] = None
    would_recommend: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "pending"
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


# ==================== NOTIFICATION MODELS ====================

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
    OFFER_REJECTED = "offer_rejected"
    OFFER_WITHDRAWN = "offer_withdrawn"
    REQUEST_NEW = "request_new"
    REQUEST_CANCELLED = "request_cancelled"
    REVIEW_NEW = "review_new"
    BOOKING_CHANGE_REQUESTED = "booking_change_requested"
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


# ==================== CHAT MODELS ====================

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
    sender_role: str
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_read: bool = False

class MessageCreate(BaseModel):
    room_id: str
    content: str
