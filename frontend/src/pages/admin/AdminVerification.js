import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import {
  FiShield, FiCheck, FiX, FiEye, FiFile, FiUser,
  FiCalendar, FiMapPin, FiMail, FiPhone, FiDownload
} from 'react-icons/fi';

const AdminVerification = () => {
  const [pendingProviders, setPendingProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(null);

  useEffect(() => {
    fetchPendingProviders();
  }, []);

  const fetchPendingProviders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/providers/pending');
      setPendingProviders(response.data.providers || []);
    } catch (error) {
      console.error('Failed to fetch pending providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyProvider = async (providerId) => {
    try {
      await api.put(`/admin/providers/${providerId}/verify`);
      fetchPendingProviders();
    } catch (error) {
      console.error('Failed to verify provider:', error);
    }
  };

  const rejectProvider = async () => {
    if (!showRejectModal || !rejectReason.trim()) return;
    
    try {
      await api.put(`/admin/providers/${showRejectModal}/reject`, { reason: rejectReason });
      setShowRejectModal(null);
      setRejectReason('');
      fetchPendingProviders();
    } catch (error) {
      console.error('Failed to reject provider:', error);
    }
  };

  const getDocumentLabel = (type) => {
    switch (type) {
      case 'id_card': return 'תעודת זהות';
      case 'license': return 'רישיון';
      case 'certificate': return 'תעודה';
      case 'diploma': return 'תואר';
      default: return 'מסמך';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">אימות ספקים</h1>
            <p className="text-slate-400 mt-1">{pendingProviders.length} ספקים ממתינים לאימות</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800 rounded-xl p-4 border border-amber-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <FiShield className="text-amber-400" size={20} />
              </div>
              <div>
                <p className="text-slate-400 text-sm">ממתינים לאימות</p>
                <p className="text-2xl font-bold text-amber-400">{pendingProviders.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <FiFile className="text-blue-400" size={20} />
              </div>
              <div>
                <p className="text-slate-400 text-sm">עם מסמכים</p>
                <p className="text-2xl font-bold text-white">
                  {pendingProviders.filter(p => p.verification_documents?.length > 0).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-500/20 rounded-lg flex items-center justify-center">
                <FiUser className="text-slate-400" size={20} />
              </div>
              <div>
                <p className="text-slate-400 text-sm">ללא מסמכים</p>
                <p className="text-2xl font-bold text-white">
                  {pendingProviders.filter(p => !p.verification_documents?.length).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Providers List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : pendingProviders.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
            <FiCheck className="mx-auto text-emerald-400 mb-4" size={48} />
            <h3 className="text-white text-lg font-medium">אין ספקים ממתינים</h3>
            <p className="text-slate-400 mt-2">כל הבקשות טופלו</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingProviders.map((provider) => (
              <div 
                key={provider.provider_id} 
                className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-amber-500/50 transition"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    {/* Provider Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl font-medium">
                          {provider.business_name?.[0] || 'P'}
                        </div>
                        <div>
                          <h3 className="text-white text-lg font-semibold">{provider.business_name || 'ללא שם'}</h3>
                          <p className="text-slate-400">{provider.provider_type}</p>
                          
                          <div className="flex flex-wrap gap-4 mt-3 text-sm">
                            {provider.user_info?.email && (
                              <span className="flex items-center gap-1 text-slate-400">
                                <FiMail size={14} />
                                {provider.user_info.email}
                              </span>
                            )}
                            {provider.location?.city && (
                              <span className="flex items-center gap-1 text-slate-400">
                                <FiMapPin size={14} />
                                {provider.location.city}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-slate-400">
                              <FiCalendar size={14} />
                              נרשם: {new Date(provider.created_at).toLocaleDateString('he-IL')}
                            </span>
                          </div>

                          {provider.specializations?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {provider.specializations.map((spec, idx) => (
                                <span key={idx} className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs">
                                  {spec}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Documents */}
                      {provider.verification_documents?.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-white font-medium mb-3">מסמכים שהועלו</h4>
                          <div className="flex flex-wrap gap-3">
                            {provider.verification_documents.map((doc, idx) => (
                              <a
                                key={idx}
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg transition"
                              >
                                <FiFile className="text-indigo-400" size={16} />
                                {getDocumentLabel(doc.document_type)}
                                <FiDownload size={14} className="text-slate-400" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row lg:flex-col gap-3">
                      <button
                        onClick={() => verifyProvider(provider.provider_id)}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
                      >
                        <FiCheck size={18} />
                        אשר
                      </button>
                      <button
                        onClick={() => setShowRejectModal(provider.provider_id)}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                      >
                        <FiX size={18} />
                        דחה
                      </button>
                      <Link
                        to={`/providers/${provider.provider_id}`}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition font-medium"
                      >
                        <FiEye size={18} />
                        צפה
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-md border border-slate-700">
            <div className="p-4 border-b border-slate-700">
              <h2 className="text-lg font-bold text-white">דחיית בקשה</h2>
            </div>
            <div className="p-6">
              <label className="block text-sm text-slate-400 mb-2">סיבת הדחייה</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="הסבר מדוע הבקשה נדחתה..."
                rows={4}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-indigo-500 outline-none resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason('');
                }}
                className="px-6 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
              >
                ביטול
              </button>
              <button
                onClick={rejectProvider}
                disabled={!rejectReason.trim()}
                className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                דחה בקשה
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminVerification;
