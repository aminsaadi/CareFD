"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileText, MapPin, Clock, DollarSign, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { ServiceRequest } from "@/lib/types";

const statusConfig: Record<string, { label: string; variant: "success" | "accent" | "outline" | "destructive" | "warning" }> = {
  open: { label: "פתוח", variant: "success" },
  in_progress: { label: "בתהליך", variant: "accent" },
  completed: { label: "הושלם", variant: "outline" },
  cancelled: { label: "בוטל", variant: "destructive" },
};
const urgencyConfig: Record<string, { label: string; variant: "outline" | "warning" | "destructive" }> = {
  low: { label: "נמוכה", variant: "outline" },
  medium: { label: "בינונית", variant: "warning" },
  high: { label: "גבוהה", variant: "warning" },
  urgent: { label: "דחופה", variant: "destructive" },
};
const filterOptions = [
  { v: "all", l: "הכל" }, { v: "open", l: "פתוחות" },
  { v: "in_progress", l: "בתהליך" }, { v: "completed", l: "הושלמו" }, { v: "cancelled", l: "בוטלו" },
];

export default function RequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchData = () => {
    setLoading(true);
    const params: Record<string, string> = { limit: "50" };
    if (filter !== "all") params.status = filter;
    api.get<{ requests: ServiceRequest[] }>("/requests/my", params)
      .then((d) => setRequests(d.requests || []))
      .catch(() => api.get<{ requests: ServiceRequest[] }>("/requests", params)
        .then((d) => setRequests(d.requests || []))
        .catch(() => {}))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filter]);

  const handleCancel = async (requestId: string) => {
    if (!confirm("האם לבטל בקשה זו?")) return;
    try {
      await api.put(`/requests/${requestId}`, { action: "cancel" });
      toast.success("הבקשה בוטלה");
      fetchData();
    } catch { toast.error("שגיאה בביטול"); }
  };

  const stats = {
    total: requests.length,
    open: requests.filter((r) => r.status === "open").length,
    inProgress: requests.filter((r) => r.status === "in_progress").length,
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1>בקשות שירות</h1>
          <p className="text-sm text-slate-400 mt-1">{stats.total} בקשות • {stats.open} פתוחות</p>
        </div>
        <Button asChild><Link href="/requests/new"><Plus className="w-4 h-4 me-1" />בקשה חדשה</Link></Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filterOptions.map((f) => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === f.v ? "bg-carefd-navy text-white shadow-sm" : "bg-white text-slate-600 hover:bg-carefd-stone border border-slate-200"
            }`}>
            {f.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-lg mb-2">{filter !== "all" ? "אין בקשות בסטטוס זה" : "אין בקשות"}</p>
          <Button variant="secondary" asChild><Link href="/requests/new">צור בקשה חדשה</Link></Button>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const status = statusConfig[r.status] || { label: r.status, variant: "outline" as const };
            const urgency = urgencyConfig[r.urgency] || { label: r.urgency, variant: "outline" as const };
            return (
              <Card key={r.id} className="p-5 hover:border-carefd-teal/40 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Link href={`/requests/${r.id}`} className="font-semibold text-carefd-navy hover:text-carefd-teal transition text-lg">
                        {r.title}
                      </Link>
                      <Badge variant={status.variant}>{status.label}</Badge>
                      <Badge variant={urgency.variant}>{urgency.label}</Badge>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-2 mt-1">{r.description}</p>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-400">
                      {r.budget && (
                        <span className="flex items-center gap-1 text-carefd-teal font-medium">
                          <DollarSign className="w-3 h-3" />₪{r.budget}
                        </span>
                      )}
                      {(r as any).city && (
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{(r as any).city}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />{new Date(r.createdAt).toLocaleDateString("he-IL")}
                      </span>
                      {r.offer_count > 0 && (
                        <span className="text-carefd-teal font-medium">{r.offer_count} הצעות</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/requests/${r.id}`}>פרטים</Link>
                    </Button>
                    {r.status === "open" && (
                      <Button size="sm" variant="ghost" className="text-red-500 h-7 text-xs" onClick={() => handleCancel(r.id)}>
                        <XCircle className="w-3 h-3 me-1" />בטל
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
