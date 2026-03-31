"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";

interface Stats {
  total_users: number; total_providers: number; total_bookings: number; total_services: number;
  total_requests: number; pending_providers: number; today_bookings: number; monthly_revenue: number;
  total_reviews: number; average_rating: number;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get<Stats>("/admin/stats").then(setStats).catch(() => {}).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[...Array(8)].map((_, i) => <div key={i} className="h-28 bg-white rounded-xl animate-pulse" />)}</div>;

  const cards = [
    { label: "משתמשים", value: stats?.total_users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "ספקים", value: stats?.total_providers, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "הזמנות", value: stats?.total_bookings, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "שירותים", value: stats?.total_services, color: "text-green-600", bg: "bg-green-50" },
    { label: "ממתין לאימות", value: stats?.pending_providers, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "הזמנות היום", value: stats?.today_bookings, color: "text-pink-600", bg: "bg-pink-50" },
    { label: "הכנסות החודש", value: `₪${stats?.monthly_revenue?.toLocaleString() || 0}`, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "דירוג ממוצע", value: stats?.average_rating?.toFixed(1) || "0", color: "text-yellow-600", bg: "bg-yellow-50" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">לוח בקרה</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={`${c.bg} rounded-xl p-6`}>
            <p className="text-sm text-gray-500 mb-1">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
