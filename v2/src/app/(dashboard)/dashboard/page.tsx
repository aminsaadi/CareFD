"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api-client";
import type { Booking } from "@/lib/types";

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

  return (
    <div dir="rtl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">שלום, {user.name}!</h1>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { href: "/providers", label: "חפש מטפל", icon: "🔍" },
          { href: "/requests", label: "בקשת שירות", icon: "📋" },
          { href: "/bookings", label: "ההזמנות שלי", icon: "📅" },
          { href: "/chats", label: "הודעות", icon: "💬" },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow">
            <span className="text-3xl block mb-2">{item.icon}</span>
            <span className="font-medium text-gray-700">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">הזמנות אחרונות</h2>
          <Link href="/bookings" className="text-teal-600 hover:underline text-sm">הצג הכל</Link>
        </div>
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : bookings.length === 0 ? (
          <p className="text-gray-500 py-8 text-center">אין הזמנות עדיין. <Link href="/providers" className="text-teal-600 hover:underline">חפשו מטפל</Link></p>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <Link key={b.id} href={`/bookings`} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">{b.serviceName}</p>
                  <p className="text-sm text-gray-500">{b.providerName} • {b.bookingDate ? new Date(b.bookingDate).toLocaleDateString("he-IL") : "יתואם"}</p>
                </div>
                <StatusBadge status={b.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    in_progress: "bg-purple-100 text-purple-700",
  };
  const labels: Record<string, string> = {
    pending: "ממתין", confirmed: "מאושר", completed: "הושלם",
    cancelled: "בוטל", in_progress: "בתהליך", provider_completed: "הספק סיים",
    cancellation_requested: "בקשת ביטול", rejected: "נדחה", on_hold: "בהמתנה",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-600"}`}>
      {labels[status] || status}
    </span>
  );
}
