"""
Push Notifications API Tests for CareLink
Tests VAPID key endpoint, subscription management, preferences, and admin push sending
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@carelink.co.il"
ADMIN_PASSWORD = "password"
TEST_USER_EMAIL = f"test_push_{uuid.uuid4().hex[:8]}@test.com"
TEST_USER_PASSWORD = "Test123!"


class TestSetup:
    """Setup helpers for auth tokens"""
    
    @staticmethod
    def get_admin_token():
        """Login as admin and return token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("session_token")
        return None
    
    @staticmethod
    def create_test_user_and_get_token():
        """Create a test user and return token"""
        # First try to login (if user exists)
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("session_token"), response.json().get("user", {}).get("user_id")
        
        # Register new user
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "name": "Push Test User",
            "role": "patient"
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("session_token"), data.get("user", {}).get("user_id")
        return None, None


class TestVAPIDPublicKey:
    """Tests for GET /api/push/vapid-public-key endpoint"""
    
    def test_get_vapid_public_key_success(self):
        """Test getting VAPID public key returns valid key"""
        response = requests.get(f"{BASE_URL}/api/push/vapid-public-key")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "publicKey" in data, "Response should contain publicKey"
        assert data["publicKey"], "publicKey should not be empty"
        assert len(data["publicKey"]) > 50, "VAPID key should be reasonably long"
        print(f"✓ VAPID public key retrieved: {data['publicKey'][:30]}...")


