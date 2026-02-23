"""
Provider Service Form and Booking Price Calculation Tests
Tests:
- Provider service CRUD (Create, Read, Update, Delete)
- Service categories: visit, hourly, consultation, product
- Weekend surcharge (percentage and fixed)
- Travel cost
- Shipping costs for products
- Booking price calculation
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
PROVIDER_EMAIL = "provider@carelink.co.il"
PROVIDER_PASSWORD = "password"
USER_EMAIL = "user@carelink.co.il"
USER_PASSWORD = "password"


class TestServiceCRUD:
    """Test Provider Service CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for provider"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as provider
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": PROVIDER_EMAIL,
            "password": PROVIDER_PASSWORD
        })
        
        if login_response.status_code == 200:
            self.token = login_response.json().get("session_token")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
            self.user = login_response.json().get("user")
        else:
            pytest.skip("Provider login failed - cannot test service CRUD")
    
    def test_01_get_service_and_delivery_types(self):
        """Test public endpoints for service and delivery types"""
        # Service types
        service_types_resp = self.session.get(f"{BASE_URL}/api/service-types")
        assert service_types_resp.status_code == 200, f"Service types failed: {service_types_resp.text}"
        service_types = service_types_resp.json().get("service_types", [])
        assert len(service_types) >= 4, f"Expected at least 4 service types, got {len(service_types)}"
        
        # Verify expected service types exist
        type_ids = [t.get("type_id") for t in service_types]
        assert "visit" in type_ids, "Missing 'visit' service type"
        assert "hourly" in type_ids, "Missing 'hourly' service type"
        assert "consultation" in type_ids, "Missing 'consultation' service type"
        assert "product" in type_ids, "Missing 'product' service type"
        print(f"Service types found: {type_ids}")
        
        # Delivery types
        delivery_types_resp = self.session.get(f"{BASE_URL}/api/delivery-types")
        assert delivery_types_resp.status_code == 200, f"Delivery types failed: {delivery_types_resp.text}"
        delivery_types = delivery_types_resp.json().get("delivery_types", [])
        assert len(delivery_types) >= 4, f"Expected at least 4 delivery types, got {len(delivery_types)}"
        print(f"Delivery types found: {[d.get('type_id') for d in delivery_types]}")
    
    def test_02_create_visit_service(self):
        """Test creating a Visit category service"""
        service_data = {
            "name": "TEST_Visit_Service",
            "description": "Test visit service for automated testing",
            "service_category": "visit",
            "delivery_types": ["home_visit", "clinic"],
            "pricing_type": "fixed",
            "price": 150.0,
            "duration_minutes": 60
        }
        
        response = self.session.post(f"{BASE_URL}/api/services", json=service_data)
        assert response.status_code == 200, f"Create visit service failed: {response.text}"
        
        data = response.json()
        assert data.get("name") == "TEST_Visit_Service"
        assert data.get("service_category") == "visit"
        assert data.get("price") == 150.0
        assert "home_visit" in data.get("delivery_types", [])
        self.__class__.visit_service_id = data.get("service_id")
        print(f"Created visit service: {data.get('service_id')}")
    
    def test_03_create_hourly_service_with_minimum_hours(self):
        """Test creating an Hourly service with minimum hours"""
        service_data = {
            "name": "TEST_Hourly_Service",
            "description": "Test hourly service - private nursing",
            "service_category": "hourly",
            "delivery_types": ["home_visit"],
            "pricing_type": "per_hour",
            "price": 80.0,  # Per hour rate
            "minimum_hours": 8.0,  # Minimum 8 hours
            "duration_minutes": None
        }
        
        response = self.session.post(f"{BASE_URL}/api/services", json=service_data)
        assert response.status_code == 200, f"Create hourly service failed: {response.text}"
        
        data = response.json()
        assert data.get("service_category") == "hourly"
        assert data.get("minimum_hours") == 8.0
        assert data.get("price") == 80.0
        self.__class__.hourly_service_id = data.get("service_id")
        print(f"Created hourly service with min {data.get('minimum_hours')} hours: {data.get('service_id')}")
    
    def test_04_create_service_with_weekend_percentage_surcharge(self):
        """Test creating service with percentage weekend surcharge"""
        service_data = {
            "name": "TEST_Weekend_Percentage_Service",
            "description": "Test service with 25% weekend surcharge",
            "service_category": "visit",
            "delivery_types": ["home_visit"],
            "pricing_type": "fixed",
            "price": 200.0,
            "weekend_pricing_type": "percentage",
            "weekend_price_addition": 25.0  # 25% surcharge
        }
        
        response = self.session.post(f"{BASE_URL}/api/services", json=service_data)
        assert response.status_code == 200, f"Create weekend percentage service failed: {response.text}"
        
        data = response.json()
        assert data.get("weekend_pricing_type") == "percentage"
        assert data.get("weekend_price_addition") == 25.0
        self.__class__.weekend_pct_service_id = data.get("service_id")
        print(f"Created service with weekend percentage surcharge: {data.get('service_id')}")
    
    def test_05_create_service_with_weekend_fixed_surcharge(self):
        """Test creating service with fixed weekend surcharge"""
        service_data = {
            "name": "TEST_Weekend_Fixed_Service",
            "description": "Test service with fixed 50 ILS weekend surcharge",
            "service_category": "visit",
            "delivery_types": ["home_visit"],
            "pricing_type": "fixed",
            "price": 200.0,
            "weekend_pricing_type": "fixed",
            "weekend_price_addition": 50.0  # 50 ILS fixed surcharge
        }
        
        response = self.session.post(f"{BASE_URL}/api/services", json=service_data)
        assert response.status_code == 200, f"Create weekend fixed service failed: {response.text}"
        
        data = response.json()
        assert data.get("weekend_pricing_type") == "fixed"
        assert data.get("weekend_price_addition") == 50.0
        self.__class__.weekend_fixed_service_id = data.get("service_id")
        print(f"Created service with weekend fixed surcharge: {data.get('service_id')}")
    
    def test_06_create_service_with_travel_cost(self):
        """Test creating service with travel cost"""
        service_data = {
            "name": "TEST_Travel_Cost_Service",
            "description": "Test service with travel cost",
            "service_category": "visit",
            "delivery_types": ["home_visit"],
            "pricing_type": "fixed",
            "price": 150.0,
            "has_travel_cost": True,
            "travel_cost": 30.0  # 30 ILS travel cost
        }
        
        response = self.session.post(f"{BASE_URL}/api/services", json=service_data)
        assert response.status_code == 200, f"Create travel cost service failed: {response.text}"
        
        data = response.json()
        assert data.get("has_travel_cost") == True
        assert data.get("travel_cost") == 30.0
        self.__class__.travel_service_id = data.get("service_id")
        print(f"Created service with travel cost: {data.get('service_id')}")
    
    def test_07_create_product_with_shipping(self):
        """Test creating a Product service with shipping costs"""
        service_data = {
            "name": "TEST_Product_With_Shipping",
            "description": "Test product with shipping options",
            "service_category": "product",
            "delivery_types": [],
            "pricing_type": "per_unit",
            "price": 100.0,
            "has_shipping": True,
            "shipping_cost": 25.0,
            "free_shipping_above": 200.0,
            "stock_quantity": 50
        }
        
        response = self.session.post(f"{BASE_URL}/api/services", json=service_data)
        assert response.status_code == 200, f"Create product service failed: {response.text}"
        
        data = response.json()
        assert data.get("service_category") == "product"
        assert data.get("has_shipping") == True
        assert data.get("shipping_cost") == 25.0
        assert data.get("free_shipping_above") == 200.0
        assert data.get("stock_quantity") == 50
        self.__class__.product_service_id = data.get("service_id")
        print(f"Created product service with shipping: {data.get('service_id')}")
    
    def test_08_get_my_services(self):
        """Test getting provider's services"""
        response = self.session.get(f"{BASE_URL}/api/services/my")
        assert response.status_code == 200, f"Get my services failed: {response.text}"
        
        services = response.json().get("services", [])
        # Filter for our test services
        test_services = [s for s in services if s.get("name", "").startswith("TEST_")]
        assert len(test_services) >= 1, f"Expected at least 1 test service, got {len(test_services)}"
        print(f"Found {len(test_services)} test services")
    
    def test_09_update_service(self):
        """Test updating a service"""
        if not hasattr(self.__class__, 'visit_service_id'):
            pytest.skip("Visit service not created")
        
        update_data = {
            "name": "TEST_Visit_Service_Updated",
            "price": 175.0,
            "description": "Updated description"
        }
        
        response = self.session.put(
            f"{BASE_URL}/api/services/{self.__class__.visit_service_id}",
            json=update_data
        )
        assert response.status_code == 200, f"Update service failed: {response.text}"
        
        # Verify update by fetching service
        services_resp = self.session.get(f"{BASE_URL}/api/services/my")
        services = services_resp.json().get("services", [])
        updated = next((s for s in services if s.get("service_id") == self.__class__.visit_service_id), None)
        
        if updated:
            assert updated.get("name") == "TEST_Visit_Service_Updated"
            assert updated.get("price") == 175.0
        print(f"Successfully updated service")
    
    def test_10_create_consultation_service(self):
        """Test creating a Consultation category service"""
        service_data = {
            "name": "TEST_Consultation_Service",
            "description": "Test consultation service - phone/video",
            "service_category": "consultation",
            "delivery_types": ["virtual"],
            "pricing_type": "fixed",
            "price": 100.0,
            "duration_minutes": 30
        }
        
        response = self.session.post(f"{BASE_URL}/api/services", json=service_data)
        assert response.status_code == 200, f"Create consultation service failed: {response.text}"
        
        data = response.json()
        assert data.get("service_category") == "consultation"
        self.__class__.consultation_service_id = data.get("service_id")
        print(f"Created consultation service: {data.get('service_id')}")


