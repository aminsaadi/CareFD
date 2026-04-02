"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, FileText, CalendarDays, MessageCircle, ChevronLeft } from "lucide-react";
import type { Booking } from "@/lib/types";

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "outline" | "accent" }> = {
  pending: { label: "ממתין", variant: "warning" },
  confirmed: { label: "מאושר", variant: "accent" },
  completed: { label: "הושלם", variant: "success" },
  cancelled: { label: "בוטל", variant: "destructive" },
  in_progress: { label: "בתהליך", variant: "accent" },
  provider_completed: { label: "הספק סיים", variant: "success" },
  cancellation_requested: { label: "בקשת ביטול", variant: "warning" },
  rejected: { label: "נדחה", variant: "destructive" },
  on_hold: { label: "בהמתנה", variant: "outline" },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === "provider") { router.replace("/provider/dashboard"); return; }
    if (user?.role === "admin") { router.replace("/admin/overview"); return; }

    api.get<{ bookings: Booking[] }>("/bookings", { limit: "5" })
      .then((d) => setBookings(d.bookings))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, router]);

  if (!user || user.role !== "patient") return null;

  const actions = [
    { href: "/providers", label: "חפש מטפל", icon: Search, color: "bg-carefd-teal/10 text-carefd-teal" },
    { href: "/requests", label: "בקשת שירות", icon: FileText, color: "bg-carefd-navy/10 text-carefd-navy" },
    { href: "/bookings", label: "ההזמנות שלי", icon: CalendarDays, color: "bg-emerald-50 text-emerald-600" },
    { href: "/chats", label: "הודעות", icon: MessageCircle, color: "bg-blue-50 text-blue-600" },
  ];

  return (
    <div>
      <h1 className="mb-2">שלום, {user.name}!</h1>
      <p className="text-slate-500 mb-8">מה תרצו לעשות היום?</p>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {actions.map((item) => (
          <Link key={item.href} href={item.href} data-testid={`action-${item.href.slice(1)}`}>
            <Card className="p-6 text-center hover-lift">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 ${item.color}`}>
                <item.icon className="w-6 h-6" />
              </div>
              <span className="font-medium text-carefd-navy text-sm">{item.label}</span>
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
          <div className="text-center py-10">
            <p className="text-slate-400 mb-2">אין הזמנות עדיין</p>
            <Button variant="secondary" size="sm" asChild>
              <Link href="/providers">חפשו מטפל</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              const config = statusConfig[b.status] || { label: b.status, variant: "outline" as const };
              return (
                <Link key={b.id} href="/bookings" className="flex items-center justify-between p-4 bg-carefd-stone/50 rounded-2xl hover:bg-carefd-stone transition-colors">
                  <div>
                    <p className="font-medium text-carefd-navy">{b.serviceName}</p>
                    <p className="text-sm text-slate-400">
                      {b.providerName} {b.bookingDate ? ` \u2022 ${new Date(b.bookingDate).toLocaleDateString("he-IL")}` : ""}
                    </p>
                  </div>
                  <Badge variant={config.variant}>{config.label}</Badge>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
