export default function TermsPage() {
  return (
    <div className="container-main py-16 max-w-4xl">
      <h1 className="mb-8">תנאי שימוש</h1>
      <div className="prose prose-lg max-w-none text-slate-600 space-y-6 leading-relaxed">
        <p>ברוכים הבאים ל-CareFD. השימוש באתר ובשירותים שלנו כפוף לתנאים הבאים.</p>
        <h2 className="font-heading text-primary">1. השירותים</h2>
        <p>CareFD מספקת פלטפורמה לחיבור בין מטופלים לנותני שירותי בריאות. אנחנו לא מספקים שירותי בריאות בעצמנו.</p>
        <h2 className="font-heading text-primary">2. הרשמה</h2>
        <p>הרשמה לאתר מותנית במסירת פרטים מדויקים ועדכניים. אתם אחראים לשמור על סודיות פרטי החשבון שלכם.</p>
        <h2 className="font-heading text-primary">3. ביטול הזמנה</h2>
        <p>ביטול הזמנה כפוף למדיניות הביטול של כל ספק שירות. אנא עיינו בפרטי הספק לפני ביצוע הזמנה.</p>
      </div>
    </div>
  );
}
