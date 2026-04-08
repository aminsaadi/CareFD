"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell, Check, Trash2, CalendarDays, MessageCircle,
  Star, AlertCircle, CheckCircle, Info, Shield,
} from "lucide-react";
import { toast } from "sonner";

const typeIcons: Record<string, any> = {
  booking_new: CalendarDays, booking_confirmed: CheckCircle, booking_cancelled: AlertCircle,
  booking_completed: Check, message_new: MessageCircle, chat_message: MessageCircle,
  offer_new: Bell, offer_accepted: CheckCircle, review_new: Star,
  provider_registered: Info, system: Bell,
};
const typeColors: Record<string, string> = {
  booking_new: "text-blue-500 bg-blue-50", booking_confirmed: "text-green-500 bg-green-50",
  booking_cancelled: "text-red-500 bg-red-50", booking_completed: "text-green-500 bg-green-50",
  message_new: "text-purple-500 bg-purple-50", chat_message: "text-purple-500 bg-purple-50",
  offer_new: "text-amber-500 bg-amber-50", offer_accepted: "text-green-500 bg-green-50",
  review_new: "text-yellow-500 bg-yellow-50", provider_registered: "text-blue-500 bg-blue-50",
  system: "text-carefd-teal bg-carefd-teal/10",
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchData = () => {
    setLoading(true);
    api.get<{ notifications: any[] }>("/notifications", { limit: "100" })
      .then((d) => setNotifications(d.notifications || []))
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleMarkRead = async (id: string) => {
    try { await api.put(`/notifications/${id}/read`); fetchData(); }
    catch { toast.error("שגיאה"); }
  };

  const handleMarkAllRead = async () => {
    try { await api.put("/notifications/read-all"); toast.success("כל ההתראות סומנו כנקראו"); fetchData(); }
    catch { toast.error("שגיאה"); }
  };

  const handleDelete = async (id: string) => {
    try { await api.delete(`/notifications/${id}`); toast.success("נמחקה"); fetchData(); }
    catch { toast.error("שגיאה"); }
  };

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.is_read && !n.isRead;
    return (n.type || "").startsWith(filter);
  });

  const unreadCount = notifications.filter((n) => !n.is_read && !n.isRead).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-heading font-semibold text-2xl">ניהול התראות</h2>
          <p className="text-sm text-slate-400 mt-1">{notifications.length} התראות • {unreadCount} לא נקראו</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <Check className="w-4 h-4 me-1" />סמן הכל כנקרא
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[["all","הכל"],["unread","לא נקראו"],["booking","הזמנות"],["message","הודעות"],["offer","הצעות"],["review","ביקורות"],["system","מערכת"]].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${filter === v ? "bg-carefd-teal text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
            {l}
            {v === "unread" && unreadCount > 0 && <span className="ms-1 bg-red-500 text-white rounded-full px-1.5">{unreadCount}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center"><Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400">{filter === "unread" ? "אין התראות שלא נקראו" : "אין התראות"}</p></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const Icon = typeIcons[n.type] || Bell;
            const color = typeColors[n.type] || typeColors.system;
            const isRead = n.is_read || n.isRead;
            return (
              <Card key={n.id || n.notification_id} className={`p-4 flex items-start gap-3 transition ${!isRead ? "border-s-4 border-carefd-teal bg-carefd-teal-pale/5" : "opacity-60"}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-carefd-navy text-sm">{n.title}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">{n.message || n.body}</p>
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0 whitespace-nowrap">
                      {n.created_at || n.createdAt ? new Date(n.created_at || n.createdAt).toLocaleDateString("he-IL") : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px]">{n.type || "system"}</Badge>
                    {n.recipient_role && <Badge variant="outline" className="text-[10px]">{n.recipient_role === "provider" ? "ספק" : n.recipient_role === "admin" ? "מנהל" : "משתמש"}</Badge>}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {!isRead && <Button size="sm" variant="ghost" onClick={() => handleMarkRead(n.id || n.notification_id)} title="סמן כנקרא"><Check className="w-4 h-4 text-carefd-teal" /></Button>}
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(n.id || n.notification_id)} title="מחק"><Trash2 className="w-4 h-4 text-red-400" /></Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
