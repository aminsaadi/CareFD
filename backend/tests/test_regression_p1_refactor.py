"""
P1 Backend Refactoring Regression Test Suite

Testing all endpoints after splitting monolithic server.py into 18 router files:
- auth.py - Auth endpoints
- providers.py - Provider endpoints
- services.py - Service endpoints
- bookings.py - Booking endpoints
- chat.py - Chat endpoints
- notifications.py - Notification endpoints
- admin.py - Admin endpoints
- subscriptions.py - Subscription endpoints
"""
import pytest
import requests
import os
from datetime import datetime

# Use the PUBLIC URL from frontend/.env for testing what users see
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://radius-locator.preview.emergentagent.com').rstrip('/')

# Test credentials
USER_CREDS = {"email": "user@carelink.co.il", "password": "password"}
PROVIDER_CREDS = {"email": "provider@carelink.co.il", "password": "password"}
ADMIN_CREDS = {"email": "admin@carelink.co.il", "password": "password"}
TEST_SERVICE_ID = "srv_2d5267fcaebb"


class TestAuthRouterEndpoints:
    """Test auth.py router - Auth flow endpoints"""
    
    def test_login_user_account(self):
        """POST /api/auth/login - User login returns session_token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=USER_CREDS,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        # Data assertions
        assert "session_token" in data, "Response must contain session_token"
        assert "user" in data, "Response must contain user object"
        assert data["user"]["email"] == USER_CREDS["email"]
        assert data["user"]["role"] == "patient"
        print(f"✓ User login successful: {data['user']['email']}")

    def test_login_provider_account(self):
        """POST /api/auth/login - Provider login"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=PROVIDER_CREDS,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Provider login failed: {response.text}"
        data = response.json()
        
        assert "session_token" in data
        assert data["user"]["role"] == "provider"
        print(f"✓ Provider login successful: {data['user']['email']}")

    def test_login_admin_account(self):
        """POST /api/auth/login - Admin login"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=ADMIN_CREDS,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        
        assert "session_token" in data
        assert data["user"]["role"] == "admin"
        print(f"✓ Admin login successful: {data['user']['email']}")

    def test_login_invalid_credentials(self):
        """POST /api/auth/login - Invalid credentials return 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "invalid@test.com", "password": "wrongpassword"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401, "Invalid credentials should return 401"
        print("✓ Invalid credentials correctly rejected")

    def test_register_new_user(self):
        """POST /api/auth/register - Test user registration"""
        import uuid
        test_email = f"test_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": test_email,
                "password": "testpass123",
                "name": "Test User Regression",
                "role": "patient"
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        
        assert "session_token" in data
        assert data["user"]["email"] == test_email
        print(f"✓ User registration successful: {test_email}")

    def test_get_auth_me(self):
        """GET /api/auth/me - Get current user info"""
        # First login to get token
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=USER_CREDS)
        token = login_resp.json()["session_token"]
        
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Get me failed: {response.text}"
        data = response.json()
        
        assert data["email"] == USER_CREDS["email"]
        print(f"✓ Auth/me endpoint working: {data['email']}")


class TestServicesRouterEndpoints:
    """Test services.py router - Services endpoints"""
    
    def test_get_services_list(self):
        """GET /api/services - Get services list"""
        response = requests.get(f"{BASE_URL}/api/services")
        assert response.status_code == 200, f"Get services failed: {response.text}"
        data = response.json()
        
        assert "services" in data, "Response must contain services array"
        assert isinstance(data["services"], list)
        print(f"✓ Services list returned: {len(data['services'])} services")
    
    def test_get_service_by_id(self):
        """GET /api/services?service_id=xxx - Get specific service"""
        response = requests.get(f"{BASE_URL}/api/services?service_id={TEST_SERVICE_ID}")
        assert response.status_code == 200, f"Get service by ID failed: {response.text}"
        data = response.json()
        
        assert "services" in data
        print(f"✓ Service query by ID working")


