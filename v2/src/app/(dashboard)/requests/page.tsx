"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import type { ServiceRequest } from "@/lib/types";

const urgencyLabels: Record<string, string> = { low: "נמוכה", medium: "בינונית", high: "גבוהה", urgent: "דחופה" };
const urgencyColors: Record<string, string> = { low: "bg-gray-100 text-gray-600", medium: "bg-yellow-100 text-yellow-700", high: "bg-orange-100 text-orange-700", urgent: "bg-red-100 text-red-700" };

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
    <div dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">בקשות שירות</h1>
        <Link href="/requests/new" className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700">+ בקשה חדשה</Link>
      </div>
      {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />)}</div> : requests.length === 0 ? (
        <div className="text-center py-16 text-gray-500">אין בקשות פתוחות</div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Link key={r.id} href={`/requests/${r.id}`} className="block bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900">{r.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{r.description}</p>
                  <div className="flex gap-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${urgencyColors[r.urgency] || "bg-gray-100"}`}>{urgencyLabels[r.urgency] || r.urgency}</span>
                    {r.budget && <span className="text-sm text-teal-600 font-medium">₪{r.budget}</span>}
                    <span className="text-sm text-gray-400">{r.offer_count} הצעות</span>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString("he-IL")}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
