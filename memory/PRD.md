# CareLink - Service Marketplace Platform

## Original Problem Statement
A full-stack service marketplace platform (CareLink) allowing users to find and book services from providers. Features admin dashboard, provider management, user-provider chat, booking lifecycle, and review system. Hebrew-only, targeting carelink.co.il.

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn/UI, react-router-dom, sonner, react-big-calendar
- **Backend:** Python, FastAPI, Motor (async MongoDB)
- **Database:** MongoDB Atlas

## Architecture (Post-Refactoring)
```
/app/backend/
  server.py              # Slim 63 lines - imports & includes routers
  app/
    __init__.py
    database.py           # MongoDB connection (client, db)
    models.py             # All Pydantic models
    utils.py              # Shared helpers (auth, email, push, notifications)
    routers/
      __init__.py
      auth.py             # Auth (register, login, session, forgot-password)
      providers.py        # Provider CRUD, search, profiles
      services.py         # Service CRUD
      requests.py         # Service requests & offers
      bookings.py         # Booking lifecycle
      reviews.py          # Review system (with admin moderation)
      favorites.py        # Provider favorites
      chat.py             # Chat rooms & messages
      notifications.py    # Notification CRUD
      admin.py            # Admin dashboard (users, providers, settings, pages)
      subscriptions.py    # Subscription plans & management
      clinics.py          # Clinic management
      team.py             # Team member management
      subscriptions_upgrade.py  # Upgrade/cancel flows
      push.py             # Push notifications (VAPID)
      uploads.py          # File uploads
      verification.py     # User/provider document verification
      contact.py          # Contact form
```

## Implemented Features (Complete)
- User/Provider/Admin role system with document verification
- Advanced search filtering (providers & services)
- Dynamic multi-step booking form
- Complete booking lifecycle (pending -> confirmed -> completed/cancelled)
- Moderated review system (admin approval)
- 3-tier subscription model (Free, Pro, Gold) with 30-day free trial
- User-provider chat system
- Email notifications (SMTP/Gmail)
- Push notifications infrastructure
- Forgot password flow
- ScrollToTop navigation fix
- Dynamic footer links from admin
- Clinics & Team management infrastructure

## Completed Tasks
- **Feb 24, 2026:** Fixed P0 bugs - booking button + chat messages
- **Feb 25, 2026:** P1 Backend refactoring - split 7656-line server.py into 18 routers + shared modules. 100% regression test pass rate (22/22 backend, all frontend pages).

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
- Public provider search returns empty (test provider verification_status=None)
