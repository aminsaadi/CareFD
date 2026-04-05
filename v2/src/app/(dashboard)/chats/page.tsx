"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Search } from "lucide-react";
import type { ChatRoom } from "@/lib/types";

export default function ChatsPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get<{ rooms: ChatRoom[] }>("/chat/rooms")
      .then((d) => setRooms(d.rooms || d as any || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = rooms.filter((r) => {
    if (!search) return true;
    const name = (r.provider_name || r.user_name || "").toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const totalUnread = rooms.reduce((sum, r) => sum + (r.unread_count || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>הודעות</h1>
          {totalUnread > 0 && (
            <p className="text-sm text-carefd-teal mt-1">{totalUnread} הודעות שלא נקראו</p>
          )}
        </div>
      </div>

      {/* Search */}
      {rooms.length > 3 && (
        <div className="relative mb-4">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="חפש שיחה..." className="ps-10 h-10" />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-lg mb-1">
            {search ? "לא נמצאו שיחות" : "אין שיחות עדיין"}
          </p>
          {!search && (
            <p className="text-slate-400 text-sm">
              שיחות יופיעו כאן כאשר תיצרו קשר עם ספקים או לקוחות
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const name = r.provider_name || r.user_name || "משתמש";
            const hasUnread = (r.unread_count || 0) > 0;
            const lastMessageTime = r.last_message_at
              ? new Date(r.last_message_at)
              : null;
            const isToday = lastMessageTime &&
              lastMessageTime.toDateString() === new Date().toDateString();

            return (
              <Link key={r.room_id} href={`/chats/${r.room_id}`}>
                <Card className={`p-4 flex items-center gap-4 transition-colors ${
                  hasUnread
                    ? "bg-carefd-teal-pale/20 hover:bg-carefd-teal-pale/40 border-carefd-teal/30"
                    : "hover:bg-carefd-stone/50"
                }`}>
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-carefd-teal to-carefd-navy flex items-center justify-center text-white font-bold text-lg">
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
                    <div className="flex items-center justify-between">
                      <h3 className={`font-medium truncate ${hasUnread ? "font-bold text-carefd-navy" : "text-carefd-navy"}`}>
                        {name}
                      </h3>
                      {lastMessageTime && (
                        <span className={`text-xs flex-shrink-0 ms-2 ${hasUnread ? "text-carefd-teal font-medium" : "text-slate-400"}`}>
                          {isToday
                            ? lastMessageTime.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })
                            : lastMessageTime.toLocaleDateString("he-IL")}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm truncate mt-0.5 ${hasUnread ? "text-slate-600 font-medium" : "text-slate-400"}`}>
                      {r.last_message || "אין הודעות"}
                    </p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
