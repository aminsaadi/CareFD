import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { FaMapMarkerAlt, FaUserMd, FaCalendarCheck, FaArrowLeft, FaChevronLeft } from 'react-icons/fa';

const SPLASH_KEY = 'carezone_onboarding_seen';

const slides = [
  {
    icon: FaMapMarkerAlt,
    color: 'from-carelink-teal to-emerald-500',
    title: 'מצא ספקי שירות בקרבתך',
    description: 'חפש רופאים, אחיות, פיזיותרפיסטים ועוד מאות ספקי שירותי בריאות לפי מיקום ומקצוע',
  },
  {
    icon: FaUserMd,
    color: 'from-blue-500 to-indigo-500',
    title: 'ספקים מאומתים ומדורגים',
    description: 'כל הספקים עוברים אימות מקצועי. צפה בביקורות ודירוגים מלקוחות אמיתיים',
  },
  {
    icon: FaCalendarCheck,
    color: 'from-purple-500 to-pink-500',
    title: 'הזמן תור בקלות',
    description: 'הזמן שירותים ישירות דרך האפליקציה - ביקור בית, ייעוץ מרחוק, או במרפאה',
  },
];

export const shouldShowSplash = () => {
  // Show splash only in standalone (PWA installed) mode on first launch
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
  const hasSeen = localStorage.getItem(SPLASH_KEY);
  return isStandalone && !hasSeen;
};

const SplashScreen = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const { settings: siteSettings } = useSiteSettings();
  const navigate = useNavigate();

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      handleFinish();
    }
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = () => {
    localStorage.setItem(SPLASH_KEY, 'true');
    if (onComplete) {
      onComplete();
    } else {
      navigate('/');
    }
  };

  const slide = slides[currentSlide];
  const SlideIcon = slide.icon;
  const isLast = currentSlide === slides.length - 1;

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-safe">
        <button
          onClick={handleSkip}
          className="text-carelink-gray hover:text-carelink-teal text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
        >
          דלג
        </button>
        <div className="flex items-center gap-2">
          {siteSettings.logo_url ? (
            <img src={siteSettings.logo_url} alt={siteSettings.site_name || 'CareLink'} className="h-8 w-auto" />
          ) : (
            <span className="text-xl font-bold text-carelink-navy">{siteSettings.site_name || 'CareLink'}</span>
          )}
        </div>
        <div className="w-16"></div>
      </div>

      {/* Slide Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Icon */}
        <div
          className={`w-32 h-32 rounded-3xl bg-gradient-to-br ${slide.color} flex items-center justify-center mb-10 shadow-xl transition-all duration-300`}
          style={{
            transform: isAnimating ? 'scale(0.9)' : 'scale(1)',
            opacity: isAnimating ? 0.7 : 1,
          }}
        >
          <SlideIcon className="text-white text-5xl" />
        </div>

        {/* Text */}
        <h2
          className="text-2xl font-bold text-carelink-navy text-center mb-4 font-heading transition-opacity duration-300"
          style={{ opacity: isAnimating ? 0 : 1 }}
        >
          {slide.title}
        </h2>
        <p
          className="text-carelink-gray text-center max-w-sm leading-relaxed transition-opacity duration-300"
          style={{ opacity: isAnimating ? 0 : 1 }}
        >
          {slide.description}
        </p>
      </div>

      {/* Bottom Section */}
      <div className="p-6 pb-safe">
        {/* Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => { setIsAnimating(true); setCurrentSlide(idx); setTimeout(() => setIsAnimating(false), 300); }}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentSlide
                  ? 'w-8 bg-carelink-teal'
                  : 'w-2 bg-gray-200 hover:bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleNext}
          className="w-full bg-gradient-to-l from-carelink-teal to-carelink-teal-medium text-white py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
        >
          {isLast ? (
            <>
              בואו נתחיל
              <FaArrowLeft className="rtl:rotate-180" />
            </>
          ) : (
            <>
              הבא
              <FaChevronLeft />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SplashScreen;
