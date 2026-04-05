"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, CalendarDays, Eye, X } from "lucide-react";
import { toast } from "sonner";

const statusOptions = [
  { v: "", l: "הכל" }, { v: "pending", l: "ממתין" }, { v: "confirmed", l: "מאושר" },
  { v: "completed", l: "הושלם" }, { v: "cancelled", l: "בוטל" }, { v: "rejected", l: "נדחה" },
];

const getStatusBadge = (status: string) => {
  const map: Record<string, { label: string; variant: "default" | "warning" | "success" | "destructive" | "outline" | "accent" }> = {
    pending: { label: "ממתין", variant: "warning" },
    confirmed: { label: "מאושר", variant: "accent" },
    in_progress: { label: "בביצוע", variant: "accent" },
    provider_completed: { label: "סומן כהושלם", variant: "default" },
    completed: { label: "הושלם", variant: "success" },
    cancelled: { label: "בוטל", variant: "destructive" },
    rejected: { label: "נדחה", variant: "destructive" },
    on_hold: { label: "בהשהיה", variant: "outline" },
    cancellation_requested: { label: "בקשת ביטול", variant: "warning" },
  };
  const s = map[status] || { label: status, variant: "outline" as const };
  return <Badge variant={s.variant}>{s.label}</Badge>;
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  const fetchData = (s = search, st = statusFilter) => {
    setLoading(true);
    const params: Record<string, string> = { limit: "50" };
    if (s) params.search = s;
    if (st) params.status = st;
    api.get<{ bookings: any[]; total: number }>("/admin/bookings", params)
      .then((d) => { setBookings(d.bookings || []); setTotal(d.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  const handleCancel = async (bookingId: string) => {
    if (!confirm("האם לבטל הזמנה זו?")) return;
    try {
      await api.put(`/admin/bookings/${bookingId}`, { status: "cancelled" });
      toast.success("ההזמנה בוטלה");
      fetchData();
    } catch { toast.error("שגיאה בביטול ההזמנה"); }
  };

  return (
    <div>
      <h2 className="font-heading font-semibold text-2xl mb-6">ניהול הזמנות ({total})</h2>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-2 flex-wrap">
          {statusOptions.map((f) => (
            <button key={f.v} onClick={() => setStatusFilter(f.v)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${statusFilter === f.v ? "bg-carefd-navy text-white" : "bg-white text-slate-600 hover:bg-carefd-stone border border-slate-200"}`}>
              {f.l}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); fetchData(); }} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חפש..." className="ps-10 h-9" />
          </div>
          <Button type="submit" size="sm">חפש</Button>
        </form>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedBooking(null)}>
          <Card className="w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-carefd-navy">פרטי הזמנה</h3>
              <button onClick={() => setSelectedBooking(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {[
                { label: "שירות", value: selectedBooking.service_name || selectedBooking.serviceName || "-" },
                { label: "סטטוס", value: null, badge: getStatusBadge(selectedBooking.status) },
                { label: "לקוח", value: selectedBooking.user_name || selectedBooking.clientName || "-" },
                { label: "ספק", value: selectedBooking.provider_name || selectedBooking.providerName || "-" },
                { label: "תאריך", value: selectedBooking.booking_date ? new Date(selectedBooking.booking_date || selectedBooking.bookingDate).toLocaleDateString("he-IL") : "-" },
                { label: "מחיר", value: selectedBooking.final_price || selectedBooking.price ? `₪${selectedBooking.final_price || selectedBooking.price}` : "-" },
              ].map((item) => (
                <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500">{item.label}</p>
                  {item.badge ? <div className="mt-1">{item.badge}</div> : <p className="font-medium text-sm text-carefd-navy">{item.value}</p>}
                </div>
              ))}
            </div>
            {selectedBooking.notes && (
              <div className="bg-blue-50 rounded-xl p-3 mb-4">
                <p className="text-xs text-blue-700 font-medium">הערות:</p>
                <p className="text-sm text-blue-800">{selectedBooking.notes}</p>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              {["pending", "confirmed"].includes(selectedBooking.status) && (
                <Button variant="destructive" size="sm" onClick={() => { handleCancel(selectedBooking.booking_id || selectedBooking.id); setSelectedBooking(null); }}>בטל הזמנה</Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setSelectedBooking(null)}>סגור</Button>
            </div>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : bookings.length === 0 ? (
        <Card className="p-12 text-center">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-400">אין הזמנות</p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 bg-carefd-stone/50">
                  <th className="p-3 text-start font-medium">שירות</th>
                  <th className="p-3 text-start font-medium">לקוח</th>
                  <th className="p-3 text-start font-medium">ספק</th>
                  <th className="p-3 text-start font-medium">תאריך</th>
                  <th className="p-3 text-start font-medium">מחיר</th>
                  <th className="p-3 text-start font-medium">סטטוס</th>
                  <th className="p-3 text-start font-medium">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.booking_id || b.id} className="border-b border-slate-50 hover:bg-carefd-stone/30 transition-colors">
                    <td className="p-3 font-medium text-carefd-navy">{b.service_name || b.serviceName || "-"}</td>
                    <td className="p-3 text-slate-500">{b.user_name || b.clientName || "-"}</td>
                    <td className="p-3 text-slate-500">{b.provider_name || b.providerName || "-"}</td>
                    <td className="p-3 text-slate-400 whitespace-nowrap">{b.booking_date || b.bookingDate ? new Date(b.booking_date || b.bookingDate).toLocaleDateString("he-IL") : "-"}</td>
                    <td className="p-3 text-green-600 font-medium">{b.final_price || b.finalPrice || b.price ? `₪${b.final_price || b.finalPrice || b.price}` : "-"}</td>
                    <td className="p-3">{getStatusBadge(b.status)}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedBooking(b)} title="פרטים"><Eye className="w-4 h-4" /></Button>
                        {["pending", "confirmed"].includes(b.status) && (
                          <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleCancel(b.booking_id || b.id)} title="בטל"><X className="w-4 h-4" /></Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
