import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { format, isToday, isYesterday } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  FaPaperPlane, FaArrowRight, FaEllipsisV,
  FaCheckDouble, FaCheck, FaClock, FaUserMd,
  FaSpinner, FaArchive, FaTrash
} from 'react-icons/fa';

const ChatRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [roomInfo, setRoomInfo] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchRoomInfo();
    fetchMessages();
    
    pollIntervalRef.current = setInterval(() => {
      fetchMessages(true);
    }, 3000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchRoomInfo = async () => {
    try {
      const response = await api.get('/chat/rooms');
      const room = response.data.rooms?.find(r => r.room_id === roomId);
      // Also check archived
      if (!room) {
        const archivedRes = await api.get('/chat/rooms?archived=true');
        const archivedRoom = archivedRes.data.rooms?.find(r => r.room_id === roomId);
        if (archivedRoom) setRoomInfo(archivedRoom);
      } else {
        setRoomInfo(room);
      }
    } catch (error) {
      console.error('Failed to fetch room info:', error);
    }
  };

  const fetchMessages = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get(`/chat/messages/${roomId}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    
    const tempMessage = {
      message_id: `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sender_id: user?.user_id,
      content: messageContent,
      created_at: new Date().toISOString(),
      status: 'sending'
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      setSending(true);
      await api.post('/chat/messages', { room_id: roomId, content: messageContent });
      fetchMessages(true);
    } catch (error) {
      setMessages(prev => prev.filter(m => m.message_id !== tempMessage.message_id));
      setNewMessage(messageContent);
      toast.error('שגיאה בשליחת ההודעה');
    } finally {
      setSending(false);
    }
  };

  const handleArchive = async () => {
    try {
      await api.put(`/chat/rooms/${roomId}/archive`);
      toast.success('השיחה הועברה לארכיון');
      navigate('/chats');
    } catch {
      toast.error('שגיאה בהעברה לארכיון');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/chat/rooms/${roomId}`);
      toast.success('השיחה נמחקה');
      navigate('/chats');
    } catch {
      toast.error('שגיאה במחיקה');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return `אתמול ${format(date, 'HH:mm')}`;
    return format(date, 'dd/MM HH:mm');
  };

  const formatDateDivider = (dateString) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'היום';
    if (isYesterday(date)) return 'אתמול';
    return format(date, 'dd בMMMM yyyy', { locale: he });
  };

  const shouldShowDateDivider = (message, index) => {
    if (index === 0) return true;
    const prevDate = new Date(messages[index - 1].created_at).toDateString();
    return new Date(message.created_at).toDateString() !== prevDate;
  };

  const getMessageStatus = (message) => {
    if (message.status === 'sending') return <FaClock className="text-gray-400" />;
    if (message.read_at || message.is_read) return <FaCheckDouble className="text-blue-400" />;
    return <FaCheck className="text-gray-400" />;
  };

  const otherUser = roomInfo?.other_user;
  const otherUserName = otherUser?.name || otherUser?.business_name || 'משתמש';
  const otherUserInitial = otherUserName[0] || '?';

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-gradient-to-b from-carelink-navy to-carelink-teal">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <FaSpinner className="animate-spin text-4xl text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-carelink-navy to-carelink-teal" data-testid="chat-room">
      <Navbar />
      
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full min-h-0">
        {/* Chat Header - Fixed */}
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/chats')}
                className="text-white hover:bg-white/20 p-2 rounded-full transition"
                data-testid="back-btn"
              >
                <FaArrowRight className="text-lg" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-carelink-teal rounded-full flex items-center justify-center text-white font-bold text-xl border-2 border-white/30">
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
                <button 
                  onClick={() => setShowOptions(!showOptions)}
                  className="text-white hover:bg-white/20 p-2.5 rounded-full transition"
                  data-testid="chat-options-btn"
                >
                  <FaEllipsisV />
                </button>
                {showOptions && (
                  <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-xl py-2 min-w-[180px] z-10">
                    <Link 
                      to={`/providers/${roomInfo?.provider_id}`}
                      className="block px-4 py-2.5 hover:bg-carelink-teal-pale text-carelink-navy text-sm"
                    >
                      צפה בפרופיל
                    </Link>
                    <button
                      onClick={handleArchive}
                      className="w-full text-right px-4 py-2.5 hover:bg-amber-50 text-carelink-navy text-sm flex items-center gap-3"
                      data-testid="archive-chat-btn"
                    >
                      <FaArchive className="text-amber-500" />
                      העבר לארכיון
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-full text-right px-4 py-2.5 hover:bg-red-50 text-red-500 text-sm flex items-center gap-3"
                      data-testid="delete-chat-btn"
                    >
                      <FaTrash />
                      מחק שיחה
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
                <React.Fragment key={message.message_id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="bg-black/20 text-white/80 text-xs px-4 py-1.5 rounded-full">
                        {formatDateDivider(message.created_at)}
                      </span>
                    </div>
                  )}
                  <div
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}
                    data-testid={`message-${message.message_id}`}
                  >
                    <div className={`flex items-end gap-2 max-w-[80%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                      {!isOwn && (
                        <div className="w-8 h-8 bg-carelink-teal rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mb-1">
                          {otherUserInitial}
                        </div>
                      )}
                      <div
                        className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                          isOwn
                            ? 'bg-carelink-teal text-white rounded-br-md'
                            : 'bg-white text-carelink-navy rounded-bl-md'
                        }`}
                      >
                        <p className="break-words whitespace-pre-wrap text-[15px]">{message.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <span className={`text-xs ${isOwn ? 'text-white/70' : 'text-carelink-gray'}`}>
                            {formatMessageDate(message.created_at)}
                          </span>
                          {isOwn && (
                            <span className="text-xs">{getMessageStatus(message)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input - Fixed at bottom */}
        <div className="bg-white/10 backdrop-blur-md border-t border-white/20 p-4 flex-shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="כתוב הודעה..."
                rows={1}
                maxLength={2000}
                className="w-full px-4 py-3 bg-white/20 text-white placeholder-white/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/30 resize-none border border-white/20"
                style={{ maxHeight: '120px' }}
                disabled={sending}
                data-testid="message-input"
              />
            </div>
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="bg-white text-carelink-teal p-3 rounded-full hover:bg-carelink-teal-pale transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              data-testid="send-message-btn"
            >
              {sending ? (
                <FaSpinner className="animate-spin text-xl" />
              ) : (
                <FaPaperPlane className="text-xl" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
