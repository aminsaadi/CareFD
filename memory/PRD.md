# CareLink - Service Marketplace Platform

## Original Problem Statement
A full-stack healthcare service marketplace platform (CareLink) allowing users to find and book services from providers. Features admin dashboard, provider management, user-provider chat, booking lifecycle, and review system. Hebrew-only, targeting carelink.co.il.

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn/UI, react-router-dom, sonner, react-big-calendar
- **Backend:** Python, FastAPI, Motor (async MongoDB)
- **Database:** MongoDB Atlas

## Architecture
```
/app/backend/app/
  database.py, models.py, utils.py, main.py
  routers/ (18 files: auth, providers, services, bookings, reviews, chat, notifications, admin, etc.)
/app/frontend/src/
  context/ (AuthContext, NotificationContext)
  components/ (Navbar, NotificationBell, BookingCalendar, provider/BookingDetailsModal, etc.)
  pages/ (BookService, Dashboard, ProviderDashboard, etc.)
  styles/calendar.css
```

## Implemented Features
- User/Provider/Admin role system with document verification
- Advanced search filtering
- Dynamic multi-step booking form (6 categories x 5 delivery types)
- Complete booking lifecycle, moderated review system
- 3-tier subscription model with 30-day free trial
- User-provider chat system
- Email & push notifications infrastructure
- Provider Dashboard: booking details modal, request change, contact user
- User Dashboard: change request approve/reject
- Real-time notification system (10s polling, toast popups)
- **Mobile responsive booking form** (Feb 25, 2026)

## Completed Tasks
- Feb 24: Fixed booking button + chat messages bugs
- Feb 25: Backend refactoring (18 routers), Booking Model V2, Dashboard features, Real-time notifications
- Feb 25: **Fixed mobile booking form**: price overflow, calendar day overflow (short Hebrew day names), empty delivery section fallback, responsive padding

## Mocked Integrations
- PayPal: MOCKED (awaiting API keys)
- Subscription payments: Simulated

## Test Credentials
- Admin: admin@carelink.co.il / password
- User: user@carelink.co.il / password
- Provider: provider@carelink.co.il / password

## Backlog
- **P2:** PayPal integration (blocked on API keys)
- **P3:** Provider image gallery
- **P4:** SMS reminders

## Known Issues
- Production caching (Cloudflare - user-side)

## Test Reports
- /app/test_reports/iteration_28.json - Dashboard features (15/15)
- /app/test_reports/iteration_29.json - Notification system (12/12)
