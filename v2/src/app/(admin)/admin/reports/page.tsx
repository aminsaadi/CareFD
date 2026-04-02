"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3, Users, Stethoscope, CalendarDays,
  Wrench, FileText, Star, TrendingUp, Wallet,
} from "lucide-react";

interface Stats {
  total_users: number; total_providers: number; total_bookings: number; total_services: number;
  total_requests: number; pending_providers: number; today_bookings: number; monthly_revenue: number;
  total_reviews: number; average_rating: number;
}

export default function AdminReportsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Stats>("/admin/stats").then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div><Skeleton className="h-10 w-48 mb-6" /><div className="grid grid-cols-2 md:grid-cols-3 gap-4">{[...Array(9)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div></div>;

  const cards = [
    { label: "סה\"כ משתמשים", value: stats?.total_users, icon: Users, color: "text-blue-600 bg-blue-50" },
    { label: "סה\"כ ספקים", value: stats?.total_providers, icon: Stethoscope, color: "text-carefd-teal bg-carefd-teal/10" },
    { label: "סה\"כ הזמנות", value: stats?.total_bookings, icon: CalendarDays, color: "text-purple-600 bg-purple-50" },
    { label: "שירותים פעילים", value: stats?.total_services, icon: Wrench, color: "text-emerald-600 bg-emerald-50" },
    { label: "סה\"כ בקשות", value: stats?.total_requests, icon: FileText, color: "text-orange-600 bg-orange-50" },
    { label: "ממתינים לאימות", value: stats?.pending_providers, icon: TrendingUp, color: "text-amber-600 bg-amber-50" },
    { label: "הזמנות היום", value: stats?.today_bookings, icon: CalendarDays, color: "text-pink-600 bg-pink-50" },
    { label: "הכנסות החודש", value: `\u20AA${stats?.monthly_revenue?.toLocaleString() || 0}`, icon: Wallet, color: "text-emerald-600 bg-emerald-50" },
    { label: "דירוג ממוצע", value: `${stats?.average_rating?.toFixed(1) || "0"} (${stats?.total_reviews} ביקורות)`, icon: Star, color: "text-carefd-teal bg-carefd-teal/10" },
  ];

  return (
    <div>
      <h2 className="font-heading font-semibold text-2xl mb-6">דוחות וסטטיסטיקות</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-6 border-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.color} mb-3`}>
              <c.icon className="w-5 h-5" />
            </div>
            <p className="text-sm text-slate-500 mb-1">{c.label}</p>
            <p className="text-2xl font-heading font-bold text-carefd-navy">{c.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
