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
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          i18n.language === 'he'
            ? 'bg-carelink-teal text-white'
            : 'bg-carelink-light-gray text-carelink-navy hover:bg-carelink-teal-pale'
        }`}
        data-testid="lang-he-btn"
      >
        עברית
      </button>
      <button
        onClick={() => changeLanguage('ar')}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          i18n.language === 'ar'
            ? 'bg-carelink-teal text-white'
            : 'bg-carelink-light-gray text-carelink-navy hover:bg-carelink-teal-pale'
        }`}
        data-testid="lang-ar-btn"
      >
        العربية
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          i18n.language === 'en'
            ? 'bg-carelink-teal text-white'
            : 'bg-carelink-light-gray text-carelink-navy hover:bg-carelink-teal-pale'
        }`}
        data-testid="lang-en-btn"
      >
        English
      </button>
    </div>
  );
};

export default LanguageSwitcher;