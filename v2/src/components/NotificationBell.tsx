"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useNotifications } from "@/context/NotificationContext";
import {
  Bell, CheckCheck, CalendarDays, MessageCircle, Star,
  DollarSign, Shield, Info,
} from "lucide-react";

const typeIcons: Record<string, { icon: any; color: string }> = {
  booking: { icon: CalendarDays, color: "text-blue-500 bg-blue-50" },
  booking_confirmed: { icon: CalendarDays, color: "text-green-500 bg-green-50" },
  booking_cancelled: { icon: CalendarDays, color: "text-red-500 bg-red-50" },
  message: { icon: MessageCircle, color: "text-purple-500 bg-purple-50" },
  review: { icon: Star, color: "text-amber-500 bg-amber-50" },
  offer: { icon: DollarSign, color: "text-carefd-teal bg-carefd-teal/10" },
  verification: { icon: Shield, color: "text-teal-500 bg-teal-50" },
};

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "עכשיו";
  if (mins < 60) return `לפני ${mins} דק'`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `לפני ${hours} שע'`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "אתמול";
  if (days < 7) return `לפני ${days} ימים`;
  return d.toLocaleDateString("he-IL");
};

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const getIcon = (type?: string) => {
    const t = typeIcons[type || ""] || { icon: Info, color: "text-slate-500 bg-slate-50" };
    const Icon = t.icon;
    return (
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${t.color}`}>
        <Icon className="w-4 h-4" />
      </div>
    );
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2.5 text-carefd-slate hover:text-carefd-teal hover:bg-carefd-teal-pale/30 rounded-xl transition-all" data-testid="notification-bell">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -start-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse-glow">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-soft-lg border border-slate-100/50 z-50 animate-scale-in overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-carefd-stone/30">
            <div className="flex items-center gap-2">
              <h4 className="font-heading font-semibold text-carefd-navy text-sm">התראות</h4>
              {unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">{unreadCount}</span>}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-carefd-teal hover:underline flex items-center gap-1">
                <CheckCheck className="w-3 h-3" />סמן הכל כנקרא
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-10">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">אין התראות חדשות</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  onClick={() => { if (!n.isRead) markAsRead(n.id); }}
                  className={`px-4 py-3 cursor-pointer hover:bg-carefd-teal-pale/10 transition-colors flex items-start gap-3 ${
                    !n.isRead ? "bg-carefd-teal/5 border-e-3 border-e-carefd-teal" : "border-b border-slate-50"
                  }`}
                >
                  {getIcon(n.type)}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.isRead ? "font-semibold text-carefd-navy" : "text-carefd-slate"}`}>{n.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{n.message}</p>
                    <p className="text-[10px] text-slate-300 mt-1">{formatTime(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <div className="w-2 h-2 bg-carefd-teal rounded-full mt-2 flex-shrink-0" />}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <Link href="/notifications" onClick={() => setOpen(false)}
            className="block text-center text-sm text-carefd-teal font-medium py-3 border-t border-slate-100 hover:bg-carefd-teal-pale/10 transition-colors">
            הצג את כל ההתראות
          </Link>
        </div>
      )}
    </div>
  );
}
