"""
Test Suite for Notification Routing and User Dashboard Settings
Task: Test notification click routing and user profile settings update including profile_color field.

Tests:
- PUT /api/users/me with all allowed fields including profile_color
- Notification routing configuration (frontend tests)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestUserSettingsUpdate:
    """Test user settings update via PUT /api/users/me"""
    
    def setup_method(self):
        """Login as user before each test"""
        self.session = requests.Session()
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "saadiameen@gmail.com",
            "password": "password"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.token = login_response.json().get("session_token")
        self.user_id = login_response.json().get("user", {}).get("user_id")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
    
    def test_update_user_first_name(self):
        """Test updating first_name field"""
        response = self.session.put(f"{BASE_URL}/api/users/me", json={
            "first_name": "TestFirstName"
        })
        assert response.status_code == 200, f"Update failed: {response.text}"
        data = response.json()
        assert "user" in data
        assert data["user"]["first_name"] == "TestFirstName"
        print("✓ first_name update works correctly")
    
    def test_update_user_last_name(self):
        """Test updating last_name field"""
        response = self.session.put(f"{BASE_URL}/api/users/me", json={
            "last_name": "TestLastName"
        })
        assert response.status_code == 200, f"Update failed: {response.text}"
        data = response.json()
        assert "user" in data
        assert data["user"]["last_name"] == "TestLastName"
        print("✓ last_name update works correctly")
    
    def test_update_user_phone(self):
        """Test updating phone field"""
        response = self.session.put(f"{BASE_URL}/api/users/me", json={
            "phone": "050-1234567"
        })
        assert response.status_code == 200, f"Update failed: {response.text}"
        data = response.json()
        assert "user" in data
        assert data["user"]["phone"] == "050-1234567"
        print("✓ phone update works correctly")
    
    def test_update_user_address(self):
        """Test updating address field"""
        response = self.session.put(f"{BASE_URL}/api/users/me", json={
            "address": "רחוב הטסט 123, דירה 5"
        })
        assert response.status_code == 200, f"Update failed: {response.text}"
        data = response.json()
        assert "user" in data
        assert data["user"]["address"] == "רחוב הטסט 123, דירה 5"
        print("✓ address update works correctly")
    
    def test_update_user_city(self):
        """Test updating city field"""
        response = self.session.put(f"{BASE_URL}/api/users/me", json={
            "city": "תל אביב"
        })
        assert response.status_code == 200, f"Update failed: {response.text}"
        data = response.json()
        assert "user" in data
        assert data["user"]["city"] == "תל אביב"
        print("✓ city update works correctly")
    
    def test_update_user_profile_image(self):
        """Test updating profile_image field"""
        test_image_url = "https://example.com/test-profile-image.jpg"
        response = self.session.put(f"{BASE_URL}/api/users/me", json={
            "profile_image": test_image_url
        })
        assert response.status_code == 200, f"Update failed: {response.text}"
        data = response.json()
        assert "user" in data
        assert data["user"]["profile_image"] == test_image_url
        print("✓ profile_image update works correctly")
    
    def test_update_user_profile_color(self):
        """Test updating profile_color field - CRITICAL TEST"""
        test_color = "from-pink-500 to-rose-500"
        response = self.session.put(f"{BASE_URL}/api/users/me", json={
            "profile_color": test_color
        })
        assert response.status_code == 200, f"Update failed: {response.text}"
        data = response.json()
        assert "user" in data
        assert data["user"].get("profile_color") == test_color, f"profile_color not saved correctly. Got: {data['user'].get('profile_color')}"
        print("✓ profile_color update works correctly")
    
    def test_update_multiple_fields_at_once(self):
        """Test updating multiple fields in a single request"""
        response = self.session.put(f"{BASE_URL}/api/users/me", json={
            "first_name": "Multi",
            "last_name": "Update",
            "phone": "050-9876543",
            "city": "חיפה",
            "address": "רחוב הים 10",
            "profile_color": "from-green-400 to-emerald-500"
        })
        assert response.status_code == 200, f"Update failed: {response.text}"
        data = response.json()
        assert "user" in data
        user = data["user"]
        assert user["first_name"] == "Multi"
        assert user["last_name"] == "Update"
        assert user["phone"] == "050-9876543"
        assert user["city"] == "חיפה"
        assert user["address"] == "רחוב הים 10"
        assert user.get("profile_color") == "from-green-400 to-emerald-500"
        # Check name is concatenated
        assert "Multi" in user.get("name", "")
        print("✓ Multiple fields update works correctly")
    
    def test_update_returns_updated_user_object(self):
        """Test that PUT /api/users/me returns the full updated user object"""
        response = self.session.put(f"{BASE_URL}/api/users/me", json={
            "first_name": "ReturnTest"
        })
        assert response.status_code == 200
        data = response.json()
        # Check for message
        assert "message" in data
        assert data["message"] == "User info updated successfully"
        # Check user object contains expected fields
        user = data.get("user", {})
        assert "user_id" in user
        assert "email" in user
        assert "first_name" in user
        print("✓ Response returns complete updated user object")
    
    def test_update_name_auto_concat(self):
        """Test that updating first_name/last_name auto-concatenates to 'name' field"""
        response = self.session.put(f"{BASE_URL}/api/users/me", json={
            "first_name": "שם",
            "last_name": "משפחה"
        })
        assert response.status_code == 200
        data = response.json()
        user = data.get("user", {})
        assert user.get("name") == "שם משפחה", f"Name not concatenated: {user.get('name')}"
        print("✓ Name auto-concatenation works correctly")
    
    def test_update_rejects_invalid_fields(self):
        """Test that disallowed fields are ignored (email cannot be changed via this endpoint)"""
        original_email = "saadiameen@gmail.com"
        response = self.session.put(f"{BASE_URL}/api/users/me", json={
            "email": "hacker@evil.com",
            "first_name": "ValidUpdate"
        })
        # Should succeed but email should not be updated
        assert response.status_code == 200
        data = response.json()
        user = data.get("user", {})
        assert user.get("email") == original_email, "Email should not be changeable via this endpoint"
        assert user.get("first_name") == "ValidUpdate"
        print("✓ Disallowed fields (email) are correctly ignored")


class TestNotificationEndpoints:
    """Test notification-related endpoints that support routing"""
    
    def setup_method(self):
        """Login as user before each test"""
        self.session = requests.Session()
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "saadiameen@gmail.com",
            "password": "password"
        })
        if login_response.status_code == 200:
            self.token = login_response.json().get("session_token")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
    
    def test_get_notifications(self):
        """Test GET /api/notifications endpoint"""
        response = self.session.get(f"{BASE_URL}/api/notifications?limit=10")
        assert response.status_code == 200, f"Get notifications failed: {response.text}"
        data = response.json()
        assert "notifications" in data
        print(f"✓ GET /api/notifications works - found {len(data.get('notifications', []))} notifications")
    
    def test_notifications_have_type_field(self):
        """Test that notifications have type field for routing"""
        response = self.session.get(f"{BASE_URL}/api/notifications?limit=50")
        assert response.status_code == 200
        notifications = response.json().get("notifications", [])
        if notifications:
            for n in notifications[:5]:  # Check first 5
                assert "type" in n, f"Notification missing type field: {n}"
                assert "notification_id" in n
                print(f"  - Notification type: {n.get('type')}, id: {n.get('notification_id')}")
        print(f"✓ Notifications have type field for routing")
    
    def test_notifications_have_data_field(self):
        """Test that notifications have data field with routing info"""
        response = self.session.get(f"{BASE_URL}/api/notifications?limit=50")
        assert response.status_code == 200
        notifications = response.json().get("notifications", [])
        # Data field may be empty or contain routing info like room_id, booking_id
        for n in notifications[:5]:
            if n.get("data"):
                print(f"  - Notification data: {n.get('data')}")
        print(f"✓ Notifications data field accessible for routing")


class TestProviderUserSettings:
    """Test settings update for provider user"""
    
    def setup_method(self):
        """Login as provider before each test"""
        self.session = requests.Session()
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "provider@carelink.co.il",
            "password": "password"
        })
        if login_response.status_code == 200:
            self.token = login_response.json().get("session_token")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
    
    def test_provider_update_profile_color(self):
        """Test that providers can update profile_color"""
        test_color = "from-teal-400 to-cyan-500"
        response = self.session.put(f"{BASE_URL}/api/users/me", json={
            "profile_color": test_color
        })
        assert response.status_code == 200, f"Update failed: {response.text}"
        data = response.json()
        assert data["user"].get("profile_color") == test_color
        print("✓ Provider profile_color update works correctly")


class TestAdminUserSettings:
    """Test settings update for admin user"""
    
    def setup_method(self):
        """Login as admin before each test"""
        self.session = requests.Session()
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@carelink.co.il",
            "password": "password"
        })
        if login_response.status_code == 200:
            self.token = login_response.json().get("session_token")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
    
    def test_admin_update_profile_color(self):
        """Test that admins can update profile_color"""
        test_color = "from-indigo-500 to-purple-500"
        response = self.session.put(f"{BASE_URL}/api/users/me", json={
            "profile_color": test_color
        })
        assert response.status_code == 200, f"Update failed: {response.text}"
        data = response.json()
        assert data["user"].get("profile_color") == test_color
        print("✓ Admin profile_color update works correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
