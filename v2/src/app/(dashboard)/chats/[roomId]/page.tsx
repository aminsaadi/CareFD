"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import type { ChatMessage } from "@/lib/types";

export default function ChatRoomPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = () => {
    if (!roomId) return;
    api.get<{ messages: ChatMessage[] }>(`/chat/messages/${roomId}`).then((d) => setMessages(d.messages)).catch(() => {});
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [roomId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await api.post("/chat/messages", { room_id: roomId, content: input });
      setInput("");
      fetchMessages();
    } catch {} finally { setSending(false); }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-white rounded-2xl border border-slate-100">
        {messages.map((m) => {
          const isMine = m.senderId === user?.user_id;
          return (
            <div key={m.id} className={`flex ${isMine ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                isMine
                  ? "bg-carefd-navy text-carefd-navy-foreground"
                  : "bg-carefd-stone text-secondary-foreground"
              }`}>
                <p className="text-sm">{m.content}</p>
                <span className={`text-[10px] block mt-1 ${isMine ? "text-white/60" : "text-slate-400"}`}>
                  {new Date(m.createdAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-2 mt-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="כתבו הודעה..."
          className="flex-1"
          data-testid="chat-input"
        />
        <Button type="submit" disabled={sending} data-testid="chat-send">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
