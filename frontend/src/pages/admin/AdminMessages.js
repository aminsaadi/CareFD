import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { FiMessageSquare, FiSearch, FiSend, FiUser, FiExternalLink } from 'react-icons/fi';

const AdminMessages = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/chat/rooms');
      const rooms = response.data.rooms || [];
      
      // Enrich rooms with provider and user info
      const enrichedRooms = await Promise.all(rooms.map(async (room) => {
        let providerName = 'ספק';
        let userName = 'משתמש';
        
        try {
          const providerRes = await api.get(`/providers/${room.provider_id}`);
          providerName = providerRes.data.business_name || 'ספק';
        } catch (e) {}
        
        try {
          const userRes = await api.get(`/users/${room.user_id}`);
          userName = userRes.data.name || 'משתמש';
        } catch (e) {}
        
        return {
          ...room,
          provider_name: providerName,
          user_name: userName,
          display_name: `${userName} ↔ ${providerName}`
        };
      }));
      
      setConversations(enrichedRooms);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setMessagesLoading(true);
    
    try {
      const response = await api.get(`/chat/messages/${conversation.room_id}?limit=100`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    try {
      const response = await api.post('/chat/messages', {
        room_id: selectedConversation.room_id,
        content: newMessage
      });
      
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const openChatInNewTab = (roomId) => {
    navigate(`/chat/${roomId}`);
  };

  const filteredConversations = conversations.filter(c =>
    c.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.provider_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: he });
    } catch {
      return '';
    }
  };

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-120px)] flex bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-carelink-navy mb-3">צ'אטים ({conversations.length})</h2>
            <div className="relative">
              <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="חיפוש..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:border-carelink-teal outline-none"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-carelink-gray">
                <div className="animate-spin w-6 h-6 border-2 border-carelink-teal border-t-transparent rounded-full mx-auto mb-2"></div>
                טוען...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-carelink-gray">
                <FiMessageSquare className="mx-auto text-3xl text-gray-300 mb-2" />
                אין שיחות
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.room_id}
                  onClick={() => selectConversation(conv)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
                    selectedConversation?.room_id === conv.room_id ? 'bg-carelink-teal-pale' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-carelink-teal rounded-full flex items-center justify-center text-white">
                      <FiMessageSquare />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-carelink-navy text-sm truncate">
                          {conv.display_name}
                        </span>
                      </div>
                      <p className="text-xs text-carelink-gray">
                        {formatTime(conv.last_message_at || conv.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-carelink-teal rounded-full flex items-center justify-center text-white">
                    <FiUser />
                  </div>
                  <div>
                    <h3 className="font-medium text-carelink-navy">{selectedConversation.display_name}</h3>
                    <span className="text-sm text-carelink-gray">חדר: {selectedConversation.room_id}</span>
                  </div>
                </div>
                <button
                  onClick={() => openChatInNewTab(selectedConversation.room_id)}
                  className="flex items-center gap-2 px-3 py-2 text-carelink-teal hover:bg-carelink-teal-pale rounded-lg transition"
                >
                  <FiExternalLink />
                  פתח בדף מלא
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messagesLoading ? (
                  <div className="text-center text-carelink-gray py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-carelink-teal border-t-transparent rounded-full mx-auto mb-2"></div>
                    טוען הודעות...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-carelink-gray py-8">
                    אין הודעות בשיחה זו
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.message_id}
                      className={`flex ${msg.sender_role === 'provider' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          msg.sender_role === 'provider'
                            ? 'bg-white text-carelink-navy rounded-br-none shadow-sm'
                            : 'bg-carelink-teal text-white rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm font-medium mb-1">
                          {msg.sender_role === 'provider' ? 'ספק' : 'לקוח'}
                        </p>
                        <p>{msg.content}</p>
                        <span className={`text-xs ${msg.sender_role === 'provider' ? 'text-carelink-gray' : 'text-white/70'}`}>
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input - Admin usually observes, but can send */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="כתוב הודעה (כמנהל)..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:border-carelink-teal outline-none"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-carelink-teal text-white rounded-lg hover:bg-carelink-teal-medium transition disabled:opacity-50"
                  >
                    <FiSend />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-carelink-gray bg-gray-50">
              <div className="text-center">
                <FiMessageSquare className="mx-auto text-5xl mb-3 text-gray-300" />
                <p>בחר שיחה כדי לצפות בהודעות</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminMessages;
