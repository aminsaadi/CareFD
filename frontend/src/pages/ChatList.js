import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { 
  FaComments, FaCircle, FaSearch, FaEllipsisV, FaUserMd,
  FaSpinner, FaCheckDouble, FaCheck
} from 'react-icons/fa';

const ChatList = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRooms();
    
    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchRooms, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await api.get('/chat/rooms');
      setRooms(response.data.rooms || []);
    } catch (error) {
      console.error('Failed to fetch chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatLastMessageTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'אתמול';
    } else {
      return format(date, 'dd/MM');
    }
  };

  const filteredRooms = rooms.filter(room => {
    if (!searchQuery) return true;
    const name = room.other_user?.name || room.other_user?.business_name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-carelink-teal-pale">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <FaSpinner className="animate-spin text-4xl text-carelink-teal" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-carelink-teal-pale">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-carelink-navy font-heading flex items-center gap-3" data-testid="chats-title">
            <div className="w-12 h-12 bg-carelink-teal rounded-xl flex items-center justify-center">
              <FaComments className="text-white text-xl" />
            </div>
            השיחות שלי
          </h1>
          {rooms.length > 0 && (
            <span className="bg-carelink-teal text-white px-3 py-1 rounded-full text-sm font-medium">
              {rooms.length} שיחות
            </span>
          )}
        </div>

        {/* Search */}
        {rooms.length > 3 && (
          <div className="relative mb-6">
            <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-carelink-gray" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חפש שיחה..."
              className="w-full pr-12 pl-4 py-3 bg-white border-2 border-carelink-teal-pale rounded-xl focus:outline-none focus:border-carelink-teal"
            />
          </div>
        )}

        {rooms.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-carelink-teal-pale">
            <div className="w-24 h-24 bg-carelink-teal-pale rounded-full flex items-center justify-center mx-auto mb-6">
              <FaComments className="text-4xl text-carelink-teal" />
            </div>
            <h2 className="text-xl font-bold text-carelink-navy mb-2">עדיין אין שיחות</h2>
            <p className="text-carelink-gray mb-6">
              התחל שיחה עם ספק שירותים כדי לקבל מידע נוסף
            </p>
            <Link
              to="/providers"
              className="inline-flex items-center gap-2 bg-carelink-teal text-white px-6 py-3 rounded-xl font-semibold hover:bg-carelink-teal-medium transition"
            >
              <FaUserMd />
              מצא ספקים
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-carelink-teal-pale">
            {filteredRooms.length === 0 ? (
              <div className="p-8 text-center text-carelink-gray">
                לא נמצאו שיחות עבור "{searchQuery}"
              </div>
            ) : (
              filteredRooms.map((room, index) => {
                const otherUser = room.other_user;
                const name = otherUser?.name || otherUser?.business_name || 'משתמש';
                const initial = name[0] || '?';
                const hasUnread = room.unread_count > 0;
                const lastMessage = room.last_message?.content || '';
                const isLastFromMe = room.last_message?.sender_id === user?.user_id;
                
                return (
                  <Link
                    key={room.room_id}
                    to={`/chat/${room.room_id}`}
                    className={`block hover:bg-carelink-teal-pale/30 transition ${
                      index !== filteredRooms.length - 1 ? 'border-b border-carelink-teal-pale' : ''
                    }`}
                    data-testid={`chat-room-${room.room_id}`}
                  >
                    <div className="p-4 flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                          hasUnread ? 'bg-carelink-teal' : 'bg-carelink-navy'
                        }`}>
                          {initial}
                        </div>
                        <span className="absolute bottom-0 left-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-bold truncate ${hasUnread ? 'text-carelink-navy' : 'text-carelink-slate'}`}>
                            {name}
                          </h3>
                          <span className={`text-xs flex-shrink-0 ${hasUnread ? 'text-carelink-teal font-bold' : 'text-carelink-gray'}`}>
                            {formatLastMessageTime(room.last_message_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isLastFromMe && (
                            <span className="text-carelink-teal flex-shrink-0">
                              {room.last_message?.read_at ? (
                                <FaCheckDouble className="text-sm" />
                              ) : (
                                <FaCheck className="text-sm text-carelink-gray" />
                              )}
                            </span>
                          )}
                          <p className={`text-sm truncate ${hasUnread ? 'text-carelink-navy font-medium' : 'text-carelink-gray'}`}>
                            {lastMessage || 'לחץ להתחיל שיחה'}
                          </p>
                        </div>
                      </div>

                      {/* Unread Badge */}
                      {hasUnread && (
                        <div className="flex-shrink-0">
                          <span className="bg-carelink-teal text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                            {room.unread_count > 9 ? '9+' : room.unread_count}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        )}

        {/* Quick Tips */}
        {rooms.length > 0 && (
          <div className="mt-6 bg-carelink-teal-pale/30 rounded-xl p-4">
            <p className="text-sm text-carelink-navy">
              <strong>טיפ:</strong> לחץ Enter כדי לשלוח הודעה, Shift+Enter למעבר שורה
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default ChatList;
