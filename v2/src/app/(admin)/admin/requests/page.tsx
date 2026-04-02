"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "success" | "accent" | "outline" | "destructive" }> = {
  open: { label: "פתוח", variant: "success" }, in_progress: { label: "בטיפול", variant: "accent" },
  completed: { label: "הושלם", variant: "outline" }, cancelled: { label: "בוטל", variant: "destructive" },
};
const urgencyConfig: Record<string, { label: string; variant: "outline" | "warning" | "destructive" }> = {
  low: { label: "נמוכה", variant: "outline" }, medium: { label: "בינונית", variant: "warning" },
  high: { label: "גבוהה", variant: "warning" }, urgent: { label: "דחופה", variant: "destructive" },
};

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ requests: any[] }>("/requests", { limit: "50" })
      .then((d) => setRequests(d.requests)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="font-heading font-semibold text-2xl mb-6">ניהול בקשות ({requests.length})</h2>
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : requests.length === 0 ? (
        <Card className="p-10 text-center"><FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400">אין בקשות</p></Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 text-slate-500 bg-carefd-stone/50"><th className="p-3 text-start font-medium">כותרת</th><th className="p-3 text-start font-medium">משתמש</th><th className="p-3 text-start font-medium">דחיפות</th><th className="p-3 text-start font-medium">סטטוס</th><th className="p-3 text-start font-medium">הצעות</th><th className="p-3 text-start font-medium">תאריך</th></tr></thead>
            <tbody>
              {requests.map((r) => {
                const status = statusConfig[r.status] || { label: r.status, variant: "outline" as const };
                const urgency = urgencyConfig[r.urgency] || { label: r.urgency, variant: "outline" as const };
                return (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-carefd-stone/30">
                    <td className="p-3 font-medium text-carefd-navy">{r.title}</td>
                    <td className="p-3 text-slate-500">{r.user?.name || "-"}</td>
                    <td className="p-3"><Badge variant={urgency.variant}>{urgency.label}</Badge></td>
                    <td className="p-3"><Badge variant={status.variant}>{status.label}</Badge></td>
                    <td className="p-3 text-slate-500">{r.offer_count || 0}</td>
                    <td className="p-3 text-slate-400">{new Date(r.createdAt).toLocaleDateString("he-IL")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