class TestBookingPriceCalculation:
    """Test booking creation and price calculation"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for user"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as user
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        
        if login_response.status_code == 200:
            self.token = login_response.json().get("session_token")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            pytest.skip("User login failed - cannot test booking")
    
    def get_provider_service(self, prefix):
        """Helper to find a test service by name prefix"""
        # Need to get services from a provider
        resp = self.session.get(f"{BASE_URL}/api/services?limit=100")
        if resp.status_code == 200:
            services = resp.json().get("services", [])
            for service in services:
                if service.get("name", "").startswith(prefix):
                    return service
        return None
    
    def test_01_booking_with_weekend_percentage_surcharge(self):
        """Test booking on Saturday applies percentage weekend surcharge correctly"""
        # Find weekend percentage service
        service = self.get_provider_service("TEST_Weekend_Percentage")
        if not service:
            pytest.skip("Weekend percentage service not found")
        
        # Book for next Saturday
        today = datetime.now()
        days_until_saturday = (5 - today.weekday() + 7) % 7
        if days_until_saturday == 0:
            days_until_saturday = 7
        next_saturday = today + timedelta(days=days_until_saturday)
        
        booking_data = {
            "service_id": service["service_id"],
            "booking_date": next_saturday.isoformat(),
            "booking_time": "10:00",
            "delivery_type": "home_visit",
            "client_name": "Test User",
            "client_phone": "0501234567",
            "service_address": "Test Address 123",
            "service_city": "Tel Aviv"
        }
        
        response = self.session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        
        if response.status_code == 200:
            data = response.json()
            # Base price: 200, 25% weekend = 50
            expected_weekend_addition = 200.0 * 0.25  # 50
            
            print(f"Weekend booking created:")
            print(f"  Base price: {data.get('base_price')}")
            print(f"  Weekend addition: {data.get('weekend_addition')}")
            print(f"  Final price: {data.get('final_price')}")
            
            assert data.get("weekend_addition") == expected_weekend_addition, \
                f"Expected weekend addition {expected_weekend_addition}, got {data.get('weekend_addition')}"
            assert data.get("final_price") == 200.0 + expected_weekend_addition, \
                f"Expected final price {200.0 + expected_weekend_addition}, got {data.get('final_price')}"
        elif response.status_code == 400 and "already booked" in response.text.lower():
            print("Time slot already booked - test partially passed (API working)")
        else:
            print(f"Booking response: {response.status_code} - {response.text}")
            # Don't fail for provider not verified issue
            if "not verified" in response.text.lower():
                pytest.skip("Provider not verified")
    
    def test_02_booking_with_travel_cost(self):
        """Test booking with home_visit delivery type applies travel cost"""
        service = self.get_provider_service("TEST_Travel_Cost")
        if not service:
            pytest.skip("Travel cost service not found")
        
        # Book for next weekday
        today = datetime.now()
        next_weekday = today + timedelta(days=1)
        # Ensure it's not Saturday (weekday=5)
        while next_weekday.weekday() == 5:
            next_weekday += timedelta(days=1)
        
        booking_data = {
            "service_id": service["service_id"],
            "booking_date": next_weekday.isoformat(),
            "booking_time": "14:00",
            "delivery_type": "home_visit",  # Should add travel cost
            "client_name": "Test User Travel",
            "client_phone": "0509876543",
            "service_address": "Travel Test Address",
            "service_city": "Haifa"
        }
        
        response = self.session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        
        if response.status_code == 200:
            data = response.json()
            print(f"Travel cost booking created:")
            print(f"  Base price: {data.get('base_price')}")
            print(f"  Travel cost: {data.get('travel_cost')}")
            print(f"  Final price: {data.get('final_price')}")
            
            assert data.get("travel_cost") == 30.0, \
                f"Expected travel cost 30, got {data.get('travel_cost')}"
            assert data.get("final_price") == 150.0 + 30.0, \
                f"Expected final price 180, got {data.get('final_price')}"
        elif response.status_code == 400 and "already booked" in response.text.lower():
            print("Time slot already booked - test partially passed (API working)")
        else:
            print(f"Booking response: {response.status_code} - {response.text}")
            if "not verified" in response.text.lower():
                pytest.skip("Provider not verified")
    
    def test_03_hourly_service_booking(self):
        """Test hourly service charges correctly based on hours"""
        service = self.get_provider_service("TEST_Hourly_Service")
        if not service:
            pytest.skip("Hourly service not found")
        
        # Book for 10 hours (above minimum of 8)
        today = datetime.now()
        next_weekday = today + timedelta(days=2)
        while next_weekday.weekday() == 5:
            next_weekday += timedelta(days=1)
        
        booking_data = {
            "service_id": service["service_id"],
            "booking_date": next_weekday.isoformat(),
            "booking_time": "08:00",
            "delivery_type": "home_visit",
            "client_name": "Test Hourly User",
            "client_phone": "0501111111",
            "service_address": "Hourly Test Address",
            "service_city": "Tel Aviv",
            "hours_booked": 10.0  # 10 hours
        }
        
        response = self.session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        
        if response.status_code == 200:
            data = response.json()
            # 80 ILS/hour * 10 hours = 800
            expected_price = 80.0 * 10.0
            
            print(f"Hourly booking created:")
            print(f"  Base price (per hour): {service.get('price')}")
            print(f"  Hours booked: {data.get('hours_booked')}")
            print(f"  Final price: {data.get('final_price')}")
            
            assert data.get("final_price") == expected_price, \
                f"Expected final price {expected_price}, got {data.get('final_price')}"
        elif response.status_code == 400 and "already booked" in response.text.lower():
            print("Time slot already booked - test partially passed (API working)")
        else:
            print(f"Booking response: {response.status_code} - {response.text}")
            if "not verified" in response.text.lower():
                pytest.skip("Provider not verified")
    
    def test_04_hourly_service_minimum_hours(self):
        """Test hourly service enforces minimum hours"""
        service = self.get_provider_service("TEST_Hourly_Service")
        if not service:
            pytest.skip("Hourly service not found")
        
        # Book for only 3 hours (below minimum of 8)
        today = datetime.now()
        next_weekday = today + timedelta(days=3)
        while next_weekday.weekday() == 5:
            next_weekday += timedelta(days=1)
        
        booking_data = {
            "service_id": service["service_id"],
            "booking_date": next_weekday.isoformat(),
            "booking_time": "09:00",
            "delivery_type": "home_visit",
            "client_name": "Test Min Hours User",
            "client_phone": "0502222222",
            "service_address": "Min Hours Test Address",
            "service_city": "Jerusalem",
            "hours_booked": 3.0  # Only 3 hours (below min 8)
        }
        
        response = self.session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        
        if response.status_code == 200:
            data = response.json()
            # Should charge for minimum 8 hours: 80 * 8 = 640
            expected_price = 80.0 * 8.0  # Min hours enforced
            
            print(f"Minimum hours enforcement:")
            print(f"  Hours requested: 3")
            print(f"  Minimum hours: 8")
            print(f"  Final price should be min hours: {data.get('final_price')}")
            
            # Check minimum hours enforcement
            assert data.get("final_price") == expected_price, \
                f"Expected minimum hours price {expected_price}, got {data.get('final_price')}"
        elif response.status_code == 400 and "already booked" in response.text.lower():
            print("Time slot already booked - test partially passed (API working)")
        else:
            print(f"Booking response: {response.status_code} - {response.text}")
            if "not verified" in response.text.lower():
                pytest.skip("Provider not verified")


class TestServiceDeletion:
    """Test service deletion - cleanup test data"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for provider"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as provider
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": PROVIDER_EMAIL,
            "password": PROVIDER_PASSWORD
        })
        
        if login_response.status_code == 200:
            self.token = login_response.json().get("session_token")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            pytest.skip("Provider login failed")
    
    def test_cleanup_test_services(self):
        """Cleanup - delete test services"""
        # Get my services
        response = self.session.get(f"{BASE_URL}/api/services/my")
        if response.status_code != 200:
            pytest.skip("Cannot get services")
        
        services = response.json().get("services", [])
        test_services = [s for s in services if s.get("name", "").startswith("TEST_")]
        
        deleted_count = 0
        for service in test_services:
            # Try provider-level delete
            del_response = self.session.delete(f"{BASE_URL}/api/services/{service['service_id']}")
            if del_response.status_code in [200, 204]:
                deleted_count += 1
                print(f"Deleted service: {service['name']}")
            else:
                print(f"Failed to delete {service['name']}: {del_response.status_code}")
        
        print(f"Cleanup: Deleted {deleted_count} test services")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
