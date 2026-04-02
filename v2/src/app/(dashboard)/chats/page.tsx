"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle } from "lucide-react";
import type { ChatRoom } from "@/lib/types";

export default function ChatsPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ rooms: ChatRoom[] }>("/chat/rooms").then((d) => setRooms(d.rooms)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="mb-6">הודעות</h1>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400">אין שיחות עדיין</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rooms.map((r) => (
            <Link key={r.room_id} href={`/chats/${r.room_id}`}>
              <Card className="p-4 flex items-center gap-4 hover:bg-carefd-stone/50 transition-colors">
                <div className="w-12 h-12 rounded-full bg-carefd-teal/10 flex items-center justify-center text-carefd-teal font-heading font-bold flex-shrink-0">
                  {(r.provider_name || r.user_name)?.[0] || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-carefd-navy truncate">{r.provider_name || r.user_name}</h3>
                  <p className="text-sm text-slate-400 truncate">{r.last_message || "אין הודעות"}</p>
                </div>
                {r.last_message_at && (
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {new Date(r.last_message_at).toLocaleDateString("he-IL")}
                  </span>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
