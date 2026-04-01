"use client";

import {  useState, useEffect  } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import { toast } from "sonner";
import {
  FiSearch, FiEye, FiCheck, FiX, FiStar, FiMapPin, FiPhone, FiMail,
  FiAward, FiShield, FiUserPlus, FiAlertCircle, FiEdit, FiTrash2,
  FiToggleLeft, FiToggleRight, FiUser, FiCalendar, FiClock, FiHash,
  FiGlobe, FiFileText, FiCheckCircle, FiXCircle, FiSlash, FiCopy
} from 'react-icons/fi';

export default function AdminProviders() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [creatingProfile, setCreatingProfile] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showToggleModal, setShowToggleModal] = useState(null);
  const [showProviderModal, setShowProviderModal] = useState(null);
  const [providerDetails, setProviderDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

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
      
      const data = await api.get(`/admin/providers?${params.toString()}`);
      setProviders(data.providers || []);
      setPagination(prev => ({ ...prev, total: data.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      toast.error('שגיאה בטעינת ספקים');
    } finally {
      setLoading(false);
    }
  };

  const openProviderModal = async (provider) => {
    setShowProviderModal(provider);
    setProviderDetails(null);
    setLoadingDetails(true);
    try {
      const res = await api.get(`/admin/providers/${provider.provider_id}`);
      setProviderDetails(res.data);
    } catch {
      setProviderDetails(provider);
    } finally {
      setLoadingDetails(false);
    }
  };

  const verifyProvider = async (providerId) => {
    try {
      await api.put(`/admin/providers/${providerId}/verify`);
      fetchProviders();
      toast.success('הספק אומת בהצלחה!');
      setShowProviderModal(null);
    } catch (error) {
      toast.error('שגיאה באימות הספק');
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
      toast.success(isRecommended ? 'ההמלצה הוסרה' : 'הספק סומן כמומלץ!');
    } catch (error) {
      toast.error('שגיאה בשינוי המלצה');
    }
  };

  const createProviderProfile = async (userId, userName) => {
    try {
      setCreatingProfile(userId);
      await api.post(`/admin/providers/create-from-user/${userId}`, { business_name: userName });
      fetchProviders();
      toast.success('פרופיל ספק נוצר בהצלחה!');
    } catch (error) {
      toast.error('שגיאה ביצירת פרופיל ספק: ' + (error?.data?.detail || error?.message || ''));
    } finally {
      setCreatingProfile(null);
    }
  };

  const deleteProvider = async (providerId) => {
    try {
      await api.delete(`/admin/providers/${providerId}`);
      setShowDeleteModal(null);
      setShowProviderModal(null);
      fetchProviders();
      toast.success('הספק נמחק בהצלחה!');
    } catch (error) {
      toast.error('שגיאה במחיקת הספק');
    }
  };

  const toggleProviderStatus = async (providerId, isActive) => {
    try {
      await api.put(`/admin/providers/${providerId}`, { is_active: !isActive });
      setShowToggleModal(null);
      setShowProviderModal(null);
      fetchProviders();
      toast.success(isActive ? 'הספק הושבת' : 'הספק הופעל');
    } catch (error) {
      toast.error('שגיאה בשינוי סטטוס הספק');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('הועתק ללוח');
  };

  const getStatusBadge = (provider) => {
    if (provider.is_active === false) {
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"><FiSlash size={11} />מושבת</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700"><FiCheckCircle size={11} />פעיל</span>;
  };

  const getVerificationBadge = (provider) => {
    if (provider.needs_profile) {
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600"><FiAlertCircle size={11} />ללא פרופיל</span>;
    }
    if (provider.verification_status === 'verified' || provider.is_verified) {
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"><FiCheck size={11} />מאומת</span>;
    }
    if (provider.verification_status === 'documents_submitted') {
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700"><FiClock size={11} />בתהליך</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500"><FiX size={11} />לא מאומת</span>;
  };

  const prov = providerDetails || showProviderModal;

  return (
    <>
    
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-carefd-navy">ניהול ספקים</h1>
            <p className="text-carefd-slate mt-1">{pagination.total} ספקים במערכת</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-carefd-slate" size={18} />
              <input
                type="text"
                placeholder="חפש לפי שם, עיר..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pr-10 pl-4 py-2.5 text-carefd-navy placeholder-carefd-gray focus:border-carefd-teal outline-none"
                data-testid="search-providers-input"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy focus:border-carefd-teal outline-none min-w-[150px]"
              data-testid="filter-providers-status"
            >
              <option value="">כל הסטטוסים</option>
              <option value="verified">מאומתים</option>
              <option value="pending">ממתינים</option>
              <option value="recommended">מומלצים</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-carefd-slate text-sm">סה"כ ספקים</p>
            <p className="text-2xl font-bold text-carefd-navy mt-1">{providers.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-carefd-slate text-sm">מאומתים</p>
            <p className="text-2xl font-bold text-emerald-500 mt-1">{providers.filter(p => p.is_verified).length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-carefd-slate text-sm">ממתינים לאימות</p>
            <p className="text-2xl font-bold text-amber-500 mt-1">{providers.filter(p => !p.is_verified && !p.needs_profile).length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-carefd-slate text-sm">ללא פרופיל</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{providers.filter(p => p.needs_profile).length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-carefd-slate text-sm">מומלצים</p>
            <p className="text-2xl font-bold text-purple-500 mt-1">{providers.filter(p => p.is_recommended).length}</p>
          </div>
        </div>

        {/* Providers Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-right py-3 px-4 text-carefd-slate font-medium text-sm">מזהה ספק</th>
                  <th className="text-right py-3 px-4 text-carefd-slate font-medium text-sm">מזהה משתמש</th>
                  <th className="text-right py-3 px-4 text-carefd-slate font-medium text-sm">ספק</th>
                  <th className="text-right py-3 px-4 text-carefd-slate font-medium text-sm">מיקום</th>
                  <th className="text-right py-3 px-4 text-carefd-slate font-medium text-sm">דירוג</th>
                  <th className="text-right py-3 px-4 text-carefd-slate font-medium text-sm">סטטוס</th>
                  <th className="text-right py-3 px-4 text-carefd-slate font-medium text-sm">אימות</th>
                  <th className="text-right py-3 px-4 text-carefd-slate font-medium text-sm">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <div className="w-8 h-8 border-4 border-carefd-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </td>
                  </tr>
                ) : providers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-carefd-slate">
                      לא נמצאו ספקים
                    </td>
                  </tr>
                ) : (
                  providers.map((provider) => (
                    <tr 
                      key={provider.provider_id || `orphan_${provider.user_id}`} 
                      className={`border-b border-gray-50 hover:bg-carefd-teal-pale/10 transition cursor-pointer ${provider.is_active === false ? 'bg-red-50/30' : ''}`}
                      onClick={() => !provider.needs_profile && openProviderModal(provider)}
                      data-testid={`provider-row-${provider.provider_id}`}
                    >
                      {/* Provider ID */}
                      <td className="py-3 px-4">
                        <span className="text-xs font-mono text-carefd-teal bg-carefd-teal-pale/30 px-2 py-1 rounded">
                          {provider.provider_id ? provider.provider_id.slice(-8) : '-'}
                        </span>
                      </td>
                      {/* User ID */}
                      <td className="py-3 px-4">
                        <span className="text-xs font-mono text-carefd-slate">
                          {provider.user_id ? provider.user_id.slice(-8) : '-'}
                        </span>
                      </td>
                      {/* Provider Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-carefd-teal to-carefd-navy rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
                            {provider.business_name?.[0] || 'P'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-carefd-navy font-medium truncate">{provider.business_name}</p>
                              {provider.is_recommended && <FiAward className="text-amber-400 flex-shrink-0" size={13} />}
                            </div>
                            <p className="text-carefd-gray text-xs">{provider.provider_type || 'individual'}</p>
                          </div>
                        </div>
                      </td>
                      {/* Location */}
                      <td className="py-3 px-4">
                        <span className="text-carefd-slate text-sm">{provider.location?.city || provider.city || '-'}</span>
                      </td>
                      {/* Rating */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-sm">
                          <FiStar className="text-amber-400" size={13} />
                          <span className="text-carefd-navy">{provider.rating?.toFixed(1) || '0.0'}</span>
                          <span className="text-carefd-gray text-xs">({provider.reviews_count || 0})</span>
                        </div>
                      </td>
                      {/* Status */}
                      <td className="py-3 px-4">{getStatusBadge(provider)}</td>
                      {/* Verification */}
                      <td className="py-3 px-4">{getVerificationBadge(provider)}</td>
                      {/* Actions */}
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          {provider.needs_profile ? (
                            <button
                              onClick={() => createProviderProfile(provider.user_id, provider.business_name)}
                              disabled={creatingProfile === provider.user_id}
                              className="flex items-center gap-1 px-3 py-1.5 bg-carefd-teal text-white rounded-lg hover:bg-carefd-teal-medium transition text-xs disabled:opacity-50"
                              data-testid={`create-profile-${provider.user_id}`}
                            >
                              {creatingProfile === provider.user_id ? (
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <><FiUserPlus size={13} /> צור פרופיל</>
                              )}
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => openProviderModal(provider)}
                                className="p-1.5 text-carefd-slate hover:text-carefd-teal hover:bg-carefd-teal-pale rounded-lg transition"
                                title="פרטים"
                                data-testid={`view-provider-${provider.provider_id}`}
                              >
                                <FiEye size={15} />
                              </button>
                              <button
                                onClick={() => setShowToggleModal(provider)}
                                className={`p-1.5 rounded-lg transition ${provider.is_active === false ? 'text-gray-400 hover:text-emerald-500 hover:bg-emerald-50' : 'text-emerald-500 hover:text-red-400 hover:bg-red-50'}`}
                                title={provider.is_active === false ? 'הפעל' : 'השבת'}
                                data-testid={`toggle-provider-${provider.provider_id}`}
                              >
                                {provider.is_active === false ? <FiToggleLeft size={17} /> : <FiToggleRight size={17} />}
                              </button>
                              <button
                                onClick={() => setShowDeleteModal(provider)}
                                className="p-1.5 text-carefd-slate hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                title="מחק"
                              >
                                <FiTrash2 size={15} />
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

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
              <p className="text-carefd-slate text-sm">
                מציג {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} מתוך {pagination.total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 transition"
                >
                  הקודם
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page * pagination.limit >= pagination.total}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 transition"
                >
                  הבא
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Provider Details Modal */}
      {showProviderModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowProviderModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()} data-testid="provider-details-modal">
            {/* Modal Header */}
            <div className="bg-gradient-to-l from-carefd-navy to-carefd-slate p-6 rounded-t-2xl text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                    {prov?.business_name?.[0] || 'P'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      {prov?.business_name}
                      {prov?.is_recommended && <FiAward className="text-amber-300" size={18} />}
                    </h2>
                    <p className="text-white/70 text-sm">{prov?.provider_type || 'individual'}</p>
                  </div>
                </div>
                <button onClick={() => setShowProviderModal(null)} className="text-white/70 hover:text-white p-2 transition" data-testid="close-provider-modal">
                  <FiX size={22} />
                </button>
              </div>
              <div className="flex gap-3 mt-4">
                {getStatusBadge(prov || {})}
                {getVerificationBadge(prov || {})}
                {prov?.is_recommended && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                    <FiAward size={11} />מומלץ
                  </span>
                )}
              </div>
            </div>

            {loadingDetails ? (
              <div className="p-12 flex justify-center">
                <div className="w-8 h-8 border-4 border-carefd-teal border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="p-6 space-y-5">
                {/* IDs Section */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-carefd-navy mb-3 flex items-center gap-2"><FiHash size={14} /> מזהים</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-carefd-gray text-xs">מזהה ספק</p>
                      <div className="flex items-center gap-1">
                        <code className="text-carefd-teal font-mono text-xs bg-white px-2 py-0.5 rounded">{prov?.provider_id || '-'}</code>
                        {prov?.provider_id && <button onClick={() => copyToClipboard(prov.provider_id)} className="text-carefd-gray hover:text-carefd-teal"><FiCopy size={12} /></button>}
                      </div>
                    </div>
                    <div>
                      <p className="text-carefd-gray text-xs">מזהה משתמש</p>
                      <div className="flex items-center gap-1">
                        <code className="text-carefd-slate font-mono text-xs bg-white px-2 py-0.5 rounded">{prov?.user_id || '-'}</code>
                        {prov?.user_id && <button onClick={() => copyToClipboard(prov.user_id)} className="text-carefd-gray hover:text-carefd-teal"><FiCopy size={12} /></button>}
                      </div>
                    </div>
                    {prov?.provider_number && (
                      <div>
                        <p className="text-carefd-gray text-xs">מספר ספק</p>
                        <span className="font-mono text-sm">{prov.provider_number}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-carefd-navy mb-3 flex items-center gap-2"><FiUser size={14} /> פרטי קשר</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {prov?.email && (
                      <div className="flex items-center gap-2">
                        <FiMail className="text-blue-500 flex-shrink-0" size={14} />
                        <a href={`mailto:${prov.email}`} className="text-carefd-teal hover:underline truncate">{prov.email}</a>
                      </div>
                    )}
                    {prov?.phone && (
                      <div className="flex items-center gap-2">
                        <FiPhone className="text-blue-500 flex-shrink-0" size={14} />
                        <a href={`tel:${prov.phone}`} className="text-carefd-teal hover:underline">{prov.phone}</a>
                      </div>
                    )}
                    {(prov?.location?.city || prov?.city) && (
                      <div className="flex items-center gap-2">
                        <FiMapPin className="text-blue-500 flex-shrink-0" size={14} />
                        <span>{prov.location?.city || prov.city}{prov.location?.address ? `, ${prov.location.address}` : ''}</span>
                      </div>
                    )}
                    {prov?.website && (
                      <div className="flex items-center gap-2">
                        <FiGlobe className="text-blue-500 flex-shrink-0" size={14} />
                        <a href={prov.website} target="_blank" rel="noreferrer" className="text-carefd-teal hover:underline truncate">{prov.website}</a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Business Info */}
                <div className="bg-carefd-teal-pale/20 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-carefd-navy mb-3 flex items-center gap-2"><FiFileText size={14} /> פרטים עסקיים</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-carefd-gray text-xs">דירוג</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <FiStar className="text-amber-400" size={14} />
                        <span className="font-bold text-carefd-navy">{prov?.rating?.toFixed(1) || '0.0'}</span>
                        <span className="text-carefd-gray text-xs">({prov?.reviews_count || 0} ביקורות)</span>
                      </div>
                    </div>
                    {prov?.experience_years != null && (
                      <div>
                        <p className="text-carefd-gray text-xs">שנות ניסיון</p>
                        <span className="font-medium text-carefd-navy">{prov.experience_years || prov.years_experience || 0}</span>
                      </div>
                    )}
                    {prov?.license_number && (
                      <div>
                        <p className="text-carefd-gray text-xs">מספר רישיון</p>
                        <span className="font-mono text-carefd-navy text-xs">{prov.license_number}</span>
                      </div>
                    )}
                    {prov?.subscription_tier && (
                      <div>
                        <p className="text-carefd-gray text-xs">מנוי</p>
                        <span className={`font-medium ${prov.subscription_tier === 'gold' ? 'text-amber-600' : prov.subscription_tier === 'pro' ? 'text-purple-600' : 'text-carefd-navy'}`}>
                          {prov.subscription_tier === 'gold' ? 'Gold' : prov.subscription_tier === 'pro' ? 'Pro' : 'Free'}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-carefd-gray text-xs">תאריך הצטרפות</p>
                      <span className="text-carefd-navy text-xs">{prov?.created_at ? new Date(prov.created_at).toLocaleDateString('he-IL') : '-'}</span>
                    </div>
                    {prov?.services_count != null && (
                      <div>
                        <p className="text-carefd-gray text-xs">שירותים</p>
                        <span className="font-medium text-carefd-navy">{prov.services_count || 0}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Specializations & Languages */}
                {(prov?.specializations?.length > 0 || prov?.languages?.length > 0) && (
                  <div className="bg-purple-50 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-carefd-navy mb-3 flex items-center gap-2"><FiAward size={14} /> התמחות ושפות</h4>
                    {prov?.specializations?.length > 0 && (
                      <div className="mb-2">
                        <p className="text-carefd-gray text-xs mb-1">התמחויות:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {prov.specializations.map((s, i) => (
                            <span key={i} className="bg-white px-2.5 py-1 rounded-lg text-xs text-purple-700 border border-purple-200">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {prov?.languages?.length > 0 && (
                      <div>
                        <p className="text-carefd-gray text-xs mb-1">שפות:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {prov.languages.map((l, i) => (
                            <span key={i} className="bg-white px-2.5 py-1 rounded-lg text-xs text-blue-700 border border-blue-200">{l}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Bio / About */}
                {(prov?.bio || prov?.about || prov?.description) && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-carefd-navy mb-2">אודות</h4>
                    <p className="text-sm text-carefd-slate leading-relaxed">{prov.bio || prov.about || prov.description}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-gray-200">
                  <Link
                    href={`/providers/${prov?.provider_id}`}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-carefd-navy text-white rounded-xl text-sm font-medium hover:bg-carefd-slate transition"
                    data-testid="modal-view-profile"
                  >
                    <FiEye size={15} />
                    צפה בפרופיל
                  </Link>
                  <Link
                    href={`/admin/providers/${prov?.provider_id}/edit`}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-carefd-teal text-white rounded-xl text-sm font-medium hover:bg-carefd-teal-medium transition"
                    data-testid="modal-edit-provider"
                  >
                    <FiEdit size={15} />
                    עריכה
                  </Link>
                  <button
                    onClick={() => {
                      setShowProviderModal(null);
                      setShowToggleModal(prov);
                    }}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                      prov?.is_active === false
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-amber-500 text-white hover:bg-amber-600'
                    }`}
                    data-testid="modal-toggle-status"
                  >
                    {prov?.is_active === false ? <><FiToggleRight size={15} /> הפעל</> : <><FiSlash size={15} /> השבת</>}
                  </button>
                  {!prov?.is_verified && (
                    <button
                      onClick={() => verifyProvider(prov?.provider_id)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition"
                      data-testid="modal-verify-provider"
                    >
                      <FiShield size={15} />
                      אמת ספק
                    </button>
                  )}
                  <button
                    onClick={() => toggleRecommended(prov?.provider_id, prov?.is_recommended)}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                      prov?.is_recommended
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-purple-500 text-white hover:bg-purple-600'
                    }`}
                    data-testid="modal-toggle-recommend"
                  >
                    <FiAward size={15} />
                    {prov?.is_recommended ? 'הסר המלצה' : 'המלץ'}
                  </button>
                  <button
                    onClick={() => {
                      setShowProviderModal(null);
                      setShowDeleteModal(prov);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition"
                    data-testid="modal-delete-provider"
                  >
                    <FiTrash2 size={15} />
                    מחק
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Provider Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 border border-gray-200 shadow-xl">
            <h3 className="text-lg font-bold text-carefd-navy mb-2">מחיקת ספק</h3>
            <p className="text-carefd-slate mb-4">
              האם אתה בטוח שברצונך למחוק את הספק "{showDeleteModal.business_name}"?
              <br />
              <span className="text-red-500 text-sm">פעולה זו תמחק גם את כל השירותים של הספק ולא ניתנת לביטול.</span>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(null)} className="flex-1 px-4 py-2.5 bg-gray-100 text-carefd-navy rounded-lg hover:bg-gray-200 transition">ביטול</button>
              <button onClick={() => deleteProvider(showDeleteModal.provider_id)} className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">מחק</button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Status Modal */}
      {showToggleModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 border border-gray-200 shadow-xl">
            <h3 className="text-lg font-bold text-carefd-navy mb-2">
              {showToggleModal.is_active === false ? 'הפעלת ספק' : 'השבתת ספק'}
            </h3>
            <p className="text-carefd-slate mb-4">
              {showToggleModal.is_active === false 
                ? `האם אתה בטוח שברצונך להפעיל את הספק "${showToggleModal.business_name}"? הספק יופיע שוב בתוצאות החיפוש.`
                : `האם אתה בטוח שברצונך להשבית את הספק "${showToggleModal.business_name}"? הספק לא יופיע בתוצאות החיפוש.`
              }
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowToggleModal(null)} className="flex-1 px-4 py-2.5 bg-gray-100 text-carefd-navy rounded-lg hover:bg-gray-200 transition">ביטול</button>
              <button
                onClick={() => toggleProviderStatus(showToggleModal.provider_id, showToggleModal.is_active !== false)}
                className={`flex-1 px-4 py-2.5 text-white rounded-lg transition ${showToggleModal.is_active === false ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-amber-500 hover:bg-amber-600'}`}
              >
                {showToggleModal.is_active === false ? 'הפעל' : 'השבת'}
              </button>
            </div>
          </div>
        </div>
      )}
    
    </>
  );
};


