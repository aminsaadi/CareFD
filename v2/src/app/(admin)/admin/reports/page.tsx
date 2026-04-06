"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, Stethoscope, CalendarDays, Wrench,
  FileText, Star, TrendingUp, Wallet, Clock,
  CheckCircle, Hourglass, BarChart3, ArrowUpRight, ArrowDownRight,
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

  if (loading) return (
    <div>
      <Skeleton className="h-10 w-48 mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{[...Array(9)].map((_, i) => <Skeleton key={i} className="h-36 w-full" />)}</div>
    </div>
  );

  const mainStats = [
    { label: "סה\"כ משתמשים", value: stats?.total_users ?? 0, icon: Users, color: "text-blue-600 bg-blue-50", desc: "משתמשים רשומים" },
    { label: "סה\"כ ספקים", value: stats?.total_providers ?? 0, icon: Stethoscope, color: "text-carefd-teal bg-carefd-teal/10", desc: "ספקים פעילים" },
    { label: "סה\"כ הזמנות", value: stats?.total_bookings ?? 0, icon: CalendarDays, color: "text-purple-600 bg-purple-50", desc: "הזמנות במערכת" },
    { label: "שירותים פעילים", value: stats?.total_services ?? 0, icon: Wrench, color: "text-emerald-600 bg-emerald-50", desc: "שירותים זמינים" },
  ];

  const secondaryStats = [
    { label: "הכנסות החודש", value: `₪${(stats?.monthly_revenue ?? 0).toLocaleString()}`, icon: Wallet, color: "text-emerald-600 bg-emerald-50" },
    { label: "הזמנות היום", value: stats?.today_bookings ?? 0, icon: Clock, color: "text-pink-600 bg-pink-50" },
    { label: "ממתינים לאימות", value: stats?.pending_providers ?? 0, icon: Hourglass, color: "text-amber-600 bg-amber-50" },
    { label: "סה\"כ בקשות", value: stats?.total_requests ?? 0, icon: FileText, color: "text-orange-600 bg-orange-50" },
    { label: "דירוג ממוצע", value: (stats?.average_rating ?? 0).toFixed(1), icon: Star, color: "text-yellow-600 bg-yellow-50", sub: `${stats?.total_reviews ?? 0} ביקורות` },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-carefd-teal/10 rounded-xl flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-carefd-teal" />
        </div>
        <div>
          <h2 className="font-heading font-semibold text-2xl">דוחות וסטטיסטיקות</h2>
          <p className="text-sm text-slate-400">סקירה כללית של נתוני המערכת</p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {mainStats.map((c) => (
          <Card key={c.label} className="p-6 border-0 hover-lift">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.color}`}>
                <c.icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-3xl font-heading font-bold text-carefd-navy">{c.value}</p>
            <p className="text-sm text-slate-500 mt-1">{c.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{c.desc}</p>
          </Card>
        ))}
      </div>

      {/* Secondary Stats */}
      <h3 className="font-heading font-semibold text-lg text-carefd-navy mb-4">נתונים נוספים</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {secondaryStats.map((c) => (
          <Card key={c.label} className="p-5 border-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.color} mb-3`}>
              <c.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-heading font-bold text-carefd-navy">{c.value}</p>
            <p className="text-xs text-slate-500 mt-1">{c.label}</p>
            {c.sub && <p className="text-xs text-slate-400">{c.sub}</p>}
          </Card>
        ))}
      </div>

      {/* Summary Cards */}
      <h3 className="font-heading font-semibold text-lg text-carefd-navy mb-4">סיכום ביצועים</h3>
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6 border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
          <h4 className="font-semibold text-carefd-navy mb-2">שיעור המרה</h4>
          <p className="text-3xl font-bold text-blue-600">
            {stats?.total_bookings && stats?.total_users ? ((stats.total_bookings / stats.total_users) * 100).toFixed(1) : "0"}%
          </p>
          <p className="text-xs text-slate-500 mt-1">הזמנות למשתמש</p>
        </Card>
        <Card className="p-6 border-0 bg-gradient-to-br from-green-50 to-emerald-50">
          <h4 className="font-semibold text-carefd-navy mb-2">ממוצע שירותים לספק</h4>
          <p className="text-3xl font-bold text-emerald-600">
            {stats?.total_services && stats?.total_providers ? (stats.total_services / stats.total_providers).toFixed(1) : "0"}
          </p>
          <p className="text-xs text-slate-500 mt-1">שירותים לכל ספק</p>
        </Card>
        <Card className="p-6 border-0 bg-gradient-to-br from-amber-50 to-orange-50">
          <h4 className="font-semibold text-carefd-navy mb-2">ממוצע ביקורות</h4>
          <p className="text-3xl font-bold text-amber-600">
            {stats?.total_reviews && stats?.total_providers ? (stats.total_reviews / stats.total_providers).toFixed(1) : "0"}
          </p>
          <p className="text-xs text-slate-500 mt-1">ביקורות לכל ספק</p>
        </Card>
      </div>
    </div>
  );
}
