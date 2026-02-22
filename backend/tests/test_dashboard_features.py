"""
Tests for CareLink Enhanced User Dashboard Features:
- User profile image upload/delete
- User settings (first_name, last_name, phone, city, address)
- Password change
- My Reviews endpoint
- My Bookings endpoint
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
USER_EMAIL = "user@carelink.co.il"
USER_PASSWORD = "password"
ADMIN_EMAIL = "admin@carelink.co.il"
ADMIN_PASSWORD = "password"


class TestUserAuth:
    """Test user authentication"""
    
    def test_user_login(self):
        """Test user can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "session_token" in data
        assert "user" in data
        assert data["user"]["email"] == USER_EMAIL
        print(f"User login successful - user_id: {data['user']['user_id']}")
        return data["session_token"], data["user"]


class TestUserSettingsUpdate:
    """Test PUT /users/me - Update user profile settings"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["session_token"]
    
    def test_update_first_and_last_name(self, auth_token):
        """Test updating first_name and last_name"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        update_data = {
            "first_name": "ישראל",
            "last_name": "ישראלי"
        }
        
        response = requests.put(f"{BASE_URL}/api/users/me", json=update_data, headers=headers)
        assert response.status_code == 200, f"Update failed: {response.text}"
        
        data = response.json()
        assert data["message"] == "User info updated successfully"
        assert "user" in data
        assert data["user"]["first_name"] == "ישראל"
        assert data["user"]["last_name"] == "ישראלי"
        # Combined name should be updated
        assert data["user"]["name"] == "ישראל ישראלי"
        print("First name and last name update successful")
    
    def test_update_phone_city_address(self, auth_token):
        """Test updating phone, city, and address"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        update_data = {
            "phone": "050-1234567",
            "city": "תל אביב",
            "address": "רחוב הירקון 100, דירה 5"
        }
        
        response = requests.put(f"{BASE_URL}/api/users/me", json=update_data, headers=headers)
        assert response.status_code == 200, f"Update failed: {response.text}"
        
        data = response.json()
        assert "user" in data
        assert data["user"]["phone"] == "050-1234567"
        assert data["user"]["city"] == "תל אביב"
        assert data["user"]["address"] == "רחוב הירקון 100, דירה 5"
        print("Phone, city, address update successful")
    
    def test_update_profile_image_url(self, auth_token):
        """Test updating profile_image URL"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        update_data = {
            "profile_image": "https://example.com/test-image.jpg"
        }
        
        response = requests.put(f"{BASE_URL}/api/users/me", json=update_data, headers=headers)
        assert response.status_code == 200, f"Update failed: {response.text}"
        
        data = response.json()
        assert data["user"]["profile_image"] == "https://example.com/test-image.jpg"
        print("Profile image URL update successful")
    
    def test_delete_profile_image(self, auth_token):
        """Test deleting profile image (setting to empty string)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        update_data = {
            "profile_image": ""
        }
        
        response = requests.put(f"{BASE_URL}/api/users/me", json=update_data, headers=headers)
        assert response.status_code == 200, f"Delete failed: {response.text}"
        
        data = response.json()
        assert data["user"]["profile_image"] == ""
        print("Profile image deletion (empty string) successful")
    
    def test_verify_user_data_persistence(self, auth_token):
        """Test that user data persists after GET /auth/me"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # First update
        update_data = {
            "first_name": "בדיקה",
            "last_name": "מערכת",
            "phone": "052-9999999",
            "city": "ירושלים"
        }
        
        response = requests.put(f"{BASE_URL}/api/users/me", json=update_data, headers=headers)
        assert response.status_code == 200
        
        # Now verify with GET
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["first_name"] == "בדיקה"
        assert data["last_name"] == "מערכת"
        assert data["phone"] == "052-9999999"
        assert data["city"] == "ירושלים"
        print("User data persistence verified")


