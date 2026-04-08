"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarDays, ChevronDown, ChevronUp, Clock, CheckCircle,
  Hourglass, Star, Plus, Eye, MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { Booking } from "@/lib/types";

const statusLabels: Record<string, string> = {
  pending: "ממתין", confirmed: "מאושר", completed: "הושלם", cancelled: "בוטל",
  in_progress: "בתהליך", provider_completed: "סומן כהושלם",
  cancellation_requested: "בקשת ביטול", rejected: "נדחה", on_hold: "בהמתנה",
};
const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700", confirmed: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700", provider_completed: "bg-purple-100 text-purple-700",
  cancelled: "bg-red-100 text-red-700", rejected: "bg-red-100 text-red-700",
  in_progress: "bg-cyan-100 text-cyan-700", on_hold: "bg-gray-100 text-gray-700",
  cancellation_requested: "bg-orange-100 text-orange-700",
};
const statusVariants: Record<string, "warning" | "accent" | "success" | "destructive" | "outline"> = {
  pending: "warning", confirmed: "accent", completed: "success", cancelled: "destructive", in_progress: "accent",
};
const filters = [
  { v: "", l: "הכל" }, { v: "pending", l: "ממתין" }, { v: "confirmed", l: "מאושר" },
  { v: "completed", l: "הושלם" }, { v: "cancelled", l: "בוטל" },
];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [expandedBookings, setExpandedBookings] = useState<Record<string, boolean>>({});

  const fetchData = () => {
    setLoading(true);
    const params: Record<string, string> = { limit: "50" };
    if (filter) params.status = filter;
    api.get<{ bookings: Booking[] }>("/bookings", params)
      .then((d) => setBookings(d.bookings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filter]);

  const getSorted = () => {
    const sorted = [...bookings];
    switch (sortBy) {
      case "date_desc": return sorted.sort((a, b) => new Date(b.bookingDate || 0).getTime() - new Date(a.bookingDate || 0).getTime());
      case "date_asc": return sorted.sort((a, b) => new Date(a.bookingDate || 0).getTime() - new Date(b.bookingDate || 0).getTime());
      case "status": {
        const order: Record<string, number> = { provider_completed: 0, pending: 1, confirmed: 2, completed: 6, cancelled: 7 };
        return sorted.sort((a, b) => (order[a.status] ?? 99) - (order[b.status] ?? 99));
      }
      case "price_desc": return sorted.sort((a, b) => (b.finalPrice || 0) - (a.finalPrice || 0));
      default: return sorted;
    }
  };

  const handleConfirmCompletion = async (bookingId: string) => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { action: "complete" });
      toast.success("ההזמנה אושרה כהושלמה");
      fetchData();
    } catch { toast.error("שגיאה באישור"); }
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    awaitingConfirm: bookings.filter((b) => b.status === "provider_completed").length,
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1>ההזמנות שלי</h1>
          <p className="text-sm text-slate-400 mt-1">{stats.total} הזמנות • {stats.pending} ממתינות • {stats.completed} הושלמו</p>
        </div>
        <Button asChild><Link href="/providers"><Plus className="w-4 h-4 me-1" />הזמן תור חדש</Link></Button>
      </div>

      {/* Awaiting Confirmation Alert */}
      {stats.awaitingConfirm > 0 && (
        <Card className="p-4 mb-4 border-carefd-teal-pale bg-carefd-teal/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-carefd-teal" />
            <span className="font-medium text-purple-900">{stats.awaitingConfirm} הזמנות ממתינות לאישור השלמה</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => setFilter("provider_completed")}>הצג</Button>
        </Card>
      )}

      {/* Filters + Sort */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button key={f.v} onClick={() => setFilter(f.v)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === f.v ? "bg-carefd-navy text-white shadow-sm" : "bg-white text-slate-600 hover:bg-carefd-stone border border-slate-200"
              }`}>
              {f.l}
            </button>
          ))}
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
          className="ms-auto bg-white border-2 border-carefd-teal-pale/50 rounded-xl px-4 py-2 text-sm cursor-pointer hover:border-carefd-teal focus:border-carefd-teal focus:outline-none focus:ring-2 focus:ring-carefd-teal/15 transition-all">
          <option value="date_desc">חדש ← ישן</option><option value="date_asc">ישן ← חדש</option>
          <option value="status">לפי סטטוס</option><option value="price_desc">לפי מחיר</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16">
          <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-lg mb-2">אין הזמנות</p>
          <Button variant="secondary" asChild><Link href="/providers">חפש ספק</Link></Button>
        </div>
      ) : (
        <div className="space-y-3">
          {getSorted().map((b) => {
            const isExp = expandedBookings[b.id];
            return (
              <Card key={b.id} className={`overflow-hidden transition-all ${isExp ? "border-carefd-teal shadow-md" : "hover:border-carefd-teal/40"}`}>
                <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedBookings((p) => ({ ...p, [b.id]: !p[b.id] }))}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${statusColors[b.status] || "bg-slate-100"}`}>
                      {b.status === "pending" ? <Hourglass className="w-4 h-4" /> : b.status === "completed" ? <CheckCircle className="w-4 h-4" /> : <CalendarDays className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-carefd-navy text-sm">{b.serviceName || "שירות"}</h3>
                      <p className="text-xs text-slate-400">{b.providerName || "ספק"} • {b.bookingDate ? new Date(b.bookingDate).toLocaleDateString("he-IL") : "יתואם"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {b.finalPrice && <span className="font-bold text-carefd-navy text-sm">₪{b.finalPrice}</span>}
                    <Badge variant={statusVariants[b.status] || "outline"}>{statusLabels[b.status] || b.status}</Badge>
                    {isExp ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>
                {isExp && (
                  <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      <div className="bg-slate-50 rounded-lg p-3 text-center"><p className="text-xs text-slate-400">תאריך</p><p className="font-medium text-sm">{b.bookingDate ? new Date(b.bookingDate).toLocaleDateString("he-IL") : "יתואם"}</p></div>
                      <div className="bg-slate-50 rounded-lg p-3 text-center"><p className="text-xs text-slate-400">שעה</p><p className="font-medium text-sm">{b.bookingTime || "יתואם"}</p></div>
                      <div className="bg-slate-50 rounded-lg p-3 text-center"><p className="text-xs text-slate-400">מחיר</p><p className="font-medium text-sm text-green-600">{b.finalPrice ? `₪${b.finalPrice}` : "יתואם"}</p></div>
                      <div className="bg-slate-50 rounded-lg p-3 text-center"><p className="text-xs text-slate-400">מספר</p><p className="font-medium text-sm">#{b.bookingNumber}</p></div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {b.status === "provider_completed" && (
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); handleConfirmCompletion(b.id); }}>
                          <CheckCircle className="w-3.5 h-3.5 me-1" />אשר השלמה
                        </Button>
                      )}
                      {b.status === "completed" && !(b as any).has_review && (
                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600" asChild>
                          <Link href={`/review/${b.id}`} onClick={(e) => e.stopPropagation()}><Star className="w-3.5 h-3.5 me-1" />כתוב ביקורת</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
