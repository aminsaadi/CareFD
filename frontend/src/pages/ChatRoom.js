import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { format } from 'date-fns';
import { FaPaperPlane } from 'react-icons/fa';

const ChatRoom = () => {
  const { t } = useTranslation();
  const { roomId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    
    // Poll for new messages every 3 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchMessages(true);
    }, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    try {
      setSending(true);
      await api.post('/chat/messages', {
        room_id: roomId,
        content: newMessage.trim()
      });
      setNewMessage('');
      fetchMessages(true);
    } catch (error) {
      console.error('Failed to send message:', error);
      alert(t('errorOccurred'));
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-12">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-carelink-teal-pale">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg border-2 border-carelink-teal-pale overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          {/* Messages Area */}
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-4" data-testid="messages-container">
              {messages.length === 0 ? (
                <div className="text-center text-carelink-gray py-12">
                  אין הודעות עדיין. התחל שיחה!
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.sender_id === user?.user_id;
                  return (
                    <div
                      key={message.message_id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      data-testid={`message-${message.message_id}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          isOwn
                            ? 'bg-carelink-teal text-white rounded-br-none'
                            : 'bg-carelink-light-gray text-carelink-navy rounded-bl-none'
                        }`}
                      >
                        <p className="break-words">{message.content}</p>
                        <p className={`text-xs mt-1 ${isOwn ? 'text-carelink-teal-pale' : 'text-carelink-gray'}`}>
                          {format(new Date(message.created_at), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t-2 border-carelink-teal-pale p-4">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="כתוב הודעה..."
                  className="flex-1 px-4 py-3 border border-carelink-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-carelink-teal focus:border-transparent"
                  disabled={sending}
                  data-testid="message-input"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="bg-carelink-teal text-white px-6 py-3 rounded-lg hover:bg-carelink-teal-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  data-testid="send-message-btn"
                >
                  <FaPaperPlane />
                  <span className="hidden sm:inline">שלח</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;