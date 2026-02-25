# CareLink - Service Marketplace Platform

## Original Problem Statement
A full-stack healthcare service marketplace platform (CareLink) allowing users to find and book services from providers. Features admin dashboard, provider management, user-provider chat, booking lifecycle, and review system. Hebrew-only, targeting carelink.co.il.

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn/UI, react-router-dom, sonner, react-big-calendar
- **Backend:** Python, FastAPI, Motor (async MongoDB)
- **Database:** MongoDB Atlas

## Architecture
```
/app/backend/
  server.py              # Slim entry point - imports & includes routers
  app/
    database.py           # MongoDB connection
    models.py             # All Pydantic models
    utils.py              # Shared helpers (auth, email, push, notifications)
    routers/              # 18 separate route files
      auth.py, providers.py, services.py, requests.py,
      bookings.py, reviews.py, favorites.py, chat.py,
      notifications.py, admin.py, subscriptions.py,
      clinics.py, team.py, subscriptions_upgrade.py,
      push.py, uploads.py, verification.py, contact.py
```

## Booking Model V2 (Healthcare)

### 6 Service Categories:
1. **consultation (יעוץ)** - Fixed price per consultation
2. **visit (ביקור)** - Service provider visit
3. **product (מוצר)** - Physical/virtual product
4. **hourly (שעתי)** - By hours, shifts, minimum hours
5. **procedure (פעולה)** - Per medical procedure
6. **series (סדרה)** - Series of treatments (num_sessions, series_price)

### 5 Delivery Types:
1. **home** - At client's home (requires address + contact)
2. **clinic** - At provider's clinic
3. **hospital** - Hospital/institution
4. **virtual** - Zoom/WhatsApp/Phone/Google Meet (requires platform selection)
5. **delivery** - Shipping (requires shipping address)

### Dynamic Booking Form:
- Adapts based on category + delivery type combination
- Always: summary, date/time (with skip option), requester details, terms
- Hourly: shift selection (morning/afternoon/night/custom)
- Home: address + contact person fields
- Virtual: platform selection
- Delivery: shipping address
- Series: number of sessions display

## Implemented Features (Complete)
- User/Provider/Admin role system with document verification
- Advanced search filtering (providers & services)
- Dynamic multi-step booking form (6 categories x 5 delivery types)
- Complete booking lifecycle (pending -> confirmed -> completed/cancelled)
- Moderated review system (admin approval)
- 3-tier subscription model (Free, Pro, Gold) with 30-day free trial
- User-provider chat system with unread counts
- Email notifications (SMTP/Gmail)
- Push notifications infrastructure
- Backend refactored into 18 separate routers
- **Provider Dashboard - Enhanced Booking Management:**
  - Card-based booking display with client info, service, date/time, price
  - View full booking details modal (client info, pricing, location, notes, change history)
  - Request date/time change with reason (sends email + notification to user)
  - Contact user directly via chat from any booking
- **User Dashboard - Change Request Management:**
  - Enhanced booking details modal with full pricing breakdown
  - View and respond to provider change requests (approve/reject)
  - Change request approval auto-updates booking date/time

## Completed Tasks
- **Feb 24, 2026:** Fixed P0 bugs - booking button + chat messages
- **Feb 25, 2026:** P1 Backend refactoring - split 7656-line server.py into 18 routers
- **Feb 25, 2026:** Booking Model V2 - Healthcare model with 6 categories, 5 delivery types, dynamic form
- **Feb 25, 2026:** P0 Enhanced Provider & User Dashboards - booking details modal, request change, contact user, respond to changes

## Mocked/Pending Integrations
- PayPal: MOCKED (awaiting API keys)
- Subscription payments: Simulated (no real gateway)

## Test Credentials
- Admin: admin@carelink.co.il / password
- User: user@carelink.co.il / password
- Provider: provider@carelink.co.il / password

## Key API Endpoints (New)
- `GET /api/bookings/{booking_id}` - Single booking with enriched user/provider/service info
- `PUT /api/bookings/{booking_id}/request-change` - Provider requests date/time change
- `PUT /api/bookings/{booking_id}/respond-change` - User approves/rejects change request

## Backlog (Prioritized)
- **P2:** PayPal integration (blocked on API keys)
- **P3:** Provider image gallery
- **P4:** SMS reminders

## Known Issues
- Production caching (Cloudflare - user-side)

## Test Reports
- /app/test_reports/iteration_7.json - Post-refactoring validation
- /app/test_reports/iteration_8.json - Post-bug-fix validation
- /app/test_reports/iteration_28.json - Dashboard features validation (15/15 backend, 100% frontend)
