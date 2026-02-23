"""
Test Enhanced Provider Profile Features
- Profile picture upload
- New provider fields: gender, years_experience, about, expertise
- Languages, target_audience, service_areas
- Shift-based availability (morning, afternoon, evening, night)
- Filter options API
"""

import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://carelink-preview-2.preview.emergentagent.com"

TEST_EMAIL = "enhanced_profile_test@carelink.co.il"
TEST_PASSWORD = "testpass123"

class TestEnhancedProviderProfile:
    """Tests for the enhanced provider profile feature"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test user and provider"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Try to login or register
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        if login_response.status_code == 200:
            data = login_response.json()
            self.token = data.get("session_token")
            self.user_id = data.get("user", {}).get("user_id")
        else:
            # Register new user
            register_response = self.session.post(
                f"{BASE_URL}/api/auth/register",
                json={
                    "email": TEST_EMAIL,
                    "password": TEST_PASSWORD,
                    "name": "Enhanced Profile Tester",
                    "role": "provider"
                }
            )
            if register_response.status_code in [200, 201]:
                data = register_response.json()
                self.token = data.get("session_token")
                self.user_id = data.get("user", {}).get("user_id")
            else:
                pytest.skip("Could not create test user")
        
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        
        # Check if provider exists or create one
        provider_response = self.session.get(f"{BASE_URL}/api/providers/me")
        if provider_response.status_code == 200:
            self.provider_id = provider_response.json().get("provider_id")
        else:
            # Create provider
            create_response = self.session.post(
                f"{BASE_URL}/api/providers",
                json={
                    "user_id": self.user_id,
                    "provider_type": "individual",
                    "business_name": "TEST_Enhanced_Profile_Provider"
                }
            )
            if create_response.status_code in [200, 201]:
                self.provider_id = create_response.json().get("provider_id")
            else:
                pytest.skip("Could not create test provider")
    
    # ==================== FILTER OPTIONS API ====================
    
    def test_filter_options_returns_shift_options(self):
        """Test that filter options includes shift_options"""
        response = self.session.get(f"{BASE_URL}/api/providers/filters/options")
        assert response.status_code == 200
        data = response.json()
        
        assert "shift_options" in data, "shift_options missing from filter options"
        shift_options = data["shift_options"]
        
        # Check all shifts exist
        expected_shifts = ["morning", "afternoon", "evening", "night"]
        actual_shifts = [s["value"] for s in shift_options]
        assert all(s in actual_shifts for s in expected_shifts), f"Missing shifts: {set(expected_shifts) - set(actual_shifts)}"
        
        # Verify shift has required fields
        for shift in shift_options:
            assert "value" in shift
            assert "label" in shift
            assert "label_en" in shift
            assert "default_start" in shift
            assert "default_end" in shift
    
    def test_filter_options_returns_days_of_week(self):
        """Test that filter options includes days_of_week"""
        response = self.session.get(f"{BASE_URL}/api/providers/filters/options")
        assert response.status_code == 200
        data = response.json()
        
        assert "days_of_week" in data, "days_of_week missing from filter options"
        days = data["days_of_week"]
        
        # Check all days exist
        expected_days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
        actual_days = [d["value"] for d in days]
        assert all(d in actual_days for d in expected_days), "Missing days of week"
    
    def test_filter_options_returns_gender_options(self):
        """Test that filter options includes gender_options"""
        response = self.session.get(f"{BASE_URL}/api/providers/filters/options")
        assert response.status_code == 200
        data = response.json()
        
        assert "gender_options" in data, "gender_options missing from filter options"
        genders = data["gender_options"]
        
        expected_genders = ["male", "female", "other"]
        actual_genders = [g["value"] for g in genders]
        assert all(g in actual_genders for g in expected_genders), "Missing gender options"
    
    def test_filter_options_returns_language_options(self):
        """Test that filter options includes language_options"""
        response = self.session.get(f"{BASE_URL}/api/providers/filters/options")
        assert response.status_code == 200
        data = response.json()
        
        assert "language_options" in data, "language_options missing from filter options"
        languages = data["language_options"]
        
        # Check some expected languages
        expected_langs = ["hebrew", "arabic", "english", "russian"]
        actual_langs = [l["value"] for l in languages]
        assert all(l in actual_langs for l in expected_langs), "Missing language options"
    
    def test_filter_options_returns_target_audience_options(self):
        """Test that filter options includes target_audience_options"""
        response = self.session.get(f"{BASE_URL}/api/providers/filters/options")
        assert response.status_code == 200
        data = response.json()
        
        assert "target_audience_options" in data, "target_audience_options missing from filter options"
        audiences = data["target_audience_options"]
        
        # Check expected audiences
        expected_audiences = ["adults", "children", "elderly", "babies"]
        actual_audiences = [a["value"] for a in audiences]
        assert all(a in actual_audiences for a in expected_audiences), "Missing target audience options"
    
    # ==================== IMAGE UPLOAD API ====================
    
    def test_image_upload_success(self):
        """Test uploading a valid image"""
        # Create a small test PNG image
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {"file": ("test.png", io.BytesIO(png_data), "image/png")}
        headers = {"Authorization": f"Bearer {self.token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/upload/image",
            files=files,
            headers=headers
        )
        
        assert response.status_code == 200, f"Image upload failed: {response.text}"
        data = response.json()
        
        assert "url" in data
        assert "filename" in data
        assert data["filename"].startswith("img_")
        assert data["url"].endswith(".png")
    
    def test_image_upload_rejects_non_image(self):
        """Test that non-image files are rejected"""
        pdf_data = b'%PDF-1.4 fake pdf content'
        
        files = {"file": ("test.pdf", io.BytesIO(pdf_data), "application/pdf")}
        headers = {"Authorization": f"Bearer {self.token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/upload/image",
            files=files,
            headers=headers
        )
        
        assert response.status_code == 400
        assert "Only image files are allowed" in response.json().get("detail", "")
    
    def test_image_upload_requires_auth(self):
        """Test that image upload requires authentication"""
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde'
        
        files = {"file": ("test.png", io.BytesIO(png_data), "image/png")}
        
        response = requests.post(
            f"{BASE_URL}/api/upload/image",
            files=files
            # No auth header
        )
        
        assert response.status_code == 401
    
    # ==================== PROVIDER UPDATE WITH NEW FIELDS ====================
    
    def test_update_provider_gender(self):
        """Test updating provider gender"""
        response = self.session.put(
            f"{BASE_URL}/api/providers/{self.provider_id}",
            json={"gender": "male"}
        )
        assert response.status_code == 200
        
        # Verify update
        get_response = self.session.get(f"{BASE_URL}/api/providers/{self.provider_id}")
        assert get_response.status_code == 200
        assert get_response.json()["gender"] == "male"
    
    def test_update_provider_years_experience(self):
        """Test updating provider years_experience"""
        response = self.session.put(
            f"{BASE_URL}/api/providers/{self.provider_id}",
            json={"years_experience": 15}
        )
        assert response.status_code == 200
        
        # Verify update
        get_response = self.session.get(f"{BASE_URL}/api/providers/{self.provider_id}")
        assert get_response.status_code == 200
        assert get_response.json()["years_experience"] == 15
    
    def test_update_provider_about(self):
        """Test updating provider about section"""
        about_text = "רופא משפחה מנוסה עם התמחות בטיפול בקשישים ובילדים"
        
        response = self.session.put(
            f"{BASE_URL}/api/providers/{self.provider_id}",
            json={"about": about_text}
        )
        assert response.status_code == 200
        
        # Verify update
        get_response = self.session.get(f"{BASE_URL}/api/providers/{self.provider_id}")
        assert get_response.status_code == 200
        assert get_response.json()["about"] == about_text
    
    def test_update_provider_expertise(self):
        """Test updating provider expertise list"""
        expertise = ["טיפול בכאבי גב", "שיקום ספורטאים", "פיזיותרפיה ילדים"]
        
        response = self.session.put(
            f"{BASE_URL}/api/providers/{self.provider_id}",
            json={"expertise": expertise}
        )
        assert response.status_code == 200
        
        # Verify update
        get_response = self.session.get(f"{BASE_URL}/api/providers/{self.provider_id}")
        assert get_response.status_code == 200
        assert get_response.json()["expertise"] == expertise
    
    def test_update_provider_languages(self):
        """Test updating provider languages"""
        languages = ["hebrew", "english", "arabic"]
        
        response = self.session.put(
            f"{BASE_URL}/api/providers/{self.provider_id}",
            json={"languages": languages}
        )
        assert response.status_code == 200
        
        # Verify update
        get_response = self.session.get(f"{BASE_URL}/api/providers/{self.provider_id}")
        assert get_response.status_code == 200
        assert get_response.json()["languages"] == languages
    
    def test_update_provider_target_audience(self):
        """Test updating provider target_audience"""
        audience = ["adults", "elderly", "children"]
        
        response = self.session.put(
            f"{BASE_URL}/api/providers/{self.provider_id}",
            json={"target_audience": audience}
        )
        assert response.status_code == 200
        
        # Verify update
        get_response = self.session.get(f"{BASE_URL}/api/providers/{self.provider_id}")
        assert get_response.status_code == 200
        assert get_response.json()["target_audience"] == audience
    
    def test_update_provider_service_areas(self):
        """Test updating provider service_areas"""
        areas = ["תל אביב", "רמת גן", "חולון", "בני ברק"]
        
        response = self.session.put(
            f"{BASE_URL}/api/providers/{self.provider_id}",
            json={"service_areas": areas}
        )
        assert response.status_code == 200
        
        # Verify update
        get_response = self.session.get(f"{BASE_URL}/api/providers/{self.provider_id}")
        assert get_response.status_code == 200
        assert get_response.json()["service_areas"] == areas
    
    # ==================== SHIFT-BASED AVAILABILITY ====================
    
    def test_update_provider_availability_shift_based(self):
        """Test updating provider with shift-based availability"""
        availability = [
            {"day": "sunday", "shift": "morning", "is_available": True},
            {"day": "sunday", "shift": "afternoon", "is_available": True},
            {"day": "monday", "shift": "morning", "is_available": True},
            {"day": "monday", "shift": "evening", "is_available": True},
            {"day": "wednesday", "shift": "night", "is_available": True}
        ]
        
        response = self.session.put(
            f"{BASE_URL}/api/providers/{self.provider_id}",
            json={"availability": availability}
        )
        assert response.status_code == 200
        
        # Verify update
        get_response = self.session.get(f"{BASE_URL}/api/providers/{self.provider_id}")
        assert get_response.status_code == 200
        
        saved_availability = get_response.json()["availability"]
        assert len(saved_availability) == 5
        
        # Verify structure
        for slot in saved_availability:
            assert "day" in slot
            assert "shift" in slot
            assert "is_available" in slot
            assert slot["shift"] in ["morning", "afternoon", "evening", "night"]
    
    def test_availability_all_shifts_all_days(self):
        """Test provider can have availability for all shifts on all days"""
        availability = []
        days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
        shifts = ["morning", "afternoon", "evening", "night"]
        
        for day in days:
            for shift in shifts:
                availability.append({
                    "day": day,
                    "shift": shift,
                    "is_available": True
                })
        
        response = self.session.put(
            f"{BASE_URL}/api/providers/{self.provider_id}",
            json={"availability": availability}
        )
        assert response.status_code == 200
        
        # Verify - should have 28 slots (7 days x 4 shifts)
        get_response = self.session.get(f"{BASE_URL}/api/providers/{self.provider_id}")
        assert get_response.status_code == 200
        assert len(get_response.json()["availability"]) == 28
    
    def test_update_provider_profile_image(self):
        """Test updating provider profile_image URL"""
        image_url = "https://example.com/test-profile.jpg"
        
        response = self.session.put(
            f"{BASE_URL}/api/providers/{self.provider_id}",
            json={"profile_image": image_url}
        )
        assert response.status_code == 200
        
        # Verify update
        get_response = self.session.get(f"{BASE_URL}/api/providers/{self.provider_id}")
        assert get_response.status_code == 200
        assert get_response.json()["profile_image"] == image_url
    
    # ==================== COMPREHENSIVE UPDATE TEST ====================
    
    def test_update_all_new_fields_at_once(self):
        """Test updating all new provider fields in single request"""
        update_data = {
            "gender": "female",
            "years_experience": 20,
            "about": "פיזיותרפיסטית מנוסה בשיקום ספורטאים",
            "expertise": ["שיקום ברכיים", "שיקום כתפיים"],
            "languages": ["hebrew", "russian"],
            "target_audience": ["adults", "youth"],
            "service_areas": ["ירושלים", "בית שמש"],
            "availability": [
                {"day": "sunday", "shift": "morning", "is_available": True},
                {"day": "tuesday", "shift": "afternoon", "is_available": True}
            ],
            "profile_image": "https://test.com/profile.jpg"
        }
        
        response = self.session.put(
            f"{BASE_URL}/api/providers/{self.provider_id}",
            json=update_data
        )
        assert response.status_code == 200
        
        # Verify all fields
        get_response = self.session.get(f"{BASE_URL}/api/providers/{self.provider_id}")
        assert get_response.status_code == 200
        data = get_response.json()
        
        assert data["gender"] == "female"
        assert data["years_experience"] == 20
        assert data["about"] == update_data["about"]
        assert data["expertise"] == update_data["expertise"]
        assert data["languages"] == update_data["languages"]
        assert data["target_audience"] == update_data["target_audience"]
        assert data["service_areas"] == update_data["service_areas"]
        assert len(data["availability"]) == 2
        assert data["profile_image"] == update_data["profile_image"]
    
    # ==================== EXISTING PROVIDER DATA TEST ====================
    
    def test_existing_provider_has_new_fields(self):
        """Test that existing provider (provider_5a752c10c582) has years_experience field"""
        response = self.session.get(f"{BASE_URL}/api/providers/provider_5a752c10c582")
        
        # Skip if provider doesn't exist
        if response.status_code != 200:
            pytest.skip("Test provider provider_5a752c10c582 not found")
        
        data = response.json()
        
        # Check years_experience exists and has expected value
        assert "years_experience" in data, "years_experience field missing"
        assert data["years_experience"] == 15, f"Expected 15 years, got {data['years_experience']}"
        
        # Verify availability structure
        assert "availability" in data, "availability field missing"
        # Note: Old providers may have empty availability - that's okay


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
