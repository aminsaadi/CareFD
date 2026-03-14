import os
import logging
import json
import asyncio
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import HTTPException, Header, Request
from jose import jwt
import bcrypt
from pywebpush import webpush, WebPushException
import math

from app.database import db
from app.models import Notification

logger = logging.getLogger(__name__)

ENVIRONMENT = os.environ.get('ENVIRONMENT', 'production')
IS_PRODUCTION = ENVIRONMENT == 'production'

# SECRET_KEY for JWT signing
SECRET_KEY = os.environ.get('SECRET_KEY', '')
if not SECRET_KEY:
    import secrets
    SECRET_KEY = secrets.token_hex(32)
    logger.warning("SECRET_KEY not set! Generated a random key. Sessions will NOT survive restarts. Set SECRET_KEY in Railway variables.")

SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'carelink.co.il@gmail.com')
SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
try:
    SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
except (ValueError, TypeError):
    SMTP_PORT = 587
    logger.warning("Invalid SMTP_PORT value, defaulting to 587")
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
VAPID_PUBLIC_KEY = os.environ.get('VAPID_PUBLIC_KEY', '')
VAPID_PRIVATE_KEY = os.environ.get('VAPID_PRIVATE_KEY', '')
VAPID_CLAIMS_EMAIL = os.environ.get('VAPID_CLAIMS_EMAIL', 'admin@carelink.co.il')

SITE_URL = os.environ.get('SITE_URL', 'https://carelink.co.il')


async def get_site_url():
    """Get the frontend site URL from DB settings, fallback to constant"""
    settings = await db.site_settings.find_one({}, {"_id": 0, "site_url": 1})
    return (settings or {}).get("site_url") or SITE_URL


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


async def get_current_user(authorization: Optional[str] = Header(None), request: Request = None) -> dict:
    token = None
    if request:
        token = request.cookies.get("session_token")
    if not token and authorization:
        if authorization.startswith("Bearer "):
            token = authorization[7:]
        else:
            token = authorization
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session_doc = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    return user_doc


_smtp_cache = {"settings": None, "fetched_at": None}

async def _get_smtp_settings():
    """Get SMTP settings from DB (admin-configurable), fallback to env vars"""
    import time
    now = time.time()
    if _smtp_cache["settings"] and _smtp_cache["fetched_at"] and (now - _smtp_cache["fetched_at"]) < 300:
        return _smtp_cache["settings"]
    
    db_settings = await db.smtp_settings.find_one({"_id": "smtp_config"}, {"_id": 0})
    if db_settings and db_settings.get("smtp_user") and db_settings.get("smtp_password"):
        settings = {
            "sender_email": db_settings.get("sender_email", SENDER_EMAIL),
            "smtp_host": db_settings.get("smtp_host", SMTP_HOST),
            "smtp_port": int(db_settings.get("smtp_port", SMTP_PORT)),
            "smtp_user": db_settings.get("smtp_user", SMTP_USER),
            "smtp_password": db_settings.get("smtp_password", SMTP_PASSWORD),
        }
    else:
        settings = {
            "sender_email": SENDER_EMAIL,
            "smtp_host": SMTP_HOST,
            "smtp_port": SMTP_PORT,
            "smtp_user": SMTP_USER,
            "smtp_password": SMTP_PASSWORD,
        }
    _smtp_cache["settings"] = settings
    _smtp_cache["fetched_at"] = now
    return settings


def send_email_smtp_with_config(recipient: str, subject: str, html_content: str, smtp_cfg: dict):
    smtp_user = smtp_cfg["smtp_user"]
    smtp_password = smtp_cfg["smtp_password"]
    sender = smtp_cfg["sender_email"]
    host = smtp_cfg["smtp_host"]
    port = smtp_cfg["smtp_port"]
    
    if not smtp_user or not smtp_password:
        logger.error(f"SMTP not configured! Cannot send email to {recipient}")
        return None
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = sender
        msg['To'] = recipient
        html_part = MIMEText(html_content, 'html', 'utf-8')
        msg.attach(html_part)
        with smtplib.SMTP(host, port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(sender, recipient, msg.as_string())
        logger.info(f"Email sent successfully to {recipient} via {host} - Subject: {subject}")
        return {"success": True, "recipient": recipient}
    except Exception as e:
        logger.error(f"Failed to send email to {recipient} via {host} - Error: {str(e)}")
        return None


def send_email_smtp(recipient: str, subject: str, html_content: str):
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.error(f"SMTP not configured! SMTP_USER={'set' if SMTP_USER else 'EMPTY'}, SMTP_PASSWORD={'set' if SMTP_PASSWORD else 'EMPTY'} - Cannot send email to {recipient}")
        return None
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = SENDER_EMAIL
        msg['To'] = recipient
        html_part = MIMEText(html_content, 'html', 'utf-8')
        msg.attach(html_part)
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SENDER_EMAIL, recipient, msg.as_string())
        logger.info(f"Email sent successfully to {recipient} - Subject: {subject}")
        return {"success": True, "recipient": recipient}
    except Exception as e:
        logger.error(f"Failed to send email to {recipient} - Subject: {subject} - Error: {str(e)}")
        return None

async def send_email_async(recipient: str, subject: str, html_content: str):
    try:
        smtp_cfg = await _get_smtp_settings()
        result = await asyncio.to_thread(send_email_smtp_with_config, recipient, subject, html_content, smtp_cfg)
        return result
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return None


async def send_push_notification(subscription_info: dict, title: str, body: str, data: dict = None, icon: str = "/logo192.png"):
    if not VAPID_PRIVATE_KEY or not VAPID_PUBLIC_KEY:
        logger.warning("VAPID keys not configured, skipping push notification")
        return False
    payload = json.dumps({
        "title": title,
        "body": body,
        "icon": icon,
        "badge": "/logo192.png",
        "data": data or {},
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    try:
        webpush(
            subscription_info=subscription_info,
            data=payload,
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={"sub": f"mailto:{VAPID_CLAIMS_EMAIL}"}
        )
        logger.info(f"Push notification sent to endpoint: {subscription_info.get('endpoint', 'unknown')[:50]}...")
        return True
    except WebPushException as ex:
        logger.error(f"Push notification failed: {repr(ex)}")
        if ex.response and ex.response.status_code in [404, 410]:
            await db.push_subscriptions.delete_one({"endpoint": subscription_info.get("endpoint")})
            logger.info("Removed invalid push subscription")
        return False
    except Exception as e:
        logger.error(f"Push notification error: {str(e)}")
        return False

async def send_push_to_user(user_id: str, title: str, body: str, data: dict = None):
    subscriptions = await db.push_subscriptions.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    success_count = 0
    for sub in subscriptions:
        subscription_info = {"endpoint": sub.get("endpoint"), "keys": sub.get("keys")}
        if await send_push_notification(subscription_info, title, body, data):
            success_count += 1
    return success_count


async def create_notification(user_id: str, notif_type: str, title: str, message: str, data: dict = None):
    notification = Notification(user_id=user_id, type=notif_type, title=title, message=message, data=data)
    notif_dict = notification.model_dump()
    notif_dict['created_at'] = notif_dict['created_at'].isoformat()
    await db.notifications.insert_one(notif_dict)
    return notification


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c
