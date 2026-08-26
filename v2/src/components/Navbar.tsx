"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { Button } from "@/components/ui/button";
import { Bell, MessageCircle, Menu, X, LogOut, LayoutDashboard, Shield } from "lucide-react";

const publicLinks = [
  { href: "/providers", label: "מטפלים" },
  { href: "/services", label: "שירותים" },
  { href: "/requests", label: "בקשות" },
  { href: "/about", label: "אודות" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);

  const dashboardHref = user?.role === "admin" ? "/admin/overview" : user?.role === "provider" ? "/provider/dashboard" : "/dashboard";
  const dashboardLabel = user?.role === "admin" ? "ניהול" : user?.role === "provider" ? "לוח בקרה" : "האזור שלי";

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur-xl supports-[backdrop-filter]:bg-white/85">
      <div className="container-main">
        <div className="flex h-[72px] items-center justify-between gap-6">
          <Link href="/" className="flex min-h-11 items-center gap-0.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carefd-teal/40" data-testid="nav-logo" aria-label="CaredZ - דף הבית">
            <span className="text-[26px] font-heading font-bold tracking-tight text-carefd-navy">Cared</span>
            <span className="text-[26px] font-heading font-bold tracking-tight text-carefd-teal">Z</span>
          </Link>

          <div className="hidden md:flex flex-1 items-center justify-center gap-1 lg:gap-2">
            {publicLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-carefd-teal/[0.08] text-carefd-navy"
                    : "text-carefd-slate hover:bg-slate-50 hover:text-carefd-navy"
                }`}
              >
                {item.label}
                {isActive(item.href) && <span className="absolute inset-x-4 -bottom-[13px] h-0.5 rounded-full bg-carefd-teal" />}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Link href="/notifications" aria-label="התראות" className="relative flex h-10 w-10 items-center justify-center rounded-xl text-carefd-gray transition-colors hover:bg-carefd-teal/5 hover:text-carefd-teal" data-testid="nav-notifications">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -start-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>
                  )}
                </Link>
                <Link href="/chats" aria-label="הודעות" className="flex h-10 w-10 items-center justify-center rounded-xl text-carefd-gray transition-colors hover:bg-carefd-teal/5 hover:text-carefd-teal" data-testid="nav-chats">
                  <MessageCircle className="h-5 w-5" />
                </Link>
                <Button asChild size="sm" data-testid="nav-dashboard">
                  <Link href={dashboardHref}>
                    {user.role === "admin" ? <Shield className="me-2 h-4 w-4" /> : <LayoutDashboard className="me-2 h-4 w-4" />}
                    {dashboardLabel}
                  </Link>
                </Button>
                <button onClick={logout} aria-label="יציאה" className="flex h-10 w-10 items-center justify-center rounded-xl text-carefd-gray transition-colors hover:bg-red-50 hover:text-red-500" data-testid="nav-logout">
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild data-testid="nav-login">
                  <Link href="/login">התחברות</Link>
                </Button>
                <Button size="sm" asChild data-testid="nav-register">
                  <Link href="/register?role=provider">הצטרפות כמטפל</Link>
                </Button>
              </>
            )}
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-carefd-navy transition-colors hover:bg-slate-50 md:hidden"
            data-testid="nav-mobile-toggle"
            aria-label={menuOpen ? "סגירת תפריט" : "פתיחת תפריט"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-100 bg-white px-4 pb-5 pt-3 shadow-soft md:hidden animate-fade-in">
          <div className="space-y-1">
            {publicLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-xl px-4 py-3 font-medium ${isActive(item.href) ? "bg-carefd-teal/[0.08] text-carefd-navy" : "text-carefd-navy hover:bg-slate-50"}`}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="my-3 border-t border-slate-100" />
          {user ? (
            <div className="space-y-2">
              <Link href={dashboardHref} className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-carefd-teal hover:bg-carefd-teal/5" onClick={() => setMenuOpen(false)}>
                <LayoutDashboard className="h-5 w-5" />{dashboardLabel}
              </Link>
              <button onClick={() => { logout(); setMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium text-red-500 hover:bg-red-50">
                <LogOut className="h-5 w-5" />יציאה
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Button variant="secondary" asChild className="w-full" onClick={() => setMenuOpen(false)}><Link href="/login">התחברות</Link></Button>
              <Button asChild className="w-full" onClick={() => setMenuOpen(false)}><Link href="/register?role=provider">הצטרפות</Link></Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
