import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaBell, FaTimes, FaCheck, FaCalendarCheck, FaComments, 
  FaStar, FaBullhorn, FaCheckCircle, FaTrash
} from 'react-icons/fa';
import api from '../utils/api';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

const notificationIcons = {
  booking_new: FaCalendarCheck,
  booking_confirmed: FaCheckCircle,
  booking_cancelled: FaTimes,
  booking_completed: FaCheck,
  message_new: FaComments,
  offer_new: FaBullhorn,
  offer_accepted: FaCheckCircle,
  review_new: FaStar,
  system: FaBell
};

const notificationColors = {
  booking_new: 'bg-blue-100 text-blue-600',
  booking_confirmed: 'bg-green-100 text-green-600',
  booking_cancelled: 'bg-red-100 text-red-600',
  booking_completed: 'bg-green-100 text-green-600',
  message_new: 'bg-purple-100 text-purple-600',
  offer_new: 'bg-amber-100 text-amber-600',
  offer_accepted: 'bg-green-100 text-green-600',
  review_new: 'bg-yellow-100 text-yellow-600',
  system: 'bg-carelink-teal-pale text-carelink-teal'
};

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications?limit=20');
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unread_count || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n.notification_id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
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
        return data.booking_id ? `/bookings/${data.booking_id}` : '/bookings';
      case 'message_new':
        return data.room_id ? `/chat/${data.room_id}` : '/chats';
      case 'offer_new':
      case 'offer_accepted':
        return data.request_id ? `/requests/${data.request_id}` : '/requests';
      case 'review_new':
        return data.provider_id ? `/providers/${data.provider_id}` : '/dashboard';
      default:
        return '/dashboard';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-carelink-teal-pale/30 text-carelink-slate hover:text-carelink-teal transition-colors"
        data-testid="notification-bell"
      >
        <FaBell className="text-xl" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 rtl:left-auto rtl:right-0 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-carelink-teal-pale overflow-hidden z-50">
          {/* Header */}
          <div className="bg-carelink-navy text-white p-4 flex items-center justify-between">
            <h3 className="font-bold">התראות</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-carelink-teal-pale hover:text-white flex items-center gap-1"
              >
                <FaCheck />
                סמן הכל כנקרא
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-carelink-gray">
                <FaBell className="text-4xl mx-auto mb-2 text-carelink-teal-pale" />
                <p>אין התראות חדשות</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = notificationIcons[notification.type] || FaBell;
                const colorClass = notificationColors[notification.type] || notificationColors.system;
                
                return (
                  <Link
                    key={notification.notification_id}
                    to={getNotificationLink(notification)}
                    onClick={() => {
                      if (!notification.is_read) markAsRead(notification.notification_id);
                      setIsOpen(false);
                    }}
                    className={`block p-4 border-b border-carelink-teal-pale/50 hover:bg-carelink-teal-pale/10 transition ${
                      !notification.is_read ? 'bg-carelink-teal-pale/20' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <Icon />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm ${!notification.is_read ? 'font-bold' : ''} text-carelink-navy`}>
                            {notification.title}
                          </p>
                          <button
                            onClick={(e) => deleteNotification(notification.notification_id, e)}
                            className="text-carelink-gray hover:text-red-500 p-1"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        </div>
                        <p className="text-sm text-carelink-gray line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-carelink-gray mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: he })}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-carelink-teal rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* Footer */}
          <Link
            to="/notifications"
            onClick={() => setIsOpen(false)}
            className="block p-3 text-center text-carelink-teal font-medium hover:bg-carelink-teal-pale/20 transition"
          >
            צפה בכל ההתראות
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
