"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { Button } from "@/components/ui/button";
import { Bell, MessageCircle, Menu, X, User, LogOut, LayoutDashboard, Shield } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);

  const dashboardHref = user?.role === "admin" ? "/admin/overview" : user?.role === "provider" ? "/provider/dashboard" : "/dashboard";
  const dashboardLabel = user?.role === "admin" ? "ניהול" : user?.role === "provider" ? "לוח בקרה" : "האזור שלי";

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50 shadow-soft">
      <div className="container-main">
        <div className="flex justify-between h-18 items-center py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group" data-testid="nav-logo">
            <span className="text-2xl font-heading font-bold text-primary">Care</span>
            <span className="text-2xl font-heading font-bold text-accent">FD</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/providers" className="text-slate-600 hover:text-primary transition-colors font-medium text-sm" data-testid="nav-providers">
              מטפלים
            </Link>
            <Link href="/services" className="text-slate-600 hover:text-primary transition-colors font-medium text-sm" data-testid="nav-services">
              שירותים
            </Link>
            <Link href="/requests" className="text-slate-600 hover:text-primary transition-colors font-medium text-sm" data-testid="nav-requests">
              בקשות
            </Link>
            <Link href="/about" className="text-slate-600 hover:text-primary transition-colors font-medium text-sm" data-testid="nav-about">
              אודות
            </Link>

            {user ? (
              <div className="flex items-center gap-3">
                <Link href="/notifications" className="relative p-2 text-slate-500 hover:text-primary hover:bg-slate-50 rounded-full transition-colors" data-testid="nav-notifications">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -start-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
                <Link href="/chats" className="p-2 text-slate-500 hover:text-primary hover:bg-slate-50 rounded-full transition-colors" data-testid="nav-chats">
                  <MessageCircle className="w-5 h-5" />
                </Link>
                <Button asChild size="sm" data-testid="nav-dashboard">
                  <Link href={dashboardHref}>
                    {user.role === "admin" ? <Shield className="w-4 h-4 me-2" /> : <LayoutDashboard className="w-4 h-4 me-2" />}
                    {dashboardLabel}
                  </Link>
                </Button>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-full transition-colors"
                  data-testid="nav-logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" asChild data-testid="nav-login">
                  <Link href="/login">התחברות</Link>
                </Button>
                <Button size="sm" asChild data-testid="nav-register">
                  <Link href="/register">הרשמה</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-primary rounded-full"
            data-testid="nav-mobile-toggle"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 px-4 py-6 space-y-1 animate-fade-in">
          <Link href="/providers" className="flex items-center gap-3 text-slate-700 py-3 px-4 rounded-xl hover:bg-slate-50 font-medium" onClick={() => setMenuOpen(false)}>
            מטפלים
          </Link>
          <Link href="/services" className="flex items-center gap-3 text-slate-700 py-3 px-4 rounded-xl hover:bg-slate-50 font-medium" onClick={() => setMenuOpen(false)}>
            שירותים
          </Link>
          <Link href="/requests" className="flex items-center gap-3 text-slate-700 py-3 px-4 rounded-xl hover:bg-slate-50 font-medium" onClick={() => setMenuOpen(false)}>
            בקשות
          </Link>
          <Link href="/about" className="flex items-center gap-3 text-slate-700 py-3 px-4 rounded-xl hover:bg-slate-50 font-medium" onClick={() => setMenuOpen(false)}>
            אודות
          </Link>

          <div className="border-t border-slate-100 my-3" />

          {user ? (
            <>
              <Link href={dashboardHref} className="flex items-center gap-3 text-primary font-semibold py-3 px-4 rounded-xl hover:bg-slate-50" onClick={() => setMenuOpen(false)}>
                <LayoutDashboard className="w-5 h-5" />
                {dashboardLabel}
              </Link>
              <Link href="/notifications" className="flex items-center gap-3 text-slate-700 py-3 px-4 rounded-xl hover:bg-slate-50" onClick={() => setMenuOpen(false)}>
                <Bell className="w-5 h-5" />
                התראות
                {unreadCount > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{unreadCount}</span>}
              </Link>
              <Link href="/chats" className="flex items-center gap-3 text-slate-700 py-3 px-4 rounded-xl hover:bg-slate-50" onClick={() => setMenuOpen(false)}>
                <MessageCircle className="w-5 h-5" />
                הודעות
              </Link>
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className="flex items-center gap-3 text-red-500 py-3 px-4 rounded-xl hover:bg-red-50 w-full font-medium"
              >
                <LogOut className="w-5 h-5" />
                יציאה
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-3 pt-2">
              <Button variant="secondary" asChild className="w-full" onClick={() => setMenuOpen(false)}>
                <Link href="/login">התחברות</Link>
              </Button>
              <Button asChild className="w-full" onClick={() => setMenuOpen(false)}>
                <Link href="/register">הרשמה</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
