"use client";

import {  useState, useEffect  } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import { toast } from "sonner";
import {
  FiShield, FiCheck, FiX, FiEye, FiFile, FiUser,
  FiCalendar, FiMapPin, FiMail, FiPhone, FiDownload
} from 'react-icons/fi';

export default function AdminVerification() {
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
      const data = await api.get('/admin/providers/pending');
      setPendingProviders(data.providers || []);
    } catch (error) {
      console.error('Failed to fetch pending providers:', error);
      toast.error('שגיאה בטעינת ספקים ממתינים');
    } finally {
      setLoading(false);
    }
  };

  const verifyProvider = async (providerId) => {
    try {
      await api.put(`/admin/providers/${providerId}/verify`);
      toast.success('הספק אומת בהצלחה');
      fetchPendingProviders();
    } catch (error) {
      console.error('Failed to verify provider:', error);
      toast.error(error?.data?.detail || error?.message || 'שגיאה באימות הספק');
    }
  };

  const rejectProvider = async () => {
    if (!showRejectModal || !rejectReason.trim()) return;

    try {
      await api.put(`/admin/providers/${showRejectModal}/reject`, { reason: rejectReason });
      toast.success('הבקשה נדחתה');
      setShowRejectModal(null);
      setRejectReason('');
      fetchPendingProviders();
    } catch (error) {
      console.error('Failed to reject provider:', error);
      toast.error(error?.data?.detail || error?.message || 'שגיאה בדחיית הבקשה');
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
    <>
    
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-carefd-navy">אימות ספקים</h1>
            <p className="text-carefd-slate mt-1">{pendingProviders.length} ספקים ממתינים לאימות</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-amber-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <FiShield className="text-amber-400" size={20} />
              </div>
              <div>
                <p className="text-carefd-slate text-sm">ממתינים לאימות</p>
                <p className="text-2xl font-bold text-amber-400">{pendingProviders.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <FiFile className="text-blue-400" size={20} />
              </div>
              <div>
                <p className="text-carefd-slate text-sm">עם מסמכים</p>
                <p className="text-2xl font-bold text-carefd-navy">
                  {pendingProviders.filter(p => p.verification_documents?.length > 0).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-500/20 rounded-lg flex items-center justify-center">
                <FiUser className="text-carefd-slate" size={20} />
              </div>
              <div>
                <p className="text-carefd-slate text-sm">ללא מסמכים</p>
                <p className="text-2xl font-bold text-carefd-navy">
                  {pendingProviders.filter(p => !p.verification_documents?.length).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Providers List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-carefd-teal border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : pendingProviders.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <FiCheck className="mx-auto text-emerald-400 mb-4" size={48} />
            <h3 className="text-carefd-navy text-lg font-medium">אין ספקים ממתינים</h3>
            <p className="text-carefd-slate mt-2">כל הבקשות טופלו</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingProviders.map((provider) => (
              <div 
                key={provider.provider_id} 
                className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-amber-500/50 transition"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    {/* Provider Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-carefd-teal to-carefd-navy rounded-xl flex items-center justify-center text-carefd-navy text-2xl font-medium">
                          {provider.business_name?.[0] || 'P'}
                        </div>
                        <div>
                          <h3 className="text-carefd-navy text-lg font-semibold">{provider.business_name || 'ללא שם'}</h3>
                          <p className="text-carefd-slate">{provider.provider_type}</p>
                          
                          <div className="flex flex-wrap gap-4 mt-3 text-sm">
                            {provider.user_info?.email && (
                              <span className="flex items-center gap-1 text-carefd-slate">
                                <FiMail size={14} />
                                {provider.user_info.email}
                              </span>
                            )}
                            {provider.location?.city && (
                              <span className="flex items-center gap-1 text-carefd-slate">
                                <FiMapPin size={14} />
                                {provider.location.city}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-carefd-slate">
                              <FiCalendar size={14} />
                              נרשם: {new Date(provider.created_at).toLocaleDateString('he-IL')}
                            </span>
                          </div>

                          {provider.specializations?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {provider.specializations.map((spec, idx) => (
                                <span key={idx} className="bg-gray-50 text-carefd-slate px-2 py-1 rounded text-xs">
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
                          <h4 className="text-carefd-navy font-medium mb-3">מסמכים שהועלו</h4>
                          <div className="flex flex-wrap gap-3">
                            {provider.verification_documents.map((doc, idx) => (
                              <a
                                key={idx}
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-carefd-slate px-4 py-2 rounded-lg transition"
                              >
                                <FiFile className="text-carefd-teal" size={16} />
                                {getDocumentLabel(doc.document_type)}
                                <FiDownload size={14} className="text-carefd-slate" />
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
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-carefd-navy rounded-lg hover:bg-emerald-700 transition font-medium"
                      >
                        <FiCheck size={18} />
                        אשר
                      </button>
                      <button
                        onClick={() => setShowRejectModal(provider.provider_id)}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-carefd-navy rounded-lg hover:bg-red-700 transition font-medium"
                      >
                        <FiX size={18} />
                        דחה
                      </button>
                      <Link
                        href={`/providers/${provider.provider_id}`}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gray-50 text-carefd-navy rounded-lg hover:bg-gray-100 transition font-medium"
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
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-carefd-navy">דחיית בקשה</h2>
            </div>
            <div className="p-6">
              <label className="block text-sm text-carefd-slate mb-2">סיבת הדחייה</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="הסבר מדוע הבקשה נדחתה..."
                rows={4}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-carefd-navy placeholder-carefd-gray focus:border-carefd-teal outline-none resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason('');
                }}
                className="px-6 py-2.5 bg-gray-50 text-carefd-navy rounded-lg hover:bg-gray-100 transition"
              >
                ביטול
              </button>
              <button
                onClick={rejectProvider}
                disabled={!rejectReason.trim()}
                className="px-6 py-2.5 bg-red-600 text-carefd-navy rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                דחה בקשה
              </button>
            </div>
          </div>
        </div>
      )}
    
    </>
  );
};