class TestPushSubscription:
    """Tests for push subscription endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test user token"""
        self.token, self.user_id = TestSetup.create_test_user_and_get_token()
        assert self.token, "Failed to get test user token"
    
    def test_subscribe_push_notifications(self):
        """Test subscribing to push notifications"""
        # Mock subscription data (simulating browser push subscription)
        subscription_data = {
            "endpoint": f"https://fcm.googleapis.com/fcm/send/{uuid.uuid4().hex}",
            "keys": {
                "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkA=",
                "auth": "tBHItJI5svbpez7KI4Cn-A=="
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/push/subscribe",
            json=subscription_data,
            headers={"Authorization": f"Bearer {self.token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data, "Response should contain message"
        print(f"✓ Push subscription saved: {data['message']}")
    
    def test_subscribe_requires_auth(self):
        """Test that subscribing requires authentication"""
        subscription_data = {
            "endpoint": f"https://fcm.googleapis.com/fcm/send/{uuid.uuid4().hex}",
            "keys": {"p256dh": "test", "auth": "test"}
        }
        
        response = requests.post(f"{BASE_URL}/api/push/subscribe", json=subscription_data)
        
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ Subscription correctly requires authentication")
    
    def test_unsubscribe_push_notifications(self):
        """Test unsubscribing from push notifications"""
        # First subscribe
        subscription_data = {
            "endpoint": f"https://fcm.googleapis.com/fcm/send/{uuid.uuid4().hex}",
            "keys": {"p256dh": "test", "auth": "test"}
        }
        requests.post(
            f"{BASE_URL}/api/push/subscribe",
            json=subscription_data,
            headers={"Authorization": f"Bearer {self.token}"}
        )
        
        # Then unsubscribe
        response = requests.delete(
            f"{BASE_URL}/api/push/unsubscribe",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data, "Response should contain message"
        print(f"✓ Push unsubscribe successful: {data['message']}")


class TestPushPreferences:
    """Tests for notification preferences endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test user token"""
        self.token, self.user_id = TestSetup.create_test_user_and_get_token()
        assert self.token, "Failed to get test user token"
    
    def test_get_default_preferences(self):
        """Test getting default notification preferences"""
        response = requests.get(
            f"{BASE_URL}/api/push/preferences",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Check default preferences
        assert "new_booking" in data, "Should have new_booking preference"
        assert "booking_confirmed" in data, "Should have booking_confirmed preference"
        assert "booking_cancelled" in data, "Should have booking_cancelled preference"
        assert "new_message" in data, "Should have new_message preference"
        assert "provider_verified" in data, "Should have provider_verified preference"
        assert "system_updates" in data, "Should have system_updates preference"
        assert "marketing" in data, "Should have marketing preference"
        
        # Default marketing should be False
        assert data["marketing"] == False, "Marketing should default to False"
        print(f"✓ Default preferences retrieved with all expected fields")
    
    def test_update_preferences(self):
        """Test updating notification preferences"""
        new_prefs = {
            "new_booking": True,
            "booking_confirmed": False,
            "marketing": True
        }
        
        response = requests.put(
            f"{BASE_URL}/api/push/preferences",
            json=new_prefs,
            headers={"Authorization": f"Bearer {self.token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify the changes persisted
        get_response = requests.get(
            f"{BASE_URL}/api/push/preferences",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        
        data = get_response.json()
        assert data.get("booking_confirmed") == False, "booking_confirmed should be False"
        assert data.get("marketing") == True, "marketing should be True"
        print(f"✓ Preferences updated and verified")
    
    def test_preferences_require_auth(self):
        """Test that preferences endpoints require authentication"""
        response = requests.get(f"{BASE_URL}/api/push/preferences")
        assert response.status_code == 401, f"GET preferences should require auth, got {response.status_code}"
        
        response = requests.put(f"{BASE_URL}/api/push/preferences", json={"marketing": True})
        assert response.status_code == 401, f"PUT preferences should require auth, got {response.status_code}"
        print("✓ Preferences endpoints correctly require authentication")


class TestAdminPushNotifications:
    """Tests for admin push notification endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin and test user tokens"""
        self.admin_token = TestSetup.get_admin_token()
        assert self.admin_token, "Failed to get admin token"
        self.user_token, self.user_id = TestSetup.create_test_user_and_get_token()
    
    def test_admin_send_push_to_all(self):
        """Test admin sending push notification to all users"""
        notification_data = {
            "title": "בדיקת התראות",
            "body": "זוהי הודעת בדיקה מהמערכת",
            "target": "all"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/push/send",
            json=notification_data,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should contain message"
        assert "notification_id" in data, "Response should contain notification_id"
        assert "success_count" in data, "Response should contain success_count"
        assert "failed_count" in data, "Response should contain failed_count"
        print(f"✓ Admin push sent: {data['message']}, notification_id: {data['notification_id']}")
    
    def test_admin_send_push_to_providers(self):
        """Test admin sending push notification to providers only"""
        notification_data = {
            "title": "הודעה לספקים",
            "body": "הודעה רק לספקים רשומים",
            "target": "providers"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/push/send",
            json=notification_data,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ Admin push to providers sent successfully")
    
    def test_admin_send_push_to_specific_users(self):
        """Test admin sending push notification to specific users"""
        notification_data = {
            "title": "הודעה אישית",
            "body": "הודעה למשתמש ספציפי",
            "target": "specific",
            "user_ids": [self.user_id] if self.user_id else []
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/push/send",
            json=notification_data,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ Admin push to specific users sent successfully")
    
    def test_admin_send_push_requires_admin_role(self):
        """Test that only admins can send push notifications"""
        notification_data = {
            "title": "Test",
            "body": "Test",
            "target": "all"
        }
        
        # Try with regular user token
        response = requests.post(
            f"{BASE_URL}/api/admin/push/send",
            json=notification_data,
            headers={"Authorization": f"Bearer {self.user_token}"}
        )
        
        assert response.status_code == 403, f"Expected 403 for non-admin, got {response.status_code}"
        print("✓ Admin push correctly requires admin role")
    
    def test_admin_get_push_history(self):
        """Test admin getting push notification history"""
        response = requests.get(
            f"{BASE_URL}/api/admin/push/history",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "history" in data, "Response should contain history"
        assert "total" in data, "Response should contain total"
        assert isinstance(data["history"], list), "history should be a list"
        print(f"✓ Push history retrieved: {data['total']} records total")
    
    def test_admin_push_history_requires_admin(self):
        """Test that push history requires admin role"""
        response = requests.get(
            f"{BASE_URL}/api/admin/push/history",
            headers={"Authorization": f"Bearer {self.user_token}"}
        )
        
        assert response.status_code == 403, f"Expected 403 for non-admin, got {response.status_code}"
        print("✓ Push history correctly requires admin role")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
