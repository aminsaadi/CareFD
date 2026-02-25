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
  server.py              # Slim entry point
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
/app/frontend/src/
  context/
    AuthContext.js        # Auth state management
    NotificationContext.js # NEW - Real-time notification polling + toast popups
  components/
    NotificationBell.js   # UPDATED - Uses NotificationContext
    provider/
      BookingDetailsModal.js # NEW - Provider booking details view
```

## Booking Model V2 (Healthcare)
### 6 Service Categories: consultation, visit, product, hourly, procedure, series
### 5 Delivery Types: home, clinic, hospital, virtual, delivery

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
  - View full booking details modal (BookingDetailsModal)
  - Request date/time change with reason (sends email + notification)
  - Contact user directly via chat from any booking
- **User Dashboard - Change Request Management:**
  - Enhanced booking details modal with pricing, location, notes
  - View and respond to provider change requests (approve/reject)
  - Change request approval auto-updates booking date/time
- **Real-Time Notification System:**
  - NotificationContext with 10-second polling
  - Automatic toast popups (sonner) for new notifications
  - Smart diff detection - only shows toasts for truly new notifications
  - New notification types: booking_change_requested, booking_provider_completed
  - Centralized notification state shared across all components
  - NotificationBell uses context (no duplicate polling)

## Key API Endpoints
- `GET /api/bookings/{booking_id}` - Single booking with enriched user/provider/service info
- `PUT /api/bookings/{booking_id}/request-change` - Provider requests date/time change
- `PUT /api/bookings/{booking_id}/respond-change` - User approves/rejects change request
- `GET /api/notifications?limit=20` - Get notifications with unread_count
- `PUT /api/notifications/{id}/read` - Mark single notification as read
- `PUT /api/notifications/read-all` - Mark all as read

## Mocked/Pending Integrations
- PayPal: MOCKED (awaiting API keys)
- Subscription payments: Simulated (no real gateway)

## Test Credentials
- Admin: admin@carelink.co.il / password
- User: user@carelink.co.il / password
- Provider: provider@carelink.co.il / password

## Backlog (Prioritized)
- **P2:** PayPal integration (blocked on API keys)
- **P3:** Provider image gallery
- **P4:** SMS reminders

## Known Issues
- Production caching (Cloudflare - user-side)

## Test Reports
- /app/test_reports/iteration_7.json - Post-refactoring
- /app/test_reports/iteration_8.json - Post-bug-fix
- /app/test_reports/iteration_28.json - Dashboard features (15/15 backend, 100% frontend)
- /app/test_reports/iteration_29.json - Notification system (12/12 backend, 100% frontend)
