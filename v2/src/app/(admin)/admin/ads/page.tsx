"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, Plus, Trash2, ExternalLink, Edit, Eye, EyeOff, Save, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminAdsPage() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", image_url: "", link_url: "", is_active: true });

  const fetchData = () => {
    setLoading(true);
    api.get<{ ads: any[] }>("/admin/content/ads").then((d) => setAds(d.ads)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleEdit = (ad: any) => {
    setForm({ title: ad.title || "", description: ad.description || "", image_url: ad.imageUrl || ad.image_url || "", link_url: ad.linkUrl || ad.link_url || "", is_active: ad.isActive !== false });
    setEditingId(ad.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title) { toast.error("נא למלא כותרת"); return; }
    setSaving(true);
    try {
      if (editingId) { await api.put(`/admin/content/ads/${editingId}`, form); toast.success("עודכן"); }
      else { await api.post("/admin/content/ads", form); toast.success("נוצר"); }
      setForm({ title: "", description: "", image_url: "", link_url: "", is_active: true });
      setEditingId(null); setShowForm(false); fetchData();
    } catch { toast.error("שגיאה"); }
    finally { setSaving(false); }
  };

  const deleteAd = async (id: string) => {
    if (!confirm("למחוק פרסומת זו?")) return;
    try { await api.delete(`/admin/content/ads/${id}`); toast.success("נמחק"); fetchData(); }
    catch { toast.error("שגיאה"); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading font-semibold text-2xl">ניהול פרסום ({ads.length})</h2>
        <Button onClick={() => setShowForm(!showForm)} size="sm"><Plus className="w-4 h-4 me-1" /> פרסומת חדשה</Button>
      </div>

      {showForm && (
        <Card className="p-6 mb-6 space-y-4">
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="כותרת" />
          <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="תיאור" />
          <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="URL תמונה" dir="ltr" />
          <Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="URL קישור" dir="ltr" />
          <div className="flex gap-2"><Button onClick={handleSave} disabled={saving} size="sm">{saving ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : <Save className="w-4 h-4 me-1" />}שמור</Button><Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditingId(null); }}>ביטול</Button></div>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : ads.length === 0 ? (
        <Card className="p-10 text-center"><Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400">אין פרסומות</p></Card>
      ) : (
        <div className="space-y-3">
          {ads.map((a) => (
            <Card key={a.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {a.imageUrl && <img src={a.imageUrl} alt="" className="w-16 h-12 rounded-lg object-cover" />}
                <div>
                  <h3 className="font-semibold text-carefd-navy">{a.title}</h3>
                  {a.description && <p className="text-xs text-slate-400">{a.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(a.linkUrl || a.link_url) && <a href={a.linkUrl || a.link_url} target="_blank" rel="noopener noreferrer" className="text-carefd-teal hover:text-carefd-teal/80"><ExternalLink className="w-4 h-4" /></a>}
                <Button variant="ghost" size="icon" onClick={() => handleEdit(a)}><Edit className="w-4 h-4 text-carefd-teal" /></Button>
                <Button variant="ghost" size="icon" onClick={() => deleteAd(a.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
