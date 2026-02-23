# CareLink - Product Requirements Document

## Original Problem Statement
CareLink is a healthcare services platform in Israel connecting users with healthcare providers. The platform supports:
- Provider registration and verification
- Service listings and bookings
- Reviews and ratings
- Chat communication

## User Personas
1. **Users (Patients/Clients)** - Search and book healthcare services
2. **Providers (Healthcare professionals)** - Offer services, manage appointments
3. **Admins** - Platform management, provider verification

## Core Features

### Completed Features ✅

#### Phase 1 - Foundation
- User authentication (JWT + Google OAuth)
- Provider registration and profile
- Service creation and management
- Basic search functionality

#### Phase 2 - Verification & Booking Flow
- Provider verification system with document upload
- Admin approval/rejection workflow
- Enhanced booking flow with provider/user confirmation
- Review and rating system

#### Phase 3 - Search & Communication
- Improved Search Engine with GPS and filters
- Profile Actions (Share, Favorites, Chat)
- Guest Booking - Book without registration
- Admin Regions Management

#### Phase 4 - Admin Dashboard System
- Professional Admin Dashboard with Light theme
- User Management with suspend/delete
- Provider Management and Verification Queue
- Booking/Services Management
- Static Pages CMS
- Blog Management
- Reports & Analytics with Recharts

#### Phase 5 - Provider Enhancements
- Enhanced Provider Profile (education, certifications, health funds, etc.)
- Shift-based availability system
- Provider Dashboard with profile editing

#### Phase 6 - User Dashboard & Password Reset (Feb 22, 2026)
- User Dashboard overhaul with stats, reviews, bookings
- User Number Display (U...)
- Forgot Password / Reset Password flow
- Admin can reset user passwords

#### Phase 7 - Static Pages Editor & Professions Management (Feb 23, 2026) ✅
- **Rich Text Editor for Static Pages**: ReactQuill-based WYSIWYG editor
  - Admin can create/edit/delete static pages
  - Full formatting toolbar (headers, bold, colors, lists, etc.)
  - RTL support for Hebrew
  - Publish/Draft status toggle
  - Public API: GET /api/pages/{slug}
  
- **Automatic Email to Admins on Provider Registration**
  - In-app notification created for all admins
  - Email notification sent with provider details and verification link
  - Email to new provider with profile completion guide
  - **Note**: Email MOCKED (requires RESEND_API_KEY)

- **Professions & Categories Management** (NEW)
  - 3-level hierarchy: מקצוע → תת-מקצוע → קטגוריה
  - Each profession has **specializations** array (התמחויות)
  - Full CRUD for all levels (create, read, update, delete)
  - Default professions initialized on first load:
    - רפואה (4 התמחויות, 3 תתי-מקצועות)
    - סיעוד (4 התמחויות, 3 תתי-מקצועות)
    - טיפולים (4 התמחויות, 3 תתי-מקצועות)
    - בריאות הנפש (4 התמחויות, 2 תתי-מקצועות)
    - רפואה משלימה (4 התמחויות, 3 תתי-מקצועות)
  - Public API for dropdowns: GET /api/professions

### API Endpoints - Professions (NEW)

```
GET  /api/professions                                    # Public - for dropdowns
GET  /api/admin/professions                              # Admin - full list
POST /api/admin/professions                              # Create profession
PUT  /api/admin/professions/{id}                         # Update profession  
DELETE /api/admin/professions/{id}                       # Delete profession
POST /api/admin/professions/{id}/sub-professions         # Add sub-profession
PUT  /api/admin/sub-professions/{id}                     # Update sub-profession
DELETE /api/admin/sub-professions/{id}                   # Delete sub-profession
POST /api/admin/sub-professions/{id}/categories          # Add category
DELETE /api/admin/categories/{id}                        # Delete category
```

### Data Model - Profession

```json
{
  "profession_id": "prof_xxx",
  "name": "רפואה",
  "name_en": "Medicine",
  "icon": "stethoscope",
  "specializations": ["רפואת משפחה", "רפואה פנימית", "רפואת ילדים"],
  "sub_professions": [
    {
      "sub_profession_id": "sub_xxx",
      "name": "רפואת משפחה",
      "name_en": "Family Medicine",
      "categories": [
        {"category_id": "cat_xxx", "name": "ביקור בית", "name_en": "Home Visit"}
      ]
    }
  ]
}
```

### Completed Features ✅ (Dec 2025)
- Provider Service Form with all 4 categories (visit/hourly/consultation/product)
- Booking price calculation with weekend/travel/shipping fees
- Service CRUD with DELETE endpoint fix

### Pending Features 🔄

#### P1 - Backend Refactoring (HIGH PRIORITY)
- The monolithic server.py file (5000+ lines) needs splitting into router modules
- Target structure: /backend/app/routers/ (auth.py, providers.py, bookings.py, admin.py, etc.)

