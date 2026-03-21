import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import { toast } from 'sonner';
import ConfirmDialog from '../components/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';
import { 
  FaUsers, FaUserMd, FaCalendarAlt, FaChartBar, FaFileAlt,
  FaStar, FaComments, FaCog, FaBell, FaCheckCircle, FaTimes,
  FaEye, FaTrash, FaEdit, FaSearch, FaDownload, FaAward,
  FaChartLine, FaMoneyBillWave, FaExclamationTriangle, FaHourglass,
  FaFileContract, FaTimesCircle, FaMapMarkerAlt, FaPlus, FaCity
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
  // Regions management
  const [regions, setRegions] = useState([]);
  const [editingRegion, setEditingRegion] = useState(null);
  const [newRegionName, setNewRegionName] = useState('');
  const [newCity, setNewCity] = useState('');
  const { confirmState, confirm, closeConfirm } = useConfirm();

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
      if (activeTab === 'providers' || activeTab === 'pending') {
        const providersRes = await api.get('/providers?limit=100');
        setProviders(providersRes.data.providers || []);
        
        // Fetch pending providers
        try {
          const pendingRes = await api.get('/admin/providers/pending');
          setPendingProviders(pendingRes.data.providers || []);
        } catch (err) {
          console.error('Failed to fetch pending providers:', err);
        }
      }

      // Fetch bookings
      if (activeTab === 'bookings') {
        const bookingsRes = await api.get('/admin/bookings');
        setBookings(bookingsRes.data.bookings || []);
      }

      // Fetch regions
      if (activeTab === 'regions') {
        const regionsRes = await api.get('/regions');
        setRegions(regionsRes.data.regions || []);
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Region management functions
  const createRegion = async () => {
    if (!newRegionName.trim()) return;
    try {
      await api.post('/admin/regions', { name: newRegionName, cities: [] });
      setNewRegionName('');
      fetchAdminData();
    } catch (error) {
      console.error('Failed to create region:', error);
    }
  };

  const updateRegion = async (regionId, data) => {
    try {
      await api.put(`/admin/regions/${regionId}`, data);
      setEditingRegion(null);
      fetchAdminData();
    } catch (error) {
      console.error('Failed to update region:', error);
    }
  };

  const deleteRegion = async (regionId) => {
    await confirm({
      title: 'מחיקת מחוז',
      message: 'האם אתה בטוח שברצונך למחוק מחוז זה?',
      type: 'danger',
      confirmText: 'מחק',
      cancelText: 'ביטול'
    });
    try {
      await api.delete(`/admin/regions/${regionId}`);
      fetchAdminData();
    } catch (error) {
      console.error('Failed to delete region:', error);
    }
  };

  const addCityToRegion = async (regionId) => {
    if (!newCity.trim()) return;
    try {
      await api.post(`/admin/regions/${regionId}/cities`, { city: newCity });
      setNewCity('');
      fetchAdminData();
    } catch (error) {
      console.error('Failed to add city:', error);
    }
  };

  const removeCityFromRegion = async (regionId, cityName) => {
    try {
      await api.delete(`/admin/regions/${regionId}/cities/${encodeURIComponent(cityName)}`);
      fetchAdminData();
    } catch (error) {
      console.error('Failed to remove city:', error);
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
    await confirm({
      title: 'מחיקת משתמש',
      message: 'האם אתה בטוח שברצונך למחוק משתמש זה?',
      type: 'danger',
      confirmText: 'מחק',
      cancelText: 'ביטול'
    });
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
      toast.success('הספק אומת בהצלחה!');
    } catch (error) {
      console.error('Failed to verify provider:', error);
      toast.error('שגיאה באימות הספק');
    }
  };

  const rejectProvider = async (providerId, reason) => {
    try {
      await api.put(`/admin/providers/${providerId}/reject`, { reason });
      fetchAdminData();
      setShowRejectDialog(null);
      setRejectReason('');
      toast.success('בקשת האימות נדחתה');
    } catch (error) {
      console.error('Failed to reject provider:', error);
      toast.error('שגיאה בדחיית הבקשה');
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
      toast.error('נא למלא כותרת והודעה');
      return;
    }
    try {
      await api.post('/admin/notifications/broadcast', {
        title: broadcastTitle,
        message: broadcastMessage,
        role: broadcastRole || undefined
      });
      toast.success('ההודעה נשלחה בהצלחה!');
      setBroadcastTitle('');
      setBroadcastMessage('');
      setBroadcastRole('');
    } catch (error) {
      console.error('Failed to send broadcast:', error);
      toast.error('שגיאה בשליחת ההודעה');
    }
  };

  const exportData = (type) => {
    // In real implementation, this would call an API endpoint to generate CSV/PDF
    toast.info(`ייצוא ${type} - בקרוב!`);
  };

  const tabs = [
    { id: 'overview', label: 'סקירה כללית', icon: FaChartBar },
    { id: 'users', label: 'משתמשים', icon: FaUsers },
    { id: 'providers', label: 'ספקים', icon: FaUserMd },
    { id: 'pending', label: 'ממתינים לאישור', icon: FaHourglass, badge: pendingProviders.length },
    { id: 'bookings', label: 'תורים', icon: FaCalendarAlt },
    { id: 'reports', label: 'דוחות', icon: FaFileAlt },
    { id: 'notifications', label: 'התראות', icon: FaBell },
    { id: 'settings', label: 'הגדרות', icon: FaCog },
    { id: 'regions', label: 'ניהול מחוזות', icon: FaMapMarkerAlt }
  ];

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-600';
      case 'provider': return 'bg-blue-100 text-blue-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-carefd-teal-pale/30 flex flex-col">
      <Navbar />
      
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-carefd-navy font-heading mb-2">
              פאנל ניהול 🛠️
            </h1>
            <p className="text-carefd-gray">ניהול מלא של הפלטפורמה</p>
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
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-right transition ${
                        activeTab === tab.id
                          ? 'bg-purple-600 text-white'
                          : 'text-carefd-gray hover:bg-purple-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <tab.icon />
                        {tab.label}
                      </div>
                      {tab.badge > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          activeTab === tab.id ? 'bg-white text-purple-600' : 'bg-red-500 text-white'
                        }`}>
                          {tab.badge}
                        </span>
                      )}
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
                              <div className="text-2xl font-bold text-carefd-navy">{stats.total_users}</div>
                              <div className="text-sm text-carefd-gray">משתמשים</div>
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
                              <div className="text-2xl font-bold text-carefd-navy">{stats.total_providers}</div>
                              <div className="text-sm text-carefd-gray">ספקים</div>
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-carefd-teal">
                            {stats.verified_providers} מאומתים
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                              <FaCalendarAlt className="text-green-600 text-xl" />
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-carefd-navy">{stats.total_bookings}</div>
                              <div className="text-sm text-carefd-gray">תורים</div>
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
                              <div className="text-2xl font-bold text-carefd-navy">{stats.total_reviews}</div>
                              <div className="text-sm text-carefd-gray">ביקורות</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Secondary Stats */}
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                          <h3 className="font-bold text-carefd-navy mb-4">שירותים</h3>
                          <div className="text-3xl font-bold text-carefd-teal">{stats.total_services}</div>
                          <p className="text-sm text-carefd-gray">שירותים פעילים</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                          <h3 className="font-bold text-carefd-navy mb-4">בקשות</h3>
                          <div className="text-3xl font-bold text-carefd-teal">{stats.total_requests}</div>
                          <p className="text-sm text-carefd-gray">{stats.open_requests} פתוחות</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                          <h3 className="font-bold text-carefd-navy mb-4">הודעות</h3>
                          <div className="text-3xl font-bold text-carefd-teal">{stats.total_messages}</div>
                          <p className="text-sm text-carefd-gray">בצ'אט הפנימי</p>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="font-bold text-carefd-navy mb-4">פעולות מהירות</h3>
                        <div className="grid md:grid-cols-4 gap-4">
                          <button
                            onClick={() => setActiveTab('providers')}
                            className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition"
                          >
                            <FaCheckCircle className="text-purple-600" />
                            <span className="font-medium text-carefd-navy">אמת ספקים</span>
                          </button>
                          <button
                            onClick={() => setActiveTab('notifications')}
                            className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition"
                          >
                            <FaBell className="text-blue-600" />
                            <span className="font-medium text-carefd-navy">שלח הודעה</span>
                          </button>
                          <button
                            onClick={() => setActiveTab('reports')}
                            className="flex items-center gap-3 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition"
                          >
                            <FaDownload className="text-green-600" />
                            <span className="font-medium text-carefd-navy">ייצא דוח</span>
                          </button>
                          <button
                            onClick={() => setActiveTab('users')}
                            className="flex items-center gap-3 p-4 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition"
                          >
                            <FaUsers className="text-yellow-600" />
                            <span className="font-medium text-carefd-navy">נהל משתמשים</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Users Tab */}
                  {activeTab === 'users' && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <h3 className="text-xl font-bold text-carefd-navy">ניהול משתמשים</h3>
                        <div className="flex gap-3">
                          <div className="relative">
                            <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-carefd-gray" />
                            <input
                              type="text"
                              placeholder="חפש משתמש..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-4 pr-10 py-2 border-2 border-carefd-teal-pale rounded-xl focus:border-purple-500 focus:outline-none"
                            />
                          </div>
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="px-4 py-2 border-2 border-carefd-teal-pale rounded-xl focus:border-purple-500 focus:outline-none"
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
                              <tr className="border-b border-carefd-teal-pale">
                                <th className="text-right py-3 px-4 font-semibold text-carefd-navy">שם</th>
                                <th className="text-right py-3 px-4 font-semibold text-carefd-navy">אימייל</th>
                                <th className="text-right py-3 px-4 font-semibold text-carefd-navy">תפקיד</th>
                                <th className="text-right py-3 px-4 font-semibold text-carefd-navy">תאריך הצטרפות</th>
                                <th className="text-right py-3 px-4 font-semibold text-carefd-navy">פעולות</th>
                              </tr>
                            </thead>
                            <tbody>
                              {users.map((u) => (
                                <tr key={u.user_id} className="border-b border-carefd-teal-pale/50 hover:bg-gray-50">
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
                      <h3 className="text-xl font-bold text-carefd-navy mb-6">ניהול ספקים</h3>
                      {loading ? (
                        <div className="text-center py-8">
                          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {providers.map((provider) => (
                            <div key={provider.provider_id} className="flex items-center justify-between p-4 border-2 border-carefd-teal-pale rounded-xl hover:border-purple-300">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-carefd-navy rounded-full flex items-center justify-center text-white font-bold">
                                  {(provider.business_name || 'P')[0]}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-carefd-navy">{provider.business_name}</h4>
                                    {provider.is_verified && (
                                      <span className="bg-carefd-teal text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <FaCheckCircle /> מאומת
                                      </span>
                                    )}
                                    {provider.is_recommended && (
                                      <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <FaAward /> מומלץ
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-carefd-gray">
                                    {provider.location?.city} • {t(provider.provider_type)} • ⭐ {provider.rating?.toFixed(1) || '0.0'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {!provider.is_verified && (
                                  <button
                                    onClick={() => verifyProvider(provider.provider_id)}
                                    className="bg-carefd-teal text-white px-3 py-1 rounded-lg text-sm hover:bg-carefd-teal-medium"
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
                                  className="text-carefd-gray hover:text-carefd-navy p-2"
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
                        <h3 className="text-xl font-bold text-carefd-navy mb-6">דוחות וייצוא נתונים</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          <button
                            onClick={() => exportData('users')}
                            className="flex items-center justify-between p-4 border-2 border-carefd-teal-pale rounded-xl hover:border-purple-300 transition"
                          >
                            <div className="flex items-center gap-3">
                              <FaUsers className="text-xl text-purple-600" />
                              <div className="text-right">
                                <p className="font-bold text-carefd-navy">דוח משתמשים</p>
                                <p className="text-sm text-carefd-gray">ייצוא כל המשתמשים</p>
                              </div>
                            </div>
                            <FaDownload className="text-carefd-gray" />
                          </button>
                          <button
                            onClick={() => exportData('providers')}
                            className="flex items-center justify-between p-4 border-2 border-carefd-teal-pale rounded-xl hover:border-purple-300 transition"
                          >
                            <div className="flex items-center gap-3">
                              <FaUserMd className="text-xl text-blue-600" />
                              <div className="text-right">
                                <p className="font-bold text-carefd-navy">דוח ספקים</p>
                                <p className="text-sm text-carefd-gray">ייצוא כל הספקים</p>
                              </div>
                            </div>
                            <FaDownload className="text-carefd-gray" />
                          </button>
                          <button
                            onClick={() => exportData('bookings')}
                            className="flex items-center justify-between p-4 border-2 border-carefd-teal-pale rounded-xl hover:border-purple-300 transition"
                          >
                            <div className="flex items-center gap-3">
                              <FaCalendarAlt className="text-xl text-green-600" />
                              <div className="text-right">
                                <p className="font-bold text-carefd-navy">דוח תורים</p>
                                <p className="text-sm text-carefd-gray">ייצוא כל התורים</p>
                              </div>
                            </div>
                            <FaDownload className="text-carefd-gray" />
                          </button>
                          <button
                            onClick={() => exportData('revenue')}
                            className="flex items-center justify-between p-4 border-2 border-carefd-teal-pale rounded-xl hover:border-purple-300 transition"
                          >
                            <div className="flex items-center gap-3">
                              <FaMoneyBillWave className="text-xl text-yellow-600" />
                              <div className="text-right">
                                <p className="font-bold text-carefd-navy">דוח הכנסות</p>
                                <p className="text-sm text-carefd-gray">סיכום כספי</p>
                              </div>
                            </div>
                            <FaDownload className="text-carefd-gray" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notifications Tab */}
                  {activeTab === 'notifications' && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <h3 className="text-xl font-bold text-carefd-navy mb-6">שליחת הודעות</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-carefd-navy mb-2">כותרת ההודעה</label>
                          <input
                            type="text"
                            value={broadcastTitle}
                            onChange={(e) => setBroadcastTitle(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-purple-500 focus:outline-none"
                            placeholder="הזן כותרת..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-carefd-navy mb-2">תוכן ההודעה</label>
                          <textarea
                            value={broadcastMessage}
                            onChange={(e) => setBroadcastMessage(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-purple-500 focus:outline-none h-32 resize-none"
                            placeholder="הזן את תוכן ההודעה..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-carefd-navy mb-2">שלח ל:</label>
                          <select
                            value={broadcastRole}
                            onChange={(e) => setBroadcastRole(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-purple-500 focus:outline-none"
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

                  {/* Pending Providers Tab */}
                  {activeTab === 'pending' && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-carefd-navy">ספקים ממתינים לאישור</h3>
                        <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-medium">
                          {pendingProviders.length} ממתינים
                        </span>
                      </div>
                      
                      {pendingProviders.length === 0 ? (
                        <div className="text-center py-12 text-carefd-gray">
                          <FaCheckCircle className="text-5xl mx-auto mb-3 text-green-300" />
                          <p className="text-lg">אין ספקים ממתינים לאישור</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {pendingProviders.map((provider) => (
                            <div key={provider.provider_id} className="border-2 border-orange-200 rounded-xl p-5 hover:border-orange-300 transition">
                              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-bold text-carefd-navy text-lg">{provider.business_name || 'ללא שם'}</h4>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      provider.verification_status === 'documents_submitted' 
                                        ? 'bg-blue-100 text-blue-600' 
                                        : 'bg-yellow-100 text-yellow-600'
                                    }`}>
                                      {provider.verification_status === 'documents_submitted' ? 'מסמכים הוגשו' : 'ממתין'}
                                    </span>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-carefd-gray">
                                    <div>
                                      <span className="font-medium">אימייל:</span> {provider.user_info?.email || provider.email || '-'}
                                    </div>
                                    <div>
                                      <span className="font-medium">סוג:</span> {provider.provider_type || '-'}
                                    </div>
                                    <div>
                                      <span className="font-medium">התמחויות:</span> {provider.specializations?.join(', ') || '-'}
                                    </div>
                                    <div>
                                      <span className="font-medium">נרשם:</span> {new Date(provider.created_at).toLocaleDateString('he-IL')}
                                    </div>
                                  </div>

                                  {/* Documents */}
                                  {provider.verification_documents?.length > 0 && (
                                    <div className="mt-3">
                                      <p className="text-sm font-medium text-carefd-navy mb-2">מסמכים שהועלו:</p>
                                      <div className="flex flex-wrap gap-2">
                                        {provider.verification_documents.map((doc, idx) => (
                                          <a
                                            key={idx}
                                            href={doc.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm transition"
                                          >
                                            <FaFileContract className="text-purple-500" />
                                            {doc.document_type === 'id_card' ? 'ת.ז' : 
                                             doc.document_type === 'license' ? 'רישיון' :
                                             doc.document_type === 'certificate' ? 'תעודה' :
                                             doc.document_type === 'diploma' ? 'תואר' : 'מסמך'}
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => verifyProvider(provider.provider_id)}
                                    className="bg-green-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-green-700 transition flex items-center gap-2"
                                    data-testid={`verify-provider-${provider.provider_id}`}
                                  >
                                    <FaCheckCircle />
                                    אשר
                                  </button>
                                  <button
                                    onClick={() => setShowRejectDialog(provider.provider_id)}
                                    className="bg-red-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-700 transition flex items-center gap-2"
                                    data-testid={`reject-provider-${provider.provider_id}`}
                                  >
                                    <FaTimesCircle />
                                    דחה
                                  </button>
                                  <Link
                                    to={`/providers/${provider.provider_id}`}
                                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium hover:bg-gray-300 transition flex items-center gap-2"
                                  >
                                    <FaEye />
                                    צפה
                                  </Link>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Settings Tab */}
                  {activeTab === 'settings' && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <h3 className="text-xl font-bold text-carefd-navy mb-6">הגדרות מערכת</h3>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <p className="font-medium text-carefd-navy">אימות ספקים אוטומטי</p>
                            <p className="text-sm text-carefd-gray">אשר ספקים חדשים אוטומטית</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <p className="font-medium text-carefd-navy">שליחת מיילים</p>
                            <p className="text-sm text-carefd-gray">שלח התראות במייל</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <p className="font-medium text-carefd-navy">מצב תחזוקה</p>
                            <p className="text-sm text-carefd-gray">השבת גישה לאתר למשתמשים</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Regions Tab */}
                  {activeTab === 'regions' && (
                    <div className="space-y-6">
                      <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-bold text-carefd-navy mb-6 flex items-center gap-2">
                          <FaMapMarkerAlt className="text-purple-600" />
                          ניהול מחוזות וערים
                        </h2>

                        {/* Add New Region */}
                        <div className="bg-purple-50 rounded-xl p-4 mb-6">
                          <h3 className="font-medium text-carefd-navy mb-3">הוסף מחוז חדש</h3>
                          <div className="flex gap-3">
                            <input
                              type="text"
                              value={newRegionName}
                              onChange={(e) => setNewRegionName(e.target.value)}
                              placeholder="שם המחוז..."
                              className="flex-1 px-4 py-2 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <button
                              onClick={createRegion}
                              disabled={!newRegionName.trim()}
                              className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
                            >
                              <FaPlus />
                              הוסף
                            </button>
                          </div>
                        </div>

                        {/* Regions List */}
                        <div className="space-y-4">
                          {regions.map((region) => (
                            <div key={region.region_id} className="border-2 border-gray-100 rounded-xl p-4 hover:border-purple-200 transition">
                              <div className="flex items-center justify-between mb-3">
                                {editingRegion === region.region_id ? (
                                  <input
                                    type="text"
                                    defaultValue={region.name}
                                    className="px-3 py-1 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    onBlur={(e) => updateRegion(region.region_id, { name: e.target.value })}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        updateRegion(region.region_id, { name: e.target.value });
                                      }
                                    }}
                                    autoFocus
                                  />
                                ) : (
                                  <h3 className="font-bold text-carefd-navy text-lg flex items-center gap-2">
                                    <FaMapMarkerAlt className="text-purple-500" />
                                    {region.name}
                                    <span className="text-sm font-normal text-carefd-gray">
                                      ({region.cities?.length || 0} ערים)
                                    </span>
                                  </h3>
                                )}
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setEditingRegion(editingRegion === region.region_id ? null : region.region_id)}
                                    className="p-2 text-gray-500 hover:text-purple-600 transition"
                                    title="ערוך שם"
                                  >
                                    <FaEdit />
                                  </button>
                                  <button
                                    onClick={() => deleteRegion(region.region_id)}
                                    className="p-2 text-gray-500 hover:text-red-600 transition"
                                    title="מחק מחוז"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </div>

                              {/* Cities */}
                              <div className="flex flex-wrap gap-2 mb-3">
                                {region.cities?.map((city) => (
                                  <span
                                    key={city}
                                    className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm group"
                                  >
                                    {city}
                                    <button
                                      onClick={() => removeCityFromRegion(region.region_id, city)}
                                      className="text-purple-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                                    >
                                      <FaTimes className="text-xs" />
                                    </button>
                                  </span>
                                ))}
                              </div>

                              {/* Add City */}
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="הוסף עיר..."
                                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.target.value.trim()) {
                                      const city = e.target.value.trim();
                                      api.post(`/admin/regions/${region.region_id}/cities`, { city })
                                        .then(() => fetchAdminData())
                                        .catch(err => console.error('Failed to add city:', err));
                                      e.target.value = '';
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          ))}

                          {regions.length === 0 && (
                            <div className="text-center py-8 text-carefd-gray">
                              <FaMapMarkerAlt className="text-4xl mx-auto mb-3 text-gray-300" />
                              <p>אין מחוזות. הוסף מחוז ראשון למעלה.</p>
                            </div>
                          )}
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

      {/* Reject Provider Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-carefd-navy mb-4">דחיית בקשת אימות</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  סיבת הדחייה
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="הסבר מדוע הבקשה נדחתה..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectDialog(null);
                    setRejectReason('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium"
                >
                  ביטול
                </button>
                <button
                  onClick={() => rejectProvider(showRejectDialog, rejectReason)}
                  disabled={!rejectReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-medium disabled:opacity-50"
                >
                  דחה בקשה
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
      />
    </div>
  );
};

export default AdminDashboard;
