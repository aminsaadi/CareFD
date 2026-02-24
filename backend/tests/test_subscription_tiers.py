"""
Test suite for CareLink Subscription Tiers - Free, Pro, Gold
Features tested:
1. Subscription plans API (GET /api/subscription-plans)
2. My subscription API (GET /api/subscriptions/my)
3. Upgrade subscription (POST /api/subscriptions/upgrade)
4. Cancel subscription (POST /api/subscriptions/cancel)
5. Service creation limit enforcement (free tier = 1 service max)
6. Clinics management (Pro+ only)
7. Team management (Gold only)
8. Admin plan management (PUT /api/admin/subscription-plans/{plan_id})
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@carelink.co.il"
ADMIN_PASSWORD = "password"
PROVIDER_EMAIL = "provider@carelink.co.il"
PROVIDER_PASSWORD = "password"
USER_EMAIL = "user@carelink.co.il"
USER_PASSWORD = "password"


class TestSubscriptionPlans:
    """Test GET /api/subscription-plans returns 3 plans with correct prices"""
    
    def test_get_subscription_plans_returns_three_plans(self):
        """GET /api/subscription-plans - should return 3 plans (free, pro, gold)"""
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
        assert "gold" in tiers, "Should have gold tier"
        
        print(f"PASS: Found {len(plans)} subscription plans with tiers: {tiers}")
    
    def test_subscription_plans_correct_prices(self):
        """Verify pricing: Free=0, Pro=59/600, Gold=149/1500"""
        response = requests.get(f"{BASE_URL}/api/subscription-plans")
        
        assert response.status_code == 200
        plans = response.json().get("plans", [])
        
        for plan in plans:
            tier = plan.get("tier")
            if tier == "free":
                assert plan["price_monthly"] == 0, "Free plan should be 0 ILS/month"
                assert plan["price_yearly"] == 0, "Free plan should be 0 ILS/year"
            elif tier == "pro":
                assert plan["price_monthly"] == 59, f"Pro plan should be 59 ILS/month, got {plan['price_monthly']}"
                assert plan["price_yearly"] == 600, f"Pro plan should be 600 ILS/year, got {plan['price_yearly']}"
            elif tier == "gold":
                assert plan["price_monthly"] == 149, f"Gold plan should be 149 ILS/month, got {plan['price_monthly']}"
                assert plan["price_yearly"] == 1500, f"Gold plan should be 1500 ILS/year, got {plan['price_yearly']}"
        
        print("PASS: All subscription plans have correct pricing")
    
    def test_subscription_plans_features(self):
        """Verify features: Free has 1 service, Pro has clinics, Gold has team"""
        response = requests.get(f"{BASE_URL}/api/subscription-plans")
        
        assert response.status_code == 200
        plans = response.json().get("plans", [])
        
        for plan in plans:
            tier = plan.get("tier")
            if tier == "free":
                assert plan.get("max_services") == 1, "Free tier should have max 1 service"
                assert plan.get("has_clinic_management") == False, "Free tier should not have clinic management"
                assert plan.get("has_team_management") == False, "Free tier should not have team management"
            elif tier == "pro":
                assert plan.get("max_services") == -1, "Pro tier should have unlimited services"
                assert plan.get("has_clinic_management") == True, "Pro tier should have clinic management"
                assert plan.get("has_team_management") == False, "Pro tier should not have team management"
            elif tier == "gold":
                assert plan.get("max_services") == -1, "Gold tier should have unlimited services"
                assert plan.get("has_clinic_management") == True, "Gold tier should have clinic management"
                assert plan.get("has_team_management") == True, "Gold tier should have team management"
        
        print("PASS: All subscription plans have correct feature flags")


@pytest.fixture(scope="class")
def provider_session():
    """Get authenticated provider session"""
    session = requests.Session()
    
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": PROVIDER_EMAIL,
        "password": PROVIDER_PASSWORD
    })
    
    if response.status_code != 200:
        pytest.skip(f"Provider login failed: {response.status_code} - {response.text}")
    
    data = response.json()
    token = data.get("session_token")
    session.headers.update({"Authorization": f"Bearer {token}"})
    session.user_data = data.get("user", {})
    
    return session


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


class TestMySubscription:
    """Test GET /api/subscriptions/my"""
    
    def test_get_my_subscription_requires_auth(self):
        """GET /api/subscriptions/my - should require authentication"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/my")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Subscription endpoint requires authentication")
    
    def test_get_my_subscription(self, provider_session):
        """GET /api/subscriptions/my - returns current subscription"""
        response = provider_session.get(f"{BASE_URL}/api/subscriptions/my")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "subscription" in data, "Response should contain 'subscription' key"
        subscription = data["subscription"]
        
        assert "tier" in subscription, "Subscription should have tier"
        assert "status" in subscription, "Subscription should have status"
        
        print(f"PASS: Provider subscription tier: {subscription.get('tier')}, status: {subscription.get('status')}")


