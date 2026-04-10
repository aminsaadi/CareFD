"use client";

import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import api from "@/lib/api-client";
import { Shield, Lock, Eye, UserCheck, Database, Cookie } from "lucide-react";

export default function PrivacyPage() {
  const [dbContent, setDbContent] = useState<string | null>(null);
  const [dbTitle, setDbTitle] = useState<string | null>(null);
  const lastUpdated = "22 בפברואר, 2026";

  useEffect(() => {
    api.get<{ content?: string; title?: string }>("/pages/privacy")
      .then((d) => {
        if (d?.content) {
          setDbContent(DOMPurify.sanitize(d.content));
          if (d.title) setDbTitle(d.title);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-carefd-navy to-carefd-slate py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Shield className="w-14 h-14 text-carefd-teal mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">{dbTitle || "מדיניות פרטיות"}</h1>
          <p className="text-carefd-teal-pale">עודכן לאחרונה: {lastUpdated}</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {dbContent ? (
            <div
              className="prose prose-lg max-w-none text-carefd-slate"
              dangerouslySetInnerHTML={{ __html: dbContent }}
            />
          ) : (
            <div className="prose prose-lg max-w-none">
              <div className="bg-carefd-teal-pale/20 p-6 rounded-xl mb-8 not-prose">
                <h2 className="text-xl font-bold text-carefd-navy mb-3 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-carefd-teal" />
                  התחייבותנו לפרטיותך
                </h2>
                <p className="text-carefd-slate">
                  ב-CareFD, הפרטיות שלך חשובה לנו. מסמך זה מסביר כיצד אנו אוספים, משתמשים ומגנים על המידע האישי שלך.
                </p>
              </div>

              <h2 className="text-2xl font-bold text-carefd-navy mb-4 flex items-center gap-2 not-prose">
                <Database className="w-5 h-5 text-carefd-teal" />
                איזה מידע אנחנו אוספים?
              </h2>
              <ul className="list-disc list-inside text-carefd-slate mb-8 space-y-2">
                <li><strong>מידע אישי:</strong> שם, כתובת אימייל, מספר טלפון</li>
                <li><strong>מידע על הזמנות:</strong> היסטוריית הזמנות, העדפות שירות</li>
                <li><strong>מידע טכני:</strong> כתובת IP, סוג דפדפן, מכשיר</li>
                <li><strong>מידע מיקום:</strong> רק כאשר אתה מאשר שיתוף מיקום</li>
              </ul>

              <h2 className="text-2xl font-bold text-carefd-navy mb-4 flex items-center gap-2 not-prose">
                <Eye className="w-5 h-5 text-carefd-teal" />
                כיצד אנו משתמשים במידע?
              </h2>
              <ul className="list-disc list-inside text-carefd-slate mb-8 space-y-2">
                <li>לספק ולשפר את השירותים שלנו</li>
                <li>לעבד הזמנות ותשלומים</li>
                <li>לשלוח התראות על הזמנות ועדכונים</li>
                <li>לענות על פניות ותמיכה</li>
                <li>לשפר את חוויית המשתמש</li>
              </ul>

              <h2 className="text-2xl font-bold text-carefd-navy mb-4 flex items-center gap-2 not-prose">
                <UserCheck className="w-5 h-5 text-carefd-teal" />
                שיתוף מידע
              </h2>
              <p className="text-carefd-slate mb-4">
                אנו לא מוכרים את המידע האישי שלך. אנו עשויים לשתף מידע עם:
              </p>
              <ul className="list-disc list-inside text-carefd-slate mb-8 space-y-2">
                <li><strong>ספקי שירות:</strong> כדי לאפשר את ביצוע ההזמנה</li>
                <li><strong>ספקי תשלום:</strong> לעיבוד תשלומים מאובטח</li>
                <li><strong>רשויות:</strong> כנדרש על פי חוק</li>
              </ul>

              <h2 className="text-2xl font-bold text-carefd-navy mb-4 flex items-center gap-2 not-prose">
                <Cookie className="w-5 h-5 text-carefd-teal" />
                עוגיות (Cookies)
              </h2>
              <p className="text-carefd-slate mb-8">
                אנו משתמשים בעוגיות כדי לשפר את חוויית הגלישה שלך, לזכור את ההעדפות שלך ולנתח את השימוש באתר.
                באפשרותך לנהל את הגדרות העוגיות דרך הדפדפן שלך.
              </p>

              <h2 className="text-2xl font-bold text-carefd-navy mb-4 not-prose">הזכויות שלך</h2>
              <p className="text-carefd-slate mb-4">על פי חוק הגנת הפרטיות, יש לך זכות:</p>
              <ul className="list-disc list-inside text-carefd-slate mb-8 space-y-2">
                <li>לעיין במידע שאנו מחזיקים עליך</li>
                <li>לבקש תיקון מידע שגוי</li>
                <li>לבקש מחיקת המידע שלך</li>
                <li>להתנגד לעיבוד מסוים של המידע</li>
              </ul>

              <h2 className="text-2xl font-bold text-carefd-navy mb-4 not-prose">יצירת קשר</h2>
              <p className="text-carefd-slate mb-4">
                לשאלות בנוגע למדיניות הפרטיות, ניתן לפנות אלינו:
              </p>
              <div className="bg-gray-50 p-4 rounded-xl not-prose">
                <p className="text-carefd-slate">
                  <strong>אימייל:</strong> info@carefd.co.il<br />
                  <strong>טלפון:</strong> 03-1234567
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
