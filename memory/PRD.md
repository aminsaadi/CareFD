# CareLink - Product Requirements Document

## Original Problem Statement
CareLink is a healthcare services marketplace platform in Israel connecting users with healthcare providers. The platform supports provider registration/verification, service listings, bookings, reviews, ratings, and chat communication. The entire application is in Hebrew.

## Subscription Model

### Plans
| Feature | חינם (Free) | פרו (Pro) ₪59/חודש | זהב (Gold) ₪149/חודש |
|---------|-------------|--------------------|-----------------------|
| ניהול פרופיל מתקדם | V | V | V |
| כפתור יצירת קשר (צ'אט/טלפון/וואצאפ) | V | V | V |
| שירותים | 1 בלבד | ללא הגבלה | ללא הגבלה |
| הזמנות/חודש | 10 | ללא הגבלה | ללא הגבלה |
| ניהול קליניקות/סניפים | X | עד 5 | ללא הגבלה |
| פרופיל מקודם | X | V | V |
| תווית מומלץ | X | V | V |
| ניהול צוות | X | X | V (ללא הגבלה) |
| תמיכה ולווי צוות | X | V | V |

### Pricing
- Pro: ₪59/חודש, ₪600/שנה
- Gold: ₪149/חודש, ₪1,500/שנה
- All managed via admin panel

## Completed Features

### Phase 1-8 (Previously completed)
- Full authentication, provider/user system, admin dashboard
- Services, bookings, reviews, chat, notifications
- Advanced search, verification, dynamic booking form

### Phase 9 - Booking Lifecycle & Reviews (Feb 24, 2026)
- Full booking status lifecycle with Hebrew labels
- Admin review approval system
- Calendar view for providers

### Phase 10 - Booking Form & Service Cards Upgrade (Feb 24, 2026)
- Quick-fill buttons, toast notifications, upgraded service cards

### Phase 11 - UI Cleanup & Data Sync (Feb 24, 2026)
- ScrollToTop, footer synced with admin, GenericPage for dynamic pages

### Phase 12 - Subscription System (Feb 24, 2026)
- **3 subscription tiers:** Free, Pro (₪59/mo), Gold (₪149/mo)
- **Provider Dashboard tabs:** Subscription (upgrade/cancel), Clinics, Team
- **Admin subscription management:** Edit plans, prices, features
- **Service limit enforcement:** Free = 1 service, Pro/Gold = unlimited
- **Clinics management:** Pro+ can manage multiple locations with navigation
- **Team management:** Gold-only, add staff members with roles
- **Upgrade banner:** Shows in free tier overview dashboard
- **Payment:** Infrastructure only (no real payment processing yet)

## Pending Features

### P1 - Backend Refactoring (HIGH PRIORITY)
- Monolithic server.py (7500+ lines) → separate router files

### P2 - PayPal/Payment Integration
- Connect real payment to subscription upgrades

### P3 - Provider Image Gallery
### P4 - SMS Reminders

## Testing Results
- Iteration 22: Booking & Review - 94.7% backend, 100% frontend
- Iteration 23: ServiceCard upgrades - 91.7% frontend
- Iteration 24: Subscription System - **100% backend (28/28), 100% frontend**

## Testing Credentials
- Admin: admin@carelink.co.il / password
- User: user@carelink.co.il / password
- Provider: provider@carelink.co.il / password

## Mocked Integrations
- **PayPal** - Awaiting API credentials
- **Payment Processing** - Infrastructure only, no real charges
