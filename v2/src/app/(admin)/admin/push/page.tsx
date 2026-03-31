"use client";

import {  useState, useEffect  } from "react";
import api from "@/lib/api-client";
import {
  FiBell, FiSend, FiUsers, FiBriefcase, FiUser,
  FiClock, FiCheckCircle, FiAlertCircle, FiTarget
} from 'react-icons/fi';

export default function AdminPushNotifications() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await api.get('/admin/push/history');
      setHistory(data.history || []);
    } catch (error) {
      console.error('Failed to fetch push history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async (formData) => {
    try {
      setSending(true);
      await api.post('/admin/push/send', formData);
      setShowSendModal(false);
      fetchHistory();
      alert('ההתראה נשלחה בהצלחה!');
    } catch (error) {
      console.error('Failed to send notification:', error);
      alert('שגיאה בשליחת ההתראה');
    } finally {
      setSending(false);
    }
  };

  const getTargetLabel = (target) => {
    switch (target) {
      case 'all': return 'כל המשתמשים';
      case 'providers': return 'ספקים בלבד';
      case 'users': return 'משתמשים בלבד';
      case 'specific': return 'משתמשים נבחרים';
      default: return target;
    }
  };

  const getTargetIcon = (target) => {
    switch (target) {
      case 'all': return <FiUsers className="text-carefd-teal" />;
      case 'providers': return <FiBriefcase className="text-purple-500" />;
      case 'users': return <FiUser className="text-blue-500" />;
      default: return <FiTarget className="text-gray-500" />;
    }
  };

  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-carefd-navy">התראות Push</h1>
            <p className="text-carefd-slate mt-1">שליחת התראות למשתמשים</p>
          </div>
          <button
            onClick={() => setShowSendModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-carefd-teal text-white rounded-lg hover:bg-carefd-teal/90 transition shadow-md"
          >
            <FiSend size={18} />
            שלח התראה חדשה
          </button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-carefd-teal to-carefd-navy text-white rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <FiBell size={20} />
              </div>
              <span className="font-medium">התראות Push</span>
            </div>
            <p className="text-sm opacity-90">
              שלח התראות בזמן אמת לכל המשתמשים או לקבוצות ספציפיות
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiBriefcase className="text-purple-500" size={20} />
              </div>
              <span className="font-medium text-carefd-navy">לספקים</span>
            </div>
            <p className="text-sm text-carefd-slate">
              עדכונים על הזמנות חדשות, אישורים, ופעילות בפרופיל
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiUser className="text-blue-500" size={20} />
              </div>
              <span className="font-medium text-carefd-navy">למשתמשים</span>
            </div>
            <p className="text-sm text-carefd-slate">
              אישורי הזמנות, הודעות חדשות, ועדכוני מערכת
            </p>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-semibold text-carefd-navy">היסטוריית התראות</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/30">
                  <th className="text-right py-4 px-4 text-carefd-slate font-medium text-sm">כותרת</th>
                  <th className="text-right py-4 px-4 text-carefd-slate font-medium text-sm">תוכן</th>
                  <th className="text-right py-4 px-4 text-carefd-slate font-medium text-sm">יעד</th>
                  <th className="text-right py-4 px-4 text-carefd-slate font-medium text-sm">נמענים</th>
                  <th className="text-right py-4 px-4 text-carefd-slate font-medium text-sm">תאריך</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <div className="w-8 h-8 border-4 border-carefd-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <FiBell size={48} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-carefd-gray">עדיין לא נשלחו התראות</p>
                      <button
                        onClick={() => setShowSendModal(true)}
                        className="mt-4 text-carefd-teal hover:underline"
                      >
                        שלח התראה ראשונה
                      </button>
                    </td>
                  </tr>
                ) : (
                  history.map((notification) => (
                    <tr key={notification.notification_id} className="border-b border-gray-50 hover:bg-carefd-teal-pale/10 transition">
                      <td className="py-4 px-4">
                        <span className="font-medium text-carefd-navy">{notification.title}</span>
                      </td>
                      <td className="py-4 px-4 text-carefd-slate text-sm max-w-xs truncate">
                        {notification.body}
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-2 text-sm">
                          {getTargetIcon(notification.target)}
                          {getTargetLabel(notification.target)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 text-carefd-teal font-medium">
                          <FiCheckCircle size={14} />
                          {notification.recipients_count}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-carefd-slate text-sm">
                        {new Date(notification.sent_at).toLocaleString('he-IL')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Send Notification Modal */}
      {showSendModal && (
        <SendNotificationModal
          onClose={() => setShowSendModal(false)}
          onSend={handleSendNotification}
          sending={sending}
        />
      )}
    
  );
};

// Send Notification Modal
const SendNotificationModal = ({ onClose, onSend, sending }) => {
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    target: 'all'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.body) {
      alert('נא למלא כותרת ותוכן');
      return;
    }
    onSend(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 border border-gray-200 shadow-xl">
        <h3 className="text-lg font-bold text-carefd-navy mb-4 flex items-center gap-2">
          <FiBell className="text-carefd-teal" />
          שליחת התראה חדשה
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-carefd-navy mb-1">כותרת *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="כותרת ההתראה"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-carefd-teal outline-none"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-carefd-navy mb-1">תוכן *</label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder="תוכן ההתראה..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-carefd-teal outline-none resize-none"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-carefd-navy mb-2">שלח אל</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, target: 'all' })}
                className={`flex items-center gap-2 p-3 rounded-lg border transition ${
                  formData.target === 'all' 
                    ? 'border-carefd-teal bg-carefd-teal-pale text-carefd-teal' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FiUsers size={18} />
                <span className="text-sm font-medium">כל המשתמשים</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, target: 'providers' })}
                className={`flex items-center gap-2 p-3 rounded-lg border transition ${
                  formData.target === 'providers' 
                    ? 'border-purple-500 bg-purple-50 text-purple-600' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FiBriefcase size={18} />
                <span className="text-sm font-medium">ספקים בלבד</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, target: 'users' })}
                className={`flex items-center gap-2 p-3 rounded-lg border transition ${
                  formData.target === 'users' 
                    ? 'border-blue-500 bg-blue-50 text-blue-600' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FiUser size={18} />
                <span className="text-sm font-medium">משתמשים בלבד</span>
              </button>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
            <FiAlertCircle className="inline me-1" size={14} />
            ההתראה תישלח גם כהודעה במערכת לכל המשתמשים הנבחרים
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-carefd-navy rounded-lg hover:bg-gray-200 transition"
              disabled={sending}
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex-1 px-4 py-2.5 bg-carefd-teal text-white rounded-lg hover:bg-carefd-teal/90 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FiSend size={16} />
                  שלח התראה
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


