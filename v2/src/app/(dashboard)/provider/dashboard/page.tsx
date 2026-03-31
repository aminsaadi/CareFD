"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api-client";
import type { Booking } from "@/lib/types";

export default function ProviderDashboardPage() {
  const { user, provider } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({ pending: 0, confirmed: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ bookings: Booking[] }>("/bookings", { limit: "10" }),
    ]).then(([b]) => {
      setBookings(b.bookings);
      const pending = b.bookings.filter((x) => x.status === "pending").length;
      const confirmed = b.bookings.filter((x) => x.status === "confirmed").length;
      const completed = b.bookings.filter((x) => x.status === "completed").length;
      setStats({ pending, confirmed, completed });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">לוח בקרה ספק</h1>
          <p className="text-gray-500">{provider?.business_name || user?.name}</p>
        </div>
        <Link href={`/provider/edit/${provider?.provider_id}`} className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700">
          ערוך פרופיל
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-yellow-50 rounded-xl p-6 text-center">
          <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-sm text-gray-500">ממתין לאישור</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-6 text-center">
          <p className="text-3xl font-bold text-blue-600">{stats.confirmed}</p>
          <p className="text-sm text-gray-500">מאושרות</p>
        </div>
        <div className="bg-green-50 rounded-xl p-6 text-center">
          <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
          <p className="text-sm text-gray-500">הושלמו</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { href: "/bookings", label: "הזמנות", icon: "📅" },
          { href: "/requests", label: "בקשות שירות", icon: "📋" },
          { href: "/chats", label: "הודעות", icon: "💬" },
          { href: "/notifications", label: "התראות", icon: "🔔" },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition-shadow">
            <span className="text-2xl">{item.icon}</span>
            <p className="text-sm font-medium mt-1">{item.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">הזמנות אחרונות</h2>
        {loading ? <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}</div> : bookings.length === 0 ? (
          <p className="text-gray-500 text-center py-8">אין הזמנות עדיין</p>
        ) : (
          <div className="space-y-3">
            {bookings.slice(0, 5).map((b) => (
              <div key={b.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium">{b.serviceName}</p>
                  <p className="text-sm text-gray-500">{b.clientName} • {b.bookingDate ? new Date(b.bookingDate).toLocaleDateString("he-IL") : "יתואם"}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${b.status === "pending" ? "bg-yellow-100 text-yellow-700" : b.status === "confirmed" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                  {b.status === "pending" ? "ממתין" : b.status === "confirmed" ? "מאושר" : b.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
