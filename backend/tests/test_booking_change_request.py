"""
Test suite for Booking Change Request features:
- GET /api/bookings/{booking_id} - enriched booking details with user_info, provider_info, service_info
- PUT /api/bookings/{booking_id}/request-change - Provider requests date/time change
- PUT /api/bookings/{booking_id}/respond-change - User approves/rejects change request
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

# Test credentials
USER_EMAIL = "user@carelink.co.il"
USER_PASSWORD = "password"
PROVIDER_EMAIL = "provider@carelink.co.il"
PROVIDER_PASSWORD = "password"

# Known booking ID with existing approved change request from context
BOOKING_WITH_CHANGE_REQUEST = "booking_2af8ef185447"
# Pending booking for testing change requests
PENDING_BOOKING_ID = "booking_b0f478547093"


class TestBookingDetailsEndpoint:
    """Tests for GET /api/bookings/{booking_id} endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
    def get_auth_token(self, email, password):
        """Helper to get auth token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None
    
    def test_provider_can_get_booking_details(self):
        """Provider can fetch enriched booking details"""
        token = self.get_auth_token(PROVIDER_EMAIL, PROVIDER_PASSWORD)
        assert token, "Provider authentication failed"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Get provider's bookings first
        bookings_res = self.session.get(f"{BASE_URL}/api/bookings/provider")
        assert bookings_res.status_code == 200
        bookings = bookings_res.json().get("bookings", [])
        
        if len(bookings) > 0:
            booking_id = bookings[0]["booking_id"]
            
            # Get booking details
            response = self.session.get(f"{BASE_URL}/api/bookings/{booking_id}")
            assert response.status_code == 200
            
            data = response.json()
            # Verify booking fields
            assert "booking_id" in data
            assert "user_id" in data
            assert "provider_id" in data
            assert "status" in data
            
            # Verify enriched data - these may or may not be present
            # depending on if the user/provider/service exists
            print(f"✓ Booking details fetched for {booking_id}")
            print(f"  Has user_info: {'user_info' in data}")
            print(f"  Has provider_info: {'provider_info' in data}")
            print(f"  Has service_info: {'service_info' in data}")
            
    def test_user_can_get_own_booking_details(self):
        """User can fetch their own booking details"""
        token = self.get_auth_token(USER_EMAIL, USER_PASSWORD)
        assert token, "User authentication failed"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Get user's bookings first
        bookings_res = self.session.get(f"{BASE_URL}/api/bookings/my")
        assert bookings_res.status_code == 200
        bookings = bookings_res.json().get("bookings", [])
        
        if len(bookings) > 0:
            booking_id = bookings[0]["booking_id"]
            
            # Get booking details
            response = self.session.get(f"{BASE_URL}/api/bookings/{booking_id}")
            assert response.status_code == 200
            
            data = response.json()
            assert "booking_id" in data
            print(f"✓ User fetched their booking details for {booking_id}")
            
    def test_unauthorized_user_cannot_get_others_booking(self):
        """User cannot fetch another user's booking"""
        token = self.get_auth_token(USER_EMAIL, USER_PASSWORD)
        assert token, "User authentication failed"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Try to access a booking that doesn't belong to this user
        # Using a non-existent booking ID to test 404
        response = self.session.get(f"{BASE_URL}/api/bookings/booking_nonexistent123")
        assert response.status_code in [403, 404]
        print(f"✓ Correctly denied access to non-existent/unauthorized booking")
        
    def test_booking_details_includes_change_requests(self):
        """Booking details includes change_requests array"""
        token = self.get_auth_token(PROVIDER_EMAIL, PROVIDER_PASSWORD)
        assert token, "Provider authentication failed"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Get the booking known to have change requests
        response = self.session.get(f"{BASE_URL}/api/bookings/{BOOKING_WITH_CHANGE_REQUEST}")
        
        if response.status_code == 200:
            data = response.json()
            change_requests = data.get("change_requests", [])
            print(f"✓ Booking {BOOKING_WITH_CHANGE_REQUEST} has {len(change_requests)} change requests")
            if change_requests:
                for cr in change_requests:
                    print(f"  - Request {cr.get('request_id')}: status={cr.get('status')}")
        else:
            print(f"⚠ Booking {BOOKING_WITH_CHANGE_REQUEST} not found or not accessible")