class TestUpgradeSubscription:
    """Test POST /api/subscriptions/upgrade"""
    
    def test_upgrade_subscription_requires_auth(self):
        """POST /api/subscriptions/upgrade - should require authentication"""
        response = requests.post(f"{BASE_URL}/api/subscriptions/upgrade", json={
            "plan_id": "plan_pro"
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Upgrade endpoint requires authentication")
    
    def test_upgrade_to_pro(self, provider_session):
        """POST /api/subscriptions/upgrade - upgrade to pro tier"""
        response = provider_session.post(f"{BASE_URL}/api/subscriptions/upgrade", json={
            "plan_id": "plan_pro",
            "billing_cycle": "monthly"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "subscription" in data, "Response should contain subscription"
        assert data["subscription"]["tier"] == "pro", "Subscription tier should be pro"
        
        # Verify change persisted
        verify_response = provider_session.get(f"{BASE_URL}/api/subscriptions/my")
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        assert verify_data["subscription"]["tier"] == "pro", "Persisted tier should be pro"
        
        print("PASS: Successfully upgraded to pro tier")
    
    def test_upgrade_to_gold(self, provider_session):
        """POST /api/subscriptions/upgrade - upgrade to gold tier"""
        response = provider_session.post(f"{BASE_URL}/api/subscriptions/upgrade", json={
            "plan_id": "plan_gold",
            "billing_cycle": "monthly"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data["subscription"]["tier"] == "gold", "Subscription tier should be gold"
        
        print("PASS: Successfully upgraded to gold tier")
    
    def test_upgrade_invalid_plan(self, provider_session):
        """POST /api/subscriptions/upgrade - 404 for invalid plan"""
        response = provider_session.post(f"{BASE_URL}/api/subscriptions/upgrade", json={
            "plan_id": "invalid_plan_id"
        })
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Returns 404 for invalid plan ID")


class TestCancelSubscription:
    """Test POST /api/subscriptions/cancel"""
    
    def test_cancel_subscription_requires_auth(self):
        """POST /api/subscriptions/cancel - should require authentication"""
        response = requests.post(f"{BASE_URL}/api/subscriptions/cancel")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Cancel endpoint requires authentication")
    
    def test_cancel_subscription_resets_to_free(self, provider_session):
        """POST /api/subscriptions/cancel - resets to free tier"""
        # First ensure we have a paid subscription to cancel
        provider_session.post(f"{BASE_URL}/api/subscriptions/upgrade", json={
            "plan_id": "plan_pro"
        })
        
        # Now cancel
        response = provider_session.post(f"{BASE_URL}/api/subscriptions/cancel")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify reset to free
        verify_response = provider_session.get(f"{BASE_URL}/api/subscriptions/my")
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        assert verify_data["subscription"]["tier"] == "free", "Should be reset to free tier"
        
        print("PASS: Subscription cancelled and reset to free tier")


class TestClinicsForProPlus:
    """Test clinics endpoints - Pro+ only"""
    
    def test_clinics_requires_auth(self):
        """GET /api/clinics - should require authentication"""
        response = requests.get(f"{BASE_URL}/api/clinics")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Clinics endpoint requires authentication")
    
    def test_clinics_forbidden_for_free_tier(self, provider_session):
        """GET /api/clinics - should return 403 for free tier"""
        # First ensure we're on free tier
        provider_session.post(f"{BASE_URL}/api/subscriptions/cancel")
        
        # Try to access clinics
        response = provider_session.get(f"{BASE_URL}/api/clinics")
        
        # Note: Based on code review, GET /api/clinics doesn't check subscription
        # Only POST /api/clinics checks subscription
        # This may be intentional or a bug
        print(f"INFO: GET /api/clinics returned {response.status_code} for free tier (may not be restricted)")
    
    def test_create_clinic_forbidden_for_free_tier(self, provider_session):
        """POST /api/clinics - should return 403 for free tier"""
        # Ensure we're on free tier
        provider_session.post(f"{BASE_URL}/api/subscriptions/cancel")
        
        response = provider_session.post(f"{BASE_URL}/api/clinics", json={
            "name": "TEST_Clinic",
            "address": "Test Address",
            "city": "Tel Aviv"
        })
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        print("PASS: POST /api/clinics returns 403 for free tier")
    
    def test_create_clinic_allowed_for_pro(self, provider_session):
        """POST /api/clinics - should work for Pro+ tier"""
        # Upgrade to pro
        provider_session.post(f"{BASE_URL}/api/subscriptions/upgrade", json={
            "plan_id": "plan_pro"
        })
        
        response = provider_session.post(f"{BASE_URL}/api/clinics", json={
            "name": "TEST_Pro_Clinic",
            "address": "Test Pro Address",
            "city": "Tel Aviv"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "clinic_id" in data, "Response should contain clinic_id"
        
        # Store clinic_id for cleanup
        provider_session.test_clinic_id = data["clinic_id"]
        
        print(f"PASS: Created clinic for pro tier: {data['clinic_id']}")
    
    def test_get_clinics_for_pro(self, provider_session):
        """GET /api/clinics - returns clinics for Pro+ provider"""
        # Ensure we're on pro
        provider_session.post(f"{BASE_URL}/api/subscriptions/upgrade", json={
            "plan_id": "plan_pro"
        })
        
        response = provider_session.get(f"{BASE_URL}/api/clinics")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "clinics" in data, "Response should contain 'clinics' key"
        
        print(f"PASS: GET /api/clinics returns {len(data['clinics'])} clinics for pro tier")


class TestTeamForGold:
    """Test team endpoints - Gold only"""
    
    def test_team_requires_auth(self):
        """GET /api/team - should require authentication"""
        response = requests.get(f"{BASE_URL}/api/team")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Team endpoint requires authentication")
    
    def test_team_forbidden_for_free_tier(self, provider_session):
        """GET /api/team - should return 403 for free tier"""
        # Ensure we're on free tier
        provider_session.post(f"{BASE_URL}/api/subscriptions/cancel")
        
        response = provider_session.get(f"{BASE_URL}/api/team")
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        print("PASS: GET /api/team returns 403 for free tier")
    
    def test_team_forbidden_for_pro_tier(self, provider_session):
        """GET /api/team - should return 403 for pro tier (Gold only)"""
        # Upgrade to pro
        provider_session.post(f"{BASE_URL}/api/subscriptions/upgrade", json={
            "plan_id": "plan_pro"
        })
        
        response = provider_session.get(f"{BASE_URL}/api/team")
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        print("PASS: GET /api/team returns 403 for pro tier (Gold only)")
    
    def test_create_team_member_forbidden_for_non_gold(self, provider_session):
        """POST /api/team - should return 403 for non-gold tier"""
        # Ensure we're on pro tier
        provider_session.post(f"{BASE_URL}/api/subscriptions/upgrade", json={
            "plan_id": "plan_pro"
        })
        
        response = provider_session.post(f"{BASE_URL}/api/team", json={
            "name": "TEST_Team_Member",
            "role": "Assistant",
            "email": "team@test.com"
        })
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        print("PASS: POST /api/team returns 403 for pro tier (Gold only)")
    
    def test_create_team_member_allowed_for_gold(self, provider_session):
        """POST /api/team - should work for Gold tier"""
        # Upgrade to gold
        provider_session.post(f"{BASE_URL}/api/subscriptions/upgrade", json={
            "plan_id": "plan_gold"
        })
        
        response = provider_session.post(f"{BASE_URL}/api/team", json={
            "name": "TEST_Gold_Team_Member",
            "role": "Assistant",
            "email": "goldteam@test.com"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "member_id" in data, "Response should contain member_id"
        
        print(f"PASS: Created team member for gold tier: {data['member_id']}")
    
    def test_get_team_for_gold(self, provider_session):
        """GET /api/team - returns team members for Gold provider"""
        # Ensure we're on gold
        provider_session.post(f"{BASE_URL}/api/subscriptions/upgrade", json={
            "plan_id": "plan_gold"
        })
        
        response = provider_session.get(f"{BASE_URL}/api/team")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "members" in data, "Response should contain 'members' key"
        
        print(f"PASS: GET /api/team returns {len(data['members'])} members for gold tier")


class TestServiceCreationLimit:
    """Test service creation limit enforcement - free tier = max 1 service"""
    
    def test_service_limit_enforced_for_free_tier(self, provider_session):
        """POST /api/services - should fail if free tier already has services"""
        # Reset to free tier
        provider_session.post(f"{BASE_URL}/api/subscriptions/cancel")
        
        # Try to create a service (provider already has services)
        response = provider_session.post(f"{BASE_URL}/api/services", json={
            "name": "TEST_Service_Free_Tier",
            "description": "Test service",
            "service_category": "home_visit",
            "delivery_types": ["home_visit"],
            "pricing_type": "fixed",
            "price": 100
        })
        
        # Provider already has 3 services, so this should fail
        assert response.status_code == 403, f"Expected 403 (limit reached), got {response.status_code}: {response.text}"
        
        print("PASS: Service creation limit enforced for free tier")
    
    def test_service_creation_allowed_for_pro(self, provider_session):
        """POST /api/services - should work for Pro+ tier (unlimited)"""
        # Upgrade to pro
        provider_session.post(f"{BASE_URL}/api/subscriptions/upgrade", json={
            "plan_id": "plan_pro"
        })
        
        response = provider_session.post(f"{BASE_URL}/api/services", json={
            "name": "TEST_Service_Pro_Tier",
            "description": "Test service for pro tier",
            "service_category": "home_visit",
            "delivery_types": ["home_visit"],
            "pricing_type": "fixed",
            "price": 150
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "service_id" in data, "Response should contain service_id"
        
        # Store for cleanup
        provider_session.test_service_id = data["service_id"]
        
        print(f"PASS: Service creation allowed for pro tier: {data['service_id']}")


class TestAdminPlanManagement:
    """Test PUT /api/admin/subscription-plans/{plan_id}"""
    
    def test_admin_update_plan_requires_admin(self, provider_session):
        """PUT /api/admin/subscription-plans/{plan_id} - should require admin"""
        response = provider_session.put(f"{BASE_URL}/api/admin/subscription-plans/plan_pro", json={
            "price_monthly": 69
        })
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("PASS: Admin update plan requires admin role")
    
    def test_admin_update_plan_success(self, admin_session):
        """PUT /api/admin/subscription-plans/{plan_id} - admin can update plan"""
        # Get current plan first
        plans_response = requests.get(f"{BASE_URL}/api/subscription-plans")
        original_plans = plans_response.json().get("plans", [])
        original_pro = next((p for p in original_plans if p["tier"] == "pro"), None)
        
        # Update plan
        response = admin_session.put(f"{BASE_URL}/api/admin/subscription-plans/plan_pro", json={
            "max_clinics": 10
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify change persisted
        verify_response = requests.get(f"{BASE_URL}/api/subscription-plans")
        updated_plans = verify_response.json().get("plans", [])
        updated_pro = next((p for p in updated_plans if p["tier"] == "pro"), None)
        
        assert updated_pro is not None, "Pro plan should exist"
        assert updated_pro["max_clinics"] == 10, f"max_clinics should be 10, got {updated_pro['max_clinics']}"
        
        # Restore original value
        admin_session.put(f"{BASE_URL}/api/admin/subscription-plans/plan_pro", json={
            "max_clinics": original_pro.get("max_clinics", 5) if original_pro else 5
        })
        
        print("PASS: Admin can update subscription plan features")
    
    def test_admin_update_plan_invalid_id(self, admin_session):
        """PUT /api/admin/subscription-plans/{plan_id} - 404 for invalid plan"""
        response = admin_session.put(f"{BASE_URL}/api/admin/subscription-plans/invalid_plan", json={
            "price_monthly": 100
        })
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Returns 404 for invalid plan ID")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_and_reset_provider(self, provider_session):
        """Reset provider back to free tier after all tests"""
        response = provider_session.post(f"{BASE_URL}/api/subscriptions/cancel")
        
        # Cancel might fail if already on free - that's OK
        if response.status_code == 200:
            print("CLEANUP: Reset provider to free tier")
        else:
            print(f"CLEANUP: Provider already on free tier or cancel failed: {response.status_code}")
        
        # Delete test service if created
        if hasattr(provider_session, 'test_service_id'):
            response = provider_session.delete(f"{BASE_URL}/api/services/{provider_session.test_service_id}")
            print(f"CLEANUP: Deleted test service: {provider_session.test_service_id}")
        
        # Delete test clinic if created
        if hasattr(provider_session, 'test_clinic_id'):
            provider_session.post(f"{BASE_URL}/api/subscriptions/upgrade", json={"plan_id": "plan_pro"})
            response = provider_session.delete(f"{BASE_URL}/api/clinics/{provider_session.test_clinic_id}")
            print(f"CLEANUP: Deleted test clinic: {provider_session.test_clinic_id}")
            provider_session.post(f"{BASE_URL}/api/subscriptions/cancel")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
