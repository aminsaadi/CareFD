import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaGlobe, FaChevronDown, FaCheck } from 'react-icons/fa';

const languages = [
  { code: 'he', name: 'עברית', flag: '🇮🇱' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'en', name: 'English', flag: '🇺🇸' }
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    const rtlLanguages = ['he', 'ar'];
    const dir = rtlLanguages.includes(lng) ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = lng;
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-carelink-teal-pale/30 hover:bg-carelink-teal-pale/50 text-carelink-navy transition-colors"
        data-testid="language-dropdown-btn"
      >
        <FaGlobe className="text-carelink-teal" />
        <span className="text-sm font-medium">{currentLang.flag} {currentLang.name}</span>
        <FaChevronDown className={`text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 rtl:right-auto rtl:left-0 bg-white rounded-xl shadow-lg border border-carelink-teal-pale overflow-hidden z-50 min-w-[160px]">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-carelink-teal-pale/30 transition-colors ${
                i18n.language === lang.code ? 'bg-carelink-teal-pale/20 text-carelink-teal' : 'text-carelink-navy'
              }`}
              data-testid={`lang-${lang.code}-btn`}
            >
              <span className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span className="font-medium">{lang.name}</span>
              </span>
              {i18n.language === lang.code && <FaCheck className="text-carelink-teal" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