#### P1 - Admin Notifications/Messages Pages
- /admin/notifications and /admin/messages pages return 404

#### P2 - PayPal Live Integration
- Waiting for PayPal API credentials

#### P2 - Email Integration
- Waiting for RESEND_API_KEY (currently mocked)

### Testing Credentials
- Admin: admin@carelink.co.il / password
- User: user@carelink.co.il / password
- Provider: provider@carelink.co.il / password

### Mocked Integrations
1. **Email (Resend)** - RESEND_API_KEY is empty, emails logged to console
2. **PayPal** - Waiting for API credentials

## Change Log

### Dec 2025 (Current Session)
- **Notifications System (P1 COMPLETE)** ✅ NEW
  - Created `/notifications` page for all users with filtering (read/unread, type)
  - Added "התראות" tab to User Dashboard and Provider Dashboard
  - Updated Admin Notifications page to use real API data
  - Updated Admin Messages page to show real chat rooms
  - Chat messages now trigger notifications to the recipient
  - Clicking notification navigates to relevant page (booking, chat, etc.)
  
- **Unified Font (P1 COMPLETE)** ✅ NEW
  - Changed entire site to use Outfit font consistently (like header)

- **Provider Service Form & Booking Price Calculation (P0 COMPLETE)** ✅
  - Full service CRUD with 4 categories: Visit, Hourly, Consultation, Product
  - Weekend pricing (percentage or fixed surcharge)
  - Travel cost for home visits
  - Shipping options for products with free_shipping_above threshold
  - Minimum hours enforcement for hourly services
  - Price calculation in bookings: base + weekend + travel + shipping
  - Fixed: Added missing DELETE /api/services/{service_id} endpoint

### Feb 23, 2026 (Previous Session)
- **Static Pages Editor (P0 COMPLETE)** - ReactQuill rich text editor
- **Admin Email Notifications (P2 COMPLETE)** - Email to admins on provider registration
- **Professions Management (P0 COMPLETE)** - Full CRUD with 3-level hierarchy + specializations
- **Regions & Cities Management (P0 COMPLETE)**
  - 8 regions of Israel: צפון, חיפה והקריות, השרון, מרכז, ירושלים והסביבה, דרום, שפלה, יהודה ושומרון
  - 102 cities with GPS coordinates (lat/lng)
  - Admin can add/edit/delete regions and cities
  - Each city has Hebrew name, English name, and coordinates
- **Map View for Providers (P0 COMPLETE)** - NEW
  - Leaflet + OpenStreetMap integration (free, no API key needed)
  - Toggle between Grid / List / Map views
  - Provider markers on map with popup details
  - Click marker to see: name, profession, city, distance, rating
  - Link to provider profile from popup
- **Distance Display in Search (P0 COMPLETE)** - NEW
  - GPS button to use user's location
  - Radius selector (5km, 10km, 25km, 50km)
  - Distance badge on each provider card
  - Sort by distance option
  - Backend returns distance_km when coordinates provided

### Testing Results
- Iteration 16: Static Pages - 100% backend, 100% frontend
- Iteration 17: Professions - 100% backend (17/17), 100% frontend  
- Iteration 18: Regions & Map - 100% backend (11/11), 100% frontend
- Iteration 19: Service Types - 88% backend (15/17), 100% frontend
- **Iteration 20: Provider Services & Booking Price - 100% backend (15/15), 100% frontend** ✅

## Service Model (Enhanced - Feb 23, 2026)

### Service Categories (סוגי שירות)
1. **שירות ביקור (Visit)** - שירות הניתן בביקור אחד
2. **שירות שעתי (Hourly)** - שירות לפי שעות עם מינימום שעות
3. **שירות ייעוץ (Consultation)** - שירות ייעוץ מקצועי
4. **מוצר (Product)** - מוצר למכירה עם משלוח

### Delivery Types (אופני מתן שירות)
1. **בבית (Home Visit)** - דורש כתובת מלאה
2. **בבית חולים / מוסד (Hospital)** - דורש כתובת
3. **בקליניקה (Clinic)** - לא דורש כתובת
4. **וירטואלי (Virtual)** - טלפון/וידאו

### Pricing Options
- **Base Price** - מחיר בסיס
- **Weekend Pricing** - תעריף שבת/שישי (אחוזים או קבוע)
- **Travel Cost** - עלות נסיעה
- **Shipping Cost** - עלות משלוח (למוצרים)
- **Free Shipping Above** - משלוח חינם מעל סכום

### Booking Enhancements
- **Contact Person** - פרטי איש קשר (יכול להיות שונה מהמזמין)
- **Service Location** - כתובת מלאה עם קואורדינטות
- **Shipping Address** - כתובת משלוח (למוצרים)
- **Price Breakdown** - פירוט מחיר (בסיס, נסיעה, שבת, משלוח)
