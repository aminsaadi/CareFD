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
- Booking/Services/Professions/Regions Management
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

#### Phase 7 - Static Pages Editor & Email Notifications (Feb 23, 2026) ✅
- **Rich Text Editor for Static Pages**: ReactQuill-based WYSIWYG editor
  - Admin can create/edit/delete static pages
  - Full formatting toolbar (headers, bold, colors, lists, etc.)
  - RTL support for Hebrew
  - Publish/Draft status toggle
- **Automatic Email to Admins on Provider Registration**
  - In-app notification created for all admins
  - Email notification sent with provider details and verification link
  - Email to new provider with profile completion guide
- **Public Pages API**: GET /api/pages/{slug} for frontend consumption

### Pending Features 🔄

#### P1 - Backend Refactoring
- The monolithic server.py file (4500+ lines) needs to be split into router modules
- Directory structure exists at /backend/app/routers/

#### P2 - Admin Notifications/Messages Pages
- /admin/notifications and /admin/messages pages return 404
- Need to create these admin interface pages

#### P2 - Database Model for Regions
- Footer regions list is hardcoded
- Needs dynamic management from admin panel

#### P2 - PayPal Live Integration
- Waiting for PayPal API credentials
- Integration code exists but is mocked

#### P3 - Advanced Features
- Provider Image Gallery
- SMS/Email Reminders
- Export reports to PDF/Excel

## Technical Stack
- **Frontend**: React 18, TailwindCSS, React Router, react-quill-new
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Email**: Resend (MOCKED - requires API key)

## API Endpoints

### Static Pages (NEW - Feb 23, 2026)
- `GET /api/pages/{slug}` - Get public page by slug
- `GET /api/admin/pages` - List all pages (admin)
- `POST /api/admin/pages` - Create page (admin)
- `PUT /api/admin/pages/{page_id}` - Update page (admin)
- `DELETE /api/admin/pages/{page_id}` - Delete page (admin)

### Provider Registration (Updated Feb 23, 2026)
- On provider registration:
  - Creates provider document
  - Creates in-app notification for all admins
  - Sends email to all admins with provider details
  - Sends welcome email to new provider

## Testing Credentials
- Admin: admin@carelink.co.il / password
- User: user@carelink.co.il / password
- Provider: provider@carelink.co.il / password

## Mocked Integrations
1. **Email (Resend)** - RESEND_API_KEY is empty, emails logged to console
2. **PayPal** - Waiting for API credentials

## Change Log

### Feb 23, 2026 (Current Session)
- **Static Pages Editor (P0 COMPLETE)**
  - Replaced react-quill with react-quill-new (React 18+ compatibility)
  - Created AdminPages.js with full CRUD functionality
  - Rich text editor with RTL support
  - Public API endpoint for pages
  - Testing: 100% backend, 100% frontend

- **Admin Email Notifications (P2 COMPLETE)**
  - Added email notification to admins when provider registers
  - Email includes: provider name, email, number, registration date
  - Link to verification queue
  - Works alongside existing in-app notifications
  - Email is MOCKED (requires RESEND_API_KEY)

### Previous Sessions
- Feb 22, 2026: User Dashboard overhaul, Password Reset, Admin Provider/User management
- Feb 18-19, 2026: Admin Dashboard system, Reports, Provider Profile enhancements
- Feb 12, 2026: GPS search, Regions, Guest booking
