"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("cookie-consent");
    if (!accepted) setShow(true);
  }, []);

  const accept = () => { localStorage.setItem("cookie-consent", "true"); setShow(false); };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 start-4 end-4 md:start-auto md:end-6 md:max-w-md z-50 animate-fade-in">
      <div className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Cookie className="w-6 h-6 text-carefd-teal flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-carefd-navy font-medium">אתר זה משתמש בעוגיות</p>
          <p className="text-xs text-carefd-gray mt-0.5">אנו משתמשים בעוגיות לשיפור חוויית המשתמש.</p>
        </div>
        <Button size="sm" onClick={accept}>אישור</Button>
      </div>
    </div>
  );
}
