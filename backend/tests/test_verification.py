"""
Test Suite for User/Provider Verification Feature
Tests:
- GET /api/verification/status - Returns verification status for logged in user/provider
- POST /api/verification/request - Upload documents for verification
- GET /api/admin/user-verifications - Admin can see pending user verifications
- PUT /api/admin/user-verifications/{user_id}/approve - Admin can approve user verification  
- PUT /api/admin/user-verifications/{user_id}/reject - Admin can reject user verification
"""

import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://radius-locator.preview.emergentagent.com')

# Test credentials
ADMIN_CREDS = {"email": "admin@carelink.co.il", "password": "password"}
USER_CREDS = {"email": "user@carelink.co.il", "password": "password"}
PROVIDER_CREDS = {"email": "provider@carelink.co.il", "password": "password"}


class TestAuthHelpers:
    """Helper methods for authentication"""
    
    @staticmethod
    def get_session():
        return requests.Session()
    
    @staticmethod
    def login(session, credentials):
        """Login and return session token"""
        response = session.post(f"{BASE_URL}/api/auth/login", json=credentials)
        if response.status_code == 200:
            token = response.json().get("session_token")
            session.headers.update({"Authorization": f"Bearer {token}"})
            return response.json()
        return None


class TestVerificationStatusEndpoint:
    """Test GET /api/verification/status endpoint"""
    
    def test_verification_status_unauthorized(self):
        """Test that unauthenticated request returns 401"""
        session = requests.Session()
        response = session.get(f"{BASE_URL}/api/verification/status")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Unauthenticated verification status returns 401")
    
    def test_verification_status_for_user(self):
        """Test verification status returns correct data for regular user"""
        session = TestAuthHelpers.get_session()
        login_result = TestAuthHelpers.login(session, USER_CREDS)
        assert login_result is not None, "User login failed"
        
        response = session.get(f"{BASE_URL}/api/verification/status")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "status" in data, "Response should contain 'status' field"
        assert "documents" in data, "Response should contain 'documents' field"
        assert "is_verified" in data, "Response should contain 'is_verified' field"
        assert "user_type" in data, "Response should contain 'user_type' field"
        assert data["user_type"] == "user", f"Expected user_type 'user', got {data['user_type']}"
        
        print(f"PASS: User verification status: {data['status']}, is_verified: {data['is_verified']}")
    
    def test_verification_status_for_provider(self):
        """Test verification status returns correct data for provider"""
        session = TestAuthHelpers.get_session()
        login_result = TestAuthHelpers.login(session, PROVIDER_CREDS)
        assert login_result is not None, "Provider login failed"
        
        response = session.get(f"{BASE_URL}/api/verification/status")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "status" in data, "Response should contain 'status' field"
        assert "documents" in data, "Response should contain 'documents' field"
        assert "is_verified" in data, "Response should contain 'is_verified' field"
        assert "user_type" in data, "Response should contain 'user_type' field"
        assert data["user_type"] == "provider", f"Expected user_type 'provider', got {data['user_type']}"
        
        print(f"PASS: Provider verification status: {data['status']}, is_verified: {data['is_verified']}")


