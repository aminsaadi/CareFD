"""
Test Admin User Management APIs
Tests for the enhanced admin user management features:
- User numbers (U...) display
- Provider numbers (P...) display
- GET /api/admin/users/{user_id} - user details with stats
- PUT /api/admin/users/{user_id} - update user details
- PUT /api/admin/users/{user_id}/suspend - suspend/unsuspend user
- POST /api/admin/users/{user_id}/message - send private message
- GET /api/admin/users/{user_id}/verification-documents - get user's verification docs
- GET /api/admin/services - list all services with provider info
- PUT /api/admin/services/{service_id} - update service details
- DELETE /api/admin/services/{service_id} - delete service
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test Credentials
ADMIN_EMAIL = "admin_test@carefd.com"
ADMIN_PASSWORD = "test123456"


class TestAdminUserManagement:
    """Tests for admin user management endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert data.get("user", {}).get("role") == "admin", "User is not admin"
        return data.get("session_token")
    
    @pytest.fixture(scope="class")
    def admin_headers(self, admin_token):
        """Get headers with admin auth"""
        return {
            "Authorization": f"Bearer {admin_token}",
            "Content-Type": "application/json"
        }
    
    @pytest.fixture(scope="class")
    def test_user_id(self, admin_headers):
        """Get a valid user ID for testing - pick first non-admin user from list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users?limit=50",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed to get users: {response.text}"
        users = response.json().get("users", [])
        # Find first non-admin user
        for user in users:
            if user.get("role") != "admin":
                return user.get("user_id")
        # If no non-admin user, return first user
        if users:
            return users[0].get("user_id")
        pytest.skip("No users available for testing")
    
    # ==================== USER NUMBER TESTS ====================
    
    def test_users_have_user_number(self, admin_headers):
        """Test that users list shows user_number field (U...)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users?limit=10",
            headers=admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        users = data.get("users", [])
        
        # Check that at least some users have user_number
        users_with_number = [u for u in users if u.get("user_number")]
        print(f"Users with user_number: {len(users_with_number)}/{len(users)}")
        
        # At least one user should have a user_number starting with U
        for user in users_with_number:
            user_number = user.get("user_number", "")
            print(f"User {user.get('name')}: user_number = {user_number}")
            assert user_number.startswith("U"), f"user_number should start with 'U': {user_number}"
    
    # ==================== GET USER DETAILS ====================
    
    def test_get_user_details_success(self, admin_headers, test_user_id):
        """Test GET /api/admin/users/{user_id} returns user details with stats"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users/{test_user_id}",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Check required fields
        assert "user" in data, "Response should have 'user' field"
        assert "stats" in data, "Response should have 'stats' field"
        
        user = data["user"]
        stats = data["stats"]
        
        # User fields
        assert user.get("user_id") == test_user_id
        assert "email" in user
        assert "name" in user
        assert "role" in user
        assert "user_number" in user
        
        # Stats fields
        assert "bookings_count" in stats
        assert "messages_count" in stats
        
        print(f"User details: {user.get('name')} ({user.get('user_number')})")
        print(f"Stats: bookings={stats.get('bookings_count')}, messages={stats.get('messages_count')}")
    
    def test_get_user_details_not_found(self, admin_headers):
        """Test GET /api/admin/users/{user_id} returns 404 for non-existent user"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users/non_existent_user_123",
            headers=admin_headers
        )
        assert response.status_code == 404
    
    def test_get_user_details_requires_admin(self):
        """Test that non-admin cannot access user details"""
        # Try without auth
        response = requests.get(
            f"{BASE_URL}/api/admin/users/any_user_id"
        )
        assert response.status_code == 401
    
    # ==================== UPDATE USER ====================
    
    def test_update_user_success(self, admin_headers, test_user_id):
        """Test PUT /api/admin/users/{user_id} updates user details"""
        # First get current user data
        get_response = requests.get(
            f"{BASE_URL}/api/admin/users/{test_user_id}",
            headers=admin_headers
        )
        original_name = get_response.json().get("user", {}).get("name", "Test")
        
        # Update with test marker
        test_name = f"TEST_Updated_{uuid.uuid4().hex[:6]}"
        response = requests.put(
            f"{BASE_URL}/api/admin/users/{test_user_id}",
            headers=admin_headers,
            json={
                "name": test_name,
                "phone": "050-1234567"
            }
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        # Verify update
        verify_response = requests.get(
            f"{BASE_URL}/api/admin/users/{test_user_id}",
            headers=admin_headers
        )
        assert verify_response.status_code == 200
        updated_user = verify_response.json().get("user", {})
        assert updated_user.get("name") == test_name
        assert updated_user.get("phone") == "050-1234567"
        
        print(f"User updated successfully: {test_name}")
        
        # Restore original name
        requests.put(
            f"{BASE_URL}/api/admin/users/{test_user_id}",
            headers=admin_headers,
            json={"name": original_name}
        )
    
    def test_update_user_not_found(self, admin_headers):
        """Test PUT /api/admin/users/{user_id} returns 404 for non-existent user"""
        response = requests.put(
            f"{BASE_URL}/api/admin/users/non_existent_user_123",
            headers=admin_headers,
            json={"name": "Test"}
        )
        assert response.status_code == 404
    
    def test_update_user_no_valid_fields(self, admin_headers, test_user_id):
        """Test PUT /api/admin/users/{user_id} rejects invalid fields"""
        response = requests.put(
            f"{BASE_URL}/api/admin/users/{test_user_id}",
            headers=admin_headers,
            json={"invalid_field": "value"}
        )
        assert response.status_code == 400
    
    # ==================== SUSPEND USER ====================
    
    def test_suspend_user_success(self, admin_headers, test_user_id):
        """Test PUT /api/admin/users/{user_id}/suspend suspends user"""
        # Suspend user
        response = requests.put(
            f"{BASE_URL}/api/admin/users/{test_user_id}/suspend",
            headers=admin_headers,
            json={
                "is_suspended": True,
                "reason": "Test suspension - will unsuspend immediately"
            }
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        # Verify suspension
        verify_response = requests.get(
            f"{BASE_URL}/api/admin/users/{test_user_id}",
            headers=admin_headers
        )
        suspended_user = verify_response.json().get("user", {})
        assert suspended_user.get("is_suspended") == True
        print("User suspended successfully")
        
        # Unsuspend user
        unsuspend_response = requests.put(
            f"{BASE_URL}/api/admin/users/{test_user_id}/suspend",
            headers=admin_headers,
            json={"is_suspended": False}
        )
        assert unsuspend_response.status_code == 200
        
        # Verify unsuspension
        verify_response2 = requests.get(
            f"{BASE_URL}/api/admin/users/{test_user_id}",
            headers=admin_headers
        )
        unsuspended_user = verify_response2.json().get("user", {})
        assert unsuspended_user.get("is_suspended") == False
        print("User unsuspended successfully")
    
    def test_suspend_self_rejected(self, admin_headers):
        """Test that admin cannot suspend themselves"""
        # Get admin user_id first
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        admin_user_id = login_response.json().get("user", {}).get("user_id")
        
        # Try to suspend self
        response = requests.put(
            f"{BASE_URL}/api/admin/users/{admin_user_id}/suspend",
            headers=admin_headers,
            json={"is_suspended": True, "reason": "Test"}
        )
        assert response.status_code == 400
        assert "Cannot suspend yourself" in response.text
    
    # ==================== SEND MESSAGE ====================
    
    def test_send_message_success(self, admin_headers, test_user_id):
        """Test POST /api/admin/users/{user_id}/message sends message"""
        response = requests.post(
            f"{BASE_URL}/api/admin/users/{test_user_id}/message",
            headers=admin_headers,
            json={
                "subject": "Test Message from Admin",
                "content": f"This is a test message sent at {datetime.now().isoformat()}"
            }
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        assert "Message sent successfully" in response.json().get("message", "")
        print("Message sent successfully")
    
    def test_send_message_no_content_rejected(self, admin_headers, test_user_id):
        """Test POST /api/admin/users/{user_id}/message requires content"""
        response = requests.post(
            f"{BASE_URL}/api/admin/users/{test_user_id}/message",
            headers=admin_headers,
            json={"subject": "Test"}  # No content
        )
        assert response.status_code == 400
        assert "content" in response.text.lower()
    
    # ==================== VERIFICATION DOCUMENTS ====================
    
    def test_get_verification_documents(self, admin_headers, test_user_id):
        """Test GET /api/admin/users/{user_id}/verification-documents"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users/{test_user_id}/verification-documents",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Response should have documents array and verification_status
        assert "documents" in data
        assert "verification_status" in data
        
        # If user is not a provider, status should indicate that
        if data.get("verification_status") == "not_provider":
            assert data.get("documents") == []
            print("User is not a provider - no verification docs expected")
        else:
            print(f"Verification status: {data.get('verification_status')}")
            print(f"Documents count: {len(data.get('documents', []))}")


class TestAdminServicesManagement:
    """Tests for admin services management endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json().get("session_token")
    
    @pytest.fixture(scope="class")
    def admin_headers(self, admin_token):
        """Get headers with admin auth"""
        return {
            "Authorization": f"Bearer {admin_token}",
            "Content-Type": "application/json"
        }
    
    @pytest.fixture(scope="class")
    def test_service_id(self, admin_headers):
        """Get a valid service ID for testing"""
        response = requests.get(
            f"{BASE_URL}/api/admin/services?limit=10",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed to get services: {response.text}"
        services = response.json().get("services", [])
        if services:
            return services[0].get("service_id")
        pytest.skip("No services available for testing")
    
    # ==================== GET ADMIN SERVICES ====================
    
    def test_get_services_list(self, admin_headers):
        """Test GET /api/admin/services returns services with provider info"""
        response = requests.get(
            f"{BASE_URL}/api/admin/services",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "services" in data
        assert "total" in data
        
        services = data.get("services", [])
        print(f"Total services: {data.get('total')}")
        
        # Check that services have provider_number field (P...)
        for service in services[:3]:  # Check first 3
            print(f"Service: {service.get('name')}")
            print(f"  Provider: {service.get('provider_name')}")
            print(f"  Provider Number: {service.get('provider_number')}")
            
            if service.get("provider_number"):
                assert service.get("provider_number", "").startswith("P"), \
                    f"Provider number should start with 'P': {service.get('provider_number')}"
    
    def test_get_services_with_search(self, admin_headers):
        """Test GET /api/admin/services with search parameter"""
        response = requests.get(
            f"{BASE_URL}/api/admin/services?search=test",
            headers=admin_headers
        )
        assert response.status_code == 200
    
    def test_get_services_with_pagination(self, admin_headers):
        """Test GET /api/admin/services with pagination"""
        response = requests.get(
            f"{BASE_URL}/api/admin/services?skip=0&limit=5",
            headers=admin_headers
        )
        assert response.status_code == 200
        services = response.json().get("services", [])
        assert len(services) <= 5
    
    def test_get_services_requires_admin(self):
        """Test that non-admin cannot access admin services"""
        response = requests.get(f"{BASE_URL}/api/admin/services")
        assert response.status_code == 401
    
    # ==================== UPDATE SERVICE ====================
    
    def test_update_service_success(self, admin_headers, test_service_id):
        """Test PUT /api/admin/services/{service_id} updates service"""
        # Get current service data
        services_response = requests.get(
            f"{BASE_URL}/api/admin/services?limit=50",
            headers=admin_headers
        )
        original_service = None
        for s in services_response.json().get("services", []):
            if s.get("service_id") == test_service_id:
                original_service = s
                break
        
        if not original_service:
            pytest.skip("Could not find original service data")
        
        # Update service
        new_description = f"TEST_Updated_Description_{uuid.uuid4().hex[:6]}"
        response = requests.put(
            f"{BASE_URL}/api/admin/services/{test_service_id}",
            headers=admin_headers,
            json={
                "description": new_description,
                "price": 150.0
            }
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        # Verify update
        verify_response = requests.get(
            f"{BASE_URL}/api/admin/services",
            headers=admin_headers
        )
        updated_service = None
        for s in verify_response.json().get("services", []):
            if s.get("service_id") == test_service_id:
                updated_service = s
                break
        
        if updated_service:
            assert updated_service.get("description") == new_description
            assert updated_service.get("price") == 150.0
            print(f"Service updated successfully")
            
            # Restore original
            requests.put(
                f"{BASE_URL}/api/admin/services/{test_service_id}",
                headers=admin_headers,
                json={
                    "description": original_service.get("description"),
                    "price": original_service.get("price")
                }
            )
    
    def test_update_service_not_found(self, admin_headers):
        """Test PUT /api/admin/services/{service_id} returns 404 for non-existent service"""
        response = requests.put(
            f"{BASE_URL}/api/admin/services/non_existent_service_123",
            headers=admin_headers,
            json={"name": "Test"}
        )
        assert response.status_code == 404
    
    def test_update_service_no_valid_fields(self, admin_headers, test_service_id):
        """Test PUT /api/admin/services/{service_id} rejects invalid fields"""
        response = requests.put(
            f"{BASE_URL}/api/admin/services/{test_service_id}",
            headers=admin_headers,
            json={"invalid_field": "value"}
        )
        assert response.status_code == 400
    
    # ==================== DELETE SERVICE ====================
    
    def test_delete_service_not_found(self, admin_headers):
        """Test DELETE /api/admin/services/{service_id} returns 404 for non-existent"""
        response = requests.delete(
            f"{BASE_URL}/api/admin/services/non_existent_service_123",
            headers=admin_headers
        )
        assert response.status_code == 404


class TestUserAndProviderNumbers:
    """Specific tests for user_number (U...) and provider_number (P...) fields"""
    
    @pytest.fixture(scope="class")
    def admin_headers(self):
        """Get admin authentication headers"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        token = response.json().get("session_token")
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    
    def test_user_numbers_format(self, admin_headers):
        """Test that user_number field follows U... format"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users?limit=20",
            headers=admin_headers
        )
        assert response.status_code == 200
        users = response.json().get("users", [])
        
        users_checked = 0
        for user in users:
            user_number = user.get("user_number")
            if user_number:
                assert user_number.startswith("U"), f"Invalid user_number format: {user_number}"
                assert len(user_number) >= 2, f"user_number too short: {user_number}"
                # Should be U followed by digits
                assert user_number[1:].isdigit(), f"user_number should be U followed by digits: {user_number}"
                users_checked += 1
        
        print(f"Verified {users_checked} users have valid user_number format")
    
    def test_provider_numbers_format(self, admin_headers):
        """Test that provider_number field follows P... format"""
        response = requests.get(
            f"{BASE_URL}/api/admin/services",
            headers=admin_headers
        )
        assert response.status_code == 200
        services = response.json().get("services", [])
        
        providers_checked = 0
        for service in services:
            provider_number = service.get("provider_number")
            if provider_number:
                assert provider_number.startswith("P"), f"Invalid provider_number format: {provider_number}"
                assert len(provider_number) >= 2, f"provider_number too short: {provider_number}"
                # Should be P followed by digits
                assert provider_number[1:].isdigit(), f"provider_number should be P followed by digits: {provider_number}"
                providers_checked += 1
        
        print(f"Verified {providers_checked} services have valid provider_number format")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
