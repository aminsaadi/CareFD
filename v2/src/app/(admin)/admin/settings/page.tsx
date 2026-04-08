"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Save, CheckCircle, Settings, Mail, Globe, Palette,
  Phone, MapPin, Link2, Facebook, Instagram, Twitter,
  Linkedin, Youtube, Shield, Database, Loader2,
  Search, Plus, X, Trash2, Send,
} from "lucide-react";
import { toast } from "sonner";

const tabs = [
  { id: "general", label: "כללי", icon: Settings },
  { id: "contact", label: "פרטי קשר", icon: Phone },
  { id: "social", label: "רשתות חברתיות", icon: Globe },
  { id: "seo", label: "SEO", icon: Search },
  { id: "email", label: "אימייל", icon: Mail },
  { id: "advanced", label: "מתקדם", icon: Database },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>({
    site_name: "", site_tagline: "", logo_url: "", favicon_url: "",
    contact_email: "", contact_phone: "", contact_address: "",
    footer_text: "",
    social_facebook: "", social_instagram: "", social_twitter: "",
    social_linkedin: "", social_youtube: "",
    meta_description: "", meta_keywords: "", google_analytics_id: "",
    maintenance_mode: false, allow_registrations: true, require_email_verification: true,
    footer_links: [],
  });
  const [smtp, setSmtp] = useState<any>({ email_provider: "", sender_email: "", sender_name: "", smtp_host: "", smtp_port: 587, smtp_user: "", smtp_password: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [newLink, setNewLink] = useState({ label: "", url: "" });
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    api.get<any>("/admin/settings")
      .then((d) => {
        if (d?.settings || d) setSettings((prev: any) => ({ ...prev, ...(d.settings || d) }));
        if (d?.smtp) setSmtp((prev: any) => ({ ...prev, ...d.smtp }));
      })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    try {
      await api.put("/admin/settings", settings);
      toast.success("ההגדרות נשמרו!"); setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch { toast.error("שגיאה בשמירה"); }
    finally { setSaving(false); }
  };

  const handleSaveSmtp = async () => {
    setSaving(true);
    try { await api.put("/admin/settings", { smtp }); toast.success("הגדרות אימייל נשמרו"); }
    catch { toast.error("שגיאה"); }
    finally { setSaving(false); }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) { toast.error("נא להזין אימייל"); return; }
    setSendingTest(true);
    try { await api.post("/admin/test-email", { email: testEmail }); toast.success("אימייל נשלח!"); }
    catch { toast.error("שגיאה בשליחה"); }
    finally { setSendingTest(false); }
  };

  const u = (key: string, value: any) => setSettings((prev: any) => ({ ...prev, [key]: value }));
  const addFooterLink = () => { if (newLink.label && newLink.url) { u("footer_links", [...(settings.footer_links || []), newLink]); setNewLink({ label: "", url: "" }); } };
  const removeFooterLink = (idx: number) => u("footer_links", (settings.footer_links || []).filter((_: any, i: number) => i !== idx));

  if (loading) return <div><Skeleton className="h-10 w-48 mb-6" /><Skeleton className="h-96 w-full" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading font-semibold text-2xl">הגדרות אתר</h2>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : saved ? <CheckCircle className="w-4 h-4 me-1 text-green-500" /> : <Save className="w-4 h-4 me-1" />}
          {saving ? "שומר..." : saved ? "נשמר!" : "שמור הגדרות"}
        </Button>
      </div>

      {saved && <div className="bg-green-50 text-green-600 text-sm rounded-xl p-4 border border-green-100 flex items-center gap-2 mb-6"><CheckCircle className="w-4 h-4" />ההגדרות נשמרו בהצלחה</div>}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === t.id ? "bg-carefd-teal text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* General */}
      {activeTab === "general" && (
        <Card className="p-6 md:p-8 space-y-5">
          <h3 className="font-bold text-carefd-navy flex items-center gap-2"><Settings className="w-5 h-5 text-carefd-teal" />הגדרות כלליות</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-sm font-medium">שם האתר</label><Input value={settings.site_name || ""} onChange={(e) => u("site_name", e.target.value)} /></div>
            <div className="space-y-1"><label className="text-sm font-medium">טאגליין</label><Input value={settings.site_tagline || ""} onChange={(e) => u("site_tagline", e.target.value)} /></div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-sm font-medium">URL לוגו</label><Input value={settings.logo_url || ""} onChange={(e) => u("logo_url", e.target.value)} dir="ltr" />
              {settings.logo_url && <img src={settings.logo_url} alt="" className="h-12 mt-2 rounded" onError={(e) => (e.currentTarget.style.display = "none")} />}
            </div>
            <div className="space-y-1"><label className="text-sm font-medium">URL Favicon</label><Input value={settings.favicon_url || ""} onChange={(e) => u("favicon_url", e.target.value)} dir="ltr" />
              {settings.favicon_url && <img src={settings.favicon_url} alt="" className="h-8 mt-2" onError={(e) => (e.currentTarget.style.display = "none")} />}
            </div>
          </div>
          <div className="space-y-1"><label className="text-sm font-medium">תיאור</label><Textarea value={settings.site_description || ""} onChange={(e) => u("site_description", e.target.value)} /></div>
          <div className="space-y-1"><label className="text-sm font-medium">טקסט תחתית (Footer)</label><Input value={settings.footer_text || ""} onChange={(e) => u("footer_text", e.target.value)} /></div>
          {/* Footer Links */}
          <div className="space-y-2">
            <label className="text-sm font-medium">קישורי Footer</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(settings.footer_links || []).map((lnk: any, i: number) => (
                <span key={i} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm">
                  {lnk.label} <button onClick={() => removeFooterLink(i)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newLink.label} onChange={(e) => setNewLink({ ...newLink, label: e.target.value })} placeholder="תווית" className="flex-1 h-8 text-sm" />
              <Input value={newLink.url} onChange={(e) => setNewLink({ ...newLink, url: e.target.value })} placeholder="/about" dir="ltr" className="flex-1 h-8 text-sm" />
              <Button size="sm" variant="ghost" onClick={addFooterLink} className="h-8"><Plus className="w-3 h-3" /></Button>
            </div>
          </div>
        </Card>
      )}

      {/* Contact */}
      {activeTab === "contact" && (
        <Card className="p-6 md:p-8 space-y-5">
          <h3 className="font-bold text-carefd-navy flex items-center gap-2"><Phone className="w-5 h-5 text-carefd-teal" />פרטי קשר</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-sm font-medium flex items-center gap-1"><Mail className="w-3.5 h-3.5" />אימייל</label><Input value={settings.contact_email || ""} onChange={(e) => u("contact_email", e.target.value)} dir="ltr" /></div>
            <div className="space-y-1"><label className="text-sm font-medium flex items-center gap-1"><Phone className="w-3.5 h-3.5" />טלפון</label><Input value={settings.contact_phone || ""} onChange={(e) => u("contact_phone", e.target.value)} dir="ltr" /></div>
          </div>
          <div className="space-y-1"><label className="text-sm font-medium flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />כתובת</label><Input value={settings.contact_address || ""} onChange={(e) => u("contact_address", e.target.value)} /></div>
        </Card>
      )}

      {/* Social */}
      {activeTab === "social" && (
        <Card className="p-6 md:p-8 space-y-5">
          <h3 className="font-bold text-carefd-navy flex items-center gap-2"><Globe className="w-5 h-5 text-carefd-teal" />רשתות חברתיות</h3>
          {[
            { key: "social_facebook", label: "Facebook", icon: Facebook },
            { key: "social_instagram", label: "Instagram", icon: Instagram },
            { key: "social_twitter", label: "Twitter / X", icon: Twitter },
            { key: "social_linkedin", label: "LinkedIn", icon: Linkedin },
            { key: "social_youtube", label: "YouTube", icon: Youtube },
          ].map((s) => (
            <div key={s.key} className="space-y-1">
              <label className="text-sm font-medium flex items-center gap-1"><s.icon className="w-3.5 h-3.5" />{s.label}</label>
              <Input value={settings[s.key] || ""} onChange={(e) => u(s.key, e.target.value)} dir="ltr" placeholder={`https://${s.label.toLowerCase()}.com/...`} />
            </div>
          ))}
        </Card>
      )}

      {/* SEO */}
      {activeTab === "seo" && (
        <Card className="p-6 md:p-8 space-y-5">
          <h3 className="font-bold text-carefd-navy flex items-center gap-2"><Search className="w-5 h-5 text-carefd-teal" />SEO</h3>
          <div className="space-y-1"><label className="text-sm font-medium">תיאור Meta</label><Textarea value={settings.meta_description || ""} onChange={(e) => u("meta_description", e.target.value)} placeholder="תיאור האתר לגוגל..." />
            <p className="text-xs text-slate-400">{(settings.meta_description || "").length}/160</p></div>
          <div className="space-y-1"><label className="text-sm font-medium">מילות מפתח</label><Input value={settings.meta_keywords || ""} onChange={(e) => u("meta_keywords", e.target.value)} placeholder="בריאות, טיפול, סיעוד, רפואה" /></div>
          <div className="space-y-1"><label className="text-sm font-medium">Google Analytics ID</label><Input value={settings.google_analytics_id || ""} onChange={(e) => u("google_analytics_id", e.target.value)} dir="ltr" placeholder="G-XXXXXXXXXX" /></div>
        </Card>
      )}

      {/* Email */}
      {activeTab === "email" && (
        <div className="space-y-6">
          <Card className="p-6 md:p-8 space-y-5">
            <h3 className="font-bold text-carefd-navy flex items-center gap-2"><Mail className="w-5 h-5 text-carefd-teal" />הגדרות אימייל</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1"><label className="text-sm font-medium">ספק אימייל</label><Input value={smtp.email_provider || ""} onChange={(e) => setSmtp({ ...smtp, email_provider: e.target.value })} placeholder="smtp / resend / sendgrid" /></div>
              <div className="space-y-1"><label className="text-sm font-medium">כתובת שולח</label><Input value={smtp.sender_email || ""} onChange={(e) => setSmtp({ ...smtp, sender_email: e.target.value })} dir="ltr" /></div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1"><label className="text-sm font-medium">שם שולח</label><Input value={smtp.sender_name || ""} onChange={(e) => setSmtp({ ...smtp, sender_name: e.target.value })} /></div>
              <div className="space-y-1"><label className="text-sm font-medium">SMTP Host</label><Input value={smtp.smtp_host || ""} onChange={(e) => setSmtp({ ...smtp, smtp_host: e.target.value })} dir="ltr" /></div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-1"><label className="text-sm font-medium">Port</label><Input type="number" value={smtp.smtp_port || ""} onChange={(e) => setSmtp({ ...smtp, smtp_port: e.target.value })} /></div>
              <div className="space-y-1"><label className="text-sm font-medium">User</label><Input value={smtp.smtp_user || ""} onChange={(e) => setSmtp({ ...smtp, smtp_user: e.target.value })} dir="ltr" /></div>
              <div className="space-y-1"><label className="text-sm font-medium">Password</label><Input type="password" value={smtp.smtp_password || ""} onChange={(e) => setSmtp({ ...smtp, smtp_password: e.target.value })} /></div>
            </div>
            <Button onClick={handleSaveSmtp} disabled={saving} variant="secondary"><Save className="w-4 h-4 me-1" />שמור הגדרות אימייל</Button>
          </Card>
          <Card className="p-6 md:p-8 space-y-4">
            <h3 className="font-bold text-carefd-navy">שליחת אימייל בדיקה</h3>
            <div className="flex gap-2">
              <Input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="test@example.com" dir="ltr" className="flex-1" />
              <Button onClick={handleSendTestEmail} disabled={sendingTest}>{sendingTest ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : <Send className="w-4 h-4 me-1" />}שלח בדיקה</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Advanced */}
      {activeTab === "advanced" && (
        <Card className="p-6 md:p-8 space-y-6">
          <h3 className="font-bold text-carefd-navy flex items-center gap-2"><Database className="w-5 h-5 text-carefd-teal" />הגדרות מתקדמות</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-200">
              <div><p className="font-medium text-red-800">מצב תחזוקה</p><p className="text-xs text-red-600">כאשר פעיל, רק מנהלים יוכלו לגשת לאתר</p></div>
              <Switch checked={settings.maintenance_mode || false} onCheckedChange={(v) => u("maintenance_mode", v)} />
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div><p className="font-medium text-carefd-navy">אפשר הרשמות</p><p className="text-xs text-slate-400">אפשר למשתמשים חדשים להירשם</p></div>
              <Switch checked={settings.allow_registrations !== false} onCheckedChange={(v) => u("allow_registrations", v)} />
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div><p className="font-medium text-carefd-navy">אימות אימייל נדרש</p><p className="text-xs text-slate-400">דרוש אימות אימייל בעת הרשמה</p></div>
              <Switch checked={settings.require_email_verification !== false} onCheckedChange={(v) => u("require_email_verification", v)} />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}><Save className="w-4 h-4 me-1" />שמור הגדרות</Button>
        </Card>
      )}
    </div>
  );
}
