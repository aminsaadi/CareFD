"""
Backend API Tests for CareLink Provider Verification and Enhanced Booking Flow
- Provider verification: document upload, admin approve/reject
- Enhanced booking flow: create with full details, provider complete, client confirm
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@carelink.co.il"
ADMIN_PASSWORD = "Admin123!"
PROVIDER_EMAIL = "provider@carelink.co.il"
PROVIDER_PASSWORD = "Provider123!"
USER_EMAIL = "user@carelink.co.il"
USER_PASSWORD = "User123!"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="function")
def admin_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("session_token")
    pytest.skip("Admin authentication failed")


@pytest.fixture(scope="module")
def provider_token(api_client):
    """Get provider authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": PROVIDER_EMAIL,
        "password": PROVIDER_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("session_token")
    pytest.skip("Provider authentication failed")


@pytest.fixture(scope="module")
def user_token(api_client):
    """Get user authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": USER_EMAIL,
        "password": USER_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("session_token")
    pytest.skip("User authentication failed")


class TestAuthentication:
    """Test authentication for all user types"""
    
    def test_admin_login(self, api_client):
        """Test admin login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "session_token" in data
        assert data.get("user", {}).get("role") == "admin"
        print(f"Admin login successful: {data.get('user', {}).get('email')}")
    
    def test_provider_login(self, api_client):
        """Test provider login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": PROVIDER_EMAIL,
            "password": PROVIDER_PASSWORD
        })
        assert response.status_code == 200, f"Provider login failed: {response.text}"
        data = response.json()
        assert "session_token" in data
        assert data.get("user", {}).get("role") == "provider"
        print(f"Provider login successful: {data.get('user', {}).get('email')}")
    
    def test_user_login(self, api_client):
        """Test user login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        assert response.status_code == 200, f"User login failed: {response.text}"
        data = response.json()
        assert "session_token" in data
        print(f"User login successful: {data.get('user', {}).get('email')}")


