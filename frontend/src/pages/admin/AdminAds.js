import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import {
  FiPlus, FiEdit2, FiTrash2, FiImage, FiExternalLink,
  FiCalendar, FiEye, FiToggleLeft, FiToggleRight, FiMove
} from 'react-icons/fi';

const AdminAds = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [currentAd, setCurrentAd] = useState({
    title: '',
    image_url: '',
    link_url: '',
    position: 'homepage_top',
    start_date: '',
    end_date: '',
    is_active: true
  });

  const positions = [
    { value: 'homepage_top', label: 'דף הבית - עליון' },
    { value: 'homepage_middle', label: 'דף הבית - אמצע' },
    { value: 'sidebar', label: 'סרגל צדדי' },
    { value: 'providers_page', label: 'דף ספקים' },
    { value: 'services_page', label: 'דף שירותים' },
    { value: 'footer', label: 'פוטר' },
  ];

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/ads');
      setAds(response.data.ads || []);
    } catch (error) {
      console.error('Failed to fetch ads:', error);
      // Demo data
      setAds([
        {
          ad_id: 'ad_1',
          title: 'באנר ראשי - חברת ביטוח',
          image_url: 'https://placehold.co/728x90/1a365d/white?text=Banner+Ad',
          link_url: 'https://example.com',
          position: 'homepage_top',
          is_active: true,
          views: 5420,
          clicks: 234,
          start_date: '2024-01-01',
          end_date: '2024-12-31'
        },
        {
          ad_id: 'ad_2',
          title: 'סרגל צדדי - שירותי רפואה',
          image_url: 'https://placehold.co/300x250/2d3748/white?text=Sidebar+Ad',
          link_url: 'https://example.com',
          position: 'sidebar',
          is_active: true,
          views: 3210,
          clicks: 156,
          start_date: '2024-02-01',
          end_date: '2024-06-30'
        },
        {
          ad_id: 'ad_3',
          title: 'קמפיין חורף',
          image_url: 'https://placehold.co/728x90/4a5568/white?text=Winter+Campaign',
          link_url: 'https://example.com',
          position: 'providers_page',
          is_active: false,
          views: 0,
          clicks: 0,
          start_date: '2024-11-01',
          end_date: '2025-02-28'
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const saveAd = async () => {
    try {
      if (editingAd) {
        await api.put(`/admin/ads/${editingAd}`, currentAd);
      } else {
        await api.post('/admin/ads', currentAd);
      }
      setShowEditor(false);
      setEditingAd(null);
      resetForm();
      fetchAds();
    } catch (error) {
      console.error('Failed to save ad:', error);
      // Demo
      setAds(prev => [...prev, {
        ad_id: `ad_${Date.now()}`,
        ...currentAd,
        views: 0,
        clicks: 0
      }]);
      setShowEditor(false);
      resetForm();
    }
  };

  const deleteAd = async (adId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק פרסומת זו?')) return;
    try {
      await api.delete(`/admin/ads/${adId}`);
      fetchAds();
    } catch (error) {
      console.error('Failed to delete ad:', error);
      setAds(prev => prev.filter(a => a.ad_id !== adId));
    }
  };

  const toggleAdStatus = async (ad) => {
    try {
      await api.put(`/admin/ads/${ad.ad_id}`, { is_active: !ad.is_active });
      fetchAds();
    } catch (error) {
      console.error('Failed to toggle ad status:', error);
      setAds(prev => prev.map(a => 
        a.ad_id === ad.ad_id ? { ...a, is_active: !a.is_active } : a
      ));
    }
  };

  const resetForm = () => {
    setCurrentAd({
      title: '',
      image_url: '',
      link_url: '',
      position: 'homepage_top',
      start_date: '',
      end_date: '',
      is_active: true
    });
  };

  const openEditor = (ad = null) => {
    if (ad) {
      setEditingAd(ad.ad_id);
      setCurrentAd({
        title: ad.title,
        image_url: ad.image_url,
        link_url: ad.link_url,
        position: ad.position,
        start_date: ad.start_date || '',
        end_date: ad.end_date || '',
        is_active: ad.is_active
      });
    } else {
      setEditingAd(null);
      resetForm();
    }
    setShowEditor(true);
  };

  const getPositionLabel = (position) => {
    return positions.find(p => p.value === position)?.label || position;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">ניהול פרסומות</h1>
            <p className="text-slate-400 mt-1">ניהול באנרים ומודעות באתר</p>
          </div>
          <button
            onClick={() => openEditor()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <FiPlus size={18} />
            פרסומת חדשה
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">סה"כ פרסומות</p>
            <p className="text-2xl font-bold text-white mt-1">{ads.length}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">פעילות</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{ads.filter(a => a.is_active).length}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">סה"כ צפיות</p>
            <p className="text-2xl font-bold text-white mt-1">{ads.reduce((sum, a) => sum + (a.views || 0), 0).toLocaleString()}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">סה"כ קליקים</p>
            <p className="text-2xl font-bold text-white mt-1">{ads.reduce((sum, a) => sum + (a.clicks || 0), 0).toLocaleString()}</p>
          </div>
        </div>

        {/* Ads List */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-right py-4 px-6 text-slate-400 font-medium text-sm">פרסומת</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium text-sm">מיקום</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium text-sm">צפיות / קליקים</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium text-sm">תקופה</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium text-sm">סטטוס</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium text-sm">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : ads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <FiImage className="mx-auto mb-3" size={32} />
                    אין פרסומות. צור פרסומת ראשונה.
                  </td>
                </tr>
              ) : (
                ads.map((ad) => (
                  <tr key={ad.ad_id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-12 bg-slate-700 rounded overflow-hidden flex-shrink-0">
                          {ad.image_url ? (
                            <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FiImage className="text-slate-500" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{ad.title}</p>
                          {ad.link_url && (
                            <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 text-sm flex items-center gap-1 hover:text-indigo-400">
                              <FiExternalLink size={12} />
                              קישור
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-sm">
                        {getPositionLabel(ad.position)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-sm">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <FiEye size={14} />
                          {(ad.views || 0).toLocaleString()}
                        </span>
                        <span>/</span>
                        <span>{(ad.clicks || 0).toLocaleString()}</span>
                      </div>
                      {ad.views > 0 && (
                        <p className="text-xs text-slate-500">
                          CTR: {((ad.clicks / ad.views) * 100).toFixed(2)}%
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-sm">
                      {ad.start_date && ad.end_date ? (
                        <span className="flex items-center gap-1">
                          <FiCalendar size={14} />
                          {new Date(ad.start_date).toLocaleDateString('he-IL')} - {new Date(ad.end_date).toLocaleDateString('he-IL')}
                        </span>
                      ) : (
                        'ללא הגבלה'
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => toggleAdStatus(ad)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition ${
                          ad.is_active 
                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                            : 'bg-slate-600/50 text-slate-400 hover:bg-slate-600'
                        }`}
                      >
                        {ad.is_active ? <FiToggleRight size={16} /> : <FiToggleLeft size={16} />}
                        {ad.is_active ? 'פעיל' : 'מושבת'}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditor(ad)}
                          className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => deleteAd(ad.ad_id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-2xl border border-slate-700">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-lg font-bold text-white">
                {editingAd ? 'עריכת פרסומת' : 'פרסומת חדשה'}
              </h2>
              <button
                onClick={() => setShowEditor(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">כותרת (פנימית)</label>
                <input
                  type="text"
                  value={currentAd.title}
                  onChange={(e) => setCurrentAd(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="שם הקמפיין / הפרסומת"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">תמונת באנר (URL)</label>
                <input
                  type="text"
                  value={currentAd.image_url}
                  onChange={(e) => setCurrentAd(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:border-indigo-500 outline-none"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">קישור יעד</label>
                <input
                  type="text"
                  value={currentAd.link_url}
                  onChange={(e) => setCurrentAd(prev => ({ ...prev, link_url: e.target.value }))}
                  placeholder="https://example.com"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:border-indigo-500 outline-none"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">מיקום</label>
                <select
                  value={currentAd.position}
                  onChange={(e) => setCurrentAd(prev => ({ ...prev, position: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:border-indigo-500 outline-none"
                >
                  {positions.map((pos) => (
                    <option key={pos.value} value={pos.value}>{pos.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">תאריך התחלה</label>
                  <input
                    type="date"
                    value={currentAd.start_date}
                    onChange={(e) => setCurrentAd(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">תאריך סיום</label>
                  <input
                    type="date"
                    value={currentAd.end_date}
                    onChange={(e) => setCurrentAd(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentAd.is_active}
                    onChange={(e) => setCurrentAd(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
                <span className="text-slate-300">פעיל</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700">
              <button
                onClick={() => setShowEditor(false)}
                className="px-6 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
              >
                ביטול
              </button>
              <button
                onClick={saveAd}
                disabled={!currentAd.title.trim() || !currentAd.image_url.trim()}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                שמור
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAds;
