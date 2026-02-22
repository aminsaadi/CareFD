import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import { FiMessageSquare, FiSearch, FiSend, FiUser } from 'react-icons/fi';

const AdminMessages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/messages/conversations');
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      // Demo data
      setConversations([
        { id: 1, user_name: 'ישראל ישראלי', last_message: 'תודה על העזרה!', time: '5 דקות', unread: 2 },
        { id: 2, user_name: 'שרה כהן', last_message: 'מתי אפשר לקבוע תור?', time: '1 שעה', unread: 0 },
        { id: 3, user_name: 'דוד לוי', last_message: 'יש לי שאלה לגבי השירות', time: '3 שעות', unread: 1 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    // Demo messages
    setMessages([
      { id: 1, sender: 'user', text: 'שלום, יש לי שאלה', time: '10:00' },
      { id: 2, sender: 'admin', text: 'שלום! איך אוכל לעזור?', time: '10:05' },
      { id: 3, sender: 'user', text: conversation.last_message, time: '10:10' },
    ]);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    const message = {
      id: Date.now(),
      sender: 'admin',
      text: newMessage,
      time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const filteredConversations = conversations.filter(c =>
    c.user_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-120px)] flex bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-carelink-navy mb-3">הודעות</h2>
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
              <div className="p-4 text-center text-carelink-gray">טוען...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-carelink-gray">אין הודעות</div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
                    selectedConversation?.id === conv.id ? 'bg-carelink-teal-pale' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-carelink-teal rounded-full flex items-center justify-center text-white">
                      <FiUser />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-carelink-navy">{conv.user_name}</span>
                        <span className="text-xs text-carelink-gray">{conv.time}</span>
                      </div>
                      <p className="text-sm text-carelink-gray truncate">{conv.last_message}</p>
                    </div>
                    {conv.unread > 0 && (
                      <span className="bg-carelink-teal text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {conv.unread}
                      </span>
                    )}
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
              <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                <div className="w-10 h-10 bg-carelink-teal rounded-full flex items-center justify-center text-white">
                  <FiUser />
                </div>
                <div>
                  <h3 className="font-medium text-carelink-navy">{selectedConversation.user_name}</h3>
                  <span className="text-sm text-green-500">מחובר</span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'admin' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-2xl ${
                        msg.sender === 'admin'
                          ? 'bg-carelink-teal text-white rounded-br-none'
                          : 'bg-gray-100 text-carelink-navy rounded-bl-none'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <span className={`text-xs ${msg.sender === 'admin' ? 'text-white/70' : 'text-carelink-gray'}`}>
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="כתוב הודעה..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:border-carelink-teal outline-none"
                  />
                  <button
                    onClick={sendMessage}
                    className="px-4 py-2 bg-carelink-teal text-white rounded-lg hover:bg-carelink-teal-medium transition"
                  >
                    <FiSend />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-carelink-gray">
              <div className="text-center">
                <FiMessageSquare className="mx-auto text-5xl mb-3 text-gray-300" />
                <p>בחר שיחה כדי להתחיל</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminMessages;
