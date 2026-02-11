import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    const rtlLanguages = ['he', 'ar'];
    const dir = rtlLanguages.includes(lng) ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = lng;
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => changeLanguage('he')}
        className={`px-3 py-1 rounded text-sm ${
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
        className={`px-3 py-1 rounded text-sm ${
          i18n.language === 'ar'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
        data-testid="lang-ar-btn"
      >
        العربية
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1 rounded text-sm ${
          i18n.language === 'en'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
        data-testid="lang-en-btn"
      >
        English
      </button>
    </div>
  );
};

export default LanguageSwitcher;