"""
Test suite for booking service bug fix - is_guest_booking boolean fix
Bug: Python's 'and' operator returns last truthy value, not True/False
Fix: Wrapped with bool() on line 1424-1425 in server.py
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')


class TestGuestBookingBugFix:
    """Tests for the is_guest_booking boolean bug fix"""
    
    def test_guest_booking_returns_boolean_true(self):
        """Verify is_guest_booking returns boolean True, not phone number string"""
        booking_date = (datetime.now() + timedelta(days=30)).isoformat()
        
        response = requests.post(f"{BASE_URL}/api/bookings", json={
            "service_id": "service_c326119bd68d",
            "booking_date": booking_date,
            "guest_booking": True,
            "guest_name": "Test Guest",
            "guest_email": "testguest@example.com",
            "guest_phone": "0521234567"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Critical assertion - is_guest_booking must be boolean True, NOT the phone string
        assert data["is_guest_booking"] is True, f"is_guest_booking should be True, got: {data['is_guest_booking']} (type: {type(data['is_guest_booking'])})"
        assert isinstance(data["is_guest_booking"], bool), f"is_guest_booking should be bool, got {type(data['is_guest_booking'])}"
        
        # Verify other guest details are correct
        assert data["client_name"] == "Test Guest"
        assert data["client_phone"] == "0521234567"
        assert data["client_email"] == "testguest@example.com"
        assert data["user_id"].startswith("guest_")
        print(f"✓ Guest booking created: {data['booking_id']} with is_guest_booking={data['is_guest_booking']}")

    def test_guest_booking_with_all_required_fields(self):
        """Test guest booking with name, email, phone, and address"""
        booking_date = (datetime.now() + timedelta(days=31)).isoformat()
        
        response = requests.post(f"{BASE_URL}/api/bookings", json={
            "service_id": "service_c326119bd68d",
            "booking_date": booking_date,
            "booking_time": "11:00",
            "guest_booking": True,
            "guest_name": "Complete Guest",
            "guest_email": "complete@example.com",
            "guest_phone": "0531234567",
            "guest_address": "Test Address, City"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # is_guest_booking must be boolean
        assert data["is_guest_booking"] is True
        assert isinstance(data["is_guest_booking"], bool)
        
        # Verify address was stored in service_location
        if data.get("service_location"):
            assert "Test Address" in data["service_location"].get("address", "")
        print(f"✓ Complete guest booking: {data['booking_id']}")

    def test_guest_booking_missing_name_requires_auth(self):
        """Guest booking without name should require authentication"""
        booking_date = (datetime.now() + timedelta(days=32)).isoformat()
        
        response = requests.post(f"{BASE_URL}/api/bookings", json={
            "service_id": "service_c326119bd68d",
            "booking_date": booking_date,
            "guest_booking": True,
            "guest_email": "noname@example.com",
            "guest_phone": "0541234567"
            # Missing guest_name
        })
        
        # Should return 401 because is_guest_booking becomes False without all required fields
        assert response.status_code == 401, f"Expected 401 without guest_name, got {response.status_code}"
        print("✓ Missing guest_name correctly requires auth")

    def test_guest_booking_missing_phone_requires_auth(self):
        """Guest booking without phone should require authentication"""
        booking_date = (datetime.now() + timedelta(days=33)).isoformat()
        
        response = requests.post(f"{BASE_URL}/api/bookings", json={
            "service_id": "service_c326119bd68d",
            "booking_date": booking_date,
            "guest_booking": True,
            "guest_name": "No Phone Guest",
            "guest_email": "nophone@example.com"
            # Missing guest_phone
        })
        
        # Should return 401 because is_guest_booking becomes False without phone
        assert response.status_code == 401, f"Expected 401 without guest_phone, got {response.status_code}"
        print("✓ Missing guest_phone correctly requires auth")

    def test_non_guest_booking_requires_auth(self):
        """Non-guest booking (guest_booking=False) should require authentication"""
        booking_date = (datetime.now() + timedelta(days=34)).isoformat()
        
        response = requests.post(f"{BASE_URL}/api/bookings", json={
            "service_id": "service_c326119bd68d",
            "booking_date": booking_date,
            "guest_booking": False,
            "guest_name": "Should Require Auth",
            "guest_phone": "0551234567"
        })
        
        assert response.status_code == 401, f"Expected 401 for non-guest booking, got {response.status_code}"
        print("✓ Non-guest booking correctly requires auth")


class TestAuthenticatedBooking:
    """Tests for authenticated user booking flow"""
    
    @pytest.fixture
    def auth_token(self):
        """Register a new user and get token"""
        import uuid
        unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Test User",
            "role": "patient"
        })
        
        if response.status_code == 200:
            return response.json().get("session_token")
        pytest.skip(f"Could not register user: {response.status_code}")
    
    def test_authenticated_booking_creates_correctly(self, auth_token):
        """Authenticated user booking should have is_guest_booking=False"""
        booking_date = (datetime.now() + timedelta(days=35)).isoformat()
        
        response = requests.post(
            f"{BASE_URL}/api/bookings",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "service_id": "service_c326119bd68d",
                "booking_date": booking_date,
                "booking_time": "14:00",
                "notes": "Authenticated user booking"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Authenticated booking should have is_guest_booking=False
        assert data["is_guest_booking"] is False, f"Authenticated booking should have is_guest_booking=False"
        assert isinstance(data["is_guest_booking"], bool)
        assert data["user_id"].startswith("user_"), f"User ID should start with user_, got {data['user_id']}"
        print(f"✓ Authenticated booking: {data['booking_id']} with is_guest_booking=False")


class TestTimeSlotAvailability:
    """Tests for time slot handling when provider has no availability set"""
    
    def test_booking_with_time_slot(self):
        """Booking with specific time slot should work"""
        booking_date = (datetime.now() + timedelta(days=40)).isoformat()
        
        response = requests.post(f"{BASE_URL}/api/bookings", json={
            "service_id": "service_c326119bd68d",
            "booking_date": booking_date,
            "booking_time": "10:30",
            "guest_booking": True,
            "guest_name": "Time Slot Test",
            "guest_email": "timeslot@example.com",
            "guest_phone": "0561234567"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["booking_time"] == "10:30"
        print(f"✓ Booking with time slot: {data['booking_time']}")


class TestServiceValidation:
    """Tests for service and provider validation"""
    
    def test_booking_invalid_service_returns_404(self):
        """Booking with invalid service ID should return 404"""
        booking_date = (datetime.now() + timedelta(days=41)).isoformat()
        
        response = requests.post(f"{BASE_URL}/api/bookings", json={
            "service_id": "service_nonexistent",
            "booking_date": booking_date,
            "guest_booking": True,
            "guest_name": "Invalid Service Test",
            "guest_email": "invalid@example.com",
            "guest_phone": "0571234567"
        })
        
        assert response.status_code == 404, f"Expected 404 for invalid service, got {response.status_code}"
        print("✓ Invalid service correctly returns 404")

    def test_service_endpoint_returns_correct_service(self):
        """Verify the test service exists and has correct data"""
        response = requests.get(f"{BASE_URL}/api/services")
        
        assert response.status_code == 200
        data = response.json()
        
        services = data.get("services", [])
        test_service = next((s for s in services if s["service_id"] == "service_c326119bd68d"), None)
        
        assert test_service is not None, "Test service not found"
        assert test_service["provider_id"] == "provider_5a752c10c582"
        print(f"✓ Service found: {test_service['name']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
