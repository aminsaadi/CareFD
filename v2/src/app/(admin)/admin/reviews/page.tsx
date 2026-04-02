"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";

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
    try {
      await api.put(`/admin/reviews/${id}`, { action });
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">ניהול ביקורות</h1>
      <div className="flex gap-2 mb-6">
        {[{ v: "pending", l: "ממתין" }, { v: "approved", l: "מאושר" }, { v: "rejected", l: "נדחה" }, { v: "all", l: "הכל" }].map((f) => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`px-3 py-1.5 rounded-full text-sm ${filter === f.v ? "bg-teal-600 text-white" : "bg-white text-gray-600"}`}>{f.l}</button>
        ))}
      </div>
      {loading ? <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-200 rounded" />)}</div> : reviews.length === 0 ? (
        <p className="text-gray-500 text-center py-8">אין ביקורות</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-yellow-500">{"⭐".repeat(Math.round(r.rating))}</span>
                  <span className="text-sm text-gray-400 mr-2">{r.rating}/5</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${r.status === "pending" ? "bg-yellow-100 text-yellow-700" : r.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {r.status === "pending" ? "ממתין" : r.status === "approved" ? "מאושר" : "נדחה"}
                </span>
              </div>
              <p className="text-gray-700 mb-2">{r.comment}</p>
              <div className="text-sm text-gray-500 mb-3">
                מאת: {r.user?.name || "אנונימי"} • על: {r.provider?.businessName || "ספק"}
              </div>
              {r.status === "pending" && (
                <div className="flex gap-2">
                  <button onClick={() => handleAction(r.id, "approve")} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm">אשר</button>
                  <button onClick={() => handleAction(r.id, "reject")} className="bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-sm">דחה</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
