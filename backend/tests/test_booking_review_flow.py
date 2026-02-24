"""
Tests for Booking Status Flow and Review Management
Testing: booking status transitions, review creation, admin review management
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@carelink.co.il"
ADMIN_PASSWORD = "password"
USER_EMAIL = "user@carelink.co.il"
USER_PASSWORD = "password"
PROVIDER_EMAIL = "provider@carelink.co.il"
PROVIDER_PASSWORD = "password"


class TestAuthSetup:
    """Authentication tests - run first to get tokens"""
    
    def test_admin_login(self, api_client):
        """Test admin login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "session_token" in data or "token" in data, f"Missing token in response: {data}"
        print(f"Admin login: PASS")

    def test_user_login(self, api_client):
        """Test user login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        assert response.status_code == 200, f"User login failed: {response.text}"
        data = response.json()
        assert "session_token" in data or "token" in data
        print(f"User login: PASS")

    def test_provider_login(self, api_client):
        """Test provider login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": PROVIDER_EMAIL,
            "password": PROVIDER_PASSWORD
        })
        assert response.status_code == 200, f"Provider login failed: {response.text}"
        data = response.json()
        assert "session_token" in data or "token" in data
        print(f"Provider login: PASS")


class TestBookingStatusEndpoints:
    """Test booking status change endpoints for providers"""
    
    def test_confirm_booking_endpoint(self, provider_client):
        """Test PUT /api/bookings/{id}/confirm endpoint exists"""
        # First get a booking to test with
        bookings_res = provider_client.get(f"{BASE_URL}/api/bookings/provider")
        assert bookings_res.status_code == 200, f"Failed to get provider bookings: {bookings_res.text}"
        
        bookings = bookings_res.json().get("bookings", [])
        pending_bookings = [b for b in bookings if b.get("status") == "pending"]
        
        if pending_bookings:
            booking_id = pending_bookings[0]["booking_id"]
            response = provider_client.put(f"{BASE_URL}/api/bookings/{booking_id}/confirm", json={})
            assert response.status_code in [200, 400], f"Confirm endpoint error: {response.text}"
            print(f"Confirm booking endpoint: PASS (status: {response.status_code})")
        else:
            # Test with fake ID to verify endpoint exists
            response = provider_client.put(f"{BASE_URL}/api/bookings/fake_booking_id/confirm", json={})
            assert response.status_code == 404, f"Expected 404 for non-existent booking: {response.text}"
            print(f"Confirm booking endpoint exists: PASS (404 for non-existent)")
    
    def test_reject_booking_endpoint(self, provider_client):
        """Test PUT /api/bookings/{id}/reject endpoint exists"""
        response = provider_client.put(f"{BASE_URL}/api/bookings/fake_booking_id/reject", json={})
        assert response.status_code == 404, f"Expected 404 for non-existent booking: {response.text}"
        print(f"Reject booking endpoint exists: PASS")
    
    def test_hold_booking_endpoint(self, provider_client):
        """Test PUT /api/bookings/{id}/hold endpoint exists"""
        response = provider_client.put(f"{BASE_URL}/api/bookings/fake_booking_id/hold", json={})
        assert response.status_code == 404, f"Expected 404 for non-existent booking: {response.text}"
        print(f"Hold booking endpoint exists: PASS")
    
    def test_provider_complete_endpoint(self, provider_client):
        """Test PUT /api/bookings/{id}/provider-complete endpoint exists"""
        response = provider_client.put(f"{BASE_URL}/api/bookings/fake_booking_id/provider-complete", json={})
        assert response.status_code == 404, f"Expected 404 for non-existent booking: {response.text}"
        print(f"Provider-complete endpoint exists: PASS")


class TestClientConfirmEndpoint:
    """Test client confirmation endpoint"""
    
    def test_client_confirm_endpoint(self, user_client):
        """Test PUT /api/bookings/{id}/client-confirm endpoint exists"""
        response = user_client.put(f"{BASE_URL}/api/bookings/fake_booking_id/client-confirm", json={})
        assert response.status_code == 404, f"Expected 404 for non-existent booking: {response.text}"
        print(f"Client-confirm endpoint exists: PASS")


