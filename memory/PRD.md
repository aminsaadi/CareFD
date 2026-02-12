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

### Pending Features 🔄

#### P3 - Provider Clinic Management
- Multiple clinic locations per provider
- Map display for each clinic
- Option for "No clinic" providers

#### Backlog
- SendGrid email integration for notifications
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
- Admin: admin@carelink.co.il / password
- Provider: provider@carelink.co.il / password
- User: user@carelink.co.il / password

## Change Log

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
