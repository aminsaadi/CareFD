"use client";

import React, { useState, useEffect } from 'react';
import { FiBell, FiBellOff, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';
import usePushNotifications from '@/hooks/usePushNotifications';
import api from '@/lib/api-client';

const NotificationSettings = () => {
  const {
    isSupported,
    isSubscribed,
    permission,
    loading,
    error,
    subscribe,
    unsubscribe
  } = usePushNotifications();
  
  const [preferences, setPreferences] = useState({
    new_booking: true,
    booking_confirmed: true,
    booking_cancelled: true,
    new_message: true,
    provider_verified: true,
    system_updates: true,
    marketing: false
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data } = await api.get('/push/preferences');
      setPreferences(prev => ({ ...prev, ...data }));
    } catch (err: any) {
      console.error('Failed to fetch preferences:', err);
    }
  };

  const savePreferences = async (newPrefs) => {
    setSavingPrefs(true);
    setPrefsSaved(false);
    try {
      await api.put('/push/preferences', newPrefs);
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2000);
    } catch (err: any) {
      console.error('Failed to save preferences:', err);
    } finally {
      setSavingPrefs(false);
    }
  };

  const togglePreference = (key) => {
    const newPrefs = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  const handleSubscriptionToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const preferenceLabels = {
    new_booking: { label: 'הזמנה חדשה', desc: 'קבלו התראה כשמישהו מזמין את השירותים שלכם' },
    booking_confirmed: { label: 'אישור הזמנה', desc: 'קבלו התראה כשהזמנה מאושרת' },
    booking_cancelled: { label: 'ביטול הזמנה', desc: 'קבלו התראה כשהזמנה מבוטלת' },
    new_message: { label: 'הודעה חדשה', desc: 'קבלו התראה על הודעות צ\'אט חדשות' },
    provider_verified: { label: 'אימות ספק', desc: 'קבלו התראה כשהחשבון שלכם מאומת' },
    system_updates: { label: 'עדכוני מערכת', desc: 'קבלו עדכונים חשובים על המערכת' },
    marketing: { label: 'שיווק ומבצעים', desc: 'קבלו התראות על מבצעים ותכנים חדשים' }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6" dir="rtl">
      <h2 className="text-xl font-bold text-carefd-navy mb-4 flex items-center gap-2">
        <FiBell className="text-carefd-teal" />
        הגדרות התראות
      </h2>

      {/* Push Notifications Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-carefd-navy">התראות Push</h3>
            <p className="text-sm text-carefd-gray">
              {!isSupported ? (
                'הדפדפן שלך לא תומך בהתראות Push'
              ) : permission === 'denied' ? (
                'ההתראות חסומות - אנא שנו בהגדרות הדפדפן'
              ) : isSubscribed ? (
                'התראות מופעלות - תקבלו התראות בזמן אמת'
              ) : (
                'התראות כבויות - הפעילו כדי לקבל עדכונים בזמן אמת'
              )}
            </p>
          </div>
          
          <button
            onClick={handleSubscriptionToggle}
            disabled={!isSupported || permission === 'denied' || loading}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
              isSubscribed
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-carefd-teal text-white hover:bg-carefd-teal-medium'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isSubscribed ? (
              <>
                <FiBellOff />
                כבה התראות
              </>
            ) : (
              <>
                <FiBell />
                הפעל התראות
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
            <FiAlertCircle />
            {error}
          </div>
        )}

        {!isSupported && (
          <div className="mt-3 p-3 bg-amber-50 text-amber-700 rounded-lg flex items-center gap-2 text-sm">
            <FiAlertCircle className="flex-shrink-0" />
            <div>
              <p className="font-medium">הדפדפן לא תומך בהתראות Push</p>
              <p className="mt-1">
                {/iPad|iPhone|iPod/.test(navigator.userAgent) 
                  ? 'ב-Safari באייפון: לחצו על כפתור השיתוף ← "הוסף למסך הבית" ← פתחו את האפליקציה משם כדי לקבל התראות'
                  : 'נסו להשתמש ב-Chrome, Firefox או Safari עדכני'
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Notification Preferences */}
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-carefd-navy">סוגי התראות</h3>
          {prefsSaved && (
            <span className="text-sm text-emerald-500 flex items-center gap-1">
              <FiCheck /> נשמר
            </span>
          )}
        </div>

        {Object.entries(preferenceLabels).map(([key, { label, desc }]) => (
          <div
            key={key}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <div>
              <p className="font-medium text-carefd-navy">{label}</p>
              <p className="text-sm text-carefd-gray">{desc}</p>
            </div>
            <button
              onClick={() => togglePreference(key)}
              disabled={savingPrefs}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                preferences[key] ? 'bg-carefd-teal' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  preferences[key] ? 'right-0.5' : 'right-6'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationSettings;
