"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileStack, Plus, Trash2, Edit, Save, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminPagesPage() {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", slug: "", content: "" });

  const fetchData = () => {
    setLoading(true);
    api.get<{ pages: any[] }>("/admin/content/pages").then((d) => setPages(d.pages)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleEdit = (page: any) => {
    setForm({ title: page.title || "", slug: page.slug || "", content: page.content || "" });
    setEditingId(page.id); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.slug) { toast.error("נא למלא כותרת ו-slug"); return; }
    setSaving(true);
    try {
      if (editingId) { await api.put(`/admin/content/pages/${editingId}`, form); toast.success("הדף עודכן"); }
      else { await api.post("/admin/content/pages", form); toast.success("הדף נוצר"); }
      setForm({ title: "", slug: "", content: "" }); setEditingId(null); setShowForm(false); fetchData();
    } catch { toast.error("שגיאה בשמירה"); }
    finally { setSaving(false); }
  };

  const deletePage = async (id: string) => {
    if (!confirm("למחוק דף זה?")) return;
    try { await api.delete(`/admin/content/pages/${id}`); toast.success("הדף נמחק"); fetchData(); }
    catch { toast.error("שגיאה"); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading font-semibold text-2xl">ניהול דפים ({pages.length})</h2>
        <Button onClick={() => setShowForm(!showForm)} size="sm"><Plus className="w-4 h-4 me-1" /> דף חדש</Button>
      </div>

      {showForm && (
        <Card className="p-6 mb-6 space-y-4">
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="כותרת" />
          <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="slug (URL)" dir="ltr" />
          <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="תוכן HTML..." className="min-h-[150px]" dir="ltr" />
          <div className="flex gap-2"><Button onClick={handleSave} disabled={saving} size="sm">{saving ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : <Save className="w-4 h-4 me-1" />}שמור</Button><Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditingId(null); }}>ביטול</Button></div>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : pages.length === 0 ? (
        <Card className="p-10 text-center"><FileStack className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400">אין דפים</p></Card>
      ) : (
        <div className="space-y-3">
          {pages.map((p) => (
            <Card key={p.id} className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-carefd-navy">{p.title}</h3>
                <p className="text-xs text-slate-400">/page/{p.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={p.isActive ? "success" : "outline"}>{p.isActive ? "פעיל" : "מושבת"}</Badge>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}><Edit className="w-4 h-4 text-carefd-teal" /></Button>
                <Button variant="ghost" size="icon" onClick={() => deletePage(p.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
