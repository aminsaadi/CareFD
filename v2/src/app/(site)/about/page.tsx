export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16" dir="rtl">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">אודות CareFD</h1>
      <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
        <p>CareFD היא פלטפורמת שירותי בריאות מובילה בישראל, המחברת בין מטופלים לנותני שירותים מקצועיים.</p>
        <p>המשימה שלנו היא להפוך את הגישה לשירותי בריאות איכותיים לפשוטה, נגישה ושקופה עבור כל אזרח בישראל.</p>
        <h2 className="text-2xl font-bold text-gray-900 mt-8">מה אנחנו מציעים</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>חיפוש מטפלים לפי מקצוע, מיקום ודירוג</li>
          <li>הזמנת תורים ישירות דרך האתר</li>
          <li>שירותי בריאות בבית, במרפאה ואונליין</li>
          <li>מערכת ביקורות ודירוגים אמינה</li>
          <li>תקשורת ישירה עם נותני השירות</li>
        </ul>
      </div>
    </div>
  );
}
