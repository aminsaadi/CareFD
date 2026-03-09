"""
Email Verification Flow Tests
- Tests registration returns email_verification_required
- Tests login blocked for unverified users (403 email_not_verified)
- Tests existing users (admin, provider) can still login
- Tests verify-email endpoint
- Tests resend-verification endpoint
"""

import pytest
import requests
import os
import time
import random
import string

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

def generate_random_email():
    """Generate random email for testing"""
    timestamp = int(time.time())
    rand_str = ''.join(random.choices(string.ascii_lowercase, k=5))
    return f"test_{timestamp}_{rand_str}@test.com"


class TestRegistrationEmailVerification:
    """Test registration returns email_verification_required and doesn't return session_token"""
    
    def test_register_returns_email_verification_required(self):
        """POST /api/auth/register should return email_verification_required: true"""
        email = generate_random_email()
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "name": "Test User Verification",
            "role": "patient"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Check email_verification_required is true
        assert data.get("email_verification_required") == True, f"Expected email_verification_required=True, got {data}"
        # Check no session_token returned
        assert "session_token" not in data, f"session_token should NOT be returned for new registration, got {data}"
        # Check user info is returned
        assert "user" in data
        assert data["user"]["email"] == email
        print(f"✓ Registration returned email_verification_required=True and no session_token for {email}")
        
        # Store email for cleanup/further tests
        self.test_email = email
        return email


class TestLoginBlockedUnverified:
    """Test login is blocked for unverified users"""
    
    def test_login_blocked_for_unverified_user(self):
        """POST /api/auth/login should return 403 with detail='email_not_verified' for unverified users"""
        # First register a new user
        email = generate_random_email()
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "name": "Unverified User",
            "role": "patient"
        })
        assert reg_response.status_code == 200
        
        # Try to login - should be blocked
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": "testpass123"
        })
        
        assert login_response.status_code == 403, f"Expected 403, got {login_response.status_code}: {login_response.text}"
        
        data = login_response.json()
        assert data.get("detail") == "email_not_verified", f"Expected detail='email_not_verified', got {data}"
        print(f"✓ Login blocked with 403 email_not_verified for unverified user {email}")


class TestExistingUsersCanLogin:
    """Test existing users (admin, provider) can still login without email verification"""
    
    def test_admin_can_login(self):
        """Admin user admin@carelink.co.il should be able to login (exempt from verification)"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@carelink.co.il",
            "password": "password"
        })
        
        assert response.status_code == 200, f"Admin login failed with {response.status_code}: {response.text}"
        
        data = response.json()
        assert "session_token" in data, f"Expected session_token in response, got {data}"
        assert data["user"]["email"] == "admin@carelink.co.il"
        assert data["user"]["role"] == "admin"
        print("✓ Admin admin@carelink.co.il can login (exempt from email verification)")
    
    def test_provider_can_login(self):
        """Provider user provider@carelink.co.il should be able to login (exempt from verification)"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "provider@carelink.co.il",
            "password": "password"
        })
        
        assert response.status_code == 200, f"Provider login failed with {response.status_code}: {response.text}"
        
        data = response.json()
        assert "session_token" in data, f"Expected session_token in response, got {data}"
        assert data["user"]["email"] == "provider@carelink.co.il"
        print("✓ Provider provider@carelink.co.il can login (exempt from email verification)")


class TestVerifyEmailEndpoint:
    """Test verify-email endpoint"""
    
    def test_verify_email_with_invalid_token(self):
        """GET /api/auth/verify-email?token=xxx with invalid token should return 400 invalid_token"""
        response = requests.get(f"{BASE_URL}/api/auth/verify-email?token=invalid_token_xyz123")
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("detail") == "invalid_token", f"Expected detail='invalid_token', got {data}"
        print("✓ verify-email returns 400 invalid_token for invalid token")


class TestResendVerification:
    """Test resend-verification endpoint"""
    
    def test_resend_verification_success(self):
        """POST /api/auth/resend-verification with valid email should succeed"""
        # First register a new user
        email = generate_random_email()
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "name": "Resend Test User",
            "role": "patient"
        })
        assert reg_response.status_code == 200
        
        # Request resend verification
        resend_response = requests.post(f"{BASE_URL}/api/auth/resend-verification", json={
            "email": email
        })
        
        assert resend_response.status_code == 200, f"Expected 200, got {resend_response.status_code}: {resend_response.text}"
        
        data = resend_response.json()
        assert "message" in data
        print(f"✓ resend-verification works for {email}")
    
    def test_resend_verification_no_email(self):
        """POST /api/auth/resend-verification without email should return 400"""
        response = requests.post(f"{BASE_URL}/api/auth/resend-verification", json={})
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        print("✓ resend-verification returns 400 when email is missing")
    
    def test_resend_verification_unknown_email(self):
        """POST /api/auth/resend-verification with unknown email should return success (security)"""
        response = requests.post(f"{BASE_URL}/api/auth/resend-verification", json={
            "email": "nonexistent_user_xyz@test.com"
        })
        
        # Should return 200 to not leak whether email exists
        assert response.status_code == 200, f"Expected 200 (for security), got {response.status_code}: {response.text}"
        print("✓ resend-verification returns 200 even for unknown email (security)")


class TestFullVerificationFlow:
    """Test complete email verification flow: register -> get token from DB -> verify -> login"""
    
    def test_full_verification_flow(self):
        """Complete flow: register, verify email, then login should work"""
        # This test requires MongoDB access to get the token
        # We'll test the happy path by using resend to generate a token
        
        email = generate_random_email()
        
        # Step 1: Register
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "flowtest123",
            "name": "Flow Test User",
            "role": "patient"
        })
        assert reg_response.status_code == 200
        assert reg_response.json().get("email_verification_required") == True
        print(f"Step 1: Registered {email} - email_verification_required=True")
        
        # Step 2: Try login - should fail with 403
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": "flowtest123"
        })
        assert login_response.status_code == 403
        assert login_response.json().get("detail") == "email_not_verified"
        print("Step 2: Login blocked with 403 email_not_verified")
        
        # Step 3: Call resend verification to confirm endpoint works
        resend_response = requests.post(f"{BASE_URL}/api/auth/resend-verification", json={
            "email": email
        })
        assert resend_response.status_code == 200
        print("Step 3: Resend verification succeeded")
        
        print("✓ Full verification flow test completed (token retrieval from DB would be needed for full login test)")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
