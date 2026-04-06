"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Search, Eye, XCircle, MapPin, DollarSign, ChevronDown } from "lucide-react";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; variant: "success" | "accent" | "outline" | "destructive" }> = {
  open: { label: "פתוח", variant: "success" }, in_progress: { label: "בטיפול", variant: "accent" },
  completed: { label: "הושלם", variant: "outline" }, cancelled: { label: "בוטל", variant: "destructive" },
};
const urgencyConfig: Record<string, { label: string; variant: "outline" | "warning" | "destructive" }> = {
  low: { label: "נמוכה", variant: "outline" }, medium: { label: "בינונית", variant: "warning" },
  high: { label: "גבוהה", variant: "warning" }, urgent: { label: "דחופה", variant: "destructive" },
};
const filterOptions = [
  { v: "", l: "הכל" }, { v: "open", l: "פתוחות" }, { v: "in_progress", l: "בטיפול" },
  { v: "completed", l: "הושלמו" }, { v: "cancelled", l: "בוטלו" },
];

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchData = (s = search, st = statusFilter) => {
    setLoading(true);
    const params: Record<string, string> = { limit: "50" };
    if (s) params.search = s;
    if (st) params.status = st;
    api.get<{ requests: any[] }>("/requests", params)
      .then((d) => setRequests(d.requests || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  const handleCancel = async (id: string) => {
    if (!confirm("האם לבטל בקשה זו?")) return;
    try {
      await api.put(`/requests/${id}`, { action: "cancel" });
      toast.success("הבקשה בוטלה");
      fetchData();
    } catch { toast.error("שגיאה"); }
  };

  return (
    <div>
      <h2 className="font-heading font-semibold text-2xl mb-6">ניהול בקשות ({requests.length})</h2>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-2 flex-wrap">
          {filterOptions.map((f) => (
            <button key={f.v} onClick={() => setStatusFilter(f.v)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${statusFilter === f.v ? "bg-carefd-navy text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
              {f.l}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); fetchData(); }} className="flex gap-2 flex-1">
          <div className="relative flex-1"><Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חפש..." className="ps-10 h-9" /></div>
          <Button type="submit" size="sm">חפש</Button>
        </form>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : requests.length === 0 ? (
        <Card className="p-10 text-center"><FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400">אין בקשות</p></Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 bg-carefd-stone/50">
                  <th className="p-3 text-start font-medium">כותרת</th>
                  <th className="p-3 text-start font-medium">משתמש</th>
                  <th className="p-3 text-start font-medium">תקציב</th>
                  <th className="p-3 text-start font-medium">דחיפות</th>
                  <th className="p-3 text-start font-medium">סטטוס</th>
                  <th className="p-3 text-start font-medium">הצעות</th>
                  <th className="p-3 text-start font-medium">תאריך</th>
                  <th className="p-3 text-start font-medium">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => {
                  const status = statusConfig[r.status] || { label: r.status, variant: "outline" as const };
                  const urgency = urgencyConfig[r.urgency] || { label: r.urgency, variant: "outline" as const };
                  return (
                    <tr key={r.id || r.request_id} className="border-b border-slate-50 hover:bg-carefd-stone/30">
                      <td className="p-3 font-medium text-carefd-navy max-w-[200px] truncate">{r.title}</td>
                      <td className="p-3 text-slate-500">{r.user?.name || "-"}</td>
                      <td className="p-3 text-green-600 font-medium">{r.budget ? `₪${r.budget}` : "-"}</td>
                      <td className="p-3"><Badge variant={urgency.variant}>{urgency.label}</Badge></td>
                      <td className="p-3"><Badge variant={status.variant}>{status.label}</Badge></td>
                      <td className="p-3 text-slate-500">{r.offer_count || 0}</td>
                      <td className="p-3 text-slate-400 whitespace-nowrap">{r.createdAt || r.created_at ? new Date(r.createdAt || r.created_at).toLocaleDateString("he-IL") : "-"}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" asChild title="פרטים"><Link href={`/requests/${r.id || r.request_id}`}><Eye className="w-4 h-4" /></Link></Button>
                          {r.status === "open" && <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleCancel(r.id || r.request_id)} title="בטל"><XCircle className="w-4 h-4" /></Button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
