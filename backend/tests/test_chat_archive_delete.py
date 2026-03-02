"""
Test Suite: Chat Room Archive, Unarchive, and Delete Functionality
Tests the new archive and delete features for chat rooms in CareLink
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
USER_EMAIL = "saadiameen@gmail.com"
USER_PASSWORD = "password"
PROVIDER_EMAIL = "provider@carelink.co.il"
PROVIDER_PASSWORD = "password"


class TestChatRoomBasics:
    """Basic chat room listing and access tests"""
    
    @pytest.fixture(scope="class")
    def user_token(self):
        """Get user auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": USER_EMAIL, "password": USER_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json().get("session_token")
    
    @pytest.fixture(scope="class")
    def provider_token(self):
        """Get provider auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": PROVIDER_EMAIL, "password": PROVIDER_PASSWORD}
        )
        assert response.status_code == 200, f"Provider login failed: {response.text}"
        return response.json().get("session_token")
    
    def test_get_active_chat_rooms(self, user_token):
        """GET /api/chat/rooms returns active (non-archived, non-deleted) rooms"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.get(f"{BASE_URL}/api/chat/rooms", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "rooms" in data
        assert isinstance(data["rooms"], list)
        print(f"Found {len(data['rooms'])} active chat rooms")
        
        # Store room info for later tests
        if data["rooms"]:
            pytest.test_room_id = data["rooms"][0].get("room_id")
            print(f"Test room ID: {pytest.test_room_id}")
    
    def test_get_archived_chat_rooms(self, user_token):
        """GET /api/chat/rooms?archived=true returns archived rooms only"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.get(f"{BASE_URL}/api/chat/rooms?archived=true", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "rooms" in data
        assert isinstance(data["rooms"], list)
        print(f"Found {len(data['rooms'])} archived chat rooms")
    
    def test_chat_rooms_unauthorized(self):
        """GET /api/chat/rooms without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/chat/rooms")
        assert response.status_code == 401


class TestChatRoomArchive:
    """Archive functionality tests"""
    
    @pytest.fixture(scope="class")
    def user_token(self):
        """Get user auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": USER_EMAIL, "password": USER_PASSWORD}
        )
        assert response.status_code == 200
        return response.json().get("session_token")
    
    @pytest.fixture(scope="class")
    def test_room_id(self, user_token):
        """Get a test room ID from active rooms"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.get(f"{BASE_URL}/api/chat/rooms", headers=headers)
        data = response.json()
        if data.get("rooms"):
            return data["rooms"][0].get("room_id")
        # Check archived if no active
        response = requests.get(f"{BASE_URL}/api/chat/rooms?archived=true", headers=headers)
        data = response.json()
        if data.get("rooms"):
            return data["rooms"][0].get("room_id")
        pytest.skip("No chat rooms available for testing")
    
    def test_archive_chat_room(self, user_token, test_room_id):
        """PUT /api/chat/rooms/{id}/archive archives a room (returns 200)"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.put(
            f"{BASE_URL}/api/chat/rooms/{test_room_id}/archive",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"Archive response: {data}")
    
    def test_archived_room_in_archived_list(self, user_token, test_room_id):
        """After archive, room appears in archived list"""
        headers = {"Authorization": f"Bearer {user_token}"}
        
        # Check archived list
        response = requests.get(f"{BASE_URL}/api/chat/rooms?archived=true", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        archived_room_ids = [r["room_id"] for r in data.get("rooms", [])]
        assert test_room_id in archived_room_ids, f"Room {test_room_id} should be in archived list"
        print(f"Room {test_room_id} found in archived list")
    
    def test_archived_room_not_in_active_list(self, user_token, test_room_id):
        """After archive, room disappears from active list"""
        headers = {"Authorization": f"Bearer {user_token}"}
        
        # Check active list
        response = requests.get(f"{BASE_URL}/api/chat/rooms", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        active_room_ids = [r["room_id"] for r in data.get("rooms", [])]
        assert test_room_id not in active_room_ids, f"Room {test_room_id} should NOT be in active list"
        print(f"Room {test_room_id} not found in active list (as expected)")
    
    def test_archive_nonexistent_room(self, user_token):
        """PUT /api/chat/rooms/{invalid_id}/archive returns 404"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.put(
            f"{BASE_URL}/api/chat/rooms/nonexistent_room_id/archive",
            headers=headers
        )
        assert response.status_code == 404


