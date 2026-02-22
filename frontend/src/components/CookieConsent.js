import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCookieBite, FaTimes, FaCheck } from 'react-icons/fa';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: true,
    marketing: false
  });

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Delay showing the banner for better UX
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const consentData = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookieConsent', JSON.stringify(consentData));
    setIsVisible(false);
  };

  const handleAcceptSelected = () => {
    const consentData = {
      ...preferences,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookieConsent', JSON.stringify(consentData));
    setIsVisible(false);
  };

  const handleRejectAll = () => {
    const consentData = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookieConsent', JSON.stringify(consentData));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 pointer-events-none" dir="rtl">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 pointer-events-auto"
        onClick={() => {}}
      />
      
      {/* Cookie Banner */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full pointer-events-auto animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="bg-carelink-navy px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaCookieBite className="text-2xl text-carelink-teal" />
            <h3 className="text-lg font-bold text-white">הגדרות עוגיות</h3>
          </div>
          <button 
            onClick={handleRejectAll}
            className="text-white/70 hover:text-white transition"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-carelink-slate mb-4">
            אנו משתמשים בעוגיות כדי לשפר את חוויית הגלישה שלך, לנתח את השימוש באתר ולהציג לך תוכן מותאם אישית. 
            באפשרותך לבחור אילו עוגיות לאפשר.
          </p>

          {/* Cookie Types */}
          {showDetails && (
            <div className="space-y-4 mb-6 border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-semibold text-carelink-navy">עוגיות הכרחיות</h4>
                  <p className="text-sm text-carelink-gray">נדרשות לפעולה תקינה של האתר</p>
                </div>
                <div className="bg-carelink-teal text-white px-3 py-1 rounded-full text-sm">
                  תמיד פעיל
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-semibold text-carelink-navy">עוגיות אנליטיקה</h4>
                  <p className="text-sm text-carelink-gray">עוזרות לנו להבין כיצד גולשים משתמשים באתר</p>
                </div>
                <button
                  onClick={() => setPreferences(p => ({ ...p, analytics: !p.analytics }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    preferences.analytics ? 'bg-carelink-teal' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    preferences.analytics ? 'right-0.5' : 'right-6'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-semibold text-carelink-navy">עוגיות שיווק</h4>
                  <p className="text-sm text-carelink-gray">משמשות להצגת פרסומות רלוונטיות</p>
                </div>
                <button
                  onClick={() => setPreferences(p => ({ ...p, marketing: !p.marketing }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    preferences.marketing ? 'bg-carelink-teal' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    preferences.marketing ? 'right-0.5' : 'right-6'
                  }`} />
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAcceptAll}
              className="flex-1 bg-carelink-teal text-white py-3 px-6 rounded-xl font-semibold hover:bg-carelink-teal-medium transition flex items-center justify-center gap-2"
            >
              <FaCheck />
              קבל הכל
            </button>
            
            {showDetails ? (
              <button
                onClick={handleAcceptSelected}
                className="flex-1 bg-carelink-navy text-white py-3 px-6 rounded-xl font-semibold hover:bg-carelink-slate transition"
              >
                שמור העדפות
              </button>
            ) : (
              <button
                onClick={() => setShowDetails(true)}
                className="flex-1 bg-gray-100 text-carelink-navy py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                התאמה אישית
              </button>
            )}
            
            <button
              onClick={handleRejectAll}
              className="flex-1 border border-gray-300 text-carelink-slate py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition"
            >
              דחה הכל
            </button>
          </div>

          {/* Privacy Link */}
          <p className="text-center text-sm text-carelink-gray mt-4">
            למידע נוסף, קראו את{' '}
            <Link to="/privacy" className="text-carelink-teal hover:underline">
              מדיניות הפרטיות
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CookieConsent;
