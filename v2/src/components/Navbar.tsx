"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { Button } from "@/components/ui/button";
import { Bell, MessageCircle, Menu, X, LogOut, LayoutDashboard, Shield } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);

  const dashboardHref = user?.role === "admin" ? "/admin/overview" : user?.role === "provider" ? "/provider/dashboard" : "/dashboard";
  const dashboardLabel = user?.role === "admin" ? "ניהול" : user?.role === "provider" ? "לוח בקרה" : "האזור שלי";

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 shadow-soft">
      <div className="container-main">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-1" data-testid="nav-logo">
            <span className="text-2xl font-heading font-bold text-carefd-navy">Care</span>
            <span className="text-2xl font-heading font-bold text-carefd-teal">FD</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/providers" className="text-carefd-slate hover:text-carefd-teal transition-colors font-medium text-sm">מטפלים</Link>
            <Link href="/services" className="text-carefd-slate hover:text-carefd-teal transition-colors font-medium text-sm">שירותים</Link>
            <Link href="/requests" className="text-carefd-slate hover:text-carefd-teal transition-colors font-medium text-sm">בקשות</Link>
            <Link href="/about" className="text-carefd-slate hover:text-carefd-teal transition-colors font-medium text-sm">אודות</Link>

            {user ? (
              <div className="flex items-center gap-3">
                <Link href="/notifications" className="relative p-2 text-carefd-gray hover:text-carefd-teal hover:bg-carefd-teal/5 rounded-xl transition-all" data-testid="nav-notifications">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -start-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">{unreadCount > 9 ? "9+" : unreadCount}</span>
                  )}
                </Link>
                <Link href="/chats" className="p-2 text-carefd-gray hover:text-carefd-teal hover:bg-carefd-teal/5 rounded-xl transition-all" data-testid="nav-chats">
                  <MessageCircle className="w-5 h-5" />
                </Link>
                <Button asChild size="sm" data-testid="nav-dashboard">
                  <Link href={dashboardHref}>
                    {user.role === "admin" ? <Shield className="w-4 h-4 me-2" /> : <LayoutDashboard className="w-4 h-4 me-2" />}
                    {dashboardLabel}
                  </Link>
                </Button>
                <button onClick={logout} className="p-2 text-carefd-light-gray hover:text-red-500 rounded-xl transition-colors" data-testid="nav-logout">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" asChild data-testid="nav-login">
                  <Link href="/login" className="text-carefd-teal">התחברות</Link>
                </Button>
                <Button size="sm" asChild data-testid="nav-register">
                  <Link href="/register">הרשמה</Link>
                </Button>
              </div>
            )}
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-carefd-navy" data-testid="nav-mobile-toggle">
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-1 animate-fade-in">
          <Link href="/providers" className="block text-carefd-navy py-3 px-4 rounded-xl hover:bg-carefd-teal/5 font-medium" onClick={() => setMenuOpen(false)}>מטפלים</Link>
          <Link href="/services" className="block text-carefd-navy py-3 px-4 rounded-xl hover:bg-carefd-teal/5 font-medium" onClick={() => setMenuOpen(false)}>שירותים</Link>
          <Link href="/requests" className="block text-carefd-navy py-3 px-4 rounded-xl hover:bg-carefd-teal/5 font-medium" onClick={() => setMenuOpen(false)}>בקשות</Link>
          <div className="border-t border-slate-100 my-3" />
          {user ? (
            <>
              <Link href={dashboardHref} className="flex items-center gap-3 text-carefd-teal font-semibold py-3 px-4 rounded-xl hover:bg-carefd-teal/5" onClick={() => setMenuOpen(false)}>
                <LayoutDashboard className="w-5 h-5" />{dashboardLabel}
              </Link>
              <button onClick={() => { logout(); setMenuOpen(false); }} className="flex items-center gap-3 text-red-500 py-3 px-4 rounded-xl hover:bg-red-50 w-full font-medium">
                <LogOut className="w-5 h-5" />יציאה
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-3 pt-2">
              <Button variant="secondary" asChild className="w-full" onClick={() => setMenuOpen(false)}><Link href="/login">התחברות</Link></Button>
              <Button asChild className="w-full" onClick={() => setMenuOpen(false)}><Link href="/register">הרשמה</Link></Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
