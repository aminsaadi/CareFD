"use client";

import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import api from "@/lib/api-client";
import { FileText, UserCheck, AlertTriangle, Ban, Scale } from "lucide-react";

export default function TermsPage() {
  const [dbContent, setDbContent] = useState<string | null>(null);
  const [dbTitle, setDbTitle] = useState<string | null>(null);
  const lastUpdated = "22 בפברואר, 2026";

  useEffect(() => {
    api.get<{ content?: string; title?: string }>("/pages/terms")
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
          <FileText className="w-14 h-14 text-carefd-teal mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">{dbTitle || "תנאי שימוש"}</h1>
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
              <div className="bg-amber-50 border-r-4 border-amber-400 p-4 rounded-lg mb-8 not-prose">
                <p className="text-amber-800">
                  <strong>חשוב:</strong> השימוש באתר CareFD מהווה הסכמה לתנאים אלה. אנא קראו אותם בעיון.
                </p>
              </div>

              <h2 className="text-2xl font-bold text-carefd-navy mb-4 flex items-center gap-2 not-prose">
                <UserCheck className="w-5 h-5 text-carefd-teal" />
                1. הגדרות ופרשנות
              </h2>
              <ul className="list-disc list-inside text-carefd-slate mb-8 space-y-2">
                <li><strong>&quot;האתר&quot;</strong> - אתר CareFD ו/או האפליקציה</li>
                <li><strong>&quot;משתמש&quot;</strong> - כל אדם המשתמש באתר</li>
                <li><strong>&quot;ספק&quot;</strong> - נותן שירות הרשום באתר</li>
                <li><strong>&quot;שירותים&quot;</strong> - השירותים המוצעים דרך האתר</li>
              </ul>

              <h2 className="text-2xl font-bold text-carefd-navy mb-4 not-prose">2. השימוש באתר</h2>
              <p className="text-carefd-slate mb-4">השימוש באתר מותר למשתמשים מעל גיל 18. המשתמש מתחייב:</p>
              <ul className="list-disc list-inside text-carefd-slate mb-8 space-y-2">
                <li>לספק מידע נכון ומדויק</li>
                <li>לשמור על סודיות פרטי ההתחברות</li>
                <li>לא להשתמש באתר לפעילות בלתי חוקית</li>
                <li>לא להעתיק או לשכפל תוכן מהאתר</li>
              </ul>

              <h2 className="text-2xl font-bold text-carefd-navy mb-4 not-prose">3. הזמנת שירותים</h2>
              <p className="text-carefd-slate mb-8">
                בעת הזמנת שירות דרך האתר, נוצר הסכם ישיר בין המשתמש לספק.
                CareFD משמשת כפלטפורמה מתווכת בלבד ואינה צד להסכם זה.
                המשתמש אחראי לבדוק את התאמת הספק והשירות לצרכיו.
              </p>

              <h2 className="text-2xl font-bold text-carefd-navy mb-4 not-prose">4. תשלומים וביטולים</h2>
              <ul className="list-disc list-inside text-carefd-slate mb-8 space-y-2">
                <li>המחירים המוצגים באתר הם בשקלים חדשים וכוללים מע&quot;מ</li>
                <li>ביטול הזמנה יתבצע בהתאם למדיניות הביטולים של הספק</li>
                <li>החזר כספי יבוצע באמצעי התשלום המקורי</li>
              </ul>

              <h2 className="text-2xl font-bold text-carefd-navy mb-4 flex items-center gap-2 not-prose">
                <AlertTriangle className="w-5 h-5 text-carefd-teal" />
                5. הגבלת אחריות
              </h2>
              <p className="text-carefd-slate mb-8">
                CareFD אינה אחראית לאיכות השירותים הניתנים על ידי הספקים,
                לנזקים ישירים או עקיפים הנובעים משימוש באתר,
                או להפסקות זמניות בפעילות האתר.
              </p>

              <h2 className="text-2xl font-bold text-carefd-navy mb-4 flex items-center gap-2 not-prose">
                <Ban className="w-5 h-5 text-carefd-teal" />
                6. שימוש אסור
              </h2>
              <p className="text-carefd-slate mb-4">אסור במפורש:</p>
              <ul className="list-disc list-inside text-carefd-slate mb-8 space-y-2">
                <li>להעלות תוכן פוגעני, מטעה או בלתי חוקי</li>
                <li>לפגוע בפעילות האתר או שרתיו</li>
                <li>להתחזות לאדם אחר</li>
                <li>לאסוף מידע על משתמשים אחרים</li>
              </ul>

              <h2 className="text-2xl font-bold text-carefd-navy mb-4 not-prose">7. קניין רוחני</h2>
              <p className="text-carefd-slate mb-8">
                כל הזכויות באתר, לרבות סימני מסחר, לוגואים ותכנים,
                שייכות לבעלי האתר או לבעלי הזכויות בהם.
                אין להעתיק, לשכפל או להפיץ תוכן מהאתר ללא אישור מראש.
              </p>

              <h2 className="text-2xl font-bold text-carefd-navy mb-4 flex items-center gap-2 not-prose">
                <Scale className="w-5 h-5 text-carefd-teal" />
                8. דין וסמכות שיפוט
              </h2>
              <p className="text-carefd-slate mb-8">
                על תנאי שימוש אלה יחולו דיני מדינת ישראל.
                סמכות השיפוט הבלעדית נתונה לבתי המשפט בתל אביב-יפו.
              </p>

              <h2 className="text-2xl font-bold text-carefd-navy mb-4 not-prose">9. יצירת קשר</h2>
              <p className="text-carefd-slate mb-4">
                לשאלות בנוגע לתנאי השימוש:
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
