import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => changeLanguage('he')}
        className={`px-3 py-1 rounded ${
          i18n.language === 'he'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
        data-testid="lang-he-btn"
      >
        עברית
      </button>
      <button
        onClick={() => changeLanguage('ar')}
        className={`px-3 py-1 rounded ${
          i18n.language === 'ar'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
        data-testid="lang-ar-btn"
      >
        العربية
      </button>
    </div>
  );
};

export default LanguageSwitcher;