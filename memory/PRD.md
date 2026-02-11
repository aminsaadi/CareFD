# CareLink - Product Requirements Document

## Original Problem Statement
Build a comprehensive marketplace platform named "CareLink" connecting healthcare service providers with users in Israel. The platform supports multiple user roles (User/Patient, Service Provider, Administrator) with RTL support for Hebrew and Arabic.

## Core Requirements

### User Roles
1. **Patient** - Can search providers, book services, create requests, chat with providers
2. **Provider** - Can manage profile, services, respond to requests, manage bookings
3. **Admin** - Platform management, analytics, reports

### Features Implemented ✅
- [x] User authentication (email/password & Google OAuth)
- [x] Multi-language support (Hebrew, Arabic, English) with RTL
- [x] Custom branding (CareLink logo, teal/navy color scheme)
- [x] Provider management (create, update, search)
- [x] Service management (create, search)
- [x] Booking system with calendar
- [x] Request & Offer system
- [x] Chat system (rooms, messages)
- [x] Review system
- [x] Dashboards (User, Provider, Admin)
- [x] Publicly accessible provider/service pages
- [x] Global footer component
- [x] **Redesigned homepage with dummy data** (Feb 2025)
- [x] **Service categories section**
- [x] **Statistics display (250+ providers, 500+ services, etc.)**
- [x] **Testimonials section**
- [x] **"How it works" section**
- [x] **Hero search bar with type selector and quick tags**
- [x] **Professional provider profile page with tabs, stats, reviews**
- [x] **NEW: Redesigned Login page (split layout, branding)**
- [x] **NEW: Redesigned Register page (benefits list, social proof)**
- [x] **NEW: Dedicated Provider Registration page (2-step form)**
- [x] **NEW: Language switcher dropdown with flags**
- [x] **NEW: Search icon in Navbar with expandable search bar**
- [x] **NEW: Verified badge (מאומת) on provider cards/profiles**
- [x] **NEW: Recommended badge (מומלץ) on provider cards/profiles**
- [x] **NEW: Service type indicators (home visit, video call, clinic, phone)**
- [x] **NEW: WhatsApp & Phone buttons on provider cards/profiles**

### Features Pending 🔄
- [ ] **P1: Admin Dashboard Features** - Analytics, Reports & Exports, Notifications
- [ ] **P1: Advanced Search Engine** - Global search across providers/services
- [ ] **P2: Email Integration** - Using Resend (free tier)
- [ ] **P2: Map Integration** - Using OpenStreetMap + Leaflet (free)
- [ ] **P3: Payment Gateway** - Deferred by user

## Technical Architecture

### Backend
- **Framework:** FastAPI (Python)
- **Database:** MongoDB
- **Auth:** JWT + Google OAuth (Emergent Auth)
- **Email:** Resend (configured, not active)

### Frontend
- **Framework:** React
- **Styling:** Tailwind CSS
- **UI Components:** Custom + Shadcn/ui
- **i18n:** i18next with RTL support
- **Icons:** react-icons (FontAwesome)

### Key Files
- `/app/backend/server.py` - All API endpoints and models
- `/app/frontend/src/pages/Landing.js` - Homepage
- `/app/frontend/src/data/dummyData.js` - Demo data
- `/app/frontend/src/i18n.js` - Translations
- `/app/frontend/tailwind.config.js` - Theme colors

## Database Schema (MongoDB Collections)
- `users` - User accounts
- `user_sessions` - Auth sessions
- `providers` - Provider profiles
- `services` - Provider services
- `requests` - User service requests
- `offers` - Provider offers on requests
- `bookings` - Scheduled appointments
- `reviews` - Provider reviews
- `chat_rooms` - Chat conversations
- `messages` - Chat messages

## API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/session` - Google OAuth session
- `GET /api/providers` - List providers
- `GET /api/services` - List services
- `GET /api/requests` - List requests
- `POST /api/bookings` - Create booking
- `POST /api/chat/rooms` - Create chat room
- `POST /api/chat/messages` - Send message

## Design Guidelines
- **Primary Color:** Teal (#19B8BA)
- **Secondary Color:** Navy (#1E4D5F)
- **Font:** Inter (body), Outfit (headings)
- **Direction:** RTL for Hebrew/Arabic

## Last Update
- **Date:** February 2025
- **Task:** Homepage redesign with dummy data
- **Status:** COMPLETED
