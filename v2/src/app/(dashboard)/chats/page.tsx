"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import type { ChatRoom } from "@/lib/types";

export default function ChatsPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ rooms: ChatRoom[] }>("/chat/rooms").then((d) => setRooms(d.rooms)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div dir="rtl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">הודעות</h1>
      {loading ? <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />)}</div> : rooms.length === 0 ? (
        <div className="text-center py-16 text-gray-500">אין שיחות עדיין</div>
      ) : (
        <div className="space-y-2">
          {rooms.map((r) => (
            <Link key={r.room_id} href={`/chats/${r.room_id}`} className="flex items-center gap-4 bg-white rounded-xl p-4 hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold flex-shrink-0">
                {(r.provider_name || r.user_name)?.[0] || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{r.provider_name || r.user_name}</h3>
                <p className="text-sm text-gray-500 truncate">{r.last_message || "אין הודעות"}</p>
              </div>
              {r.last_message_at && <span className="text-xs text-gray-400 flex-shrink-0">{new Date(r.last_message_at).toLocaleDateString("he-IL")}</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
