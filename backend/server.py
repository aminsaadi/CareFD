from fastapi import FastAPI, APIRouter, HTTPException, Header, Response, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

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
    email: EmailStr
    name: str
    password_hash: Optional[str] = None
    role: str = UserRole.PATIENT
    language_preference: str = "he"  # he or ar
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_verified: bool = False

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
    day: str  # monday, tuesday, etc.
    start_time: str  # "09:00"
    end_time: str  # "17:00"
    is_available: bool = True

class Provider(BaseModel):
    model_config = ConfigDict(extra="ignore")
    provider_id: str = Field(default_factory=lambda: f"provider_{uuid.uuid4().hex[:12]}")
    user_id: str
    provider_type: str  # individual, company, clinic
    business_name: Optional[str] = None
    description: Optional[str] = None
    specializations: List[str] = []
    services: List[str] = []  # List of service_ids
    team_members: List[TeamMember] = []
    location: Optional[Location] = None
    availability: List[Availability] = []
    rating: float = 0.0
    total_reviews: int = 0
    subscription_tier: str = "free"  # free, pro, premium
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_verified: bool = False

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
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    booking_id: str = Field(default_factory=lambda: f"booking_{uuid.uuid4().hex[:12]}")
    user_id: str
    provider_id: str
    service_id: str
    booking_date: datetime
    status: str = BookingStatus.PENDING
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

class BookingCreate(BaseModel):
    service_id: str
    booking_date: datetime

# Review Models
class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    review_id: str = Field(default_factory=lambda: f"review_{uuid.uuid4().hex[:12]}")
    user_id: str
    provider_id: str
    booking_id: Optional[str] = None
    rating: float  # 1-5
    comment: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReviewCreate(BaseModel):
    provider_id: str
    booking_id: Optional[str] = None
    rating: float
    comment: str
    
    @field_validator('rating')
    @classmethod
    def validate_rating(cls, v):
        if not 1 <= v <= 5:
            raise ValueError('Rating must be between 1 and 5')
        return v

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
    
    # Send verification email
    verification_link = f"https://carelink.example.com/verify?user_id={user.user_id}"
    await send_email_async(
        user.email,
        "Welcome to CareLink - Verify Your Email",
        f"""
        <h1>Welcome to CareLink!</h1>
        <p>Hi {user.name},</p>
        <p>Thank you for registering. Please verify your email by clicking the link below:</p>
        <a href="{verification_link}">Verify Email</a>
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
            "role": user.role
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

# ==================== PROVIDER ROUTES ====================

@api_router.post("/providers")
async def create_provider(provider_data: ProviderRegister, authorization: Optional[str] = Header(None), request: Request = None):
    """Register as a provider"""
    user = await get_current_user(authorization, request)
    
    # Check if provider already exists
    existing = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Provider already exists")
    
    # Create provider
    provider = Provider(
        user_id=user["user_id"],
        provider_type=provider_data.provider_type,
        business_name=provider_data.business_name,
        description=provider_data.description,
        specializations=provider_data.specializations,
        location=provider_data.location
    )
    
    provider_dict = provider.model_dump()
    provider_dict['created_at'] = provider_dict['created_at'].isoformat()
    if provider_dict.get('location'):
        provider_dict['location'] = dict(provider_dict['location'])
    
    await db.providers.insert_one(provider_dict)
    
    # Update user role
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"role": UserRole.PROVIDER}}
    )
    
    return provider.model_dump(exclude={"created_at": False})

@api_router.get("/providers/{provider_id}")
async def get_provider(provider_id: str):
    """Get provider details"""
    provider = await db.providers.find_one({"provider_id": provider_id}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Get services
    services = await db.services.find({"provider_id": provider_id, "is_active": True}, {"_id": 0}).to_list(100)
    provider['services_list'] = services
    
    return provider

@api_router.get("/providers")
async def search_providers(
    specialization: Optional[str] = None,
    city: Optional[str] = None,
    provider_type: Optional[str] = None,
    min_rating: Optional[float] = None,
    skip: int = 0,
    limit: int = 20
):
    """Search providers with filters"""
    query = {}
    
    if specialization:
        query["specializations"] = {"$in": [specialization]}
    
    if city:
        query["location.city"] = city
    
    if provider_type:
        query["provider_type"] = provider_type
    
    if min_rating:
        query["rating"] = {"$gte": min_rating}
    
    providers = await db.providers.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.providers.count_documents(query)
    
    return {
        "providers": providers,
        "total": total,
        "skip": skip,
        "limit": limit
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
    """Create a booking"""
    user = await get_current_user(authorization, request)
    
    # Get service
    service = await db.services.find_one({"service_id": booking_data.service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Check for conflicts
    booking_date_str = booking_data.booking_date.isoformat()
    existing = await db.bookings.find_one({
        "provider_id": service["provider_id"],
        "booking_date": booking_date_str,
        "status": {"$in": ["pending", "confirmed"]}
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Time slot already booked")
    
    booking = Booking(
        user_id=user["user_id"],
        provider_id=service["provider_id"],
        service_id=booking_data.service_id,
        booking_date=booking_data.booking_date
    )
    
    booking_dict = booking.model_dump()
    booking_dict['created_at'] = booking_dict['created_at'].isoformat()
    booking_dict['booking_date'] = booking_dict['booking_date'].isoformat()
    
    await db.bookings.insert_one(booking_dict)
    
    # Send notification email
    await send_email_async(
        user["email"],
        "CareLink - Booking Confirmation",
        f"""
        <h1>Booking Confirmed!</h1>
        <p>Your booking has been created successfully.</p>
        <p><strong>Service:</strong> {service.get('name', 'Service')}</p>
        <p><strong>Date:</strong> {booking_data.booking_date.strftime('%Y-%m-%d %H:%M')}</p>
        <p>Status: Pending confirmation from provider</p>
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
        {"$set": {"status": "cancelled"}}
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
        {"$set": {"status": "confirmed"}}
    )
    
    return {"message": "Booking confirmed successfully"}

@api_router.put("/bookings/{booking_id}/complete")
async def complete_booking(
    booking_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Mark booking as completed (provider only)"""
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
            "status": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Booking completed successfully"}

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
        last_msg = await db.messages.find_one(
            {"room_id": room["room_id"]},
            {"_id": 0}
        ).sort("created_at", -1).limit(1).to_list(1)
        if last_msg:
            room["last_message"] = last_msg[0]
    
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
