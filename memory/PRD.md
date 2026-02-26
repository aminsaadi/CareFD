# CareLink - Service Marketplace Platform

## Architecture
Backend: /app/backend/app/ (database.py, models.py, utils.py, main.py, routers/ with 18 files)
Frontend: /app/frontend/src/ (context/, components/, pages/)

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
- **Show/hide password toggle on ALL password fields across the site**
- **Improved error messages for login/register (network, server, specific errors)**

## Completed Tasks
- Feb 24: Fixed booking button + chat bugs
- Feb 25: Backend refactoring, Booking Model V2, Dashboard features, Notifications, Mobile fix
- Feb 26: Admin bugs, Admin Users/Providers table improvements
- Feb 26: **Show password toggle (7 files: Login, Register, ProviderRegister, ResetPassword, Dashboard, ProviderDashboard, AdminUsers)**
- Feb 26: **Improved error messages in Login/Register/ProviderRegister for better production debugging**

## Mocked: PayPal, Subscription payments

## Test Credentials
- Admin: admin@carelink.co.il / password
- User: user@carelink.co.il / password
- Provider: provider@carelink.co.il / password

## Backlog
- P2: PayPal integration (blocked on API keys)
- P3: Provider image gallery
- P4: SMS reminders

## Known Issues
- Production (carelink.co.il): Login/Register shows error - needs new deploy + Cloudflare cache clear
