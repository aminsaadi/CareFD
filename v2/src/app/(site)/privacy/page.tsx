"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";

export default function PrivacyPage() {
  const [dbContent, setDbContent] = useState<string | null>(null);

  useEffect(() => {
    api.get("/pages/privacy")
      .then((d: any) => {
        if (d?.content) setDbContent(d.content);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="container-main py-16 max-w-4xl">
      <h1 className="mb-8">מדיניות פרטיות</h1>
      <p className="text-sm text-carefd-gray mb-8">עדכון אחרון: אפריל 2026</p>

      {dbContent ? (
        <div
          className="prose prose-lg max-w-none text-slate-600 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: dbContent }}
        />
      ) : (
        <div className="prose prose-lg max-w-none text-slate-600 space-y-6 leading-relaxed">
          <p>
            CareFD (&quot;האתר&quot;, &quot;הפלטפורמה&quot;, &quot;אנחנו&quot;) מכבדת את פרטיותכם ומחויבת להגן על המידע האישי שלכם.
            מדיניות פרטיות זו מתארת כיצד אנו אוספים, משתמשים, מאחסנים ומגנים על המידע שלכם בעת השימוש בפלטפורמה.
          </p>

          <h2 className="font-heading text-carefd-navy">1. מידע שאנו אוספים</h2>
          <p>אנו אוספים את הסוגים הבאים של מידע:</p>
          <ul>
            <li><strong>מידע שמסרתם ישירות:</strong> שם, כתובת אימייל, מספר טלפון, כתובת, תמונת פרופיל ומידע בריאותי רלוונטי.</li>
            <li><strong>מידע על שימוש:</strong> פעילות באתר, חיפושים, הזמנות, העדפות ואינטראקציות עם ספקי שירות.</li>
            <li><strong>מידע טכני:</strong> כתובת IP, סוג דפדפן, מכשיר, מערכת הפעלה ועוגיות.</li>
            <li><strong>מידע מיקום:</strong> מיקום גיאוגרפי (באישורכם) לצורך חיפוש ספקים קרובים.</li>
          </ul>

          <h2 className="font-heading text-carefd-navy">2. שימוש במידע</h2>
          <p>אנו משתמשים במידע שלכם למטרות הבאות:</p>
          <ul>
            <li>מתן שירותי הפלטפורמה - חיפוש ספקים, הזמנת שירותים, תקשורת.</li>
            <li>שיפור חוויית המשתמש והתאמה אישית של השירות.</li>
            <li>שליחת הודעות והתראות הקשורות לשירות.</li>
            <li>אימות זהות ספקי שירות ומניעת הונאות.</li>
            <li>ניתוח סטטיסטי ושיפור הפלטפורמה.</li>
          </ul>

          <h2 className="font-heading text-carefd-navy">3. שיתוף מידע</h2>
          <p>
            אנחנו לא מוכרים את המידע האישי שלכם. אנו עשויים לשתף מידע עם:
          </p>
          <ul>
            <li>ספקי שירות שהזמנתם מהם (רק מידע רלוונטי להזמנה).</li>
            <li>ספקי שירותי צד שלישי הנחוצים להפעלת הפלטפורמה (אחסון, תשלומים).</li>
            <li>רשויות חוק במקרים הנדרשים על פי דין.</li>
          </ul>

          <h2 className="font-heading text-carefd-navy">4. אבטחת מידע</h2>
          <p>
            אנו נוקטים באמצעי אבטחה מתקדמים כולל הצפנת SSL/TLS, הצפנת סיסמאות (bcrypt),
            הגבלת גישה למידע ובקרת אבטחה שוטפת.
          </p>

          <h2 className="font-heading text-carefd-navy">5. שמירת מידע</h2>
          <p>
            אנו שומרים את המידע שלכם כל עוד החשבון שלכם פעיל או כנדרש לצורך מתן השירותים.
            ניתן לבקש מחיקת חשבון ומידע אישי בכל עת.
          </p>

          <h2 className="font-heading text-carefd-navy">6. עוגיות (Cookies)</h2>
          <p>
            האתר משתמש בעוגיות לצורך אימות, שמירת העדפות ושיפור השירות.
            ניתן לשלוט בעוגיות דרך הגדרות הדפדפן שלכם.
          </p>

          <h2 className="font-heading text-carefd-navy">7. זכויות המשתמש</h2>
          <p>יש לכם את הזכות:</p>
          <ul>
            <li>לעיין במידע האישי שלכם ולבקש עותק שלו.</li>
            <li>לתקן מידע שגוי.</li>
            <li>לבקש מחיקת המידע שלכם.</li>
            <li>להתנגד לעיבוד מידע לצורכי שיווק.</li>
          </ul>

          <h2 className="font-heading text-carefd-navy">8. יצירת קשר</h2>
          <p>
            לשאלות בנוגע למדיניות פרטיות זו, ניתן לפנות אלינו דרך דף יצירת הקשר באתר.
          </p>
        </div>
      )}
    </div>
  );
}
