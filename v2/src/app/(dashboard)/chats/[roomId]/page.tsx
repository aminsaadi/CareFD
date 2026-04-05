"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, ArrowRight, Phone, Video, MoreVertical, CheckCheck, Clock } from "lucide-react";
import type { ChatMessage } from "@/lib/types";

interface RoomInfo {
  room_id: string;
  other_user?: { name: string; picture?: string; user_id?: string };
  provider?: { business_name: string; provider_id?: string };
  user_name?: string;
  provider_name?: string;
  booking_id?: string;
}

export default function ChatRoomPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchMessages = () => {
    if (!roomId) return;
    api.get<{ messages: ChatMessage[]; room?: RoomInfo }>(`/chat/messages/${roomId}`)
      .then((d) => {
        setMessages(d.messages || []);
        if (d.room) setRoomInfo(d.room);
      })
      .catch(() => {});
  };

  const fetchRoomInfo = () => {
    if (!roomId) return;
    api.get<any>(`/chat/rooms/${roomId}`)
      .then((d) => setRoomInfo(d))
      .catch(() => {});
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<{ messages: ChatMessage[] }>(`/chat/messages/${roomId}`).then((d) => setMessages(d.messages || [])).catch(() => {}),
      api.get<any>(`/chat/rooms/${roomId}`).then((d) => setRoomInfo(d)).catch(() => {}),
    ]).finally(() => setLoading(false));

    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    if (roomId && messages.length > 0) {
      api.put(`/chat/rooms/${roomId}/read`).catch(() => {});
    }
  }, [roomId, messages.length]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await api.post("/chat/messages", { room_id: roomId, content: input.trim() });
      setInput("");
      fetchMessages();
      inputRef.current?.focus();
    } catch {} finally { setSending(false); }
  };

  const otherName = roomInfo?.other_user?.name || roomInfo?.provider?.business_name || roomInfo?.provider_name || roomInfo?.user_name || "משתמש";
  const otherInitial = otherName[0] || "?";
  const otherPicture = roomInfo?.other_user?.picture;

  const groupMessagesByDate = () => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = "";
    messages.forEach((m) => {
      const date = new Date(m.createdAt).toLocaleDateString("he-IL");
      if (date !== currentDate) {
        currentDate = date;
        groups.push({ date, messages: [m] });
      } else {
        groups[groups.length - 1].messages.push(m);
      }
    });
    return groups;
  };

  if (loading) return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <Skeleton className="h-16 w-full mb-4" />
      <div className="flex-1 space-y-4 p-4">
        {[1,2,3,4].map((i) => <Skeleton key={i} className={`h-12 ${i % 2 === 0 ? "w-2/3 ms-auto" : "w-2/3"}`} />)}
      </div>
      <Skeleton className="h-12 w-full" />
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Header */}
      <Card className="p-4 mb-3 flex items-center gap-4 border-0 shadow-sm">
        <Button variant="ghost" size="sm" onClick={() => router.push("/chats")} className="flex-shrink-0">
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {otherPicture ? (
            <img src={otherPicture} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-carefd-teal to-carefd-navy flex items-center justify-center text-white font-bold flex-shrink-0">
              {otherInitial}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-carefd-navy truncate">{otherName}</h3>
            <p className="text-xs text-slate-400">שיחה פעילה</p>
          </div>
        </div>
        {roomInfo?.provider?.provider_id && (
          <Button variant="ghost" size="sm" asChild className="text-carefd-teal flex-shrink-0">
            <Link href={`/providers/${roomInfo.provider.provider_id}`}>צפה בפרופיל</Link>
          </Button>
        )}
      </Card>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-white rounded-2xl border border-slate-100">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-lg mb-1">אין הודעות עדיין</p>
            <p className="text-sm">שלחו הודעה ראשונה כדי להתחיל</p>
          </div>
        ) : (
          <div className="space-y-1">
            {groupMessagesByDate().map((group) => (
              <div key={group.date}>
                {/* Date separator */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400 bg-white px-3">{group.date}</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                {group.messages.map((m) => {
                  const isMine = m.senderId === user?.user_id;
                  return (
                    <div key={m.id} className={`flex mb-2 ${isMine ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                        isMine
                          ? "bg-carefd-navy text-white rounded-br-md"
                          : "bg-slate-100 text-slate-800 rounded-bl-md"
                      }`}>
                        {!isMine && (m as any).senderName && (
                          <p className={`text-xs font-medium mb-1 ${isMine ? "text-white/70" : "text-carefd-teal"}`}>
                            {(m as any).senderName}
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-start" : "justify-end"}`}>
                          <span className={`text-[10px] ${isMine ? "text-white/50" : "text-slate-400"}`}>
                            {new Date(m.createdAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {isMine && <CheckCheck className={`w-3 h-3 ${m.isRead ? "text-blue-300" : "text-white/40"}`} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-2 mt-3">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="כתבו הודעה..."
          className="flex-1 h-12 rounded-xl"
          data-testid="chat-input"
          autoFocus
        />
        <Button type="submit" disabled={sending || !input.trim()} className="h-12 px-6 rounded-xl" data-testid="chat-send">
          {sending ? <Clock className="w-4 h-4 animate-pulse" /> : <Send className="w-4 h-4" />}
        </Button>
      </form>
    </div>
  );
}
