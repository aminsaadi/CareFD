"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  FileStack, Plus, Trash2, Edit, Save, X, Loader2,
  Eye, EyeOff, ExternalLink, Search, Globe,
} from "lucide-react";
import { toast } from "sonner";

const generateSlug = (title: string) =>
  title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();

export default function AdminPagesPage() {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    title: "", slug: "", content: "", meta_description: "", is_active: true,
  });

  const fetchData = () => {
    setLoading(true);
    api.get<{ pages: any[] }>("/admin/content/pages")
      .then((d) => setPages(d.pages || []))
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setForm({ title: "", slug: "", content: "", meta_description: "", is_active: true });
    setEditingId(null); setShowForm(false);
  };

  const handleEdit = (page: any) => {
    setForm({
      title: page.title || "", slug: page.slug || "", content: page.content || "",
      meta_description: page.meta_description || page.metaDescription || "",
      is_active: page.isActive !== false && page.is_active !== false,
    });
    setEditingId(page.id); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title) { toast.error("נא למלא כותרת"); return; }
    const slug = form.slug || generateSlug(form.title);
    setSaving(true);
    try {
      const data = { ...form, slug };
      if (editingId) { await api.put(`/admin/content/pages/${editingId}`, data); toast.success("הדף עודכן"); }
      else { await api.post("/admin/content/pages", data); toast.success("הדף נוצר"); }
      resetForm(); fetchData();
    } catch { toast.error("שגיאה"); }
    finally { setSaving(false); }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await api.put(`/admin/content/pages/${id}`, { is_active: !current });
      toast.success(current ? "הדף הושבת" : "הדף הופעל");
      fetchData();
    } catch { toast.error("שגיאה"); }
  };

  const deletePage = async (id: string) => {
    if (!confirm("למחוק דף זה?")) return;
    try { await api.delete(`/admin/content/pages/${id}`); toast.success("נמחק"); fetchData(); }
    catch { toast.error("שגיאה"); }
  };

  const filtered = pages.filter((p) => !search || (p.title || "").toLowerCase().includes(search.toLowerCase()));
  const activeCount = pages.filter((p) => p.isActive !== false && p.is_active !== false).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-heading font-semibold text-2xl">ניהול דפים</h2>
          <p className="text-sm text-slate-400 mt-1">{pages.length} דפים • {activeCount} פעילים</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 me-1" />דף חדש</Button>
      </div>

      {/* Search */}
      {pages.length > 3 && (
        <div className="relative mb-4">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חפש דף..." className="ps-10 h-10" />
        </div>
      )}

      {/* Editor */}
      {showForm && (
        <Card className="p-6 mb-6 border-2 border-carefd-teal">
          <h3 className="font-bold text-carefd-navy text-lg mb-4">{editingId ? "עריכת דף" : "דף חדש"}</h3>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">כותרת *</label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || generateSlug(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Slug (URL)</label>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-slate-400">/page/</span>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} dir="ltr" className="font-mono text-sm flex-1" />
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium flex items-center gap-1"><Globe className="w-3.5 h-3.5" />תיאור SEO (Meta Description)</label>
              <Input value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} placeholder="תיאור קצר לגוגל..." />
              <p className="text-xs text-slate-400">{(form.meta_description || "").length}/160 תווים</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">תוכן (HTML)</label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="תוכן הדף בפורמט HTML..." className="min-h-[250px] font-mono text-sm" dir="ltr" />
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <span className="text-sm font-medium">{form.is_active ? "פעיל" : "מושבת"}</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : <Save className="w-4 h-4 me-1" />}שמור</Button>
              <Button variant="ghost" onClick={resetForm}><X className="w-4 h-4 me-1" />ביטול</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Pages Table */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center"><FileStack className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400">אין דפים</p></Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 text-slate-500 bg-carefd-stone/50">
                <th className="p-3 text-start font-medium">כותרת</th>
                <th className="p-3 text-start font-medium">URL</th>
                <th className="p-3 text-start font-medium">סטטוס</th>
                <th className="p-3 text-start font-medium">עודכן</th>
                <th className="p-3 text-start font-medium">פעולות</th>
              </tr></thead>
              <tbody>
                {filtered.map((p) => {
                  const isActive = p.isActive !== false && p.is_active !== false;
                  return (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-carefd-stone/30">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <FileStack className="w-4 h-4 text-carefd-teal flex-shrink-0" />
                          <span className="font-medium text-carefd-navy">{p.title}</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-400 font-mono text-xs">/page/{p.slug}</td>
                      <td className="p-3">
                        <button onClick={() => toggleActive(p.id, isActive)} className="cursor-pointer">
                          <Badge variant={isActive ? "success" : "outline"}>{isActive ? "פעיל" : "מושבת"}</Badge>
                        </button>
                      </td>
                      <td className="p-3 text-slate-400 text-xs">{p.updatedAt || p.createdAt ? new Date(p.updatedAt || p.createdAt).toLocaleDateString("he-IL") : "-"}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(p)} title="ערוך"><Edit className="w-4 h-4 text-carefd-teal" /></Button>
                          <Button size="sm" variant="ghost" asChild title="צפה"><a href={`/page/${p.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4 text-slate-400" /></a></Button>
                          <Button size="sm" variant="ghost" onClick={() => deletePage(p.id)} title="מחק"><Trash2 className="w-4 h-4 text-red-400" /></Button>
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