class TestReviewEndpoints:
    """Test review creation and admin review management endpoints"""
    
    def test_create_review_endpoint(self, user_client):
        """Test POST /api/reviews endpoint exists"""
        # Try to create review without booking - should fail gracefully
        response = user_client.post(f"{BASE_URL}/api/reviews", json={
            "provider_id": "fake_provider",
            "booking_id": "fake_booking",
            "rating": 5,
            "comment": "Test review comment with more than 10 characters"
        })
        # Should get 400/403/404 but not 500
        assert response.status_code in [400, 403, 404], f"Review endpoint error: {response.text}"
        print(f"Create review endpoint exists: PASS")
    
    def test_admin_get_reviews_endpoint(self, admin_client):
        """Test GET /api/admin/reviews endpoint"""
        response = admin_client.get(f"{BASE_URL}/api/admin/reviews")
        assert response.status_code == 200, f"Failed to get admin reviews: {response.text}"
        data = response.json()
        assert "reviews" in data, f"Missing reviews in response: {data}"
        print(f"Admin get reviews: PASS ({len(data['reviews'])} reviews found)")
    
    def test_admin_get_reviews_with_pending_filter(self, admin_client):
        """Test GET /api/admin/reviews?status=pending"""
        response = admin_client.get(f"{BASE_URL}/api/admin/reviews?status=pending")
        assert response.status_code == 200, f"Failed to filter pending reviews: {response.text}"
        data = response.json()
        assert "reviews" in data
        print(f"Admin get pending reviews: PASS ({len(data['reviews'])} pending)")
    
    def test_admin_get_reviews_with_approved_filter(self, admin_client):
        """Test GET /api/admin/reviews?status=approved"""
        response = admin_client.get(f"{BASE_URL}/api/admin/reviews?status=approved")
        assert response.status_code == 200, f"Failed to filter approved reviews: {response.text}"
        print(f"Admin get approved reviews: PASS")
    
    def test_admin_get_reviews_with_rejected_filter(self, admin_client):
        """Test GET /api/admin/reviews?status=rejected"""
        response = admin_client.get(f"{BASE_URL}/api/admin/reviews?status=rejected")
        assert response.status_code == 200, f"Failed to filter rejected reviews: {response.text}"
        print(f"Admin get rejected reviews: PASS")
    
    def test_admin_approve_review_endpoint(self, admin_client):
        """Test PUT /api/admin/reviews/{id}/approve endpoint exists"""
        response = admin_client.put(f"{BASE_URL}/api/admin/reviews/fake_review_id/approve", json={})
        assert response.status_code == 404, f"Expected 404 for non-existent review: {response.text}"
        print(f"Admin approve review endpoint exists: PASS")
    
    def test_admin_reject_review_endpoint(self, admin_client):
        """Test PUT /api/admin/reviews/{id}/reject endpoint exists"""
        response = admin_client.put(f"{BASE_URL}/api/admin/reviews/fake_review_id/reject", json={
            "reason": "Test rejection reason"
        })
        assert response.status_code == 404, f"Expected 404 for non-existent review: {response.text}"
        print(f"Admin reject review endpoint exists: PASS")


class TestFullBookingFlow:
    """Test complete booking lifecycle: pending -> confirmed -> provider_completed -> completed"""
    
    def test_get_user_bookings(self, user_client):
        """Test GET /api/bookings/my for user"""
        response = user_client.get(f"{BASE_URL}/api/bookings/my")
        assert response.status_code == 200, f"Failed to get user bookings: {response.text}"
        data = response.json()
        assert "bookings" in data
        print(f"Get user bookings: PASS ({len(data['bookings'])} bookings)")
    
    def test_get_provider_bookings(self, provider_client):
        """Test GET /api/bookings/provider for provider"""
        response = provider_client.get(f"{BASE_URL}/api/bookings/provider")
        assert response.status_code == 200, f"Failed to get provider bookings: {response.text}"
        data = response.json()
        assert "bookings" in data
        print(f"Get provider bookings: PASS ({len(data['bookings'])} bookings)")
    
    def test_booking_status_labels_exist(self, user_client):
        """Verify booking status values in response"""
        response = user_client.get(f"{BASE_URL}/api/bookings/my")
        assert response.status_code == 200
        
        bookings = response.json().get("bookings", [])
        valid_statuses = ["pending", "confirmed", "provider_completed", "completed", "cancelled", "rejected", "on_hold"]
        
        for booking in bookings:
            status = booking.get("status")
            assert status in valid_statuses, f"Invalid status: {status}"
        
        print(f"Booking status labels valid: PASS")


class TestGetMyReviews:
    """Test user review retrieval"""
    
    def test_get_my_reviews(self, user_client):
        """Test GET /api/reviews/my endpoint"""
        response = user_client.get(f"{BASE_URL}/api/reviews/my")
        assert response.status_code == 200, f"Failed to get user reviews: {response.text}"
        data = response.json()
        assert "reviews" in data
        print(f"Get my reviews: PASS ({len(data['reviews'])} reviews)")


# Fixtures
@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def get_auth_token(email, password):
    """Helper to get auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": email,
        "password": password
    })
    if response.status_code == 200:
        data = response.json()
        return data.get("session_token") or data.get("token")
    return None


@pytest.fixture
def admin_client(api_client):
    """Admin authenticated client"""
    token = get_auth_token(ADMIN_EMAIL, ADMIN_PASSWORD)
    if token:
        api_client.headers.update({"Authorization": f"Bearer {token}"})
    else:
        pytest.skip("Admin authentication failed")
    return api_client


@pytest.fixture
def user_client():
    """User authenticated client"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    token = get_auth_token(USER_EMAIL, USER_PASSWORD)
    if token:
        session.headers.update({"Authorization": f"Bearer {token}"})
    else:
        pytest.skip("User authentication failed")
    return session


@pytest.fixture
def provider_client():
    """Provider authenticated client"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    token = get_auth_token(PROVIDER_EMAIL, PROVIDER_PASSWORD)
    if token:
        session.headers.update({"Authorization": f"Bearer {token}"})
    else:
        pytest.skip("Provider authentication failed")
    return session
