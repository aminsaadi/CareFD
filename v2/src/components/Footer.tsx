import Link from "next/link";
import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-primary text-slate-300 mt-auto">
      <div className="container-main py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-1 mb-4">
              <span className="text-2xl font-heading font-bold text-white">Care</span>
              <span className="text-2xl font-heading font-bold text-accent">FD</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              פלטפורמת שירותי בריאות פרמיום בישראל. חיבור בין מטופלים לנותני שירות מקצועיים ומאומתים.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4 text-lg">שירותים</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/providers" className="text-slate-400 hover:text-accent transition-colors">מטפלים</Link></li>
              <li><Link href="/services" className="text-slate-400 hover:text-accent transition-colors">שירותים</Link></li>
              <li><Link href="/requests" className="text-slate-400 hover:text-accent transition-colors">בקשות שירות</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4 text-lg">מידע</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/about" className="text-slate-400 hover:text-accent transition-colors">אודות</Link></li>
              <li><Link href="/contact" className="text-slate-400 hover:text-accent transition-colors">צור קשר</Link></li>
              <li><Link href="/terms" className="text-slate-400 hover:text-accent transition-colors">תנאי שימוש</Link></li>
              <li><Link href="/privacy" className="text-slate-400 hover:text-accent transition-colors">מדיניות פרטיות</Link></li>
            </ul>
          </div>

          {/* Providers */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4 text-lg">לספקים</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/register?role=provider" className="text-slate-400 hover:text-accent transition-colors">הרשמה כספק</Link></li>
              <li><Link href="/provider/dashboard" className="text-slate-400 hover:text-accent transition-colors">לוח בקרה</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-700/50 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} CareFD. כל הזכויות שמורות.
          </p>
          <p className="text-sm text-slate-500 flex items-center gap-1">
            נבנה עם <Heart className="w-3.5 h-3.5 text-accent fill-accent" /> בישראל
          </p>
        </div>
      </div>
    </footer>
  );
}
