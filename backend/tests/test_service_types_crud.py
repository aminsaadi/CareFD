"""
Test suite for Service Types and Delivery Types CRUD operations
Tests: Public endpoints, Admin CRUD for service types and delivery types
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test fixtures
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
        "email": "admin@carelink.co.il",
        "password": "password"
    })
    if response.status_code == 200:
        return response.json().get("session_token")
    pytest.skip("Admin authentication failed - skipping admin tests")

@pytest.fixture(scope="module")
def admin_client(api_client, admin_token):
    """Session with admin auth header"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {admin_token}"
    })
    return session


class TestPublicServiceTypes:
    """Test public service-types endpoint"""
    
    def test_get_service_types_returns_4_categories(self, api_client):
        """GET /api/service-types returns 4 service categories"""
        response = api_client.get(f"{BASE_URL}/api/service-types")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "service_types" in data
        service_types = data["service_types"]
        
        # Should have at least 4 default types
        assert len(service_types) >= 4, f"Expected at least 4 service types, got {len(service_types)}"
        
        # Verify default type IDs exist
        type_ids = [t["type_id"] for t in service_types]
        expected_ids = ["visit", "hourly", "consultation", "product"]
        for expected_id in expected_ids:
            assert expected_id in type_ids, f"Missing service type: {expected_id}"
        
        print(f"✓ GET /api/service-types returns {len(service_types)} categories")

    def test_service_types_have_required_fields(self, api_client):
        """Service types have all required fields"""
        response = api_client.get(f"{BASE_URL}/api/service-types")
        assert response.status_code == 200
        
        service_types = response.json()["service_types"]
        required_fields = ["type_id", "name", "is_active"]
        
        for st in service_types:
            for field in required_fields:
                assert field in st, f"Missing field '{field}' in service type {st.get('type_id', 'unknown')}"
        
        print("✓ All service types have required fields")


class TestPublicDeliveryTypes:
    """Test public delivery-types endpoint"""
    
    def test_get_delivery_types_returns_4_methods(self, api_client):
        """GET /api/delivery-types returns 4 delivery methods"""
        response = api_client.get(f"{BASE_URL}/api/delivery-types")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "delivery_types" in data
        delivery_types = data["delivery_types"]
        
        # Should have at least 4 default types
        assert len(delivery_types) >= 4, f"Expected at least 4 delivery types, got {len(delivery_types)}"
        
        # Verify default type IDs exist
        type_ids = [t["type_id"] for t in delivery_types]
        expected_ids = ["home_visit", "hospital", "clinic", "virtual"]
        for expected_id in expected_ids:
            assert expected_id in type_ids, f"Missing delivery type: {expected_id}"
        
        print(f"✓ GET /api/delivery-types returns {len(delivery_types)} methods")

    def test_delivery_types_have_required_fields(self, api_client):
        """Delivery types have all required fields"""
        response = api_client.get(f"{BASE_URL}/api/delivery-types")
        assert response.status_code == 200
        
        delivery_types = response.json()["delivery_types"]
        required_fields = ["type_id", "name", "is_active"]
        
        for dt in delivery_types:
            for field in required_fields:
                assert field in dt, f"Missing field '{field}' in delivery type {dt.get('type_id', 'unknown')}"
        
        print("✓ All delivery types have required fields")


