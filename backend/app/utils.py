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
import resend
import math

from app.database import db
from app.models import Notification

logger = logging.getLogger(__name__)

ENVIRONMENT = os.environ.get('ENVIRONMENT', 'production')
IS_PRODUCTION = ENVIRONMENT == 'production'

# SECRET_KEY for JWT signing
SECRET_KEY = os.environ.get('SECRET_KEY', '')
if not SECRET_KEY:
    if IS_PRODUCTION:
        raise RuntimeError("CRITICAL: SECRET_KEY environment variable must be set in production. Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\"")
    else:
        import secrets
        SECRET_KEY = secrets.token_hex(32)
        logger.warning("SECRET_KEY not set. Generated a random key for development. Sessions will NOT survive restarts.")

SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'carefd.com@gmail.com')
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
VAPID_CLAIMS_EMAIL = os.environ.get('VAPID_CLAIMS_EMAIL', 'admin@carefd.com')

# Resend API (preferred over SMTP on Railway where SMTP ports are blocked)
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

# ZeptoMail API (Zoho transactional email service)
ZEPTOMAIL_API_KEY = os.environ.get('ZEPTOMAIL_API_KEY', '')

SITE_URL = os.environ.get('SITE_URL', 'https://carefd.com')


async def get_site_url():
    """Get the frontend site URL from DB settings, fallback to constant"""
    settings = await db.site_settings.find_one({}, {"_id": 0, "site_url": 1})
    url = (settings or {}).get("site_url") or SITE_URL
    return url.rstrip('/')


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
    if user_doc.get("is_suspended"):
        raise HTTPException(status_code=403, detail="Account is suspended")
    return user_doc


_smtp_cache = {"settings": None, "fetched_at": None}

async def _get_smtp_settings():
    """Get SMTP settings from DB (admin-configurable), fallback to env vars"""
    import time
    now = time.time()
    if _smtp_cache["settings"] and _smtp_cache["fetched_at"] and (now - _smtp_cache["fetched_at"]) < 300:
        return _smtp_cache["settings"]

    db_settings = await db.smtp_settings.find_one({"_id": "smtp_config"})
    # Decrypt SMTP password if stored encrypted
    if db_settings and db_settings.get("smtp_password_encrypted"):
        try:
            import base64
            import hashlib
            from cryptography.fernet import Fernet
            fernet_key = base64.urlsafe_b64encode(hashlib.sha256(SECRET_KEY.encode()).digest())
            fernet = Fernet(fernet_key)
            db_settings["smtp_password"] = fernet.decrypt(db_settings["smtp_password_encrypted"].encode()).decode()
        except Exception:
            logger.error("Failed to decrypt SMTP password from database")
            db_settings["smtp_password"] = ""
    if db_settings and db_settings.get("smtp_user") and db_settings.get("smtp_password"):
        try:
            port = int(db_settings.get("smtp_port", SMTP_PORT))
        except (ValueError, TypeError):
            port = 587
        settings = {
            "sender_email": db_settings.get("sender_email", SENDER_EMAIL),
            "smtp_host": db_settings.get("smtp_host", SMTP_HOST),
            "smtp_port": port,
            "smtp_user": db_settings.get("smtp_user", SMTP_USER),
            "smtp_password": db_settings.get("smtp_password", SMTP_PASSWORD),
        }
        logger.info(f"SMTP: Using DB settings (host={settings['smtp_host']}, port={settings['smtp_port']})")
    else:
        settings = {
            "sender_email": SENDER_EMAIL,
            "smtp_host": SMTP_HOST,
            "smtp_port": SMTP_PORT,
            "smtp_user": SMTP_USER,
            "smtp_password": SMTP_PASSWORD,
        }
        if not SMTP_USER or not SMTP_PASSWORD:
            logger.warning("SMTP: No credentials configured in DB or env vars - emails will NOT be sent!")
        else:
            logger.info(f"SMTP: Using env var settings (host={SMTP_HOST}, port={SMTP_PORT})")
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
        logger.error(f"SMTP not configured! user={'set' if smtp_user else 'EMPTY'}, password={'set' if smtp_password else 'EMPTY'} - Cannot send email to {recipient}")
        return None
    try:
        logger.info(f"Sending email to {recipient} via {host}:{port} from {sender} - Subject: {subject}")
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = sender
        msg['To'] = recipient
        html_part = MIMEText(html_content, 'html', 'utf-8')
        msg.attach(html_part)

        if port == 465:
            # SSL connection (port 465)
            with smtplib.SMTP_SSL(host, port, timeout=15) as server:
                server.login(smtp_user, smtp_password)
                server.sendmail(sender, recipient, msg.as_string())
        else:
            # STARTTLS connection (port 587)
            with smtplib.SMTP(host, port, timeout=15) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.sendmail(sender, recipient, msg.as_string())

        logger.info(f"Email sent successfully to {recipient} via {host}:{port} - Subject: {subject}")
        return {"success": True, "recipient": recipient}
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP authentication failed for {smtp_user}@{host}:{port} - Error: {str(e)}")
        logger.error("If using Gmail, make sure to use an App Password (not your regular password)")
        return None
    except (smtplib.SMTPConnectError, OSError) as e:
        logger.error(f"Cannot connect to SMTP server {host}:{port} - {type(e).__name__}: {str(e)}")
        # If port 587 failed, try 465 with SSL as fallback
        if port != 465:
            logger.info(f"Retrying with SSL on port 465...")
            try:
                with smtplib.SMTP_SSL(host, 465, timeout=15) as server:
                    server.login(smtp_user, smtp_password)
                    server.sendmail(sender, recipient, msg.as_string())
                logger.info(f"Email sent successfully to {recipient} via {host}:465 (SSL fallback)")
                return {"success": True, "recipient": recipient}
            except Exception as e2:
                logger.error(f"SSL fallback also failed: {type(e2).__name__}: {str(e2)}")
        return None
    except Exception as e:
        logger.error(f"Failed to send email to {recipient} via {host}:{port} - {type(e).__name__}: {str(e)}")
        return None


