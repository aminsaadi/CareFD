import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import { toast } from 'sonner';
import {
  FiSearch, FiFilter, FiEye, FiCheck, FiX, FiStar,
  FiMapPin, FiPhone, FiMail, FiAward, FiShield, FiUserPlus, 
  FiAlertCircle, FiEdit, FiTrash2, FiToggleLeft, FiToggleRight
} from 'react-icons/fi';

const AdminProviders = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [creatingProfile, setCreatingProfile] = useState(null);

  useEffect(() => {
    fetchProviders();
  }, [searchQuery, filterStatus, pagination.page]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterStatus) params.append('status', filterStatus);
      params.append('limit', pagination.limit);
      params.append('skip', (pagination.page - 1) * pagination.limit);
      
      // Use admin endpoint to get ALL providers (not just verified)
      const response = await api.get(`/admin/providers?${params.toString()}`);
      setProviders(response.data.providers || []);
      setPagination(prev => ({ ...prev, total: response.data.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyProvider = async (providerId) => {
    try {
      await api.put(`/admin/providers/${providerId}/verify`);
      fetchProviders();
    } catch (error) {
      console.error('Failed to verify provider:', error);
    }
  };

  const toggleRecommended = async (providerId, isRecommended) => {
    try {
      if (isRecommended) {
        await api.put(`/admin/providers/${providerId}/unrecommend`);
      } else {
        await api.put(`/admin/providers/${providerId}/recommend`);
      }
      fetchProviders();
    } catch (error) {
      console.error('Failed to toggle recommended:', error);
    }
  };

  const createProviderProfile = async (userId, userName) => {
    try {
      setCreatingProfile(userId);
      await api.post(`/admin/providers/create-from-user/${userId}`, {
        business_name: userName
      });
      fetchProviders();
      toast.success('פרופיל ספק נוצר בהצלחה!');
    } catch (error) {
      console.error('Failed to create provider profile:', error);
      toast.error('שגיאה ביצירת פרופיל ספק: ' + (error.response?.data?.detail || 'Unknown error'));
    } finally {
      setCreatingProfile(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-carelink-navy">ניהול ספקים</h1>
            <p className="text-carelink-slate mt-1">{pagination.total} ספקים במערכת</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-carelink-slate" size={18} />
              <input
                type="text"
                placeholder="חפש לפי שם, עיר..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pr-10 pl-4 py-2.5 text-carelink-navy placeholder-carelink-gray focus:border-carelink-teal outline-none"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carelink-navy focus:border-carelink-teal outline-none min-w-[150px]"
            >
              <option value="">כל הסטטוסים</option>
              <option value="verified">מאומתים</option>
              <option value="pending">ממתינים</option>
              <option value="recommended">מומלצים</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-carelink-slate text-sm">סה"כ ספקים</p>
            <p className="text-2xl font-bold text-carelink-navy mt-1">{providers.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-carelink-slate text-sm">מאומתים</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{providers.filter(p => p.is_verified).length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-carelink-slate text-sm">ממתינים לאימות</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{providers.filter(p => !p.is_verified && !p.needs_profile).length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-carelink-slate text-sm">ללא פרופיל</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{providers.filter(p => p.needs_profile).length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-carelink-slate text-sm">מומלצים</p>
            <p className="text-2xl font-bold text-purple-400 mt-1">{providers.filter(p => p.is_recommended).length}</p>
          </div>
        </div>

        {/* Providers Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-right py-4 px-6 text-carelink-slate font-medium text-sm">ספק</th>
                  <th className="text-right py-4 px-6 text-carelink-slate font-medium text-sm">מיקום</th>
                  <th className="text-right py-4 px-6 text-carelink-slate font-medium text-sm">דירוג</th>
                  <th className="text-right py-4 px-6 text-carelink-slate font-medium text-sm">סטטוס</th>
                  <th className="text-right py-4 px-6 text-carelink-slate font-medium text-sm">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <div className="w-8 h-8 border-4 border-carelink-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </td>
                  </tr>
                ) : providers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-carelink-slate">
                      לא נמצאו ספקים
                    </td>
                  </tr>
                ) : (
                  providers.map((provider) => (
                    <tr key={provider.provider_id || `orphan_${provider.user_id}`} className="border-b border-gray-100/50 hover:bg-gray-50/30 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-carelink-teal to-carelink-navy rounded-full flex items-center justify-center text-carelink-navy font-medium text-lg">
                            {provider.business_name?.[0] || 'P'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-carelink-navy font-medium">{provider.business_name}</p>
                              {provider.is_verified && (
                                <FiShield className="text-emerald-400" size={14} title="מאומת" />
                              )}
                              {provider.is_recommended && (
                                <FiAward className="text-amber-400" size={14} title="מומלץ" />
                              )}
                            </div>
                            <p className="text-carelink-slate text-sm">{provider.provider_type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1 text-carelink-slate text-sm">
                          <FiMapPin size={14} />
                          {provider.location?.city || '-'}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1">
                          <FiStar className="text-amber-400" size={14} />
                          <span className="text-carelink-navy">{provider.rating?.toFixed(1) || '0.0'}</span>
                          <span className="text-carelink-gray text-sm">({provider.reviews_count || 0})</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1">
                          {provider.needs_profile ? (
                            <span className="inline-flex items-center gap-1 text-red-400 text-sm">
                              <FiAlertCircle size={14} />
                              ללא פרופיל
                            </span>
                          ) : provider.is_verified ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 text-sm">
                              <FiCheck size={14} />
                              מאומת
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-400 text-sm">
                              <FiX size={14} />
                              לא מאומת
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {provider.needs_profile ? (
                            <button
                              onClick={() => createProviderProfile(provider.user_id, provider.business_name)}
                              disabled={creatingProfile === provider.user_id}
                              className="flex items-center gap-1 px-3 py-1.5 bg-carelink-teal text-white rounded-lg hover:bg-carelink-teal-medium transition text-sm disabled:opacity-50"
                              title="צור פרופיל ספק"
                            >
                              {creatingProfile === provider.user_id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <>
                                  <FiUserPlus size={14} />
                                  צור פרופיל
                                </>
                              )}
                            </button>
                          ) : (
                            <>
                              <Link
                                to={`/providers/${provider.provider_id}`}
                                className="p-2 text-carelink-slate hover:text-carelink-navy hover:bg-gray-50 rounded-lg transition"
                                title="צפה בפרופיל"
                              >
                                <FiEye size={16} />
                              </Link>
                              <Link
                                to={`/admin/providers/${provider.provider_id}/edit`}
                                className="p-2 text-carelink-slate hover:text-carelink-teal hover:bg-carelink-teal/10 rounded-lg transition"
                                title="ערוך פרופיל"
                              >
                                <FiEdit size={16} />
                              </Link>
                              {!provider.is_verified && (
                                <button
                                  onClick={() => verifyProvider(provider.provider_id)}
                                  className="p-2 text-carelink-slate hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition"
                                  title="אמת ספק"
                                >
                                  <FiShield size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => toggleRecommended(provider.provider_id, provider.is_recommended)}
                                className={`p-2 rounded-lg transition ${
                                  provider.is_recommended
                                    ? 'text-amber-400 hover:bg-amber-500/10'
                                    : 'text-carelink-slate hover:text-amber-400 hover:bg-amber-500/10'
                                }`}
                                title={provider.is_recommended ? 'הסר המלצה' : 'המלץ'}
                              >
                                <FiAward size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProviders;
