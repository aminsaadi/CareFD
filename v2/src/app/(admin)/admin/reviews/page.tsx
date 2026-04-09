"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Check, X, Trash2, Eye, Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const filters = [
  { v: "all", l: "הכל" }, { v: "pending", l: "ממתין" },
  { v: "approved", l: "מאושר" }, { v: "rejected", l: "נדחה" },
];

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    api.get<{ reviews: any[] }>("/admin/reviews", filter !== "all" ? { status: filter } : {})
      .then((d) => setReviews(d.reviews || []))
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filter]);

  const handleAction = async (id: string, action: string) => {
    try {
      await api.put(`/admin/reviews/${id}`, { action });
      toast.success(action === "approve" ? "הביקורת אושרה" : "הביקורת נדחתה");
      fetchData();
    } catch { toast.error("שגיאה בעדכון הביקורת"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("האם למחוק ביקורת זו?")) return;
    try { await api.delete(`/admin/reviews/${id}`); toast.success("הביקורת נמחקה"); fetchData(); }
    catch { toast.error("שגיאה במחיקת הביקורת"); }
  };

  const filtered = reviews.filter((r) => {
    if (!search) return true;
    return (r.comment || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.user?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.provider?.businessName || r.provider?.business_name || "").toLowerCase().includes(search.toLowerCase());
  });

  const stats = {
    total: reviews.length,
    pending: reviews.filter((r) => r.status === "pending").length,
    approved: reviews.filter((r) => r.status === "approved").length,
    avgRating: reviews.length > 0 ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : "0",
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-heading font-semibold text-2xl">ניהול ביקורות</h2>
          <p className="text-sm text-slate-400 mt-1">{stats.total} ביקורות • {stats.pending} ממתינות • דירוג ממוצע: {stats.avgRating}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-2">
          {filters.map((f) => (
            <button key={f.v} onClick={() => setFilter(f.v)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${filter === f.v ? "bg-carefd-teal text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
              {f.l}
              {f.v === "pending" && stats.pending > 0 && <span className="ms-1 bg-red-500 text-white rounded-full px-1.5 text-[10px]">{stats.pending}</span>}
            </button>
          ))}
        </div>
        {reviews.length > 5 && (
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חפש ביקורת..." className="ps-10 h-9" />
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-slate-400"><Star className="w-12 h-12 mx-auto mb-3 text-slate-300" /><p>אין ביקורות</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id || r.review_id} className="p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  {/* User avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-carefd-teal to-carefd-navy flex items-center justify-center text-white font-bold flex-shrink-0">
                    {(r.user?.name || "M")[0]}
                  </div>
                  <div>
                    <p className="font-medium text-carefd-navy">{r.user?.name || "אנונימי"}</p>
                    <p className="text-xs text-slate-400">על: <Link href={`/providers/${r.provider_id}`} className="text-carefd-teal hover:underline">{r.provider?.businessName || r.provider?.business_name || "ספק"}</Link></p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Stars */}
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((s) => <Star key={s} className={`w-4 h-4 ${s <= r.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />)}
                  </div>
                  <Badge variant={r.status === "pending" ? "warning" : r.status === "approved" ? "success" : "destructive"} className="text-[10px]">
                    {r.status === "pending" ? "ממתין" : r.status === "approved" ? "מאושר" : "נדחה"}
                  </Badge>
                </div>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">{r.comment}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{r.created_at || r.createdAt ? new Date(r.created_at || r.createdAt).toLocaleDateString("he-IL") : ""}</span>
                <div className="flex gap-1">
                  {r.status === "pending" && (
                    <>
                      <Button size="sm" className="bg-carefd-teal hover:bg-carefd-teal-medium h-7" onClick={() => handleAction(r.id || r.review_id, "approve")}>
                        <Check className="w-3 h-3 me-1" />אשר
                      </Button>
                      <Button variant="destructive" size="sm" className="h-7" onClick={() => handleAction(r.id || r.review_id, "reject")}>
                        <X className="w-3 h-3 me-1" />דחה
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="sm" className="h-7 text-red-400" onClick={() => handleDelete(r.id || r.review_id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
