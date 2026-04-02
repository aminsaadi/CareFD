"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import {
  BarChart3, Users, Stethoscope, CalendarDays, Wrench,
  FileText, Star, GraduationCap, MapPin, CreditCard,
  FileStack, PenTool, Megaphone, Settings,
} from "lucide-react";

const adminLinks = [
  { href: "/admin/overview", label: "סקירה", icon: BarChart3 },
  { href: "/admin/users", label: "משתמשים", icon: Users },
  { href: "/admin/providers", label: "ספקים", icon: Stethoscope },
  { href: "/admin/bookings", label: "הזמנות", icon: CalendarDays },
  { href: "/admin/services", label: "שירותים", icon: Wrench },
  { href: "/admin/requests", label: "בקשות", icon: FileText },
  { href: "/admin/reviews", label: "ביקורות", icon: Star },
  { href: "/admin/professions", label: "מקצועות", icon: GraduationCap },
  { href: "/admin/regions", label: "אזורים", icon: MapPin },
  { href: "/admin/subscriptions", label: "מנויים", icon: CreditCard },
  { href: "/admin/pages", label: "דפים", icon: FileStack },
  { href: "/admin/blog", label: "בלוג", icon: PenTool },
  { href: "/admin/ads", label: "פרסום", icon: Megaphone },
  { href: "/admin/settings", label: "הגדרות", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-[var(--background-alt)] flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          {/* Sidebar */}
          <aside className="w-60 bg-white/80 backdrop-blur-xl border-e border-slate-100 hidden md:block flex-shrink-0 shadow-soft">
            <nav className="p-4 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold px-3 mb-3">ניהול</p>
              {adminLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground font-medium shadow-sm"
                        : "text-slate-600 hover:bg-secondary hover:text-primary"
                    }`}
                  >
                    <link.icon className={`w-4 h-4 ${isActive ? "" : "text-slate-400"}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1 p-6 md:p-8 overflow-auto">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
