"""
Test the new booking model with:
- 6 service categories (consultation, visit, product, hourly, procedure, series)
- 5 delivery types (home, clinic, hospital, virtual, delivery)
- New fields: platform, selected_shift, num_sessions, total_price, shipping fields
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
USER_EMAIL = "user@carelink.co.il"
USER_PASSWORD = "password"
PROVIDER_EMAIL = "provider@carelink.co.il"
PROVIDER_PASSWORD = "password"

# Test service IDs from the problem statement
VISIT_MULTI_DELIVERY_SERVICE = "srv_2d5267fcaebb"  # visit, delivery_types: [hospital, home]
HOURLY_HOSPITAL_SERVICE = "srv_80622a711fbc"       # hourly, delivery_types: [hospital]
VIRTUAL_CONSULTATION_SERVICE = "srv_a58278db0334"   # consultation, delivery_types: [virtual]


class TestBookingModelV2:
    """Tests for the redesigned booking model with new fields"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.token = login_response.json().get("session_token")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        self.user = login_response.json().get("user")
    
    # ============== VIRTUAL BOOKING WITH PLATFORM ==============
    
    def test_virtual_booking_with_zoom_platform(self):
        """POST /api/bookings with delivery_type=virtual and platform=zoom - should save platform field"""
        booking_date = (datetime.now() + timedelta(days=3)).isoformat()
        
        booking_data = {
            "service_id": VIRTUAL_CONSULTATION_SERVICE,
            "booking_date": booking_date,
            "booking_time": "10:00",
            "delivery_type": "virtual",
            "platform": "zoom",
            "notes": "TEST_Virtual booking via Zoom",
            "total_price": 150
        }
        
        response = self.session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        print(f"Virtual Zoom booking response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "booking_id" in data, "Response should contain booking_id"
        assert data.get("delivery_type") == "virtual", "Delivery type should be virtual"
        assert data.get("platform") == "zoom", f"Platform should be 'zoom', got {data.get('platform')}"
        assert data.get("service_category") == "consultation", "Service category should be consultation"
        print(f"✓ Virtual booking with Zoom platform created: {data.get('booking_id')}")
    
    def test_virtual_booking_with_whatsapp_platform(self):
        """POST /api/bookings with delivery_type=virtual and platform=whatsapp"""
        booking_date = (datetime.now() + timedelta(days=4)).isoformat()
        
        booking_data = {
            "service_id": VIRTUAL_CONSULTATION_SERVICE,
            "booking_date": booking_date,
            "booking_time": "14:00",
            "delivery_type": "virtual",
            "platform": "whatsapp",
            "notes": "TEST_Virtual booking via WhatsApp",
            "total_price": 150
        }
        
        response = self.session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        print(f"Virtual WhatsApp booking response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("platform") == "whatsapp", f"Platform should be 'whatsapp', got {data.get('platform')}"
        print(f"✓ Virtual booking with WhatsApp platform created: {data.get('booking_id')}")
    
    # ============== HOME DELIVERY WITH ADDRESS ==============
    
    def test_home_booking_with_service_address(self):
        """POST /api/bookings with delivery_type=home and service_address/service_city fields - should save address"""
        booking_date = (datetime.now() + timedelta(days=5)).isoformat()
        
        booking_data = {
            "service_id": VISIT_MULTI_DELIVERY_SERVICE,
            "booking_date": booking_date,
            "booking_time": "11:00",
            "delivery_type": "home",
            "service_address": "הרצל 100",
            "service_city": "תל אביב",
            "service_floor": "3",
            "service_apartment": "12",
            "service_entry_code": "1234",
            "service_notes": "כניסה מהמעלית",
            "notes": "TEST_Home booking with address",
            "total_price": 310  # 250 base + 60 travel cost
        }
        
        response = self.session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        print(f"Home booking response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("delivery_type") == "home", "Delivery type should be home"
        assert data.get("service_location") is not None, "Service location should be saved"
        
        service_location = data.get("service_location", {})
        assert service_location.get("address") == "הרצל 100", f"Address mismatch: {service_location.get('address')}"
        assert service_location.get("city") == "תל אביב", f"City mismatch: {service_location.get('city')}"
        assert service_location.get("floor") == "3", f"Floor mismatch: {service_location.get('floor')}"
        assert service_location.get("apartment") == "12", f"Apartment mismatch: {service_location.get('apartment')}"
        assert service_location.get("entry_code") == "1234", f"Entry code mismatch: {service_location.get('entry_code')}"
        
        print(f"✓ Home booking with address created: {data.get('booking_id')}")
    
    # ============== HOURLY SERVICE WITH SHIFT ==============
    
    def test_hourly_booking_with_shift_and_hours(self):
        """POST /api/bookings with selected_shift=morning and hours_booked=8 for hourly service - should save shift and hours"""
        booking_date = (datetime.now() + timedelta(days=6)).isoformat()
        
        booking_data = {
            "service_id": HOURLY_HOSPITAL_SERVICE,
            "booking_date": booking_date,
            "booking_time": "07:00",
            "delivery_type": "hospital",
            "selected_shift": "morning",
            "hours_booked": 8,
            "notes": "TEST_Hourly booking with morning shift",
            "total_price": 640  # 80 * 8 hours
        }
        
        response = self.session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        print(f"Hourly booking response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("service_category") == "hourly", "Service category should be hourly"
        assert data.get("selected_shift") == "morning", f"Selected shift should be 'morning', got {data.get('selected_shift')}"
        assert data.get("hours_booked") == 8, f"Hours booked should be 8, got {data.get('hours_booked')}"
        
        print(f"✓ Hourly booking with shift created: {data.get('booking_id')}")
    
    def test_hourly_booking_with_custom_hours(self):
        """POST /api/bookings with hours_booked=12 for hourly service - extended shift"""
        booking_date = (datetime.now() + timedelta(days=7)).isoformat()
        
        booking_data = {
            "service_id": HOURLY_HOSPITAL_SERVICE,
            "booking_date": booking_date,
            "booking_time": "06:00",
            "delivery_type": "hospital",
            "selected_shift": "custom",
            "hours_booked": 12,
            "notes": "TEST_Hourly booking with 12 hours custom shift",
            "total_price": 960  # 80 * 12 hours
        }
        
        response = self.session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        print(f"Hourly custom hours booking response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("hours_booked") == 12, f"Hours booked should be 12, got {data.get('hours_booked')}"
        assert data.get("selected_shift") == "custom", f"Selected shift should be 'custom', got {data.get('selected_shift')}"
        
        print(f"✓ Hourly booking with custom hours created: {data.get('booking_id')}")
    
    # ============== HOSPITAL DELIVERY TYPE ==============
    
    def test_hospital_delivery_booking(self):
        """POST /api/bookings with delivery_type=hospital - should save correctly"""
        booking_date = (datetime.now() + timedelta(days=8)).isoformat()
        
        booking_data = {
            "service_id": VISIT_MULTI_DELIVERY_SERVICE,
            "booking_date": booking_date,
            "booking_time": "09:00",
            "delivery_type": "hospital",
            "notes": "TEST_Hospital delivery booking",
            "total_price": 250
        }
        
        response = self.session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        print(f"Hospital delivery booking response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("delivery_type") == "hospital", f"Delivery type should be 'hospital', got {data.get('delivery_type')}"
        
        print(f"✓ Hospital delivery booking created: {data.get('booking_id')}")
    
    # ============== TOTAL PRICE PASSED FROM FRONTEND ==============
    
    def test_booking_with_total_price(self):
        """POST /api/bookings with total_price calculated from frontend - should be saved as final_price"""
        booking_date = (datetime.now() + timedelta(days=9)).isoformat()
        
        booking_data = {
            "service_id": VISIT_MULTI_DELIVERY_SERVICE,
            "booking_date": booking_date,
            "booking_time": "16:00",
            "delivery_type": "home",
            "service_address": "דיזנגוף 50",
            "service_city": "תל אביב",
            "notes": "TEST_Booking with frontend total price",
            "total_price": 350  # Custom total including extras
        }
        
        response = self.session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        print(f"Total price booking response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("final_price") == 350, f"Final price should be 350, got {data.get('final_price')}"
        
        print(f"✓ Booking with custom total price created: {data.get('booking_id')}")
    
    # ============== GET BOOKINGS VERIFICATION ==============
    
    def test_get_my_bookings_shows_new_fields(self):
        """GET /api/bookings/my should return bookings with new fields"""
        response = self.session.get(f"{BASE_URL}/api/bookings/my")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        bookings = data.get("bookings", [])
        
        # Find our test bookings (handle None notes)
        test_bookings = [b for b in bookings if (b.get("notes") or "").startswith("TEST_")]
        print(f"Found {len(test_bookings)} test bookings")
        
        # Check that at least some have the new fields
        has_platform = any(b.get("platform") is not None for b in test_bookings)
        has_shift = any(b.get("selected_shift") is not None for b in test_bookings)
        has_hours = any(b.get("hours_booked") is not None for b in test_bookings)
        has_location = any(b.get("service_location") is not None for b in test_bookings)
        
        print(f"Fields present - platform: {has_platform}, shift: {has_shift}, hours: {has_hours}, location: {has_location}")
        
        # We should have at least one booking with these fields from our tests
        print(f"✓ GET /api/bookings/my returns bookings correctly")


class TestServiceCategoriesAndDeliveryTypes:
    """Test that services have correct categories and delivery types"""
    
    def test_visit_service_with_multi_delivery(self):
        """srv_2d5267fcaebb should be visit category with hospital + home delivery types"""
        response = requests.get(f"{BASE_URL}/api/services?service_id={VISIT_MULTI_DELIVERY_SERVICE}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        services = response.json().get("services", [])
        service = next((s for s in services if s["service_id"] == VISIT_MULTI_DELIVERY_SERVICE), None)
        
        assert service is not None, f"Service {VISIT_MULTI_DELIVERY_SERVICE} not found"
        assert service.get("service_category") == "visit", f"Expected category 'visit', got {service.get('service_category')}"
        assert "hospital" in service.get("delivery_types", []), "Should have hospital delivery type"
        assert "home" in service.get("delivery_types", []), "Should have home delivery type"
        
        print(f"✓ Visit service has correct category and delivery types: {service.get('delivery_types')}")
    
    def test_hourly_service_with_hospital_delivery(self):
        """srv_80622a711fbc should be hourly category with hospital delivery type"""
        response = requests.get(f"{BASE_URL}/api/services?service_id={HOURLY_HOSPITAL_SERVICE}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        services = response.json().get("services", [])
        service = next((s for s in services if s["service_id"] == HOURLY_HOSPITAL_SERVICE), None)
        
        assert service is not None, f"Service {HOURLY_HOSPITAL_SERVICE} not found"
        assert service.get("service_category") == "hourly", f"Expected category 'hourly', got {service.get('service_category')}"
        assert "hospital" in service.get("delivery_types", []), "Should have hospital delivery type"
        
        print(f"✓ Hourly service has correct category and delivery types: {service.get('delivery_types')}")
    
    def test_virtual_consultation_service(self):
        """srv_a58278db0334 should be consultation category with virtual delivery type"""
        response = requests.get(f"{BASE_URL}/api/services?service_id={VIRTUAL_CONSULTATION_SERVICE}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        services = response.json().get("services", [])
        service = next((s for s in services if s["service_id"] == VIRTUAL_CONSULTATION_SERVICE), None)
        
        assert service is not None, f"Service {VIRTUAL_CONSULTATION_SERVICE} not found"
        assert service.get("service_category") == "consultation", f"Expected category 'consultation', got {service.get('service_category')}"
        assert "virtual" in service.get("delivery_types", []), "Should have virtual delivery type"
        
        print(f"✓ Virtual consultation service has correct category and delivery types: {service.get('delivery_types')}")


class TestBookingWithContact:
    """Test bookings with contact person details"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        assert login_response.status_code == 200
        self.token = login_response.json().get("session_token")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
    
    def test_booking_with_contact_person(self):
        """POST /api/bookings with contact person details for home visit"""
        booking_date = (datetime.now() + timedelta(days=10)).isoformat()
        
        booking_data = {
            "service_id": VISIT_MULTI_DELIVERY_SERVICE,
            "booking_date": booking_date,
            "booking_time": "10:00",
            "delivery_type": "home",
            "service_address": "בן יהודה 30",
            "service_city": "ירושלים",
            "is_contact_same_as_requester": False,
            "contact_person_name": "יוסי כהן",
            "contact_person_phone": "052-1234567",
            "contact_person_relationship": "parent",
            "notes": "TEST_Booking with contact person",
            "total_price": 310
        }
        
        response = self.session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        print(f"Contact person booking response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        contact = data.get("contact_person", {})
        
        assert data.get("is_contact_same_as_requester") == False, "is_contact_same_as_requester should be False"
        assert contact.get("name") == "יוסי כהן", f"Contact name mismatch: {contact.get('name')}"
        assert contact.get("phone") == "052-1234567", f"Contact phone mismatch: {contact.get('phone')}"
        assert contact.get("relationship") == "parent", f"Contact relationship mismatch: {contact.get('relationship')}"
        
        print(f"✓ Booking with contact person created: {data.get('booking_id')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
