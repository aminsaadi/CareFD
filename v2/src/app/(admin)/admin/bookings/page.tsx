"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const statusLabels: Record<string, string> = { pending: "ממתין", confirmed: "מאושר", completed: "הושלם", cancelled: "בוטל", in_progress: "בתהליך", provider_completed: "הספק סיים", cancellation_requested: "בקשת ביטול", rejected: "נדחה" };
const statusVariants: Record<string, "warning" | "accent" | "success" | "destructive" | "outline"> = { pending: "warning", confirmed: "accent", completed: "success", cancelled: "destructive" };

const filters = [
  { v: "", l: "הכל" }, { v: "pending", l: "ממתין" }, { v: "confirmed", l: "מאושר" },
  { v: "completed", l: "הושלם" }, { v: "cancelled", l: "בוטל" },
];

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
      <h2 className="font-heading font-semibold text-2xl mb-6">ניהול הזמנות ({total})</h2>

      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map((f) => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === f.v ? "bg-carefd-navy text-carefd-navy-foreground shadow-sm" : "bg-white text-slate-600 hover:bg-carefd-stone border border-slate-200"}`}>
            {f.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : (
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 text-slate-500 bg-carefd-stone/50"><th className="p-3 text-start font-medium">#</th><th className="p-3 text-start font-medium">שירות</th><th className="p-3 text-start font-medium">לקוח</th><th className="p-3 text-start font-medium">ספק</th><th className="p-3 text-start font-medium">סטטוס</th><th className="p-3 text-start font-medium">מחיר</th><th className="p-3 text-start font-medium">תאריך</th></tr></thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-slate-50 hover:bg-carefd-stone/30 transition-colors">
                  <td className="p-3 font-mono text-xs text-slate-400">{b.bookingNumber}</td>
                  <td className="p-3 text-carefd-navy">{b.serviceName || b.service?.name || "-"}</td>
                  <td className="p-3 text-slate-500">{b.clientName || b.userName || "-"}</td>
                  <td className="p-3 text-slate-500">{b.providerName || "-"}</td>
                  <td className="p-3"><Badge variant={statusVariants[b.status] || "outline"}>{statusLabels[b.status] || b.status}</Badge></td>
                  <td className="p-3 font-heading font-medium text-carefd-navy">{b.finalPrice ? `\u20AA${b.finalPrice}` : "-"}</td>
                  <td className="p-3 text-slate-400">{b.bookingDate ? new Date(b.bookingDate).toLocaleDateString("he-IL") : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
