from fastapi import APIRouter, HTTPException, Header, Request, UploadFile, File
from fastapi.responses import FileResponse, Response
from typing import Optional
from datetime import datetime, timezone
import uuid
import re
import os
from pathlib import Path

from app.database import db, UPLOAD_DIR
from app.utils import get_current_user, get_site_url

router = APIRouter()

ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png', 'webp', 'gif'}


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
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = UPLOAD_DIR / unique_filename

    # Save file
    with open(file_path, "wb") as f:
        f.write(content)

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
    user = await get_current_user(authorization, request)

    # Validate file type - images only
    allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    content_type = file.content_type
    if content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only image files are allowed (JPEG, PNG, WebP, GIF)")

    # Validate file size (5MB max for images)
    max_size = 5 * 1024 * 1024
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail="Image too large (max 5MB)")

    # Generate unique filename with sanitized extension
    ext = _sanitize_extension(file.filename, 'jpg')
    unique_filename = f"img_{uuid.uuid4().hex}.{ext}"
    file_path = UPLOAD_DIR / unique_filename

    # Save file
    with open(file_path, "wb") as f:
        f.write(content)

    # Generate URL
    base_url = await get_site_url()
    file_url = f"{base_url}/api/files/{unique_filename}"

    return {
        "url": file_url,
        "filename": unique_filename,
        "original_name": file.filename,
        "size": len(content)
    }

@router.get("/files/{filename}")
async def get_file(filename: str):
    """Serve uploaded files"""
    # Prevent path traversal - only allow alphanumeric filenames with dots
    if not re.match(r'^[a-zA-Z0-9_]+\.[a-z]+$', filename):
        raise HTTPException(status_code=400, detail="Invalid filename")

    file_path = (UPLOAD_DIR / filename).resolve()

    # Ensure the resolved path is within UPLOAD_DIR
    if not str(file_path).startswith(str(UPLOAD_DIR.resolve())):
        raise HTTPException(status_code=403, detail="Access denied")

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(str(file_path))


# ==================== USER VERIFICATION ====================
