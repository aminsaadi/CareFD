"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";

const statusLabels: Record<string, string> = { pending: "ממתין", confirmed: "מאושר", completed: "הושלם", cancelled: "בוטל", in_progress: "בתהליך", provider_completed: "הספק סיים", cancellation_requested: "בקשת ביטול", rejected: "נדחה" };
const statusColors: Record<string, string> = { pending: "bg-yellow-100 text-yellow-700", confirmed: "bg-blue-100 text-blue-700", completed: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700" };

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    const params: Record<string, string> = { limit: "30" };
    if (filter) params.status = filter;
    api.get<{ bookings: any[]; total: number }>("/admin/bookings", params)
      .then((d) => { setBookings(d.bookings); setTotal(d.total); })
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filter]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">ניהול הזמנות ({total})</h1>
      <div className="flex gap-2 mb-6 flex-wrap">
        {[{ v: "", l: "הכל" }, { v: "pending", l: "ממתין" }, { v: "confirmed", l: "מאושר" }, { v: "completed", l: "הושלם" }, { v: "cancelled", l: "בוטל" }].map((f) => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`px-3 py-1.5 rounded-full text-sm ${filter === f.v ? "bg-teal-600 text-white" : "bg-white text-gray-600"}`}>{f.l}</button>
        ))}
      </div>
      {loading ? <div className="animate-pulse space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-200 rounded" />)}</div> : (
        <table className="w-full bg-white rounded-xl shadow-sm text-sm">
          <thead><tr className="border-b text-gray-500"><th className="p-3 text-right">#</th><th className="p-3 text-right">שירות</th><th className="p-3 text-right">לקוח</th><th className="p-3 text-right">ספק</th><th className="p-3 text-right">סטטוס</th><th className="p-3 text-right">מחיר</th><th className="p-3 text-right">תאריך</th></tr></thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-mono text-xs">{b.bookingNumber}</td>
                <td className="p-3">{b.serviceName || b.service?.name || "-"}</td>
                <td className="p-3">{b.clientName || b.userName || "-"}</td>
                <td className="p-3">{b.providerName || "-"}</td>
                <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${statusColors[b.status] || "bg-gray-100 text-gray-600"}`}>{statusLabels[b.status] || b.status}</span></td>
                <td className="p-3 font-medium">{b.finalPrice ? `₪${b.finalPrice}` : "-"}</td>
                <td className="p-3 text-gray-400">{b.bookingDate ? new Date(b.bookingDate).toLocaleDateString("he-IL") : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
