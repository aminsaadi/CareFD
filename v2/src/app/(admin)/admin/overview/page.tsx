"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, Stethoscope, CalendarDays, Wrench,
  Clock, CalendarCheck, Wallet, Star,
} from "lucide-react";

interface Stats {
  total_users: number; total_providers: number; total_bookings: number; total_services: number;
  total_requests: number; pending_providers: number; today_bookings: number; monthly_revenue: number;
  total_reviews: number; average_rating: number;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Stats>("/admin/stats").then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div>
      <Skeleton className="h-10 w-48 mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
      </div>
    </div>
  );

  const cards = [
    { label: "משתמשים", value: stats?.total_users, icon: Users, color: "text-blue-600 bg-blue-50" },
    { label: "ספקים", value: stats?.total_providers, icon: Stethoscope, color: "text-accent bg-accent/10" },
    { label: "הזמנות", value: stats?.total_bookings, icon: CalendarDays, color: "text-purple-600 bg-purple-50" },
    { label: "שירותים", value: stats?.total_services, icon: Wrench, color: "text-emerald-600 bg-emerald-50" },
    { label: "ממתין לאימות", value: stats?.pending_providers, icon: Clock, color: "text-amber-600 bg-amber-50" },
    { label: "הזמנות היום", value: stats?.today_bookings, icon: CalendarCheck, color: "text-pink-600 bg-pink-50" },
    { label: "הכנסות החודש", value: `\u20AA${stats?.monthly_revenue?.toLocaleString() || 0}`, icon: Wallet, color: "text-emerald-600 bg-emerald-50" },
    { label: "דירוג ממוצע", value: stats?.average_rating?.toFixed(1) || "0", icon: Star, color: "text-accent bg-accent/10" },
  ];

  return (
    <div>
      <h1 className="mb-8">לוח בקרה</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-6 border-0">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.color}`}>
                <c.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">{c.label}</p>
            <p className="text-2xl font-heading font-bold text-primary">{c.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
