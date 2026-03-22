import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import api from '../utils/api';
import { toast } from 'sonner';

const NotificationContext = createContext();

const POLL_INTERVAL = 10000; // 10 seconds

const notificationTypeLabels = {
  booking_new: 'הזמנה חדשה',
  booking_confirmed: 'הזמנה אושרה',
  booking_cancelled: 'הזמנה בוטלה',
  booking_completed: 'הזמנה הושלמה',
  booking_provider_completed: 'שירות הושלם',
  booking_change_requested: 'בקשת שינוי מועד',
  message_new: 'הודעה חדשה',
  chat_message: 'הודעה חדשה',
  offer_new: 'הצעה חדשה',
  offer_accepted: 'הצעה התקבלה',
  review_new: 'ביקורת חדשה',
  system: 'עדכון מערכת'
};

const notificationTypeStyles = {
  booking_new: { bg: 'bg-blue-500', emoji: '📋' },
  booking_confirmed: { bg: 'bg-green-500', emoji: '✅' },
  booking_cancelled: { bg: 'bg-red-500', emoji: '❌' },
  booking_completed: { bg: 'bg-green-500', emoji: '🎉' },
  booking_provider_completed: { bg: 'bg-purple-500', emoji: '✔️' },
  booking_change_requested: { bg: 'bg-amber-500', emoji: '🔄' },
  message_new: { bg: 'bg-purple-500', emoji: '💬' },
  chat_message: { bg: 'bg-purple-500', emoji: '💬' },
  offer_new: { bg: 'bg-amber-500', emoji: '📢' },
  offer_accepted: { bg: 'bg-green-500', emoji: '🤝' },
  review_new: { bg: 'bg-yellow-500', emoji: '⭐' },
  system: { bg: 'bg-teal-500', emoji: '🔔' }
};

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const seenIdsRef = useRef(new Set());
  const isFirstFetchRef = useRef(true);
  const intervalRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await api.get('/notifications?limit=20');
      const fetched = response.data.notifications || [];
      const newUnread = response.data.unread_count || 0;

      setNotifications(fetched);
      setUnreadCount(newUnread);

      // On first fetch, just populate the seen set (don't show toasts)
      if (isFirstFetchRef.current) {
        fetched.forEach(n => seenIdsRef.current.add(n.notification_id));
        isFirstFetchRef.current = false;
        return;
      }

      // Detect truly new notifications
      const newOnes = fetched.filter(n => !n.is_read && !seenIdsRef.current.has(n.notification_id));

      newOnes.forEach(n => {
        seenIdsRef.current.add(n.notification_id);
        const style = notificationTypeStyles[n.type] || notificationTypeStyles.system;
        const label = notificationTypeLabels[n.type] || 'התראה';

        toast(n.title || label, {
          description: n.message,
          duration: 6000,
          icon: style.emoji,
          action: n.data?.booking_id ? {
            label: 'צפה',
            onClick: () => {
              navigate('/dashboard');
            }
          } : undefined
        });
      });

      // Update seen set
      fetched.forEach(n => seenIdsRef.current.add(n.notification_id));
    } catch {
      // Silently fail - don't spam errors for background polling
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      // Reset on login
      seenIdsRef.current = new Set();
      isFirstFetchRef.current = true;
      fetchNotifications();

      intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else {
      // Reset on logout
      setNotifications([]);
      setUnreadCount(0);
      seenIdsRef.current = new Set();
      isFirstFetchRef.current = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [isAuthenticated, fetchNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n => n.notification_id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const refresh = () => fetchNotifications();

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      refresh
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
