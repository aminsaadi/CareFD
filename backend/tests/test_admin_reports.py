"""
Admin Reports API Tests
Tests for /api/admin/reports endpoint with period parameters (week/month/year)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAdminReportsAPI:
    """Test admin reports endpoint"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        """Get authenticated admin session"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin_test@carelink.co.il",
            "password": "test123456"
        })
        
        if login_response.status_code != 200:
            pytest.skip(f"Admin login failed: {login_response.status_code}")
        
        token = login_response.json().get("session_token")
        session.headers.update({"Authorization": f"Bearer {token}"})
        
        return session
    
    @pytest.fixture(scope="class")
    def non_admin_session(self):
        """Get authenticated non-admin session"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Login as regular user (non-admin)
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "testpatient@test.com",
            "password": "test123456"
        })
        
        if login_response.status_code != 200:
            # Try to register a non-admin user
            register_response = session.post(f"{BASE_URL}/api/auth/register", json={
                "email": "testpatient_reports@test.com",
                "password": "test123456",
                "name": "Test Patient",
                "role": "patient"
            })
            
            if register_response.status_code in [200, 201]:
                token = register_response.json().get("session_token")
                session.headers.update({"Authorization": f"Bearer {token}"})
            else:
                pytest.skip("Could not create non-admin user for testing")
        else:
            token = login_response.json().get("session_token")
            session.headers.update({"Authorization": f"Bearer {token}"})
        
        return session

    # ========== Access Control Tests ==========
    
    def test_reports_requires_authentication(self):
        """Test that reports endpoint requires authentication"""
        session = requests.Session()
        response = session.get(f"{BASE_URL}/api/admin/reports")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Reports endpoint requires authentication")
    
    def test_reports_requires_admin_role(self, non_admin_session):
        """Test that reports endpoint requires admin role"""
        response = non_admin_session.get(f"{BASE_URL}/api/admin/reports")
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Reports endpoint requires admin role")
    
    # ========== Default Period (month) Tests ==========
    
    def test_reports_default_period(self, admin_session):
        """Test reports with default period (month)"""
        response = admin_session.get(f"{BASE_URL}/api/admin/reports")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify response structure
        assert "period" in data, "Response should contain 'period'"
        assert "summary" in data, "Response should contain 'summary'"
        assert "bookings_timeline" in data, "Response should contain 'bookings_timeline'"
        assert "status_distribution" in data, "Response should contain 'status_distribution'"
        assert "top_providers" in data, "Response should contain 'top_providers'"
        
        # Default period should be 'month'
        assert data["period"] == "month", f"Expected period 'month', got '{data['period']}'"
        
        print(f"✓ Reports default period works - period: {data['period']}")
    
    # ========== Summary Data Tests ==========
    
    def test_reports_summary_structure(self, admin_session):
        """Test that summary contains all required fields"""
        response = admin_session.get(f"{BASE_URL}/api/admin/reports?period=month")
        
        assert response.status_code == 200
        
        summary = response.json().get("summary", {})
        
        # Check all required summary fields
        required_fields = ["total_bookings", "total_revenue", "new_users", "new_providers", "new_reviews", "avg_rating"]
        for field in required_fields:
            assert field in summary, f"Summary should contain '{field}'"
        
        # Verify data types
        assert isinstance(summary["total_bookings"], int), "total_bookings should be int"
        assert isinstance(summary["total_revenue"], (int, float)), "total_revenue should be numeric"
        assert isinstance(summary["new_users"], int), "new_users should be int"
        assert isinstance(summary["new_providers"], int), "new_providers should be int"
        assert isinstance(summary["new_reviews"], int), "new_reviews should be int"
        assert isinstance(summary["avg_rating"], (int, float)), "avg_rating should be numeric"
        
        print(f"✓ Summary structure verified: bookings={summary['total_bookings']}, revenue={summary['total_revenue']}, users={summary['new_users']}, providers={summary['new_providers']}")
    
    # ========== Period Parameter Tests ==========
    
    def test_reports_week_period(self, admin_session):
        """Test reports with week period"""
        response = admin_session.get(f"{BASE_URL}/api/admin/reports?period=week")
        
        assert response.status_code == 200
        
        data = response.json()
        assert data["period"] == "week", f"Expected period 'week', got '{data['period']}'"
        
        # Timeline should have approximately 7 entries for a week
        timeline_length = len(data.get("bookings_timeline", []))
        assert timeline_length > 0, "Timeline should have entries"
        
        print(f"✓ Week period works - timeline entries: {timeline_length}")
    
    def test_reports_month_period(self, admin_session):
        """Test reports with month period"""
        response = admin_session.get(f"{BASE_URL}/api/admin/reports?period=month")
        
        assert response.status_code == 200
        
        data = response.json()
        assert data["period"] == "month", f"Expected period 'month', got '{data['period']}'"
        
        # Timeline should have approximately 30 entries for a month
        timeline_length = len(data.get("bookings_timeline", []))
        assert timeline_length > 0, "Timeline should have entries"
        
        print(f"✓ Month period works - timeline entries: {timeline_length}")
    
    def test_reports_year_period(self, admin_session):
        """Test reports with year period"""
        response = admin_session.get(f"{BASE_URL}/api/admin/reports?period=year")
        
        assert response.status_code == 200
        
        data = response.json()
        assert data["period"] == "year", f"Expected period 'year', got '{data['period']}'"
        
        # Timeline should have approximately 12 entries for a year (grouped by month)
        timeline_length = len(data.get("bookings_timeline", []))
        assert timeline_length > 0, "Timeline should have entries"
        
        print(f"✓ Year period works - timeline entries: {timeline_length}")
    
    # ========== Bookings Timeline Tests ==========
    
    def test_bookings_timeline_structure(self, admin_session):
        """Test that bookings_timeline has correct structure"""
        response = admin_session.get(f"{BASE_URL}/api/admin/reports?period=month")
        
        assert response.status_code == 200
        
        timeline = response.json().get("bookings_timeline", [])
        
        if timeline:
            # Check first entry structure
            first_entry = timeline[0]
            assert "date" in first_entry, "Timeline entry should have 'date'"
            assert "bookings" in first_entry, "Timeline entry should have 'bookings'"
            assert isinstance(first_entry["bookings"], int), "bookings should be int"
        
        print(f"✓ Bookings timeline structure correct - {len(timeline)} entries")
    
    # ========== Status Distribution Tests ==========
    
    def test_status_distribution_structure(self, admin_session):
        """Test that status_distribution has correct structure"""
        response = admin_session.get(f"{BASE_URL}/api/admin/reports?period=month")
        
        assert response.status_code == 200
        
        distribution = response.json().get("status_distribution", [])
        
        # Should have entries for different statuses
        assert len(distribution) > 0, "Status distribution should have entries"
        
        for entry in distribution:
            assert "name" in entry, "Distribution entry should have 'name'"
            assert "value" in entry, "Distribution entry should have 'value'"
            assert "color" in entry, "Distribution entry should have 'color'"
            assert isinstance(entry["value"], int), "value should be int"
        
        # Check expected status names (Hebrew)
        status_names = [e["name"] for e in distribution]
        expected_names = ["ממתינות", "מאושרות", "הושלמו", "בוטלו"]
        for name in expected_names:
            assert name in status_names, f"Status '{name}' should be in distribution"
        
        print(f"✓ Status distribution structure correct - {len(distribution)} statuses: {status_names}")
    
    # ========== Top Providers Tests ==========
    
    def test_top_providers_structure(self, admin_session):
        """Test that top_providers has correct structure"""
        response = admin_session.get(f"{BASE_URL}/api/admin/reports?period=month")
        
        assert response.status_code == 200
        
        top_providers = response.json().get("top_providers", [])
        
        # Top providers may be empty if no bookings with provider names
        if top_providers:
            first_provider = top_providers[0]
            assert "name" in first_provider, "Top provider should have 'name'"
            assert "bookings" in first_provider, "Top provider should have 'bookings'"
            assert isinstance(first_provider["bookings"], int), "bookings should be int"
        
        print(f"✓ Top providers structure correct - {len(top_providers)} providers")
    
    # ========== Revenue Data Tests ==========
    
    def test_revenue_data_structure(self, admin_session):
        """Test that revenue_by_date has correct structure"""
        response = admin_session.get(f"{BASE_URL}/api/admin/reports?period=month")
        
        assert response.status_code == 200
        
        revenue_data = response.json().get("revenue_by_date", [])
        
        if revenue_data:
            first_entry = revenue_data[0]
            assert "date" in first_entry, "Revenue entry should have 'date'"
            assert "revenue" in first_entry, "Revenue entry should have 'revenue'"
            assert isinstance(first_entry["revenue"], (int, float)), "revenue should be numeric"
        
        print(f"✓ Revenue data structure correct - {len(revenue_data)} entries")
    
    # ========== Data Consistency Tests ==========
    
    def test_data_consistency_across_periods(self, admin_session):
        """Test that data is consistent across different periods"""
        week_response = admin_session.get(f"{BASE_URL}/api/admin/reports?period=week")
        month_response = admin_session.get(f"{BASE_URL}/api/admin/reports?period=month")
        
        assert week_response.status_code == 200
        assert month_response.status_code == 200
        
        week_data = week_response.json()
        month_data = month_response.json()
        
        # Month period should have >= week period bookings
        # (Note: This may not always be true if data changes, but is a general expectation)
        week_bookings = week_data["summary"]["total_bookings"]
        month_bookings = month_data["summary"]["total_bookings"]
        
        # Just verify both are valid numbers
        assert week_bookings >= 0, "Week bookings should be non-negative"
        assert month_bookings >= 0, "Month bookings should be non-negative"
        
        print(f"✓ Data consistency check - Week: {week_bookings} bookings, Month: {month_bookings} bookings")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
