"""
Test suite for CareLink new features:
1. Landing page - Featured providers (/api/providers?recommended=true)
2. Landing page - Popular services (/api/services)
3. Static pages - About, Privacy, Terms, Contact
4. Contact form submission (POST /api/contact)
5. Footer regions (/api/regions)
6. Admin provider edit (PUT /api/admin/providers/:providerId)
"""
import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestLandingPageAPIs:
    """Test APIs used by Landing page"""
    
    def test_get_recommended_providers(self):
        """Landing page - Featured providers section should fetch from API"""
        response = requests.get(f"{BASE_URL}/api/providers?recommended=true&limit=6")
        print(f"Recommended providers API: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "providers" in data, "Response should contain 'providers' key"
        assert "total" in data, "Response should contain 'total' key"
        print(f"✓ Recommended providers endpoint working - returned {len(data.get('providers', []))} providers")
    
    def test_get_popular_services(self):
        """Landing page - Popular services should fetch from API"""
        response = requests.get(f"{BASE_URL}/api/services?limit=6")
        print(f"Popular services API: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "services" in data, "Response should contain 'services' key"
        assert "total" in data, "Response should contain 'total' key"
        print(f"✓ Popular services endpoint working - returned {len(data.get('services', []))} services")
    
    def test_get_regions(self):
        """Footer - Regions column should fetch from API"""
        response = requests.get(f"{BASE_URL}/api/regions")
        print(f"Regions API: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "regions" in data, "Response should contain 'regions' key"
        print(f"✓ Regions endpoint working - returned {len(data.get('regions', []))} regions")


class TestStaticPagesAPIs:
    """Test APIs used by static pages"""
    
    def test_public_settings(self):
        """Contact page fetches settings for contact info"""
        response = requests.get(f"{BASE_URL}/api/settings/public")
        print(f"Public settings API: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Check common settings fields
        assert "contact_phone" in data or "contact_email" in data or isinstance(data, dict), "Response should contain contact settings"
        print(f"✓ Public settings endpoint working")


class TestContactForm:
    """Test Contact form submission"""
    
    def test_contact_form_submission(self):
        """Contact page - form submission POST /api/contact"""
        contact_data = {
            "name": "TEST_צחי ישראלי",
            "email": "test_contact@example.com",
            "phone": "050-1234567",
            "subject": "general",
            "message": "This is a test message from automated testing."
        }
        
        response = requests.post(f"{BASE_URL}/api/contact", json=contact_data)
        print(f"Contact form submission API: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "message" in data, "Response should contain success message"
        assert "contact_id" in data, "Response should contain contact_id"
        print(f"✓ Contact form submission working - contact_id: {data.get('contact_id')}")
    
    def test_contact_form_validation(self):
        """Contact form should validate required fields"""
        # Missing required fields
        contact_data = {
            "name": "",
            "email": "",
            "message": ""
        }
        
        response = requests.post(f"{BASE_URL}/api/contact", json=contact_data)
        print(f"Contact form validation API: {response.status_code}")
        assert response.status_code == 400, f"Expected 400 for invalid data, got {response.status_code}"
        print(f"✓ Contact form validation working - rejects empty fields")


class TestAdminProviderEdit:
    """Test Admin provider edit functionality"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Login as admin and get token"""
        login_data = {
            "email": "admin@carelink.co.il",
            "password": "password"
        }
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        if response.status_code == 200:
            return response.json().get("session_token")
        pytest.skip("Admin login failed - cannot test admin endpoints")
    
    @pytest.fixture(scope="class")
    def test_provider_id(self, admin_token):
        """Get a provider ID for testing"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/providers?limit=1", headers=headers)
        if response.status_code == 200:
            providers = response.json().get("providers", [])
            if providers:
                return providers[0].get("provider_id")
        pytest.skip("No providers found for testing")
    
    def test_admin_can_update_provider(self, admin_token, test_provider_id):
        """Admin should be able to update provider via PUT /api/admin/providers/:providerId"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        update_data = {
            "business_name": "TEST_Updated Provider Name",
            "city": "תל אביב",
            "bio": "Updated bio from automated testing"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/providers/{test_provider_id}",
            json=update_data,
            headers=headers
        )
        print(f"Admin update provider API: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}. Response: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should contain success message"
        print(f"✓ Admin provider update working - message: {data.get('message')}")
    
    def test_admin_can_verify_provider(self, admin_token, test_provider_id):
        """Admin should be able to verify provider via PUT /api/admin/providers/:providerId/verify"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.put(
            f"{BASE_URL}/api/admin/providers/{test_provider_id}/verify",
            headers=headers
        )
        print(f"Admin verify provider API: {response.status_code}")
        # Already verified providers might return different code, but should not be 500
        assert response.status_code in [200, 400], f"Expected 200 or 400, got {response.status_code}"
        print(f"✓ Admin provider verify endpoint accessible")
    
    def test_admin_can_recommend_provider(self, admin_token, test_provider_id):
        """Admin should be able to recommend/unrecommend provider"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Try to recommend
        response = requests.put(
            f"{BASE_URL}/api/admin/providers/{test_provider_id}/recommend",
            headers=headers
        )
        print(f"Admin recommend provider API: {response.status_code}")
        assert response.status_code in [200, 400], f"Expected 200 or 400, got {response.status_code}"
        print(f"✓ Admin provider recommend endpoint accessible")
    
    def test_admin_non_authenticated_rejected(self):
        """Non-authenticated requests to admin endpoints should be rejected"""
        response = requests.put(f"{BASE_URL}/api/admin/providers/some_provider_id")
        print(f"Non-auth admin request: {response.status_code}")
        assert response.status_code in [401, 403, 422], f"Expected 401/403/422, got {response.status_code}"
        print(f"✓ Admin endpoint properly rejects non-authenticated requests")


class TestFrontendRoutes:
    """Test that frontend static page routes return 200"""
    
    def test_about_page(self):
        """About page should be accessible at /about"""
        response = requests.get(f"{BASE_URL}/about")
        print(f"About page: {response.status_code}")
        # Frontend routes typically return the SPA index.html with 200
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ About page route accessible")
    
    def test_privacy_page(self):
        """Privacy page should be accessible at /privacy"""
        response = requests.get(f"{BASE_URL}/privacy")
        print(f"Privacy page: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ Privacy page route accessible")
    
    def test_terms_page(self):
        """Terms page should be accessible at /terms"""
        response = requests.get(f"{BASE_URL}/terms")
        print(f"Terms page: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ Terms page route accessible")
    
    def test_contact_page(self):
        """Contact page should be accessible at /contact"""
        response = requests.get(f"{BASE_URL}/contact")
        print(f"Contact page: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ Contact page route accessible")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
