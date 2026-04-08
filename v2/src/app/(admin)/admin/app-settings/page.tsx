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
  Save, Loader2, Smartphone, Image, Home, Palette,
  Type, Layout, Eye, CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

const tabs = [
  { id: "app", label: "אפליקציה", icon: Smartphone },
  { id: "colors", label: "צבעים", icon: Palette },
  { id: "hero", label: "Hero", icon: Home },
  { id: "sections", label: "סקשנים", icon: Layout },
];

export default function AdminAppSettingsPage() {
  const [settings, setSettings] = useState<any>({
    app_name: "CareFD", app_short_name: "CareFD", app_description: "",
    app_icon_url: "", app_theme_color: "#19B8BA", app_background_color: "#ffffff",
    app_primary_color: "#19B8BA", app_secondary_color: "#1E4D5F", app_accent_color: "#D4B483",
    home_hero_title: "", home_hero_subtitle: "", home_hero_image: "",
    home_cta_text: "", home_cta_url: "",
    home_show_search: true, home_show_categories: true, home_show_featured: true, home_show_stats: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("app");

  useEffect(() => {
    api.get<any>("/admin/settings")
      .then((d) => { if (d?.settings || d) setSettings((prev: any) => ({ ...prev, ...(d.settings || d) })); })
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

  const u = (key: string, value: any) => setSettings((prev: any) => ({ ...prev, [key]: value }));

  if (loading) return <div><Skeleton className="h-10 w-48 mb-6" /><Skeleton className="h-96 w-full" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading font-semibold text-2xl">הגדרות אפליקציה</h2>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : saved ? <CheckCircle className="w-4 h-4 me-1" /> : <Save className="w-4 h-4 me-1" />}
          {saving ? "שומר..." : saved ? "נשמר!" : "שמור"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === t.id ? "bg-carefd-teal text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* App Tab */}
      {activeTab === "app" && (
        <Card className="p-6 space-y-4">
          <h3 className="font-bold text-carefd-navy flex items-center gap-2"><Smartphone className="w-5 h-5 text-carefd-teal" />פרטי האפליקציה</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-sm font-medium">שם האפליקציה</label><Input value={settings.app_name} onChange={(e) => u("app_name", e.target.value)} /></div>
            <div className="space-y-1"><label className="text-sm font-medium">שם קצר</label><Input value={settings.app_short_name} onChange={(e) => u("app_short_name", e.target.value)} /></div>
          </div>
          <div className="space-y-1"><label className="text-sm font-medium">תיאור</label><Textarea value={settings.app_description} onChange={(e) => u("app_description", e.target.value)} placeholder="תיאור קצר של האפליקציה..." /></div>
          <div className="space-y-1"><label className="text-sm font-medium flex items-center gap-1"><Image className="w-3.5 h-3.5" />אייקון (URL)</label><Input value={settings.app_icon_url} onChange={(e) => u("app_icon_url", e.target.value)} dir="ltr" placeholder="https://..." /></div>
          {settings.app_icon_url && <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100"><img src={settings.app_icon_url} alt="" className="w-full h-full object-cover" /></div>}
        </Card>
      )}

      {/* Colors Tab */}
      {activeTab === "colors" && (
        <Card className="p-6 space-y-4">
          <h3 className="font-bold text-carefd-navy flex items-center gap-2"><Palette className="w-5 h-5 text-carefd-teal" />צבעים</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { key: "app_theme_color", label: "צבע ראשי (Theme)" },
              { key: "app_primary_color", label: "צבע Primary" },
              { key: "app_secondary_color", label: "צבע Secondary" },
              { key: "app_accent_color", label: "צבע Accent" },
              { key: "app_background_color", label: "צבע רקע" },
            ].map((c) => (
              <div key={c.key} className="space-y-1">
                <label className="text-sm font-medium">{c.label}</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={settings[c.key] || "#19B8BA"} onChange={(e) => u(c.key, e.target.value)} className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer" />
                  <Input value={settings[c.key] || ""} onChange={(e) => u(c.key, e.target.value)} dir="ltr" className="font-mono text-sm flex-1" />
                </div>
              </div>
            ))}
          </div>
          {/* Preview */}
          <div className="p-4 rounded-xl border border-slate-200">
            <p className="text-sm font-medium text-slate-500 mb-2">תצוגה מקדימה</p>
            <div className="flex gap-3">
              {["app_primary_color", "app_secondary_color", "app_accent_color", "app_theme_color", "app_background_color"].map((k) => (
                <div key={k} className="text-center">
                  <div className="w-12 h-12 rounded-xl shadow-sm" style={{ backgroundColor: settings[k] }} />
                  <p className="text-[10px] text-slate-400 mt-1">{k.split("_").pop()}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Hero Tab */}
      {activeTab === "hero" && (
        <Card className="p-6 space-y-4">
          <h3 className="font-bold text-carefd-navy flex items-center gap-2"><Home className="w-5 h-5 text-carefd-teal" />אזור ה-Hero</h3>
          <div className="space-y-1"><label className="text-sm font-medium">כותרת Hero</label><Input value={settings.home_hero_title} onChange={(e) => u("home_hero_title", e.target.value)} placeholder="שירותי בריאות פרמיום" /></div>
          <div className="space-y-1"><label className="text-sm font-medium">תת-כותרת Hero</label><Input value={settings.home_hero_subtitle} onChange={(e) => u("home_hero_subtitle", e.target.value)} placeholder="מצאו את המטפל המושלם..." /></div>
          <div className="space-y-1"><label className="text-sm font-medium flex items-center gap-1"><Image className="w-3.5 h-3.5" />תמונת רקע Hero (URL)</label><Input value={settings.home_hero_image} onChange={(e) => u("home_hero_image", e.target.value)} dir="ltr" /></div>
          {settings.home_hero_image && <div className="h-40 rounded-xl overflow-hidden bg-slate-100"><img src={settings.home_hero_image} alt="" className="w-full h-full object-cover" /></div>}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-sm font-medium">טקסט כפתור CTA</label><Input value={settings.home_cta_text} onChange={(e) => u("home_cta_text", e.target.value)} placeholder="התחל עכשיו" /></div>
            <div className="space-y-1"><label className="text-sm font-medium">URL כפתור CTA</label><Input value={settings.home_cta_url} onChange={(e) => u("home_cta_url", e.target.value)} dir="ltr" placeholder="/register" /></div>
          </div>
        </Card>
      )}

      {/* Sections Tab */}
      {activeTab === "sections" && (
        <Card className="p-6 space-y-6">
          <h3 className="font-bold text-carefd-navy flex items-center gap-2"><Layout className="w-5 h-5 text-carefd-teal" />סקשנים בדף הבית</h3>
          {[
            { key: "home_show_search", label: "הצג חיפוש מתקדם", desc: "בר חיפוש באזור ה-Hero" },
            { key: "home_show_categories", label: "הצג קטגוריות", desc: "רשימת מקצועות וקטגוריות" },
            { key: "home_show_featured", label: "הצג ספקים מומלצים", desc: "כרטיסי ספקים מומלצים" },
            { key: "home_show_stats", label: "הצג סטטיסטיקות", desc: "מספרי משתמשים, ספקים, וכו'" },
          ].map((s) => (
            <div key={s.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="font-medium text-carefd-navy">{s.label}</p>
                <p className="text-xs text-slate-400">{s.desc}</p>
              </div>
              <Switch checked={settings[s.key] !== false} onCheckedChange={(v) => u(s.key, v)} />
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
