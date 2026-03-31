"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api-client";
import { format, isToday, isYesterday } from "date-fns";
import { toast } from "sonner";
import {
  FaComments, FaSearch, FaUserMd, FaSpinner, FaCheckDouble, FaCheck,
  FaArchive, FaTrash, FaEllipsisV, FaInbox, FaUndoAlt, FaTimes,
} from "react-icons/fa";

interface ChatRoomData {
  room_id: string;
  other_user?: {
    name?: string;
    business_name?: string;
  };
  last_message?: {
    content?: string;
    sender_id?: string;
    read_at?: string;
  };
  last_message_at?: string;
  unread_count: number;
}

export default function ChatListPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoomData[]>([]);
  const [archivedRooms, setArchivedRooms] = useState<ChatRoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === "archived") fetchArchivedRooms();
  }, [activeTab]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchRooms = async () => {
    try {
      const data = await api.get<{ rooms: ChatRoomData[] }>("/chat/rooms");
      setRooms(data.rooms || []);
    } catch (error) {
      console.error("Failed to fetch chat rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivedRooms = async () => {
    try {
      const data = await api.get<{ rooms: ChatRoomData[] }>("/chat/rooms", { archived: "true" });
      setArchivedRooms(data.rooms || []);
    } catch (error) {
      console.error("Failed to fetch archived rooms:", error);
    }
  };

  const handleArchive = async (roomId: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    try {
      await api.put(`/chat/rooms/${roomId}/archive`);
      setRooms((prev) => prev.filter((r) => r.room_id !== roomId));
      setOpenMenuId(null);
      toast.success("השיחה הועברה לארכיון");
    } catch { toast.error("שגיאה בהעברה לארכיון"); }
  };

  const handleUnarchive = async (roomId: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    try {
      await api.put(`/chat/rooms/${roomId}/unarchive`);
      setArchivedRooms((prev) => prev.filter((r) => r.room_id !== roomId));
      fetchRooms();
      setOpenMenuId(null);
      toast.success("השיחה שוחזרה");
    } catch { toast.error("שגיאה בשחזור"); }
  };

  const handleDelete = async (roomId: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    try {
      await api.delete(`/chat/rooms/${roomId}`);
      setRooms((prev) => prev.filter((r) => r.room_id !== roomId));
      setArchivedRooms((prev) => prev.filter((r) => r.room_id !== roomId));
      setConfirmDelete(null);
      setOpenMenuId(null);
      toast.success("השיחה נמחקה");
    } catch { toast.error("שגיאה במחיקה"); }
  };

  const formatLastMessageTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isToday(date)) return format(date, "HH:mm");
    if (isYesterday(date)) return "אתמול";
    return format(date, "dd/MM");
  };

  const currentRooms = activeTab === "archived" ? archivedRooms : rooms;
  const filteredRooms = currentRooms.filter((room) => {
    if (!searchQuery) return true;
    const name = room.other_user?.name || room.other_user?.business_name || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const RoomItem = ({ room, index, isArchived }: { room: ChatRoomData; index: number; isArchived: boolean }) => {
    const otherUser = room.other_user;
    const name = otherUser?.name || otherUser?.business_name || "משתמש";
    const initial = name[0] || "?";
    const hasUnread = room.unread_count > 0;
    const lastMessage = room.last_message?.content || "";
    const isLastFromMe = room.last_message?.sender_id === user?.user_id;

    return (
      <div
        className={`relative group ${index !== filteredRooms.length - 1 ? "border-b border-carefd-teal-pale" : ""}`}
        data-testid={`chat-room-${room.room_id}`}
      >
        <Link href={`/chats/${room.room_id}`} className="block hover:bg-carefd-teal-pale/30 transition">
          <div className="p-4 flex items-center gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl ${hasUnread ? "bg-carefd-teal" : "bg-carefd-navy"}`}>
                {initial}
              </div>
              {!isArchived && (
                <span className="absolute bottom-0 left-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className={`font-bold truncate ${hasUnread ? "text-carefd-navy" : "text-carefd-slate"}`}>{name}</h3>
                <span className={`text-xs flex-shrink-0 me-2 ${hasUnread ? "text-carefd-teal font-bold" : "text-carefd-gray"}`}>
                  {formatLastMessageTime(room.last_message_at)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isLastFromMe && (
                  <span className="text-carefd-teal flex-shrink-0">
                    {room.last_message?.read_at ? <FaCheckDouble className="text-sm" /> : <FaCheck className="text-sm text-carefd-gray" />}
                  </span>
                )}
                <p className={`text-sm truncate ${hasUnread ? "text-carefd-navy font-medium" : "text-carefd-gray"}`}>
                  {lastMessage || "לחץ להתחיל שיחה"}
                </p>
              </div>
            </div>

            {/* Unread Badge */}
            {hasUnread && (
              <div className="flex-shrink-0">
                <span className="bg-carefd-teal text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                  {room.unread_count > 9 ? "9+" : room.unread_count}
                </span>
              </div>
            )}

            {/* Menu Button */}
            <div className="flex-shrink-0 relative" ref={openMenuId === room.room_id ? menuRef : null}>
              <button
                onClick={(e) => {
                  e.preventDefault(); e.stopPropagation();
                  setOpenMenuId(openMenuId === room.room_id ? null : room.room_id);
                  setConfirmDelete(null);
                }}
                className="p-2 rounded-full hover:bg-gray-200 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                data-testid={`chat-menu-${room.room_id}`}
              >
                <FaEllipsisV className="text-carefd-gray text-sm" />
              </button>

              {openMenuId === room.room_id && (
                <div className="absolute left-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 min-w-[180px] z-20">
                  {isArchived ? (
                    <button onClick={(e) => handleUnarchive(room.room_id, e)} className="w-full text-right px-4 py-2.5 hover:bg-carefd-teal-pale text-carefd-navy text-sm flex items-center gap-3" data-testid={`unarchive-${room.room_id}`}>
                      <FaUndoAlt className="text-carefd-teal" /> שחזר מארכיון
                    </button>
                  ) : (
                    <button onClick={(e) => handleArchive(room.room_id, e)} className="w-full text-right px-4 py-2.5 hover:bg-carefd-teal-pale text-carefd-navy text-sm flex items-center gap-3" data-testid={`archive-${room.room_id}`}>
                      <FaArchive className="text-amber-500" /> העבר לארכיון
                    </button>
                  )}

                  {confirmDelete === room.room_id ? (
                    <div className="px-4 py-2.5 border-t border-gray-100">
                      <p className="text-xs text-red-500 mb-2 font-medium">בטוח למחוק?</p>
                      <div className="flex gap-2">
                        <button onClick={(e) => handleDelete(room.room_id, e)} className="flex-1 text-center py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600" data-testid={`confirm-delete-${room.room_id}`}>מחק</button>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDelete(null); }} className="flex-1 text-center py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200">ביטול</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDelete(room.room_id); }} className="w-full text-right px-4 py-2.5 hover:bg-red-50 text-red-500 text-sm flex items-center gap-3" data-testid={`delete-${room.room_id}`}>
                      <FaTrash /> מחק שיחה
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </Link>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-carefd-teal-pale">
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <FaSpinner className="animate-spin text-4xl text-carefd-teal" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-carefd-teal-pale">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-carefd-navy font-heading flex items-center gap-3" data-testid="chats-title">
            <div className="w-12 h-12 bg-carefd-teal rounded-xl flex items-center justify-center">
              <FaComments className="text-white text-xl" />
            </div>
            השיחות שלי
          </h1>
          {rooms.length > 0 && (
            <span className="bg-carefd-teal text-white px-3 py-1 rounded-full text-sm font-medium">
              {rooms.length} שיחות
            </span>
          )}
        </div>

        {/* Tabs: Active / Archived */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === "active" ? "bg-carefd-teal text-white" : "bg-white text-carefd-navy hover:bg-carefd-teal-pale border border-carefd-teal-pale"
            }`}
            data-testid="tab-active"
          >
            <FaInbox /> שיחות ({rooms.length})
          </button>
          <button
            onClick={() => setActiveTab("archived")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === "archived" ? "bg-amber-500 text-white" : "bg-white text-carefd-navy hover:bg-amber-50 border border-carefd-teal-pale"
            }`}
            data-testid="tab-archived"
          >
            <FaArchive /> ארכיון {archivedRooms.length > 0 && `(${archivedRooms.length})`}
          </button>
        </div>

        {/* Search */}
        {currentRooms.length > 3 && (
          <div className="relative mb-6">
            <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-carefd-gray" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חפש שיחה..."
              className="w-full pr-12 pl-4 py-3 bg-white border-2 border-carefd-teal-pale rounded-xl focus:outline-none focus:border-carefd-teal"
              data-testid="chat-search"
            />
          </div>
        )}

        {currentRooms.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-carefd-teal-pale">
            <div className="w-24 h-24 bg-carefd-teal-pale rounded-full flex items-center justify-center mx-auto mb-6">
              {activeTab === "archived" ? <FaArchive className="text-4xl text-amber-500" /> : <FaComments className="text-4xl text-carefd-teal" />}
            </div>
            <h2 className="text-xl font-bold text-carefd-navy mb-2">
              {activeTab === "archived" ? "אין שיחות בארכיון" : "עדיין אין שיחות"}
            </h2>
            <p className="text-carefd-gray mb-6">
              {activeTab === "archived" ? "שיחות שתעביר לארכיון יופיעו כאן" : "התחל שיחה עם ספק שירותים כדי לקבל מידע נוסף"}
            </p>
            {activeTab === "active" && (
              <Link href="/providers" className="inline-flex items-center gap-2 bg-carefd-teal text-white px-6 py-3 rounded-xl font-semibold hover:bg-carefd-teal-medium transition">
                <FaUserMd /> מצא ספקים
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-carefd-teal-pale">
            {filteredRooms.length === 0 ? (
              <div className="p-8 text-center text-carefd-gray">
                לא נמצאו שיחות עבור &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredRooms.map((room, index) => (
                <RoomItem key={room.room_id} room={room} index={index} isArchived={activeTab === "archived"} />
              ))
            )}
          </div>
        )}

        {/* Quick Tips */}
        {activeTab === "active" && rooms.length > 0 && (
          <div className="mt-6 bg-carefd-teal-pale/30 rounded-xl p-4">
            <p className="text-sm text-carefd-navy">
              <strong>טיפ:</strong> העבר שיחות לארכיון כדי לשמור על סדר. לחץ על &#8942; ליד כל שיחה.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
