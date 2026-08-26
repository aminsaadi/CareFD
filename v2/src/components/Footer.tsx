import Link from "next/link";
import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-carefd-navy text-slate-300 mt-auto">
      <div className="container-main py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-1 mb-4">
              <span className="text-2xl font-heading font-bold text-white">Cared</span>
              <span className="text-2xl font-heading font-bold text-carefd-teal">Z</span>
            </div>
            <p className="text-sm text-carefd-light-gray leading-relaxed">
              זירת המטפלים בישראל. מחברים בין אנשים לנותני שירות בתחומי הרפואה, הבריאות והטיפול.
            </p>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-white mb-4 text-lg">שירותים</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/providers" className="text-carefd-light-gray hover:text-carefd-teal transition-colors">מטפלים</Link></li>
              <li><Link href="/services" className="text-carefd-light-gray hover:text-carefd-teal transition-colors">שירותים</Link></li>
              <li><Link href="/requests" className="text-carefd-light-gray hover:text-carefd-teal transition-colors">בקשות שירות</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-white mb-4 text-lg">מידע</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/about" className="text-carefd-light-gray hover:text-carefd-teal transition-colors">אודות</Link></li>
              <li><Link href="/contact" className="text-carefd-light-gray hover:text-carefd-teal transition-colors">צור קשר</Link></li>
              <li><Link href="/terms" className="text-carefd-light-gray hover:text-carefd-teal transition-colors">תנאי שימוש</Link></li>
              <li><Link href="/privacy" className="text-carefd-light-gray hover:text-carefd-teal transition-colors">מדיניות פרטיות</Link></li>
              <li><Link href="/accessibility" className="text-carefd-light-gray hover:text-carefd-teal transition-colors">הצהרת נגישות</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-white mb-4 text-lg">לנותני שירות</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/register?role=provider" className="text-carefd-light-gray hover:text-carefd-teal transition-colors">הצטרפות כנותן שירות</Link></li>
              <li><Link href="/provider/dashboard" className="text-carefd-light-gray hover:text-carefd-teal transition-colors">לוח בקרה</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-carefd-slate/30 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-carefd-gray">&copy; {new Date().getFullYear()} CaredZ. כל הזכויות שמורות.</p>
          <p className="text-sm text-carefd-gray flex items-center gap-1">נבנה עם <Heart className="w-3.5 h-3.5 text-carefd-teal fill-carefd-teal" /> בישראל</p>
        </div>
      </div>
    </footer>
  );
}
