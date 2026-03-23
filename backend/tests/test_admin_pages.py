"""
Test Admin Pages CRUD and Public Pages API
Testing features:
- Admin Pages Management (Create, Read, Update, Delete)
- Public Page API (GET /api/pages/{slug})
- Authentication requirements for admin endpoints
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@carefd.com"
ADMIN_PASSWORD = "password"
USER_EMAIL = "user@carefd.com"
USER_PASSWORD = "password"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def admin_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("session_token")
    pytest.skip("Admin authentication failed - skipping admin tests")


@pytest.fixture(scope="module")
def user_token(api_client):
    """Get regular user authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": USER_EMAIL,
        "password": USER_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("session_token")
    return None  # Don't skip, user may not exist


@pytest.fixture(scope="module")
def authenticated_admin(api_client, admin_token):
    """Session with admin auth header"""
    api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
    return api_client


class TestAdminPagesAPI:
    """Test Admin Pages CRUD API"""
    
    test_page_id = None  # Track created page for cleanup
    
    def test_get_pages_list_requires_admin(self, api_client):
        """Test that getting pages list requires authentication"""
        # Clear auth header if set
        api_client.headers.pop("Authorization", None)
        response = api_client.get(f"{BASE_URL}/api/admin/pages")
        assert response.status_code == 401
        print("PASS: GET /api/admin/pages requires authentication")
    
    def test_get_pages_list_admin(self, authenticated_admin):
        """Test admin can get pages list"""
        response = authenticated_admin.get(f"{BASE_URL}/api/admin/pages")
        assert response.status_code == 200
        data = response.json()
        assert "pages" in data
        assert isinstance(data["pages"], list)
        print(f"PASS: Admin can get pages list - {len(data['pages'])} pages found")
    
    def test_create_page_admin(self, authenticated_admin):
        """Test admin can create a new page"""
        unique_slug = f"test-page-{uuid.uuid4().hex[:8]}"
        page_data = {
            "title": "Test Page",
            "slug": unique_slug,
            "content": "<h1>Test Content</h1><p>This is a test page.</p>",
            "meta_description": "Test page description",
            "is_published": True
        }
        
        response = authenticated_admin.post(f"{BASE_URL}/api/admin/pages", json=page_data)
        assert response.status_code == 200
        data = response.json()
        assert "page" in data
        assert data["page"]["title"] == "Test Page"
        assert data["page"]["slug"] == unique_slug
        assert data["page"]["is_published"] == True
        
        # Store page_id for cleanup
        TestAdminPagesAPI.test_page_id = data["page"]["page_id"]
        print(f"PASS: Admin created page with ID: {TestAdminPagesAPI.test_page_id}")
    
    def test_update_page_admin(self, authenticated_admin):
        """Test admin can update an existing page"""
        if not TestAdminPagesAPI.test_page_id:
            pytest.skip("No test page created")
        
        update_data = {
            "title": "Updated Test Page",
            "content": "<h1>Updated Content</h1><p>This content was updated.</p>",
            "meta_description": "Updated description"
        }
        
        response = authenticated_admin.put(
            f"{BASE_URL}/api/admin/pages/{TestAdminPagesAPI.test_page_id}",
            json=update_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Page updated"
        print(f"PASS: Admin updated page {TestAdminPagesAPI.test_page_id}")
    
    def test_update_page_toggle_publish(self, authenticated_admin):
        """Test admin can toggle page publish status"""
        if not TestAdminPagesAPI.test_page_id:
            pytest.skip("No test page created")
        
        # Toggle to unpublished
        response = authenticated_admin.put(
            f"{BASE_URL}/api/admin/pages/{TestAdminPagesAPI.test_page_id}",
            json={"is_published": False}
        )
        assert response.status_code == 200
        print("PASS: Admin toggled page publish status to False")
        
        # Toggle back to published
        response = authenticated_admin.put(
            f"{BASE_URL}/api/admin/pages/{TestAdminPagesAPI.test_page_id}",
            json={"is_published": True}
        )
        assert response.status_code == 200
        print("PASS: Admin toggled page publish status to True")
    
    def test_delete_page_admin(self, authenticated_admin):
        """Test admin can delete a page"""
        if not TestAdminPagesAPI.test_page_id:
            pytest.skip("No test page created")
        
        response = authenticated_admin.delete(
            f"{BASE_URL}/api/admin/pages/{TestAdminPagesAPI.test_page_id}"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Page deleted"
        print(f"PASS: Admin deleted page {TestAdminPagesAPI.test_page_id}")
        
        # Cleanup - reset test_page_id
        TestAdminPagesAPI.test_page_id = None
    
    def test_delete_nonexistent_page(self, authenticated_admin):
        """Test deleting a non-existent page returns 404"""
        response = authenticated_admin.delete(
            f"{BASE_URL}/api/admin/pages/nonexistent_page_id"
        )
        assert response.status_code == 404
        print("PASS: Deleting non-existent page returns 404")


class TestPublicPagesAPI:
    """Test Public Pages API"""
    
    test_slug = None  # Track created page slug
    
    @pytest.fixture(autouse=True)
    def setup_test_page(self, authenticated_admin):
        """Create a test page for public access testing"""
        unique_slug = f"public-test-{uuid.uuid4().hex[:8]}"
        page_data = {
            "title": "Public Test Page",
            "slug": unique_slug,
            "content": "<h1>Public Content</h1><p>This is publicly visible.</p>",
            "is_published": True
        }
        
        response = authenticated_admin.post(f"{BASE_URL}/api/admin/pages", json=page_data)
        if response.status_code == 200:
            TestPublicPagesAPI.test_slug = unique_slug
            page_id = response.json()["page"]["page_id"]
            yield
            # Cleanup after test
            authenticated_admin.delete(f"{BASE_URL}/api/admin/pages/{page_id}")
        else:
            yield
    
    def test_get_published_page(self, api_client):
        """Test public can access published page"""
        if not TestPublicPagesAPI.test_slug:
            pytest.skip("Test page not created")
        
        # Clear auth to test public access
        api_client.headers.pop("Authorization", None)
        
        response = api_client.get(f"{BASE_URL}/api/pages/{TestPublicPagesAPI.test_slug}")
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Public Test Page"
        assert data["slug"] == TestPublicPagesAPI.test_slug
        assert data["is_published"] == True
        print(f"PASS: Public can access published page /{TestPublicPagesAPI.test_slug}")
    
    def test_get_nonexistent_page(self, api_client):
        """Test accessing non-existent page returns 404"""
        api_client.headers.pop("Authorization", None)
        
        response = api_client.get(f"{BASE_URL}/api/pages/this-page-does-not-exist")
        assert response.status_code == 404
        print("PASS: Non-existent page returns 404")


class TestCareFDsPreviewPage:
    """Test specific page endpoint: /api/pages/carefd-preview-1"""
    
    def test_carefd_preview_page(self, api_client):
        """Test GET /api/pages/carefd-preview-1"""
        api_client.headers.pop("Authorization", None)
        
        response = api_client.get(f"{BASE_URL}/api/pages/carefd-preview-1")
        # May be 200 if page exists, or 404 if not yet created
        print(f"GET /api/pages/carefd-preview-1 returned status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            assert "title" in data
            assert "content" in data
            assert data.get("is_published") == True
            print(f"PASS: carefd-preview-1 page exists with title: {data.get('title')}")
        else:
            assert response.status_code == 404
            print("INFO: carefd-preview-1 page not created yet (expected 404)")


class TestAdminPagesAuthorization:
    """Test authorization requirements for admin pages"""
    
    def test_create_page_requires_admin(self, api_client, user_token):
        """Test that non-admin cannot create pages"""
        if not user_token:
            pytest.skip("User token not available")
        
        api_client.headers.update({"Authorization": f"Bearer {user_token}"})
        
        response = api_client.post(f"{BASE_URL}/api/admin/pages", json={
            "title": "Unauthorized Page",
            "slug": "unauthorized-page",
            "content": "Should not be created"
        })
        assert response.status_code == 403
        print("PASS: Non-admin cannot create pages (403)")
    
    def test_update_page_requires_admin(self, api_client, user_token):
        """Test that non-admin cannot update pages"""
        if not user_token:
            pytest.skip("User token not available")
        
        api_client.headers.update({"Authorization": f"Bearer {user_token}"})
        
        response = api_client.put(f"{BASE_URL}/api/admin/pages/page_about", json={
            "title": "Hacked Page"
        })
        assert response.status_code == 403
        print("PASS: Non-admin cannot update pages (403)")
    
    def test_delete_page_requires_admin(self, api_client, user_token):
        """Test that non-admin cannot delete pages"""
        if not user_token:
            pytest.skip("User token not available")
        
        api_client.headers.update({"Authorization": f"Bearer {user_token}"})
        
        response = api_client.delete(f"{BASE_URL}/api/admin/pages/page_about")
        assert response.status_code == 403
        print("PASS: Non-admin cannot delete pages (403)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
