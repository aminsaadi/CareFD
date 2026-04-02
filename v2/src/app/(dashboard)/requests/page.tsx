"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileText } from "lucide-react";
import type { ServiceRequest } from "@/lib/types";

const urgencyConfig: Record<string, { label: string; variant: "outline" | "warning" | "destructive" }> = {
  low: { label: "נמוכה", variant: "outline" },
  medium: { label: "בינונית", variant: "warning" },
  high: { label: "גבוהה", variant: "warning" },
  urgent: { label: "דחופה", variant: "destructive" },
};

export default function RequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ requests: ServiceRequest[] }>("/requests", { limit: "50" })
      .then((d) => setRequests(d.requests))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1>בקשות שירות</h1>
        <Button asChild data-testid="new-request">
          <Link href="/requests/new">
            <Plus className="w-4 h-4 me-2" />
            בקשה חדשה
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400">אין בקשות פתוחות</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const urgency = urgencyConfig[r.urgency] || { label: r.urgency, variant: "outline" as const };
            return (
              <Link key={r.id} href={`/requests/${r.id}`}>
                <Card className="p-5 hover-lift">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-carefd-navy">{r.title}</h3>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{r.description}</p>
                      <div className="flex gap-2 mt-3 items-center">
                        <Badge variant={urgency.variant}>{urgency.label}</Badge>
                        {r.budget && <span className="text-sm font-heading font-bold text-carefd-navy">{"\u20AA"}{r.budget}</span>}
                        <span className="text-sm text-slate-400">{r.offer_count} הצעות</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString("he-IL")}</span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
