"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, Check } from "lucide-react";

const languages = [
  { code: "he", name: "עברית", flag: "🇮🇱", dir: "rtl" },
  { code: "ar", name: "العربية", flag: "🇸🇦", dir: "rtl" },
  { code: "en", name: "English", flag: "🇺🇸", dir: "ltr" },
];

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("he");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("language");
    if (saved) setCurrentLang(saved);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (code: string) => {
    setCurrentLang(code);
    setIsOpen(false);
    localStorage.setItem("language", code);
    const lang = languages.find((l) => l.code === code);
    if (lang) {
      document.documentElement.lang = code;
      document.documentElement.dir = lang.dir;
    }
  };

  const active = languages.find((l) => l.code === currentLang) || languages[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-carefd-teal-pale/30 transition-colors text-carefd-navy"
        aria-label="שנה שפה"
      >
        <Globe className="w-4 h-4" />
        <span>{active.flag}</span>
        <span className="hidden sm:inline">{active.name}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 end-0 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 min-w-[160px] animate-in fade-in slide-in-from-top-2 duration-200">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleChange(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-carefd-teal-pale/20 transition-colors ${
                currentLang === lang.code ? "text-carefd-teal font-medium" : "text-carefd-navy"
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
              {currentLang === lang.code && <Check className="w-4 h-4 ms-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
