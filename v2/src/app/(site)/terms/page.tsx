"use client";

import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import api from "@/lib/api-client";

export default function TermsPage() {
  const [dbContent, setDbContent] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ content?: string }>("/pages/terms")
      .then((d) => {
        if (d?.content) setDbContent(DOMPurify.sanitize(d.content));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="container-main py-16 max-w-4xl">
      <h1 className="mb-8">תנאי שימוש</h1>
      <p className="text-sm text-carefd-gray mb-8">עדכון אחרון: אפריל 2026</p>

      {dbContent ? (
        <div
          className="prose prose-lg max-w-none text-slate-600 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: dbContent }}
        />
      ) : (
        <div className="prose prose-lg max-w-none text-slate-600 space-y-6 leading-relaxed">
          <p>
            ברוכים הבאים ל-CareFD (&quot;האתר&quot;, &quot;הפלטפורמה&quot;). השימוש באתר ובשירותים שלנו
            כפוף לתנאי השימוש המפורטים להלן. אנא קראו אותם בעיון.
          </p>

          <h2 className="font-heading text-carefd-navy">1. הגדרות</h2>
          <p>
            &quot;הפלטפורמה&quot; - אתר CareFD והאפליקציה הנלווית.
            &quot;ספק שירות&quot; - נותן שירותי בריאות הרשום בפלטפורמה.
            &quot;משתמש&quot; - כל אדם המשתמש בפלטפורמה.
            &quot;הזמנה&quot; - בקשה לקבלת שירות דרך הפלטפורמה.
          </p>

          <h2 className="font-heading text-carefd-navy">2. תיאור השירותים</h2>
          <p>
            CareFD מספקת פלטפורמה טכנולוגית לחיבור בין מטופלים לנותני שירותי בריאות.
            הפלטפורמה אינה מספקת שירותי בריאות בעצמה ואינה אחראית לאיכות השירותים הניתנים
            על ידי ספקי השירות.
          </p>

          <h2 className="font-heading text-carefd-navy">3. הרשמה וחשבון משתמש</h2>
          <ul>
            <li>ההרשמה לאתר פתוחה לכל אדם מעל גיל 18.</li>
            <li>עליכם למסור פרטים מדויקים ועדכניים בעת ההרשמה.</li>
            <li>אתם אחראים לשמור על סודיות פרטי החשבון שלכם.</li>
            <li>אנו שומרים את הזכות לסגור חשבונות שמפרים את תנאי השימוש.</li>
          </ul>

          <h2 className="font-heading text-carefd-navy">4. ספקי שירות</h2>
          <ul>
            <li>ספקי שירות עוברים תהליך אימות לפני הופעתם בפלטפורמה.</li>
            <li>הספקים אחראים לדיוק המידע שהם מפרסמים.</li>
            <li>הספקים אחראים לעמוד בכל דרישות החוק והרגולציה הרלוונטיות.</li>
          </ul>

          <h2 className="font-heading text-carefd-navy">5. הזמנות וביטולים</h2>
          <ul>
            <li>ביצוע הזמנה דרך הפלטפורמה מהווה הסכמה לתנאי השירות של הספק.</li>
            <li>ביטול הזמנה כפוף למדיניות הביטול של כל ספק שירות בנפרד.</li>
            <li>CareFD אינה אחראית לסכסוכים בין משתמשים לספקי שירות.</li>
          </ul>

          <h2 className="font-heading text-carefd-navy">6. תשלומים</h2>
          <p>
            התשלום עבור שירותים מתבצע ישירות בין המשתמש לספק השירות, אלא אם צוין אחרת.
            CareFD אינה צד לעסקה הכספית.
          </p>

          <h2 className="font-heading text-carefd-navy">7. ביקורות ודירוגים</h2>
          <ul>
            <li>משתמשים רשאים לפרסם ביקורות ודירוגים לגבי ספקי שירות.</li>
            <li>ביקורות חייבות לשקף חוויה אמיתית ולהיות ענייניות.</li>
            <li>CareFD שומרת את הזכות להסיר ביקורות שמפרות את מדיניות התוכן.</li>
          </ul>

          <h2 className="font-heading text-carefd-navy">8. הגבלת אחריות</h2>
          <p>
            CareFD אינה אחראית לנזקים ישירים או עקיפים הנובעים משימוש בפלטפורמה או
            מהשירותים הניתנים על ידי ספקי השירות. השימוש בפלטפורמה הוא על אחריות המשתמש.
          </p>

          <h2 className="font-heading text-carefd-navy">9. קניין רוחני</h2>
          <p>
            כל התכנים, העיצובים, הלוגואים והקוד באתר הם רכוש CareFD ומוגנים בזכויות יוצרים.
            אין להעתיק, לשכפל או להפיץ תכנים מהאתר ללא אישור מראש.
          </p>

          <h2 className="font-heading text-carefd-navy">10. שינויים בתנאי השימוש</h2>
          <p>
            CareFD שומרת את הזכות לעדכן את תנאי השימוש מעת לעת.
            שינויים מהותיים יפורסמו באתר ויכנסו לתוקף 30 יום מפרסומם.
          </p>

          <h2 className="font-heading text-carefd-navy">11. יצירת קשר</h2>
          <p>
            לשאלות בנוגע לתנאי שימוש אלו, ניתן לפנות אלינו דרך דף יצירת הקשר באתר.
          </p>
        </div>
      )}
    </div>
  );
}
