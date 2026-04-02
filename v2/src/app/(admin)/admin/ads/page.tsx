"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, Plus, Trash2, ExternalLink } from "lucide-react";

export default function AdminAdsPage() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", image_url: "", link_url: "" });

  const fetchData = () => {
    setLoading(true);
    api.get<{ ads: any[] }>("/admin/content/ads").then((d) => setAds(d.ads)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const createAd = async () => {
    if (!form.title) return;
    await api.post("/admin/content/ads", form);
    setForm({ title: "", description: "", image_url: "", link_url: "" });
    setShowForm(false);
    fetchData();
  };

  const deleteAd = async (id: string) => {
    if (!confirm("למחוק פרסומת זו?")) return;
    await api.delete(`/admin/content/ads/${id}`);
    fetchData();
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
          <div className="flex gap-2"><Button onClick={createAd} size="sm">שמור</Button><Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>ביטול</Button></div>
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
                  <h3 className="font-semibold text-primary">{a.title}</h3>
                  {a.description && <p className="text-xs text-slate-400">{a.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {a.linkUrl && <a href={a.linkUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80"><ExternalLink className="w-4 h-4" /></a>}
                <Button variant="ghost" size="icon" onClick={() => deleteAd(a.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
