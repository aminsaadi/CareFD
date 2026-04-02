"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarDays, FileText, MessageCircle, Bell,
  Clock, CheckCircle, Hourglass, Edit, ChevronLeft,
} from "lucide-react";
import type { Booking } from "@/lib/types";

export default function ProviderDashboardPage() {
  const { user, provider } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({ pending: 0, confirmed: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ bookings: Booking[] }>("/bookings", { limit: "10" })
      .then((b) => {
        setBookings(b.bookings);
        setStats({
          pending: b.bookings.filter((x) => x.status === "pending").length,
          confirmed: b.bookings.filter((x) => x.status === "confirmed").length,
          completed: b.bookings.filter((x) => x.status === "completed").length,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: "ממתין לאישור", value: stats.pending, icon: Hourglass, color: "bg-amber-50 text-amber-600" },
    { label: "מאושרות", value: stats.confirmed, icon: Clock, color: "bg-blue-50 text-blue-600" },
    { label: "הושלמו", value: stats.completed, icon: CheckCircle, color: "bg-emerald-50 text-emerald-600" },
  ];

  const quickLinks = [
    { href: "/bookings", label: "הזמנות", icon: CalendarDays },
    { href: "/requests", label: "בקשות שירות", icon: FileText },
    { href: "/chats", label: "הודעות", icon: MessageCircle },
    { href: "/notifications", label: "התראות", icon: Bell },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="mb-1">לוח בקרה</h1>
          <p className="text-slate-500">{provider?.business_name || user?.name}</p>
        </div>
        <Button asChild data-testid="edit-profile">
          <Link href={`/provider/edit/${provider?.provider_id}`}>
            <Edit className="w-4 h-4 me-2" />
            ערוך פרופיל
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {statCards.map((s) => (
          <Card key={s.label} className={`p-6 text-center ${s.color} border-0`}>
            <s.icon className="w-6 h-6 mx-auto mb-2" />
            <p className="text-3xl font-heading font-bold">{s.value}</p>
            <p className="text-sm mt-1 opacity-80">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {quickLinks.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="p-5 text-center hover-lift">
              <item.icon className="w-6 h-6 mx-auto mb-2 text-accent" />
              <p className="text-sm font-medium text-primary">{item.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Bookings */}
      <Card className="p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-heading font-semibold">הזמנות אחרונות</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/bookings">
              הצג הכל
              <ChevronLeft className="w-4 h-4 ms-1" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : bookings.length === 0 ? (
          <p className="text-slate-400 text-center py-10">אין הזמנות עדיין</p>
        ) : (
          <div className="space-y-3">
            {bookings.slice(0, 5).map((b) => (
              <div key={b.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-2xl">
                <div>
                  <p className="font-medium text-primary">{b.serviceName}</p>
                  <p className="text-sm text-slate-400">
                    {b.clientName} {b.bookingDate ? ` \u2022 ${new Date(b.bookingDate).toLocaleDateString("he-IL")}` : ""}
                  </p>
                </div>
                <Badge variant={b.status === "pending" ? "warning" : b.status === "confirmed" ? "accent" : b.status === "completed" ? "success" : "outline"}>
                  {b.status === "pending" ? "ממתין" : b.status === "confirmed" ? "מאושר" : b.status === "completed" ? "הושלם" : b.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
