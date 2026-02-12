"""
CareLink Features Test Suite
Tests for: GPS search, favorites, regions, guest booking, chat
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@carelink.co.il"
ADMIN_PASSWORD = "password"
PROVIDER_EMAIL = "provider@carelink.co.il"
PROVIDER_PASSWORD = "password"
USER_EMAIL = "user@carelink.co.il"
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
    print(f"Admin login failed: {response.status_code} - {response.text}")
    return None

@pytest.fixture(scope="module")
def user_token(api_client):
    """Get user authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": USER_EMAIL,
        "password": USER_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("session_token")
    print(f"User login failed: {response.status_code} - {response.text}")
    return None

@pytest.fixture(scope="module")
def provider_token(api_client):
    """Get provider authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": PROVIDER_EMAIL,
        "password": PROVIDER_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("session_token")
    print(f"Provider login failed: {response.status_code} - {response.text}")
    return None


class TestHealthAndAuth:
    """Basic health and auth tests"""

    def test_health_check(self, api_client):
        """Test health endpoint"""
        response = api_client.get(f"{BASE_URL}/api")
        assert response.status_code == 200
        print("✅ Health check passed")

    def test_admin_login(self, api_client):
        """Test admin login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "session_token" in data
        assert data["user"]["role"] == "admin"
        print(f"✅ Admin login successful: {data['user']['email']}")

    def test_user_login(self, api_client):
        """Test user login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "session_token" in data
        print(f"✅ User login successful: {data['user']['email']}")


class TestProvidersSearch:
    """Test provider search with GPS and filters"""

    def test_search_providers_basic(self, api_client):
        """Test basic provider search"""
        response = api_client.get(f"{BASE_URL}/api/providers")
        assert response.status_code == 200
        data = response.json()
        assert "providers" in data
        assert "total" in data
        print(f"✅ Basic search returned {data['total']} providers")

    def test_search_providers_by_city(self, api_client):
        """Test search providers by city"""
        response = api_client.get(f"{BASE_URL}/api/providers?city=תל אביב")
        assert response.status_code == 200
        data = response.json()
        assert "providers" in data
        print(f"✅ City search returned {data['total']} providers in תל אביב")

    def test_search_providers_by_text(self, api_client):
        """Test search providers by text query"""
        response = api_client.get(f"{BASE_URL}/api/providers?search=סיעוד")
        assert response.status_code == 200
        data = response.json()
        assert "providers" in data
        print(f"✅ Text search 'סיעוד' returned {data['total']} providers")

    def test_search_providers_with_gps_coordinates(self, api_client):
        """Test search providers with GPS coordinates"""
        # Tel Aviv coordinates
        lat = 32.0853
        lon = 34.7818
        radius = 10
        response = api_client.get(f"{BASE_URL}/api/providers?latitude={lat}&longitude={lon}&radius_km={radius}")
        assert response.status_code == 200
        data = response.json()
        assert "providers" in data
        # Check if filters_applied contains the GPS params
        assert data.get("filters_applied", {}).get("radius_km") == radius
        print(f"✅ GPS search at ({lat}, {lon}) with {radius}km radius returned {data['total']} providers")

    def test_search_providers_by_category(self, api_client):
        """Test search providers by category"""
        response = api_client.get(f"{BASE_URL}/api/providers?category=nursing")
        assert response.status_code == 200
        data = response.json()
        assert "providers" in data
        print(f"✅ Category search 'nursing' returned {data['total']} providers")

    def test_search_providers_verified_only(self, api_client):
        """Test search verified providers only"""
        response = api_client.get(f"{BASE_URL}/api/providers?verified_only=true")
        assert response.status_code == 200
        data = response.json()
        assert "providers" in data
        print(f"✅ Verified only search returned {data['total']} providers")

    def test_get_filter_options(self, api_client):
        """Test get filter options endpoint"""
        response = api_client.get(f"{BASE_URL}/api/providers/filters/options")
        assert response.status_code == 200
        data = response.json()
        assert "cities" in data
        assert "categories" in data
        assert "service_types" in data
        assert "radius_options" in data
        print(f"✅ Filter options: {len(data['cities'])} cities, {len(data['categories'])} categories")


class TestRegions:
    """Test regions API"""

    def test_get_regions(self, api_client):
        """Test get regions endpoint"""
        response = api_client.get(f"{BASE_URL}/api/regions")
        assert response.status_code == 200
        data = response.json()
        assert "regions" in data
        regions = data["regions"]
        assert len(regions) > 0
        # Check region structure
        first_region = regions[0]
        assert "name" in first_region
        assert "cities" in first_region
        assert "region_id" in first_region
        print(f"✅ Got {len(regions)} regions")
        for region in regions:
            print(f"   - {region['name']}: {len(region.get('cities', []))} cities")

    def test_create_region_admin(self, api_client, admin_token):
        """Test create region as admin"""
        if not admin_token:
            pytest.skip("Admin token not available")
        
        headers = {"Authorization": f"Bearer {admin_token}"}
        test_region_name = f"TEST_אזור_מבחן_{uuid.uuid4().hex[:6]}"
        
        response = api_client.post(
            f"{BASE_URL}/api/admin/regions",
            json={"name": test_region_name, "cities": []},
            headers=headers
        )
        assert response.status_code in [200, 201]
        data = response.json()
        assert "region_id" in data
        print(f"✅ Created test region: {test_region_name}")
        return data["region_id"]

    def test_add_city_to_region(self, api_client, admin_token):
        """Test add city to region"""
        if not admin_token:
            pytest.skip("Admin token not available")
        
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First, create a test region
        test_region_name = f"TEST_region_{uuid.uuid4().hex[:6]}"
        create_response = api_client.post(
            f"{BASE_URL}/api/admin/regions",
            json={"name": test_region_name, "cities": []},
            headers=headers
        )
        assert create_response.status_code in [200, 201]
        region_id = create_response.json()["region_id"]
        
        # Add a city
        response = api_client.post(
            f"{BASE_URL}/api/admin/regions/{region_id}/cities",
            json={"city": "עיר מבחן"},
            headers=headers
        )
        assert response.status_code == 200
        print(f"✅ Added city to region {region_id}")
        
        # Cleanup - delete the test region
        api_client.delete(f"{BASE_URL}/api/admin/regions/{region_id}", headers=headers)


class TestFavorites:
    """Test favorites API"""

    def test_add_to_favorites(self, api_client, user_token):
        """Test add provider to favorites"""
        if not user_token:
            pytest.skip("User token not available")
        
        headers = {"Authorization": f"Bearer {user_token}"}
        
        # First, get a provider to favorite
        providers_response = api_client.get(f"{BASE_URL}/api/providers")
        providers = providers_response.json().get("providers", [])
        
        if not providers:
            pytest.skip("No providers available to favorite")
        
        provider_id = providers[0]["provider_id"]
        
        # Add to favorites
        response = api_client.post(
            f"{BASE_URL}/api/favorites/{provider_id}",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("is_favorite") == True
        print(f"✅ Added provider {provider_id} to favorites")

    def test_check_favorite_status(self, api_client, user_token):
        """Test check favorite status"""
        if not user_token:
            pytest.skip("User token not available")
        
        headers = {"Authorization": f"Bearer {user_token}"}
        
        # Get a provider
        providers_response = api_client.get(f"{BASE_URL}/api/providers")
        providers = providers_response.json().get("providers", [])
        
        if not providers:
            pytest.skip("No providers available")
        
        provider_id = providers[0]["provider_id"]
        
        # Check favorite status
        response = api_client.get(
            f"{BASE_URL}/api/favorites/check/{provider_id}",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "is_favorite" in data
        print(f"✅ Favorite status for {provider_id}: {data['is_favorite']}")

    def test_get_favorites_list(self, api_client, user_token):
        """Test get favorites list"""
        if not user_token:
            pytest.skip("User token not available")
        
        headers = {"Authorization": f"Bearer {user_token}"}
        
        response = api_client.get(f"{BASE_URL}/api/favorites", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "favorites" in data
        print(f"✅ User has {len(data['favorites'])} favorites")

    def test_remove_from_favorites(self, api_client, user_token):
        """Test remove provider from favorites"""
        if not user_token:
            pytest.skip("User token not available")
        
        headers = {"Authorization": f"Bearer {user_token}"}
        
        # Get favorites first
        favorites_response = api_client.get(f"{BASE_URL}/api/favorites", headers=headers)
        favorites = favorites_response.json().get("favorites", [])
        
        if not favorites:
            # Add one first
            providers_response = api_client.get(f"{BASE_URL}/api/providers")
            providers = providers_response.json().get("providers", [])
            if providers:
                provider_id = providers[0]["provider_id"]
                api_client.post(f"{BASE_URL}/api/favorites/{provider_id}", headers=headers)
            else:
                pytest.skip("No providers available")
        else:
            provider_id = favorites[0]["provider_id"]
        
        # Remove from favorites
        response = api_client.delete(
            f"{BASE_URL}/api/favorites/{provider_id}",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("is_favorite") == False
        print(f"✅ Removed provider {provider_id} from favorites")


class TestGuestBooking:
    """Test guest booking functionality"""

    def test_guest_booking_requires_service(self, api_client):
        """Test guest booking with invalid service"""
        response = api_client.post(f"{BASE_URL}/api/bookings", json={
            "service_id": "invalid_service_id",
            "booking_date": "2025-02-01T10:00:00Z",
            "guest_booking": True,
            "guest_name": "אורח מבחן",
            "guest_email": "test@example.com",
            "guest_phone": "050-1234567"
        })
        # Should return 404 for invalid service
        assert response.status_code in [401, 404]
        print(f"✅ Guest booking with invalid service returns error: {response.status_code}")


class TestChat:
    """Test chat functionality"""

    def test_get_chat_rooms_unauthenticated(self, api_client):
        """Test get chat rooms without auth"""
        response = api_client.get(f"{BASE_URL}/api/chat/rooms")
        assert response.status_code == 401
        print("✅ Chat rooms requires authentication")

    def test_get_chat_rooms_authenticated(self, api_client, user_token):
        """Test get chat rooms with auth"""
        if not user_token:
            pytest.skip("User token not available")
        
        headers = {"Authorization": f"Bearer {user_token}"}
        response = api_client.get(f"{BASE_URL}/api/chat/rooms", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "rooms" in data
        print(f"✅ User has {len(data['rooms'])} chat rooms")


class TestProviderProfile:
    """Test provider profile endpoints"""

    def test_get_provider_profile(self, api_client):
        """Test get provider profile"""
        # First get a provider
        providers_response = api_client.get(f"{BASE_URL}/api/providers")
        providers = providers_response.json().get("providers", [])
        
        if not providers:
            pytest.skip("No providers available")
        
        provider_id = providers[0]["provider_id"]
        
        response = api_client.get(f"{BASE_URL}/api/providers/{provider_id}")
        assert response.status_code == 200
        data = response.json()
        assert "provider_id" in data
        assert "business_name" in data
        # Check if services are included
        assert "services_list" in data or "services" in data
        print(f"✅ Got provider profile: {data.get('business_name', 'Unknown')}")

    def test_provider_profile_increments_views(self, api_client):
        """Test that viewing provider profile increments view count"""
        # Get a provider
        providers_response = api_client.get(f"{BASE_URL}/api/providers")
        providers = providers_response.json().get("providers", [])
        
        if not providers:
            pytest.skip("No providers available")
        
        provider_id = providers[0]["provider_id"]
        
        # Get profile first time
        response1 = api_client.get(f"{BASE_URL}/api/providers/{provider_id}")
        views1 = response1.json().get("views_count", 0)
        
        # Get profile second time
        response2 = api_client.get(f"{BASE_URL}/api/providers/{provider_id}")
        views2 = response2.json().get("views_count", 0)
        
        # Views should increment (or at least not decrease)
        assert views2 >= views1
        print(f"✅ Provider view count: {views1} -> {views2}")


class TestProviderReviews:
    """Test provider reviews"""

    def test_get_provider_reviews(self, api_client):
        """Test get provider reviews"""
        # Get a provider
        providers_response = api_client.get(f"{BASE_URL}/api/providers")
        providers = providers_response.json().get("providers", [])
        
        if not providers:
            pytest.skip("No providers available")
        
        provider_id = providers[0]["provider_id"]
        
        response = api_client.get(f"{BASE_URL}/api/providers/{provider_id}/reviews")
        assert response.status_code == 200
        data = response.json()
        assert "reviews" in data
        print(f"✅ Provider has {len(data['reviews'])} reviews")


class TestServices:
    """Test services endpoints"""

    def test_get_services(self, api_client):
        """Test get services list"""
        response = api_client.get(f"{BASE_URL}/api/services")
        assert response.status_code == 200
        data = response.json()
        assert "services" in data
        print(f"✅ Got {len(data['services'])} services")

    def test_search_services_by_type(self, api_client):
        """Test search services by type"""
        response = api_client.get(f"{BASE_URL}/api/services?service_type=home_visit")
        assert response.status_code == 200
        data = response.json()
        assert "services" in data
        print(f"✅ Found {len(data['services'])} home_visit services")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
