"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useNotifications } from "@/context/NotificationContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bell, CheckCheck, Trash2, CalendarDays, MessageCircle,
  Star, FileText, Shield, DollarSign, Info,
} from "lucide-react";
import { toast } from "sonner";

const typeConfig: Record<string, { icon: any; color: string; label: string }> = {
  booking: { icon: CalendarDays, color: "bg-blue-100 text-blue-600", label: "הזמנה" },
  booking_confirmed: { icon: CalendarDays, color: "bg-green-100 text-green-600", label: "הזמנה אושרה" },
  booking_cancelled: { icon: CalendarDays, color: "bg-red-100 text-red-600", label: "הזמנה בוטלה" },
  booking_completed: { icon: CalendarDays, color: "bg-purple-100 text-purple-600", label: "הזמנה הושלמה" },
  message: { icon: MessageCircle, color: "bg-cyan-100 text-cyan-600", label: "הודעה" },
  review: { icon: Star, color: "bg-amber-100 text-amber-600", label: "ביקורת" },
  request: { icon: FileText, color: "bg-indigo-100 text-indigo-600", label: "בקשה" },
  offer: { icon: DollarSign, color: "bg-emerald-100 text-emerald-600", label: "הצעה" },
  verification: { icon: Shield, color: "bg-teal-100 text-teal-600", label: "אימות" },
  system: { icon: Info, color: "bg-slate-100 text-slate-600", label: "מערכת" },
};

const filterOptions = [
  { v: "all", l: "הכל" },
  { v: "unread", l: "לא נקראו" },
  { v: "booking", l: "הזמנות" },
  { v: "message", l: "הודעות" },
  { v: "review", l: "ביקורות" },
  { v: "request", l: "בקשות" },
  { v: "system", l: "מערכת" },
];

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState("all");
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const filtered = notifications.filter((n) => {
    if (deletedIds.has(n.id)) return false;
    if (filter === "all") return true;
    if (filter === "unread") return !n.isRead;
    return (n.type || "").startsWith(filter);
  });

  const handleDelete = (id: string) => {
    setDeletedIds((prev) => new Set(prev).add(id));
    toast.success("ההתראה הוסרה");
  };

  const getNotificationLink = (n: any): string | null => {
    if (n.data?.booking_id) return `/bookings`;
    if (n.data?.request_id) return `/requests/${n.data.request_id}`;
    if (n.data?.room_id) return `/chats/${n.data.room_id}`;
    if (n.data?.provider_id) return `/providers/${n.data.provider_id}`;
    return null;
  };

  const getTypeInfo = (type: string) => {
    return typeConfig[type] || typeConfig.system;
  };

  const groupByDate = () => {
    const groups: { label: string; items: typeof filtered }[] = [];
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    let currentLabel = "";

    filtered.forEach((n) => {
      const date = new Date(n.createdAt || (n as any).created_at);
      const dateStr = date.toDateString();
      let label = date.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" });
      if (dateStr === today) label = "היום";
      else if (dateStr === yesterday) label = "אתמול";

      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, items: [n] });
      } else {
        groups[groups.length - 1].items.push(n);
      }
    });
    return groups;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1>התראות</h1>
          {unreadCount > 0 && <p className="text-sm text-carefd-teal mt-1">{unreadCount} לא נקראו</p>}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="w-4 h-4 me-1.5" /> סמן הכל כנקרא
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filterOptions.map((f) => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              filter === f.v ? "bg-carefd-teal text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}>
            {f.l}
            {f.v === "unread" && unreadCount > 0 && (
              <span className="ms-1 bg-red-500 text-white rounded-full px-1.5 text-xs">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-lg mb-1">{filter === "unread" ? "אין התראות שלא נקראו" : "אין התראות"}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupByDate().map((group) => (
            <div key={group.label}>
              <h3 className="text-sm font-medium text-slate-400 mb-3">{group.label}</h3>
              <div className="space-y-2">
                {group.items.map((n) => {
                  const typeInfo = getTypeInfo(n.type || "system");
                  const TypeIcon = typeInfo.icon;
                  const link = getNotificationLink(n);
                  const content = (
                    <Card
                      onClick={() => !n.isRead && markAsRead(n.id)}
                      className={`p-4 cursor-pointer transition-all hover:shadow-md group ${
                        n.isRead ? "opacity-60" : "border-s-4 border-carefd-teal bg-carefd-teal-pale/10"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeInfo.color}`}>
                          <TypeIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-medium text-carefd-navy text-sm">{n.title}</h3>
                              <p className="text-sm text-slate-500 mt-1">{n.message}</p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className="text-xs text-slate-400">
                                {new Date(n.createdAt || (n as any).created_at).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <Badge variant="outline" className="mt-2 text-xs">{typeInfo.label}</Badge>
                        </div>
                      </div>
                    </Card>
                  );
                  return link ? <Link key={n.id} href={link}>{content}</Link> : <div key={n.id}>{content}</div>;
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
