"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import type { Booking } from "@/lib/types";

const statusLabels: Record<string, string> = { pending: "ממתין", confirmed: "מאושר", completed: "הושלם", cancelled: "בוטל", in_progress: "בתהליך", provider_completed: "הספק סיים", cancellation_requested: "בקשת ביטול", rejected: "נדחה", on_hold: "בהמתנה" };
const statusColors: Record<string, string> = { pending: "bg-yellow-100 text-yellow-700", confirmed: "bg-blue-100 text-blue-700", completed: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700", in_progress: "bg-purple-100 text-purple-700" };

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const params: Record<string, string> = { limit: "50" };
    if (filter) params.status = filter;
    api.get<{ bookings: Booking[] }>("/bookings", params)
      .then((d) => setBookings(d.bookings))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div dir="rtl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">ההזמנות שלי</h1>
      <div className="flex gap-2 mb-6 flex-wrap">
        {[{ v: "", l: "הכל" }, { v: "pending", l: "ממתין" }, { v: "confirmed", l: "מאושר" }, { v: "completed", l: "הושלם" }, { v: "cancelled", l: "בוטל" }].map((f) => (
          <button key={f.v} onClick={() => setFilter(f.v)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === f.v ? "bg-teal-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}>{f.l}</button>
        ))}
      </div>
      {loading ? <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />)}</div> : bookings.length === 0 ? (
        <div className="text-center py-16 text-gray-500">אין הזמנות</div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">{b.serviceName}</h3>
                <p className="text-sm text-gray-500">{b.providerName} • #{b.bookingNumber}</p>
                <p className="text-sm text-gray-400">{b.bookingDate ? new Date(b.bookingDate).toLocaleDateString("he-IL") : "יתואם"} {b.bookingTime || ""}</p>
              </div>
              <div className="text-left">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[b.status] || "bg-gray-100 text-gray-600"}`}>{statusLabels[b.status] || b.status}</span>
                {b.finalPrice && <p className="font-bold text-teal-600 mt-1">₪{b.finalPrice}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
