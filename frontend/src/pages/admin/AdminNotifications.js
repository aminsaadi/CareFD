import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import { FiBell, FiCheck, FiTrash2, FiAlertCircle, FiInfo, FiCheckCircle } from 'react-icons/fi';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/notifications');
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Demo data
      setNotifications([
        { id: 1, type: 'info', title: 'ספק חדש נרשם', message: 'ספק חדש ממתין לאישור', time: '5 דקות', read: false },
        { id: 2, type: 'success', title: 'הזמנה אושרה', message: 'הזמנה #1234 אושרה בהצלחה', time: '1 שעה', read: false },
        { id: 3, type: 'warning', title: 'תשלום ממתין', message: 'יש תשלום ממתין לאישור', time: '2 שעות', read: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <FiCheckCircle className="text-green-500" />;
      case 'warning': return <FiAlertCircle className="text-yellow-500" />;
      case 'error': return <FiAlertCircle className="text-red-500" />;
      default: return <FiInfo className="text-blue-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-carelink-navy">הודעות מערכת</h1>
            <p className="text-carelink-slate">{unreadCount} הודעות שלא נקראו</p>
          </div>
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

        {/* Notifications List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {loading ? (
            <div className="p-8 text-center text-carelink-gray">טוען...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <FiBell className="mx-auto text-4xl text-gray-300 mb-3" />
              <p className="text-carelink-gray">אין הודעות חדשות</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 flex items-start gap-4 hover:bg-gray-50 transition ${!notification.read ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="text-2xl mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium ${!notification.read ? 'text-carelink-navy' : 'text-carelink-slate'}`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-carelink-teal rounded-full"></span>
                      )}
                    </div>
                    <p className="text-carelink-gray text-sm">{notification.message}</p>
                    <span className="text-xs text-carelink-gray">{notification.time}</span>
                  </div>
                  <div className="flex gap-2">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-2 text-carelink-teal hover:bg-carelink-teal-pale rounded-lg transition"
                        title="סמן כנקרא"
                      >
                        <FiCheck />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="מחק"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminNotifications;
