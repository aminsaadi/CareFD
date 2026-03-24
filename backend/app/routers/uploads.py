from fastapi import APIRouter, HTTPException, Header, Request, UploadFile, File
from fastapi.responses import FileResponse, Response
from typing import Optional
from datetime import datetime, timezone
import uuid
import re
import os
import base64
from pathlib import Path

from app.database import db, UPLOAD_DIR
from app.utils import get_current_user, get_site_url
from app.rate_limiter import rate_limiter, get_client_ip

router = APIRouter()

ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'ico'}

# Magic bytes for file type verification
FILE_SIGNATURES = {
    b'\x89PNG\r\n\x1a\n': 'png',
    b'\xff\xd8\xff': 'jpg',
    b'%PDF': 'pdf',
    b'RIFF': 'webp',  # WebP starts with RIFF....WEBP
    b'GIF87a': 'gif',
    b'GIF89a': 'gif',
}


def _verify_file_magic(content: bytes, claimed_ext: str) -> bool:
    """Verify file content matches claimed type using magic bytes."""
    for signature, file_type in FILE_SIGNATURES.items():
        if content[:len(signature)] == signature:
            if file_type == 'jpg' and claimed_ext in ('jpg', 'jpeg'):
                return True
            if file_type == claimed_ext:
                return True
            # WebP: check for WEBP after RIFF header
            if file_type == 'webp' and claimed_ext == 'webp' and len(content) >= 12 and content[8:12] == b'WEBP':
                return True
    return False


def _sanitize_extension(filename: str, default: str = 'bin') -> str:
    """Extract and validate file extension."""
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else default
    ext = re.sub(r'[^a-z0-9]', '', ext)
    if ext not in ALLOWED_EXTENSIONS:
        ext = default
    return ext

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Upload a file and return its URL"""
    # Rate limit: 20 uploads per IP per 15 minutes
    if request:
        rate_limiter.check(f"upload:{get_client_ip(request)}", max_requests=20, window_seconds=900)
    user = await get_current_user(authorization, request)
    
    # Validate file type
    allowed_types = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    content_type = file.content_type
    if content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    # Validate file size (10MB max)
    max_size = 10 * 1024 * 1024
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    
    # Generate unique filename with sanitized extension
    ext = _sanitize_extension(file.filename, 'bin')

    # Verify file content matches claimed type
    if ext != 'bin' and not _verify_file_magic(content, ext):
        raise HTTPException(status_code=400, detail="File content does not match file type")

    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = UPLOAD_DIR / unique_filename

    # Save file to disk (cache)
    with open(file_path, "wb") as f:
        f.write(content)

    # Also save to MongoDB for persistence across deploys
    await db.uploaded_files.update_one(
        {"filename": unique_filename},
        {"$set": {
            "filename": unique_filename,
            "content_base64": base64.b64encode(content).decode('utf-8'),
            "content_type": content_type,
            "original_name": file.filename,
            "size": len(content),
            "uploaded_by": user["user_id"],
            "uploaded_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )

    # Generate URL
    base_url = await get_site_url()
    file_url = f"{base_url}/api/files/{unique_filename}"

    return {
        "url": file_url,
        "filename": unique_filename,
        "original_name": file.filename,
        "size": len(content)
    }

@router.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Upload an image file (for profile pictures)"""
    # Rate limit: 20 uploads per IP per 15 minutes
    if request:
        rate_limiter.check(f"upload_img:{get_client_ip(request)}", max_requests=20, window_seconds=900)
    user = await get_current_user(authorization, request)

    # Validate file type - images only
    allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']
    content_type = file.content_type
    if content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only image files are allowed (JPEG, PNG, WebP, GIF, SVG, ICO)")

    # Validate file size (5MB max for images)
    max_size = 5 * 1024 * 1024
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail="Image too large (max 5MB)")

    # Generate unique filename with sanitized extension
    ext = _sanitize_extension(file.filename, 'jpg')

    # SVG files: check for embedded JavaScript/event handlers
    if ext == 'svg':
        try:
            svg_text = content.decode('utf-8', errors='ignore').lower()
            dangerous_patterns = ['<script', 'javascript:', 'onerror=', 'onload=', 'onclick=', 'onmouseover=', 'onfocus=', 'eval(', 'expression(', 'onmouseenter=', 'onfocusin=', 'onanimationstart=', 'data:', 'xlink:href']
            for pattern in dangerous_patterns:
                if pattern in svg_text:
                    raise HTTPException(status_code=400, detail="SVG file contains potentially dangerous content")
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid SVG file")
    elif ext == 'ico':
        # ICO files: verify basic structure (must start with reserved=0, type=1 for ICO)
        if len(content) < 6 or content[0:4] != b'\x00\x00\x01\x00':
            raise HTTPException(status_code=400, detail="Invalid ICO file format")
    else:
        # Verify file content matches claimed type
        if not _verify_file_magic(content, ext):
            raise HTTPException(status_code=400, detail="File content does not match image type")

    unique_filename = f"img_{uuid.uuid4().hex}.{ext}"
    file_path = UPLOAD_DIR / unique_filename

    # Save file to disk (cache)
    with open(file_path, "wb") as f:
        f.write(content)

    # Also save to MongoDB for persistence across deploys
    await db.uploaded_files.update_one(
        {"filename": unique_filename},
        {"$set": {
            "filename": unique_filename,
            "content_base64": base64.b64encode(content).decode('utf-8'),
            "content_type": content_type,
            "original_name": file.filename,
            "size": len(content),
            "uploaded_by": user["user_id"],
            "uploaded_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )

    # Generate URL
    base_url = await get_site_url()
    file_url = f"{base_url}/api/files/{unique_filename}"

    return {
        "url": file_url,
        "filename": unique_filename,
        "original_name": file.filename,
        "size": len(content)
    }

CONTENT_TYPE_MAP = {
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'webp': 'image/webp',
    'gif': 'image/gif',
    'pdf': 'application/pdf',
}

@router.get("/files/{filename}")
async def get_file(filename: str):
    """Serve uploaded files - from disk cache or MongoDB fallback"""
    # Prevent path traversal - only allow alphanumeric filenames with dots
    if not re.match(r'^[a-zA-Z0-9_]+\.[a-z]+$', filename):
        raise HTTPException(status_code=400, detail="Invalid filename")

    file_path = (UPLOAD_DIR / filename).resolve()

    # Ensure the resolved path is within UPLOAD_DIR
    if not str(file_path).startswith(str(UPLOAD_DIR.resolve())):
        raise HTTPException(status_code=403, detail="Access denied")

    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    media_type = CONTENT_TYPE_MAP.get(ext)

    # If file doesn't exist on disk, try to restore from MongoDB
    if not file_path.exists():
        stored_file = await db.uploaded_files.find_one({"filename": filename}, {"_id": 0})
        if not stored_file:
            raise HTTPException(status_code=404, detail="File not found")

        # Restore file to disk for future requests
        content = base64.b64decode(stored_file["content_base64"])
        with open(file_path, "wb") as f:
            f.write(content)

    # For SVG files, add Content-Security-Policy to block inline scripts
    if ext == 'svg':
        return FileResponse(
            str(file_path),
            media_type=media_type,
            headers={"Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'"}
        )

    return FileResponse(str(file_path), media_type=media_type)


# ==================== USER VERIFICATION ====================
