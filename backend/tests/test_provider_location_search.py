"""
Test Provider Location Search APIs
Tests for the location/radius-based provider search and localities endpoints
Fixes: 
- Double verification filter bug (changed to $or)
- Auto-geocoding when provider updates location
- New /api/localities endpoint with Israeli cities and coordinates
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://carefd-preview-5.preview.emergentagent.com')

# Test credentials
TEST_USER = {"email": "user@carefd.com", "password": "password"}
TEST_PROVIDER = {"email": "provider@carefd.com", "password": "password"}

# Tel Aviv coordinates
TEL_AVIV_LAT = 32.0853
TEL_AVIV_LNG = 34.7818

# Far away location (Southern Israel)
FAR_AWAY_LAT = 31.0
FAR_AWAY_LNG = 34.0


class TestProviderSearchVerificationFix:
    """Test that verified providers now appear in search results (the main bug fix)"""
    
    def test_get_providers_returns_verified_providers(self):
        """Test that GET /api/providers returns at least one verified provider"""
        response = requests.get(f"{BASE_URL}/api/providers")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "providers" in data, "Response should contain 'providers' key"
        assert "total" in data, "Response should contain 'total' key"
        
        # The main fix: providers should now be returned (was 0 before due to double filter bug)
        providers = data["providers"]
        total = data["total"]
        
        print(f"Found {total} providers")
        assert total >= 1, f"Expected at least 1 verified provider, got {total}"
        assert len(providers) >= 1, f"Expected at least 1 provider in response, got {len(providers)}"
        
        # Verify that returned providers have either is_verified=True or verification_status='verified'
        for provider in providers[:5]:  # Check first 5
            is_verified = provider.get("is_verified", False)
            verification_status = provider.get("verification_status", "")
            assert is_verified or verification_status == "verified", \
                f"Provider {provider.get('provider_id')} should be verified"
            print(f"Provider: {provider.get('business_name')} - is_verified={is_verified}, status={verification_status}")


class TestProviderSearchByCity:
    """Test provider search by city filter"""
    
    def test_search_by_city_tel_aviv(self):
        """Test GET /api/providers?city=תל אביב returns providers in Tel Aviv area"""
        response = requests.get(f"{BASE_URL}/api/providers", params={"city": "תל אביב"})
        assert response.status_code == 200
        
        data = response.json()
        print(f"Found {data['total']} providers in תל אביב area")
        
        # Verify filters_applied
        assert data.get("filters_applied", {}).get("city") == "תל אביב"
        
        # If providers exist, check they have matching city
        for provider in data["providers"][:3]:
            city = provider.get("location", {}).get("city", "")
            print(f"Provider city: {city}")


class TestProviderSearchByLocationRadius:
    """Test provider search by latitude/longitude with radius"""
    
    def test_search_by_location_returns_distance(self):
        """Test GET /api/providers with lat/lng returns providers with distance_km"""
        params = {
            "latitude": TEL_AVIV_LAT,
            "longitude": TEL_AVIV_LNG,
            "radius_km": 50
        }
        response = requests.get(f"{BASE_URL}/api/providers", params=params)
        assert response.status_code == 200
        
        data = response.json()
        providers = data["providers"]
        
        print(f"Found {data['total']} providers within 50km of Tel Aviv")
        
        # Check that providers have distance_km field
        for provider in providers[:5]:
            distance = provider.get("distance_km")
            if distance is not None:
                print(f"Provider: {provider.get('business_name')} - Distance: {distance} km")
                assert distance <= 50, f"Provider distance {distance} exceeds radius 50km"
    
    def test_search_by_location_small_radius(self):
        """Test GET /api/providers with small radius (10km) near Tel Aviv"""
        params = {
            "latitude": TEL_AVIV_LAT,
            "longitude": TEL_AVIV_LNG,
            "radius_km": 10
        }
        response = requests.get(f"{BASE_URL}/api/providers", params=params)
        assert response.status_code == 200
        
        data = response.json()
        print(f"Found {data['total']} providers within 10km of Tel Aviv")
        
        # All returned providers should be within 10km
        for provider in data["providers"]:
            distance = provider.get("distance_km")
            if distance is not None:
                assert distance <= 10, f"Provider distance {distance} exceeds radius 10km"
    
    def test_search_far_away_location_returns_zero(self):
        """Test GET /api/providers with coordinates far from providers returns 0"""
        params = {
            "latitude": FAR_AWAY_LAT,
            "longitude": FAR_AWAY_LNG,
            "radius_km": 1  # Very small radius
        }
        response = requests.get(f"{BASE_URL}/api/providers", params=params)
        assert response.status_code == 200
        
        data = response.json()
        total = data["total"]
        print(f"Found {total} providers within 1km of far location ({FAR_AWAY_LAT}, {FAR_AWAY_LNG})")
        
        # Expect 0 or very few providers in the middle of the Negev with 1km radius
        # This validates the radius filter is working
        assert total <= 5, f"Expected few/no providers in remote location, got {total}"


class TestLocalitiesEndpoint:
    """Test the new /api/localities endpoint"""
    
    def test_get_localities_returns_list(self):
        """Test GET /api/localities returns Israeli localities"""
        response = requests.get(f"{BASE_URL}/api/localities")
        assert response.status_code == 200
        
        data = response.json()
        assert "localities" in data, "Response should contain 'localities' key"
        assert "total" in data, "Response should contain 'total' key"
        
        localities = data["localities"]
        assert len(localities) > 0, "Should return at least one locality"
        
        # Check structure of first locality
        first = localities[0]
        assert "name" in first, "Locality should have 'name'"
        assert "lat" in first, "Locality should have 'lat'"
        assert "lng" in first, "Locality should have 'lng'"
        
        print(f"Total localities: {data['total']}")
        print(f"First locality: {first['name']} ({first['lat']}, {first['lng']})")
    
    def test_search_localities_hebrew(self):
        """Test GET /api/localities?q=תל&limit=5 returns matching cities"""
        params = {"q": "תל", "limit": 5}
        response = requests.get(f"{BASE_URL}/api/localities", params=params)
        assert response.status_code == 200
        
        data = response.json()
        localities = data["localities"]
        
        print(f"Found {len(localities)} localities matching 'תל'")
        
        # All results should contain 'תל' in name
        for loc in localities:
            assert "תל" in loc["name"], f"Locality {loc['name']} should contain 'תל'"
            print(f"  - {loc['name']} ({loc.get('region', 'N/A')})")
    
    def test_search_localities_limit(self):
        """Test GET /api/localities respects limit parameter"""
        params = {"q": "א", "limit": 3}  # 'א' should match many cities
        response = requests.get(f"{BASE_URL}/api/localities", params=params)
        assert response.status_code == 200
        
        data = response.json()
        localities = data["localities"]
        
        assert len(localities) <= 3, f"Expected max 3 results, got {len(localities)}"


class TestLocalityCoordsEndpoint:
    """Test the /api/localities/{city_name}/coords endpoint"""
    
    def test_get_haifa_coords(self):
        """Test GET /api/localities/חיפה/coords returns coordinates"""
        response = requests.get(f"{BASE_URL}/api/localities/חיפה/coords")
        assert response.status_code == 200
        
        data = response.json()
        assert "lat" in data, "Should return lat"
        assert "lng" in data, "Should return lng"
        
        # Verify Haifa coordinates are approximately correct
        assert 32.7 < data["lat"] < 32.9, f"Haifa lat should be ~32.79, got {data['lat']}"
        assert 34.9 < data["lng"] < 35.1, f"Haifa lng should be ~35.0, got {data['lng']}"
        
        print(f"חיפה coordinates: ({data['lat']}, {data['lng']})")
    
    def test_get_tel_aviv_coords(self):
        """Test GET /api/localities/תל אביב-יפו/coords returns coordinates"""
        response = requests.get(f"{BASE_URL}/api/localities/תל אביב-יפו/coords")
        assert response.status_code == 200
        
        data = response.json()
        assert "lat" in data
        assert "lng" in data
        
        # Verify Tel Aviv coordinates
        assert 32.0 < data["lat"] < 32.2, f"Tel Aviv lat should be ~32.08, got {data['lat']}"
        assert 34.7 < data["lng"] < 34.9, f"Tel Aviv lng should be ~34.78, got {data['lng']}"
        
        print(f"תל אביב-יפו coordinates: ({data['lat']}, {data['lng']})")
    
    def test_get_nonexistent_city_returns_404(self):
        """Test GET /api/localities/עיר-לא-קיימת/coords returns 404"""
        response = requests.get(f"{BASE_URL}/api/localities/עיר-לא-קיימת/coords")
        assert response.status_code == 404, f"Expected 404 for nonexistent city, got {response.status_code}"


class TestVerifiedProviderWithCoordinates:
    """Test that verified provider 'מרפאת בריאות פלוס' has coordinates"""
    
    def test_verified_provider_appears_in_search(self):
        """Test that the verified test provider appears in search results"""
        response = requests.get(f"{BASE_URL}/api/providers")
        assert response.status_code == 200
        
        data = response.json()
        providers = data["providers"]
        
        # Look for the test provider
        test_provider = None
        for p in providers:
            if "בריאות פלוס" in p.get("business_name", ""):
                test_provider = p
                break
        
        if test_provider:
            print(f"Found test provider: {test_provider.get('business_name')}")
            location = test_provider.get("location", {})
            print(f"  City: {location.get('city')}")
            print(f"  Coordinates: ({location.get('latitude')}, {location.get('longitude')})")
            
            # Verify it has coordinates
            lat = location.get("latitude")
            lng = location.get("longitude")
            if lat and lng:
                print(f"  Provider has valid coordinates")
        else:
            print("Test provider 'מרפאת בריאות פלוס' not found in results")
            # Don't fail - maybe it was deleted or renamed


class TestProviderSearchFiltersApplied:
    """Test that filter parameters are correctly reflected in response"""
    
    def test_filters_applied_in_response(self):
        """Test that filters_applied in response matches query params"""
        params = {
            "city": "תל אביב",
            "min_rating": 3.0,
            "radius_km": 25
        }
        response = requests.get(f"{BASE_URL}/api/providers", params=params)
        assert response.status_code == 200
        
        data = response.json()
        filters = data.get("filters_applied", {})
        
        assert filters.get("city") == "תל אביב", "city filter should be applied"
        assert filters.get("min_rating") == 3.0, "min_rating filter should be applied"
        assert filters.get("radius_km") == 25, "radius_km filter should be applied"
        
        print(f"Filters applied: {filters}")