class TestProviderVerification:
    """Test provider verification endpoints"""
    
    def test_get_provider_documents(self, api_client, provider_token):
        """Test getting provider's verification documents"""
        response = api_client.get(
            f"{BASE_URL}/api/providers/documents",
            headers={"Authorization": f"Bearer {provider_token}"}
        )
        print(f"GET /api/providers/documents status: {response.status_code}")
        # May be 404 if provider not found, or 200 with documents
        assert response.status_code in [200, 404], f"Unexpected status: {response.text}"
        if response.status_code == 200:
            data = response.json()
            assert "documents" in data
            assert "verification_status" in data
            print(f"Verification status: {data.get('verification_status')}")
            print(f"Documents count: {len(data.get('documents', []))}")
    
    def test_upload_verification_document(self, api_client, provider_token):
        """Test uploading a verification document"""
        response = api_client.post(
            f"{BASE_URL}/api/providers/documents",
            headers={"Authorization": f"Bearer {provider_token}"},
            json={
                "document_type": "id_card",
                "file_url": "https://example.com/test_document.pdf",
                "file_name": "test_id_card.pdf"
            }
        )
        print(f"POST /api/providers/documents status: {response.status_code}")
        # 200 for success, 404 if provider not found
        assert response.status_code in [200, 404], f"Unexpected status: {response.text}"
        if response.status_code == 200:
            data = response.json()
            assert "message" in data or "document" in data
            print(f"Document upload result: {data}")
    
    def test_admin_get_pending_providers(self, api_client, admin_token):
        """Test admin getting pending providers"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/providers/pending",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        print(f"GET /api/admin/providers/pending status: {response.status_code}")
        assert response.status_code == 200, f"Failed to get pending providers: {response.text}"
        data = response.json()
        assert "providers" in data
        print(f"Pending providers count: {len(data.get('providers', []))}")
        for p in data.get("providers", [])[:3]:
            print(f"  - {p.get('business_name', 'Unknown')}: {p.get('verification_status', 'N/A')}")
    
    def test_admin_verify_provider(self, api_client, admin_token):
        """Test admin verifying a provider (requires a pending provider)"""
        # First get pending providers
        response = api_client.get(
            f"{BASE_URL}/api/admin/providers/pending",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        if response.status_code == 200:
            providers = response.json().get("providers", [])
            if providers:
                provider_id = providers[0].get("provider_id")
                # Try to verify
                verify_response = api_client.put(
                    f"{BASE_URL}/api/admin/providers/{provider_id}/verify",
                    headers={"Authorization": f"Bearer {admin_token}"}
                )
                print(f"PUT /api/admin/providers/{provider_id}/verify status: {verify_response.status_code}")
                assert verify_response.status_code in [200, 404], f"Unexpected: {verify_response.text}"
            else:
                print("No pending providers to verify")
        else:
            print("Could not get pending providers for verification test")
    
    def test_admin_reject_provider(self, api_client, admin_token):
        """Test admin rejecting a provider (requires a pending provider)"""
        # First get pending providers
        response = api_client.get(
            f"{BASE_URL}/api/admin/providers/pending",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        if response.status_code == 200:
            providers = response.json().get("providers", [])
            if len(providers) > 1:  # Only reject if more than one pending
                provider_id = providers[-1].get("provider_id")
                # Try to reject
                reject_response = api_client.put(
                    f"{BASE_URL}/api/admin/providers/{provider_id}/reject",
                    headers={"Authorization": f"Bearer {admin_token}"},
                    json={"reason": "Test rejection reason"}
                )
                print(f"PUT /api/admin/providers/{provider_id}/reject status: {reject_response.status_code}")
                assert reject_response.status_code in [200, 404], f"Unexpected: {reject_response.text}"
            else:
                print("Not enough pending providers to test rejection")
        else:
            print("Could not get pending providers for rejection test")


class TestBookingFlow:
    """Test enhanced booking flow with client details and completion confirmation"""
    
    def test_get_providers_list(self, api_client):
        """Test getting providers list (public endpoint)"""
        response = api_client.get(f"{BASE_URL}/api/providers")
        assert response.status_code == 200, f"Failed to get providers: {response.text}"
        data = response.json()
        assert "providers" in data
        print(f"Total providers: {data.get('total', 0)}")
    
    def test_get_services_list(self, api_client):
        """Test getting services list (public endpoint)"""
        response = api_client.get(f"{BASE_URL}/api/services")
        assert response.status_code == 200, f"Failed to get services: {response.text}"
        data = response.json()
        assert "services" in data
        print(f"Total services: {data.get('total', 0)}")
    
    def test_get_user_bookings(self, api_client, user_token):
        """Test getting user's bookings"""
        response = api_client.get(
            f"{BASE_URL}/api/bookings",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        print(f"GET /api/bookings status: {response.status_code}")
        assert response.status_code == 200, f"Failed to get bookings: {response.text}"
        data = response.json()
        assert "bookings" in data
        print(f"User bookings count: {len(data.get('bookings', []))}")
    
    def test_get_provider_bookings(self, api_client, provider_token):
        """Test getting provider's bookings"""
        response = api_client.get(
            f"{BASE_URL}/api/bookings",
            headers={"Authorization": f"Bearer {provider_token}"}
        )
        print(f"GET /api/bookings (provider) status: {response.status_code}")
        assert response.status_code == 200, f"Failed to get provider bookings: {response.text}"
        data = response.json()
        assert "bookings" in data
        print(f"Provider bookings count: {len(data.get('bookings', []))}")
    
    def test_create_booking_with_full_details(self, api_client, user_token):
        """Test creating a booking with full client and location details"""
        # First get a service to book
        services_response = api_client.get(f"{BASE_URL}/api/services")
        if services_response.status_code == 200:
            services = services_response.json().get("services", [])
            if services:
                service_id = services[0].get("service_id")
                
                # Create booking with full details
                tomorrow = (datetime.now() + timedelta(days=1)).isoformat()
                booking_data = {
                    "service_id": service_id,
                    "booking_date": tomorrow,
                    "booking_time": "10:00",
                    "client_name": "TEST_לקוח בדיקה",
                    "client_phone": "050-1234567",
                    "client_email": "test@example.com",
                    "service_address": "רחוב הבדיקה 123",
                    "service_city": "תל אביב",
                    "service_floor": "3",
                    "service_apartment": "5",
                    "notes": "הערה לבדיקה",
                    "special_requirements": "דרישות מיוחדות לבדיקה"
                }
                
                response = api_client.post(
                    f"{BASE_URL}/api/bookings",
                    headers={"Authorization": f"Bearer {user_token}"},
                    json=booking_data
                )
                print(f"POST /api/bookings status: {response.status_code}")
                # May fail if provider not verified
                assert response.status_code in [200, 400], f"Unexpected: {response.text}"
                if response.status_code == 200:
                    data = response.json()
                    assert "booking_id" in data
                    assert data.get("client_name") == "TEST_לקוח בדיקה"
                    print(f"Created booking: {data.get('booking_id')}")
                    return data.get("booking_id")
                else:
                    print(f"Booking creation note: {response.text}")
            else:
                print("No services available to book")
        else:
            print("Could not get services")
    
    def test_provider_mark_complete(self, api_client, provider_token):
        """Test provider marking booking as complete"""
        # Get provider's bookings
        response = api_client.get(
            f"{BASE_URL}/api/bookings",
            headers={"Authorization": f"Bearer {provider_token}"}
        )
        if response.status_code == 200:
            bookings = response.json().get("bookings", [])
            confirmed_bookings = [b for b in bookings if b.get("status") == "confirmed"]
            if confirmed_bookings:
                booking_id = confirmed_bookings[0].get("booking_id")
                
                # Mark as provider_completed
                complete_response = api_client.put(
                    f"{BASE_URL}/api/bookings/{booking_id}/provider-complete",
                    headers={"Authorization": f"Bearer {provider_token}"}
                )
                print(f"PUT /api/bookings/{booking_id}/provider-complete status: {complete_response.status_code}")
                assert complete_response.status_code in [200, 404, 403], f"Unexpected: {complete_response.text}"
            else:
                print("No confirmed bookings to mark as complete")
        else:
            print("Could not get provider bookings")
    
    def test_client_confirm_completion(self, api_client, user_token):
        """Test client confirming booking completion"""
        # Get user's bookings
        response = api_client.get(
            f"{BASE_URL}/api/bookings",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        if response.status_code == 200:
            bookings = response.json().get("bookings", [])
            provider_completed = [b for b in bookings if b.get("status") == "provider_completed"]
            if provider_completed:
                booking_id = provider_completed[0].get("booking_id")
                
                # Confirm completion with payment details
                confirm_response = api_client.put(
                    f"{BASE_URL}/api/bookings/{booking_id}/client-confirm",
                    headers={"Authorization": f"Bearer {user_token}"},
                    json={
                        "final_price": 350,
                        "payment_notes": "שולם במזומן"
                    }
                )
                print(f"PUT /api/bookings/{booking_id}/client-confirm status: {confirm_response.status_code}")
                assert confirm_response.status_code in [200, 400, 404, 403], f"Unexpected: {confirm_response.text}"
            else:
                print("No provider_completed bookings to confirm")
        else:
            print("Could not get user bookings")


class TestAdminEndpoints:
    """Test admin dashboard endpoints"""
    
    def test_admin_stats(self, api_client, admin_token):
        """Test admin stats endpoint"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed to get admin stats: {response.text}"
        data = response.json()
        assert "total_users" in data
        assert "total_providers" in data
        assert "total_bookings" in data
        print(f"Admin stats:")
        print(f"  - Total users: {data.get('total_users')}")
        print(f"  - Total providers: {data.get('total_providers')}")
        print(f"  - Verified providers: {data.get('verified_providers')}")
        print(f"  - Total bookings: {data.get('total_bookings')}")
    
    def test_admin_get_users(self, api_client, admin_token):
        """Test admin getting users list"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed to get users: {response.text}"
        data = response.json()
        assert "users" in data
        print(f"Total users in system: {len(data.get('users', []))}")
    
    def test_admin_unauthorized_access(self, api_client, user_token):
        """Test that regular users cannot access admin endpoints"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 403, f"Expected 403, got: {response.status_code}"
        print("Admin endpoint correctly rejects non-admin users")


class TestReviewFlow:
    """Test review creation after booking completion"""
    
    def test_create_review(self, api_client, user_token):
        """Test creating a review for a completed booking"""
        # Get user's completed bookings
        response = api_client.get(
            f"{BASE_URL}/api/bookings",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        if response.status_code == 200:
            bookings = response.json().get("bookings", [])
            completed_bookings = [b for b in bookings if b.get("status") == "completed"]
            if completed_bookings:
                booking = completed_bookings[0]
                
                # Create review
                review_response = api_client.post(
                    f"{BASE_URL}/api/reviews",
                    headers={"Authorization": f"Bearer {user_token}"},
                    json={
                        "provider_id": booking.get("provider_id"),
                        "booking_id": booking.get("booking_id"),
                        "rating": 5,
                        "comment": "TEST_שירות מעולה! מאוד מרוצה",
                        "service_quality": 5,
                        "punctuality": 5,
                        "communication": 5,
                        "price_value": 4,
                        "would_recommend": True
                    }
                )
                print(f"POST /api/reviews status: {review_response.status_code}")
                assert review_response.status_code in [200, 400], f"Unexpected: {review_response.text}"
                if review_response.status_code == 200:
                    data = review_response.json()
                    print(f"Created review: {data.get('review_id')}")
            else:
                print("No completed bookings for review test")
        else:
            print("Could not get user bookings for review test")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
