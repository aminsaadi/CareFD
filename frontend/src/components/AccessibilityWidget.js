import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FaUniversalAccess, FaTimes, FaSearchPlus, FaSearchMinus,
  FaAdjust, FaLink, FaFont, FaPause, FaMousePointer,
  FaGripLines, FaUndo, FaKeyboard, FaHighlighter, FaEyeSlash
} from 'react-icons/fa';

const STORAGE_KEY = 'carelink_a11y';

const defaultSettings = {
  fontSize: 0,
  highContrast: false,
  grayscale: false,
  linkHighlight: false,
  readableFont: false,
  stopAnimations: false,
  bigCursor: false,
  readingGuide: false,
  highlightFocus: false,
  hideImages: false,
};

const AccessibilityWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const guideRef = useRef(null);
  const panelRef = useRef(null);

  // Load saved settings
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch {}
  }, []);

  // Apply all settings to document
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Font size
    root.style.fontSize = settings.fontSize === 0
      ? ''
      : `${100 + settings.fontSize * 15}%`;

    // High contrast
    body.classList.toggle('a11y-high-contrast', settings.highContrast);

    // Grayscale
    body.classList.toggle('a11y-grayscale', settings.grayscale);

    // Link highlight
    body.classList.toggle('a11y-link-highlight', settings.linkHighlight);

    // Readable font
    body.classList.toggle('a11y-readable-font', settings.readableFont);

    // Stop animations
    body.classList.toggle('a11y-stop-animations', settings.stopAnimations);

    // Big cursor
    body.classList.toggle('a11y-big-cursor', settings.bigCursor);

    // Highlight focus
    body.classList.toggle('a11y-highlight-focus', settings.highlightFocus);

    // Hide images
    body.classList.toggle('a11y-hide-images', settings.hideImages);

    // Save
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Reading guide mouse follower
  useEffect(() => {
    if (!settings.readingGuide) {
      if (guideRef.current) guideRef.current.style.display = 'none';
      return;
    }
    const guide = guideRef.current;
    if (!guide) return;
    guide.style.display = 'block';

    const handleMove = (e) => {
      guide.style.top = `${e.clientY}px`;
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [settings.readingGuide]);

  // Keyboard: Escape closes panel
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const update = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetAll = () => {
    setSettings(defaultSettings);
    localStorage.removeItem(STORAGE_KEY);
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(defaultSettings);

  const items = [
    {
      icon: FaSearchPlus,
      label: 'הגדלת גופן',
      action: () => update('fontSize', Math.min(settings.fontSize + 1, 5)),
      active: settings.fontSize > 0,
      info: settings.fontSize > 0 ? `+${settings.fontSize}` : null,
    },
    {
      icon: FaSearchMinus,
      label: 'הקטנת גופן',
      action: () => update('fontSize', Math.max(settings.fontSize - 1, -2)),
      active: settings.fontSize < 0,
      info: settings.fontSize < 0 ? `${settings.fontSize}` : null,
    },
    {
      icon: FaAdjust,
      label: 'ניגודיות גבוהה',
      action: () => update('highContrast', !settings.highContrast),
      active: settings.highContrast,
    },
    {
      icon: FaEyeSlash,
      label: 'גווני אפור',
      action: () => update('grayscale', !settings.grayscale),
      active: settings.grayscale,
    },
    {
      icon: FaLink,
      label: 'הדגשת קישורים',
      action: () => update('linkHighlight', !settings.linkHighlight),
      active: settings.linkHighlight,
    },
    {
      icon: FaFont,
      label: 'גופן קריא',
      action: () => update('readableFont', !settings.readableFont),
      active: settings.readableFont,
    },
    {
      icon: FaPause,
      label: 'עצירת אנימציות',
      action: () => update('stopAnimations', !settings.stopAnimations),
      active: settings.stopAnimations,
    },
    {
      icon: FaMousePointer,
      label: 'סמן מוגדל',
      action: () => update('bigCursor', !settings.bigCursor),
      active: settings.bigCursor,
    },
    {
      icon: FaGripLines,
      label: 'מדריך קריאה',
      action: () => update('readingGuide', !settings.readingGuide),
      active: settings.readingGuide,
    },
    {
      icon: FaHighlighter,
      label: 'הדגשת פוקוס',
      action: () => update('highlightFocus', !settings.highlightFocus),
      active: settings.highlightFocus,
    },
    {
      icon: FaEyeSlash,
      label: 'הסתרת תמונות',
      action: () => update('hideImages', !settings.hideImages),
      active: settings.hideImages,
    },
  ];

  return (
    <>
      {/* Reading guide line */}
      <div
        ref={guideRef}
        style={{ display: 'none' }}
        className="fixed left-0 right-0 h-[2px] bg-red-500 opacity-60 pointer-events-none z-[100000]"
        aria-hidden="true"
      />

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-[99999] w-14 h-14 rounded-full bg-blue-700 text-white shadow-lg hover:bg-blue-800 transition-all flex items-center justify-center group focus:outline-none focus:ring-4 focus:ring-blue-400"
        aria-label="תפריט הנגשה"
        data-testid="accessibility-toggle-btn"
        title="הנגשת אתר"
      >
        <FaUniversalAccess className="text-2xl group-hover:scale-110 transition-transform" />
        {hasChanges && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-white" />
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="הגדרות נגישות"
          aria-modal="true"
          className="fixed bottom-24 left-6 z-[99999] w-80 max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-in"
          data-testid="accessibility-panel"
        >
          {/* Header */}
          <div className="bg-blue-700 text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <FaUniversalAccess className="text-xl" />
              <h2 className="font-bold text-lg">הנגשת אתר</h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-blue-600 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="סגור תפריט הנגשה"
              data-testid="accessibility-close-btn"
            >
              <FaTimes />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 p-3 space-y-1.5" role="list">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  role="listitem"
                  onClick={item.action}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    item.active
                      ? 'bg-blue-50 border-2 border-blue-500 text-blue-800'
                      : 'bg-gray-50 border-2 border-transparent text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-pressed={item.active}
                  data-testid={`a11y-${item.label.replace(/\s/g, '-')}`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    item.active ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    <Icon className="text-base" />
                  </div>
                  <span className="font-medium text-sm flex-1">{item.label}</span>
                  {item.info && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                      {item.info}
                    </span>
                  )}
                  {item.active && !item.info && (
                    <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">פעיל</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-4 py-3 flex-shrink-0 flex items-center justify-between bg-gray-50">
            <button
              onClick={resetAll}
              disabled={!hasChanges}
              className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-400 rounded-lg px-2 py-1"
              data-testid="a11y-reset-btn"
            >
              <FaUndo className="text-xs" />
              איפוס הגדרות
            </button>
            <span className="text-[10px] text-gray-400">תקן ישראלי 5568</span>
          </div>
        </div>
      )}
    </>
  );
};

export default AccessibilityWidget;
