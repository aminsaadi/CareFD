import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaBell, FaTimes, FaCheck, FaCalendarCheck, FaComments, 
  FaStar, FaBullhorn, FaCheckCircle, FaTrash, FaExchangeAlt
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

const notificationIcons = {
  booking_new: FaCalendarCheck,
  booking_confirmed: FaCheckCircle,
  booking_cancelled: FaTimes,
  booking_completed: FaCheck,
  booking_provider_completed: FaCheckCircle,
  booking_change_requested: FaExchangeAlt,
  message_new: FaComments,
  chat_message: FaComments,
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
  booking_provider_completed: 'bg-purple-100 text-purple-600',
  booking_change_requested: 'bg-amber-100 text-amber-600',
  message_new: 'bg-purple-100 text-purple-600',
  chat_message: 'bg-purple-100 text-purple-600',
  offer_new: 'bg-amber-100 text-amber-600',
  offer_accepted: 'bg-green-100 text-green-600',
  review_new: 'bg-yellow-100 text-yellow-600',
  system: 'bg-carefd-teal-pale text-carefd-teal'
};

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [deletedIds, setDeletedIds] = useState(new Set());

  const deleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    e.preventDefault();
    setDeletedIds(prev => new Set(prev).add(notificationId));
    try {
      const api = (await import('../utils/api')).default;
      await api.delete(`/notifications/${notificationId}`);
    } catch {
      setDeletedIds(prev => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
    }
  };

  const getNotificationLink = (notification) => {
    const data = notification.data || {};
    const isProvider = user?.role === 'provider';
    const isAdmin = user?.role === 'admin';
    
    switch (notification.type) {
      case 'booking_new':
      case 'booking_confirmed':
      case 'booking_cancelled':
      case 'booking_completed':
      case 'booking_provider_completed':
      case 'booking_change_requested':
        if (isAdmin) return '/admin/bookings';
        return isProvider ? '/provider/dashboard?tab=bookings' : '/dashboard?tab=bookings';
      
      case 'message_new':
      case 'chat_message':
        return data.room_id ? `/chat/${data.room_id}` : '/chats';
      
      case 'offer_new':
      case 'offer_accepted':
        return data.request_id ? `/requests/${data.request_id}` : '/requests';
      
      case 'review_new':
        if (isAdmin) return '/admin/reviews';
        return isProvider ? '/provider/dashboard?tab=reviews' : '/dashboard?tab=reviews';
      
      case 'provider_verified':
      case 'provider_rejected':
      case 'provider_documents_submitted':
      case 'provider_new_registration':
        if (isAdmin) return '/admin/providers';
        return isProvider ? '/provider/dashboard?tab=settings' : '/dashboard?tab=settings';
      
      case 'system':
        if (data.booking_id) {
          return isProvider ? '/provider/dashboard?tab=bookings' : '/dashboard?tab=bookings';
        }
        if (data.review_id) {
          if (isAdmin) return '/admin/reviews';
          return isProvider ? '/provider/dashboard?tab=reviews' : '/dashboard?tab=reviews';
        }
        return isAdmin ? '/admin/overview' : '/dashboard';
      
      default:
        return isAdmin ? '/admin/overview' : '/dashboard';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-carefd-teal-pale/30 text-carefd-slate hover:text-carefd-teal transition-colors"
        aria-label={`התראות${unreadCount > 0 ? ` (${unreadCount} חדשות)` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
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
        <div className="fixed md:absolute top-16 md:top-full md:mt-2 right-0 left-0 md:left-auto md:right-0 mx-2 md:mx-0 w-auto md:w-96 bg-white rounded-2xl shadow-xl border border-carefd-teal-pale overflow-hidden z-50 max-h-[80vh] md:max-h-none">
          {/* Header */}
          <div className="bg-carefd-navy text-white p-4 flex items-center justify-between">
            <h3 className="font-bold">התראות</h3>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-carefd-teal-pale hover:text-white flex items-center gap-1"
                >
                  <FaCheck />
                  <span className="hidden sm:inline">סמן הכל כנקרא</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="md:hidden text-white hover:text-carefd-teal-pale"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[60vh] md:max-h-96 overflow-y-auto">
            {notifications.filter(n => !deletedIds.has(n.notification_id)).length === 0 ? (
              <div className="p-8 text-center text-carefd-gray">
                <FaBell className="text-4xl mx-auto mb-2 text-carefd-teal-pale" />
                <p>אין התראות חדשות</p>
              </div>
            ) : (
              notifications.filter(n => !deletedIds.has(n.notification_id)).map((notification) => {
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
                    className={`block p-3 md:p-4 border-b border-carefd-teal-pale/50 hover:bg-carefd-teal-pale/10 transition ${
                      !notification.is_read ? 'bg-carefd-teal-pale/20' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <Icon />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm ${!notification.is_read ? 'font-bold' : ''} text-carefd-navy truncate`}>
                            {notification.title}
                          </p>
                          <button
                            onClick={(e) => deleteNotification(notification.notification_id, e)}
                            className="text-carefd-gray hover:text-red-500 p-1 flex-shrink-0"
                            aria-label="מחק התראה"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        </div>
                        <p className="text-sm text-carefd-gray line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-carefd-gray mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: he })}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-carefd-teal rounded-full flex-shrink-0 mt-2"></div>
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
            className="block p-3 text-center text-carefd-teal font-medium hover:bg-carefd-teal-pale/20 transition"
          >
            צפה בכל ההתראות
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
