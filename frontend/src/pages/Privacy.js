import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaShieldAlt, FaLock, FaEye, FaUserShield, FaDatabase, FaCookie } from 'react-icons/fa';
import { useSiteSettings } from '../context/SiteSettingsContext';

const Privacy = () => {
  const { siteName, settings } = useSiteSettings();
  const lastUpdated = '22 בפברואר, 2026';

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Navbar />
      
      {/* Hero */}
      <section className="bg-gradient-to-br from-carelink-navy to-carelink-slate py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <FaShieldAlt className="text-5xl text-carelink-teal mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">מדיניות פרטיות</h1>
          <p className="text-carelink-teal-pale">עודכן לאחרונה: {lastUpdated}</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="prose prose-lg max-w-none">
            
            <div className="bg-carelink-teal-pale/20 p-6 rounded-xl mb-8">
              <h2 className="text-xl font-bold text-carelink-navy mb-3 flex items-center gap-2">
                <FaLock className="text-carelink-teal" />
                התחייבותנו לפרטיותך
              </h2>
              <p className="text-carelink-slate">
                ב-{siteName}, הפרטיות שלך חשובה לנו. מסמך זה מסביר כיצד אנו אוספים, משתמשים ומגנים על המידע האישי שלך.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-carelink-navy mb-4 flex items-center gap-2">
              <FaDatabase className="text-carelink-teal" />
              איזה מידע אנחנו אוספים?
            </h2>
            <ul className="list-disc list-inside text-carelink-slate mb-8 space-y-2">
              <li><strong>מידע אישי:</strong> שם, כתובת אימייל, מספר טלפון</li>
              <li><strong>מידע על הזמנות:</strong> היסטוריית הזמנות, העדפות שירות</li>
              <li><strong>מידע טכני:</strong> כתובת IP, סוג דפדפן, מכשיר</li>
              <li><strong>מידע מיקום:</strong> רק כאשר אתה מאשר שיתוף מיקום</li>
            </ul>

            <h2 className="text-2xl font-bold text-carelink-navy mb-4 flex items-center gap-2">
              <FaEye className="text-carelink-teal" />
              כיצד אנו משתמשים במידע?
            </h2>
            <ul className="list-disc list-inside text-carelink-slate mb-8 space-y-2">
              <li>לספק ולשפר את השירותים שלנו</li>
              <li>לעבד הזמנות ותשלומים</li>
              <li>לשלוח התראות על הזמנות ועדכונים</li>
              <li>לענות על פניות ותמיכה</li>
              <li>לשפר את חוויית המשתמש</li>
            </ul>

            <h2 className="text-2xl font-bold text-carelink-navy mb-4 flex items-center gap-2">
              <FaUserShield className="text-carelink-teal" />
              שיתוף מידע
            </h2>
            <p className="text-carelink-slate mb-4">
              אנו לא מוכרים את המידע האישי שלך. אנו עשויים לשתף מידע עם:
            </p>
            <ul className="list-disc list-inside text-carelink-slate mb-8 space-y-2">
              <li><strong>ספקי שירות:</strong> כדי לאפשר את ביצוע ההזמנה</li>
              <li><strong>ספקי תשלום:</strong> לעיבוד תשלומים מאובטח</li>
              <li><strong>רשויות:</strong> כנדרש על פי חוק</li>
            </ul>

            <h2 className="text-2xl font-bold text-carelink-navy mb-4 flex items-center gap-2">
              <FaCookie className="text-carelink-teal" />
              עוגיות (Cookies)
            </h2>
            <p className="text-carelink-slate mb-8">
              אנו משתמשים בעוגיות כדי לשפר את חוויית הגלישה שלך, לזכור את ההעדפות שלך ולנתח את השימוש באתר. 
              באפשרותך לנהל את הגדרות העוגיות דרך הדפדפן שלך.
            </p>

            <h2 className="text-2xl font-bold text-carelink-navy mb-4">הזכויות שלך</h2>
            <p className="text-carelink-slate mb-4">על פי חוק הגנת הפרטיות, יש לך זכות:</p>
            <ul className="list-disc list-inside text-carelink-slate mb-8 space-y-2">
              <li>לעיין במידע שאנו מחזיקים עליך</li>
              <li>לבקש תיקון מידע שגוי</li>
              <li>לבקש מחיקת המידע שלך</li>
              <li>להתנגד לעיבוד מסוים של המידע</li>
            </ul>

            <h2 className="text-2xl font-bold text-carelink-navy mb-4">יצירת קשר</h2>
            <p className="text-carelink-slate mb-4">
              לשאלות בנוגע למדיניות הפרטיות, ניתן לפנות אלינו:
            </p>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-carelink-slate">
                <strong>אימייל:</strong> {settings.contact_email || 'privacy@example.com'}<br />
                <strong>טלפון:</strong> 03-1234567
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Privacy;
