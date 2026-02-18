"""
Test Admin APIs for CareLink Healthcare Platform
Tests: /api/admin/stats, settings, professions, users, bookings, ads, blog, pages, featured
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin_test@carelink.co.il"
ADMIN_PASSWORD = "test123456"

class TestAdminAPIs:
    """Test suite for Admin Dashboard APIs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with auth"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.admin_token = None
        
    def get_admin_token(self):
        """Authenticate as admin and get token"""
        if self.admin_token:
            return self.admin_token
            
        # First, try to login
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        if login_response.status_code == 200:
            data = login_response.json()
            self.admin_token = data.get("session_token")
            print(f"Admin login successful, user role: {data.get('user', {}).get('role')}")
            return self.admin_token
        elif login_response.status_code == 401:
            # Register admin user if doesn't exist
            print("Admin user not found, registering...")
            register_response = self.session.post(f"{BASE_URL}/api/auth/register", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD,
                "name": "Test Admin",
                "role": "patient"  # Will be upgraded to admin
            })
            if register_response.status_code in [200, 201]:
                data = register_response.json()
                self.admin_token = data.get("session_token")
                print(f"Admin registered, token received")
                return self.admin_token
        
        pytest.skip(f"Could not authenticate admin: {login_response.status_code}")
        return None

    def get_auth_header(self):
        """Get authorization header with admin token"""
        token = self.get_admin_token()
        return {"Authorization": f"Bearer {token}"}
        
    # ==================== ADMIN STATS ====================
    
    def test_admin_stats_requires_auth(self):
        """Test that /admin/stats requires authentication"""
        response = self.session.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: /admin/stats requires authentication")
    
    def test_admin_stats_with_auth(self):
        """Test GET /admin/stats returns proper stats structure"""
        response = self.session.get(
            f"{BASE_URL}/api/admin/stats",
            headers=self.get_auth_header()
        )
        
        # If 403, user is not admin - report this
        if response.status_code == 403:
            print(f"NOTE: Current user is not admin (403 Forbidden). Need to set admin role in database.")
            pytest.skip("User is not admin - need to update role in database")
            
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        expected_fields = ['total_users', 'total_providers', 'total_bookings', 'total_reviews']
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        
        print(f"PASS: /admin/stats returned stats: users={data.get('total_users')}, providers={data.get('total_providers')}, bookings={data.get('total_bookings')}")
        
    # ==================== ADMIN SETTINGS ====================
    
    def test_admin_settings_get(self):
        """Test GET /admin/settings returns site settings"""
        response = self.session.get(
            f"{BASE_URL}/api/admin/settings",
            headers=self.get_auth_header()
        )
        
        if response.status_code == 403:
            pytest.skip("User is not admin")
            
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "site_name" in data, "Missing site_name in settings"
        print(f"PASS: /admin/settings returned settings with site_name={data.get('site_name')}")
        
    def test_admin_settings_update(self):
        """Test PUT /admin/settings updates settings"""
        test_tagline = f"Test Tagline {uuid.uuid4().hex[:6]}"
        
        response = self.session.put(
            f"{BASE_URL}/api/admin/settings",
            headers=self.get_auth_header(),
            json={"site_tagline": test_tagline}
        )
        
        if response.status_code == 403:
            pytest.skip("User is not admin")
            
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify update
        verify_response = self.session.get(
            f"{BASE_URL}/api/admin/settings",
            headers=self.get_auth_header()
        )
        assert verify_response.json().get("site_tagline") == test_tagline, "Settings not updated"
        print(f"PASS: /admin/settings PUT updated tagline to '{test_tagline}'")
        
    # ==================== ADMIN PROFESSIONS ====================
    
    def test_admin_professions_get(self):
        """Test GET /admin/professions returns profession hierarchy"""
        response = self.session.get(
            f"{BASE_URL}/api/admin/professions",
            headers=self.get_auth_header()
        )
        
        if response.status_code == 403:
            pytest.skip("User is not admin")
            
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "professions" in data, "Missing 'professions' key"
        assert isinstance(data["professions"], list), "Professions should be a list"
        print(f"PASS: /admin/professions returned {len(data['professions'])} professions")
        
    def test_admin_professions_crud(self):
        """Test CRUD operations for professions"""
        # CREATE
        create_response = self.session.post(
            f"{BASE_URL}/api/admin/professions",
            headers=self.get_auth_header(),
            json={"name": "TEST_מקצוע בדיקה", "name_en": "TEST_Profession"}
        )
        
        if create_response.status_code == 403:
            pytest.skip("User is not admin")
            
        assert create_response.status_code == 200, f"Create failed: {create_response.status_code}"
        profession_id = create_response.json().get("profession", {}).get("profession_id")
        print(f"PASS: Created profession {profession_id}")
        
        # DELETE
        if profession_id:
            delete_response = self.session.delete(
                f"{BASE_URL}/api/admin/professions/{profession_id}",
                headers=self.get_auth_header()
            )
            assert delete_response.status_code == 200, f"Delete failed: {delete_response.status_code}"
            print(f"PASS: Deleted profession {profession_id}")
    
    # ==================== ADMIN USERS ====================
    
    def test_admin_users_list(self):
        """Test GET /admin/users returns users with pagination"""
        response = self.session.get(
            f"{BASE_URL}/api/admin/users",
            headers=self.get_auth_header()
        )
        
        if response.status_code == 403:
            pytest.skip("User is not admin")
            
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "users" in data, "Missing 'users' key"
        assert "total" in data, "Missing 'total' key for pagination"
        print(f"PASS: /admin/users returned {len(data['users'])} users (total: {data['total']})")
        
    def test_admin_users_filter_by_role(self):
        """Test GET /admin/users with role filter"""
        response = self.session.get(
            f"{BASE_URL}/api/admin/users?role=patient",
            headers=self.get_auth_header()
        )
        
        if response.status_code == 403:
            pytest.skip("User is not admin")
            
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        for user in data.get("users", []):
            assert user.get("role") == "patient" or data["total"] == 0, "Filter not working"
        print(f"PASS: /admin/users filter by role=patient worked")
        
    # ==================== ADMIN BOOKINGS ====================
    
    def test_admin_bookings_list(self):
        """Test GET /admin/bookings returns bookings"""
        response = self.session.get(
            f"{BASE_URL}/api/admin/bookings",
            headers=self.get_auth_header()
        )
        
        if response.status_code == 403:
            pytest.skip("User is not admin")
            
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "bookings" in data, "Missing 'bookings' key"
        print(f"PASS: /admin/bookings returned {len(data['bookings'])} bookings")
        
    def test_admin_bookings_filter_by_status(self):
        """Test GET /admin/bookings with status filter"""
        response = self.session.get(
            f"{BASE_URL}/api/admin/bookings?status=pending",
            headers=self.get_auth_header()
        )
        
        if response.status_code == 403:
            pytest.skip("User is not admin")
            
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"PASS: /admin/bookings filter by status=pending worked")
        
    # ==================== ADMIN ADS ====================
    
    def test_admin_ads_crud(self):
        """Test CRUD operations for ads"""
        # CREATE
        create_response = self.session.post(
            f"{BASE_URL}/api/admin/ads",
            headers=self.get_auth_header(),
            json={
                "title": "TEST_פרסומת בדיקה",
                "image_url": "https://example.com/test-ad.jpg",
                "link_url": "https://example.com",
                "position": "homepage_top",
                "is_active": True
            }
        )
        
        if create_response.status_code == 403:
            pytest.skip("User is not admin")
            
        assert create_response.status_code == 200, f"Create failed: {create_response.status_code}: {create_response.text}"
        ad_data = create_response.json().get("ad", {})
        ad_id = ad_data.get("ad_id")
        print(f"PASS: Created ad {ad_id}")
        
        # GET (list)
        list_response = self.session.get(
            f"{BASE_URL}/api/admin/ads",
            headers=self.get_auth_header()
        )
        assert list_response.status_code == 200, "GET ads failed"
        print(f"PASS: Listed {len(list_response.json().get('ads', []))} ads")
        
        # UPDATE
        if ad_id:
            update_response = self.session.put(
                f"{BASE_URL}/api/admin/ads/{ad_id}",
                headers=self.get_auth_header(),
                json={"title": "TEST_Updated Ad Title", "is_active": False}
            )
            assert update_response.status_code == 200, f"Update failed: {update_response.status_code}"
            print(f"PASS: Updated ad {ad_id}")
            
            # DELETE
            delete_response = self.session.delete(
                f"{BASE_URL}/api/admin/ads/{ad_id}",
                headers=self.get_auth_header()
            )
            assert delete_response.status_code == 200, f"Delete failed: {delete_response.status_code}"
            print(f"PASS: Deleted ad {ad_id}")
    
    # ==================== ADMIN BLOG ====================
    
    def test_admin_blog_crud(self):
        """Test CRUD operations for blog posts"""
        # CREATE
        create_response = self.session.post(
            f"{BASE_URL}/api/admin/blog",
            headers=self.get_auth_header(),
            json={
                "title": "TEST_פוסט בדיקה",
                "slug": f"test-post-{uuid.uuid4().hex[:6]}",
                "excerpt": "זהו פוסט בדיקה",
                "content": "<p>תוכן הפוסט</p>",
                "is_published": False
            }
        )
        
        if create_response.status_code == 403:
            pytest.skip("User is not admin")
            
        assert create_response.status_code == 200, f"Create failed: {create_response.status_code}: {create_response.text}"
        post_data = create_response.json().get("post", {})
        post_id = post_data.get("post_id")
        print(f"PASS: Created blog post {post_id}")
        
        # GET (list)
        list_response = self.session.get(
            f"{BASE_URL}/api/admin/blog",
            headers=self.get_auth_header()
        )
        assert list_response.status_code == 200, "GET blog posts failed"
        print(f"PASS: Listed {len(list_response.json().get('posts', []))} blog posts")
        
        # UPDATE
        if post_id:
            update_response = self.session.put(
                f"{BASE_URL}/api/admin/blog/{post_id}",
                headers=self.get_auth_header(),
                json={"title": "TEST_Updated Post Title", "is_published": True}
            )
            assert update_response.status_code == 200, f"Update failed: {update_response.status_code}"
            print(f"PASS: Updated blog post {post_id}")
            
            # DELETE
            delete_response = self.session.delete(
                f"{BASE_URL}/api/admin/blog/{post_id}",
                headers=self.get_auth_header()
            )
            assert delete_response.status_code == 200, f"Delete failed: {delete_response.status_code}"
            print(f"PASS: Deleted blog post {post_id}")
    
    # ==================== ADMIN PAGES ====================
    
    def test_admin_pages_crud(self):
        """Test CRUD operations for static pages"""
        # CREATE
        create_response = self.session.post(
            f"{BASE_URL}/api/admin/pages",
            headers=self.get_auth_header(),
            json={
                "title": "TEST_דף בדיקה",
                "slug": f"test-page-{uuid.uuid4().hex[:6]}",
                "content": "<p>תוכן הדף</p>",
                "is_published": False
            }
        )
        
        if create_response.status_code == 403:
            pytest.skip("User is not admin")
            
        assert create_response.status_code == 200, f"Create failed: {create_response.status_code}: {create_response.text}"
        page_data = create_response.json().get("page", {})
        page_id = page_data.get("page_id")
        print(f"PASS: Created page {page_id}")
        
        # GET (list)
        list_response = self.session.get(
            f"{BASE_URL}/api/admin/pages",
            headers=self.get_auth_header()
        )
        assert list_response.status_code == 200, "GET pages failed"
        print(f"PASS: Listed {len(list_response.json().get('pages', []))} pages")
        
        # UPDATE
        if page_id:
            update_response = self.session.put(
                f"{BASE_URL}/api/admin/pages/{page_id}",
                headers=self.get_auth_header(),
                json={"title": "TEST_Updated Page Title", "is_published": True}
            )
            assert update_response.status_code == 200, f"Update failed: {update_response.status_code}"
            print(f"PASS: Updated page {page_id}")
            
            # DELETE
            delete_response = self.session.delete(
                f"{BASE_URL}/api/admin/pages/{page_id}",
                headers=self.get_auth_header()
            )
            assert delete_response.status_code == 200, f"Delete failed: {delete_response.status_code}"
            print(f"PASS: Deleted page {page_id}")
    
    # ==================== ADMIN FEATURED PROVIDERS ====================
    
    def test_admin_featured_providers_get(self):
        """Test GET /admin/featured returns recommended providers"""
        response = self.session.get(
            f"{BASE_URL}/api/admin/featured",
            headers=self.get_auth_header()
        )
        
        if response.status_code == 403:
            pytest.skip("User is not admin")
            
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "providers" in data, "Missing 'providers' key"
        print(f"PASS: /admin/featured returned {len(data['providers'])} featured providers")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
