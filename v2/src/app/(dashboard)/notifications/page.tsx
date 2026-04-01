"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api-client';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { 
  FaBell, FaCheck, FaTrash, FaCalendarCheck, FaComments, 
  FaStar, FaBullhorn, FaCheckCircle, FaTimes, FaFilter,
  FaEnvelope, FaEnvelopeOpen, FaExchangeAlt, FaShieldAlt
} from 'react-icons/fa';

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

const Notifications = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all'); // all, bookings, messages, reviews

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.get('/notifications?limit=100');
      setNotifications(data.notifications || []);
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n.notification_id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error: any) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error: any) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
    } catch (error: any) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationLink = (notification) => {
    const data = notification.data || {};
    const isProvider = user?.role?.toLowerCase() === 'provider';
    const isAdmin = user?.role?.toLowerCase() === 'admin';
    
    switch (notification.type) {
      // Bookings - navigate to bookings tab in dashboard
      case 'booking_new':
      case 'booking_confirmed':
      case 'booking_cancelled':
      case 'booking_completed':
      case 'booking_provider_completed':
      case 'booking_change_requested':
        if (isAdmin) return '/admin/bookings';
        return isProvider ? '/provider/dashboard?tab=bookings' : '/dashboard?tab=bookings';
      
      // Chat messages
      case 'message_new':
      case 'chat_message':
        return data.room_id ? `/chat/${data.room_id}` : '/chats';
      
      // Requests & Offers
      case 'offer_new':
      case 'offer_accepted':
        return data.request_id ? `/requests/${data.request_id}` : '/requests';
      
      // Reviews
      case 'review_new':
        if (isAdmin) return '/admin/reviews';
        return isProvider ? '/provider/dashboard?tab=reviews' : '/dashboard?tab=reviews';
      
      // Verification / Account
      case 'provider_verified':
      case 'provider_rejected':
      case 'provider_documents_submitted':
      case 'provider_new_registration':
        if (isAdmin) return '/admin/providers';
        return isProvider ? '/provider/dashboard?tab=settings' : '/dashboard?tab=settings';
      
      // System notifications
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

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.notification_id);
    }
    router.push(getNotificationLink(notification));
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    // Read/Unread filter
    if (filter === 'unread' && n.is_read) return false;
    if (filter === 'read' && !n.is_read) return false;
    
    // Type filter
    if (typeFilter === 'bookings' && !n.type.startsWith('booking')) return false;
    if (typeFilter === 'messages' && !['message_new', 'chat_message'].includes(n.type)) return false;
    if (typeFilter === 'reviews' && !['review_new', 'system'].includes(n.type)) {
      // For system type, check if it's review-related
      if (n.type === 'system' && n.data?.review_id) return true;
      return false;
    }
    if (typeFilter === 'verification' && !['provider_verified', 'provider_rejected', 'provider_documents_submitted', 'provider_new_registration'].includes(n.type)) return false;
    
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-carefd-navy flex items-center gap-3">
              <FaBell className="text-carefd-teal" />
              התראות
            </h1>
            <p className="text-carefd-gray mt-1">
              {unreadCount > 0 ? `${unreadCount} התראות שלא נקראו` : 'כל ההתראות נקראו'}
            </p>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-carefd-teal text-white rounded-lg hover:bg-carefd-teal-medium transition flex items-center gap-2"
              data-testid="mark-all-read-btn"
            >
              <FaCheck />
              סמן הכל כנקרא
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <FaFilter className="text-carefd-gray" />
              <span className="text-sm text-carefd-gray">סינון:</span>
            </div>
            
            {/* Read/Unread Filter */}
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'הכל' },
                { value: 'unread', label: 'לא נקראו', icon: FaEnvelope },
                { value: 'read', label: 'נקראו', icon: FaEnvelopeOpen },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    filter === option.value
                      ? 'bg-carefd-teal text-white'
                      : 'bg-gray-100 text-carefd-slate hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            <div className="h-6 w-px bg-gray-200"></div>
            
            {/* Type Filter */}
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'כל הסוגים' },
                { value: 'bookings', label: 'הזמנות', icon: FaCalendarCheck },
                { value: 'messages', label: 'הודעות', icon: FaComments },
                { value: 'reviews', label: 'ביקורות', icon: FaStar },
                { value: 'verification', label: 'אימות', icon: FaShieldAlt },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setTypeFilter(option.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                    typeFilter === option.value
                      ? 'bg-carefd-navy text-white'
                      : 'bg-gray-100 text-carefd-slate hover:bg-gray-200'
                  }`}
                >
                  {option.icon && <option.icon className="text-xs" />}
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-carefd-teal border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-carefd-gray">טוען התראות...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <FaBell className="mx-auto text-5xl text-gray-200 mb-4" />
              <p className="text-carefd-gray text-lg">אין התראות</p>
              <p className="text-carefd-gray text-sm mt-1">
                {filter !== 'all' || typeFilter !== 'all' 
                  ? 'נסה לשנות את הסינון' 
                  : 'כשתקבל התראות חדשות, הן יופיעו כאן'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => {
                const Icon = notificationIcons[notification.type] || FaBell;
                const colorClass = notificationColors[notification.type] || notificationColors.system;
                
                return (
                  <div
                    key={notification.notification_id}
                    className={`p-4 hover:bg-gray-50 transition cursor-pointer ${
                      !notification.is_read ? 'bg-carefd-teal-pale/20' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                    data-testid={`notification-${notification.notification_id}`}
                  >
                    <div className="flex gap-4">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <Icon className="text-xl" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className={`font-medium ${!notification.is_read ? 'text-carefd-navy font-bold' : 'text-carefd-slate'}`}>
                              {notification.title}
                            </h3>
                            <p className="text-carefd-gray text-sm mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-carefd-gray mt-2">
                              {notification.created_at ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: he }) : ''}
                            </p>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!notification.is_read && (
                              <span className="w-3 h-3 bg-carefd-teal rounded-full"></span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.notification_id);
                              }}
                              className="p-2 text-carefd-gray hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                              title="מחק"
                            >
                              <FaTrash className="text-sm" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      
    </div>
  );
};

export default Notifications;
