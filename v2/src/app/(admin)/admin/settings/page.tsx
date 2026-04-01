"use client";

import React, {  useState, useEffect, useRef  } from "react";
import api from "@/lib/api-client";
import { toast } from "sonner";
import {
  FiSave, FiGlobe, FiImage, FiLink, FiMail, FiPhone,
  FiMapPin, FiFacebook, FiInstagram, FiTwitter, FiLinkedin,
  FiYoutube, FiSettings, FiDatabase, FiUpload, FiTrash2
} from 'react-icons/fi';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    site_name: '',
    site_tagline: '',
    logo_url: '',
    favicon_url: '',
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    footer_text: '',
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
  const [testEmail, setTestEmail] = useState('');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [emailProvider, setEmailProvider] = useState('smtp');
  const [smtpSettings, setSmtpSettings] = useState({
    sender_email: '', smtp_host: 'smtp.gmail.com', smtp_port: 587, smtp_user: '', smtp_password: ''
  });
  const [zeptomailSettings, setZeptomailSettings] = useState({
    zeptomail_api_key: '', zeptomail_sender_email: ''
  });
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState<any>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  

  const handleFileUpload = async (file, type) => {
    const setUploading = type === 'logo' ? setUploadingLogo : setUploadingFavicon;
    const settingKey = type === 'logo' ? 'logo_url' : 'favicon_url';

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'];
    if (!allowed.includes(file.type)) {
      toast.error('סוג קובץ לא נתמך. השתמש ב-PNG, JPG, WebP, GIF, SVG או ICO');
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
      const res = await api.post('/upload/image', formData);
      updateSetting(settingKey, res?.url || res?.data?.url);
      toast.success(type === 'logo' ? 'הלוגו הועלה בהצלחה!' : 'הפאביקון הועלה בהצלחה!');
    } catch (error: any) {
      console.error(`Failed to upload ${type}:`, error);
      toast.error(`שגיאה בהעלאת ${type === 'logo' ? 'הלוגו' : 'הפאביקון'}`);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchSmtpSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await api.get('/admin/settings');
      if (data) {
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error: any) {
      console.error('Failed to fetch settings:', error);
      toast.error('שגיאה בטעינת ההגדרות');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await api.put('/admin/settings', settings);
      toast.success('ההגדרות נשמרו בהצלחה!');
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      toast.error('שגיאה בשמירת ההגדרות');
    } finally {
      setSaving(false);
    }
  };

  const clearCache = async () => {
    try {
      // 1. Clear API cache on server
      await api.post('/admin/clear-cache');
      
      // 2. Clear all local storage
      localStorage.clear();
      
      // 3. Clear session storage
      sessionStorage.clear();
      
      // 4. Clear browser cache using Cache API (Service Worker caches)
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      // 5. Unregister service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => registration.unregister())
        );
      }
      
      toast.success('כל המטמון נוקה בהצלחה! הדף יטען מחדש...');
      
      // 6. Hard reload - bypass cache
      setTimeout(() => {
        window.location.href = window.location.href.split('?')[0] + '?cleared=' + Date.now();
      }, 1500);
      
    } catch (error: any) {
      console.error('Failed to clear cache:', error);
      // Still clear local cache even if API fails
      localStorage.clear();
      sessionStorage.clear();
      toast.success('המטמון המקומי נוקה!');
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const clearAllProviders = async () => {
    if (!window.confirm("האם אתה בטוח?")) return;
    try {
      const data = await api.delete('/admin/providers/clear-all');
      toast.success(`נמחקו ${data.providers_deleted} ספקים ו-${data.services_deleted} שירותים`);
    } catch (error: any) {
      console.error('Failed to clear providers:', error);
      toast.error('שגיאה במחיקת הספקים');
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const fetchSmtpSettings = async () => {
    try {
      const res = await api.get('/admin/smtp-settings');
      const d = res.data;
      setEmailProvider(d.email_provider || 'smtp');
      setSmtpSettings({
        sender_email: d.sender_email || '',
        smtp_host: d.smtp_host || 'smtp.gmail.com',
        smtp_port: d.smtp_port || 587,
        smtp_user: d.smtp_user || '',
        smtp_password: ''
      });
      setZeptomailSettings({
        zeptomail_api_key: '',
        zeptomail_sender_email: d.zeptomail_sender_email || ''
      });
    } catch (e) {
      console.error('Failed to load SMTP settings:', e);
    }
  };

  const saveSmtpSettings = async () => {
    setSmtpLoading(true);
    try {
      const payload: any = {
        email_provider: emailProvider,
        ...smtpSettings,
        zeptomail_sender_email: zeptomailSettings.zeptomail_sender_email,
      };
      if (!payload.smtp_password) delete payload.smtp_password;
      if (zeptomailSettings.zeptomail_api_key) {
        payload.zeptomail_api_key = zeptomailSettings.zeptomail_api_key;
      }
      await api.put('/admin/smtp-settings', payload);
      toast.success('הגדרות שליחת מיילים נשמרו בהצלחה');
      checkSmtpConnection();
    } catch (e) {
      toast.error('שגיאה בשמירת הגדרות שליחת מיילים');
    } finally {
      setSmtpLoading(false);
    }
  };

  const checkSmtpConnection = async () => {
    try {
      const res = await api.get('/admin/smtp-check');
      setSmtpStatus(res.data);
    } catch (e) {
      setSmtpStatus({ smtp_login_ok: false, smtp_error: 'שגיאת חיבור' });
    }
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
        <div className="flex items-center justify-center h-96">
          <div className="w-12 h-12 border-4 border-carefd-teal border-t-transparent rounded-full animate-spin"></div>
        </div>
      
    );
  }

  return (
    <>
    
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-carefd-navy">הגדרות האתר</h1>
            <p className="text-carefd-slate mt-1">הגדרות כלליות ועיצוב האתר</p>
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
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-carefd-navy mb-4">הגדרות כלליות</h2>
                
                <div>
                  <label className="block text-sm text-carefd-slate mb-2">שם האתר</label>
                  <input
                    type="text"
                    value={settings.site_name}
                    onChange={(e) => updateSetting('site_name', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-carefd-slate mb-2">סלוגן</label>
                  <input
                    type="text"
                    value={settings.site_tagline}
                    onChange={(e) => updateSetting('site_tagline', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-carefd-teal-pale/20 rounded-lg border border-carefd-teal-pale">
                  <div>
                    <p className="text-carefd-navy font-medium">אפשר הרשמה</p>
                    <p className="text-carefd-slate text-sm">אפשר למשתמשים חדשים להירשם</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.allow_registrations}
                      onChange={(e) => updateSetting('allow_registrations', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-carefd-teal"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-carefd-teal-pale/20 rounded-lg border border-carefd-teal-pale">
                  <div>
                    <p className="text-carefd-navy font-medium">אימות אימייל</p>
                    <p className="text-carefd-slate text-sm">דרוש אימות אימייל בהרשמה</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.require_email_verification}
                      onChange={(e) => updateSetting('require_email_verification', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-carefd-teal"></div>
                  </label>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-carefd-navy mb-4">עיצוב</h2>

                {/* Logo Upload */}
                <div>
                  <label className="block text-sm text-carefd-slate mb-2">לוגו</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={settings.logo_url}
                      onChange={(e) => updateSetting('logo_url', e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                      dir="ltr"
                    />
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'logo');
                        e.target.value = '';
                      }}
                    />
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="px-4 py-2.5 bg-white border border-gray-200 text-carefd-slate rounded-lg hover:bg-gray-50 transition flex items-center gap-2 disabled:opacity-50"
                    >
                      <FiUpload size={18} />
                      {uploadingLogo ? 'מעלה...' : 'העלה'}
                    </button>
                    {settings.logo_url && (
                      <button
                        onClick={() => updateSetting('logo_url', '')}
                        className="px-3 py-2.5 bg-white border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition"
                        title="הסר לוגו"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    )}
                  </div>
                  {settings.logo_url && (
                    <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-carefd-slate mb-2">תצוגה מקדימה:</p>
                      <img src={settings.logo_url} alt="Logo preview" className="h-12 object-contain" />
                    </div>
                  )}
                </div>

                {/* Favicon Upload */}
                <div>
                  <label className="block text-sm text-carefd-slate mb-2">Favicon (אייקון הדפדפן)</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={settings.favicon_url}
                      onChange={(e) => updateSetting('favicon_url', e.target.value)}
                      placeholder="https://example.com/favicon.ico"
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                      dir="ltr"
                    />
                    <input
                      ref={faviconInputRef}
                      type="file"
                      accept="image/*,.ico"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'favicon');
                        e.target.value = '';
                      }}
                    />
                    <button
                      onClick={() => faviconInputRef.current?.click()}
                      disabled={uploadingFavicon}
                      className="px-4 py-2.5 bg-white border border-gray-200 text-carefd-slate rounded-lg hover:bg-gray-50 transition flex items-center gap-2 disabled:opacity-50"
                    >
                      <FiUpload size={18} />
                      {uploadingFavicon ? 'מעלה...' : 'העלה'}
                    </button>
                    {settings.favicon_url && (
                      <button
                        onClick={() => updateSetting('favicon_url', '')}
                        className="px-3 py-2.5 bg-white border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition"
                        title="הסר favicon"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    )}
                  </div>
                  {settings.favicon_url && (
                    <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-3">
                      <p className="text-xs text-carefd-slate">תצוגה מקדימה:</p>
                      <img src={settings.favicon_url} alt="Favicon preview" className="h-8 w-8 object-contain" />
                    </div>
                  )}
                  <p className="text-xs text-carefd-gray mt-1">מומלץ: תמונה מרובעת בגודל 32x32 או 64x64 פיקסלים (ICO, PNG, SVG)</p>
                </div>
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === 'contact' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-carefd-navy mb-4">פרטי התקשרות</h2>
                
                <div>
                  <label className="block text-sm text-carefd-slate mb-2 flex items-center gap-2">
                    <FiMail size={14} className="text-carefd-teal" />
                    אימייל
                  </label>
                  <input
                    type="email"
                    value={settings.contact_email}
                    onChange={(e) => updateSetting('contact_email', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-sm text-carefd-slate mb-2 flex items-center gap-2">
                    <FiPhone size={14} className="text-carefd-teal" />
                    טלפון
                  </label>
                  <input
                    type="tel"
                    value={settings.contact_phone}
                    onChange={(e) => updateSetting('contact_phone', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-sm text-carefd-slate mb-2 flex items-center gap-2">
                    <FiMapPin size={14} className="text-carefd-teal" />
                    כתובת
                  </label>
                  <input
                    type="text"
                    value={settings.contact_address}
                    onChange={(e) => updateSetting('contact_address', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                  />
                </div>
              </div>
            )}

            {/* Social Tab */}
            {activeTab === 'social' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-carefd-navy mb-4">רשתות חברתיות</h2>
                
                {[
                  { key: 'social_facebook', label: 'Facebook', icon: FiFacebook, placeholder: 'https://facebook.com/...' },
                  { key: 'social_instagram', label: 'Instagram', icon: FiInstagram, placeholder: 'https://instagram.com/...' },
                  { key: 'social_twitter', label: 'Twitter / X', icon: FiTwitter, placeholder: 'https://twitter.com/...' },
                  { key: 'social_linkedin', label: 'LinkedIn', icon: FiLinkedin, placeholder: 'https://linkedin.com/...' },
                  { key: 'social_youtube', label: 'YouTube', icon: FiYoutube, placeholder: 'https://youtube.com/...' },
                ].map(({ key, label, icon: Icon, placeholder }) => (
                  <div key={key}>
                    <label className="block text-sm text-carefd-slate mb-2 flex items-center gap-2">
                      <Icon size={14} className="text-carefd-teal" />
                      {label}
                    </label>
                    <input
                      type="url"
                      value={settings[key]}
                      onChange={(e) => updateSetting(key, e.target.value)}
                      placeholder={placeholder}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                      dir="ltr"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Footer Tab */}
            {activeTab === 'footer' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-carefd-navy mb-4">הגדרות פוטר</h2>
                
                <div>
                  <label className="block text-sm text-carefd-slate mb-2">טקסט זכויות יוצרים</label>
                  <input
                    type="text"
                    value={settings.footer_text}
                    onChange={(e) => updateSetting('footer_text', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-carefd-slate mb-3">קישורי פוטר</label>
                  <div className="space-y-2 mb-4">
                    {settings.footer_links?.map((link, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-carefd-navy">{link.label}</span>
                        <span className="text-carefd-gray">→</span>
                        <span className="text-carefd-slate text-sm" dir="ltr">{link.url}</span>
                        <button
                          onClick={() => removeFooterLink(index)}
                          className="me-auto text-carefd-gray hover:text-red-500"
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
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-carefd-navy focus:border-carefd-teal outline-none"
                    />
                    <input
                      type="text"
                      value={newFooterLink.url}
                      onChange={(e) => setNewFooterLink(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="/page-url"
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-carefd-navy focus:border-carefd-teal outline-none"
                      dir="ltr"
                    />
                    <button
                      onClick={addFooterLink}
                      className="px-4 py-2 bg-carefd-teal text-white rounded-lg hover:bg-carefd-teal/90 transition"
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
                <h2 className="text-lg font-semibold text-carefd-navy mb-4">אופטימיזציה למנועי חיפוש</h2>
                
                <div>
                  <label className="block text-sm text-carefd-slate mb-2">תיאור מטא</label>
                  <textarea
                    value={settings.meta_description}
                    onChange={(e) => updateSetting('meta_description', e.target.value)}
                    placeholder="תיאור האתר לתוצאות חיפוש..."
                    rows={3}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-carefd-slate mb-2">מילות מפתח</label>
                  <input
                    type="text"
                    value={settings.meta_keywords}
                    onChange={(e) => updateSetting('meta_keywords', e.target.value)}
                    placeholder="מילה1, מילה2, מילה3..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-carefd-slate mb-2">Google Analytics ID</label>
                  <input
                    type="text"
                    value={settings.google_analytics_id}
                    onChange={(e) => updateSetting('google_analytics_id', e.target.value)}
                    placeholder="G-XXXXXXXXXX"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                    dir="ltr"
                  />
                </div>
              </div>
            )}

            {/* Advanced Tab */}
            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-carefd-navy mb-4">הגדרות מתקדמות</h2>

                {/* Email Provider Selection */}
                <div className="p-5 bg-white border-2 border-blue-100 rounded-xl">
                  <h3 className="text-carefd-navy font-bold text-base mb-4">בחירת ספק שליחת מיילים</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={() => setEmailProvider('smtp')}
                      className={`p-4 rounded-xl border-2 text-right transition ${
                        emailProvider === 'smtp'
                          ? 'border-carefd-teal bg-carefd-teal/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-carefd-navy">SMTP</span>
                        {emailProvider === 'smtp' && (
                          <span className="px-2 py-0.5 bg-carefd-teal text-white rounded-full text-xs">פעיל</span>
                        )}
                      </div>
                      <p className="text-xs text-carefd-slate">שליחה דרך שרת SMTP (Gmail, Outlook...)</p>
                    </button>
                    <button
                      onClick={() => setEmailProvider('zeptomail')}
                      className={`p-4 rounded-xl border-2 text-right transition ${
                        emailProvider === 'zeptomail'
                          ? 'border-carefd-teal bg-carefd-teal/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-carefd-navy">ZeptoMail</span>
                        {emailProvider === 'zeptomail' && (
                          <span className="px-2 py-0.5 bg-carefd-teal text-white rounded-full text-xs">פעיל</span>
                        )}
                      </div>
                      <p className="text-xs text-carefd-slate">שליחה דרך ZeptoMail API (Zoho)</p>
                    </button>
                  </div>
                </div>

                {/* SMTP Configuration */}
                {emailProvider === 'smtp' && (
                  <div className="p-5 bg-white border-2 border-blue-100 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-carefd-navy font-bold text-base">הגדרות SMTP</h3>
                      {smtpStatus && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${smtpStatus.smtp_login_ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {smtpStatus.smtp_login_ok ? 'מחובר' : 'לא מחובר'}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm text-carefd-slate mb-1">אימייל שולח</label>
                        <input type="email" value={smtpSettings.sender_email}
                          onChange={(e) => setSmtpSettings(p => ({...p, sender_email: e.target.value}))}
                          placeholder="your-email@gmail.com" dir="ltr"
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-carefd-teal outline-none"
                          data-testid="smtp-sender-email" />
                      </div>
                      <div>
                        <label className="block text-sm text-carefd-slate mb-1">שרת SMTP</label>
                        <input type="text" value={smtpSettings.smtp_host}
                          onChange={(e) => setSmtpSettings(p => ({...p, smtp_host: e.target.value}))}
                          placeholder="smtp.gmail.com" dir="ltr"
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-carefd-teal outline-none"
                          data-testid="smtp-host" />
                      </div>
                      <div>
                        <label className="block text-sm text-carefd-slate mb-1">שם משתמש SMTP</label>
                        <input type="text" value={smtpSettings.smtp_user}
                          onChange={(e) => setSmtpSettings(p => ({...p, smtp_user: e.target.value}))}
                          placeholder="your-email@gmail.com" dir="ltr"
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-carefd-teal outline-none"
                          data-testid="smtp-user" />
                      </div>
                      <div>
                        <label className="block text-sm text-carefd-slate mb-1">פורט</label>
                        <input type="number" value={smtpSettings.smtp_port}
                          onChange={(e) => setSmtpSettings(p => ({...p, smtp_port: parseInt(e.target.value) || 587}))}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-carefd-teal outline-none"
                          data-testid="smtp-port" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm text-carefd-slate mb-1">סיסמת SMTP (App Password)</label>
                        <input type="password" value={smtpSettings.smtp_password}
                          onChange={(e) => setSmtpSettings(p => ({...p, smtp_password: e.target.value}))}
                          placeholder="השאר ריק אם לא רוצה לשנות"
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-carefd-teal outline-none"
                          data-testid="smtp-password" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={saveSmtpSettings} disabled={smtpLoading}
                        className="px-4 py-2 bg-carefd-teal text-white rounded-lg hover:bg-carefd-teal/90 transition text-sm font-medium disabled:opacity-50"
                        data-testid="save-smtp-btn">
                        {smtpLoading ? 'שומר...' : 'שמור הגדרות'}
                      </button>
                      <button onClick={checkSmtpConnection}
                        className="px-4 py-2 bg-gray-100 text-carefd-navy rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                        data-testid="check-smtp-btn">
                        בדוק חיבור
                      </button>
                    </div>
                    {smtpStatus && !smtpStatus.smtp_login_ok && smtpStatus.smtp_error && (
                      <p className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded-lg">{smtpStatus.smtp_error}</p>
                    )}
                  </div>
                )}

                {/* ZeptoMail Configuration */}
                {emailProvider === 'zeptomail' && (
                  <div className="p-5 bg-white border-2 border-blue-100 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-carefd-navy font-bold text-base">הגדרות ZeptoMail</h3>
                      {smtpStatus && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${smtpStatus.zeptomail_configured ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {smtpStatus.zeptomail_configured ? 'מוגדר' : 'לא מוגדר'}
                        </span>
                      )}
                    </div>
                    <div className="space-y-4 mb-4">
                      <div>
                        <label className="block text-sm text-carefd-slate mb-1">מפתח API של ZeptoMail</label>
                        <input type="password" value={zeptomailSettings.zeptomail_api_key}
                          onChange={(e) => setZeptomailSettings(p => ({...p, zeptomail_api_key: e.target.value}))}
                          placeholder="השאר ריק אם לא רוצה לשנות"
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-carefd-teal outline-none"
                          dir="ltr" />
                        <p className="text-xs text-carefd-gray mt-1">ניתן למצוא את המפתח בלוח הבקרה של ZeptoMail תחת Settings &gt; Send Mail Token</p>
                      </div>
                      <div>
                        <label className="block text-sm text-carefd-slate mb-1">אימייל שולח</label>
                        <input type="email" value={zeptomailSettings.zeptomail_sender_email}
                          onChange={(e) => setZeptomailSettings(p => ({...p, zeptomail_sender_email: e.target.value}))}
                          placeholder="noreply@your-domain.com"
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-carefd-teal outline-none"
                          dir="ltr" />
                        <p className="text-xs text-carefd-gray mt-1">הדומיין חייב להיות מאומת ב-ZeptoMail</p>
                      </div>
                    </div>
                    <button onClick={saveSmtpSettings} disabled={smtpLoading}
                      className="px-4 py-2 bg-carefd-teal text-white rounded-lg hover:bg-carefd-teal/90 transition text-sm font-medium disabled:opacity-50">
                      {smtpLoading ? 'שומר...' : 'שמור הגדרות'}
                    </button>
                  </div>
                )}

                {/* Test Email */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-carefd-navy font-medium mb-2">בדיקת שליחת מיילים</h3>
                  <p className="text-carefd-slate text-sm mb-3">שלח מייל בדיקה כדי לוודא שהגדרות שליחת המיילים עובדות</p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="כתובת מייל לבדיקה..."
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-2 text-carefd-navy focus:border-carefd-teal outline-none text-sm"
                      dir="ltr"
                      data-testid="test-email-input"
                    />
                    <button
                      type="button"
                      disabled={sendingTestEmail}
                      onClick={async () => {
                        if (!testEmail) { toast.error('הכנס כתובת מייל'); return; }
                        setSendingTestEmail(true);
                        try {
                          const res = await api.post('/admin/test-email', { email: testEmail });
                          if (res.data.success) {
                            const providerName = res.data.provider === 'zeptomail' ? 'ZeptoMail' : res.data.provider === 'resend' ? 'Resend' : 'SMTP';
                            toast.success(`מייל בדיקה נשלח בהצלחה דרך ${providerName}! בדוק את תיבת הדואר`);
                          } else {
                            toast.error('שליחת מייל נכשלה: ' + (res.data.error || 'שגיאה'));
                          }
                        } catch (err: any) {
                          toast.error('שגיאה בשליחת מייל: ' + (err?.data?.detail || err?.message || err.message));
                        } finally {
                          setSendingTestEmail(false);
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      data-testid="send-test-email-btn"
                    >
                      {sendingTestEmail ? 'שולח...' : 'שלח בדיקה'}
                    </button>
                  </div>
                </div>

                {/* Maintenance Mode */}
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
                  <h3 className="text-carefd-navy font-medium mb-2">גיבוי נתונים</h3>
                  <p className="text-carefd-slate text-sm mb-3">הורד גיבוי מלא של כל הנתונים</p>
                  <button className="px-4 py-2 bg-white border border-gray-200 text-carefd-navy rounded-lg hover:bg-gray-100 transition">
                    הורד גיבוי
                  </button>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-carefd-navy font-medium mb-2">נקה מטמון</h3>
                  <p className="text-carefd-slate text-sm mb-3">נקה את כל הנתונים השמורים במטמון</p>
                  <button 
                    onClick={clearCache}
                    className="px-4 py-2 bg-carefd-teal text-white rounded-lg hover:bg-carefd-teal-medium transition"
                  >
                    נקה מטמון
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      
    
    </>
  );
};


