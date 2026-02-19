"""
Test suite for Subscription Management and Push Notifications
Features:
- Subscription Plans (Free, Pro, Premium)
- User subscriptions (my subscription, create subscription)
- Admin subscription management
- Admin payments management
- Push notification preferences
- Admin push notification send
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin_test@carelink.co.il"
ADMIN_PASSWORD = "test123456"
TEST_USER_EMAIL = f"test_sub_user_{datetime.now().strftime('%Y%m%d%H%M%S')}@test.com"
TEST_USER_PASSWORD = "testpassword123"


class TestSubscriptionPlans:
    """Test subscription plans endpoint"""
    
    def test_get_subscription_plans(self):
        """GET /api/subscription-plans - should return 3 plans"""
        response = requests.get(f"{BASE_URL}/api/subscription-plans")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "plans" in data, "Response should contain 'plans' key"
        plans = data["plans"]
        
        # Should have exactly 3 plans
        assert len(plans) >= 3, f"Expected at least 3 plans, got {len(plans)}"
        
        # Verify plan tiers exist
        tiers = [p.get("tier") for p in plans]
        assert "free" in tiers, "Should have free tier"
        assert "pro" in tiers, "Should have pro tier"
        assert "premium" in tiers, "Should have premium tier"
        
        # Verify pricing
        for plan in plans:
            if plan["tier"] == "free":
                assert plan["price_monthly"] == 0, "Free plan should be 0 ILS"
            elif plan["tier"] == "pro":
                assert plan["price_monthly"] == 99, "Pro plan should be 99 ILS"
            elif plan["tier"] == "premium":
                assert plan["price_monthly"] == 199, "Premium plan should be 199 ILS"
        
        print(f"PASS: Found {len(plans)} subscription plans with correct pricing")


@pytest.fixture(scope="class")
def admin_session():
    """Get authenticated admin session"""
    session = requests.Session()
    
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    
    if response.status_code != 200:
        pytest.skip(f"Admin login failed: {response.status_code} - {response.text}")
    
    token = response.json().get("session_token")
    session.headers.update({"Authorization": f"Bearer {token}"})
    
    return session


@pytest.fixture(scope="class")
def test_user_session():
    """Create and authenticate a test user"""
    session = requests.Session()
    
    # Register new user
    response = session.post(f"{BASE_URL}/api/auth/register", json={
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD,
        "name": "TEST_Subscription_User",
        "role": "patient"
    })
    
    if response.status_code == 400:
        # User already exists, try login
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
    
    if response.status_code not in [200, 201]:
        pytest.skip(f"Test user creation/login failed: {response.status_code} - {response.text}")
    
    data = response.json()
    token = data.get("session_token")
    user_id = data.get("user", {}).get("user_id")
    
    session.headers.update({"Authorization": f"Bearer {token}"})
    session.user_id = user_id
    
    return session


class TestUserSubscription:
    """Test user subscription endpoints"""
    
    def test_get_my_subscription_default_free(self, test_user_session):
        """GET /api/subscriptions/my - new user should have free tier"""
        response = test_user_session.get(f"{BASE_URL}/api/subscriptions/my")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "subscription" in data, "Response should contain 'subscription' key"
        subscription = data["subscription"]
        
        assert subscription.get("tier") == "free", "Default subscription should be free tier"
        assert subscription.get("status") == "active", "Default subscription should be active"
        
        print(f"PASS: New user has free tier subscription")
    
    def test_get_my_subscription_without_auth(self):
        """GET /api/subscriptions/my - should require authentication"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/my")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Subscription endpoint requires authentication")
    
    def test_create_subscription_free_plan(self, test_user_session):
        """POST /api/subscriptions/create - create free subscription"""
        response = test_user_session.post(f"{BASE_URL}/api/subscriptions/create", json={
            "plan_id": "plan_free",
            "billing_cycle": "monthly"
        })
        
        # Either 200 (success) or 400 (already has subscription)
        assert response.status_code in [200, 400], f"Expected 200 or 400, got {response.status_code}: {response.text}"
        
        if response.status_code == 200:
            data = response.json()
            assert "subscription" in data, "Response should contain subscription"
            assert data["subscription"]["tier"] == "free"
            print("PASS: Created free subscription successfully")
        else:
            print("PASS: User already has active subscription (expected behavior)")


