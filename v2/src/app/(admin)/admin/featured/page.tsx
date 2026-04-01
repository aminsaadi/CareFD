"use client";

import {  useState, useEffect  } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import { toast } from "sonner";
import {
  FiStar, FiTrash2, FiUser, FiSearch,
  FiCheck, FiAward
} from 'react-icons/fi';

export default function AdminFeatured() {
  const [featuredProviders, setFeaturedProviders] = useState([]);
  const [allProviders, setAllProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [featuredData, providersData] = await Promise.all([api.get('/admin/featured'), api.get('/providers?limit=200')]);
      setFeaturedProviders(featuredData.providers || []);
      setAllProviders(providersData.providers || []);
    } catch (error) {
      toast.error('שגיאה בטעינת נתונים');
    } finally {
      setLoading(false);
    }
  };

  const addFeatured = async () => {
    if (!selectedProvider) return;
    try {
      setActionLoading(true);
      await api.put(`/admin/providers/${selectedProvider.provider_id}/recommend`);
      toast.success(`${selectedProvider.business_name} הובלט בהצלחה`);
      setShowAddModal(false);
      setSelectedProvider(null);
      setSearchQuery('');
      fetchData();
    } catch (error) {
      toast.error(error?.data?.detail || error?.message || 'שגיאה בהבלטת ספק');
    } finally {
      setActionLoading(false);
    }
  };

  const removeFeatured = async (provider) => {
    try {
      await confirm({
        title: 'הסרת הבלטה',
        message: `האם אתה בטוח שברצונך להסיר את ההבלטה של ${provider.business_name || 'הספק'}?`,
        type: 'warning',
        confirmText: 'הסר',
        cancelText: 'ביטול'
      });
    } catch {
      return;
    }

    try {
      await api.put(`/admin/providers/${provider.provider_id}/unrecommend`);
      toast.success('ההבלטה הוסרה');
      fetchData();
    } catch (error) {
      toast.error(error?.data?.detail || error?.message || 'שגיאה בהסרת הבלטה');
    }
  };

  const filteredProviders = allProviders.filter(p =>
    (p.business_name?.includes(searchQuery) || p.profession_title?.includes(searchQuery)) &&
    !p.is_recommended
  );

  return (
    <>
    
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-carefd-navy">הבלטת ספקים</h1>
            <p className="text-carefd-slate mt-1">ניהול ספקים מומלצים בתוצאות החיפוש</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
          >
            <FiStar size={18} />
            הבלט ספק
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <FiStar className="text-amber-500" size={20} />
              </div>
              <div>
                <p className="text-carefd-slate text-sm">ספקים מובלטים</p>
                <p className="text-2xl font-bold text-carefd-navy">{featuredProviders.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiUser className="text-blue-500" size={20} />
              </div>
              <div>
                <p className="text-carefd-slate text-sm">סה"כ ספקים</p>
                <p className="text-2xl font-bold text-carefd-navy">{allProviders.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Providers List */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-carefd-navy">ספקים מובלטים</h2>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-4 border-carefd-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : featuredProviders.length === 0 ? (
            <div className="py-12 text-center text-carefd-slate">
              <FiAward className="mx-auto mb-3" size={32} />
              אין ספקים מובלטים. לחץ על "הבלט ספק" להוספה.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-right py-4 px-6 text-carefd-slate font-medium text-sm">ספק</th>
                  <th className="text-right py-4 px-6 text-carefd-slate font-medium text-sm">מקצוע</th>
                  <th className="text-right py-4 px-6 text-carefd-slate font-medium text-sm">דירוג</th>
                  <th className="text-right py-4 px-6 text-carefd-slate font-medium text-sm">סטטוס</th>
                  <th className="text-right py-4 px-6 text-carefd-slate font-medium text-sm">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {featuredProviders.map((provider) => (
                  <tr key={provider.provider_id} className="border-b border-gray-50 hover:bg-gray-50/30 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {provider.profile_image ? (
                          <img src={provider.profile_image} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-medium">
                            {(provider.business_name || 'S')[0]}
                          </div>
                        )}
                        <Link
                          href={`/providers/${provider.provider_id}`}
                          className="text-carefd-navy font-medium hover:text-carefd-teal"
                        >
                          {provider.business_name}
                        </Link>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-carefd-slate">
                      {provider.profession_title || provider.specialization_name || '—'}
                    </td>
                    <td className="py-4 px-6 text-carefd-slate">
                      {provider.rating ? `${Number(provider.rating).toFixed(1)} ⭐` : '—'}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-emerald-100 text-emerald-700">
                        {provider.is_verified ? 'מאומת ומובלט' : 'מובלט'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => removeFeatured(provider)}
                        className="p-2 text-carefd-slate hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="הסר הבלטה"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Featured Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-carefd-navy">הבלט ספק</h2>
              <button
                onClick={() => { setShowAddModal(false); setSelectedProvider(null); setSearchQuery(''); }}
                className="p-2 text-carefd-slate hover:text-carefd-navy hover:bg-gray-50 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="relative">
                <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-carefd-slate" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="חפש ספק..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg pr-10 pl-4 py-2.5 text-carefd-navy placeholder-carefd-gray focus:border-carefd-teal outline-none"
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredProviders.length === 0 ? (
                  <p className="text-center text-carefd-slate py-4">לא נמצאו ספקים</p>
                ) : (
                  filteredProviders.slice(0, 20).map((provider) => (
                    <button
                      key={provider.provider_id}
                      onClick={() => setSelectedProvider(provider)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition ${
                        selectedProvider?.provider_id === provider.provider_id
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-carefd-navy">
                        {(provider.business_name || 'S')[0]}
                      </div>
                      <div className="text-right flex-1">
                        <p className="text-carefd-navy font-medium">{provider.business_name}</p>
                        <p className="text-carefd-slate text-sm">{provider.profession_title || ''}</p>
                      </div>
                      {selectedProvider?.provider_id === provider.provider_id && (
                        <FiCheck className="text-amber-500" size={20} />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100">
              <button
                onClick={() => { setShowAddModal(false); setSelectedProvider(null); setSearchQuery(''); }}
                className="px-6 py-2.5 bg-gray-50 text-carefd-navy rounded-lg hover:bg-gray-100 transition"
              >
                ביטול
              </button>
              <button
                onClick={addFeatured}
                disabled={!selectedProvider || actionLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition disabled:opacity-50"
              >
                <FiStar size={18} />
                {actionLoading ? 'מבליט...' : 'הבלט'}
              </button>
            </div>
          </div>
        </div>
      )}

      
    
    </>
  );
};


