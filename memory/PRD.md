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

#### Phase 7 - Static Pages & Professions
- Rich Text Editor for static pages (ReactQuill)
- Professions & Categories Management (3-level hierarchy)
- Regions & Cities Management (8 regions, 102 cities)
- Map view for providers (Leaflet/OpenStreetMap)

#### Phase 8 - Verification & Advanced Search
- User/Provider document verification system
- Advanced unified search filters (gender, languages, health funds)
- Dynamic multi-step booking form
- Mobile-responsive notification UI

#### Phase 9 - Booking Lifecycle & Review System (Feb 24, 2026)
- Full Booking Status Lifecycle (pending/confirmed/provider_completed/completed/rejected/on_hold/cancelled)
- Provider Dashboard: booking management (confirm/reject/hold/mark-complete), calendar view
- User Dashboard: completion confirmation, write review links, booking detail modal
- WriteReview Page (/review/:bookingId) with star ratings
- Admin Reviews Management (/admin/reviews) with filter/approve/reject
- Email notifications for status changes

#### Phase 10 - Booking Form & Service Cards Upgrade (Feb 24, 2026)
- **BookingForm (popup):** "הפרטים שלי" + "הכתובת שלי" quick-fill buttons, success/error dialogs
- **BookService (full page):** "הכתובת שלי" + "הפרטים שלי" buttons for address/contact, replaced all alert() with toast.error()
- **ServiceCard:** Upgraded with price units (₪80/לשעה), category labels (ביקור, שעתי), service type badges, fixed provider link (/providers/ path)
- **ProviderProfile service section:** Price with unit, category/type labels

### Pending Features

#### P1 - Backend Refactoring (HIGH PRIORITY)
- The monolithic server.py (7200+ lines) needs splitting into router modules

#### P2 - PayPal Live Integration
- Waiting for PayPal API credentials

#### P3 - Provider Image Gallery
- Allow providers to upload multiple photos

#### P4 - SMS Reminders
- Automated reminders before appointments

## Technical Architecture
- **Frontend:** React, Tailwind CSS, react-router-dom, Axios, Sonner (toasts)
- **Backend:** Python, FastAPI, MongoDB (Motor/Pymongo)
- **Database:** MongoDB Atlas (cloud)
- **Email:** Gmail SMTP with App Password

## Testing Credentials
- Admin: admin@carelink.co.il / password
- User: user@carelink.co.il / password
- Provider: provider@carelink.co.il / password

## Testing Results
- Iteration 22: Booking & Review Lifecycle - 94.7% backend, 100% frontend
- Iteration 23: ServiceCard/BookService/ProviderProfile upgrades - 91.7% frontend (11/12)

## Mocked Integrations
- **PayPal** - Waiting for API credentials

## Technical Debt
- **HIGH:** Monolithic server.py (7200+ lines) needs refactoring into separate router files