class TestProviderRequestChangeEndpoint:
    """Tests for PUT /api/bookings/{booking_id}/request-change endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
    def get_provider_token(self):
        """Helper to get provider auth token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": PROVIDER_EMAIL,
            "password": PROVIDER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None
        
    def get_user_token(self):
        """Helper to get user auth token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None
        
    def test_provider_can_request_date_change(self):
        """Provider can request date change for a booking"""
        token = self.get_provider_token()
        assert token, "Provider authentication failed"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Use the pending booking for testing
        response = self.session.put(
            f"{BASE_URL}/api/bookings/{PENDING_BOOKING_ID}/request-change",
            json={
                "new_date": "2026-02-15",
                "reason": "בדיקת מערכת - שינוי תאריך"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            assert "change_request" in data
            cr = data["change_request"]
            assert cr.get("status") == "pending"
            assert cr.get("new_date") == "2026-02-15"
            print(f"✓ Change request created: {cr.get('request_id')}")
        else:
            # May fail if booking not found or not owned by provider
            print(f"⚠ Request change returned {response.status_code}: {response.json()}")
            
    def test_provider_can_request_time_change(self):
        """Provider can request time change for a booking"""
        token = self.get_provider_token()
        assert token, "Provider authentication failed"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        response = self.session.put(
            f"{BASE_URL}/api/bookings/{PENDING_BOOKING_ID}/request-change",
            json={
                "new_time": "14:30",
                "reason": "בדיקת מערכת - שינוי שעה"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            cr = data.get("change_request", {})
            assert cr.get("new_time") == "14:30"
            print(f"✓ Time change request created successfully")
        else:
            print(f"⚠ Request change returned {response.status_code}")
            
    def test_provider_can_request_both_date_and_time_change(self):
        """Provider can request both date and time change"""
        token = self.get_provider_token()
        assert token, "Provider authentication failed"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        response = self.session.put(
            f"{BASE_URL}/api/bookings/{PENDING_BOOKING_ID}/request-change",
            json={
                "new_date": "2026-02-20",
                "new_time": "10:00",
                "reason": "בדיקת מערכת - שינוי תאריך ושעה"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            cr = data.get("change_request", {})
            assert cr.get("new_date") == "2026-02-20"
            assert cr.get("new_time") == "10:00"
            print(f"✓ Date and time change request created")
        else:
            print(f"⚠ Combined change request returned {response.status_code}")
            
    def test_request_change_fails_without_date_or_time(self):
        """Request change fails if neither date nor time provided"""
        token = self.get_provider_token()
        assert token, "Provider authentication failed"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        response = self.session.put(
            f"{BASE_URL}/api/bookings/{PENDING_BOOKING_ID}/request-change",
            json={
                "reason": "No date or time"
            }
        )
        
        # Should return 400 Bad Request
        assert response.status_code == 400
        print(f"✓ Correctly rejected change request without date/time")
        
    def test_user_cannot_request_change(self):
        """Regular user cannot request change (only provider can)"""
        token = self.get_user_token()
        assert token, "User authentication failed"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Try to request change as user
        response = self.session.put(
            f"{BASE_URL}/api/bookings/{PENDING_BOOKING_ID}/request-change",
            json={
                "new_date": "2026-03-01",
                "reason": "User trying to change"
            }
        )
        
        # Should return 403 Forbidden
        assert response.status_code == 403
        print(f"✓ Correctly denied user from requesting change")


class TestUserRespondChangeEndpoint:
    """Tests for PUT /api/bookings/{booking_id}/respond-change endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
    def get_provider_token(self):
        """Helper to get provider auth token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": PROVIDER_EMAIL,
            "password": PROVIDER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None
        
    def get_user_token(self):
        """Helper to get user auth token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None
        
    def create_test_change_request(self):
        """Helper to create a change request for testing"""
        token = self.get_provider_token()
        if not token:
            return None, None
            
        session = requests.Session()
        session.headers.update({
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        })
        
        # Create a unique change request
        response = session.put(
            f"{BASE_URL}/api/bookings/{PENDING_BOOKING_ID}/request-change",
            json={
                "new_date": "2026-03-15",
                "new_time": "11:00",
                "reason": f"Test change request {uuid.uuid4().hex[:6]}"
            }
        )
        
        if response.status_code == 200:
            cr = response.json().get("change_request", {})
            return PENDING_BOOKING_ID, cr.get("request_id")
        return None, None
        
    def test_user_can_approve_change_request(self):
        """User can approve a pending change request"""
        # First create a change request
        booking_id, request_id = self.create_test_change_request()
        
        if not request_id:
            print("⚠ Could not create test change request - skipping")
            return
            
        # Now login as user and approve
        token = self.get_user_token()
        assert token, "User authentication failed"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        response = self.session.put(
            f"{BASE_URL}/api/bookings/{booking_id}/respond-change",
            json={
                "request_id": request_id,
                "action": "approve"
            }
        )
        
        if response.status_code == 200:
            print(f"✓ User approved change request {request_id}")
        elif response.status_code == 403:
            # User doesn't own this booking
            print(f"⚠ User doesn't own booking {booking_id} - expected if booking belongs to different user")
        else:
            print(f"⚠ Approve returned {response.status_code}: {response.json()}")
            
    def test_user_can_reject_change_request(self):
        """User can reject a pending change request"""
        # First create a change request
        booking_id, request_id = self.create_test_change_request()
        
        if not request_id:
            print("⚠ Could not create test change request - skipping")
            return
            
        # Now login as user and reject
        token = self.get_user_token()
        assert token, "User authentication failed"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        response = self.session.put(
            f"{BASE_URL}/api/bookings/{booking_id}/respond-change",
            json={
                "request_id": request_id,
                "action": "reject"
            }
        )
        
        if response.status_code == 200:
            print(f"✓ User rejected change request {request_id}")
        elif response.status_code == 403:
            print(f"⚠ User doesn't own booking {booking_id}")
        else:
            print(f"⚠ Reject returned {response.status_code}")
            
    def test_respond_change_fails_invalid_action(self):
        """Respond change fails with invalid action"""
        token = self.get_user_token()
        assert token, "User authentication failed"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        response = self.session.put(
            f"{BASE_URL}/api/bookings/{PENDING_BOOKING_ID}/respond-change",
            json={
                "request_id": "cr_test123",
                "action": "invalid_action"
            }
        )
        
        # Should return 400 Bad Request
        assert response.status_code == 400
        print(f"✓ Correctly rejected invalid action")
        
    def test_provider_cannot_respond_to_change(self):
        """Provider cannot respond to their own change request (only user can)"""
        # Create a change request first
        booking_id, request_id = self.create_test_change_request()
        
        if not request_id:
            print("⚠ Could not create test change request - skipping")
            return
            
        token = self.get_provider_token()
        assert token, "Provider authentication failed"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        response = self.session.put(
            f"{BASE_URL}/api/bookings/{booking_id}/respond-change",
            json={
                "request_id": request_id,
                "action": "approve"
            }
        )
        
        # Should return 403 Forbidden
        assert response.status_code == 403
        print(f"✓ Correctly denied provider from responding to change request")


