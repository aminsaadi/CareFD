import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { format } from 'date-fns';
import { FaComments, FaCircle } from 'react-icons/fa';

const ChatList = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/chat/rooms');
      setRooms(response.data.rooms || []);
    } catch (error) {
      console.error('Failed to fetch chat rooms:', error);
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-3xl font-bold mb-6 text-carelink-navy font-heading flex items-center gap-3" data-testid="chats-title">
          <FaComments className="text-carelink-teal" />
          השיחות שלי
        </h1>

        {rooms.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border-2 border-carelink-teal-pale">
            <FaComments className="text-6xl text-carelink-gray mx-auto mb-4" />
            <p className="text-carelink-gray text-lg">עדיין אין שיחות</p>
            <p className="text-carelink-gray mt-2">שיחות ייפתחו לאחר קבלת הצעה או הזמנה</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <Link
                key={room.room_id}
                to={`/chat/${room.room_id}`}
                className="block bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition border-2 border-carelink-teal-pale hover:border-carelink-teal"
                data-testid={`chat-room-${room.room_id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-carelink-teal rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {room.other_user?.name?.[0] || room.other_user?.business_name?.[0] || '?'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-carelink-navy">
                        {room.other_user?.name || room.other_user?.business_name || 'משתמש'}
                      </h3>
                      {room.last_message && (
                        <p className="text-sm text-carelink-gray truncate">
                          {room.last_message.content}
                        </p>
                      )}
                    </div>
                  </div>
                  {room.last_message_at && (
                    <div className="text-xs text-carelink-gray">
                      {format(new Date(room.last_message_at), 'dd/MM HH:mm')}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;