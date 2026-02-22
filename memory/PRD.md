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

#### Phase 3 - Search & Communication (Current Session - Feb 2026)
- **Improved Search Engine**:
  - Two-parameter search (profession + location)
  - GPS location with radius selection (5/10/25/50 km)
  - Region quick-select (North, Center, South, Jerusalem)
- **Profile Actions**:
  - Share button with modal (copy link + WhatsApp)
  - Favorites system with API
  - Chat button
  - Phone display modal on desktop
- **Card Actions**:
  - Chat button on ProviderCard and ServiceCard
  - Call button with desktop modal
  - Provider link in ServiceCard
- **Guest Booking** - Book without registration
- **Admin Regions Management** - Add/edit/delete regions and cities
- **Improved Chat UI** - Modern design with date dividers, status indicators

#### Phase 4 - Admin Dashboard System (Current Session - Feb 2026)
- **Professional Admin Dashboard** with Light theme using brand colors (#19B8BA, #1E4D5F, #4C6D7F)
- **Dashboard Overview**: Stats, quick actions, recent activity, alerts
- **User Management**: 
  - List with user numbers (U...), search, filter, role management
  - View user details modal with stats, provider info, verification documents
  - Edit user (name, email, phone, verified status)
  - Suspend/unsuspend users with reason
  - Send private messages to users
  - Delete users
- **Provider Management**: List with provider numbers (P...), verify, recommend, view profile
- **Provider Verification**: Queue with document review, approve/reject
- **Booking Management**: All bookings, filter by status, status updates
- **Services Management**: NEW - View all services, edit, delete with provider info
- **Professions & Categories**: 3-level hierarchy (Profession → Sub-profession → Category)
- **Regions Management**: Geographic regions with cities
- **Static Pages (CMS)**: Create/edit/delete pages, publish/draft status
- **Blog Management**: Posts with tags, featured images, publish status
- **Advertisements**: Banner ads with position targeting, date ranges, CTR tracking
- **Featured Providers**: Highlight providers for time periods
- **Reports & Analytics**: 
  - Interactive charts (Recharts): bookings timeline, status distribution, top providers, revenue
  - Period selector (week/month/year)
  - Summary cards with key metrics
- **Site Settings**: 
  - General (name, tagline, registration settings)
  - Appearance (logo, favicon)
  - Contact info (email, phone, address)
  - Social media links
  - Footer links
  - SEO (meta description, keywords, Google Analytics)
  - Advanced (maintenance mode, backup)

#### New Data Fields
- **user_number**: Unique user identifier (U + 7 digits, e.g., U5566889)
- **provider_number**: Unique provider identifier (P + 7 digits, e.g., P7784569)
- **is_suspended**: User suspension status
- **suspension_reason**: Reason for suspension
- **suspended_at**: Suspension timestamp

#### Subscription System (NEW)
- **3 Subscription Tiers:**
  - Free (₪0): 3 services, 10 bookings/month
  - Pro (₪99/month): 10 services, unlimited bookings, priority support
  - Premium (₪199/month): Unlimited, VIP support, featured listing
- **PayPal Integration:** MOCKED - requires API keys to activate
- **Admin Management:** View subscriptions, payments, revenue, modify tiers

#### Push Notifications System (NEW)
- **Send Notifications:** To all users, providers only, or users only
- **Notification Preferences:** Users can toggle notification types
- **Admin Panel:** Send broadcast notifications, view history
- **In-App Notifications:** All push notifications also create in-app notifications

### Pending Features 🔄

#### P2 - PayPal Live Integration
- Waiting for PayPal API credentials (Client ID + Secret)
- Once provided, payments will be fully functional

#### P3 - Provider Clinic Management
- Multiple clinic locations per provider
- Map display for each clinic
- Option for "No clinic" providers

#### Backlog
- Email notifications (SendGrid/Gmail)
- Export reports to PDF/Excel
- Enhanced chat features (file attachment, typing indicator)

## Technical Stack
- **Frontend**: React, TailwindCSS, React Router
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: JWT + Google OAuth

## API Endpoints

### New Endpoints (Session Feb 2026)
- `GET /api/regions` - Get all regions with cities
- `POST /api/admin/regions` - Create region (admin)
- `PUT /api/admin/regions/{id}` - Update region (admin)
- `DELETE /api/admin/regions/{id}` - Delete region (admin)
- `POST /api/admin/regions/{id}/cities` - Add city to region
- `DELETE /api/admin/regions/{id}/cities/{city}` - Remove city
- `POST /api/favorites/{provider_id}` - Add to favorites
- `DELETE /api/favorites/{provider_id}` - Remove from favorites
- `GET /api/favorites` - Get user favorites
- `GET /api/favorites/check/{provider_id}` - Check if favorite

## Data Models

### Region
```
{
  region_id: string,
  name: string,
  cities: string[],
  created_at: datetime
}
```

### Favorite
```
{
  favorite_id: string,
  user_id: string,
  provider_id: string,
  created_at: datetime
}
```

### Booking (Updated)
```
{
  ...existing fields,
  is_guest_booking: boolean,
  guest_name: string (optional),
  guest_email: string (optional),
  guest_phone: string (optional)
}
```

## Testing Credentials
- Admin: admin_test@carelink.co.il / test123456
- Admin (backup): newadmin@carelink.co.il / admin123
- Provider: provider@carelink.co.il / password
- User: user@carelink.co.il / password

## Admin API Endpoints (New)
- `GET /api/admin/stats` - Platform statistics
- `GET/PUT /api/admin/settings` - Site settings CRUD
- `GET/POST /api/admin/professions` - Professions management
- `POST /api/admin/professions/{id}/sub-professions` - Add sub-profession
- `POST /api/admin/sub-professions/{id}/categories` - Add category
- `DELETE /api/admin/professions/{id}` - Delete profession
- `DELETE /api/admin/sub-professions/{id}` - Delete sub-profession
- `DELETE /api/admin/categories/{id}` - Delete category
- `GET/POST /api/admin/ads` - Ads CRUD
- `PUT/DELETE /api/admin/ads/{id}` - Update/delete ad
- `GET/POST /api/admin/blog` - Blog posts CRUD
- `PUT/DELETE /api/admin/blog/{id}` - Update/delete post
- `GET/POST /api/admin/pages` - Static pages CRUD
- `PUT/DELETE /api/admin/pages/{id}` - Update/delete page
- `PUT /api/admin/bookings/{id}/status` - Update booking status
- `GET /api/admin/featured` - Get featured providers
- `PUT /api/admin/providers/{id}/unrecommend` - Remove from featured

## Change Log

### Feb 18, 2026 (Session 3 - Current)
- **ADMIN DASHBOARD API INTEGRATION COMPLETE**
  - Created all backend APIs for admin dashboard
  - Connected AdminOverview.js to /api/admin/stats
  - Connected AdminSettings.js to /api/admin/settings (GET/PUT)
  - Connected AdminProfessions.js to /api/admin/professions
  - Connected AdminBookings.js to /api/admin/bookings + status updates
  - Connected AdminUsers.js to /api/admin/users
  - Connected AdminAds.js to /api/admin/ads (full CRUD)
  - Connected AdminBlog.js to /api/admin/blog (full CRUD)
  - Connected AdminPages.js to /api/admin/pages (full CRUD)
  - All testing passed: 14/14 backend tests (100%), all frontend pages load correctly
  - Theme changed from dark to light using brand colors (#19B8BA, #1E4D5F, #4C6D7F)

- **ADMIN REPORTS PAGE (P1 COMPLETE)**
  - Created /api/admin/reports endpoint with period filtering (week/month/year)
  - Built AdminReports.js with 4 interactive charts using Recharts:
    * Area chart: Bookings timeline
    * Pie chart: Status distribution (pending/confirmed/completed/cancelled)
    * Bar chart: Top providers by bookings
    * Line chart: Revenue over time
  - Summary cards showing: total bookings, revenue, new users, new providers, reviews, avg rating
  - Period selector (week/month/year) updates all charts dynamically
  - Testing: 92% backend (11/12), 100% frontend

### Feb 19, 2026 (Current Session)
- **ENHANCED PROVIDER PROFILE (P0 COMPLETE)**
  - **New Profile Fields:**
    * `profile_image` - Profile picture upload
    * `gender` - Male/Female/Other
    * `years_experience` - Years of experience (integer)
    * `about` - Detailed about section (text)
    * `expertise` - Specific expertise areas (array)
    * `languages` - Languages spoken: Hebrew, Arabic, English, Russian, French, Spanish, Amharic
    * `target_audience` - Adults, Children, Youth, Babies, Women, Elderly, Pregnant, Postpartum
    * `service_areas` - Service coverage areas (cities)
  
  - **Shift-Based Availability System:**
    * Replaced time-based availability with shift-based system
    * 4 Shifts: Morning (06:00-12:00), Afternoon (12:00-18:00), Evening (18:00-22:00), Night (22:00-06:00)
    * 7 Days: Sunday through Saturday
    * Visual grid interface for selecting available shifts
    * Dynamic display on provider profile page
  
  - **New API Endpoint:**
    * `POST /api/upload/image` - Upload profile pictures (JPEG, PNG, WebP, GIF, max 5MB)
  
  - **Updated API Endpoints:**
    * `GET /api/providers/filters/options` - Now returns: shift_options, days_of_week, gender_options, language_options, target_audience_options
    * `PUT /api/providers/:id` - Accepts all new fields
  
  - **Frontend Updates:**
    * `ProviderEdit.js` - New tabbed form with all fields + weekly shift grid
    * `ProviderProfile.js` - Displays all new information: profile image, about, expertise, languages, target audience, dynamic availability
  
  - **Testing:** 100% backend (20/20 tests), 100% frontend verified

### Feb 18, 2026 (Session 2)
- **NEW: Professional Admin Dashboard System**
  - Complete redesign with Light theme using brand colors
  - Sidebar navigation with collapsible sections
  - Overview with stats, quick actions, recent activity
  - User management with search, filter, role changes
  - Provider management and verification queue
  - Booking management with status updates
  - Professions/Categories (3-level hierarchy)
  - Regions and cities management
  - Static pages CMS
  - Blog management
  - Advertisements with positions and tracking
  - Featured providers highlighting
  - Site settings (7 tabs: general, appearance, contact, social, footer, SEO, advanced)

### Feb 18, 2026 (Session 1)
- **CRITICAL BUG FIX**: Fixed booking service - Python's `and` operator returning phone string instead of boolean
  - Root cause: `is_guest_booking = x and y and z` returns last truthy value (phone number), not True
  - Fix: Wrapped with `bool()` on line 1425 in server.py
  - Added default availability to TimeSlotPicker for providers without set availability
- Fixed notification emails for guest bookings (was accessing `user` which is None for guests)
- Verified both guest and authenticated booking flows work correctly

### Feb 22, 2026 (Current Session)
- **CRITICAL BUG FIX: Provider Registration Flow**
  - Fixed: Providers registering now automatically get a provider document created
  - New endpoint: POST /api/admin/providers/create-from-user/{user_id} - Admin can create provider profile for orphaned users
  - Admin providers page now shows orphaned providers with "ללא פרופיל" badge and "צור פרופיל" button
  - Stats updated to show: סה"כ ספקים, מאומתים, ממתינים לאימות, ללא פרופיל, מומלצים
  
- **Services Page Verified**
  - Confirmed: Services page fetches real data from /api/services (not dummy data)
  - Filter sidebar working: service type, price range, city

- **Automatic Provider Welcome Email**
  - New providers receive beautiful Hebrew email with profile completion link
  - Email includes: steps to complete profile, tips for success, call-to-action button
  - Regular users get a welcome email with link to search providers

- **Push Notifications System (P2 COMPLETE)**
  - **Backend Implementation:**
    - pywebpush library integrated for Web Push protocol
    - VAPID keys generated and configured in backend/.env
    - New endpoint: GET /api/push/vapid-public-key - Returns public key for browser subscription
    - Updated: POST /api/admin/push/send - Now sends real push notifications using webpush
    - Notification preferences: GET/PUT /api/push/preferences - 7 notification types
    - Push history: GET /api/admin/push/history - View sent notifications
  - **Frontend Implementation:**
    - Service Worker: /sw-push.js - Handles push events and notification clicks
    - usePushNotifications hook: Manages subscription flow
    - NotificationSettings component: Toggle switches for each notification type
    - Dashboard settings tab: Includes notification settings UI
  - **Notification Types:**
    - new_booking, booking_confirmed, booking_cancelled
    - new_message, provider_verified, system_updates, marketing

- **Landing Page Data Sync**
  - Featured Providers: Now fetches from /api/providers?recommended=true&limit=6
  - Popular Services: Now fetches from /api/services?limit=6
  - Regions: Fetches from /api/regions for location quick-select
  - Loading states with spinner while fetching data

- **Static Pages Added**
  - **/about** - About CareLink page with mission, stats, values
  - **/privacy** - Privacy Policy page with cookie policy, data handling info
  - **/terms** - Terms of Service page with legal content
  - **/contact** - Contact form page with:
    - Contact info (phone, email, address, hours)
    - Contact form with POST /api/contact endpoint
    - Admin notifications on new messages
    - Email confirmation to sender

- **Cookie Consent Banner**
  - Shows on first visit (uses localStorage to remember choice)
  - 3 options: Accept All, Customize, Reject All
  - Customize shows toggles for: necessary (always on), analytics, marketing
  - Saves consent with timestamp to localStorage

- **Footer Enhancement - Regions Column**
  - Added "אזורים וערים" column
  - Lists regions/cities from /api/regions
  - Each city links to /providers?city=<city_name>

- **Admin Provider Edit**
  - New route: /admin/providers/:providerId/edit
  - New endpoint: PUT /api/admin/providers/{provider_id}
  - Form fields: business_name, email, phone, city, address, bio, experience_years, provider_type
  - Quick actions: Verify, Recommend/Unrecommend
  - Status badges: verified, recommended
  - Edit button added to admin providers table

- **Modern UI Confirmation Dialogs (P0 COMPLETE)**
  - Replaced ALL native browser `window.alert()` and `window.confirm()` with modern UI components
  - Created reusable `ConfirmDialog` component in `/components/ConfirmDialog.js`
  - Created `useConfirm` hook in `/hooks/useConfirm.js`
  - Using `sonner` toast library for success/error notifications
  - Updated pages:
    - RequestDetails.js, MyBookings.js, AdminDashboard.js
    - AdminFeatured.js, AdminAds.js, AdminSettings.js
    - AdminProfessions.js, AdminPages.js, AdminRegions.js, AdminBlog.js
    - AdminProviders.js, ProviderDashboard.js

- **Provider Profile Update**
  - Updated ד"ר ישראל ישראלי profile with complete data:
    - Profile image, description, about text
    - Specializations: רפואת משפחה, רפואה פנימית, רפואת ילדים
    - Expertise: טיפול במחלות כרוניות, רפואה מונעת, בריאות הגבר, טיפול בסוכרת
    - Languages: עברית, אנגלית, רוסית
    - Target audience: מבוגרים, קשישים, ילדים, משפחות
    - Service areas: תל אביב, רמת גן, בני ברק, פתח תקווה
    - Location: רחוב אבן גבירול 50, תל אביב
    - Full availability schedule (morning/afternoon shifts)
    - 15 years experience
    - Gender: male

- **Review System for Completed Bookings (NEW)**
  - Added "כתוב ביקורת" button to completed bookings in MyBookings page
  - Beautiful review modal with:
    - 5-star rating selector with hover effects
    - Comment textarea with character counter (0/500)
    - Cancel and Submit buttons
    - Loading state during submission
  - Review linked to booking_id for tracking
  - Toast notifications for success/error
  - Green checkmark indicator after review submitted

- **Enhanced Provider Profile (COMPLETE)**
  - **Provider Edit Page** (`/provider/edit/:providerId`): Complete 9-tab form:
    1. פרטים בסיסיים: שם, מקצוע, מגדר, שנות ותק, טלפון, אימייל, אתר, תיאור קצר
    2. אודות: טקסט ארוך על הספק
    3. התמחויות: התמחויות + מומחיויות ספציפיות (dynamic array fields)
    4. **השכלה ותעודות**: רשימת תארים + תעודות/רישיונות עם אפשרות העלאת קבצים
    5. מיקום ואזורים: כתובת, עיר, אזורי שירות (multi-select)
    6. זמינות: לוח זמינות שבועי עם 4 משמרות × 7 ימים (visual grid)
    7. קהל יעד ושפות: בחירת שפות וקהלי יעד (multi-select buttons)
    8. **תשלום וקופות**: קופות חולים (כללית/מכבי/מאוחדת/לאומית/פרטי), אמצעי תשלום, מדיניות ביטולים
    9. **הגדרות קשר**: הגדרות פרטיות - בחירה אילו פרטים להציג (טלפון/אימייל/WhatsApp), בחירת צבע רקע
  - **Admin Provider Edit**: Same 9-tab form synced with admin API
  - **Profile without Image**: Displays initials with gradient background color

### New Profile Fields (Feb 22, 2026):
- **education**: Array of {degree, institution, year, field}
- **certifications**: Array of {name, issuer, year, license_number, document_url}
- **health_funds**: Array of (clalit, maccabi, meuhedet, leumit, private)
- **payment_methods**: Array of (cash, credit_card, bit, paybox, bank_transfer, check)
- **cancellation_policy**: Text
- **cancellation_notice_hours**: Number (0, 2, 6, 12, 24, 48, 72)
- **show_phone**, **show_email**, **show_whatsapp**: Boolean
- **whatsapp_number**: String
- **profile_color**: Gradient color for profile without image

### Provider Dashboard Separation (Feb 22, 2026):
- **פרטי משתמש** (User Info Tab): Personal details separate from business
  - שם פרטי, שם משפחה
  - טלפון אישי, אימייל (readonly)
  - עיר וכתובת מגורים
  - שינוי סיסמה (סיסמה נוכחית, חדשה, אימות)
- **פרופיל ספק** (Provider Profile Tab): Business/professional profile
  - פרטי העסק: שם, תיאור, סוג ספק, שנות ותק
  - פרטי התקשרות עסקיים: טלפון, אימייל, אתר
  - מיקום העסק
  - התמחויות
  - **סוגי שירות**: ביקור בית, ביקור במרפאה, טלרפואה
  - קישור ל"עריכה מתקדמת" (9 טאבים מלאים)
- New API endpoints:
  - PUT /users/me - Update user personal info
  - PUT /users/me/password - Change password

### Feb 12, 2026
- Added GPS-based search with radius
- Added region quick-select buttons
- Implemented share/favorite/chat buttons
- Created guest booking flow
- Added admin regions management
- Improved chat UI/UX
- Fixed booking page access for guests

### Previous Sessions
- Provider verification system
- Enhanced booking flow
- Review and rating system
