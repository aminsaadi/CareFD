# CareLink - Product Requirements Document

## Original Problem Statement
Build a comprehensive marketplace platform named "CareLink" connecting healthcare service providers with users in Israel. The platform supports multiple user roles (User/Patient, Service Provider, Administrator) with RTL support for Hebrew and Arabic.

## Core Requirements

### User Roles
1. **Patient** - Can search providers, book services, create requests, chat with providers
2. **Provider** - Can manage profile, services, respond to requests, manage bookings
3. **Admin** - Platform management, user/provider verification, analytics, reports

### Features Implemented ✅
- [x] User authentication (email/password & Google OAuth)
- [x] Multi-language support (Hebrew, Arabic, English) with RTL
- [x] Custom branding (CareLink logo, teal/navy color scheme)
- [x] Provider management (create, update, search)
- [x] Service management (create, search)
- [x] Booking system with calendar
- [x] Request & Offer system
- [x] Chat system (rooms, messages)
- [x] Review system (detailed ratings)
- [x] Publicly accessible provider/service pages
- [x] Global footer component
- [x] Redesigned homepage with dummy data
- [x] Service categories section
- [x] Statistics display
- [x] Testimonials section
- [x] Hero search bar with type selector
- [x] Professional provider profile page
- [x] Redesigned Login & Register pages
- [x] Dedicated Provider Registration page
- [x] Language switcher dropdown
- [x] Search icon in Navbar
- [x] Verified & Recommended badges
- [x] Service type indicators
- [x] WhatsApp & Phone buttons
- [x] Advanced Search with geographic filters (location, radius)
- [x] Full User Dashboard (overview, bookings, requests, messages, favorites, settings)
- [x] Full Provider Dashboard (bookings management, services, reviews, profile, stats, verification)
- [x] Full Admin Dashboard (users, providers, pending verification, bookings, reports, notifications, settings)
- [x] Notifications System (bell icon, real-time updates, read/unread status)
- [x] Admin broadcast notifications
- [x] **NEW: Provider Verification System**
  - Providers start with "pending" status
  - Document upload (ID card, license, certificates)
  - Admin gets notification on new provider registration
  - Admin can view documents, approve or reject with reason
  - Provider gets notification on approval/rejection
  - Verified badge shown on approved providers
- [x] **NEW: Enhanced Booking System**
  - Detailed booking form (client details, contact person, service location)
  - Location picker with map integration
  - Provider receives notification on new booking
  - Provider can confirm/complete bookings
  - Status workflow: pending → confirmed → in_progress → provider_completed → completed
  - Client confirms completion and records payment amount
  - Client can write detailed review (service quality, punctuality, communication, price value)
- [x] **NEW: File Upload System**
  - Support for PDF, JPG, PNG, WebP
  - Max file size 10MB
  - Stored locally with unique filenames

### Features Pending 🔄
- [ ] **P2: Email Integration** - Using Resend for notifications (API key needed from user)
- [ ] **P2: Real-time Chat** - WebSocket integration with socket.io

### Test Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@carelink.co.il | Admin123! |
| Provider (Verified) | provider@carelink.co.il | Provider123! |
| Provider (Pending) | newprovider@carelink.co.il | Test123! |
| User | user@carelink.co.il | User123! |

## Architecture

### Backend (FastAPI + MongoDB)
- `/app/backend/server.py` - Main API server
- Key models: User, Provider, Service, Booking, Review, Notification
- Verification workflow with document management
- Complete booking lifecycle management

### Frontend (React + Tailwind CSS)
- `/app/frontend/src/pages/` - Main pages (Landing, Login, Providers, etc.)
- `/app/frontend/src/components/` - Reusable components
  - `BookingForm.js` - Detailed booking form
  - `CompletionConfirmDialog.js` - Service completion & review
  - `VerificationDocuments.js` - Provider document upload
- Three dashboards: Dashboard.js (user), ProviderDashboard.js, AdminDashboard.js

### Key API Endpoints
- Authentication: `/api/auth/login`, `/api/auth/register`
- Providers: `/api/providers`, `/api/providers/me`, `/api/providers/documents`
- Admin: `/api/admin/providers/pending`, `/api/admin/providers/{id}/verify`, `/api/admin/providers/{id}/reject`
- Bookings: `/api/bookings`, `/api/bookings/my`, `/api/bookings/{id}/confirm`, `/api/bookings/{id}/provider-complete`, `/api/bookings/{id}/client-confirm`
- Services: `/api/services`, `/api/services/my`
- Reviews: `/api/reviews`
- Notifications: `/api/notifications`
- Files: `/api/upload`, `/api/files/{filename}`

## Database Schema

### Provider (Extended)
```javascript
{
  provider_id, user_id, provider_type, business_name, description,
  specializations, location, rating, total_reviews,
  is_verified, is_recommended,
  verification_status: "pending" | "documents_submitted" | "verified" | "rejected",
  verification_documents: [{ document_id, document_type, file_url, status }],
  verification_notes
}
```

### Booking (Extended)
```javascript
{
  booking_id, user_id, provider_id, service_id, booking_date, booking_time,
  status: "pending" | "confirmed" | "in_progress" | "provider_completed" | "completed" | "cancelled",
  client_name, client_phone, client_email,
  contact_person: { name, phone, relationship },
  service_location: { address, city, floor, apartment, entry_code, notes },
  final_price, payment_notes,
  service_name, provider_name, user_name
}
```

### Review (Extended)
```javascript
{
  review_id, user_id, provider_id, booking_id,
  rating, comment,
  service_quality, punctuality, communication, price_value,
  would_recommend
}
```

## Last Update
Date: February 11, 2026
Completed: Provider verification system and enhanced booking flow
