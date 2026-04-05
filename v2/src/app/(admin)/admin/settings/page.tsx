"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, CheckCircle, Settings, Mail, Globe, Palette } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [smtp, setSmtp] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<{ settings: any; smtp: any }>("/admin/settings")
      .then((d) => { setSettings(d.settings || {}); setSmtp(d.smtp || {}); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const saveSettings = async () => {
    setSaving(true); setSaved(false);
    try { await api.put("/admin/settings", settings); setSaved(true); setTimeout(() => setSaved(false), 3000); }
    catch { toast.error("שגיאה בשמירת ההגדרות"); }
    finally { setSaving(false); }
  };

  const saveSmtp = async () => {
    setSaving(true);
    try { await api.put("/admin/settings", { smtp }); toast.success("הגדרות SMTP נשמרו"); }
    catch { toast.error("שגיאה בשמירת ההגדרות"); }
    finally { setSaving(false); }
  };

  if (loading) return <div><Skeleton className="h-10 w-48 mb-6" /><Skeleton className="h-96 w-full" /></div>;

  return (
    <div>
      <h2 className="font-heading font-semibold text-2xl mb-6">הגדרות אתר</h2>

      {saved && (
        <div className="bg-emerald-50 text-emerald-600 text-sm rounded-xl p-4 border border-emerald-100 flex items-center gap-2 mb-6">
          <CheckCircle className="w-4 h-4" /> ההגדרות נשמרו
        </div>
      )}

      <Card className="p-6 md:p-8 mb-6">
        <h3 className="font-heading font-semibold text-lg text-carefd-navy mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-carefd-teal" /> הגדרות כלליות
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700">שם האתר</label><Input value={settings.site_name || ""} onChange={(e) => setSettings({ ...settings, site_name: e.target.value })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700">URL לוגו</label><Input value={settings.logo_url || ""} onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })} dir="ltr" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700">אימייל יצירת קשר</label><Input value={settings.contact_email || ""} onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })} dir="ltr" /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700">טלפון</label><Input value={settings.contact_phone || ""} onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })} dir="ltr" /></div>
          </div>
          <div className="space-y-2"><label className="text-sm font-medium text-slate-700">תיאור</label><Textarea value={settings.site_description || ""} onChange={(e) => setSettings({ ...settings, site_description: e.target.value })} /></div>
          <Button onClick={saveSettings} disabled={saving}><Save className="w-4 h-4 me-2" /> {saving ? "שומר..." : "שמור הגדרות"}</Button>
        </div>
      </Card>

      {/* SEO & Social */}
      <Card className="p-6 md:p-8 mb-6">
        <h3 className="font-heading font-semibold text-lg text-carefd-navy mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-carefd-teal" /> SEO ורשתות חברתיות
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700">כותרת SEO</label><Input value={settings.seo_title || ""} onChange={(e) => setSettings({ ...settings, seo_title: e.target.value })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700">תיאור SEO</label><Input value={settings.seo_description || ""} onChange={(e) => setSettings({ ...settings, seo_description: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Facebook</label><Input value={settings.social_facebook || ""} onChange={(e) => setSettings({ ...settings, social_facebook: e.target.value })} dir="ltr" placeholder="https://facebook.com/..." /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Instagram</label><Input value={settings.social_instagram || ""} onChange={(e) => setSettings({ ...settings, social_instagram: e.target.value })} dir="ltr" placeholder="https://instagram.com/..." /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Twitter/X</label><Input value={settings.social_twitter || ""} onChange={(e) => setSettings({ ...settings, social_twitter: e.target.value })} dir="ltr" /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700">LinkedIn</label><Input value={settings.social_linkedin || ""} onChange={(e) => setSettings({ ...settings, social_linkedin: e.target.value })} dir="ltr" /></div>
          </div>
          <Button onClick={saveSettings} disabled={saving}><Save className="w-4 h-4 me-2" /> {saving ? "שומר..." : "שמור"}</Button>
        </div>
      </Card>

      {/* Appearance */}
      <Card className="p-6 md:p-8 mb-6">
        <h3 className="font-heading font-semibold text-lg text-carefd-navy mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-carefd-teal" /> מראה
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700">טאגליין</label><Input value={settings.site_tagline || ""} onChange={(e) => setSettings({ ...settings, site_tagline: e.target.value })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700">כתובת</label><Input value={settings.contact_address || ""} onChange={(e) => setSettings({ ...settings, contact_address: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><label className="text-sm font-medium text-slate-700">טקסט תחתית (Footer)</label><Input value={settings.footer_text || ""} onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })} /></div>
          <Button onClick={saveSettings} disabled={saving}><Save className="w-4 h-4 me-2" /> {saving ? "שומר..." : "שמור"}</Button>
        </div>
      </Card>

      {/* SMTP */}
      <Card className="p-6 md:p-8">
        <h3 className="font-heading font-semibold text-lg text-carefd-navy mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-carefd-teal" /> הגדרות SMTP
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700">ספק</label><Input value={smtp.email_provider || ""} onChange={(e) => setSmtp({ ...smtp, email_provider: e.target.value })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700">כתובת שולח</label><Input value={smtp.sender_email || ""} onChange={(e) => setSmtp({ ...smtp, sender_email: e.target.value })} dir="ltr" /></div>
          </div>
          <div className="space-y-2"><label className="text-sm font-medium text-slate-700">שם שולח</label><Input value={smtp.sender_name || ""} onChange={(e) => setSmtp({ ...smtp, sender_name: e.target.value })} /></div>
          <Button onClick={saveSmtp} disabled={saving} variant="secondary"><Save className="w-4 h-4 me-2" /> שמור SMTP</Button>
        </div>
      </Card>
    </div>
  );
}
