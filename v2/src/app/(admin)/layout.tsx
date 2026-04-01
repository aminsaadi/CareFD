"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";

const adminLinks = [
  { href: "/admin/overview", label: "סקירה", icon: "📊" },
  { href: "/admin/users", label: "משתמשים", icon: "👥" },
  { href: "/admin/providers", label: "ספקים", icon: "🏥" },
  { href: "/admin/bookings", label: "הזמנות", icon: "📅" },
  { href: "/admin/services", label: "שירותים", icon: "🔧" },
  { href: "/admin/requests", label: "בקשות", icon: "📋" },
  { href: "/admin/reviews", label: "ביקורות", icon: "⭐" },
  { href: "/admin/professions", label: "מקצועות", icon: "🎓" },
  { href: "/admin/regions", label: "אזורים", icon: "🗺️" },
  { href: "/admin/subscriptions", label: "מנויים", icon: "💳" },
  { href: "/admin/pages", label: "דפים", icon: "📄" },
  { href: "/admin/blog", label: "בלוג", icon: "✍️" },
  { href: "/admin/ads", label: "פרסום", icon: "📢" },
  { href: "/admin/settings", label: "הגדרות", icon: "⚙️" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="bg-gray-100">
        <div className="flex min-h-[calc(100vh-5rem)]">
          {/* Sidebar */}
          <aside className="w-56 bg-white shadow-sm hidden md:block flex-shrink-0" dir="rtl">
            <nav className="p-4 space-y-1">
              {adminLinks.map((link) => (
                <Link key={link.href} href={link.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${pathname === link.href ? "bg-teal-50 text-teal-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}>
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1 p-6" dir="rtl">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
