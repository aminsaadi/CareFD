import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { 
  FiBell, FiCheck, FiTrash2, FiAlertCircle, FiInfo, FiCheckCircle,
  FiMessageSquare, FiCalendar, FiStar, FiFilter
} from 'react-icons/fi';

const notificationIcons = {
  booking_new: FiCalendar,
  booking_confirmed: FiCheckCircle,
  booking_cancelled: FiAlertCircle,
  booking_completed: FiCheck,
  message_new: FiMessageSquare,
  chat_message: FiMessageSquare,
  offer_new: FiBell,
  offer_accepted: FiCheckCircle,
  review_new: FiStar,
  provider_registered: FiInfo,
  system: FiBell
};

const notificationColors = {
  booking_new: 'text-blue-500 bg-blue-50',
  booking_confirmed: 'text-green-500 bg-green-50',
  booking_cancelled: 'text-red-500 bg-red-50',
  booking_completed: 'text-green-500 bg-green-50',
  message_new: 'text-purple-500 bg-purple-50',
  chat_message: 'text-purple-500 bg-purple-50',
  offer_new: 'text-amber-500 bg-amber-50',
  offer_accepted: 'text-green-500 bg-green-50',
  review_new: 'text-yellow-500 bg-yellow-50',
  provider_registered: 'text-blue-500 bg-blue-50',
  system: 'text-carelink-teal bg-carelink-teal-pale'
};

const AdminNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications?limit=100');
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => 
        n.notification_id === id ? { ...n, is_read: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.notification_id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationLink = (notification) => {
    const data = notification.data || {};
    switch (notification.type) {
      case 'booking_new':
      case 'booking_confirmed':
      case 'booking_cancelled':
      case 'booking_completed':
      case 'booking_provider_completed':
      case 'booking_change_requested':
        return '/admin/bookings';
      case 'message_new':
      case 'chat_message':
        return data.room_id ? `/chat/${data.room_id}` : '/admin/messages';
      case 'provider_new_registration':
      case 'provider_documents_submitted':
      case 'provider_verified':
      case 'provider_rejected':
        return '/admin/providers';
      case 'review_new':
        return '/admin/reviews';
      case 'system':
        if (data.booking_id) return '/admin/bookings';
        if (data.review_id) return '/admin/reviews';
        return '/admin/overview';
      default:
        return '/admin/overview';
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.notification_id);
    }
    navigate(getNotificationLink(notification));
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'read') return n.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-carelink-navy">התראות מערכת</h1>
            <p className="text-carelink-slate">
              {unreadCount > 0 ? `${unreadCount} התראות שלא נקראו` : 'כל ההתראות נקראו'}
            </p>
          </div>
          <div className="flex gap-3">
            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:border-carelink-teal outline-none"
            >
              <option value="all">הכל</option>
              <option value="unread">לא נקראו</option>
              <option value="read">נקראו</option>
            </select>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-carelink-teal text-white rounded-lg hover:bg-carelink-teal-medium transition flex items-center gap-2"
              >
                <FiCheck />
                סמן הכל כנקרא
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {loading ? (
            <div className="p-8 text-center text-carelink-gray">
              <div className="animate-spin w-8 h-8 border-4 border-carelink-teal border-t-transparent rounded-full mx-auto mb-4"></div>
              טוען...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <FiBell className="mx-auto text-4xl text-gray-300 mb-3" />
              <p className="text-carelink-gray">אין התראות</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => {
                const Icon = notificationIcons[notification.type] || FiBell;
                const colorClass = notificationColors[notification.type] || notificationColors.system;
                
                return (
                  <div
                    key={notification.notification_id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 flex items-start gap-4 hover:bg-gray-50 transition cursor-pointer ${
                      !notification.is_read ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${colorClass}`}>
                      <Icon />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-medium ${!notification.is_read ? 'text-carelink-navy font-bold' : 'text-carelink-slate'}`}>
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-carelink-teal rounded-full"></span>
                        )}
                      </div>
                      <p className="text-carelink-gray text-sm">{notification.message}</p>
                      <span className="text-xs text-carelink-gray">
                        {notification.created_at && formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: he })}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.notification_id);
                          }}
                          className="p-2 text-carelink-teal hover:bg-carelink-teal-pale rounded-lg transition"
                          title="סמן כנקרא"
                        >
                          <FiCheck />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.notification_id);
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="מחק"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminNotifications;