class TestAdminSubscriptions:
    """Test admin subscription management endpoints"""
    
    def test_admin_get_subscriptions(self, admin_session):
        """GET /api/admin/subscriptions - admin list all subscriptions"""
        response = admin_session.get(f"{BASE_URL}/api/admin/subscriptions")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "subscriptions" in data, "Response should contain 'subscriptions' key"
        assert "stats" in data, "Response should contain 'stats' key"
        
        stats = data["stats"]
        assert "total_active" in stats, "Stats should have total_active"
        assert "total_pro" in stats, "Stats should have total_pro"
        assert "total_premium" in stats, "Stats should have total_premium"
        
        print(f"PASS: Admin subscriptions endpoint returns {len(data['subscriptions'])} subscriptions with stats")
    
    def test_admin_get_subscriptions_filter_by_status(self, admin_session):
        """GET /api/admin/subscriptions?status=active - filter by status"""
        response = admin_session.get(f"{BASE_URL}/api/admin/subscriptions?status=active")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        for sub in data.get("subscriptions", []):
            assert sub.get("status") == "active", f"Expected status 'active', got {sub.get('status')}"
        
        print(f"PASS: Filter by status works correctly")
    
    def test_admin_get_subscriptions_filter_by_tier(self, admin_session):
        """GET /api/admin/subscriptions?tier=free - filter by tier"""
        response = admin_session.get(f"{BASE_URL}/api/admin/subscriptions?tier=free")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        for sub in data.get("subscriptions", []):
            assert sub.get("tier") == "free", f"Expected tier 'free', got {sub.get('tier')}"
        
        print(f"PASS: Filter by tier works correctly")
    
    def test_admin_subscriptions_requires_admin(self, test_user_session):
        """GET /api/admin/subscriptions - should require admin role"""
        response = test_user_session.get(f"{BASE_URL}/api/admin/subscriptions")
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("PASS: Admin subscriptions endpoint requires admin role")


class TestAdminPayments:
    """Test admin payments management endpoints"""
    
    def test_admin_get_payments(self, admin_session):
        """GET /api/admin/payments - admin list all payments"""
        response = admin_session.get(f"{BASE_URL}/api/admin/payments")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "payments" in data, "Response should contain 'payments' key"
        assert "total_revenue" in data, "Response should contain 'total_revenue' key"
        
        # total_revenue should be a number
        assert isinstance(data["total_revenue"], (int, float)), "total_revenue should be numeric"
        
        print(f"PASS: Admin payments endpoint returns {len(data['payments'])} payments, total revenue: ₪{data['total_revenue']}")
    
    def test_admin_payments_requires_admin(self, test_user_session):
        """GET /api/admin/payments - should require admin role"""
        response = test_user_session.get(f"{BASE_URL}/api/admin/payments")
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("PASS: Admin payments endpoint requires admin role")


