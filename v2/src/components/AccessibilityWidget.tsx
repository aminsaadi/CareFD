"use client";

import { useState, useEffect, useCallback } from "react";
import { Accessibility, X, RotateCcw, Type, Contrast, Palette, Link2, Eye, MonitorStop, MousePointer, BookOpen, Focus, ImageOff } from "lucide-react";

interface AccessibilitySettings {
  fontSize: number;
  highContrast: boolean;
  grayscale: boolean;
  highlightLinks: boolean;
  readableFont: boolean;
  stopAnimations: boolean;
  bigCursor: boolean;
  readingGuide: boolean;
  focusHighlight: boolean;
  hideImages: boolean;
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 100,
  highContrast: false,
  grayscale: false,
  highlightLinks: false,
  readableFont: false,
  stopAnimations: false,
  bigCursor: false,
  readingGuide: false,
  focusHighlight: false,
  hideImages: false,
};

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);

  const applySettings = useCallback((s: AccessibilitySettings) => {
    const html = document.documentElement;
    const body = document.body;
    html.style.fontSize = `${s.fontSize}%`;
    const toggleClass = (cls: string, on: boolean) => { if (on) body.classList.add(cls); else body.classList.remove(cls); };
    toggleClass("accessibility-high-contrast", s.highContrast);
    toggleClass("accessibility-highlight-links", s.highlightLinks);
    toggleClass("accessibility-readable-font", s.readableFont);
    toggleClass("accessibility-stop-animations", s.stopAnimations);
    toggleClass("accessibility-big-cursor", s.bigCursor);
    toggleClass("accessibility-focus-highlight", s.focusHighlight);
    toggleClass("accessibility-hide-images", s.hideImages);
    body.style.filter = s.grayscale ? "grayscale(100%)" : "";
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("accessibility_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
        applySettings(parsed);
      }
    } catch {}
  }, [applySettings]);

  const updateSetting = <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    applySettings(updated);
    localStorage.setItem("accessibility_settings", JSON.stringify(updated));
  };

  const resetAll = () => {
    setSettings(defaultSettings);
    applySettings(defaultSettings);
    localStorage.removeItem("accessibility_settings");
  };

  const toggleItems: { key: keyof AccessibilitySettings; label: string; icon: typeof Eye }[] = [
    { key: "highContrast", label: "ניגודיות גבוהה", icon: Contrast },
    { key: "grayscale", label: "גווני אפור", icon: Palette },
    { key: "highlightLinks", label: "הדגשת קישורים", icon: Link2 },
    { key: "readableFont", label: "גופן קריא", icon: Type },
    { key: "stopAnimations", label: "עצירת אנימציות", icon: MonitorStop },
    { key: "bigCursor", label: "סמן גדול", icon: MousePointer },
    { key: "readingGuide", label: "מדריך קריאה", icon: BookOpen },
    { key: "focusHighlight", label: "הדגשת מיקוד", icon: Focus },
    { key: "hideImages", label: "הסתרת תמונות", icon: ImageOff },
  ];

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 start-6 z-50 w-12 h-12 bg-carefd-navy text-white rounded-full shadow-lg flex items-center justify-center hover:bg-carefd-slate transition-all hover:scale-110"
        aria-label="הגדרות נגישות"
        title="נגישות"
      >
        <Accessibility className="w-6 h-6" />
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-20 start-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-carefd-navy text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Accessibility className="w-5 h-5" />
              <span className="font-bold">הגדרות נגישות</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={resetAll} className="text-sm text-carefd-teal-pale hover:text-white transition" title="איפוס">
                <RotateCcw className="w-4 h-4" />
              </button>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 rounded p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
            {/* Font Size */}
            <div className="bg-carefd-teal-pale/20 rounded-xl p-3">
              <p className="text-sm font-semibold text-carefd-navy mb-2 flex items-center gap-2">
                <Type className="w-4 h-4 text-carefd-teal" />
                גודל טקסט
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateSetting("fontSize", Math.max(80, settings.fontSize - 10))}
                  className="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center font-bold text-carefd-navy hover:bg-gray-50"
                >
                  A-
                </button>
                <span className="text-sm font-medium text-carefd-navy flex-1 text-center">{settings.fontSize}%</span>
                <button
                  onClick={() => updateSetting("fontSize", Math.min(150, settings.fontSize + 10))}
                  className="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center font-bold text-carefd-navy hover:bg-gray-50"
                >
                  A+
                </button>
              </div>
            </div>

            {/* Toggle options */}
            {toggleItems.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => updateSetting(key, !settings[key])}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  settings[key] ? "bg-carefd-teal text-white" : "bg-carefd-teal-pale/20 text-carefd-navy hover:bg-carefd-teal-pale/40"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-100 text-center">
            <p className="text-xs text-carefd-gray">בהתאם לתקן ישראלי 5568</p>
          </div>
        </div>
      )}

      {/* Reading Guide (mouse follower) */}
      {settings.readingGuide && <ReadingGuide />}
    </>
  );
}

function ReadingGuide() {
  const [y, setY] = useState(0);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => setY(e.clientY);
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  return (
    <div
      className="fixed left-0 right-0 h-10 pointer-events-none z-[9999] border-t-2 border-b-2 border-yellow-400/50 bg-yellow-400/10"
      style={{ top: y - 20 }}
    />
  );
}
