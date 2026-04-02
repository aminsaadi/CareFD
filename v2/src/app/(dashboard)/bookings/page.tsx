"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays } from "lucide-react";
import type { Booking } from "@/lib/types";

const statusLabels: Record<string, string> = { pending: "ממתין", confirmed: "מאושר", completed: "הושלם", cancelled: "בוטל", in_progress: "בתהליך", provider_completed: "הספק סיים", cancellation_requested: "בקשת ביטול", rejected: "נדחה", on_hold: "בהמתנה" };
const statusVariants: Record<string, "warning" | "accent" | "success" | "destructive" | "outline"> = { pending: "warning", confirmed: "accent", completed: "success", cancelled: "destructive", in_progress: "accent" };

const filters = [
  { v: "", l: "הכל" }, { v: "pending", l: "ממתין" }, { v: "confirmed", l: "מאושר" },
  { v: "completed", l: "הושלם" }, { v: "cancelled", l: "בוטל" },
];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { limit: "50" };
    if (filter) params.status = filter;
    api.get<{ bookings: Booking[] }>("/bookings", params)
      .then((d) => setBookings(d.bookings))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      <h1 className="mb-6">ההזמנות שלי</h1>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === f.v
                ? "bg-carefd-navy text-carefd-navy-foreground shadow-sm"
                : "bg-white text-slate-600 hover:bg-carefd-stone border border-slate-200"
            }`}
            data-testid={`filter-${f.v || "all"}`}
          >
            {f.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16">
          <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400">אין הזמנות</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id} className="p-5 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-carefd-navy">{b.serviceName}</h3>
                <p className="text-sm text-slate-400">{b.providerName} &bull; #{b.bookingNumber}</p>
                <p className="text-sm text-slate-400">
                  {b.bookingDate ? new Date(b.bookingDate).toLocaleDateString("he-IL") : "יתואם"} {b.bookingTime || ""}
                </p>
              </div>
              <div className="text-end">
                <Badge variant={statusVariants[b.status] || "outline"}>
                  {statusLabels[b.status] || b.status}
                </Badge>
                {b.finalPrice && <p className="font-heading font-bold text-carefd-navy mt-1">{"\u20AA"}{b.finalPrice}</p>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
