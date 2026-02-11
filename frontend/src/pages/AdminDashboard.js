import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import { 
  FaUsers, FaUserMd, FaCalendarAlt, FaChartBar, FaFileAlt,
  FaStar, FaComments, FaCog, FaBell, FaCheckCircle, FaTimes,
  FaEye, FaTrash, FaEdit, FaSearch, FaDownload, FaAward,
  FaChartLine, FaMoneyBillWave, FaExclamationTriangle, FaHourglass,
  FaFileContract, FaTimesCircle
} from 'react-icons/fa';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [providers, setProviders] = useState([]);
  const [pendingProviders, setPendingProviders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastRole, setBroadcastRole] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, [activeTab, searchQuery, selectedRole]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes.data);

      // Fetch users
      if (activeTab === 'users') {
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (selectedRole) params.append('role', selectedRole);
        const usersRes = await api.get(`/admin/users?${params.toString()}`);
        setUsers(usersRes.data.users || []);
      }

      // Fetch providers
      if (activeTab === 'providers') {
        const providersRes = await api.get('/providers?limit=100');
        setProviders(providersRes.data.providers || []);
      }

      // Fetch bookings
      if (activeTab === 'bookings') {
        const bookingsRes = await api.get('/admin/bookings');
        setBookings(bookingsRes.data.bookings || []);
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      fetchAdminData();
    } catch (error) {
      console.error('Failed to update user role:', error);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק משתמש זה?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      fetchAdminData();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const verifyProvider = async (providerId) => {
    try {
      await api.put(`/admin/providers/${providerId}/verify`);
      fetchAdminData();
    } catch (error) {
      console.error('Failed to verify provider:', error);
    }
  };

  const recommendProvider = async (providerId) => {
    try {
      await api.put(`/admin/providers/${providerId}/recommend`);
      fetchAdminData();
    } catch (error) {
      console.error('Failed to recommend provider:', error);
    }
  };

  const sendBroadcast = async () => {
    if (!broadcastTitle || !broadcastMessage) {
      alert('נא למלא כותרת והודעה');
      return;
    }
    try {
      await api.post('/admin/notifications/broadcast', {
        title: broadcastTitle,
        message: broadcastMessage,
        role: broadcastRole || undefined
      });
      alert('ההודעה נשלחה בהצלחה!');
      setBroadcastTitle('');
      setBroadcastMessage('');
      setBroadcastRole('');
    } catch (error) {
      console.error('Failed to send broadcast:', error);
      alert('שגיאה בשליחת ההודעה');
    }
  };

  const exportData = (type) => {
    // In real implementation, this would call an API endpoint to generate CSV/PDF
    alert(`ייצוא ${type} - בקרוב!`);
  };

  const tabs = [
    { id: 'overview', label: 'סקירה כללית', icon: FaChartBar },
    { id: 'users', label: 'משתמשים', icon: FaUsers },
    { id: 'providers', label: 'ספקים', icon: FaUserMd },
    { id: 'bookings', label: 'תורים', icon: FaCalendarAlt },
    { id: 'reports', label: 'דוחות', icon: FaFileAlt },
    { id: 'notifications', label: 'התראות', icon: FaBell },
    { id: 'settings', label: 'הגדרות', icon: FaCog }
  ];

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-600';
      case 'provider': return 'bg-blue-100 text-blue-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-carelink-teal-pale/30 flex flex-col">
      <Navbar />
      
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-carelink-navy font-heading mb-2">
              פאנל ניהול 🛠️
            </h1>
            <p className="text-carelink-gray">ניהול מלא של הפלטפורמה</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden sticky top-24">
                <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-4 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <FaUserMd />
                    </div>
                    <div>
                      <p className="font-bold">מנהל</p>
                      <p className="text-sm text-purple-200">{user?.email}</p>
                    </div>
                  </div>
                </div>
                <nav className="p-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition ${
                        activeTab === tab.id
                          ? 'bg-purple-600 text-white'
                          : 'text-carelink-gray hover:bg-purple-50'
                      }`}
                    >
                      <tab.icon />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {loading && activeTab === 'overview' ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <>
                  {/* Overview Tab */}
                  {activeTab === 'overview' && stats && (
                    <div className="space-y-6">
                      {/* Main Stats */}
                      <div className="grid md:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                              <FaUsers className="text-blue-600 text-xl" />
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-carelink-navy">{stats.total_users}</div>
                              <div className="text-sm text-carelink-gray">משתמשים</div>
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-green-600 flex items-center gap-1">
                            <FaChartLine />
                            +{stats.new_users_week} השבוע
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                              <FaUserMd className="text-purple-600 text-xl" />
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-carelink-navy">{stats.total_providers}</div>
                              <div className="text-sm text-carelink-gray">ספקים</div>
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-carelink-teal">
                            {stats.verified_providers} מאומתים
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                              <FaCalendarAlt className="text-green-600 text-xl" />
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-carelink-navy">{stats.total_bookings}</div>
                              <div className="text-sm text-carelink-gray">תורים</div>
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-yellow-600">
                            {stats.pending_bookings} ממתינים
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                              <FaStar className="text-yellow-600 text-xl" />
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-carelink-navy">{stats.total_reviews}</div>
                              <div className="text-sm text-carelink-gray">ביקורות</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Secondary Stats */}
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                          <h3 className="font-bold text-carelink-navy mb-4">שירותים</h3>
                          <div className="text-3xl font-bold text-carelink-teal">{stats.total_services}</div>
                          <p className="text-sm text-carelink-gray">שירותים פעילים</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                          <h3 className="font-bold text-carelink-navy mb-4">בקשות</h3>
                          <div className="text-3xl font-bold text-carelink-teal">{stats.total_requests}</div>
                          <p className="text-sm text-carelink-gray">{stats.open_requests} פתוחות</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                          <h3 className="font-bold text-carelink-navy mb-4">הודעות</h3>
                          <div className="text-3xl font-bold text-carelink-teal">{stats.total_messages}</div>
                          <p className="text-sm text-carelink-gray">בצ'אט הפנימי</p>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="font-bold text-carelink-navy mb-4">פעולות מהירות</h3>
                        <div className="grid md:grid-cols-4 gap-4">
                          <button
                            onClick={() => setActiveTab('providers')}
                            className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition"
                          >
                            <FaCheckCircle className="text-purple-600" />
                            <span className="font-medium text-carelink-navy">אמת ספקים</span>
                          </button>
                          <button
                            onClick={() => setActiveTab('notifications')}
                            className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition"
                          >
                            <FaBell className="text-blue-600" />
                            <span className="font-medium text-carelink-navy">שלח הודעה</span>
                          </button>
                          <button
                            onClick={() => setActiveTab('reports')}
                            className="flex items-center gap-3 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition"
                          >
                            <FaDownload className="text-green-600" />
                            <span className="font-medium text-carelink-navy">ייצא דוח</span>
                          </button>
                          <button
                            onClick={() => setActiveTab('users')}
                            className="flex items-center gap-3 p-4 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition"
                          >
                            <FaUsers className="text-yellow-600" />
                            <span className="font-medium text-carelink-navy">נהל משתמשים</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Users Tab */}
                  {activeTab === 'users' && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <h3 className="text-xl font-bold text-carelink-navy">ניהול משתמשים</h3>
                        <div className="flex gap-3">
                          <div className="relative">
                            <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-carelink-gray" />
                            <input
                              type="text"
                              placeholder="חפש משתמש..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-4 pr-10 py-2 border-2 border-carelink-teal-pale rounded-xl focus:border-purple-500 focus:outline-none"
                            />
                          </div>
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="px-4 py-2 border-2 border-carelink-teal-pale rounded-xl focus:border-purple-500 focus:outline-none"
                          >
                            <option value="">כל התפקידים</option>
                            <option value="patient">משתמש</option>
                            <option value="provider">ספק</option>
                            <option value="admin">מנהל</option>
                          </select>
                        </div>
                      </div>
                      
                      {loading ? (
                        <div className="text-center py-8">
                          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-carelink-teal-pale">
                                <th className="text-right py-3 px-4 font-semibold text-carelink-navy">שם</th>
                                <th className="text-right py-3 px-4 font-semibold text-carelink-navy">אימייל</th>
                                <th className="text-right py-3 px-4 font-semibold text-carelink-navy">תפקיד</th>
                                <th className="text-right py-3 px-4 font-semibold text-carelink-navy">תאריך הצטרפות</th>
                                <th className="text-right py-3 px-4 font-semibold text-carelink-navy">פעולות</th>
                              </tr>
                            </thead>
                            <tbody>
                              {users.map((u) => (
                                <tr key={u.user_id} className="border-b border-carelink-teal-pale/50 hover:bg-gray-50">
                                  <td className="py-4 px-4">{u.name}</td>
                                  <td className="py-4 px-4">{u.email}</td>
                                  <td className="py-4 px-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge(u.role)}`}>
                                      {t(u.role)}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4">
                                    {u.created_at ? new Date(u.created_at).toLocaleDateString('he-IL') : '-'}
                                  </td>
                                  <td className="py-4 px-4">
                                    <div className="flex items-center gap-2">
                                      <select
                                        value={u.role}
                                        onChange={(e) => updateUserRole(u.user_id, e.target.value)}
                                        className="text-sm border border-gray-300 rounded px-2 py-1"
                                        disabled={u.user_id === user?.user_id}
                                      >
                                        <option value="patient">משתמש</option>
                                        <option value="provider">ספק</option>
                                        <option value="admin">מנהל</option>
                                      </select>
                                      {u.user_id !== user?.user_id && (
                                        <button
                                          onClick={() => deleteUser(u.user_id)}
                                          className="text-red-500 hover:text-red-700 p-1"
                                        >
                                          <FaTrash />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Providers Tab */}
                  {activeTab === 'providers' && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <h3 className="text-xl font-bold text-carelink-navy mb-6">ניהול ספקים</h3>
                      {loading ? (
                        <div className="text-center py-8">
                          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {providers.map((provider) => (
                            <div key={provider.provider_id} className="flex items-center justify-between p-4 border-2 border-carelink-teal-pale rounded-xl hover:border-purple-300">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-carelink-navy rounded-full flex items-center justify-center text-white font-bold">
                                  {(provider.business_name || 'P')[0]}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-carelink-navy">{provider.business_name}</h4>
                                    {provider.is_verified && (
                                      <span className="bg-carelink-teal text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <FaCheckCircle /> מאומת
                                      </span>
                                    )}
                                    {provider.is_recommended && (
                                      <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <FaAward /> מומלץ
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-carelink-gray">
                                    {provider.location?.city} • {t(provider.provider_type)} • ⭐ {provider.rating?.toFixed(1) || '0.0'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {!provider.is_verified && (
                                  <button
                                    onClick={() => verifyProvider(provider.provider_id)}
                                    className="bg-carelink-teal text-white px-3 py-1 rounded-lg text-sm hover:bg-carelink-teal-medium"
                                  >
                                    אמת
                                  </button>
                                )}
                                {!provider.is_recommended && (
                                  <button
                                    onClick={() => recommendProvider(provider.provider_id)}
                                    className="bg-amber-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-amber-600"
                                  >
                                    המלץ
                                  </button>
                                )}
                                <Link
                                  to={`/providers/${provider.provider_id}`}
                                  className="text-carelink-gray hover:text-carelink-navy p-2"
                                >
                                  <FaEye />
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reports Tab */}
                  {activeTab === 'reports' && (
                    <div className="space-y-6">
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-bold text-carelink-navy mb-6">דוחות וייצוא נתונים</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          <button
                            onClick={() => exportData('users')}
                            className="flex items-center justify-between p-4 border-2 border-carelink-teal-pale rounded-xl hover:border-purple-300 transition"
                          >
                            <div className="flex items-center gap-3">
                              <FaUsers className="text-xl text-purple-600" />
                              <div className="text-right">
                                <p className="font-bold text-carelink-navy">דוח משתמשים</p>
                                <p className="text-sm text-carelink-gray">ייצוא כל המשתמשים</p>
                              </div>
                            </div>
                            <FaDownload className="text-carelink-gray" />
                          </button>
                          <button
                            onClick={() => exportData('providers')}
                            className="flex items-center justify-between p-4 border-2 border-carelink-teal-pale rounded-xl hover:border-purple-300 transition"
                          >
                            <div className="flex items-center gap-3">
                              <FaUserMd className="text-xl text-blue-600" />
                              <div className="text-right">
                                <p className="font-bold text-carelink-navy">דוח ספקים</p>
                                <p className="text-sm text-carelink-gray">ייצוא כל הספקים</p>
                              </div>
                            </div>
                            <FaDownload className="text-carelink-gray" />
                          </button>
                          <button
                            onClick={() => exportData('bookings')}
                            className="flex items-center justify-between p-4 border-2 border-carelink-teal-pale rounded-xl hover:border-purple-300 transition"
                          >
                            <div className="flex items-center gap-3">
                              <FaCalendarAlt className="text-xl text-green-600" />
                              <div className="text-right">
                                <p className="font-bold text-carelink-navy">דוח תורים</p>
                                <p className="text-sm text-carelink-gray">ייצוא כל התורים</p>
                              </div>
                            </div>
                            <FaDownload className="text-carelink-gray" />
                          </button>
                          <button
                            onClick={() => exportData('revenue')}
                            className="flex items-center justify-between p-4 border-2 border-carelink-teal-pale rounded-xl hover:border-purple-300 transition"
                          >
                            <div className="flex items-center gap-3">
                              <FaMoneyBillWave className="text-xl text-yellow-600" />
                              <div className="text-right">
                                <p className="font-bold text-carelink-navy">דוח הכנסות</p>
                                <p className="text-sm text-carelink-gray">סיכום כספי</p>
                              </div>
                            </div>
                            <FaDownload className="text-carelink-gray" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notifications Tab */}
                  {activeTab === 'notifications' && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <h3 className="text-xl font-bold text-carelink-navy mb-6">שליחת הודעות</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-carelink-navy mb-2">כותרת ההודעה</label>
                          <input
                            type="text"
                            value={broadcastTitle}
                            onChange={(e) => setBroadcastTitle(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-purple-500 focus:outline-none"
                            placeholder="הזן כותרת..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-carelink-navy mb-2">תוכן ההודעה</label>
                          <textarea
                            value={broadcastMessage}
                            onChange={(e) => setBroadcastMessage(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-purple-500 focus:outline-none h-32 resize-none"
                            placeholder="הזן את תוכן ההודעה..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-carelink-navy mb-2">שלח ל:</label>
                          <select
                            value={broadcastRole}
                            onChange={(e) => setBroadcastRole(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-purple-500 focus:outline-none"
                          >
                            <option value="">כל המשתמשים</option>
                            <option value="patient">משתמשים רגילים</option>
                            <option value="provider">ספקים</option>
                          </select>
                        </div>
                        <button
                          onClick={sendBroadcast}
                          className="bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition flex items-center gap-2"
                        >
                          <FaBell />
                          שלח הודעה
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Settings Tab */}
                  {activeTab === 'settings' && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <h3 className="text-xl font-bold text-carelink-navy mb-6">הגדרות מערכת</h3>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <p className="font-medium text-carelink-navy">אימות ספקים אוטומטי</p>
                            <p className="text-sm text-carelink-gray">אשר ספקים חדשים אוטומטית</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <p className="font-medium text-carelink-navy">שליחת מיילים</p>
                            <p className="text-sm text-carelink-gray">שלח התראות במייל</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <p className="font-medium text-carelink-navy">מצב תחזוקה</p>
                            <p className="text-sm text-carelink-gray">השבת גישה לאתר למשתמשים</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