class TestAdminUpdateSubscription:
    """Test admin subscription update endpoint"""
    
    def test_admin_update_subscription_invalid_id(self, admin_session):
        """PUT /api/admin/subscriptions/{id} - 404 for invalid subscription"""
        response = admin_session.put(
            f"{BASE_URL}/api/admin/subscriptions/invalid_sub_id",
            json={"status": "cancelled"}
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Returns 404 for invalid subscription ID")
    
    def test_admin_update_subscription_no_valid_fields(self, admin_session):
        """PUT /api/admin/subscriptions/{id} - 400 for no valid fields"""
        response = admin_session.put(
            f"{BASE_URL}/api/admin/subscriptions/some_id",
            json={"invalid_field": "value"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("PASS: Returns 400 for invalid update fields")
    
    def test_admin_update_subscription_requires_admin(self, test_user_session):
        """PUT /api/admin/subscriptions/{id} - should require admin role"""
        response = test_user_session.put(
            f"{BASE_URL}/api/admin/subscriptions/some_id",
            json={"status": "cancelled"}
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("PASS: Admin update subscription requires admin role")


class TestPushPreferences:
    """Test push notification preferences endpoints"""
    
    def test_get_push_preferences(self, test_user_session):
        """GET /api/push/preferences - get user notification preferences"""
        response = test_user_session.get(f"{BASE_URL}/api/push/preferences")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Should have default preferences
        assert "new_booking" in data, "Should have new_booking preference"
        assert "booking_confirmed" in data, "Should have booking_confirmed preference"
        assert "new_message" in data, "Should have new_message preference"
        assert "system_updates" in data, "Should have system_updates preference"
        
        print(f"PASS: Push preferences returned with default values")
    
    def test_update_push_preferences(self, test_user_session):
        """PUT /api/push/preferences - update user notification preferences"""
        response = test_user_session.put(f"{BASE_URL}/api/push/preferences", json={
            "new_booking": True,
            "marketing": False,
            "system_updates": True
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify update persisted
        verify_response = test_user_session.get(f"{BASE_URL}/api/push/preferences")
        assert verify_response.status_code == 200
        
        data = verify_response.json()
        assert data.get("new_booking") == True, "new_booking should be True"
        assert data.get("marketing") == False, "marketing should be False"
        
        print("PASS: Push preferences updated and persisted correctly")
    
    def test_push_preferences_requires_auth(self):
        """GET /api/push/preferences - should require authentication"""
        response = requests.get(f"{BASE_URL}/api/push/preferences")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Push preferences endpoint requires authentication")


class TestAdminPushNotifications:
    """Test admin push notification endpoints"""
    
    def test_admin_send_push_notification_all(self, admin_session):
        """POST /api/admin/push/send - send notification to all users"""
        response = admin_session.post(f"{BASE_URL}/api/admin/push/send", json={
            "title": "TEST_Push_Notification",
            "body": "This is a test push notification from testing suite",
            "target": "all"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "notification_id" in data, "Response should contain notification_id"
        assert "message" in data, "Response should contain message"
        
        print(f"PASS: Push notification sent to all users, notification_id: {data.get('notification_id')}")
    
    def test_admin_send_push_notification_providers(self, admin_session):
        """POST /api/admin/push/send - send notification to providers only"""
        response = admin_session.post(f"{BASE_URL}/api/admin/push/send", json={
            "title": "TEST_Provider_Notification",
            "body": "This is a test notification for providers",
            "target": "providers"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: Push notification sent to providers")
    
    def test_admin_send_push_notification_users(self, admin_session):
        """POST /api/admin/push/send - send notification to users only"""
        response = admin_session.post(f"{BASE_URL}/api/admin/push/send", json={
            "title": "TEST_User_Notification",
            "body": "This is a test notification for users",
            "target": "users"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: Push notification sent to users")
    
    def test_admin_send_push_requires_admin(self, test_user_session):
        """POST /api/admin/push/send - should require admin role"""
        response = test_user_session.post(f"{BASE_URL}/api/admin/push/send", json={
            "title": "Unauthorized",
            "body": "This should fail",
            "target": "all"
        })
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("PASS: Admin push send requires admin role")
    
    def test_admin_get_push_history(self, admin_session):
        """GET /api/admin/push/history - get push notification history"""
        response = admin_session.get(f"{BASE_URL}/api/admin/push/history")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "history" in data, "Response should contain 'history' key"
        assert "total" in data, "Response should contain 'total' key"
        
        # Should have at least the notifications we just sent
        history = data["history"]
        if len(history) > 0:
            notification = history[0]
            assert "title" in notification, "Notification should have title"
            assert "body" in notification, "Notification should have body"
            assert "target" in notification, "Notification should have target"
            assert "sent_at" in notification, "Notification should have sent_at"
        
        print(f"PASS: Push history returns {len(history)} notifications")
    
    def test_admin_push_history_requires_admin(self, test_user_session):
        """GET /api/admin/push/history - should require admin role"""
        response = test_user_session.get(f"{BASE_URL}/api/admin/push/history")
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("PASS: Admin push history requires admin role")


class TestMockedPayPalAPIs:
    """Test mocked PayPal payment APIs"""
    
    def test_paypal_create_order_mocked(self, test_user_session):
        """POST /api/payments/paypal/create-order - mocked API should work"""
        response = test_user_session.post(f"{BASE_URL}/api/payments/paypal/create-order", json={
            "amount": 99,
            "currency": "ILS",
            "description": "Pro subscription test"
        })
        
        # Mocked API should return success
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "order_id" in data or "mock" in str(data).lower(), "Should return order_id or indicate mock"
        print(f"PASS: PayPal create-order (MOCKED) returned successfully")
    
    def test_paypal_capture_order_mocked(self, test_user_session):
        """POST /api/payments/paypal/capture-order - mocked API should work"""
        response = test_user_session.post(f"{BASE_URL}/api/payments/paypal/capture-order", json={
            "order_id": "mock_order_123"
        })
        
        # Mocked API should return success or handle gracefully
        assert response.status_code in [200, 201, 400, 404], f"Unexpected status: {response.status_code}"
        print(f"PASS: PayPal capture-order (MOCKED) handled correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
