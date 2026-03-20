import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaFileContract, FaUserCheck, FaExclamationTriangle, FaBan, FaGavel } from 'react-icons/fa';
import { useSiteSettings } from '../context/SiteSettingsContext';

const Terms = () => {
  const { siteName } = useSiteSettings();
  const lastUpdated = '22 בפברואר, 2026';

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Navbar />
      
      {/* Hero */}
      <section className="bg-gradient-to-br from-carelink-navy to-carelink-slate py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <FaFileContract className="text-5xl text-carelink-teal mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">תנאי שימוש</h1>
          <p className="text-carelink-teal-pale">עודכן לאחרונה: {lastUpdated}</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="prose prose-lg max-w-none">
            
            <div className="bg-amber-50 border-r-4 border-amber-400 p-4 rounded-lg mb-8">
              <p className="text-amber-800">
                <strong>חשוב:</strong> השימוש באתר {siteName} מהווה הסכמה לתנאים אלה. אנא קראו אותם בעיון.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-carelink-navy mb-4 flex items-center gap-2">
              <FaUserCheck className="text-carelink-teal" />
              1. הגדרות ופרשנות
            </h2>
            <ul className="list-disc list-inside text-carelink-slate mb-8 space-y-2">
              <li><strong>"האתר"</strong> - אתר {siteName} ו/או האפליקציה</li>
              <li><strong>"משתמש"</strong> - כל אדם המשתמש באתר</li>
              <li><strong>"ספק"</strong> - נותן שירות הרשום באתר</li>
              <li><strong>"שירותים"</strong> - השירותים המוצעים דרך האתר</li>
            </ul>

            <h2 className="text-2xl font-bold text-carelink-navy mb-4">2. השימוש באתר</h2>
            <p className="text-carelink-slate mb-4">השימוש באתר מותר למשתמשים מעל גיל 18. המשתמש מתחייב:</p>
            <ul className="list-disc list-inside text-carelink-slate mb-8 space-y-2">
              <li>לספק מידע נכון ומדויק</li>
              <li>לשמור על סודיות פרטי ההתחברות</li>
              <li>לא להשתמש באתר לפעילות בלתי חוקית</li>
              <li>לא להעתיק או לשכפל תוכן מהאתר</li>
            </ul>

            <h2 className="text-2xl font-bold text-carelink-navy mb-4">3. הזמנת שירותים</h2>
            <p className="text-carelink-slate mb-8">
              בעת הזמנת שירות דרך האתר, נוצר הסכם ישיר בין המשתמש לספק. 
              {siteName} משמשת כפלטפורמה מתווכת בלבד ואינה צד להסכם זה.
              המשתמש אחראי לבדוק את התאמת הספק והשירות לצרכיו.
            </p>

            <h2 className="text-2xl font-bold text-carelink-navy mb-4">4. תשלומים וביטולים</h2>
            <ul className="list-disc list-inside text-carelink-slate mb-8 space-y-2">
              <li>המחירים המוצגים באתר הם בשקלים חדשים וכוללים מע"מ</li>
              <li>ביטול הזמנה יתבצע בהתאם למדיניות הביטולים של הספק</li>
              <li>החזר כספי יבוצע באמצעי התשלום המקורי</li>
            </ul>

            <h2 className="text-2xl font-bold text-carelink-navy mb-4 flex items-center gap-2">
              <FaExclamationTriangle className="text-carelink-teal" />
              5. הגבלת אחריות
            </h2>
            <p className="text-carelink-slate mb-8">
              {siteName} אינה אחראית לאיכות השירותים הניתנים על ידי הספקים, 
              לנזקים ישירים או עקיפים הנובעים משימוש באתר, 
              או להפסקות זמניות בפעילות האתר.
            </p>

            <h2 className="text-2xl font-bold text-carelink-navy mb-4 flex items-center gap-2">
              <FaBan className="text-carelink-teal" />
              6. שימוש אסור
            </h2>
            <p className="text-carelink-slate mb-4">אסור במפורש:</p>
            <ul className="list-disc list-inside text-carelink-slate mb-8 space-y-2">
              <li>להעלות תוכן פוגעני, מטעה או בלתי חוקי</li>
              <li>לפגוע בפעילות האתר או שרתיו</li>
              <li>להתחזות לאדם אחר</li>
              <li>לאסוף מידע על משתמשים אחרים</li>
            </ul>

            <h2 className="text-2xl font-bold text-carelink-navy mb-4">7. קניין רוחני</h2>
            <p className="text-carelink-slate mb-8">
              כל הזכויות באתר, לרבות סימני מסחר, לוגואים ותכנים, 
              שייכות לבעלי האתר או לבעלי הזכויות בהם. 
              אין להעתיק, לשכפל או להפיץ תוכן מהאתר ללא אישור מראש.
            </p>

            <h2 className="text-2xl font-bold text-carelink-navy mb-4 flex items-center gap-2">
              <FaGavel className="text-carelink-teal" />
              8. דין וסמכות שיפוט
            </h2>
            <p className="text-carelink-slate mb-8">
              על תנאי שימוש אלה יחולו דיני מדינת ישראל. 
              סמכות השיפוט הבלעדית נתונה לבתי המשפט בתל אביב-יפו.
            </p>

            <h2 className="text-2xl font-bold text-carelink-navy mb-4">9. יצירת קשר</h2>
            <p className="text-carelink-slate mb-4">
              לשאלות בנוגע לתנאי השימוש:
            </p>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-carelink-slate">
                <strong>אימייל:</strong> legal@carelink.co.il<br />
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

export default Terms;