class TestBookingsRouterEndpoints:
    """Test bookings.py router - Booking endpoints"""
    
    @pytest.fixture
    def user_token(self):
        """Get user authentication token"""
        resp = requests.post(f"{BASE_URL}/api/auth/login", json=USER_CREDS)
        return resp.json()["session_token"]
    
    def test_create_booking(self, user_token):
        """POST /api/bookings - Create a booking"""
        import random
        # Use random time to avoid conflicts
        random_hour = random.randint(8, 20)
        random_day = random.randint(1, 28)
        booking_data = {
            "service_id": TEST_SERVICE_ID,
            "booking_date": f"2026-04-{random_day:02d}T{random_hour:02d}:00:00",
            "booking_time": f"{random_hour:02d}:00",
            "service_address": "רחוב הרצל 50",
            "service_city": "תל אביב",
            "client_name": "Test Client",
            "client_phone": "050-1234567"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/bookings",
            json=booking_data,
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200, f"Create booking failed: {response.text}"
        data = response.json()
        
        assert "booking_id" in data, "Response must contain booking_id"
        assert data["service_id"] == TEST_SERVICE_ID
        print(f"✓ Booking created: {data['booking_id']}")
        return data["booking_id"]

    def test_get_my_bookings(self, user_token):
        """GET /api/bookings/my - Get user's bookings"""
        response = requests.get(
            f"{BASE_URL}/api/bookings/my",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200, f"Get my bookings failed: {response.text}"
        data = response.json()
        
        assert "bookings" in data
        assert isinstance(data["bookings"], list)
        print(f"✓ User bookings retrieved: {len(data['bookings'])} bookings")


class TestChatRouterEndpoints:
    """Test chat.py router - Chat endpoints"""
    
    @pytest.fixture
    def user_token(self):
        resp = requests.post(f"{BASE_URL}/api/auth/login", json=USER_CREDS)
        return resp.json()["session_token"]
    
    def test_get_chat_rooms(self, user_token):
        """GET /api/chat/rooms - Get user's chat rooms"""
        response = requests.get(
            f"{BASE_URL}/api/chat/rooms",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200, f"Get chat rooms failed: {response.text}"
        data = response.json()
        
        assert "rooms" in data
        assert isinstance(data["rooms"], list)
        
        # Verify P0 bug fix - other_user enrichment
        if data["rooms"]:
            room = data["rooms"][0]
            assert "other_user" in room, "P0 BUG: other_user enrichment missing"
            # unread_count should be present
            assert "unread_count" in room, "P0 BUG: unread_count missing"
        
        print(f"✓ Chat rooms retrieved: {len(data['rooms'])} rooms")

    def test_create_chat_room(self, user_token):
        """POST /api/chat/rooms - Create a chat room"""
        # Get user_id first
        me_resp = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        user_id = me_resp.json()["user_id"]
        
        response = requests.post(
            f"{BASE_URL}/api/chat/rooms",
            json={
                "user_id": user_id,
                "provider_id": "prov_demo123"  # Known test provider
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200, f"Create chat room failed: {response.text}"
        data = response.json()
        
        assert "room_id" in data
        print(f"✓ Chat room created/retrieved: {data['room_id']}")

    def test_send_message(self, user_token):
        """POST /api/chat/messages - Send a message"""
        # First get or create a room
        me_resp = requests.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {user_token}"})
        user_id = me_resp.json()["user_id"]
        
        room_resp = requests.post(
            f"{BASE_URL}/api/chat/rooms",
            json={"user_id": user_id, "provider_id": "prov_demo123"},
            headers={"Authorization": f"Bearer {user_token}"}
        )
        room_id = room_resp.json()["room_id"]
        
        # Send message
        response = requests.post(
            f"{BASE_URL}/api/chat/messages",
            json={
                "room_id": room_id,
                "content": f"Test message {datetime.now().isoformat()}"
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200, f"Send message failed: {response.text}"
        data = response.json()
        
        assert "message_id" in data
        print(f"✓ Message sent: {data['message_id']}")


class TestNotificationsRouterEndpoints:
    """Test notifications.py router - Notification endpoints"""
    
    @pytest.fixture
    def user_token(self):
        resp = requests.post(f"{BASE_URL}/api/auth/login", json=USER_CREDS)
        return resp.json()["session_token"]
    
    def test_get_notifications(self, user_token):
        """GET /api/notifications - Get user notifications"""
        response = requests.get(
            f"{BASE_URL}/api/notifications",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200, f"Get notifications failed: {response.text}"
        data = response.json()
        
        assert "notifications" in data
        assert "unread_count" in data
        print(f"✓ Notifications retrieved: {len(data['notifications'])} notifications, {data['unread_count']} unread")


class TestSubscriptionRouterEndpoints:
    """Test subscriptions.py router - Subscription endpoints"""
    
    def test_get_subscription_plans(self):
        """GET /api/subscription-plans - Get all subscription plans"""
        response = requests.get(f"{BASE_URL}/api/subscription-plans")
        assert response.status_code == 200, f"Get subscription plans failed: {response.text}"
        data = response.json()
        
        assert "plans" in data
        assert isinstance(data["plans"], list)
        print(f"✓ Subscription plans retrieved: {len(data['plans'])} plans")


class TestAdminRouterEndpoints:
    """Test admin.py router - Admin endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        resp = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        return resp.json()["session_token"]
    
    def test_admin_get_users(self, admin_token):
        """GET /api/admin/users - Admin get all users"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Admin get users failed: {response.text}"
        data = response.json()
        
        assert "users" in data
        assert "total" in data
        print(f"✓ Admin users retrieved: {data['total']} total users")

    def test_admin_unauthorized_access(self):
        """GET /api/admin/users - Non-admin should get 403"""
        # Login as regular user
        resp = requests.post(f"{BASE_URL}/api/auth/login", json=USER_CREDS)
        user_token = resp.json()["session_token"]
        
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 403, "Non-admin should get 403 Forbidden"
        print("✓ Admin endpoint correctly rejects non-admin users")


class TestProviderRouterEndpoints:
    """Test providers.py router - Provider endpoints"""
    
    @pytest.fixture
    def provider_token(self):
        resp = requests.post(f"{BASE_URL}/api/auth/login", json=PROVIDER_CREDS)
        return resp.json()["session_token"]
    
    def test_get_providers_list(self):
        """GET /api/providers - Get providers list"""
        response = requests.get(f"{BASE_URL}/api/providers")
        assert response.status_code == 200, f"Get providers failed: {response.text}"
        data = response.json()
        
        assert "providers" in data
        print(f"✓ Providers list retrieved: {len(data['providers'])} providers")

    def test_get_provider_me(self, provider_token):
        """GET /api/providers/me - Get current provider profile"""
        response = requests.get(
            f"{BASE_URL}/api/providers/me",
            headers={"Authorization": f"Bearer {provider_token}"}
        )
        assert response.status_code == 200, f"Get provider/me failed: {response.text}"
        data = response.json()
        
        assert "provider_id" in data
        print(f"✓ Provider profile retrieved: {data['provider_id']}")


class TestPublicEndpoints:
    """Test public endpoints that don't require auth"""
    
    def test_get_regions(self):
        """GET /api/regions - Get regions list"""
        response = requests.get(f"{BASE_URL}/api/regions")
        assert response.status_code == 200, f"Get regions failed: {response.text}"
        data = response.json()
        
        assert "regions" in data
        print(f"✓ Regions retrieved: {len(data['regions'])} regions")

    def test_get_public_settings(self):
        """GET /api/settings/public - Get public settings"""
        response = requests.get(f"{BASE_URL}/api/settings/public")
        assert response.status_code == 200, f"Get public settings failed: {response.text}"
        print("✓ Public settings retrieved")

    def test_get_public_stats(self):
        """GET /api/stats/public - Get public statistics"""
        response = requests.get(f"{BASE_URL}/api/stats/public")
        assert response.status_code == 200, f"Get public stats failed: {response.text}"
        data = response.json()
        
        assert "total_providers" in data
        assert "total_services" in data
        print(f"✓ Public stats retrieved: {data['total_providers']} providers, {data['total_services']} services")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
