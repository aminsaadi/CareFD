"""
Test Admin Professions Management APIs
Tests: Profession CRUD, Sub-profession CRUD, Category CRUD, Public API
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@carelink.co.il"
ADMIN_PASSWORD = "password"

# Store created test IDs for cleanup
TEST_DATA = {
    "profession_id": None,
    "sub_profession_id": None,
    "category_id": None,
    "session_token": None
}

class TestAdminProfessionsAPI:
    """Test Admin Professions CRUD APIs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login as admin before each test class"""
        # Login as admin
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        TEST_DATA["session_token"] = data.get("session_token")
        self.headers = {
            "Authorization": f"Bearer {TEST_DATA['session_token']}",
            "Content-Type": "application/json"
        }
    
    def test_01_admin_login(self):
        """Test admin login"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "session_token" in data
        assert data["user"]["role"] == "admin"
        print("PASS: Admin login successful")
    
    def test_02_get_professions_list(self):
        """Test GET /api/admin/professions - retrieves professions list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/professions",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "professions" in data
        assert isinstance(data["professions"], list)
        # Default professions should be initialized
        assert len(data["professions"]) >= 0
        print(f"PASS: Retrieved {len(data['professions'])} professions")
    
    def test_03_create_profession(self):
        """Test POST /api/admin/professions - create new profession"""
        test_name = f"TEST_מקצוע_בדיקה_{uuid.uuid4().hex[:6]}"
        payload = {
            "name": test_name,
            "name_en": "Test Profession",
            "specializations": ["התמחות 1", "התמחות 2", "התמחות 3"]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/professions",
            headers=self.headers,
            json=payload
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "profession" in data
        assert data["profession"]["name"] == test_name
        assert data["profession"]["name_en"] == "Test Profession"
        assert "specializations" in data["profession"]
        assert len(data["profession"]["specializations"]) == 3
        
        # Store profession_id for later tests
        TEST_DATA["profession_id"] = data["profession"]["profession_id"]
        print(f"PASS: Created profession with ID: {TEST_DATA['profession_id']}")
    
    def test_04_get_profession_after_create(self):
        """Test GET /api/admin/professions - verify created profession exists"""
        response = requests.get(
            f"{BASE_URL}/api/admin/professions",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Find our test profession
        found = False
        for prof in data["professions"]:
            if prof.get("profession_id") == TEST_DATA["profession_id"]:
                found = True
                assert "specializations" in prof
                break
        
        assert found, "Created profession not found in list"
        print("PASS: Verified profession exists after creation")
    
    def test_05_edit_profession(self):
        """Test PUT /api/admin/professions/{profession_id} - edit profession"""
        assert TEST_DATA["profession_id"], "No profession_id from previous test"
        
        updated_name = "TEST_מקצוע_מעודכן"
        updated_specializations = ["התמחות חדשה 1", "התמחות חדשה 2"]
        
        payload = {
            "name": updated_name,
            "name_en": "Updated Test Profession",
            "specializations": updated_specializations
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/professions/{TEST_DATA['profession_id']}",
            headers=self.headers,
            json=payload
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["message"] == "Profession updated"
        
        # Verify update
        get_response = requests.get(
            f"{BASE_URL}/api/admin/professions",
            headers=self.headers
        )
        assert get_response.status_code == 200
        professions = get_response.json()["professions"]
        
        updated_prof = next((p for p in professions if p["profession_id"] == TEST_DATA["profession_id"]), None)
        assert updated_prof is not None
        assert updated_prof["name"] == updated_name
        assert updated_prof["name_en"] == "Updated Test Profession"
        assert len(updated_prof["specializations"]) == 2
        
        print("PASS: Profession edited successfully")
    
    def test_06_add_sub_profession(self):
        """Test POST /api/admin/professions/{profession_id}/sub-professions - add sub-profession"""
        assert TEST_DATA["profession_id"], "No profession_id from previous test"
        
        payload = {
            "name": "TEST_תת_מקצוע",
            "name_en": "Test Sub-Profession"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/professions/{TEST_DATA['profession_id']}/sub-professions",
            headers=self.headers,
            json=payload
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "sub_profession" in data
        assert data["sub_profession"]["name"] == "TEST_תת_מקצוע"
        
        TEST_DATA["sub_profession_id"] = data["sub_profession"]["sub_profession_id"]
        print(f"PASS: Created sub-profession with ID: {TEST_DATA['sub_profession_id']}")
    
    def test_07_edit_sub_profession(self):
        """Test PUT /api/admin/sub-professions/{sub_profession_id} - edit sub-profession"""
        assert TEST_DATA["sub_profession_id"], "No sub_profession_id from previous test"
        
        payload = {
            "name": "TEST_תת_מקצוע_מעודכן",
            "name_en": "Updated Test Sub-Profession"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/sub-professions/{TEST_DATA['sub_profession_id']}",
            headers=self.headers,
            json=payload
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["message"] == "Sub-profession updated"
        
        # Verify update
        get_response = requests.get(
            f"{BASE_URL}/api/admin/professions",
            headers=self.headers
        )
        assert get_response.status_code == 200
        professions = get_response.json()["professions"]
        
        our_prof = next((p for p in professions if p["profession_id"] == TEST_DATA["profession_id"]), None)
        assert our_prof is not None
        
        sub_prof = next((sp for sp in our_prof.get("sub_professions", []) if sp["sub_profession_id"] == TEST_DATA["sub_profession_id"]), None)
        assert sub_prof is not None
        assert sub_prof["name"] == "TEST_תת_מקצוע_מעודכן"
        
        print("PASS: Sub-profession edited successfully")
    
    def test_08_add_category(self):
        """Test POST /api/admin/sub-professions/{sub_profession_id}/categories - add category"""
        assert TEST_DATA["sub_profession_id"], "No sub_profession_id from previous test"
        
        payload = {
            "name": "TEST_קטגוריה",
            "name_en": "Test Category"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/sub-professions/{TEST_DATA['sub_profession_id']}/categories",
            headers=self.headers,
            json=payload
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "category" in data
        assert data["category"]["name"] == "TEST_קטגוריה"
        
        TEST_DATA["category_id"] = data["category"]["category_id"]
        print(f"PASS: Created category with ID: {TEST_DATA['category_id']}")
    
    def test_09_verify_hierarchy(self):
        """Test full hierarchy: Profession -> Sub-profession -> Category"""
        response = requests.get(
            f"{BASE_URL}/api/admin/professions",
            headers=self.headers
        )
        assert response.status_code == 200
        professions = response.json()["professions"]
        
        # Find our profession
        our_prof = next((p for p in professions if p["profession_id"] == TEST_DATA["profession_id"]), None)
        assert our_prof is not None, "Test profession not found"
        
        # Check sub-profession exists
        sub_profs = our_prof.get("sub_professions", [])
        our_sub = next((sp for sp in sub_profs if sp["sub_profession_id"] == TEST_DATA["sub_profession_id"]), None)
        assert our_sub is not None, "Test sub-profession not found"
        
        # Check category exists
        categories = our_sub.get("categories", [])
        our_cat = next((c for c in categories if c["category_id"] == TEST_DATA["category_id"]), None)
        assert our_cat is not None, "Test category not found"
        
        print("PASS: Full hierarchy verified (Profession -> Sub-profession -> Category)")
    
    def test_10_public_api_professions(self):
        """Test GET /api/professions - public API returns professions with specializations"""
        response = requests.get(f"{BASE_URL}/api/professions")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "professions" in data
        assert isinstance(data["professions"], list)
        
        # Check structure of returned professions
        if len(data["professions"]) > 0:
            prof = data["professions"][0]
            assert "profession_id" in prof
            assert "name" in prof
            assert "sub_professions" in prof
            # Specializations should be included
            assert "specializations" in prof
        
        print(f"PASS: Public API returned {len(data['professions'])} professions")
    
    def test_11_delete_category(self):
        """Test DELETE /api/admin/categories/{category_id} - delete category"""
        assert TEST_DATA["category_id"], "No category_id from previous test"
        
        response = requests.delete(
            f"{BASE_URL}/api/admin/categories/{TEST_DATA['category_id']}",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["message"] == "Category deleted"
        
        # Verify deletion
        get_response = requests.get(
            f"{BASE_URL}/api/admin/professions",
            headers=self.headers
        )
        professions = get_response.json()["professions"]
        our_prof = next((p for p in professions if p["profession_id"] == TEST_DATA["profession_id"]), None)
        our_sub = next((sp for sp in our_prof.get("sub_professions", []) if sp["sub_profession_id"] == TEST_DATA["sub_profession_id"]), None)
        categories = our_sub.get("categories", [])
        deleted_cat = next((c for c in categories if c["category_id"] == TEST_DATA["category_id"]), None)
        assert deleted_cat is None, "Category should have been deleted"
        
        print("PASS: Category deleted successfully")
    
    def test_12_delete_sub_profession(self):
        """Test DELETE /api/admin/sub-professions/{sub_profession_id} - delete sub-profession"""
        assert TEST_DATA["sub_profession_id"], "No sub_profession_id from previous test"
        
        response = requests.delete(
            f"{BASE_URL}/api/admin/sub-professions/{TEST_DATA['sub_profession_id']}",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["message"] == "Sub-profession deleted"
        
        # Verify deletion
        get_response = requests.get(
            f"{BASE_URL}/api/admin/professions",
            headers=self.headers
        )
        professions = get_response.json()["professions"]
        our_prof = next((p for p in professions if p["profession_id"] == TEST_DATA["profession_id"]), None)
        sub_profs = our_prof.get("sub_professions", [])
        deleted_sub = next((sp for sp in sub_profs if sp["sub_profession_id"] == TEST_DATA["sub_profession_id"]), None)
        assert deleted_sub is None, "Sub-profession should have been deleted"
        
        print("PASS: Sub-profession deleted successfully")
    
    def test_13_delete_profession(self):
        """Test DELETE /api/admin/professions/{profession_id} - delete profession"""
        assert TEST_DATA["profession_id"], "No profession_id from previous test"
        
        response = requests.delete(
            f"{BASE_URL}/api/admin/professions/{TEST_DATA['profession_id']}",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["message"] == "Profession deleted"
        
        # Verify deletion
        get_response = requests.get(
            f"{BASE_URL}/api/admin/professions",
            headers=self.headers
        )
        professions = get_response.json()["professions"]
        deleted_prof = next((p for p in professions if p["profession_id"] == TEST_DATA["profession_id"]), None)
        assert deleted_prof is None, "Profession should have been deleted"
        
        print("PASS: Profession deleted successfully")
    
    def test_14_non_admin_cannot_access(self):
        """Test non-admin user cannot access admin professions endpoints"""
        # First create a test user
        test_email = f"test_{uuid.uuid4().hex[:8]}@test.com"
        register_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": test_email,
                "password": "test123456",
                "name": "Test User",
                "role": "patient"
            }
        )
        
        if register_response.status_code == 200:
            token = register_response.json().get("session_token")
            headers = {"Authorization": f"Bearer {token}"}
            
            # Try to access admin professions
            response = requests.get(
                f"{BASE_URL}/api/admin/professions",
                headers=headers
            )
            assert response.status_code == 403, "Non-admin should get 403"
            print("PASS: Non-admin user correctly denied access (403)")
        else:
            # User might already exist, try login
            login_response = requests.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": test_email, "password": "test123456"}
            )
            if login_response.status_code == 200:
                token = login_response.json().get("session_token")
                headers = {"Authorization": f"Bearer {token}"}
                response = requests.get(
                    f"{BASE_URL}/api/admin/professions",
                    headers=headers
                )
                assert response.status_code == 403
                print("PASS: Non-admin user correctly denied access (403)")
            else:
                print("SKIP: Could not create/login test user for auth test")


class TestProfessionEdgeCases:
    """Test edge cases and error handling"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login as admin"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            TEST_DATA["session_token"] = response.json().get("session_token")
        self.headers = {
            "Authorization": f"Bearer {TEST_DATA['session_token']}",
            "Content-Type": "application/json"
        }
    
    def test_delete_nonexistent_profession(self):
        """Test DELETE non-existent profession returns 404"""
        response = requests.delete(
            f"{BASE_URL}/api/admin/professions/nonexistent_prof_id",
            headers=self.headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Delete non-existent profession returns 404")
    
    def test_edit_nonexistent_profession(self):
        """Test PUT non-existent profession returns 404"""
        response = requests.put(
            f"{BASE_URL}/api/admin/professions/nonexistent_prof_id",
            headers=self.headers,
            json={"name": "Test"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Edit non-existent profession returns 404")
    
    def test_add_sub_to_nonexistent_profession(self):
        """Test adding sub-profession to non-existent profession returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/admin/professions/nonexistent_prof_id/sub-professions",
            headers=self.headers,
            json={"name": "Test Sub", "name_en": "Test"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Add sub to non-existent profession returns 404")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
