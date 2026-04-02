"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useNotifications } from "@/context/NotificationContext";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2 text-carefd-gray hover:text-carefd-teal hover:bg-carefd-teal/5 rounded-xl transition-all" data-testid="notification-bell">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -start-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center pulse-soft">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 top-full mt-2 w-80 bg-white rounded-xl shadow-soft-lg border border-slate-100 z-50 animate-scale-in overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h4 className="font-heading font-semibold text-carefd-navy text-sm">התראות</h4>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-carefd-teal hover:underline flex items-center gap-1">
                <CheckCheck className="w-3 h-3" />סמן הכל
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-carefd-gray text-sm py-8">אין התראות</p>
            ) : (
              notifications.slice(0, 8).map((n) => (
                <div
                  key={n.id}
                  onClick={() => { if (!n.isRead) markAsRead(n.id); }}
                  className={`px-4 py-3 border-b border-slate-50 cursor-pointer hover:bg-carefd-teal/5 transition-colors ${!n.isRead ? "bg-carefd-teal/5 border-e-2 border-e-carefd-teal" : ""}`}
                >
                  <p className="text-sm font-medium text-carefd-navy">{n.title}</p>
                  <p className="text-xs text-carefd-gray mt-0.5 line-clamp-1">{n.message}</p>
                  <p className="text-[10px] text-carefd-light-gray mt-1">{new Date(n.createdAt).toLocaleDateString("he-IL")}</p>
                </div>
              ))
            )}
          </div>

          <Link href="/notifications" onClick={() => setOpen(false)} className="block text-center text-sm text-carefd-teal font-medium py-3 border-t border-slate-100 hover:bg-carefd-teal/5">
            הצג הכל
          </Link>
        </div>
      )}
    </div>
  );
}
