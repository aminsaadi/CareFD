import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import { toast } from 'sonner';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';
import {
  FiStar, FiPlus, FiTrash2, FiCalendar, FiUser, FiSearch,
  FiCheck, FiClock, FiAward
} from 'react-icons/fi';

const AdminFeatured = () => {
  const [featuredProviders, setFeaturedProviders] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [featuredDuration, setFeaturedDuration] = useState(30);
  const [searchQuery, setSearchQuery] = useState('');
  const { confirmState, confirm, closeConfirm } = useConfirm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch featured providers
      const featuredRes = await api.get('/admin/featured-providers');
      setFeaturedProviders(featuredRes.data.featured || []);
      
      // Fetch all providers for selection
      const providersRes = await api.get('/providers?limit=100');
      setProviders(providersRes.data.providers || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Demo data
      setFeaturedProviders([
        {
          featured_id: 'feat_1',
          provider_id: 'prov_1',
          provider_name: 'ד"ר ישראל ישראלי',
          provider_type: 'רופא משפחה',
          start_date: '2024-01-01',
          end_date: '2024-03-31',
          is_active: true
        },
        {
          featured_id: 'feat_2',
          provider_id: 'prov_2',
          provider_name: 'מרפאת שלום',
          provider_type: 'מרפאה',
          start_date: '2024-02-01',
          end_date: '2024-02-28',
          is_active: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const addFeatured = async () => {
    if (!selectedProvider) return;
    
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + featuredDuration);
      
      await api.post('/admin/featured-providers', {
        provider_id: selectedProvider.provider_id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });
      
      setShowAddModal(false);
      setSelectedProvider(null);
      setFeaturedDuration(30);
      fetchData();
    } catch (error) {
      console.error('Failed to add featured:', error);
      // Demo
      setFeaturedProviders(prev => [...prev, {
        featured_id: `feat_${Date.now()}`,
        provider_id: selectedProvider.provider_id,
        provider_name: selectedProvider.business_name,
        provider_type: selectedProvider.provider_type,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + featuredDuration * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true
      }]);
      setShowAddModal(false);
      setSelectedProvider(null);
    }
  };

  const removeFeatured = async (featuredId) => {
    await confirm({
      title: 'הסרת הבלטה',
      message: 'האם אתה בטוח שברצונך להסיר את ההבלטה?',
      type: 'warning',
      confirmText: 'הסר',
      cancelText: 'ביטול'
    });
    
    try {
      await api.delete(`/admin/featured-providers/${featuredId}`);
      fetchData();
    } catch (error) {
      console.error('Failed to remove featured:', error);
      setFeaturedProviders(prev => prev.filter(f => f.featured_id !== featuredId));
    }
  };

  const filteredProviders = providers.filter(p => 
    (p.business_name?.includes(searchQuery) || p.provider_type?.includes(searchQuery)) &&
    !featuredProviders.some(f => f.provider_id === p.provider_id)
  );

  const getDaysRemaining = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-carelink-navy">הבלטת ספקים</h1>
            <p className="text-carelink-slate mt-1">ניהול ספקים מובלטים בתוצאות החיפוש</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-carelink-navy rounded-lg hover:bg-amber-700 transition"
          >
            <FiStar size={18} />
            הבלט ספק
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <FiStar className="text-amber-400" size={20} />
              </div>
              <div>
                <p className="text-carelink-slate text-sm">ספקים מובלטים</p>
                <p className="text-2xl font-bold text-carelink-navy">{featuredProviders.filter(f => f.is_active).length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <FiCheck className="text-emerald-400" size={20} />
              </div>
              <div>
                <p className="text-carelink-slate text-sm">פעילים</p>
                <p className="text-2xl font-bold text-carelink-navy">{featuredProviders.filter(f => f.is_active && getDaysRemaining(f.end_date) > 0).length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <FiClock className="text-red-400" size={20} />
              </div>
              <div>
                <p className="text-carelink-slate text-sm">פג תוקף</p>
                <p className="text-2xl font-bold text-carelink-navy">{featuredProviders.filter(f => getDaysRemaining(f.end_date) <= 0).length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Providers List */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-carelink-navy">ספקים מובלטים</h2>
          </div>
          
          {loading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-4 border-carelink-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : featuredProviders.length === 0 ? (
            <div className="py-12 text-center text-carelink-slate">
              <FiAward className="mx-auto mb-3" size={32} />
              אין ספקים מובלטים. לחץ על "הבלט ספק" להוספה.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-right py-4 px-6 text-carelink-slate font-medium text-sm">ספק</th>
                  <th className="text-right py-4 px-6 text-carelink-slate font-medium text-sm">סוג</th>
                  <th className="text-right py-4 px-6 text-carelink-slate font-medium text-sm">תקופה</th>
                  <th className="text-right py-4 px-6 text-carelink-slate font-medium text-sm">סטטוס</th>
                  <th className="text-right py-4 px-6 text-carelink-slate font-medium text-sm">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {featuredProviders.map((featured) => {
                  const daysRemaining = getDaysRemaining(featured.end_date);
                  const isExpired = daysRemaining <= 0;
                  const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7;
                  
                  return (
                    <tr key={featured.featured_id} className="border-b border-gray-100/50 hover:bg-gray-50/30 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-carelink-navy font-medium">
                            {featured.provider_name?.[0] || 'P'}
                          </div>
                          <div>
                            <Link 
                              to={`/providers/${featured.provider_id}`}
                              className="text-carelink-navy font-medium hover:text-amber-400"
                            >
                              {featured.provider_name}
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-carelink-slate">
                        {featured.provider_type}
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-carelink-slate text-sm flex items-center gap-1">
                          <FiCalendar size={14} />
                          {new Date(featured.start_date).toLocaleDateString('he-IL')} - {new Date(featured.end_date).toLocaleDateString('he-IL')}
                        </div>
                        {!isExpired && (
                          <p className={`text-xs mt-1 ${isExpiringSoon ? 'text-amber-400' : 'text-carelink-gray'}`}>
                            {daysRemaining} ימים נותרו
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${
                          isExpired
                            ? 'bg-red-500/20 text-red-400'
                            : isExpiringSoon
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {isExpired ? 'פג תוקף' : isExpiringSoon ? 'עומד לפוג' : 'פעיל'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => removeFeatured(featured.featured_id)}
                          className="p-2 text-carelink-slate hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Featured Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg border border-gray-100">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-carelink-navy">הבלט ספק</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedProvider(null);
                  setSearchQuery('');
                }}
                className="p-2 text-carelink-slate hover:text-carelink-navy hover:bg-gray-50 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Search */}
              <div className="relative">
                <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-carelink-slate" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="חפש ספק..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg pr-10 pl-4 py-2.5 text-carelink-navy placeholder-carelink-gray focus:border-carelink-teal outline-none"
                />
              </div>

              {/* Provider List */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredProviders.length === 0 ? (
                  <p className="text-center text-carelink-slate py-4">לא נמצאו ספקים</p>
                ) : (
                  filteredProviders.map((provider) => (
                    <button
                      key={provider.provider_id}
                      onClick={() => setSelectedProvider(provider)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition ${
                        selectedProvider?.provider_id === provider.provider_id
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-gray-200 hover:border-slate-500 hover:bg-gray-50/50'
                      }`}
                    >
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-carelink-navy">
                        {provider.business_name?.[0] || 'P'}
                      </div>
                      <div className="text-right flex-1">
                        <p className="text-carelink-navy font-medium">{provider.business_name}</p>
                        <p className="text-carelink-slate text-sm">{provider.provider_type}</p>
                      </div>
                      {selectedProvider?.provider_id === provider.provider_id && (
                        <FiCheck className="text-amber-400" size={20} />
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Duration */}
              {selectedProvider && (
                <div>
                  <label className="block text-sm text-carelink-slate mb-2">תקופת הבלטה</label>
                  <select
                    value={featuredDuration}
                    onChange={(e) => setFeaturedDuration(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carelink-navy focus:border-carelink-teal outline-none"
                  >
                    <option value={7}>שבוע (7 ימים)</option>
                    <option value={14}>שבועיים (14 ימים)</option>
                    <option value={30}>חודש (30 ימים)</option>
                    <option value={60}>חודשיים (60 ימים)</option>
                    <option value={90}>שלושה חודשים (90 ימים)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedProvider(null);
                  setSearchQuery('');
                }}
                className="px-6 py-2.5 bg-gray-50 text-carelink-navy rounded-lg hover:bg-gray-100 transition"
              >
                ביטול
              </button>
              <button
                onClick={addFeatured}
                disabled={!selectedProvider}
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 text-carelink-navy rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
              >
                <FiStar size={18} />
                הבלט
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminFeatured;
