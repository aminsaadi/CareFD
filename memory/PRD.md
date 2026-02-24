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
- Provider Dashboard: booking management, calendar view
- User Dashboard: completion confirmation, write review links
- WriteReview Page (/review/:bookingId)
- Admin Reviews Management (/admin/reviews)
- Email notifications for status changes

#### Phase 10 - Booking Form & Service Cards Upgrade (Feb 24, 2026)
- BookingForm: fill-my-details/address buttons, success/error dialogs
- BookService: fill-my-address/contact buttons, toast notifications
- ServiceCard: price units, category labels, fixed provider link
- ProviderProfile: price units, type/category badges

#### Phase 11 - UI Cleanup & Data Sync (Feb 24, 2026)
- **Border color change:** carelink-teal-pale from #ACEDEA (teal) to #E2E8F0 (light gray) for cleaner look
- **ScrollToTop:** Added component to fix page navigation scrolling to top
- **Footer synced with admin:** Footer dynamically loads static pages from admin panel
- **GenericPage component:** Dynamic page rendering for admin-created static pages (/page/:slug)
- **Regions/cities/categories:** Already synced from database via API

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
- Iteration 23: ServiceCard/BookService/ProviderProfile upgrades - 91.7% frontend

## Mocked Integrations
- **PayPal** - Waiting for API credentials

## Technical Debt
- **HIGH:** Monolithic server.py (7200+ lines) needs refactoring into separate router files
