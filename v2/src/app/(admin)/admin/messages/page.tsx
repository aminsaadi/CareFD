"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Search, Users } from "lucide-react";

export default function AdminMessagesPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    api.get<{ rooms: any[] }>("/chat/rooms")
      .then((d) => setRooms(d.rooms || d || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = rooms.filter((r) => {
    if (!search) return true;
    const names = `${r.user_name || ""} ${r.provider_name || ""}`.toLowerCase();
    return names.includes(search.toLowerCase());
  });

  const totalMessages = rooms.reduce((sum, r) => sum + (r.message_count || 0), 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-heading font-semibold text-2xl">ניהול הודעות</h2>
          <p className="text-sm text-slate-400 mt-1">{rooms.length} שיחות • {totalMessages} הודעות</p>
        </div>
      </div>

      {rooms.length > 3 && (
        <div className="relative mb-4">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חפש לפי שם משתמש או ספק..." className="ps-10 h-10" />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400">{search ? "לא נמצאו שיחות" : "אין שיחות"}</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <Card key={r.room_id} className="p-4 flex items-center gap-4 hover:bg-carefd-stone/30 transition">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-carefd-teal/10 flex items-center justify-center text-carefd-teal font-heading font-bold">
                  <Users className="w-5 h-5" />
                </div>
                {(r.unread_count || 0) > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{r.unread_count}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-carefd-navy text-sm">{r.user_name || "משתמש"}</span>
                  <span className="text-slate-300">&harr;</span>
                  <span className="font-medium text-carefd-navy text-sm">{r.provider_name || "ספק"}</span>
                  {r.booking_id && <Badge variant="outline" className="text-[10px]">הזמנה #{r.booking_id?.slice(-6)}</Badge>}
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">{r.last_message || "אין הודעות"}</p>
              </div>
              <div className="text-end flex-shrink-0">
                {r.last_message_at && <p className="text-xs text-slate-400">{new Date(r.last_message_at).toLocaleDateString("he-IL")}</p>}
                {r.message_count > 0 && <p className="text-xs text-slate-400 mt-0.5">{r.message_count} הודעות</p>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
