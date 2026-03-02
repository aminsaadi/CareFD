# CareLink - Service Marketplace Platform

## Architecture
Backend: /app/backend/app/ (database.py, models.py, utils.py, localities.py, routers/ with 18 files)
Frontend: /app/frontend/src/ (context/, components/, pages/, data/)

## Implemented Features
- User/Provider/Admin roles with document verification
- Dynamic booking form (6 categories x 5 delivery types)
- Complete booking lifecycle, moderated reviews
- 3-tier subscription, chat, email/push notifications
- Provider Dashboard: booking details, request change, contact user
- User Dashboard: change request approve/reject
- Real-time notification system (10s polling, toast popups)
- Mobile responsive booking form
- Admin: Provider deactivation, password reset, user suspend → auto provider deactivation
- Admin Users: separate Status + Verification columns
- Admin Providers: Provider ID, User ID, Status, Verification columns + detailed modal
- Show/hide password toggle on ALL password fields across the site
- Improved error messages for login/register (network, server, specific errors)
- **Provider search by location/radius - FIXED & WORKING**
- **Israeli localities database with 200+ cities and coordinates**
- **Auto-geocoding for provider locations on profile update**
- **Backend /api/localities endpoint for city search with coordinates**
- **Region-based search: "מרכז" includes Tel Aviv and Sharon area**
- **Distance display on provider cards when searching by location/region**
- **Website Accessibility (Israeli Standard 5568 / WCAG 2.0 AA)** - floating button with 11 accessibility options
- **Push Notifications for all booking events, reviews, and chat** - both provider and client receive push

## Completed Tasks
- Feb 24: Fixed booking button + chat bugs
- Feb 25: Backend refactoring, Booking Model V2, Dashboard features, Notifications, Mobile fix
- Feb 26: Admin bugs, Admin Users/Providers table improvements
- Feb 26: Show password toggle, Improved error messages
- Mar 1: **Fixed provider search (double verification filter bug), added localities with coordinates, radius-based search working**
- Mar 1: **Region-based search: merged Tel Aviv into Center region, distance displayed on provider cards**
- Mar 1: **Website Accessibility (IS 5568): floating button + 11 features (font size, contrast, grayscale, link highlight, readable font, stop animations, big cursor, reading guide, focus highlight, hide images, reset)**
- Mar 2: **Push notifications for all events (bookings, reviews, chat) to both provider and client**
- Mar 2: **Fixed notification routing - click navigates to correct page/tab based on user role**
- Mar 2: **Fixed user settings - profile_color saves, ?tab= URL param works in dashboards**
- Mar 2: **Fixed /admin/overview route, fixed CORS/withCredentials login bug**

## Mocked: PayPal, Subscription payments

## Test Credentials
- Admin: admin@carelink.co.il / password
- User: user@carelink.co.il / password
- Provider: provider@carelink.co.il / password

## Backlog
- P2: PayPal integration (blocked on API keys)
- P3: Provider image gallery
- P4: SMS reminders
- Low: Refactor show-password into reusable PasswordInput component

## Known Issues
- Production (carelink.co.il): Login/Register shows error - needs new deploy + Cloudflare cache clear
