from fastapi import APIRouter, HTTPException, Header, Request
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid

from app.database import db
from app.models import ChatRoom, Message, MessageCreate
from app.utils import get_current_user, send_email_async, create_notification, send_push_to_user
from app.rate_limiter import rate_limiter, get_client_ip

router = APIRouter()

@router.post("/chat/rooms")
async def create_chat_room(
    room_data: dict,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Create a chat room"""
    # Rate limit: 20 chat rooms per IP per 15 minutes
    if request:
        rate_limiter.check(f"create_chat:{get_client_ip(request)}", max_requests=20, window_seconds=900)
    user = await get_current_user(authorization, request)

    # Verify the authenticated user is one of the participants
    requested_user_id = room_data.get("user_id")
    requested_provider_id = room_data.get("provider_id")

    # Check if current user is either the patient or the provider
    is_patient = user["user_id"] == requested_user_id
    provider_doc = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    is_provider = provider_doc and provider_doc["provider_id"] == requested_provider_id

    if not is_patient and not is_provider:
        raise HTTPException(status_code=403, detail="You can only create chat rooms you participate in")

    # Check if room already exists
    existing = await db.chat_rooms.find_one({
        "user_id": requested_user_id,
        "provider_id": requested_provider_id
    }, {"_id": 0})

    if existing:
        return existing

    chat_room = ChatRoom(
        user_id=requested_user_id,
        provider_id=requested_provider_id,
        request_id=room_data.get("request_id"),
        booking_id=room_data.get("booking_id")
    )
    
    room_dict = chat_room.model_dump()
    room_dict['created_at'] = room_dict['created_at'].isoformat()
    if room_dict.get('last_message_at'):
        room_dict['last_message_at'] = room_dict['last_message_at'].isoformat()
    
    await db.chat_rooms.insert_one(room_dict)
    
    # Notify the other participant about new chat
    creator_id = user["user_id"]
    creator_name = user.get("name", "משתמש")
    
    if creator_id == room_data.get("user_id"):
        # User created room -> notify provider
        provider_doc = await db.providers.find_one({"provider_id": room_data.get("provider_id")}, {"_id": 0})
        if provider_doc:
            recipient_id = provider_doc.get("user_id")
            await create_notification(
                recipient_id,
                "chat_message",
                "שיחה חדשה",
                f"{creator_name} פתח/ה שיחה חדשה",
                {"room_id": chat_room.room_id}
            )
            await send_push_to_user(
                recipient_id,
                "שיחה חדשה",
                f"{creator_name} פתח/ה שיחה חדשה",
                {"chat_room_id": chat_room.room_id, "type": "new_chat"}
            )
    
    return chat_room.model_dump()

@router.get("/chat/rooms")
async def get_chat_rooms(
    authorization: Optional[str] = Header(None),
    request: Request = None,
    archived: bool = False
):
    """Get user's chat rooms"""
    user = await get_current_user(authorization, request)
    
    # Check if user is a provider
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    
    if provider:
        query = {"provider_id": provider["provider_id"]}
    else:
        query = {"user_id": user["user_id"]}
    
    # Filter out deleted rooms for this user
    query["deleted_by"] = {"$nin": [user["user_id"]]}
    
    # Filter by archive status
    if archived:
        query["archived_by"] = {"$in": [user["user_id"]]}
    else:
        query["$or"] = [
            {"archived_by": {"$exists": False}},
            {"archived_by": {"$nin": [user["user_id"]]}}
        ]
    
    rooms = await db.chat_rooms.find(query, {"_id": 0}).sort("last_message_at", -1).to_list(100)
    
    # Enrich with user/provider info
    for room in rooms:
        if provider:
            # Provider viewing - get patient info
            patient = await db.users.find_one({"user_id": room["user_id"]}, {"_id": 0, "password_hash": 0})
            room["other_user"] = patient or {"name": "משתמש", "user_id": room["user_id"]}
        else:
            # Patient viewing - get provider info
            provider_info = await db.providers.find_one({"provider_id": room["provider_id"]}, {"_id": 0})
            room["other_user"] = provider_info or {"business_name": "ספק", "provider_id": room["provider_id"]}
        
        # Get last message
        last_msg_cursor = db.messages.find(
            {"room_id": room["room_id"]},
            {"_id": 0}
        ).sort("created_at", -1).limit(1)
        last_msg_list = await last_msg_cursor.to_list(1)
        if last_msg_list:
            room["last_message"] = last_msg_list[0]
        
        # Calculate unread count
        unread_query = {"room_id": room["room_id"], "sender_id": {"$ne": user["user_id"]}, "is_read": False}
        room["unread_count"] = await db.messages.count_documents(unread_query)
    
    return {"rooms": rooms}

@router.post("/chat/messages")
async def send_message(
    message_data: MessageCreate,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Send a message"""
    # Rate limit: 60 messages per IP per 15 minutes
    if request:
        rate_limiter.check(f"chat_msg:{get_client_ip(request)}", max_requests=60, window_seconds=900)
    user = await get_current_user(authorization, request)
    
    # Verify room access
    room = await db.chat_rooms.find_one({"room_id": message_data.room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    # Check authorization
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    is_participant = (
        room["user_id"] == user["user_id"] or 
        (provider and room["provider_id"] == provider["provider_id"])
    )
    
    if not is_participant:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    sender_role = "provider" if provider else "patient"
    
    message = Message(
        room_id=message_data.room_id,
        sender_id=user["user_id"],
        sender_role=sender_role,
        content=message_data.content,
        message_type=message_data.message_type,
        attachment_url=message_data.attachment_url,
        attachment_name=message_data.attachment_name
    )
    
    message_dict = message.model_dump()
    message_dict['created_at'] = message_dict['created_at'].isoformat()
    
    await db.messages.insert_one(message_dict)
    
    # Update room's last_message_at
    await db.chat_rooms.update_one(
        {"room_id": message_data.room_id},
        {"$set": {"last_message_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Send notification to the other participant
    recipient_id = None
    sender_name = user.get("name", "משתמש")
    
    if sender_role == "provider":
        # Provider sent message -> notify user
        recipient_id = room["user_id"]
    else:
        # User sent message -> notify provider
        provider_doc = await db.providers.find_one({"provider_id": room["provider_id"]}, {"_id": 0})
        if provider_doc:
            recipient_id = provider_doc.get("user_id")
            sender_name = user.get("name", "לקוח")
    
    if recipient_id:
        await create_notification(
            recipient_id,
            "chat_message",
            "הודעה חדשה בצ'אט",
            f"{sender_name}: {message_data.content[:50]}{'...' if len(message_data.content) > 50 else ''}",
            {"room_id": message_data.room_id}
        )
        # Send push notification to recipient's device
        await send_push_to_user(
            recipient_id,
            f"הודעה חדשה מ{sender_name}",
            message_data.content[:100],
            {"room_id": message_data.room_id, "chat_room_id": message_data.room_id, "type": "chat_message"}
        )
    
    return message.model_dump()

@router.get("/chat/messages/{room_id}")
async def get_messages(
    room_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None,
    skip: int = 0,
    limit: int = 50
):
    """Get messages in a room"""
    user = await get_current_user(authorization, request)
    
    # Verify room access
    room = await db.chat_rooms.find_one({"room_id": room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    # Check authorization
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    is_participant = (
        room["user_id"] == user["user_id"] or 
        (provider and room["provider_id"] == provider["provider_id"])
    )
    
    if not is_participant:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Mark messages as read first, then fetch
    await db.messages.update_many(
        {"room_id": room_id, "sender_id": {"$ne": user["user_id"]}, "is_read": False},
        {"$set": {"is_read": True}}
    )

    messages = await db.messages.find(
        {"room_id": room_id},
        {"_id": 0}
    ).sort("created_at", 1).skip(skip).limit(limit).to_list(limit)

    return {"messages": messages}

# ==================== ARCHIVE & DELETE ====================

@router.put("/chat/rooms/{room_id}/archive")
async def archive_chat_room(
    room_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Archive a chat room"""
    user = await get_current_user(authorization, request)
    room = await db.chat_rooms.find_one({"room_id": room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    is_participant = (
        room["user_id"] == user["user_id"] or 
        (provider and room["provider_id"] == provider["provider_id"])
    )
    if not is_participant:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Track per-user archive status
    archived_by = room.get("archived_by", [])
    if user["user_id"] not in archived_by:
        archived_by.append(user["user_id"])
    
    await db.chat_rooms.update_one(
        {"room_id": room_id},
        {"$set": {"archived_by": archived_by}}
    )
    return {"message": "Chat archived"}

@router.put("/chat/rooms/{room_id}/unarchive")
async def unarchive_chat_room(
    room_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Unarchive a chat room"""
    user = await get_current_user(authorization, request)
    room = await db.chat_rooms.find_one({"room_id": room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")

    # Verify user is a participant
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    is_participant = (
        room["user_id"] == user["user_id"] or
        (provider and room["provider_id"] == provider["provider_id"])
    )
    if not is_participant:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.chat_rooms.update_one(
        {"room_id": room_id},
        {"$pull": {"archived_by": user["user_id"]}}
    )
    return {"message": "Chat unarchived"}

@router.delete("/chat/rooms/{room_id}")
async def delete_chat_room(
    room_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Delete a chat room (soft delete per user)"""
    user = await get_current_user(authorization, request)
    room = await db.chat_rooms.find_one({"room_id": room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    provider = await db.providers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    is_participant = (
        room["user_id"] == user["user_id"] or 
        (provider and room["provider_id"] == provider["provider_id"])
    )
    if not is_participant:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Soft delete per user
    deleted_by = room.get("deleted_by", [])
    if user["user_id"] not in deleted_by:
        deleted_by.append(user["user_id"])
    
    await db.chat_rooms.update_one(
        {"room_id": room_id},
        {"$set": {"deleted_by": deleted_by}}
    )
    
    # If both participants deleted, remove messages too
    all_participants = [room["user_id"]]
    prov_doc = provider or await db.providers.find_one({"provider_id": room["provider_id"]}, {"_id": 0})
    if prov_doc:
        all_participants.append(prov_doc.get("user_id", ""))
    all_participants = list(set(all_participants))
    
    if all(p in deleted_by for p in all_participants if p):
        await db.messages.delete_many({"room_id": room_id})
        await db.chat_rooms.delete_one({"room_id": room_id})
    
    return {"message": "Chat deleted"}

# ==================== NOTIFICATIONS ROUTES ====================
