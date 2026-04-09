"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Cookie, X, Shield } from "lucide-react";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const accepted = localStorage.getItem("cookie-consent");
      if (!accepted) setShow(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const accept = () => { localStorage.setItem("cookie-consent", "accepted"); setShow(false); };
  const decline = () => { localStorage.setItem("cookie-consent", "declined"); setShow(false); };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 start-4 end-4 md:start-auto md:end-6 md:max-w-lg z-50 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-soft-xl border border-slate-100 p-5 relative">
        <button onClick={decline} className="absolute top-3 end-3 text-slate-300 hover:text-slate-500 transition">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-carefd-teal/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Cookie className="w-5 h-5 text-carefd-teal" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-carefd-navy text-sm mb-1">אתר זה משתמש בעוגיות</p>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              אנו משתמשים בעוגיות כדי לשפר את חוויית המשתמש, לנתח תנועה ולהתאים תוכן.
              לפרטים נוספים ראו את{" "}
              <Link href="/privacy" className="text-carefd-teal hover:underline">מדיניות הפרטיות</Link>.
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={accept} className="bg-carefd-teal hover:bg-carefd-teal-medium shadow-glow text-xs px-4">
                <Shield className="w-3 h-3 me-1" />מאשר
              </Button>
              <Button size="sm" variant="ghost" onClick={decline} className="text-xs text-slate-400">
                דחה
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
