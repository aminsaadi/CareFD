import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-4">CareFD</h3>
            <p className="text-sm">פלטפורמת שירותי בריאות מובילה בישראל. חיבור בין מטופלים לנותני שירות מקצועיים.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">קישורים</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/providers" className="hover:text-teal-400">מטפלים</Link></li>
              <li><Link href="/services" className="hover:text-teal-400">שירותים</Link></li>
              <li><Link href="/requests" className="hover:text-teal-400">בקשות שירות</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">מידע</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-teal-400">אודות</Link></li>
              <li><Link href="/contact" className="hover:text-teal-400">צור קשר</Link></li>
              <li><Link href="/terms" className="hover:text-teal-400">תנאי שימוש</Link></li>
              <li><Link href="/privacy" className="hover:text-teal-400">מדיניות פרטיות</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">לספקים</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/register?role=provider" className="hover:text-teal-400">הרשמה כספק</Link></li>
              <li><Link href="/provider/dashboard" className="hover:text-teal-400">לוח בקרה</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} CareFD. כל הזכויות שמורות.</p>
        </div>
      </div>
    </footer>
  );
}
