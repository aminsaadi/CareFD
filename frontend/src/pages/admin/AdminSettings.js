import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import { toast } from 'sonner';
import {
  FiSave, FiGlobe, FiImage, FiLink, FiMail, FiPhone,
  FiMapPin, FiFacebook, FiInstagram, FiTwitter, FiLinkedin,
  FiYoutube, FiSettings, FiDatabase, FiUpload, FiTrash2
} from 'react-icons/fi';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    site_name: 'CareLink',
    site_tagline: 'Connecting Care Providers',
    logo_url: '',
    favicon_url: '',
    contact_email: 'info@carelink.co.il',
    contact_phone: '03-1234567',
    contact_address: 'תל אביב, ישראל',
    footer_text: '© 2024 CareLink. כל הזכויות שמורות.',
    social_facebook: '',
    social_instagram: '',
    social_twitter: '',
    social_linkedin: '',
    social_youtube: '',
    footer_links: [
      { label: 'אודות', url: '/about' },
      { label: 'תנאי שימוש', url: '/terms' },
      { label: 'מדיניות פרטיות', url: '/privacy' },
      { label: 'צור קשר', url: '/contact' },
    ],
    maintenance_mode: false,
    allow_registrations: true,
    require_email_verification: true,
    google_analytics_id: '',
    meta_description: '',
    meta_keywords: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [newFooterLink, setNewFooterLink] = useState({ label: '', url: '' });

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
      toast.success('ההגדרות נשמרו בהצלחה!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('שגיאה בשמירת ההגדרות');
    } finally {
      setSaving(false);
    }
  };

  const clearCache = async () => {
    try {
      await api.post('/admin/clear-cache');
      // Clear local storage and session storage
      localStorage.clear();
      sessionStorage.clear();
      toast.success('המטמון נוקה בהצלחה!');
      // Reload the page
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Failed to clear cache:', error);
      // Still clear local cache even if API fails
      localStorage.clear();
      sessionStorage.clear();
      toast.success('המטמון המקומי נוקה!');
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const clearAllProviders = async () => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את כל הספקים? פעולה זו בלתי הפיכה!')) {
      return;
    }
    try {
      const response = await api.delete('/admin/providers/clear-all');
      toast.success(`נמחקו ${response.data.providers_deleted} ספקים ו-${response.data.services_deleted} שירותים`);
    } catch (error) {
      console.error('Failed to clear providers:', error);
      toast.error('שגיאה במחיקת הספקים');
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const addFooterLink = () => {
    if (newFooterLink.label && newFooterLink.url) {
      setSettings(prev => ({
        ...prev,
        footer_links: [...(prev.footer_links || []), newFooterLink]
      }));
      setNewFooterLink({ label: '', url: '' });
    }
  };

  const removeFooterLink = (index) => {
    setSettings(prev => ({
      ...prev,
      footer_links: prev.footer_links.filter((_, i) => i !== index)
    }));
  };

  const tabs = [
    { id: 'general', label: 'כללי', icon: FiSettings },
    { id: 'appearance', label: 'עיצוב', icon: FiImage },
    { id: 'contact', label: 'צור קשר', icon: FiMail },
    { id: 'social', label: 'רשתות חברתיות', icon: FiFacebook },
    { id: 'footer', label: 'פוטר', icon: FiLink },
    { id: 'seo', label: 'SEO', icon: FiGlobe },
    { id: 'advanced', label: 'מתקדם', icon: FiDatabase },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="w-12 h-12 border-4 border-carelink-teal border-t-transparent rounded-full animate-spin"></div>
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
            <h1 className="text-2xl font-bold text-carelink-navy">הגדרות האתר</h1>
            <p className="text-carelink-slate mt-1">הגדרות כלליות ועיצוב האתר</p>
          </div>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-carelink-teal text-white rounded-lg hover:bg-carelink-teal/90 transition shadow-md disabled:opacity-50"
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
                      ? 'bg-carelink-teal text-white shadow-md'
                      : 'text-carelink-slate hover:text-carelink-navy hover:bg-gray-50'
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
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-carelink-navy mb-4">הגדרות כלליות</h2>
                
                <div>
                  <label className="block text-sm text-carelink-slate mb-2">שם האתר</label>
                  <input
                    type="text"
                    value={settings.site_name}
                    onChange={(e) => updateSetting('site_name', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carelink-navy focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-carelink-slate mb-2">סלוגן</label>
                  <input
                    type="text"
                    value={settings.site_tagline}
                    onChange={(e) => updateSetting('site_tagline', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carelink-navy focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-carelink-teal-pale/20 rounded-lg border border-carelink-teal-pale">
                  <div>
                    <p className="text-carelink-navy font-medium">אפשר הרשמה</p>
                    <p className="text-carelink-slate text-sm">אפשר למשתמשים חדשים להירשם</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.allow_registrations}
                      onChange={(e) => updateSetting('allow_registrations', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-carelink-teal"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-carelink-teal-pale/20 rounded-lg border border-carelink-teal-pale">
                  <div>
                    <p className="text-carelink-navy font-medium">אימות אימייל</p>
                    <p className="text-carelink-slate text-sm">דרוש אימות אימייל בהרשמה</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.require_email_verification}
                      onChange={(e) => updateSetting('require_email_verification', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-carelink-teal"></div>
                  </label>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-carelink-navy mb-4">עיצוב</h2>
                
                <div>
                  <label className="block text-sm text-carelink-slate mb-2">לוגו (URL)</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={settings.logo_url}
                      onChange={(e) => updateSetting('logo_url', e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carelink-navy focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
                      dir="ltr"
                    />
                    <button className="px-4 py-2.5 bg-white border border-gray-200 text-carelink-slate rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
                      <FiUpload size={18} />
                      העלה
                    </button>
                  </div>
                  {settings.logo_url && (
                    <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <img src={settings.logo_url} alt="Logo preview" className="h-12 object-contain" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-carelink-slate mb-2">Favicon (URL)</label>
                  <input
                    type="text"
                    value={settings.favicon_url}
                    onChange={(e) => updateSetting('favicon_url', e.target.value)}
                    placeholder="https://example.com/favicon.ico"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carelink-navy focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
                    dir="ltr"
                  />
                </div>
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === 'contact' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-carelink-navy mb-4">פרטי התקשרות</h2>
                
                <div>
                  <label className="block text-sm text-carelink-slate mb-2 flex items-center gap-2">
                    <FiMail size={14} className="text-carelink-teal" />
                    אימייל
                  </label>
                  <input
                    type="email"
                    value={settings.contact_email}
                    onChange={(e) => updateSetting('contact_email', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carelink-navy focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-sm text-carelink-slate mb-2 flex items-center gap-2">
                    <FiPhone size={14} className="text-carelink-teal" />
                    טלפון
                  </label>
                  <input
                    type="tel"
                    value={settings.contact_phone}
                    onChange={(e) => updateSetting('contact_phone', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carelink-navy focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-sm text-carelink-slate mb-2 flex items-center gap-2">
                    <FiMapPin size={14} className="text-carelink-teal" />
                    כתובת
                  </label>
                  <input
                    type="text"
                    value={settings.contact_address}
                    onChange={(e) => updateSetting('contact_address', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carelink-navy focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
                  />
                </div>
              </div>
            )}

            {/* Social Tab */}
            {activeTab === 'social' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-carelink-navy mb-4">רשתות חברתיות</h2>
                
                {[
                  { key: 'social_facebook', label: 'Facebook', icon: FiFacebook, placeholder: 'https://facebook.com/...' },
                  { key: 'social_instagram', label: 'Instagram', icon: FiInstagram, placeholder: 'https://instagram.com/...' },
                  { key: 'social_twitter', label: 'Twitter / X', icon: FiTwitter, placeholder: 'https://twitter.com/...' },
                  { key: 'social_linkedin', label: 'LinkedIn', icon: FiLinkedin, placeholder: 'https://linkedin.com/...' },
                  { key: 'social_youtube', label: 'YouTube', icon: FiYoutube, placeholder: 'https://youtube.com/...' },
                ].map(({ key, label, icon: Icon, placeholder }) => (
                  <div key={key}>
                    <label className="block text-sm text-carelink-slate mb-2 flex items-center gap-2">
                      <Icon size={14} className="text-carelink-teal" />
                      {label}
                    </label>
                    <input
                      type="url"
                      value={settings[key]}
                      onChange={(e) => updateSetting(key, e.target.value)}
                      placeholder={placeholder}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carelink-navy focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
                      dir="ltr"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Footer Tab */}
            {activeTab === 'footer' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-carelink-navy mb-4">הגדרות פוטר</h2>
                
                <div>
                  <label className="block text-sm text-carelink-slate mb-2">טקסט זכויות יוצרים</label>
                  <input
                    type="text"
                    value={settings.footer_text}
                    onChange={(e) => updateSetting('footer_text', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carelink-navy focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-carelink-slate mb-3">קישורי פוטר</label>
                  <div className="space-y-2 mb-4">
                    {settings.footer_links?.map((link, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-carelink-navy">{link.label}</span>
                        <span className="text-carelink-gray">→</span>
                        <span className="text-carelink-slate text-sm" dir="ltr">{link.url}</span>
                        <button
                          onClick={() => removeFooterLink(index)}
                          className="mr-auto text-carelink-gray hover:text-red-500"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newFooterLink.label}
                      onChange={(e) => setNewFooterLink(prev => ({ ...prev, label: e.target.value }))}
                      placeholder="תווית"
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-carelink-navy focus:border-carelink-teal outline-none"
                    />
                    <input
                      type="text"
                      value={newFooterLink.url}
                      onChange={(e) => setNewFooterLink(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="/page-url"
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-carelink-navy focus:border-carelink-teal outline-none"
                      dir="ltr"
                    />
                    <button
                      onClick={addFooterLink}
                      className="px-4 py-2 bg-carelink-teal text-white rounded-lg hover:bg-carelink-teal/90 transition"
                    >
                      הוסף
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SEO Tab */}
            {activeTab === 'seo' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-carelink-navy mb-4">אופטימיזציה למנועי חיפוש</h2>
                
                <div>
                  <label className="block text-sm text-carelink-slate mb-2">תיאור מטא</label>
                  <textarea
                    value={settings.meta_description}
                    onChange={(e) => updateSetting('meta_description', e.target.value)}
                    placeholder="תיאור האתר לתוצאות חיפוש..."
                    rows={3}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carelink-navy focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-carelink-slate mb-2">מילות מפתח</label>
                  <input
                    type="text"
                    value={settings.meta_keywords}
                    onChange={(e) => updateSetting('meta_keywords', e.target.value)}
                    placeholder="מילה1, מילה2, מילה3..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carelink-navy focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-carelink-slate mb-2">Google Analytics ID</label>
                  <input
                    type="text"
                    value={settings.google_analytics_id}
                    onChange={(e) => updateSetting('google_analytics_id', e.target.value)}
                    placeholder="G-XXXXXXXXXX"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carelink-navy focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
                    dir="ltr"
                  />
                </div>
              </div>
            )}

            {/* Advanced Tab */}
            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-carelink-navy mb-4">הגדרות מתקדמות</h2>
                
                <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div>
                    <p className="text-red-700 font-medium">מצב תחזוקה</p>
                    <p className="text-red-600 text-sm">השבת גישה לאתר למשתמשים</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.maintenance_mode}
                      onChange={(e) => updateSetting('maintenance_mode', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                  </label>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-carelink-navy font-medium mb-2">גיבוי נתונים</h3>
                  <p className="text-carelink-slate text-sm mb-3">הורד גיבוי מלא של כל הנתונים</p>
                  <button className="px-4 py-2 bg-white border border-gray-200 text-carelink-navy rounded-lg hover:bg-gray-100 transition">
                    הורד גיבוי
                  </button>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-carelink-navy font-medium mb-2">נקה מטמון</h3>
                  <p className="text-carelink-slate text-sm mb-3">נקה את כל הנתונים השמורים במטמון</p>
                  <button 
                    onClick={clearCache}
                    className="px-4 py-2 bg-carelink-teal text-white rounded-lg hover:bg-carelink-teal-medium transition"
                  >
                    נקה מטמון
                  </button>
                </div>

                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h3 className="text-red-700 font-medium mb-2">מחק את כל הספקים</h3>
                  <p className="text-red-600 text-sm mb-3">מחק את כל הספקים והשירותים מהמערכת (פעולה בלתי הפיכה!)</p>
                  <button 
                    onClick={clearAllProviders}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                  >
                    <FiTrash2 />
                    מחק הכל
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
