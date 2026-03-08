from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
import uuid

from app.database import db
from app.utils import send_email_async, create_notification

router = APIRouter()

@router.post("/contact")
async def submit_contact_form(contact_data: dict):
    """Handle contact form submissions"""
    name = contact_data.get("name", "")
    email = contact_data.get("email", "")
    phone = contact_data.get("phone", "")
    subject = contact_data.get("subject", "")
    message = contact_data.get("message", "")
    
    if not name or not email or not message:
        raise HTTPException(status_code=400, detail="Name, email and message are required")
    
    # Save to database
    contact_record = {
        "contact_id": f"contact_{uuid.uuid4().hex[:12]}",
        "name": name,
        "email": email,
        "phone": phone,
        "subject": subject,
        "message": message,
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.contact_messages.insert_one(contact_record)
    
    # Notify admins
    admins = await db.users.find({"role": "admin"}, {"user_id": 1, "email": 1}).to_list(10)
    for admin in admins:
        await create_notification(
            admin["user_id"],
            "contact_form",
            "הודעה חדשה מטופס יצירת קשר",
            f"התקבלה הודעה מ-{name} בנושא: {subject}",
            {"contact_id": contact_record["contact_id"]}
        )
    
    # Send confirmation email to user
    await send_email_async(
        email,
        "קיבלנו את הפנייה שלך - CareLink",
        f"""
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #19B8BA;">תודה שפנית אלינו!</h2>
            <p>שלום {name},</p>
            <p>קיבלנו את הפנייה שלך ונחזור אליך בהקדם האפשרי.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <strong>נושא הפנייה:</strong> {subject}<br>
                <strong>ההודעה שלך:</strong><br>
                {message}
            </div>
            <p>בברכה,<br>צוות CareLink</p>
        </div>
        """
    )
    
    return {"message": "Contact form submitted successfully", "contact_id": contact_record["contact_id"]}