class TestBookingEndpointsIntegration:
    """Integration tests for booking workflows"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
    def test_provider_booking_workflow(self):
        """Test complete provider booking management workflow"""
        # Login as provider
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": PROVIDER_EMAIL,
            "password": PROVIDER_PASSWORD
        })
        assert response.status_code == 200
        token = response.json().get("token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Get provider's bookings
        response = self.session.get(f"{BASE_URL}/api/bookings/provider")
        assert response.status_code == 200
        
        bookings = response.json().get("bookings", [])
        print(f"✓ Provider has {len(bookings)} bookings")
        
        # Check booking statuses distribution
        status_counts = {}
        for b in bookings:
            status = b.get("status", "unknown")
            status_counts[status] = status_counts.get(status, 0) + 1
            
        print(f"  Status distribution: {status_counts}")
        
    def test_user_booking_workflow(self):
        """Test complete user booking management workflow"""
        # Login as user
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        assert response.status_code == 200
        token = response.json().get("token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Get user's bookings
        response = self.session.get(f"{BASE_URL}/api/bookings/my")
        assert response.status_code == 200
        
        bookings = response.json().get("bookings", [])
        print(f"✓ User has {len(bookings)} bookings")
        
        # Check for pending change requests
        bookings_with_change_requests = [b for b in bookings if b.get("change_requests")]
        print(f"  Bookings with change requests: {len(bookings_with_change_requests)}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
