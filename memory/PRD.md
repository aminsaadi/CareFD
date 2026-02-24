# CareLink - Product Requirements Document

## Original Problem Statement
CareLink is a healthcare services marketplace platform in Israel connecting users with healthcare providers. The platform supports provider registration/verification, service listings, bookings, reviews, ratings, and chat communication. The entire application is in Hebrew.

## User Personas
1. **Users (Patients/Clients)** - Search and book healthcare services
2. **Providers (Healthcare professionals)** - Offer services, manage appointments
3. **Admins** - Platform management, provider verification, review moderation

## Core Features

### Completed Features

#### Phase 1-6 - Foundation through User Dashboard
- User authentication (JWT + Google OAuth)
- Provider registration, profile, verification
- Service creation and management (4 categories: visit/hourly/consultation/product)
- Advanced search with GPS, filters, map view
- Admin dashboard with full CRUD
- User/Provider dashboards with stats
- Forgot Password / Reset Password flow
- Chat system, notifications, favorites

#### Phase 7 - Static Pages & Professions (Feb 23, 2026)
- Rich Text Editor for static pages (ReactQuill)
- Professions & Categories Management (3-level hierarchy)
- Regions & Cities Management (8 regions, 102 cities)
- Map view for providers (Leaflet/OpenStreetMap)

#### Phase 8 - Verification & Advanced Search (Feb 24, 2026)
- User/Provider document verification system
- Advanced unified search filters (gender, languages, health funds)
- Dynamic multi-step booking form
- Mobile-responsive notification UI

#### Phase 9 - Booking Lifecycle & Review System (Feb 24, 2026) ✅ NEW
- **Full Booking Status Lifecycle:**
  - pending → confirmed → provider_completed → completed
  - pending → rejected / on_hold / cancelled
- **Provider Dashboard Enhancements:**
  - Booking management with confirm/reject/hold/mark-complete actions
  - Calendar view for confirmed bookings grouped by date
  - Hebrew status labels throughout
- **User Dashboard Enhancements:**
  - Completion confirmation dialog with payment recording
  - "Write Review" button for completed bookings
  - Booking detail modal with status-specific actions
- **WriteReview Page (/review/:bookingId):**
  - Star ratings (overall + 4 detailed categories)
  - Comment with minimum length validation
  - "Would recommend" toggle
  - Pending admin approval notice
- **Admin Reviews Management (/admin/reviews):**
  - Filter tabs: pending/approved/rejected/all
  - Approve/reject with reason
  - User and provider info display
  - Provider rating auto-recalculation on approval
- **Email Notifications:**
  - Booking confirmation email to client
  - Status change notifications

### Pending Features

#### P1 - Backend Refactoring (HIGH PRIORITY)
- The monolithic server.py (7200+ lines) needs splitting into router modules
- Target: /backend/app/routers/ (auth.py, providers.py, bookings.py, admin.py, etc.)

#### P2 - PayPal Live Integration
- Waiting for PayPal API credentials

#### P3 - Provider Image Gallery
- Allow providers to upload multiple photos

#### P4 - SMS Reminders
- Automated reminders before appointments

## Technical Architecture
- **Frontend:** React, Tailwind CSS, react-router-dom, Axios
- **Backend:** Python, FastAPI, MongoDB (Motor/Pymongo)
- **Database:** MongoDB Atlas (cloud)
- **Email:** Gmail SMTP with App Password

## Key API Endpoints

### Booking Lifecycle
- POST /api/bookings - Create booking
- GET /api/bookings/my - User's bookings
- GET /api/bookings/provider - Provider's bookings
- PUT /api/bookings/{id}/confirm - Provider confirms
- PUT /api/bookings/{id}/reject - Provider rejects
- PUT /api/bookings/{id}/hold - Provider holds
- PUT /api/bookings/{id}/provider-complete - Provider marks complete
- PUT /api/bookings/{id}/client-confirm - User confirms completion
- PUT /api/bookings/{id}/status - Generic status update

### Reviews
- POST /api/reviews - Create review (requires completed booking)
- GET /api/reviews/my - User's reviews
- GET /api/providers/{id}/reviews - Provider's approved reviews
- GET /api/admin/reviews - Admin: all reviews with status filter
- PUT /api/admin/reviews/{id}/approve - Admin approves
- PUT /api/admin/reviews/{id}/reject - Admin rejects

## Testing Credentials
- Admin: admin@carelink.co.il / password
- User: user@carelink.co.il / password
- Provider: provider@carelink.co.il / password

## Testing Results
- Iteration 22: Booking & Review Lifecycle - 94.7% backend (18/19), 100% frontend ✅

## Mocked Integrations
1. **PayPal** - Waiting for API credentials

## Technical Debt
- **HIGH:** Monolithic server.py (7200+ lines) needs refactoring into separate router files
