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
  PenTool, Plus, Trash2, Edit, Eye, EyeOff, Save, X, Loader2,
  Image, Tag, Calendar, BarChart3, ExternalLink, Search,
} from "lucide-react";
import { toast } from "sonner";

const generateSlug = (title: string) =>
  title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft">("all");
  const [form, setForm] = useState({
    title: "", slug: "", content: "", excerpt: "",
    featured_image: "", tags: [] as string[], is_published: true,
  });
  const [newTag, setNewTag] = useState("");

  const fetchData = () => {
    setLoading(true);
    api.get<{ posts: any[] }>("/admin/content/blog")
      .then((d) => setPosts(d.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setForm({ title: "", slug: "", content: "", excerpt: "", featured_image: "", tags: [], is_published: true });
    setEditingId(null); setShowForm(false); setNewTag("");
  };

  const handleEdit = (post: any) => {
    setForm({
      title: post.title || "", slug: post.slug || "", content: post.content || "",
      excerpt: post.excerpt || "", featured_image: post.featured_image || post.featuredImage || "",
      tags: post.tags || [], is_published: post.isPublished !== false && post.is_published !== false,
    });
    setEditingId(post.id); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title) { toast.error("נא למלא כותרת"); return; }
    const slug = form.slug || generateSlug(form.title);
    setSaving(true);
    try {
      const data = { ...form, slug };
      if (editingId) { await api.put(`/admin/content/blog/${editingId}`, data); toast.success("הפוסט עודכן"); }
      else { await api.post("/admin/content/blog", data); toast.success("הפוסט נוצר"); }
      resetForm(); fetchData();
    } catch { toast.error("שגיאה בשמירה"); }
    finally { setSaving(false); }
  };

  const togglePublish = async (id: string, current: boolean) => {
    try {
      await api.put(`/admin/content/blog/${id}`, { is_published: !current });
      toast.success(current ? "הפוסט הוסתר" : "הפוסט פורסם");
      fetchData();
    } catch { toast.error("שגיאה"); }
  };

  const deletePost = async (id: string) => {
    if (!confirm("למחוק פוסט זה?")) return;
    try { await api.delete(`/admin/content/blog/${id}`); toast.success("נמחק"); fetchData(); }
    catch { toast.error("שגיאה"); }
  };

  const addTag = () => {
    if (!newTag.trim() || form.tags.includes(newTag.trim())) return;
    setForm({ ...form, tags: [...form.tags, newTag.trim()] });
    setNewTag("");
  };

  const removeTag = (tag: string) => setForm({ ...form, tags: form.tags.filter((t) => t !== tag) });

  const filtered = posts.filter((p) => {
    const matchSearch = !search || (p.title || "").toLowerCase().includes(search.toLowerCase());
    const isPub = p.isPublished !== false && p.is_published !== false;
    const matchStatus = filterStatus === "all" || (filterStatus === "published" && isPub) || (filterStatus === "draft" && !isPub);
    return matchSearch && matchStatus;
  });

  const publishedCount = posts.filter((p) => p.isPublished !== false && p.is_published !== false).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-heading font-semibold text-2xl">ניהול בלוג</h2>
          <p className="text-sm text-slate-400 mt-1">{posts.length} פוסטים • {publishedCount} פורסמו</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 me-1" />פוסט חדש</Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חפש פוסט..." className="ps-10 h-10" />
        </div>
        <div className="flex gap-2">
          {([["all", "הכל"], ["published", "פורסמו"], ["draft", "טיוטות"]] as const).map(([v, l]) => (
            <button key={v} onClick={() => setFilterStatus(v)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${filterStatus === v ? "bg-carefd-teal text-white" : "bg-white text-slate-600 border border-slate-200"}`}>{l}</button>
          ))}
        </div>
      </div>

      {/* Editor Form */}
      {showForm && (
        <Card className="p-6 mb-6 border-2 border-carefd-teal">
          <h3 className="font-bold text-carefd-navy text-lg mb-4">{editingId ? "עריכת פוסט" : "פוסט חדש"}</h3>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">כותרת *</label>
                <Input value={form.title} onChange={(e) => {
                  setForm({ ...form, title: e.target.value, slug: form.slug || generateSlug(e.target.value) });
                }} placeholder="כותרת הפוסט" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Slug (URL)</label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="post-url-slug" dir="ltr" className="font-mono text-sm" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">תקציר</label>
                <Input value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="תקציר קצר לתצוגה מקדימה..." />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1"><Image className="w-3.5 h-3.5" />תמונה ראשית (URL)</label>
                <Input value={form.featured_image} onChange={(e) => setForm({ ...form, featured_image: e.target.value })} placeholder="https://..." dir="ltr" />
              </div>
            </div>
            {/* Image Preview */}
            {form.featured_image && (
              <div className="relative w-full h-48 rounded-xl overflow-hidden bg-slate-100">
                <img src={form.featured_image} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">תוכן</label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="תוכן הפוסט..." className="min-h-[250px] font-mono text-sm" />
            </div>
            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1"><Tag className="w-3.5 h-3.5" />תגיות</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="gap-1 py-1">{tag}<button onClick={() => removeTag(tag)} className="hover:text-red-500 ms-1"><X className="w-3 h-3" /></button></Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="הוסף תגית..." className="h-8 text-sm flex-1"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} />
                <Button size="sm" variant="ghost" onClick={addTag} className="h-8"><Plus className="w-3 h-3 me-1" />הוסף</Button>
              </div>
            </div>
            {/* Publish Toggle */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
              <span className="text-sm font-medium">{form.is_published ? "פרסם מיד" : "שמור כטיוטה"}</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : <Save className="w-4 h-4 me-1" />}
                {saving ? "שומר..." : "שמור"}
              </Button>
              <Button variant="ghost" onClick={resetForm}><X className="w-4 h-4 me-1" />ביטול</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Posts Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center"><PenTool className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-lg">{search ? "לא נמצאו פוסטים" : "אין פוסטים עדיין"}</p></Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const isPub = p.isPublished !== false && p.is_published !== false;
            return (
              <Card key={p.id} className={`overflow-hidden hover:shadow-lg transition ${!isPub ? "opacity-70" : ""}`}>
                {/* Image */}
                {(p.featured_image || p.featuredImage) ? (
                  <div className="h-40 bg-slate-100"><img src={p.featured_image || p.featuredImage} alt="" className="w-full h-full object-cover" /></div>
                ) : (
                  <div className="h-40 bg-gradient-to-br from-carefd-teal/20 to-carefd-navy/20 flex items-center justify-center"><PenTool className="w-10 h-10 text-carefd-teal/40" /></div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={isPub ? "success" : "outline"} className="text-[10px]">{isPub ? "פורסם" : "טיוטה"}</Badge>
                    {p.views_count > 0 && <span className="text-xs text-slate-400 flex items-center gap-1"><BarChart3 className="w-3 h-3" />{p.views_count}</span>}
                  </div>
                  <h3 className="font-bold text-carefd-navy line-clamp-1 mb-1">{p.title}</h3>
                  {(p.excerpt || p.content) && <p className="text-sm text-slate-400 line-clamp-2 mb-2">{p.excerpt || p.content?.slice(0, 100)}</p>}
                  {(p.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(p.tags as string[]).slice(0, 3).map((t) => <Badge key={t} variant="outline" className="text-[10px] py-0">{t}</Badge>)}
                      {(p.tags as string[]).length > 3 && <span className="text-[10px] text-slate-400">+{p.tags.length - 3}</span>}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                    <Calendar className="w-3 h-3" />{p.createdAt || p.created_at ? new Date(p.createdAt || p.created_at).toLocaleDateString("he-IL") : ""}
                  </div>
                  <div className="flex items-center gap-1 border-t border-slate-100 pt-3">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(p)} title="ערוך"><Edit className="w-4 h-4 text-carefd-teal" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => togglePublish(p.id, isPub)} title={isPub ? "הסתר" : "פרסם"}>
                      {isPub ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-green-600" />}
                    </Button>
                    {p.slug && <Button size="sm" variant="ghost" asChild title="צפה"><a href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4 text-slate-400" /></a></Button>}
                    <Button size="sm" variant="ghost" onClick={() => deletePost(p.id)} title="מחק" className="ms-auto"><Trash2 className="w-4 h-4 text-red-400" /></Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
