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
| **ניסיון חינם** | - | **30 יום** | - |

### Pricing
- Pro: ₪59/חודש, ₪600/שנה + 30 יום ניסיון חינם
- Gold: ₪149/חודש, ₪1,500/שנה
- All managed via admin panel

## Completed Features

### Phase 1-11 (Previously completed)
- Full authentication, provider/user system, admin dashboard
- Services, bookings, reviews, chat, notifications, advanced search
- Booking lifecycle, review moderation, dynamic booking form
- ScrollToTop, footer sync, UI cleanup

### Phase 12 - Subscription System (Feb 24, 2026)
- 3 subscription tiers with admin management
- Provider Dashboard: Subscription/Clinics/Team tabs
- Service limit enforcement, upgrade banners
- **Payment:** Infrastructure only (MOCKED)

### Phase 13 - Trial + Redirect Fix (Feb 24, 2026)
- **30 Day Free Trial:** for Pro plan, one-time per provider
- **Landing page redirect fix:** removed aggressive 401 redirect from API interceptor
- Trial shows countdown date, banner for free users, blocks double use

## Pending Features
- P1: Backend Refactoring (server.py 7500+ lines)
- P2: Real Payment Integration (PayPal/Stripe)
- P3: Provider Image Gallery
- P4: SMS Reminders

## Testing Credentials
- Admin: admin@carelink.co.il / password
- User: user@carelink.co.il / password
- Provider: provider@carelink.co.il / password

## Mocked Integrations
- PayPal - Awaiting API credentials
- Payment Processing - Infrastructure only
