"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, DollarSign, Clock, AlertTriangle, MessageCircle,
  ChevronLeft, Calendar,
} from "lucide-react";

interface RequestCardProps {
  request: {
    id: string;
    request_id?: string;
    title: string;
    description?: string;
    urgency: string;
    budget?: number;
    budget_type?: string;
    offer_count?: number;
    createdAt?: string;
    created_at?: string;
    status?: string;
    city?: string;
    location?: { city?: string };
    professions?: string[];
    specialization?: string;
    preferred_date?: string;
    request_type?: string;
  };
  compact?: boolean;
}

const urgencyConfig: Record<string, { label: string; variant: "outline" | "warning" | "destructive"; color: string }> = {
  low: { label: "נמוכה", variant: "outline", color: "bg-slate-100 text-slate-600" },
  medium: { label: "בינונית", variant: "warning", color: "bg-yellow-100 text-yellow-700" },
  high: { label: "גבוהה", variant: "warning", color: "bg-orange-100 text-orange-700" },
  urgent: { label: "דחופה", variant: "destructive", color: "bg-red-100 text-red-700" },
};

const statusLabels: Record<string, string> = {
  open: "פתוח", in_progress: "בטיפול", completed: "הושלם", cancelled: "בוטל",
};

const budgetTypeLabels: Record<string, string> = {
  per_hour: "לשעה", per_treatment: "לטיפול", per_visit: "לביקור",
};

export default function RequestCard({ request: r, compact = false }: RequestCardProps) {
  const urgency = urgencyConfig[r.urgency] || urgencyConfig.medium;
  const rid = r.request_id || r.id;
  const city = r.city || r.location?.city;
  const date = r.createdAt || r.created_at;

  return (
    <Link href={`/requests/${rid}`}>
      <Card className="p-5 hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 group">
        {/* Header */}
        <div className="flex justify-between items-start gap-3 mb-2">
          <h3 className="font-bold text-carefd-navy group-hover:text-carefd-teal transition-colors line-clamp-1 text-base">
            {r.title}
          </h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            {r.urgency && r.urgency !== "medium" && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${urgency.color}`}>
                <AlertTriangle className="w-3 h-3" />{urgency.label}
              </span>
            )}
            {r.status && (
              <Badge variant={r.status === "open" ? "success" : "outline"} className="text-[10px]">
                {statusLabels[r.status] || r.status}
              </Badge>
            )}
          </div>
        </div>

        {/* Description */}
        {r.description && !compact && (
          <p className="text-sm text-slate-500 line-clamp-2 mb-3 leading-relaxed">{r.description}</p>
        )}

        {/* Tags */}
        {(r.professions?.length || r.specialization) && !compact && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(r.professions || []).slice(0, 3).map((p, i) => (
              <Badge key={i} className="bg-carefd-teal-pale text-carefd-teal border-0 text-[10px]">{p}</Badge>
            ))}
            {r.specialization && <Badge variant="outline" className="text-[10px]">{r.specialization}</Badge>}
          </div>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          {r.budget && (
            <span className="flex items-center gap-1 text-carefd-teal font-semibold text-sm">
              <DollarSign className="w-3.5 h-3.5" />
              ₪{r.budget}
              {r.budget_type && <span className="text-xs font-normal text-slate-400">/{budgetTypeLabels[r.budget_type] || r.budget_type}</span>}
            </span>
          )}
          {city && (
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{city}</span>
          )}
          {date && (
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(date).toLocaleDateString("he-IL")}</span>
          )}
          {r.preferred_date && (
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />מועדף: {new Date(r.preferred_date).toLocaleDateString("he-IL")}</span>
          )}
          {(r.offer_count || 0) > 0 && (
            <span className="flex items-center gap-1 text-carefd-teal font-medium">
              <MessageCircle className="w-3 h-3" />{r.offer_count} הצעות
            </span>
          )}
          {r.request_type === "recurring" && (
            <Badge variant="outline" className="text-[10px]">חוזר</Badge>
          )}
        </div>

        {/* View link indicator */}
        <div className="flex items-center gap-1 mt-3 text-carefd-teal text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          צפה בפרטים <ChevronLeft className="w-3 h-3" />
        </div>
      </Card>
    </Link>
  );
}
