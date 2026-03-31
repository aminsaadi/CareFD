"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
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
    <div className="flex flex-col h-[calc(100vh-12rem)]" dir="rtl">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-white rounded-xl">
        {messages.map((m) => {
          const isMine = m.senderId === user?.user_id;
          return (
            <div key={m.id} className={`flex ${isMine ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${isMine ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                <p>{m.content}</p>
                <span className={`text-xs ${isMine ? "text-teal-200" : "text-gray-400"} block mt-1`}>
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
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="כתבו הודעה..."
          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none" />
        <button type="submit" disabled={sending} className="bg-teal-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-teal-700 disabled:opacity-50">
          שלח
        </button>
      </form>
    </div>
  );
}
