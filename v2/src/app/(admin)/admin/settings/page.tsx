"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, CheckCircle, Settings, Mail } from "lucide-react";

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
    catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  const saveSmtp = async () => {
    setSaving(true);
    try { await api.put("/admin/settings", { smtp }); alert("הגדרות SMTP נשמרו"); }
    catch (err: any) { alert(err.message); }
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
        <h3 className="font-heading font-semibold text-lg text-primary mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-accent" /> הגדרות כלליות
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

      <Card className="p-6 md:p-8">
        <h3 className="font-heading font-semibold text-lg text-primary mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-accent" /> הגדרות SMTP
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
