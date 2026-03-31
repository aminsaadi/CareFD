"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-teal-600">CareFD</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/providers" className="text-gray-700 hover:text-teal-600 transition-colors font-medium">
              מטפלים
            </Link>
            <Link href="/services" className="text-gray-700 hover:text-teal-600 transition-colors font-medium">
              שירותים
            </Link>
            <Link href="/requests" className="text-gray-700 hover:text-teal-600 transition-colors font-medium">
              בקשות
            </Link>

            {user ? (
              <div className="flex items-center gap-4">
                <Link href="/notifications" className="relative text-gray-700 hover:text-teal-600">
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
                <Link href="/chats" className="text-gray-700 hover:text-teal-600">💬</Link>
                <Link href="/dashboard" className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors font-medium">
                  {user.role === "provider" ? "לוח בקרה" : user.role === "admin" ? "ניהול" : "האזור שלי"}
                </Link>
                <button onClick={logout} className="text-gray-500 hover:text-red-500 text-sm">
                  יציאה
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-teal-600 hover:text-teal-700 font-medium">
                  התחברות
                </Link>
                <Link href="/register" className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors font-medium">
                  הרשמה
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-gray-700 text-2xl">
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t px-4 py-4 space-y-3">
          <Link href="/providers" className="block text-gray-700 py-2" onClick={() => setMenuOpen(false)}>מטפלים</Link>
          <Link href="/services" className="block text-gray-700 py-2" onClick={() => setMenuOpen(false)}>שירותים</Link>
          <Link href="/requests" className="block text-gray-700 py-2" onClick={() => setMenuOpen(false)}>בקשות</Link>
          {user ? (
            <>
              <Link href="/dashboard" className="block text-teal-600 font-medium py-2" onClick={() => setMenuOpen(false)}>לוח בקרה</Link>
              <button onClick={() => { logout(); setMenuOpen(false); }} className="block text-red-500 py-2">יציאה</button>
            </>
          ) : (
            <>
              <Link href="/login" className="block text-teal-600 py-2" onClick={() => setMenuOpen(false)}>התחברות</Link>
              <Link href="/register" className="block bg-teal-600 text-white text-center py-2 rounded-lg" onClick={() => setMenuOpen(false)}>הרשמה</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
