"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Megaphone, Plus, Trash2, Edit, ExternalLink, Save, X, Loader2,
  Eye, BarChart3, MousePointer, Calendar, Image,
} from "lucide-react";
import { toast } from "sonner";

const positionLabels: Record<string, string> = {
  homepage_top: "דף הבית - למעלה", homepage_middle: "דף הבית - אמצע",
  sidebar: "סיידבר", providers_page: "דף ספקים",
  services_page: "דף שירותים", footer: "פוטר",
};

export default function AdminAdsPage() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", image_url: "", link_url: "",
    position: "homepage_top", start_date: "", end_date: "", is_active: true,
  });

  const fetchData = () => {
    setLoading(true);
    api.get<{ ads: any[] }>("/admin/content/ads")
      .then((d) => setAds(d.ads || []))
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setForm({ title: "", description: "", image_url: "", link_url: "", position: "homepage_top", start_date: "", end_date: "", is_active: true });
    setEditingId(null); setShowForm(false);
  };

  const handleEdit = (ad: any) => {
    setForm({
      title: ad.title || "", description: ad.description || "",
      image_url: ad.imageUrl || ad.image_url || "", link_url: ad.linkUrl || ad.link_url || "",
      position: ad.position || "homepage_top",
      start_date: ad.start_date || ad.startDate || "", end_date: ad.end_date || ad.endDate || "",
      is_active: ad.isActive !== false && ad.is_active !== false,
    });
    setEditingId(ad.id); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title) { toast.error("נא למלא כותרת"); return; }
    setSaving(true);
    try {
      if (editingId) { await api.put(`/admin/content/ads/${editingId}`, form); toast.success("עודכן"); }
      else { await api.post("/admin/content/ads", form); toast.success("נוצר"); }
      resetForm(); fetchData();
    } catch { toast.error("שגיאה"); }
    finally { setSaving(false); }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await api.put(`/admin/content/ads/${id}`, { is_active: !current });
      toast.success(current ? "המודעה הושבתה" : "המודעה הופעלה");
      fetchData();
    } catch { toast.error("שגיאה"); }
  };

  const deleteAd = async (id: string) => {
    if (!confirm("למחוק מודעה זו?")) return;
    try { await api.delete(`/admin/content/ads/${id}`); toast.success("נמחק"); fetchData(); }
    catch { toast.error("שגיאה"); }
  };

  const activeCount = ads.filter((a) => a.isActive !== false && a.is_active !== false).length;
  const totalViews = ads.reduce((s, a) => s + (a.views || a.views_count || 0), 0);
  const totalClicks = ads.reduce((s, a) => s + (a.clicks || a.clicks_count || 0), 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading font-semibold text-2xl">ניהול פרסום</h2>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 me-1" />מודעה חדשה</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "סה\"כ מודעות", value: ads.length, icon: Megaphone, color: "text-purple-600 bg-purple-50" },
          { label: "פעילות", value: activeCount, icon: Eye, color: "text-green-600 bg-green-50" },
          { label: "צפיות", value: totalViews.toLocaleString(), icon: BarChart3, color: "text-blue-600 bg-blue-50" },
          { label: "קליקים", value: totalClicks.toLocaleString(), icon: MousePointer, color: "text-carefd-teal bg-carefd-teal/10" },
        ].map((s) => (
          <Card key={s.label} className="p-4 border-0">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color} mb-2`}><s.icon className="w-4 h-4" /></div>
            <p className="text-xl font-bold text-carefd-navy">{s.value}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <Card className="p-6 mb-6 border-2 border-carefd-teal">
          <h3 className="font-bold text-carefd-navy text-lg mb-4">{editingId ? "עריכת מודעה" : "מודעה חדשה"}</h3>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1"><label className="text-sm font-medium">כותרת *</label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-1"><label className="text-sm font-medium">תיאור</label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1"><label className="text-sm font-medium flex items-center gap-1"><Image className="w-3.5 h-3.5" />URL תמונה</label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} dir="ltr" /></div>
              <div className="space-y-1"><label className="text-sm font-medium">URL קישור</label><Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} dir="ltr" /></div>
            </div>
            {form.image_url && <div className="h-32 rounded-xl overflow-hidden bg-slate-100"><img src={form.image_url} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} /></div>}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">מיקום</label>
                <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                  {Object.entries(positionLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-1"><label className="text-sm font-medium flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />תאריך התחלה</label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
              <div className="space-y-1"><label className="text-sm font-medium flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />תאריך סיום</label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <span className="text-sm font-medium">{form.is_active ? "פעילה" : "מושבתת"}</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : <Save className="w-4 h-4 me-1" />}שמור</Button>
              <Button variant="ghost" onClick={resetForm}><X className="w-4 h-4 me-1" />ביטול</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Ads Table */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : ads.length === 0 ? (
        <Card className="p-12 text-center"><Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400">אין מודעות</p></Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 text-slate-500 bg-carefd-stone/50">
                <th className="p-3 text-start font-medium">מודעה</th>
                <th className="p-3 text-start font-medium">מיקום</th>
                <th className="p-3 text-start font-medium">צפיות</th>
                <th className="p-3 text-start font-medium">קליקים</th>
                <th className="p-3 text-start font-medium">CTR</th>
                <th className="p-3 text-start font-medium">תקופה</th>
                <th className="p-3 text-start font-medium">סטטוס</th>
                <th className="p-3 text-start font-medium">פעולות</th>
              </tr></thead>
              <tbody>
                {ads.map((a) => {
                  const views = a.views || a.views_count || 0;
                  const clicks = a.clicks || a.clicks_count || 0;
                  const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : "0";
                  const isActive = a.isActive !== false && a.is_active !== false;
                  return (
                    <tr key={a.id} className="border-b border-slate-50 hover:bg-carefd-stone/30">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {(a.imageUrl || a.image_url) && <img src={a.imageUrl || a.image_url} alt="" className="w-16 h-10 rounded object-cover flex-shrink-0" />}
                          <div><p className="font-medium text-carefd-navy">{a.title}</p>{a.description && <p className="text-xs text-slate-400 line-clamp-1">{a.description}</p>}</div>
                        </div>
                      </td>
                      <td className="p-3 text-xs"><Badge variant="outline">{positionLabels[a.position] || a.position || "-"}</Badge></td>
                      <td className="p-3 text-slate-500">{views.toLocaleString()}</td>
                      <td className="p-3 text-slate-500">{clicks.toLocaleString()}</td>
                      <td className="p-3 font-medium text-carefd-teal">{ctr}%</td>
                      <td className="p-3 text-xs text-slate-400">
                        {(a.start_date || a.startDate) ? new Date(a.start_date || a.startDate).toLocaleDateString("he-IL") : "-"}
                        {(a.end_date || a.endDate) && ` - ${new Date(a.end_date || a.endDate).toLocaleDateString("he-IL")}`}
                      </td>
                      <td className="p-3">
                        <button onClick={() => toggleActive(a.id, isActive)} className="cursor-pointer">
                          <Badge variant={isActive ? "success" : "outline"}>{isActive ? "פעילה" : "מושבתת"}</Badge>
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(a)}><Edit className="w-4 h-4 text-carefd-teal" /></Button>
                          {(a.linkUrl || a.link_url) && <Button size="sm" variant="ghost" asChild><a href={a.linkUrl || a.link_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /></a></Button>}
                          <Button size="sm" variant="ghost" onClick={() => deleteAd(a.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
