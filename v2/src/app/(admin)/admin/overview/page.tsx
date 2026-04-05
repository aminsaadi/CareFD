"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, Stethoscope, CalendarDays, Wrench,
  Clock, CalendarCheck, Wallet, Star,
  ChevronLeft, CheckCircle, XCircle, Eye,
  FileText, MessageCircle, Shield, TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface Stats {
  total_users: number; total_providers: number; total_bookings: number; total_services: number;
  total_requests: number; pending_providers: number; today_bookings: number; monthly_revenue: number;
  total_reviews: number; average_rating: number;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingProviders, setPendingProviders] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get<Stats>("/admin/stats").catch(() => null),
      api.get<{ providers: any[] }>("/admin/providers/pending").catch(() => ({ providers: [] })),
      api.get<{ bookings: any[] }>("/admin/bookings?limit=5").catch(() => ({ bookings: [] })),
      api.get<{ users: any[] }>("/admin/users?limit=5").catch(() => ({ users: [] })),
    ]).then(([s, p, b, u]) => {
      if (s) setStats(s);
      setPendingProviders((p as any)?.providers || []);
      setRecentBookings((b as any)?.bookings || []);
      setRecentUsers((u as any)?.users || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleVerify = async (providerId: string) => {
    try {
      await api.put(`/admin/providers/${providerId}`, { action: "verify" });
      toast.success("הספק אומת בהצלחה");
      fetchData();
    } catch { toast.error("שגיאה באימות הספק"); }
  };

  const handleReject = async (providerId: string) => {
    try {
      await api.put(`/admin/providers/${providerId}`, { action: "reject", notes: "נדחה על ידי מנהל" });
      toast.success("הספק נדחה");
      fetchData();
    } catch { toast.error("שגיאה בדחיית הספק"); }
  };

  if (loading) return (
    <div>
      <Skeleton className="h-10 w-48 mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );

  const cards = [
    { label: "משתמשים", value: stats?.total_users ?? 0, icon: Users, color: "text-blue-600 bg-blue-50", href: "/admin/users" },
    { label: "ספקים", value: stats?.total_providers ?? 0, icon: Stethoscope, color: "text-carefd-teal bg-carefd-teal/10", href: "/admin/providers" },
    { label: "הזמנות", value: stats?.total_bookings ?? 0, icon: CalendarDays, color: "text-purple-600 bg-purple-50", href: "/admin/bookings" },
    { label: "שירותים", value: stats?.total_services ?? 0, icon: Wrench, color: "text-emerald-600 bg-emerald-50", href: "/admin/services" },
    { label: "ממתין לאימות", value: stats?.pending_providers ?? 0, icon: Clock, color: "text-amber-600 bg-amber-50", href: "/admin/verification" },
    { label: "הזמנות היום", value: stats?.today_bookings ?? 0, icon: CalendarCheck, color: "text-pink-600 bg-pink-50", href: "/admin/bookings" },
    { label: "הכנסות החודש", value: `₪${(stats?.monthly_revenue ?? 0).toLocaleString()}`, icon: Wallet, color: "text-emerald-600 bg-emerald-50", href: "/admin/reports" },
    { label: "דירוג ממוצע", value: (stats?.average_rating ?? 0).toFixed(1), icon: Star, color: "text-carefd-teal bg-carefd-teal/10", href: "/admin/reviews" },
  ];

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "warning" | "success" | "destructive" | "outline" }> = {
      pending: { label: "ממתין", variant: "warning" },
      confirmed: { label: "מאושר", variant: "success" },
      completed: { label: "הושלם", variant: "default" },
      cancelled: { label: "בוטל", variant: "destructive" },
    };
    const s = map[status] || { label: status, variant: "outline" as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  return (
    <div>
      <h1 className="mb-8">לוח בקרה - סקירה כללית</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card className="p-6 border-0 hover-lift cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.color}`}>
                  <c.icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-sm text-slate-500 mb-1">{c.label}</p>
              <p className="text-2xl font-heading font-bold text-carefd-navy">{c.value}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pending Providers Alert */}
      {pendingProviders.length > 0 && (
        <Card className="p-6 mb-6 border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-bold text-carefd-navy">
                ספקים ממתינים לאימות ({pendingProviders.length})
              </h3>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/providers?filter=pending">
                הצג הכל <ChevronLeft className="w-4 h-4 ms-1" />
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {pendingProviders.slice(0, 3).map((p: any) => (
              <div key={p.provider_id} className="flex items-center justify-between bg-white p-4 rounded-xl">
                <div>
                  <p className="font-medium text-carefd-navy">{p.business_name || p.user?.name || "ספק"}</p>
                  <p className="text-sm text-slate-500">{p.user?.email} • {p.profession_name || "לא צוין"}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/providers/${p.provider_id}`}><Eye className="w-4 h-4" /></Link>
                  </Button>
                  <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => handleVerify(p.provider_id)}>
                    <CheckCircle className="w-4 h-4 me-1" /> אשר
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleReject(p.provider_id)}>
                    <XCircle className="w-4 h-4 me-1" /> דחה
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Recent Bookings */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-carefd-navy flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-carefd-teal" />
              הזמנות אחרונות
            </h3>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/bookings">הצג הכל <ChevronLeft className="w-4 h-4 ms-1" /></Link>
            </Button>
          </div>
          {recentBookings.length === 0 ? (
            <p className="text-slate-400 text-center py-8">אין הזמנות</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.slice(0, 5).map((b: any) => (
                <div key={b.booking_id || b.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-carefd-navy">{b.service_name || b.serviceName || "שירות"}</p>
                    <p className="text-xs text-slate-500">
                      {b.user_name || b.clientName || "לקוח"} • {b.booking_date ? new Date(b.booking_date || b.bookingDate).toLocaleDateString("he-IL") : ""}
                    </p>
                  </div>
                  {getStatusBadge(b.status)}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Users */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-carefd-navy flex items-center gap-2">
              <Users className="w-5 h-5 text-carefd-teal" />
              משתמשים חדשים
            </h3>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/users">הצג הכל <ChevronLeft className="w-4 h-4 ms-1" /></Link>
            </Button>
          </div>
          {recentUsers.length === 0 ? (
            <p className="text-slate-400 text-center py-8">אין משתמשים</p>
          ) : (
            <div className="space-y-3">
              {recentUsers.slice(0, 5).map((u: any) => (
                <div key={u.user_id || u.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-carefd-teal to-carefd-navy flex items-center justify-center text-white text-sm font-bold">
                      {(u.name || "M")[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-carefd-navy">{u.name || "משתמש"}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>
                  <Badge variant={u.role === "admin" ? "destructive" : u.role === "provider" ? "accent" : "outline"}>
                    {u.role === "admin" ? "מנהל" : u.role === "provider" ? "ספק" : "משתמש"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-carefd-navy mb-4">פעולות מהירות</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "ניהול ספקים", icon: Stethoscope, href: "/admin/providers", color: "bg-carefd-teal/10 text-carefd-teal" },
            { label: "ניהול משתמשים", icon: Users, href: "/admin/users", color: "bg-blue-50 text-blue-600" },
            { label: "בקשות שירות", icon: FileText, href: "/admin/requests", color: "bg-purple-50 text-purple-600" },
            { label: "ביקורות", icon: Star, href: "/admin/reviews", color: "bg-amber-50 text-amber-600" },
            { label: "הודעות", icon: MessageCircle, href: "/admin/messages", color: "bg-pink-50 text-pink-600" },
            { label: "אימות חשבונות", icon: Shield, href: "/admin/verification", color: "bg-emerald-50 text-emerald-600" },
            { label: "דוחות", icon: TrendingUp, href: "/admin/reports", color: "bg-indigo-50 text-indigo-600" },
            { label: "הגדרות", icon: Wrench, href: "/admin/settings", color: "bg-slate-100 text-slate-600" },
          ].map((a) => (
            <Link key={a.label} href={a.href}>
              <Card className="p-4 text-center hover-lift cursor-pointer border-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${a.color}`}>
                  <a.icon className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-carefd-navy">{a.label}</p>
              </Card>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
