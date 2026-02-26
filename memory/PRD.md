# CareLink - Service Marketplace Platform

## Original Problem Statement
Full-stack healthcare service marketplace (React/FastAPI/MongoDB Atlas). Hebrew-only, targeting carelink.co.il.

## Architecture
Backend: /app/backend/app/ (database.py, models.py, utils.py, main.py, routers/ with 18 files)
Frontend: /app/frontend/src/ (context/, components/, pages/)

## Implemented Features
- User/Provider/Admin roles with document verification
- Dynamic booking form (6 categories x 5 delivery types)
- Complete booking lifecycle, moderated reviews
- 3-tier subscription model with trial
- Chat system, email & push notifications
- Provider Dashboard: booking details, request change, contact user
- User Dashboard: change request approve/reject
- Real-time notification system (10s polling, toast popups)
- Mobile responsive booking form
- Admin Users: separate Status (פעיל/מושעה) and Verification columns
- Admin Providers: Provider ID, User ID, Status, Verification columns + detailed provider modal
- Admin: password reset, user suspend → auto provider deactivation

## Completed Tasks
- Feb 24: Fixed booking button + chat bugs
- Feb 25: Backend refactoring, Booking Model V2, Dashboard features, Notifications, Mobile fix
- Feb 26: Admin bugs (provider deactivation, password reset)
- Feb 26: Admin Users table: split status/verification columns
- Feb 26: **Admin Providers: new columns (Provider ID, User ID, Status, Verification) + detailed provider modal with actions**

## New Backend Endpoints
- GET /api/admin/providers/{provider_id} - Single provider details with services_count, bookings_count

## Mocked: PayPal, Subscription payments

## Test Credentials
- Admin: admin@carelink.co.il / password
- User: user@carelink.co.il / password  
- Provider: provider@carelink.co.il / password

## Backlog
- P2: PayPal integration (blocked on API keys)
- P3: Provider image gallery
- P4: SMS reminders