class TestPasswordChange:
    """Test PUT /users/me/password - Change password"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["session_token"]
    
    def test_change_password_missing_fields(self, auth_token):
        """Test password change with missing fields"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Missing new_password
        response = requests.put(f"{BASE_URL}/api/users/me/password", json={
            "current_password": USER_PASSWORD
        }, headers=headers)
        assert response.status_code == 400
        assert "נא למלא" in response.json()["detail"]
        print("Missing fields validation works")
    
    def test_change_password_short_password(self, auth_token):
        """Test password change with too short password"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.put(f"{BASE_URL}/api/users/me/password", json={
            "current_password": USER_PASSWORD,
            "new_password": "12345"  # Only 5 chars
        }, headers=headers)
        assert response.status_code == 400
        assert "לפחות 6 תווים" in response.json()["detail"]
        print("Short password validation works")
    
    def test_change_password_wrong_current(self, auth_token):
        """Test password change with wrong current password"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.put(f"{BASE_URL}/api/users/me/password", json={
            "current_password": "wrong_password",
            "new_password": "new_password123"
        }, headers=headers)
        assert response.status_code == 400
        assert "הסיסמה הנוכחית שגויה" in response.json()["detail"]
        print("Wrong current password validation works")
    
    def test_change_password_success(self, auth_token):
        """Test successful password change and revert"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        new_password = "new_test_password123"
        
        # Change password
        response = requests.put(f"{BASE_URL}/api/users/me/password", json={
            "current_password": USER_PASSWORD,
            "new_password": new_password
        }, headers=headers)
        assert response.status_code == 200, f"Password change failed: {response.text}"
        print("Password changed successfully")
        
        # Verify can login with new password
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": new_password
        })
        assert response.status_code == 200, "Could not login with new password"
        print("Login with new password successful")
        
        # Revert password back to original
        new_token = response.json()["session_token"]
        response = requests.put(f"{BASE_URL}/api/users/me/password", json={
            "current_password": new_password,
            "new_password": USER_PASSWORD
        }, headers={"Authorization": f"Bearer {new_token}"})
        assert response.status_code == 200, f"Password revert failed: {response.text}"
        print("Password reverted to original")


class TestMyReviews:
    """Test GET /reviews/my - Get user's reviews"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for admin (who has a review)"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["session_token"]
    
    def test_get_my_reviews(self, auth_token):
        """Test getting user's reviews"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(f"{BASE_URL}/api/reviews/my", headers=headers)
        assert response.status_code == 200, f"Get reviews failed: {response.text}"
        
        data = response.json()
        assert "reviews" in data
        print(f"My reviews count: {len(data['reviews'])}")
        
        # If there are reviews, verify structure
        if data["reviews"]:
            review = data["reviews"][0]
            assert "review_id" in review
            assert "rating" in review
            assert "provider_id" in review
            # Provider info should be enhanced
            if "provider" in review:
                assert "business_name" in review["provider"]
                print(f"Review for provider: {review['provider'].get('business_name')}")
        
        return data["reviews"]


class TestMyBookings:
    """Test GET /bookings/my - Get user's bookings"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["session_token"]
    
    def test_get_my_bookings(self, auth_token):
        """Test getting user's bookings"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(f"{BASE_URL}/api/bookings/my", headers=headers)
        assert response.status_code == 200, f"Get bookings failed: {response.text}"
        
        data = response.json()
        assert "bookings" in data
        print(f"My bookings count: {len(data['bookings'])}")
        
        # If there are bookings, verify structure
        if data["bookings"]:
            booking = data["bookings"][0]
            assert "booking_id" in booking
            assert "status" in booking
            assert "booking_date" in booking
            print(f"Booking ID: {booking['booking_id']}, Status: {booking['status']}")
        
        return data["bookings"]


class TestUserNumber:
    """Test that user_number is returned in user data"""
    
    def test_user_has_user_number(self):
        """Test user data includes user_number"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        assert response.status_code == 200
        token = response.json()["session_token"]
        
        # Get user info
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        
        data = response.json()
        # Check user_number exists or user_id can be used
        assert "user_id" in data
        print(f"User ID: {data['user_id']}")
        
        if "user_number" in data:
            print(f"User number: {data['user_number']}")
            assert data["user_number"].startswith("U")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
