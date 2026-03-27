import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import { toast } from 'sonner';
import {
  FiSave, FiSmartphone, FiImage, FiHome, FiDroplet,
  FiUpload, FiTrash2, FiType, FiLayout
} from 'react-icons/fi';

const AdminAppSettings = () => {
  const [settings, setSettings] = useState({
    app_name: 'CareFD',
    app_short_name: 'CareFD',
    app_description: '',
    app_icon_url: '',
    app_theme_color: '#19B8BA',
    app_background_color: '#ffffff',
    app_primary_color: '#19B8BA',
    app_secondary_color: '#1E4D5F',
    app_accent_color: '#D4B483',
    home_hero_title: '',
    home_hero_subtitle: '',
    home_hero_image: '',
    home_cta_text: '',
    home_cta_url: '',
    home_show_search: true,
    home_show_categories: true,
    home_show_featured: true,
    home_show_stats: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('name');
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const iconInputRef = React.useRef(null);
  const heroInputRef = React.useRef(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/settings');
      if (response.data) {
        setSettings(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await api.put('/admin/settings', settings);
      toast.success('הגדרות האפליקציה נשמרו בהצלחה!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('שגיאה בשמירת ההגדרות');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = async (file, type) => {
    const setUploading = type === 'icon' ? setUploadingIcon : setUploadingHero;
    const settingKey = type === 'icon' ? 'app_icon_url' : 'home_hero_image';

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      toast.error('סוג קובץ לא נתמך. השתמש ב-PNG, JPG, WebP, GIF או SVG');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('הקובץ גדול מדי (מקסימום 5MB)');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateSetting(settingKey, res.data.url);
      toast.success(type === 'icon' ? 'האייקון הועלה בהצלחה!' : 'התמונה הועלתה בהצלחה!');
    } catch (error) {
      console.error(`Failed to upload ${type}:`, error);
      toast.error('שגיאה בהעלאת הקובץ');
    } finally {
      setUploading(false);
    }
  };

  const tabs = [
    { id: 'name', label: 'שם אפליקציה', icon: FiType },
    { id: 'icon', label: 'איקון אפליקציה', icon: FiImage },
    { id: 'home', label: 'מסך הבית', icon: FiHome },
    { id: 'colors', label: 'צבעים', icon: FiDroplet },
  ];

  const ColorPicker = ({ label, description, settingKey, value }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex-1">
        <p className="text-carefd-navy font-medium">{label}</p>
        {description && <p className="text-carefd-slate text-sm mt-0.5">{description}</p>}
        <p className="text-carefd-gray text-xs mt-1 font-mono" dir="ltr">{value}</p>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => updateSetting(settingKey, e.target.value)}
          className="w-24 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center font-mono focus:border-carefd-teal outline-none"
          dir="ltr"
          placeholder="#000000"
        />
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => updateSetting(settingKey, e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
          <div
            className="w-10 h-10 rounded-lg border-2 border-gray-300 cursor-pointer shadow-inner"
            style={{ backgroundColor: value }}
          />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="w-12 h-12 border-4 border-carefd-teal border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-carefd-navy">הגדרות אפליקציה</h1>
            <p className="text-carefd-slate mt-1">שם, איקון, מסך הבית וצבעים</p>
          </div>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-carefd-teal text-white rounded-lg hover:bg-carefd-teal/90 transition shadow-md disabled:opacity-50"
          >
            <FiSave size={18} />
            {saving ? 'שומר...' : 'שמור הגדרות'}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Tabs */}
          <div className="lg:w-56 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                    activeTab === tab.id
                      ? 'bg-carefd-teal text-white shadow-md'
                      : 'text-carefd-slate hover:text-carefd-navy hover:bg-gray-50'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm p-6">

            {/* App Name Tab */}
            {activeTab === 'name' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-carefd-navy mb-4">שם האפליקציה</h2>

                <div>
                  <label className="block text-sm text-carefd-slate mb-2">שם מלא</label>
                  <input
                    type="text"
                    value={settings.app_name}
                    onChange={(e) => updateSetting('app_name', e.target.value)}
                    placeholder="CareFD - שירותי בריאות"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                  />
                  <p className="text-xs text-carefd-gray mt-1">השם המלא שיופיע בהתקנת האפליקציה</p>
                </div>

                <div>
                  <label className="block text-sm text-carefd-slate mb-2">שם קצר</label>
                  <input
                    type="text"
                    value={settings.app_short_name}
                    onChange={(e) => updateSetting('app_short_name', e.target.value)}
                    placeholder="CareFD"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                  />
                  <p className="text-xs text-carefd-gray mt-1">השם שיופיע מתחת לאייקון במסך הבית של המכשיר</p>
                </div>

                <div>
                  <label className="block text-sm text-carefd-slate mb-2">תיאור אפליקציה</label>
                  <textarea
                    value={settings.app_description}
                    onChange={(e) => updateSetting('app_description', e.target.value)}
                    placeholder="מחברים בין מטופלים לספקי שירותי בריאות"
                    rows={3}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none resize-none"
                  />
                  <p className="text-xs text-carefd-gray mt-1">תיאור שיופיע בחנויות אפליקציות ובתוצאות חיפוש</p>
                </div>

                {/* Preview */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-carefd-slate mb-3">תצוגה מקדימה - התקנת אפליקציה:</p>
                  <div className="bg-white rounded-xl shadow-lg p-4 max-w-sm mx-auto border">
                    <div className="flex items-center gap-3">
                      {settings.app_icon_url ? (
                        <img src={settings.app_icon_url} alt="App icon" className="w-12 h-12 rounded-xl object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-carefd-teal to-carefd-navy flex items-center justify-center">
                          <FiSmartphone className="text-white" size={20} />
                        </div>
                      )}
                      <div>
                        <p className="text-carefd-navy font-semibold text-sm">{settings.app_name || 'CareFD'}</p>
                        <p className="text-carefd-gray text-xs">{settings.app_description || 'תיאור האפליקציה'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* App Icon Tab */}
            {activeTab === 'icon' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-carefd-navy mb-4">איקון האפליקציה</h2>

                <div>
                  <label className="block text-sm text-carefd-slate mb-2">איקון (PWA)</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={settings.app_icon_url}
                      onChange={(e) => updateSetting('app_icon_url', e.target.value)}
                      placeholder="https://example.com/icon.png"
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                      dir="ltr"
                    />
                    <input
                      ref={iconInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files[0]) handleFileUpload(e.target.files[0], 'icon');
                        e.target.value = '';
                      }}
                    />
                    <button
                      onClick={() => iconInputRef.current?.click()}
                      disabled={uploadingIcon}
                      className="px-4 py-2.5 bg-white border border-gray-200 text-carefd-slate rounded-lg hover:bg-gray-50 transition flex items-center gap-2 disabled:opacity-50"
                    >
                      <FiUpload size={18} />
                      {uploadingIcon ? 'מעלה...' : 'העלה'}
                    </button>
                    {settings.app_icon_url && (
                      <button
                        onClick={() => updateSetting('app_icon_url', '')}
                        className="px-3 py-2.5 bg-white border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition"
                        title="הסר איקון"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-carefd-gray mt-1">מומלץ: תמונה מרובעת 512x512 פיקסלים (PNG)</p>
                </div>

                {/* Icon Preview */}
                {settings.app_icon_url && (
                  <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-carefd-slate mb-4">תצוגה מקדימה:</p>
                    <div className="flex items-end gap-8 justify-center">
                      {/* Large */}
                      <div className="text-center">
                        <img
                          src={settings.app_icon_url}
                          alt="App icon 512"
                          className="w-32 h-32 rounded-2xl object-cover shadow-lg mx-auto"
                        />
                        <p className="text-xs text-carefd-gray mt-2">512x512</p>
                      </div>
                      {/* Medium */}
                      <div className="text-center">
                        <img
                          src={settings.app_icon_url}
                          alt="App icon 192"
                          className="w-16 h-16 rounded-xl object-cover shadow-md mx-auto"
                        />
                        <p className="text-xs text-carefd-gray mt-2">192x192</p>
                      </div>
                      {/* Small - home screen simulation */}
                      <div className="text-center">
                        <img
                          src={settings.app_icon_url}
                          alt="App icon home"
                          className="w-12 h-12 rounded-lg object-cover shadow mx-auto"
                        />
                        <p className="text-[10px] text-carefd-navy mt-1 font-medium">{settings.app_short_name || 'CareFD'}</p>
                        <p className="text-xs text-carefd-gray mt-1">מסך בית</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-blue-700 text-sm">
                    <strong>שים לב:</strong> האייקון ישמש כאייקון האפליקציה כשמשתמשים מתקינים אותה על המכשיר שלהם (PWA).
                    לתוצאות הטובות ביותר, השתמש בתמונה מרובעת וברורה.
                  </p>
                </div>
              </div>
            )}

            {/* Home Screen Tab */}
            {activeTab === 'home' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-carefd-navy mb-4">מסך הבית</h2>

                <div>
                  <label className="block text-sm text-carefd-slate mb-2">כותרת ראשית (Hero)</label>
                  <input
                    type="text"
                    value={settings.home_hero_title}
                    onChange={(e) => updateSetting('home_hero_title', e.target.value)}
                    placeholder="מצא את ספק השירות המתאים לך"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-carefd-slate mb-2">תת כותרת</label>
                  <input
                    type="text"
                    value={settings.home_hero_subtitle}
                    onChange={(e) => updateSetting('home_hero_subtitle', e.target.value)}
                    placeholder="חפש ומצא ספקי שירותי בריאות באזורך"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                  />
                </div>

                {/* Hero Image */}
                <div>
                  <label className="block text-sm text-carefd-slate mb-2">תמונת רקע (Hero)</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={settings.home_hero_image}
                      onChange={(e) => updateSetting('home_hero_image', e.target.value)}
                      placeholder="https://example.com/hero.jpg"
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                      dir="ltr"
                    />
                    <input
                      ref={heroInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files[0]) handleFileUpload(e.target.files[0], 'hero');
                        e.target.value = '';
                      }}
                    />
                    <button
                      onClick={() => heroInputRef.current?.click()}
                      disabled={uploadingHero}
                      className="px-4 py-2.5 bg-white border border-gray-200 text-carefd-slate rounded-lg hover:bg-gray-50 transition flex items-center gap-2 disabled:opacity-50"
                    >
                      <FiUpload size={18} />
                      {uploadingHero ? 'מעלה...' : 'העלה'}
                    </button>
                    {settings.home_hero_image && (
                      <button
                        onClick={() => updateSetting('home_hero_image', '')}
                        className="px-3 py-2.5 bg-white border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    )}
                  </div>
                  {settings.home_hero_image && (
                    <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-carefd-slate mb-2">תצוגה מקדימה:</p>
                      <img src={settings.home_hero_image} alt="Hero preview" className="h-32 object-cover rounded-lg w-full" />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-carefd-slate mb-2">טקסט כפתור CTA</label>
                    <input
                      type="text"
                      value={settings.home_cta_text}
                      onChange={(e) => updateSetting('home_cta_text', e.target.value)}
                      placeholder="חפש עכשיו"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-carefd-slate mb-2">קישור כפתור CTA</label>
                    <input
                      type="text"
                      value={settings.home_cta_url}
                      onChange={(e) => updateSetting('home_cta_url', e.target.value)}
                      placeholder="/providers"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Home Screen Sections */}
                <div>
                  <h3 className="text-sm font-medium text-carefd-navy mb-3">סקשנים במסך הבית</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'home_show_search', label: 'חיפוש', description: 'הצג שדה חיפוש בדף הבית' },
                      { key: 'home_show_categories', label: 'קטגוריות', description: 'הצג קטגוריות מקצועות' },
                      { key: 'home_show_featured', label: 'ספקים מומלצים', description: 'הצג ספקים מובלטים' },
                      { key: 'home_show_stats', label: 'סטטיסטיקות', description: 'הצג מספרים ונתונים' },
                    ].map(({ key, label, description }) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <p className="text-carefd-navy font-medium">{label}</p>
                          <p className="text-carefd-slate text-sm">{description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings[key]}
                            onChange={(e) => updateSetting(key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-carefd-teal"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Colors Tab */}
            {activeTab === 'colors' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-carefd-navy mb-4">צבעי האפליקציה</h2>

                <div className="space-y-4">
                  <ColorPicker
                    label="צבע ראשי (Primary)"
                    description="כפתורים, קישורים, אלמנטים פעילים"
                    settingKey="app_primary_color"
                    value={settings.app_primary_color}
                  />
                  <ColorPicker
                    label="צבע משני (Secondary)"
                    description="כותרות, טקסט כהה, רקע navbar"
                    settingKey="app_secondary_color"
                    value={settings.app_secondary_color}
                  />
                  <ColorPicker
                    label="צבע הדגשה (Accent)"
                    description="תגיות, התראות, אלמנטים בולטים"
                    settingKey="app_accent_color"
                    value={settings.app_accent_color}
                  />
                </div>

                <hr className="border-gray-200" />

                <h3 className="text-sm font-medium text-carefd-navy">צבעי PWA</h3>
                <div className="space-y-4">
                  <ColorPicker
                    label="צבע ערכת נושא (Theme Color)"
                    description="צבע סרגל הכתובות בדפדפן"
                    settingKey="app_theme_color"
                    value={settings.app_theme_color}
                  />
                  <ColorPicker
                    label="צבע רקע (Background Color)"
                    description="צבע הרקע במסך הטעינה של האפליקציה"
                    settingKey="app_background_color"
                    value={settings.app_background_color}
                  />
                </div>

                {/* Color Preview */}
                <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-carefd-slate mb-4">תצוגה מקדימה:</p>
                  <div className="max-w-sm mx-auto rounded-xl overflow-hidden shadow-lg border">
                    {/* Browser bar */}
                    <div className="h-8 flex items-center px-3 gap-2" style={{ backgroundColor: settings.app_theme_color }}>
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-white/30"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-white/30"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-white/30"></div>
                      </div>
                      <div className="flex-1 bg-white/20 rounded h-4 mx-2"></div>
                    </div>
                    {/* Content */}
                    <div className="p-4" style={{ backgroundColor: settings.app_background_color }}>
                      <div className="h-6 w-24 rounded mb-3" style={{ backgroundColor: settings.app_secondary_color }}></div>
                      <div className="h-3 w-full rounded mb-2 bg-gray-200"></div>
                      <div className="h-3 w-3/4 rounded mb-4 bg-gray-200"></div>
                      <div className="flex gap-2">
                        <div className="h-8 px-4 rounded-lg flex items-center justify-center" style={{ backgroundColor: settings.app_primary_color }}>
                          <span className="text-white text-xs">כפתור ראשי</span>
                        </div>
                        <div className="h-8 px-4 rounded-lg flex items-center justify-center" style={{ backgroundColor: settings.app_accent_color }}>
                          <span className="text-white text-xs">הדגשה</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAppSettings;
