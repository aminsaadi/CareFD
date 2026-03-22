"""
Admin Panel Comprehensive Tests
Tests for admin login, reviews, subscriptions, settings, users, bookings, providers management
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@carefd.com"
ADMIN_PASSWORD = "password"
USER_EMAIL = "user@carefd.com"
USER_PASSWORD = "password"


class TestAdminAuth:
    """Test admin authentication"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Login as admin and get token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        return data.get("session_token") or data.get("token")
    
    def test_admin_login(self):
        """Test admin can login"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "session_token" in data or "token" in data
        assert data.get("user", {}).get("role") == "admin"
        print("PASS: Admin login successful")

    def test_user_login(self):
        """Test regular user can login"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": USER_EMAIL, "password": USER_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "session_token" in data or "token" in data
        print("PASS: User login successful")


class TestAdminStats:
    """Test admin stats/overview endpoint"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Login as admin and get token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        data = response.json()
        return data.get("session_token") or data.get("token")
    
    def test_admin_stats(self, admin_token):
        """Test /admin/stats endpoint returns real data"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        # Verify stats fields exist
        assert "total_users" in data
        assert "total_providers" in data
        assert "total_bookings" in data
        assert "total_reviews" in data
        print(f"PASS: Admin stats - Users: {data['total_users']}, Providers: {data['total_providers']}, Bookings: {data['total_bookings']}")


class TestAdminReviews:
    """Test admin reviews management"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Login as admin and get token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        data = response.json()
        return data.get("session_token") or data.get("token")
    
    def test_get_all_reviews(self, admin_token):
        """Test getting all reviews without filter"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reviews",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "reviews" in data
        print(f"PASS: Get all reviews - Count: {len(data['reviews'])}")
    
    def test_get_pending_reviews(self, admin_token):
        """Test filtering reviews by status=pending"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reviews?status=pending",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "reviews" in data
        # Verify all returned reviews are pending
        for review in data["reviews"]:
            assert review.get("status") == "pending"
        print(f"PASS: Get pending reviews - Count: {len(data['reviews'])}")
    
    def test_get_approved_reviews(self, admin_token):
        """Test filtering reviews by status=approved"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reviews?status=approved",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "reviews" in data
        for review in data["reviews"]:
            assert review.get("status") == "approved"
        print(f"PASS: Get approved reviews - Count: {len(data['reviews'])}")
    
    def test_get_rejected_reviews(self, admin_token):
        """Test filtering reviews by status=rejected"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reviews?status=rejected",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "reviews" in data
        for review in data["reviews"]:
            assert review.get("status") == "rejected"
        print(f"PASS: Get rejected reviews - Count: {len(data['reviews'])}")


class TestAdminSubscriptions:
    """Test admin subscriptions and plans management"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Login as admin and get token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        data = response.json()
        return data.get("session_token") or data.get("token")
    
    def test_get_subscription_plans_public(self):
        """Test getting subscription plans (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/subscription-plans")
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data
        plans = data["plans"]
        assert len(plans) >= 3, "Should have at least 3 plans (Free, Pro, Gold)"
        # Check plan tiers
        tiers = [p.get("tier") for p in plans]
        assert "free" in tiers
        assert "pro" in tiers
        assert "gold" in tiers
        print(f"PASS: Get subscription plans - Found {len(plans)} plans: {tiers}")
    
    def test_get_admin_subscriptions(self, admin_token):
        """Test getting all subscriptions (admin)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/subscriptions",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "subscriptions" in data
        assert "stats" in data
        print(f"PASS: Get admin subscriptions - Total: {len(data['subscriptions'])}, Stats: {data['stats']}")


class TestAdminSettings:
    """Test admin settings management"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Login as admin and get token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        data = response.json()
        return data.get("session_token") or data.get("token")
    
    def test_get_admin_settings(self, admin_token):
        """Test getting site settings"""
        response = requests.get(
            f"{BASE_URL}/api/admin/settings",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        # Check for expected settings fields
        assert "site_name" in data or "contact_email" in data
        print(f"PASS: Get admin settings - Site: {data.get('site_name', 'N/A')}")
    
    def test_save_admin_settings(self, admin_token):
        """Test saving site settings"""
        # Get current settings first
        response = requests.get(
            f"{BASE_URL}/api/admin/settings",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        current_settings = response.json()
        
        # Update with same values (to not break anything)
        response = requests.put(
            f"{BASE_URL}/api/admin/settings",
            headers={"Authorization": f"Bearer {admin_token}"},
            json=current_settings
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("message") == "Settings updated successfully"
        print("PASS: Save admin settings successful")


class TestAdminUsers:
    """Test admin users management"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Login as admin and get token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        data = response.json()
        return data.get("session_token") or data.get("token")
    
    def test_get_admin_users(self, admin_token):
        """Test getting all users"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "total" in data
        print(f"PASS: Get admin users - Total: {data['total']}")
    
    def test_filter_users_by_role(self, admin_token):
        """Test filtering users by role"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users?role=provider",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        print(f"PASS: Filter users by role - Providers: {len(data['users'])}")


class TestAdminBookings:
    """Test admin bookings management"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Login as admin and get token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        data = response.json()
        return data.get("session_token") or data.get("token")
    
    def test_get_admin_bookings(self, admin_token):
        """Test getting all bookings"""
        response = requests.get(
            f"{BASE_URL}/api/admin/bookings",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "bookings" in data
        assert "total" in data
        print(f"PASS: Get admin bookings - Total: {data['total']}")
    
    def test_filter_bookings_by_status(self, admin_token):
        """Test filtering bookings by status"""
        for status in ["pending", "confirmed", "completed", "cancelled"]:
            response = requests.get(
                f"{BASE_URL}/api/admin/bookings?status={status}",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert response.status_code == 200
            data = response.json()
            assert "bookings" in data
            print(f"PASS: Filter bookings by status={status} - Count: {len(data['bookings'])}")


class TestAdminProviders:
    """Test admin providers management"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Login as admin and get token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        data = response.json()
        return data.get("session_token") or data.get("token")
    
    def test_get_admin_providers(self, admin_token):
        """Test getting all providers"""
        response = requests.get(
            f"{BASE_URL}/api/admin/providers",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "providers" in data
        assert "total" in data
        print(f"PASS: Get admin providers - Total: {data['total']}")
    
    def test_get_pending_providers(self, admin_token):
        """Test getting pending verification providers"""
        response = requests.get(
            f"{BASE_URL}/api/admin/providers/pending",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "providers" in data
        assert "total" in data
        print(f"PASS: Get pending providers - Total: {data['total']}")
    
    def test_filter_providers_by_status(self, admin_token):
        """Test filtering providers by verification status"""
        response = requests.get(
            f"{BASE_URL}/api/admin/providers?status=verified",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "providers" in data
        print(f"PASS: Filter verified providers - Count: {len(data['providers'])}")


class TestAdminUnauthorized:
    """Test that non-admin users cannot access admin endpoints"""
    
    @pytest.fixture(scope="class")
    def user_token(self):
        """Login as regular user and get token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": USER_EMAIL, "password": USER_PASSWORD}
        )
        data = response.json()
        return data.get("session_token") or data.get("token")
    
    def test_user_cannot_access_admin_stats(self, user_token):
        """Test regular user cannot access admin stats"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 403
        print("PASS: Regular user blocked from admin stats")
    
    def test_user_cannot_access_admin_users(self, user_token):
        """Test regular user cannot access admin users"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 403
        print("PASS: Regular user blocked from admin users")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