class TestChatRoomUnarchive:
    """Unarchive functionality tests"""
    
    @pytest.fixture(scope="class")
    def user_token(self):
        """Get user auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": USER_EMAIL, "password": USER_PASSWORD}
        )
        assert response.status_code == 200
        return response.json().get("session_token")
    
    @pytest.fixture(scope="class")
    def archived_room_id(self, user_token):
        """Get a room ID from archived rooms"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.get(f"{BASE_URL}/api/chat/rooms?archived=true", headers=headers)
        data = response.json()
        if data.get("rooms"):
            return data["rooms"][0].get("room_id")
        pytest.skip("No archived rooms available for unarchive testing")
    
    def test_unarchive_chat_room(self, user_token, archived_room_id):
        """PUT /api/chat/rooms/{id}/unarchive restores a room from archive"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.put(
            f"{BASE_URL}/api/chat/rooms/{archived_room_id}/unarchive",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"Unarchive response: {data}")
    
    def test_unarchived_room_in_active_list(self, user_token, archived_room_id):
        """After unarchive, room returns to active list"""
        headers = {"Authorization": f"Bearer {user_token}"}
        
        # Check active list
        response = requests.get(f"{BASE_URL}/api/chat/rooms", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        active_room_ids = [r["room_id"] for r in data.get("rooms", [])]
        assert archived_room_id in active_room_ids, f"Room {archived_room_id} should be in active list after unarchive"
        print(f"Room {archived_room_id} found in active list after unarchive")
    
    def test_unarchived_room_not_in_archived_list(self, user_token, archived_room_id):
        """After unarchive, room not in archived list"""
        headers = {"Authorization": f"Bearer {user_token}"}
        
        # Check archived list
        response = requests.get(f"{BASE_URL}/api/chat/rooms?archived=true", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        archived_room_ids = [r["room_id"] for r in data.get("rooms", [])]
        assert archived_room_id not in archived_room_ids, f"Room {archived_room_id} should NOT be in archived list"
        print(f"Room {archived_room_id} not in archived list (as expected)")
    
    def test_unarchive_nonexistent_room(self, user_token):
        """PUT /api/chat/rooms/{invalid_id}/unarchive returns 404"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.put(
            f"{BASE_URL}/api/chat/rooms/nonexistent_room_id/unarchive",
            headers=headers
        )
        assert response.status_code == 404


class TestChatRoomDelete:
    """Delete functionality tests (soft delete per user)"""
    
    @pytest.fixture(scope="class")
    def user_token(self):
        """Get user auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": USER_EMAIL, "password": USER_PASSWORD}
        )
        assert response.status_code == 200
        return response.json().get("session_token")
    
    def test_delete_nonexistent_room(self, user_token):
        """DELETE /api/chat/rooms/{invalid_id} returns 404"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.delete(
            f"{BASE_URL}/api/chat/rooms/nonexistent_room_id",
            headers=headers
        )
        assert response.status_code == 404
    
    def test_delete_unauthorized(self):
        """DELETE /api/chat/rooms/{id} without auth returns 401"""
        response = requests.delete(f"{BASE_URL}/api/chat/rooms/any_room_id")
        assert response.status_code == 401


class TestChatRoomWithDetails:
    """Test chat room data structure and details"""
    
    @pytest.fixture(scope="class")
    def user_token(self):
        """Get user auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": USER_EMAIL, "password": USER_PASSWORD}
        )
        assert response.status_code == 200
        return response.json().get("session_token")
    
    def test_chat_room_has_other_user_info(self, user_token):
        """Chat rooms include other_user info (for displaying name)"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.get(f"{BASE_URL}/api/chat/rooms", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        if data.get("rooms"):
            room = data["rooms"][0]
            assert "other_user" in room, "Room should have other_user info"
            other_user = room["other_user"]
            # Should have either name or business_name
            has_name = "name" in other_user or "business_name" in other_user
            assert has_name, "other_user should have name or business_name"
            print(f"Other user info: {other_user}")
    
    def test_chat_room_has_last_message(self, user_token):
        """Chat rooms include last_message preview"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.get(f"{BASE_URL}/api/chat/rooms", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        if data.get("rooms"):
            room = data["rooms"][0]
            # last_message may or may not exist depending on if there are messages
            if "last_message" in room:
                assert "content" in room["last_message"], "last_message should have content"
                print(f"Last message preview: {room['last_message'].get('content', '')[:50]}")
    
    def test_chat_room_has_unread_count(self, user_token):
        """Chat rooms include unread_count"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.get(f"{BASE_URL}/api/chat/rooms", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        if data.get("rooms"):
            room = data["rooms"][0]
            assert "unread_count" in room, "Room should have unread_count"
            assert isinstance(room["unread_count"], int), "unread_count should be integer"
            print(f"Unread count: {room['unread_count']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
