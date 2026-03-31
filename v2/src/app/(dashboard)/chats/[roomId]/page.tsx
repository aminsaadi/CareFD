"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api-client";
import { format, isToday, isYesterday } from "date-fns";
import { he } from "date-fns/locale";
import { toast } from "sonner";
import {
  FaPaperPlane, FaArrowRight, FaEllipsisV,
  FaCheckDouble, FaCheck, FaClock, FaUserMd,
  FaSpinner, FaArchive, FaTrash, FaImage, FaTimes,
} from "react-icons/fa";

interface MessageData {
  message_id: string;
  sender_id: string;
  content: string;
  message_type?: string;
  attachment_url?: string;
  attachment_name?: string;
  created_at: string;
  status?: string;
  read_at?: string;
  is_read?: boolean;
}

interface RoomInfoData {
  room_id: string;
  other_user?: { name?: string; business_name?: string };
  provider_id?: string;
}

export default function ChatRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [roomInfo, setRoomInfo] = useState<RoomInfoData | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchRoomInfo();
    fetchMessages();
    pollIntervalRef.current = setInterval(() => { fetchMessages(true); }, 3000);
    return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const fetchRoomInfo = async () => {
    try {
      const data = await api.get<{ rooms: RoomInfoData[] }>("/chat/rooms");
      const room = data.rooms?.find((r) => r.room_id === roomId);
      if (!room) {
        const archivedData = await api.get<{ rooms: RoomInfoData[] }>("/chat/rooms", { archived: "true" });
        const archivedRoom = archivedData.rooms?.find((r) => r.room_id === roomId);
        if (archivedRoom) setRoomInfo(archivedRoom);
      } else {
        setRoomInfo(room);
      }
    } catch (error) { console.error("Failed to fetch room info:", error); }
  };

  const fetchMessages = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await api.get<{ messages: MessageData[] }>(`/chat/messages/${roomId}`);
      setMessages(data.messages || []);
    } catch (error) { console.error("Failed to fetch messages:", error); }
    finally { if (!silent) setLoading(false); }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("ניתן לשלוח קבצי תמונה בלבד"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("גודל התמונה מוגבל ל-5MB"); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImagePreview = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !imageFile) || sending) return;

    const messageContent = newMessage.trim();
    const hasImage = !!imageFile;
    setNewMessage("");

    const tempMessage: MessageData = {
      message_id: `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sender_id: user?.user_id || "",
      content: hasImage ? (messageContent || "📷 תמונה") : messageContent,
      message_type: hasImage ? "image" : "text",
      attachment_url: imagePreview || undefined,
      created_at: new Date().toISOString(),
      status: "sending",
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      setSending(true);
      let attachmentUrl: string | null = null;
      let attachmentName: string | null = null;

      if (hasImage) {
        setUploading(true);
        // Note: The v2 api client doesn't support FormData natively; using fetch directly for upload
        const formData = new FormData();
        formData.append("file", imageFile!);
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const uploadRes = await fetch("/api/upload/image", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        const uploadData = await uploadRes.json();
        attachmentUrl = uploadData.url;
        attachmentName = uploadData.original_name;
        setUploading(false);
        clearImagePreview();
      }

      await api.post("/chat/messages", {
        room_id: roomId,
        content: messageContent || (hasImage ? "📷 תמונה" : ""),
        message_type: hasImage ? "image" : "text",
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
      });
      fetchMessages(true);
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.message_id !== tempMessage.message_id));
      setNewMessage(messageContent);
      clearImagePreview();
      toast.error("שגיאה בשליחת ההודעה");
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const handleArchive = async () => {
    try {
      await api.put(`/chat/rooms/${roomId}/archive`);
      toast.success("השיחה הועברה לארכיון");
      router.push("/chats");
    } catch { toast.error("שגיאה בהעברה לארכיון"); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/chat/rooms/${roomId}`);
      toast.success("השיחה נמחקה");
      router.push("/chats");
    } catch { toast.error("שגיאה במחיקה"); }
  };

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return format(date, "HH:mm");
    if (isYesterday(date)) return `אתמול ${format(date, "HH:mm")}`;
    return format(date, "dd/MM HH:mm");
  };

  const formatDateDivider = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return "היום";
    if (isYesterday(date)) return "אתמול";
    return format(date, "dd בMMMM yyyy", { locale: he });
  };

  const shouldShowDateDivider = (message: MessageData, index: number) => {
    if (index === 0) return true;
    const prevDate = new Date(messages[index - 1].created_at).toDateString();
    return new Date(message.created_at).toDateString() !== prevDate;
  };

  const getMessageStatus = (message: MessageData) => {
    if (message.status === "sending") return <FaClock className="text-gray-400" />;
    if (message.read_at || message.is_read) return <FaCheckDouble className="text-blue-400" />;
    return <FaCheck className="text-gray-400" />;
  };

  const otherUser = roomInfo?.other_user;
  const otherUserName = otherUser?.name || otherUser?.business_name || "משתמש";
  const otherUserInitial = otherUserName[0] || "?";

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-gradient-to-b from-carefd-navy to-carefd-teal">
        <div className="flex-1 flex items-center justify-center">
          <FaSpinner className="animate-spin text-4xl text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-carefd-navy to-carefd-teal" data-testid="chat-room">
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full min-h-0">
        {/* Chat Header - Fixed */}
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push("/chats")} className="text-white hover:bg-white/20 p-2 rounded-full transition" data-testid="back-btn">
                <FaArrowRight className="text-lg" />
              </button>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-carefd-teal rounded-full flex items-center justify-center text-white font-bold text-xl border-2 border-white/30">
                    {otherUserInitial}
                  </div>
                  <span className="absolute bottom-0 left-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                </div>
                <div>
                  <h2 className="font-bold text-white text-lg">{otherUserName}</h2>
                  <p className="text-xs text-white/70">פעיל עכשיו</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button onClick={() => setShowOptions(!showOptions)} className="text-white hover:bg-white/20 p-2.5 rounded-full transition" data-testid="chat-options-btn">
                  <FaEllipsisV />
                </button>
                {showOptions && (
                  <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-xl py-2 min-w-[180px] z-10">
                    <Link href={`/providers/${roomInfo?.provider_id}`} className="block px-4 py-2.5 hover:bg-carefd-teal-pale text-carefd-navy text-sm">
                      צפה בפרופיל
                    </Link>
                    <button onClick={handleArchive} className="w-full text-right px-4 py-2.5 hover:bg-amber-50 text-carefd-navy text-sm flex items-center gap-3" data-testid="archive-chat-btn">
                      <FaArchive className="text-amber-500" /> העבר לארכיון
                    </button>
                    <button onClick={handleDelete} className="w-full text-right px-4 py-2.5 hover:bg-red-50 text-red-500 text-sm flex items-center gap-3" data-testid="delete-chat-btn">
                      <FaTrash /> מחק שיחה
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area - Scrollable, fixed height */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-1 min-h-0"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
          data-testid="messages-container"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/70">
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-4">
                <FaUserMd className="text-4xl" />
              </div>
              <p className="text-lg font-medium">התחל שיחה עם {otherUserName}</p>
              <p className="text-sm mt-1">שלח הודעה כדי להתחיל</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwn = message.sender_id === user?.user_id;
              const showDate = shouldShowDateDivider(message, index);

              return (
                <Fragment key={message.message_id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="bg-black/20 text-white/80 text-xs px-4 py-1.5 rounded-full">
                        {formatDateDivider(message.created_at)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-1`} data-testid={`message-${message.message_id}`}>
                    <div className={`flex items-end gap-2 max-w-[80%] ${isOwn ? "flex-row-reverse" : ""}`}>
                      {!isOwn && (
                        <div className="w-8 h-8 bg-carefd-teal rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mb-1">
                          {otherUserInitial}
                        </div>
                      )}
                      <div className={`px-4 py-2.5 rounded-2xl shadow-sm ${isOwn ? "bg-carefd-teal text-white rounded-br-md" : "bg-white text-carefd-navy rounded-bl-md"}`}>
                        {message.message_type === "image" && message.attachment_url ? (
                          <>
                            <div className="mb-1">
                              <img
                                src={message.attachment_url}
                                alt={message.attachment_name || "תמונה"}
                                className="max-w-[250px] max-h-[300px] rounded-lg cursor-pointer object-cover"
                                onClick={() => window.open(message.attachment_url, "_blank")}
                                loading="lazy"
                              />
                            </div>
                            {message.content && message.content !== "📷 תמונה" && (
                              <p className="break-words whitespace-pre-wrap text-[15px]">{message.content}</p>
                            )}
                          </>
                        ) : (
                          <p className="break-words whitespace-pre-wrap text-[15px]">{message.content}</p>
                        )}
                        <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                          <span className={`text-xs ${isOwn ? "text-white/70" : "text-carefd-gray"}`}>
                            {formatMessageDate(message.created_at)}
                          </span>
                          {isOwn && <span className="text-xs">{getMessageStatus(message)}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </Fragment>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input - Fixed at bottom */}
        <div className="bg-white/10 backdrop-blur-md border-t border-white/20 p-4 flex-shrink-0">
          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-3 relative inline-block">
              <img src={imagePreview} alt="תצוגה מקדימה" className="max-h-32 rounded-xl border-2 border-white/30" />
              <button onClick={clearImagePreview} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:bg-red-600">
                <FaTimes className="text-xs" />
              </button>
              {uploading && (
                <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                  <FaSpinner className="animate-spin text-white text-xl" />
                </div>
              )}
            </div>
          )}
          <form onSubmit={handleSendMessage} className="flex items-end gap-3">
            <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              className="text-white/70 hover:text-white p-3 rounded-full hover:bg-white/10 transition disabled:opacity-50"
              title="שלח תמונה"
            >
              <FaImage className="text-xl" />
            </button>
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }
                }}
                placeholder="כתוב הודעה..."
                rows={1}
                maxLength={2000}
                className="w-full px-4 py-3 bg-white/20 text-white placeholder-white/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/30 resize-none border border-white/20"
                style={{ maxHeight: "120px" }}
                disabled={sending}
                data-testid="message-input"
              />
            </div>
            <button
              type="submit"
              disabled={sending || (!newMessage.trim() && !imageFile)}
              className="bg-white text-carefd-teal p-3 rounded-full hover:bg-carefd-teal-pale transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              data-testid="send-message-btn"
            >
              {sending ? <FaSpinner className="animate-spin text-xl" /> : <FaPaperPlane className="text-xl" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