def _send_email_resend(recipient: str, subject: str, html_content: str, sender: str):
    """Send email via Resend API (works on Railway where SMTP is blocked)."""
    try:
        logger.info(f"Sending email via Resend to {recipient} - Subject: {subject}")
        params = {
            "from": sender,
            "to": [recipient],
            "subject": subject,
            "html": html_content,
        }
        result = resend.Emails.send(params)
        logger.info(f"Email sent via Resend to {recipient} - ID: {result.get('id', 'unknown')}")
        return {"success": True, "recipient": recipient, "provider": "resend"}
    except Exception as e:
        logger.error(f"Resend failed for {recipient} - {type(e).__name__}: {str(e)}")
        return None


def _send_email_zeptomail(recipient: str, subject: str, html_content: str, sender: str, api_key: str = None):
    """Send email via ZeptoMail (Zoho) API."""
    import httpx
    token = api_key or ZEPTOMAIL_API_KEY
    if not token:
        logger.error("ZeptoMail API key not configured")
        return None
    try:
        logger.info(f"Sending email via ZeptoMail to {recipient} - Subject: {subject}")
        if '<' in sender and '>' in sender:
            sender_name = sender.split('<')[0].strip()
            sender_email = sender.split('<')[1].rstrip('>')
        else:
            sender_name = "CareFD"
            sender_email = sender

        payload = {
            "from": {"address": sender_email, "name": sender_name},
            "to": [{"email_address": {"address": recipient}}],
            "subject": subject,
            "htmlbody": html_content,
        }
        headers = {
            "Authorization": f"Zoho-enczapikey {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        resp = httpx.post(
            "https://api.zeptomail.com/v1.1/email",
            json=payload,
            headers=headers,
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        logger.info(f"Email sent via ZeptoMail to {recipient} - request_id: {data.get('request_id', 'unknown')}")
        return {"success": True, "recipient": recipient, "provider": "zeptomail"}
    except Exception as e:
        logger.error(f"ZeptoMail failed for {recipient} - {type(e).__name__}: {str(e)}")
        return None


_email_provider_cache = {"provider": None, "settings": None, "fetched_at": None}

async def _get_email_provider_settings():
    """Get active email provider from DB settings, fallback to env vars."""
    import time
    now = time.time()
    if _email_provider_cache["settings"] and _email_provider_cache["fetched_at"] and (now - _email_provider_cache["fetched_at"]) < 300:
        return _email_provider_cache["provider"], _email_provider_cache["settings"]

    db_settings = await db.smtp_settings.find_one({"_id": "smtp_config"})
    provider = (db_settings or {}).get("email_provider", "smtp")
    settings = {}

    if provider == "zeptomail" and db_settings:
        # Decrypt ZeptoMail API key
        encrypted_key = db_settings.get("zeptomail_api_key_encrypted", "")
        if encrypted_key:
            try:
                import base64, hashlib
                from cryptography.fernet import Fernet
                fernet_key = base64.urlsafe_b64encode(hashlib.sha256(SECRET_KEY.encode()).digest())
                fernet = Fernet(fernet_key)
                settings["zeptomail_api_key"] = fernet.decrypt(encrypted_key.encode()).decode()
            except Exception:
                logger.error("Failed to decrypt ZeptoMail API key from database")
                settings["zeptomail_api_key"] = ""
        settings["sender_email"] = db_settings.get("zeptomail_sender_email", "") or db_settings.get("sender_email", SENDER_EMAIL)

    _email_provider_cache["provider"] = provider
    _email_provider_cache["settings"] = settings
    _email_provider_cache["fetched_at"] = now
    return provider, settings


async def send_email_async(recipient: str, subject: str, html_content: str):
    try:
        # Check admin-selected email provider
        provider, provider_settings = await _get_email_provider_settings()

        if provider == "zeptomail":
            api_key = provider_settings.get("zeptomail_api_key", "") or ZEPTOMAIL_API_KEY
            sender_email = provider_settings.get("sender_email", SENDER_EMAIL)
            if api_key:
                sender = f"CareFD <{sender_email}>"
                result = await asyncio.to_thread(_send_email_zeptomail, recipient, subject, html_content, sender, api_key)
                if result:
                    return result
                logger.warning("ZeptoMail failed, falling back to SMTP...")
            else:
                logger.warning("ZeptoMail selected but no API key configured, falling back to SMTP...")

        elif provider == "resend":
            if RESEND_API_KEY:
                sender = f"CareFD <{SENDER_EMAIL}>"
                result = await asyncio.to_thread(_send_email_resend, recipient, subject, html_content, sender)
                if result:
                    return result
                logger.warning("Resend failed, falling back to SMTP...")
            else:
                logger.warning("Resend selected but no API key configured, falling back to SMTP...")

        # Default / fallback: SMTP
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