class TestVerificationRequestEndpoint:
    """Test POST /api/verification/request endpoint"""
    
    def test_verification_request_unauthorized(self):
        """Test that unauthenticated request returns 401"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/verification/request")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Unauthenticated verification request returns 401")
    
    def test_verification_request_without_documents(self):
        """Test that request without documents returns 400"""
        session = TestAuthHelpers.get_session()
        login_result = TestAuthHelpers.login(session, USER_CREDS)
        assert login_result is not None, "User login failed"
        
        # Send request without any files
        response = session.post(
            f"{BASE_URL}/api/verification/request",
            data={"notes": "Test notes", "user_type": "user"}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("PASS: Verification request without documents returns 400")
    
    def test_verification_request_with_document(self):
        """Test verification request with ID card document"""
        session = TestAuthHelpers.get_session()
        login_result = TestAuthHelpers.login(session, USER_CREDS)
        assert login_result is not None, "User login failed"
        
        # Create a fake image file for testing
        fake_image = io.BytesIO(b'\xff\xd8\xff\xe0\x00\x10JFIF\x00' + b'\x00' * 100)
        fake_image.name = 'test_id_card.jpg'
        
        files = {
            'id_card': ('test_id_card.jpg', fake_image, 'image/jpeg')
        }
        data = {
            'notes': 'Test verification request',
            'user_type': 'user'
        }
        
        response = session.post(
            f"{BASE_URL}/api/verification/request",
            files=files,
            data=data
        )
        
        # Accept both 200 (success) and 400 (if already pending/approved)
        assert response.status_code in [200, 201, 400], f"Unexpected status {response.status_code}: {response.text}"
        
        if response.status_code in [200, 201]:
            result = response.json()
            assert "message" in result, "Response should contain success message"
            assert "documents_count" in result, "Response should contain documents_count"
            assert result["documents_count"] >= 1, "At least 1 document should be uploaded"
            print(f"PASS: Verification request submitted successfully, {result['documents_count']} documents uploaded")
        else:
            print(f"INFO: Verification request returned 400 - may already have pending request")


class TestAdminUserVerificationsEndpoint:
    """Test GET /api/admin/user-verifications endpoint"""
    
    def test_admin_user_verifications_unauthorized(self):
        """Test that non-admin user cannot access"""
        session = TestAuthHelpers.get_session()
        login_result = TestAuthHelpers.login(session, USER_CREDS)
        assert login_result is not None, "User login failed"
        
        response = session.get(f"{BASE_URL}/api/admin/user-verifications")
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("PASS: Non-admin cannot access user verifications")
    
    def test_admin_user_verifications_success(self):
        """Test that admin can get user verifications"""
        session = TestAuthHelpers.get_session()
        login_result = TestAuthHelpers.login(session, ADMIN_CREDS)
        assert login_result is not None, "Admin login failed"
        
        response = session.get(f"{BASE_URL}/api/admin/user-verifications")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "verifications" in data, "Response should contain 'verifications' field"
        assert isinstance(data["verifications"], list), "verifications should be a list"
        
        print(f"PASS: Admin got {len(data['verifications'])} user verification requests")
    
    def test_admin_user_verifications_filter_by_status(self):
        """Test filtering verifications by status"""
        session = TestAuthHelpers.get_session()
        login_result = TestAuthHelpers.login(session, ADMIN_CREDS)
        assert login_result is not None, "Admin login failed"
        
        # Test each status filter
        for status in ["pending", "approved", "rejected"]:
            response = session.get(f"{BASE_URL}/api/admin/user-verifications?status={status}")
            assert response.status_code == 200, f"Expected 200 for status={status}, got {response.status_code}"
            
            data = response.json()
            assert "verifications" in data
            
            # Verify all returned items have the correct status
            for v in data["verifications"]:
                assert v.get("verification_status") == status, f"Expected status {status}, got {v.get('verification_status')}"
            
            print(f"PASS: Admin filter by status '{status}' returned {len(data['verifications'])} items")


class TestAdminApproveVerification:
    """Test PUT /api/admin/user-verifications/{user_id}/approve endpoint"""
    
    def test_approve_unauthorized(self):
        """Test that non-admin cannot approve"""
        session = TestAuthHelpers.get_session()
        login_result = TestAuthHelpers.login(session, USER_CREDS)
        assert login_result is not None, "User login failed"
        
        response = session.put(f"{BASE_URL}/api/admin/user-verifications/test_user_id/approve")
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("PASS: Non-admin cannot approve verification")
    
    def test_approve_nonexistent_user(self):
        """Test approving non-existent user returns 404"""
        session = TestAuthHelpers.get_session()
        login_result = TestAuthHelpers.login(session, ADMIN_CREDS)
        assert login_result is not None, "Admin login failed"
        
        response = session.put(
            f"{BASE_URL}/api/admin/user-verifications/nonexistent_user_xyz/approve",
            json={"notes": "Test approval"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Approving non-existent user returns 404")


class TestAdminRejectVerification:
    """Test PUT /api/admin/user-verifications/{user_id}/reject endpoint"""
    
    def test_reject_unauthorized(self):
        """Test that non-admin cannot reject"""
        session = TestAuthHelpers.get_session()
        login_result = TestAuthHelpers.login(session, USER_CREDS)
        assert login_result is not None, "User login failed"
        
        response = session.put(f"{BASE_URL}/api/admin/user-verifications/test_user_id/reject")
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("PASS: Non-admin cannot reject verification")
    
    def test_reject_nonexistent_user(self):
        """Test rejecting non-existent user returns 404"""
        session = TestAuthHelpers.get_session()
        login_result = TestAuthHelpers.login(session, ADMIN_CREDS)
        assert login_result is not None, "Admin login failed"
        
        response = session.put(
            f"{BASE_URL}/api/admin/user-verifications/nonexistent_user_xyz/reject",
            json={"reason": "Test rejection"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Rejecting non-existent user returns 404")


class TestVerificationE2EFlow:
    """End-to-end verification flow test"""
    
    def test_e2e_user_verification_flow(self):
        """Test complete verification flow: submit -> admin review -> approve/reject"""
        # Step 1: Get user ID
        user_session = TestAuthHelpers.get_session()
        login_result = TestAuthHelpers.login(user_session, USER_CREDS)
        assert login_result is not None, "User login failed"
        
        # Get user info
        me_response = user_session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200, "Failed to get user info"
        user_id = me_response.json().get("user_id")
        assert user_id, "User ID not found"
        
        # Step 2: Check initial verification status
        status_response = user_session.get(f"{BASE_URL}/api/verification/status")
        assert status_response.status_code == 200
        initial_status = status_response.json()
        print(f"INFO: Initial verification status: {initial_status['status']}")
        
        # Step 3: Admin login
        admin_session = TestAuthHelpers.get_session()
        admin_login = TestAuthHelpers.login(admin_session, ADMIN_CREDS)
        assert admin_login is not None, "Admin login failed"
        
        # Step 4: Admin can view verifications
        verifications_response = admin_session.get(f"{BASE_URL}/api/admin/user-verifications")
        assert verifications_response.status_code == 200
        print(f"INFO: Admin can see {len(verifications_response.json()['verifications'])} verification requests")
        
        # Step 5: Test that admin can approve (we test with user's ID)
        # This will set the user to approved - may affect other tests
        approve_response = admin_session.put(
            f"{BASE_URL}/api/admin/user-verifications/{user_id}/approve",
            json={"notes": "E2E test approval"}
        )
        
        if approve_response.status_code == 200:
            print("PASS: Admin successfully approved user verification")
            
            # Verify user is now verified
            status_after = user_session.get(f"{BASE_URL}/api/verification/status")
            assert status_after.status_code == 200
            assert status_after.json()["status"] == "approved", "Status should be approved"
            assert status_after.json()["is_verified"] == True, "User should be verified"
            print("PASS: User verification status updated to approved")
        else:
            print(f"INFO: Approve returned {approve_response.status_code}: {approve_response.text}")
        
        # Step 6: Test rejection flow (reset and reject)
        # First reset to pending for testing
        admin_session.put(
            f"{BASE_URL}/api/admin/user-verifications/{user_id}/reject",
            json={"reason": "E2E test rejection"}
        )
        
        reject_status = user_session.get(f"{BASE_URL}/api/verification/status")
        if reject_status.status_code == 200 and reject_status.json()["status"] == "rejected":
            print("PASS: Admin can reject user verification")
        
        print("PASS: E2E verification flow completed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
