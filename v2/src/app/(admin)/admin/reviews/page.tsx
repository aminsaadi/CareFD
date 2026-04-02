"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Check, X } from "lucide-react";

const filters = [
  { v: "pending", l: "ממתין" }, { v: "approved", l: "מאושר" },
  { v: "rejected", l: "נדחה" }, { v: "all", l: "הכל" },
];

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    api.get<{ reviews: any[] }>("/admin/reviews", { status: filter })
      .then((d) => setReviews(d.reviews))
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filter]);

  const handleAction = async (id: string, action: string) => {
    try { await api.put(`/admin/reviews/${id}`, { action }); fetchData(); }
    catch (err: any) { alert(err.message); }
  };

  return (
    <div>
      <h2 className="font-heading font-semibold text-2xl mb-6">ניהול ביקורות</h2>

      <div className="flex gap-2 mb-6">
        {filters.map((f) => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === f.v ? "bg-carefd-navy text-carefd-navy-foreground shadow-sm" : "bg-white text-slate-600 hover:bg-carefd-stone border border-slate-200"}`}>
            {f.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 text-slate-400">אין ביקורות</div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.round(r.rating) }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-carefd-teal fill-carefd-teal" />
                  ))}
                  <span className="text-sm text-slate-400 ms-2">{r.rating}/5</span>
                </div>
                <Badge variant={r.status === "pending" ? "warning" : r.status === "approved" ? "success" : "destructive"}>
                  {r.status === "pending" ? "ממתין" : r.status === "approved" ? "מאושר" : "נדחה"}
                </Badge>
              </div>
              <p className="text-slate-600 mb-3 leading-relaxed">{r.comment}</p>
              <p className="text-sm text-slate-400 mb-3">
                מאת: {r.user?.name || "אנונימי"} &bull; על: {r.provider?.businessName || "ספק"}
              </p>
              {r.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleAction(r.id, "approve")} className="bg-emerald-600 hover:bg-emerald-700">
                    <Check className="w-3 h-3 me-1" /> אשר
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleAction(r.id, "reject")} className="text-red-600 border-red-200 hover:bg-red-50">
                    <X className="w-3 h-3 me-1" /> דחה
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