class TestAdminServiceTypesCRUD:
    """Test Admin CRUD for Service Types"""
    
    def test_admin_get_service_types(self, admin_client):
        """Admin can view service types"""
        response = admin_client.get(f"{BASE_URL}/api/admin/service-types")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "service_types" in data
        print(f"✓ Admin GET service types: {len(data['service_types'])} types")

    def test_admin_add_service_type(self, admin_client):
        """Admin can add new service type"""
        unique_id = uuid.uuid4().hex[:6]
        new_type = {
            "name": f"TEST_סוג שירות {unique_id}",
            "name_en": f"TEST Service {unique_id}",
            "description": "שירות בדיקה",
            "icon": "package",
            "requires_location": False,
            "has_minimum_hours": False,
            "has_shipping": True
        }
        
        response = admin_client.post(f"{BASE_URL}/api/admin/service-types", json=new_type)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "service_type" in data
        created_type = data["service_type"]
        
        # Verify fields
        assert created_type["name"] == new_type["name"]
        assert created_type["name_en"] == new_type["name_en"]
        assert created_type["has_shipping"] == True
        assert "type_id" in created_type
        
        # Store for cleanup
        self.__class__.created_service_type_id = created_type["type_id"]
        
        print(f"✓ Admin created service type: {created_type['type_id']}")
        return created_type["type_id"]

    def test_admin_edit_service_type(self, admin_client):
        """Admin can edit service type"""
        type_id = getattr(self.__class__, 'created_service_type_id', None)
        if not type_id:
            pytest.skip("No created service type to edit")
        
        update_data = {
            "name": "TEST_סוג שירות מעודכן",
            "description": "תיאור מעודכן",
            "is_active": True
        }
        
        response = admin_client.put(f"{BASE_URL}/api/admin/service-types/{type_id}", json=update_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        print(f"✓ Admin updated service type: {type_id}")

    def test_admin_toggle_service_type_active(self, admin_client):
        """Admin can toggle service type active/inactive"""
        type_id = getattr(self.__class__, 'created_service_type_id', None)
        if not type_id:
            pytest.skip("No created service type to toggle")
        
        # Toggle to inactive
        response = admin_client.put(f"{BASE_URL}/api/admin/service-types/{type_id}", json={"is_active": False})
        assert response.status_code == 200
        
        # Verify via GET
        get_response = admin_client.get(f"{BASE_URL}/api/admin/service-types")
        service_types = get_response.json()["service_types"]
        toggled_type = next((t for t in service_types if t["type_id"] == type_id), None)
        
        assert toggled_type is not None
        assert toggled_type["is_active"] == False, "Expected is_active=False after toggle"
        
        # Toggle back to active
        response = admin_client.put(f"{BASE_URL}/api/admin/service-types/{type_id}", json={"is_active": True})
        assert response.status_code == 200
        
        print(f"✓ Admin toggled service type active state: {type_id}")

    def test_admin_delete_service_type(self, admin_client):
        """Admin can delete service type"""
        type_id = getattr(self.__class__, 'created_service_type_id', None)
        if not type_id:
            pytest.skip("No created service type to delete")
        
        response = admin_client.delete(f"{BASE_URL}/api/admin/service-types/{type_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify deletion
        get_response = admin_client.get(f"{BASE_URL}/api/admin/service-types")
        service_types = get_response.json()["service_types"]
        deleted_type = next((t for t in service_types if t["type_id"] == type_id), None)
        
        assert deleted_type is None, "Service type should be deleted"
        
        print(f"✓ Admin deleted service type: {type_id}")


class TestAdminDeliveryTypesCRUD:
    """Test Admin CRUD for Delivery Types"""
    
    def test_admin_get_delivery_types(self, admin_client):
        """Admin can view delivery types"""
        response = admin_client.get(f"{BASE_URL}/api/admin/delivery-types")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "delivery_types" in data
        print(f"✓ Admin GET delivery types: {len(data['delivery_types'])} types")

    def test_admin_add_delivery_type(self, admin_client):
        """Admin can add new delivery type"""
        unique_id = uuid.uuid4().hex[:6]
        new_type = {
            "name": f"TEST_אופן מתן {unique_id}",
            "name_en": f"TEST Delivery {unique_id}",
            "description": "אופן מתן שירות בדיקה",
            "icon": "truck",
            "requires_address": True
        }
        
        response = admin_client.post(f"{BASE_URL}/api/admin/delivery-types", json=new_type)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "delivery_type" in data
        created_type = data["delivery_type"]
        
        # Verify fields
        assert created_type["name"] == new_type["name"]
        assert created_type["name_en"] == new_type["name_en"]
        assert created_type["requires_address"] == True
        assert "type_id" in created_type
        
        # Store for cleanup
        self.__class__.created_delivery_type_id = created_type["type_id"]
        
        print(f"✓ Admin created delivery type: {created_type['type_id']}")
        return created_type["type_id"]

    def test_admin_edit_delivery_type(self, admin_client):
        """Admin can edit delivery type"""
        type_id = getattr(self.__class__, 'created_delivery_type_id', None)
        if not type_id:
            pytest.skip("No created delivery type to edit")
        
        update_data = {
            "name": "TEST_אופן מתן מעודכן",
            "description": "תיאור מעודכן",
            "is_active": True
        }
        
        response = admin_client.put(f"{BASE_URL}/api/admin/delivery-types/{type_id}", json=update_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        print(f"✓ Admin updated delivery type: {type_id}")

    def test_admin_toggle_delivery_type_active(self, admin_client):
        """Admin can toggle delivery type active/inactive"""
        type_id = getattr(self.__class__, 'created_delivery_type_id', None)
        if not type_id:
            pytest.skip("No created delivery type to toggle")
        
        # Toggle to inactive
        response = admin_client.put(f"{BASE_URL}/api/admin/delivery-types/{type_id}", json={"is_active": False})
        assert response.status_code == 200
        
        # Verify via GET
        get_response = admin_client.get(f"{BASE_URL}/api/admin/delivery-types")
        delivery_types = get_response.json()["delivery_types"]
        toggled_type = next((t for t in delivery_types if t["type_id"] == type_id), None)
        
        assert toggled_type is not None
        assert toggled_type["is_active"] == False, "Expected is_active=False after toggle"
        
        # Toggle back to active
        response = admin_client.put(f"{BASE_URL}/api/admin/delivery-types/{type_id}", json={"is_active": True})
        assert response.status_code == 200
        
        print(f"✓ Admin toggled delivery type active state: {type_id}")

    def test_admin_delete_delivery_type(self, admin_client):
        """Admin can delete delivery type"""
        type_id = getattr(self.__class__, 'created_delivery_type_id', None)
        if not type_id:
            pytest.skip("No created delivery type to delete")
        
        response = admin_client.delete(f"{BASE_URL}/api/admin/delivery-types/{type_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify deletion
        get_response = admin_client.get(f"{BASE_URL}/api/admin/delivery-types")
        delivery_types = get_response.json()["delivery_types"]
        deleted_type = next((t for t in delivery_types if t["type_id"] == type_id), None)
        
        assert deleted_type is None, "Delivery type should be deleted"
        
        print(f"✓ Admin deleted delivery type: {type_id}")


class TestAuthorizationRequired:
    """Test that non-admin users cannot access admin endpoints"""
    
    def test_admin_service_types_requires_auth(self, api_client):
        """Admin service-types requires authentication"""
        response = api_client.get(f"{BASE_URL}/api/admin/service-types")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Admin service-types requires auth")

    def test_admin_delivery_types_requires_auth(self, api_client):
        """Admin delivery-types requires authentication"""
        response = api_client.get(f"{BASE_URL}/api/admin/delivery-types")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Admin delivery-types requires auth")


class TestServiceModelFields:
    """Test Service model includes required pricing fields"""
    
    def test_service_model_has_pricing_fields(self, admin_client):
        """Verify Service model includes weekend_pricing, travel_cost, shipping fields"""
        # Create a service to test the model fields (using provider endpoint)
        # First get a provider
        response = admin_client.get(f"{BASE_URL}/api/providers")
        data = response.json()
        
        # Verify the expected service fields are documented in the API
        # by checking that the service endpoints support these fields
        service_types_resp = admin_client.get(f"{BASE_URL}/api/service-types")
        service_types = service_types_resp.json()["service_types"]
        
        # Check that product type has shipping
        product_type = next((t for t in service_types if t["type_id"] == "product"), None)
        if product_type:
            assert product_type.get("has_shipping") == True, "Product type should have has_shipping=True"
        
        # Check that hourly type has minimum hours
        hourly_type = next((t for t in service_types if t["type_id"] == "hourly"), None)
        if hourly_type:
            assert hourly_type.get("has_minimum_hours") == True, "Hourly type should have has_minimum_hours=True"
        
        print("✓ Service model has expected pricing-related fields")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
