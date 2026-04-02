import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const SENDER_EMAIL = process.env.SENDER_EMAIL || "noreply@carefd.com";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://carefd.com";

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!resend) {
    console.warn(`[Email] No RESEND_API_KEY set. Would send to ${to}: ${subject}`);
    return false;
  }

  try {
    await resend.emails.send({
      from: `CareFD <${SENDER_EMAIL}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("[Email] Send failed:", error);
    return false;
  }
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verifyUrl = `${SITE_URL}/verify-email?token=${token}`;
  return sendEmail(email, "אימות כתובת האימייל - CareFD", `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <body style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0d9488, #0f766e); color: white; padding: 30px; border-radius: 15px 15px 0 0; text-align: center;">
        <h1 style="margin: 0;">CareFD</h1>
        <p>אימות כתובת האימייל</p>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 15px 15px;">
        <p>שלום ${name},</p>
        <p>תודה שנרשמת ל-CareFD! לחצו על הכפתור כדי לאמת את כתובת האימייל:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background: #0d9488; color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">אמת את האימייל</a>
        </div>
        <p style="color: #666; font-size: 12px;">הקישור תקף ל-24 שעות. אם לא ביקשתם לאמת, התעלמו ממייל זה.</p>
      </div>
    </body>
    </html>
  `);
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${SITE_URL}/reset-password?token=${token}`;
  return sendEmail(email, "איפוס סיסמה - CareFD", `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <body style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0d9488, #0f766e); color: white; padding: 30px; border-radius: 15px 15px 0 0; text-align: center;">
        <h1 style="margin: 0;">CareFD</h1>
        <p>איפוס סיסמה</p>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 15px 15px;">
        <p>קיבלנו בקשה לאיפוס סיסמה. לחצו על הכפתור:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #0d9488; color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">איפוס סיסמה</a>
        </div>
        <p style="color: #666; font-size: 12px;">הקישור תקף לשעה אחת. אם לא ביקשתם, התעלמו ממייל זה.</p>
      </div>
    </body>
    </html>
  `);
}

export async function sendBookingNotificationEmail(
  to: string,
  bookingNumber: string,
  clientName: string,
  serviceName: string,
  dateFormatted: string,
  finalPrice: number,
  siteUrl: string
) {
  return sendEmail(to, `הזמנה חדשה #${bookingNumber} - CareFD`, `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <body style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0d9488, #0f766e); color: white; padding: 30px; border-radius: 15px 15px 0 0; text-align: center;">
        <h1 style="margin: 0;">הזמנה חדשה!</h1>
        <p>מספר הזמנה: ${bookingNumber}</p>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 15px 15px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 10px 0; color: #666;">לקוח:</td><td style="font-weight: bold;">${clientName}</td></tr>
          <tr><td style="padding: 10px 0; color: #666;">שירות:</td><td>${serviceName}</td></tr>
          <tr><td style="padding: 10px 0; color: #666;">תאריך:</td><td>${dateFormatted}</td></tr>
          <tr><td style="padding: 10px 0; color: #666;">מחיר:</td><td style="color: #0d9488; font-weight: bold;">₪${finalPrice}</td></tr>
        </table>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${siteUrl}/provider/dashboard" style="background: #0d9488; color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold;">צפה בהזמנה</a>
        </div>
      </div>
    </body>
    </html>
  `);
}
