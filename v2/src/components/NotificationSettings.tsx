"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Bell, BellOff, Check, Loader2, CalendarDays, MessageCircle, Shield, Megaphone, Settings, AlertCircle } from "lucide-react";

interface NotificationPreferences {
  new_booking: boolean;
  booking_confirmation: boolean;
  new_message: boolean;
  verification_update: boolean;
  system_updates: boolean;
  marketing: boolean;
}

const defaultPrefs: NotificationPreferences = {
  new_booking: true,
  booking_confirmation: true,
  new_message: true,
  verification_update: true,
  system_updates: true,
  marketing: false,
};

const prefConfig: { key: keyof NotificationPreferences; label: string; description: string; icon: typeof Bell }[] = [
  { key: "new_booking", label: "הזמנה חדשה", description: "התראה כאשר מתקבלת הזמנה חדשה", icon: CalendarDays },
  { key: "booking_confirmation", label: "אישור הזמנה", description: "כאשר הזמנה מאושרת או נדחית", icon: Check },
  { key: "new_message", label: "הודעה חדשה", description: "כאשר מתקבלת הודעת צ׳אט חדשה", icon: MessageCircle },
  { key: "verification_update", label: "עדכון אימות", description: "עדכונים על סטטוס אימות החשבון", icon: Shield },
  { key: "system_updates", label: "עדכוני מערכת", description: "עדכונים טכניים ושדרוגים", icon: Settings },
  { key: "marketing", label: "עדכונים שיווקיים", description: "מבצעים, טיפים וחדשות", icon: Megaphone },
];

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPrefs);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [pushSupported, setPushSupported] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPushSupported(false);
    } else {
      setPushEnabled(Notification.permission === "granted");
    }

    api.get<{ preferences: NotificationPreferences }>("/push/preferences")
      .then((data) => {
        if (data.preferences) setPreferences(data.preferences);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const togglePreference = async (key: keyof NotificationPreferences) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    setSaving(key);
    try {
      await api.put("/push/preferences", updated);
    } catch {
      setPreferences(preferences);
    } finally {
      setTimeout(() => setSaving(null), 500);
    }
  };

  const requestPush = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPushEnabled(permission === "granted");
    } catch {}
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold text-carefd-navy mb-2 flex items-center gap-2">
        <Bell className="w-5 h-5 text-carefd-teal" />
        הגדרות התראות
      </h3>
      <p className="text-sm text-carefd-gray mb-6">בחרו אילו התראות תרצו לקבל</p>

      {/* Push notification status */}
      {!pushSupported ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">הדפדפן שלך לא תומך בהתראות Push</p>
            <p className="text-xs text-amber-600 mt-1">נסו דפדפן אחר או בדקו את ההגדרות</p>
          </div>
        </div>
      ) : !pushEnabled ? (
        <button
          onClick={requestPush}
          className="w-full mb-6 flex items-center justify-center gap-2 py-3 bg-carefd-teal-pale/30 rounded-xl text-sm font-medium text-carefd-navy hover:bg-carefd-teal-pale transition"
        >
          <Bell className="w-4 h-4 text-carefd-teal" />
          הפעל התראות Push
        </button>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-6 flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-700 font-medium">התראות Push מופעלות</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-carefd-teal" />
        </div>
      ) : (
        <div className="space-y-2">
          {prefConfig.map(({ key, label, description, icon: Icon }) => (
            <div
              key={key}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-carefd-teal-pale/10 transition"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-carefd-teal" />
                <div>
                  <p className="text-sm font-medium text-carefd-navy">{label}</p>
                  <p className="text-xs text-carefd-gray">{description}</p>
                </div>
              </div>
              <button
                onClick={() => togglePreference(key)}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  preferences[key] ? "bg-carefd-teal" : "bg-gray-200"
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  preferences[key] ? "start-1" : "start-6"
                }`}>
                  {saving === key && (
                    <Loader2 className="w-3 h-3 animate-spin absolute top-1 start-1 text-carefd-teal" />
                  )}
                </div>
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
