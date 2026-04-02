"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PenTool, Plus, Trash2 } from "lucide-react";

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", slug: "", content: "" });

  const fetchData = () => {
    setLoading(true);
    api.get<{ posts: any[] }>("/admin/content/blog").then((d) => setPosts(d.posts)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const createPost = async () => {
    if (!form.title || !form.slug) return;
    await api.post("/admin/content/blog", form);
    setForm({ title: "", slug: "", content: "" });
    setShowForm(false);
    fetchData();
  };

  const deletePost = async (id: string) => {
    if (!confirm("למחוק פוסט זה?")) return;
    await api.delete(`/admin/content/blog/${id}`);
    fetchData();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading font-semibold text-2xl">ניהול בלוג ({posts.length})</h2>
        <Button onClick={() => setShowForm(!showForm)} size="sm"><Plus className="w-4 h-4 me-1" /> פוסט חדש</Button>
      </div>

      {showForm && (
        <Card className="p-6 mb-6 space-y-4">
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="כותרת" />
          <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="slug (URL)" dir="ltr" />
          <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="תוכן..." className="min-h-[150px]" />
          <div className="flex gap-2">
            <Button onClick={createPost} size="sm">שמור</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>ביטול</Button>
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
              <div>
                <h3 className="font-semibold text-primary">{p.title}</h3>
                <p className="text-xs text-slate-400">/{p.slug} &bull; {new Date(p.createdAt).toLocaleDateString("he-IL")}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={p.isPublished ? "success" : "outline"}>{p.isPublished ? "פורסם" : "טיוטה"}</Badge>
                <Button variant="ghost" size="icon" onClick={() => deletePost(p.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
