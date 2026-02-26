# CareLink - Service Marketplace Platform

## Original Problem Statement
A full-stack healthcare service marketplace platform (CareLink) allowing users to find and book services from providers. Hebrew-only, targeting carelink.co.il.

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI, react-router-dom, sonner
- Backend: Python, FastAPI, Motor (async MongoDB)
- Database: MongoDB Atlas

## Architecture
/app/backend/app/ - database.py, models.py, utils.py, main.py, routers/ (18 files)
/app/frontend/src/ - context/ (Auth, Notification), components/, pages/

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
- **Admin: Provider deactivation, password reset, user suspend → auto provider deactivation**

## Completed Tasks
- Feb 24: Fixed booking button + chat bugs
- Feb 25: Backend refactoring, Booking Model V2, Dashboard features, Real-time notifications, Mobile booking fix
- Feb 26: **Admin bugs fixed**: provider deactivation (added is_active to allowed_fields), password reset (added bcrypt import), user suspension auto-deactivates provider

## Mocked: PayPal, Subscription payments

## Test Credentials
- Admin: admin@carelink.co.il / password
- User: user@carelink.co.il / password
- Provider: provider@carelink.co.il / password

## Backlog
- P2: PayPal integration (blocked on API keys)
- P3: Provider image gallery
- P4: SMS reminders

## Test Reports
- iteration_28.json - Dashboard features (15/15)
- iteration_29.json - Notification system (12/12)
