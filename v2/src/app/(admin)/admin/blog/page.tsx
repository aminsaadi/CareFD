"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PenTool, Plus, Trash2, Edit, Eye, EyeOff, Save, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", slug: "", content: "", excerpt: "", is_published: true });

  const fetchData = () => {
    setLoading(true);
    api.get<{ posts: any[] }>("/admin/content/blog")
      .then((d) => setPosts(d.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setForm({ title: "", slug: "", content: "", excerpt: "", is_published: true });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (post: any) => {
    setForm({
      title: post.title || "", slug: post.slug || "", content: post.content || "",
      excerpt: post.excerpt || "", is_published: post.isPublished !== false,
    });
    setEditingId(post.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.slug) { toast.error("נא למלא כותרת ו-slug"); return; }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/admin/content/blog/${editingId}`, form);
        toast.success("הפוסט עודכן");
      } else {
        await api.post("/admin/content/blog", form);
        toast.success("הפוסט נוצר");
      }
      resetForm();
      fetchData();
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
    try {
      await api.delete(`/admin/content/blog/${id}`);
      toast.success("הפוסט נמחק");
      fetchData();
    } catch { toast.error("שגיאה במחיקה"); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading font-semibold text-2xl">ניהול בלוג ({posts.length})</h2>
        <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm">
          <Plus className="w-4 h-4 me-1" /> פוסט חדש
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 mb-6 space-y-4 border-2 border-carefd-teal">
          <h3 className="font-bold text-carefd-navy">{editingId ? "עריכת פוסט" : "פוסט חדש"}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-sm font-medium text-slate-700">כותרת *</label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="כותרת הפוסט" /></div>
            <div className="space-y-1"><label className="text-sm font-medium text-slate-700">Slug *</label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="post-url-slug" dir="ltr" /></div>
          </div>
          <div className="space-y-1"><label className="text-sm font-medium text-slate-700">תקציר</label><Input value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="תקציר קצר..." /></div>
          <div className="space-y-1"><label className="text-sm font-medium text-slate-700">תוכן</label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="תוכן הפוסט..." className="min-h-[200px]" /></div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="w-4 h-4 text-carefd-teal rounded" />
              <span className="text-sm font-medium">פרסם מיד</span>
            </label>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : <Save className="w-4 h-4 me-1" />}
              {saving ? "שומר..." : "שמור"}
            </Button>
            <Button variant="ghost" onClick={resetForm}><X className="w-4 h-4 me-1" />ביטול</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : posts.length === 0 ? (
        <Card className="p-10 text-center"><PenTool className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400">אין פוסטים</p></Card>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <Card key={p.id} className="p-4 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-carefd-navy">{p.title}</h3>
                <p className="text-xs text-slate-400">/{p.slug} • {p.createdAt ? new Date(p.createdAt).toLocaleDateString("he-IL") : ""}</p>
                {p.excerpt && <p className="text-sm text-slate-500 mt-1 line-clamp-1">{p.excerpt}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant={p.isPublished ? "success" : "outline"}>{p.isPublished ? "פורסם" : "טיוטה"}</Badge>
                <Button variant="ghost" size="sm" onClick={() => togglePublish(p.id, p.isPublished)} title={p.isPublished ? "הסתר" : "פרסם"}>
                  {p.isPublished ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-green-600" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(p)} title="ערוך"><Edit className="w-4 h-4 text-carefd-teal" /></Button>
                <Button variant="ghost" size="sm" onClick={() => deletePost(p.id)} title="מחק"><Trash2 className="w-4 h-4 text-red-400" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
