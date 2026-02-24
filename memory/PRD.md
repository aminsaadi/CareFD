# CareLink - Service Marketplace Platform

## Original Problem Statement
A full-stack service marketplace platform (CareLink) allowing users to find and book services from providers. Features admin dashboard, provider management, user-provider chat, booking lifecycle, and review system. Hebrew-only, targeting carelink.co.il.

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn/UI, react-router-dom, sonner, react-big-calendar
- **Backend:** Python, FastAPI, Motor (async MongoDB)
- **Database:** MongoDB Atlas

## Core Architecture
- Frontend: /app/frontend (port 3000)
- Backend: /app/backend (port 8001, prefix /api)
- All API calls via REACT_APP_BACKEND_URL

## Implemented Features (Complete)
- User/Provider/Admin role system with document verification
- Advanced search filtering (providers & services)
- Dynamic multi-step booking form (home_visit, clinic_visit, video_call, phone_call, hourly, product)
- Complete booking lifecycle (pending → confirmed → completed/cancelled)
- Moderated review system (admin approval required)
- 3-tier subscription model (Free, Pro, Gold) with 30-day free trial
- User-provider chat system
- Email notifications (SMTP/Gmail)
- Push notifications infrastructure
- Forgot password flow
- ScrollToTop navigation fix
- Dynamic footer links from admin
- Clinics & Team management infrastructure

## P0 Bugs Fixed (Feb 24, 2026)
1. **Booking "Confirm and Book" button unresponsive** - Frontend sent service_address as nested object but backend expected flat string fields. Fixed in BookService.js handleBooking().
2. **Chat messages not appearing** - other_user enrichment failed silently, unread_count never computed. Fixed in server.py chat endpoints.

## Mocked/Pending Integrations
- PayPal: MOCKED (awaiting API keys)
- Subscription payments: Simulated (no real gateway)

## Test Credentials
- Admin: admin@carelink.co.il / password
- User: user@carelink.co.il / password
- Provider: provider@carelink.co.il / password

## Backlog (Prioritized)
- **P1:** Backend refactoring - split monolithic server.py into routers
- **P2:** PayPal integration (blocked on API keys)
- **P3:** Provider image gallery
- **P4:** SMS reminders

## Known Issues
- Production caching (Cloudflare - user-side)
- Public provider search returns empty (test provider verification_status=None)
