export default function PrivacyPage() {
  return (
    <div className="container-main py-16 max-w-4xl">
      <h1 className="mb-8">מדיניות פרטיות</h1>
      <div className="prose prose-lg max-w-none text-slate-600 space-y-6 leading-relaxed">
        <p>CareFD מכבדת את פרטיותכם. מדיניות זו מתארת כיצד אנו אוספים, משתמשים ומגנים על המידע האישי שלכם.</p>
        <h2 className="font-heading text-carefd-navy">1. מידע שאנו אוספים</h2>
        <p>אנו אוספים מידע שאתם מוסרים לנו ישירות: שם, אימייל, טלפון, ומידע הנוגע להזמנות שירותים.</p>
        <h2 className="font-heading text-carefd-navy">2. שימוש במידע</h2>
        <p>המידע משמש לצורך מתן השירותים, שיפור חוויית המשתמש, ותקשורת איתכם בנוגע להזמנות.</p>
        <h2 className="font-heading text-carefd-navy">3. אבטחת מידע</h2>
        <p>אנו נוקטים באמצעי אבטחה מתקדמים להגנה על המידע האישי שלכם, כולל הצפנה ואחסון מאובטח.</p>
      </div>
    </div>
  );
}
