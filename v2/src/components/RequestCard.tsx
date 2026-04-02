"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RequestCardProps {
  request: {
    id: string; title: string; description?: string; urgency: string;
    budget?: number; offer_count?: number; createdAt: string; status?: string;
  };
}

const urgencyConfig: Record<string, { label: string; variant: "outline" | "warning" | "destructive" }> = {
  low: { label: "נמוכה", variant: "outline" }, medium: { label: "בינונית", variant: "warning" },
  high: { label: "גבוהה", variant: "warning" }, urgent: { label: "דחופה", variant: "destructive" },
};

export default function RequestCard({ request: r }: RequestCardProps) {
  const urgency = urgencyConfig[r.urgency] || { label: r.urgency, variant: "outline" as const };

  return (
    <Link href={`/requests/${r.id}`}>
      <Card className="p-5 hover-lift">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-carefd-navy">{r.title}</h3>
            {r.description && <p className="text-sm text-carefd-gray mt-1 line-clamp-2">{r.description}</p>}
            <div className="flex gap-2 mt-3 items-center">
              <Badge variant={urgency.variant}>{urgency.label}</Badge>
              {r.budget && <span className="text-sm font-heading font-bold text-carefd-navy">{"\u20AA"}{r.budget}</span>}
              <span className="text-sm text-carefd-gray">{r.offer_count || 0} הצעות</span>
            </div>
          </div>
          <span className="text-xs text-carefd-light-gray flex-shrink-0">{new Date(r.createdAt).toLocaleDateString("he-IL")}</span>
        </div>
      </Card>
    </Link>
  );
}
