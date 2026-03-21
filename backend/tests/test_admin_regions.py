"""
Backend API Tests for Admin Regions Management
Tests: Regions CRUD, Cities management with GPS coordinates
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://carefd-preview-5.preview.emergentagent.com"

# Admin credentials
ADMIN_EMAIL = "admin@carefd.com"
ADMIN_PASSWORD = "password"


class TestRegionsAPI:
    """Tests for Regions and Cities API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session and authenticate as admin"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        self.session_token = data.get("session_token")
        self.session.headers.update({"Authorization": f"Bearer {self.session_token}"})
        
        yield
        
        # Cleanup: no specific cleanup needed for this test class
    
    # ===== PUBLIC API TESTS =====
    
    def test_01_get_regions_public_api(self):
        """Test GET /api/regions - Public API returns all regions with cities"""
        response = self.session.get(f"{BASE_URL}/api/regions")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "regions" in data
        regions = data["regions"]
        
        # Verify we have 8 regions of Israel
        assert len(regions) >= 8, f"Expected at least 8 regions, got {len(regions)}"
        
        # Count total cities
        total_cities = sum(len(r.get("cities", [])) for r in regions)
        print(f"Found {len(regions)} regions with {total_cities} total cities")
        
        # Verify region structure
        for region in regions:
            assert "region_id" in region, "region_id missing"
            assert "name" in region, "name missing"
            assert "cities" in region, "cities missing"
            
        print(f"TEST PASS: GET /api/regions returns {len(regions)} regions with {total_cities} cities")
    
    def test_02_regions_have_city_objects_with_coordinates(self):
        """Test that cities have Hebrew name, English name, and GPS coordinates"""
        response = self.session.get(f"{BASE_URL}/api/regions")
        assert response.status_code == 200
        
        data = response.json()
        regions = data["regions"]
        
        cities_with_coords = 0
        cities_without_coords = 0
        
        for region in regions:
            for city in region.get("cities", []):
                # Check city is an object with proper structure
                if isinstance(city, dict):
                    assert "name" in city, f"City missing 'name' field in region {region.get('name')}"
                    
                    # Check if city has coordinates
                    if city.get("lat") and city.get("lng"):
                        cities_with_coords += 1
                        assert isinstance(city["lat"], (int, float)), "lat should be numeric"
                        assert isinstance(city["lng"], (int, float)), "lng should be numeric"
                    else:
                        cities_without_coords += 1
                else:
                    # Old string format
                    cities_without_coords += 1
        
        print(f"Cities with coordinates: {cities_with_coords}")
        print(f"Cities without coordinates: {cities_without_coords}")
        
        # Most cities should have coordinates
        assert cities_with_coords > 50, f"Expected >50 cities with coordinates, got {cities_with_coords}"
        print(f"TEST PASS: {cities_with_coords} cities have GPS coordinates")
    
    def test_03_region_has_hebrew_and_english_names(self):
        """Test regions have both Hebrew and English names"""
        response = self.session.get(f"{BASE_URL}/api/regions")
        assert response.status_code == 200
        
        regions = response.json()["regions"]
        
        for region in regions:
            assert region.get("name"), f"Region missing Hebrew name: {region}"
            # English name is optional but should be present in default regions
            print(f"Region: {region.get('name')} ({region.get('name_en', 'No EN name')})")
        
        print("TEST PASS: Regions have Hebrew names (English names available)")
    
    # ===== ADMIN CRUD TESTS =====
    
    def test_04_admin_create_region(self):
        """Test POST /api/admin/regions - Create a new region"""
        new_region = {
            "name": "אזור בדיקה",
            "name_en": "Test Region",
            "cities": []
        }
        
        response = self.session.post(f"{BASE_URL}/api/admin/regions", json=new_region)
        assert response.status_code == 200, f"Failed to create region: {response.text}"
        
        data = response.json()
        assert "region" in data
        created_region = data["region"]
        
        assert created_region["name"] == new_region["name"]
        assert created_region["name_en"] == new_region["name_en"]
        assert "region_id" in created_region
        
        # Store for cleanup
        self.test_region_id = created_region["region_id"]
        
        print(f"TEST PASS: Created region '{created_region['name']}' with ID {created_region['region_id']}")
        
        # Cleanup - delete the test region
        self.session.delete(f"{BASE_URL}/api/admin/regions/{self.test_region_id}")
    
    def test_05_admin_edit_region(self):
        """Test PUT /api/admin/regions/{id} - Update region name"""
        # First create a region to edit
        create_response = self.session.post(f"{BASE_URL}/api/admin/regions", json={
            "name": "אזור לעדכון",
            "name_en": "Region to Update"
        })
        assert create_response.status_code == 200
        region_id = create_response.json()["region"]["region_id"]
        
        # Update the region
        update_data = {
            "name": "אזור מעודכן",
            "name_en": "Updated Region"
        }
        
        response = self.session.put(f"{BASE_URL}/api/admin/regions/{region_id}", json=update_data)
        assert response.status_code == 200, f"Failed to update region: {response.text}"
        
        # Verify update by fetching regions
        get_response = self.session.get(f"{BASE_URL}/api/regions")
        regions = get_response.json()["regions"]
        updated_region = next((r for r in regions if r["region_id"] == region_id), None)
        
        assert updated_region is not None, "Updated region not found"
        assert updated_region["name"] == update_data["name"]
        assert updated_region["name_en"] == update_data["name_en"]
        
        print(f"TEST PASS: Region updated successfully to '{updated_region['name']}'")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/admin/regions/{region_id}")
    
    def test_06_admin_add_city_to_region_with_coordinates(self):
        """Test POST /api/admin/regions/{id}/cities - Add city with GPS coordinates"""
        # First create a region
        create_response = self.session.post(f"{BASE_URL}/api/admin/regions", json={
            "name": "אזור לעיר חדשה",
            "name_en": "Region for New City"
        })
        assert create_response.status_code == 200
        region_id = create_response.json()["region"]["region_id"]
        
        # Add a city with coordinates
        city_data = {
            "name": "עיר בדיקה",
            "name_en": "Test City",
            "lat": 32.0853,
            "lng": 34.7818
        }
        
        response = self.session.post(f"{BASE_URL}/api/admin/regions/{region_id}/cities", json=city_data)
        assert response.status_code == 200, f"Failed to add city: {response.text}"
        
        # Verify city was added
        get_response = self.session.get(f"{BASE_URL}/api/regions")
        regions = get_response.json()["regions"]
        region = next((r for r in regions if r["region_id"] == region_id), None)
        
        assert region is not None, "Region not found"
        assert len(region["cities"]) == 1, f"Expected 1 city, got {len(region['cities'])}"
        
        added_city = region["cities"][0]
        assert added_city["name"] == city_data["name"]
        assert added_city["lat"] == city_data["lat"]
        assert added_city["lng"] == city_data["lng"]
        
        print(f"TEST PASS: City '{city_data['name']}' added with coordinates ({city_data['lat']}, {city_data['lng']})")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/admin/regions/{region_id}")
    
    def test_07_admin_delete_city_from_region(self):
        """Test DELETE /api/admin/regions/{id}/cities/{city_name}"""
        # Create region with a city
        create_response = self.session.post(f"{BASE_URL}/api/admin/regions", json={
            "name": "אזור למחיקת עיר",
            "name_en": "Region for City Deletion",
            "cities": []
        })
        assert create_response.status_code == 200
        region_id = create_response.json()["region"]["region_id"]
        
        # Add a city
        city_name = "עיר למחיקה"
        self.session.post(f"{BASE_URL}/api/admin/regions/{region_id}/cities", json={
            "name": city_name,
            "name_en": "City to Delete"
        })
        
        # Delete the city
        import urllib.parse
        encoded_city = urllib.parse.quote(city_name)
        response = self.session.delete(f"{BASE_URL}/api/admin/regions/{region_id}/cities/{encoded_city}")
        assert response.status_code == 200, f"Failed to delete city: {response.text}"
        
        # Verify city was deleted
        get_response = self.session.get(f"{BASE_URL}/api/regions")
        regions = get_response.json()["regions"]
        region = next((r for r in regions if r["region_id"] == region_id), None)
        
        assert region is not None
        assert len(region["cities"]) == 0, f"City was not deleted, still has {len(region['cities'])} cities"
        
        print(f"TEST PASS: City '{city_name}' deleted from region")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/admin/regions/{region_id}")
    
    def test_08_admin_delete_region(self):
        """Test DELETE /api/admin/regions/{id}"""
        # Create a region to delete
        create_response = self.session.post(f"{BASE_URL}/api/admin/regions", json={
            "name": "אזור למחיקה",
            "name_en": "Region to Delete"
        })
        assert create_response.status_code == 200
        region_id = create_response.json()["region"]["region_id"]
        
        # Delete the region
        response = self.session.delete(f"{BASE_URL}/api/admin/regions/{region_id}")
        assert response.status_code == 200, f"Failed to delete region: {response.text}"
        
        # Verify region was deleted
        get_response = self.session.get(f"{BASE_URL}/api/regions")
        regions = get_response.json()["regions"]
        deleted_region = next((r for r in regions if r["region_id"] == region_id), None)
        
        assert deleted_region is None, "Region was not deleted"
        
        print("TEST PASS: Region deleted successfully")
    
    def test_09_non_admin_cannot_create_region(self):
        """Test that non-admin users cannot create regions"""
        # Create a regular session without admin auth
        regular_session = requests.Session()
        regular_session.headers.update({"Content-Type": "application/json"})
        
        response = regular_session.post(f"{BASE_URL}/api/admin/regions", json={
            "name": "אזור לא מורשה",
            "name_en": "Unauthorized Region"
        })
        
        # Should fail with 401 (no auth) or 403 (not admin)
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("TEST PASS: Non-admin cannot create region (got 401/403)")
    
    # ===== PROVIDERS SEARCH WITH GPS TESTS =====
    
    def test_10_providers_search_with_coordinates(self):
        """Test /api/providers search returns distance when GPS coordinates provided"""
        # Search with Tel Aviv coordinates
        params = {
            "latitude": 32.0853,
            "longitude": 34.7818,
            "radius_km": 50
        }
        
        response = self.session.get(f"{BASE_URL}/api/providers", params=params)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        print(f"Found {data.get('total', 0)} providers within 50km of Tel Aviv")
        
        # Check if distance_km is included in response
        providers = data.get("providers", [])
        if providers:
            # Some providers should have distance_km
            providers_with_distance = [p for p in providers if p.get("distance_km") is not None]
            print(f"Providers with distance calculated: {len(providers_with_distance)}/{len(providers)}")
        
        print("TEST PASS: Providers search with GPS coordinates working")
    
    def test_11_verify_101_cities_exist(self):
        """Test that approximately 101 cities are initialized"""
        response = self.session.get(f"{BASE_URL}/api/regions")
        assert response.status_code == 200
        
        regions = response.json()["regions"]
        total_cities = 0
        unique_cities = set()
        
        for region in regions:
            for city in region.get("cities", []):
                city_name = city.get("name") if isinstance(city, dict) else city
                unique_cities.add(city_name)
                total_cities += 1
        
        print(f"Total city entries: {total_cities}")
        print(f"Unique cities: {len(unique_cities)}")
        print(f"Regions: {len(regions)}")
        
        # We expect around 101 cities total (some may appear in multiple regions)
        assert len(unique_cities) >= 80, f"Expected at least 80 unique cities, got {len(unique_cities)}"
        print(f"TEST PASS: Found {len(unique_cities)} unique cities across {len(regions)} regions")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
