"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle } from "lucide-react";

export default function AdminMessagesPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ rooms: any[] }>("/chat/rooms").then((d) => setRooms(d.rooms)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="font-heading font-semibold text-2xl mb-6">ניהול הודעות ({rooms.length})</h2>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : rooms.length === 0 ? (
        <Card className="p-10 text-center"><MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400">אין שיחות</p></Card>
      ) : (
        <div className="space-y-2">
          {rooms.map((r) => (
            <Card key={r.room_id} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-carefd-teal/10 flex items-center justify-center text-carefd-teal font-heading font-bold flex-shrink-0">
                {(r.provider_name || r.user_name)?.[0] || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-carefd-navy text-sm">{r.user_name || "משתמש"}</span>
                  <span className="text-slate-300">&harr;</span>
                  <span className="font-medium text-carefd-navy text-sm">{r.provider_name || "ספק"}</span>
                </div>
                <p className="text-xs text-slate-400 truncate">{r.last_message || "אין הודעות"}</p>
              </div>
              {r.last_message_at && <span className="text-xs text-slate-400">{new Date(r.last_message_at).toLocaleDateString("he-IL")}</span>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
