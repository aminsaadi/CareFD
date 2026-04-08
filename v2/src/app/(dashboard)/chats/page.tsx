"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageCircle, Search, Archive, ArchiveRestore, Trash2,
  MoreVertical, CheckCheck,
} from "lucide-react";
import { toast } from "sonner";
import type { ChatRoom } from "@/lib/types";

export default function ChatsPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    api.get<{ rooms: ChatRoom[] }>("/chat/rooms")
      .then((d) => setRooms(d.rooms || d as any || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleArchive = async (roomId: string, isArchived: boolean) => {
    try {
      await api.put(`/chat/rooms/${roomId}`, { is_archived: !isArchived });
      toast.success(isArchived ? "השיחה שוחזרה" : "השיחה הועברה לארכיון");
      setMenuOpenId(null);
      fetchData();
    } catch { toast.error("שגיאה"); }
  };

  const handleDelete = async (roomId: string) => {
    if (!confirm("האם למחוק שיחה זו?")) return;
    try {
      await api.delete(`/chat/rooms/${roomId}`);
      toast.success("השיחה נמחקה");
      setMenuOpenId(null);
      fetchData();
    } catch { toast.error("שגיאה"); }
  };

  const activeRooms = rooms.filter((r) => !r.is_archived);
  const archivedRooms = rooms.filter((r) => r.is_archived);
  const currentRooms = activeTab === "archived" ? archivedRooms : activeRooms;
  const filtered = currentRooms.filter((r) => {
    if (!search) return true;
    const name = (r.provider_name || r.user_name || r.other_user?.name || "").toLowerCase();
    return name.includes(search.toLowerCase());
  });
  const totalUnread = activeRooms.reduce((sum, r) => sum + (r.unread_count || 0), 0);

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
    const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "אתמול";
    return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>הודעות</h1>
          {totalUnread > 0 && <p className="text-sm text-carefd-teal mt-1">{totalUnread} הודעות שלא נקראו</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab("active")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${activeTab === "active" ? "bg-carefd-teal text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
          שיחות פעילות ({activeRooms.length})
        </button>
        {archivedRooms.length > 0 && (
          <button onClick={() => setActiveTab("archived")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition flex items-center gap-1 ${activeTab === "archived" ? "bg-carefd-teal text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
            <Archive className="w-3.5 h-3.5" />ארכיון ({archivedRooms.length})
          </button>
        )}
      </div>

      {/* Search */}
      {currentRooms.length > 3 && (
        <div className="relative mb-4">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חפש שיחה..." className="ps-10 h-10" />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-lg mb-1">{search ? "לא נמצאו שיחות" : activeTab === "archived" ? "אין שיחות בארכיון" : "אין שיחות עדיין"}</p>
          {!search && activeTab === "active" && <p className="text-slate-400 text-sm">שיחות יופיעו כאן כאשר תיצרו קשר עם ספקים או לקוחות</p>}
        </div>
      ) : (
        <Card className="overflow-hidden p-0 divide-y divide-slate-100">
          {filtered.map((r) => {
            const name = r.other_user?.name || r.provider_name || r.user_name || "משתמש";
            const hasUnread = (r.unread_count || 0) > 0;
            const lastMsg = typeof r.last_message === "string" ? r.last_message : (r.last_message as any)?.content || "";

            return (
              <div key={r.room_id} className="relative group">
                <Link href={`/chats/${r.room_id}`}
                  className={`flex items-center gap-4 p-4 transition-colors ${hasUnread ? "bg-carefd-teal-pale/10 hover:bg-carefd-teal-pale/20" : "hover:bg-slate-50"}`}>
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl ${hasUnread ? "bg-carefd-teal" : "bg-carefd-navy"}`}>
                      {name[0] || "?"}
                    </div>
                    {hasUnread && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {r.unread_count! > 9 ? "9+" : r.unread_count}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className={`font-medium truncate ${hasUnread ? "font-bold text-carefd-navy" : "text-carefd-slate"}`}>{name}</h3>
                      <span className={`text-xs flex-shrink-0 ms-2 ${hasUnread ? "text-carefd-teal font-bold" : "text-slate-400"}`}>
                        {formatTime(r.last_message_at)}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${hasUnread ? "text-slate-600 font-medium" : "text-slate-400"}`}>
                      {lastMsg || "אין הודעות"}
                    </p>
                  </div>
                </Link>

                {/* Context Menu */}
                <div className="absolute top-3 end-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpenId(menuOpenId === r.room_id ? null : r.room_id); }}
                    className="p-1.5 rounded-lg hover:bg-slate-200 transition">
                    <MoreVertical className="w-4 h-4 text-slate-400" />
                  </button>
                  {menuOpenId === r.room_id && (
                    <div className="absolute end-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20 min-w-[140px] animate-scale-in">
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleArchive(r.room_id, r.is_archived); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition">
                        {r.is_archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                        {r.is_archived ? "שחזר" : "ארכיון"}
                      </button>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(r.room_id); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition">
                        <Trash2 className="w-4 h-4" />מחק
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
