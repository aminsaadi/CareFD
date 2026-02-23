import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import { toast } from 'sonner';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';
import {
  FiPlus, FiEdit2, FiTrash2, FiMapPin, FiX, FiChevronDown,
  FiSearch, FiSave, FiLoader, FiGlobe, FiMap
} from 'react-icons/fi';

const AdminRegions = () => {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedRegion, setExpandedRegion] = useState(null);
  const [showAddRegion, setShowAddRegion] = useState(false);
  const [editingRegion, setEditingRegion] = useState(null);
  const [showAddCity, setShowAddCity] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form states
  const [regionForm, setRegionForm] = useState({ name: '', name_en: '' });
  const [cityForm, setCityForm] = useState({ name: '', name_en: '', lat: '', lng: '' });
  
  const { confirmState, confirm, closeConfirm } = useConfirm();

  const fetchRegions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/regions');
      setRegions(response.data.regions || []);
    } catch (error) {
      console.error('Failed to fetch regions:', error);
      toast.error('שגיאה בטעינת האזורים');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  const addRegion = async () => {
    if (!regionForm.name.trim()) {
      toast.error('נא להזין שם אזור');
      return;
    }
    
    setSaving(true);
    try {
      await api.post('/admin/regions', {
        name: regionForm.name,
        name_en: regionForm.name_en,
        cities: []
      });
      toast.success('האזור נוסף בהצלחה');
      setRegionForm({ name: '', name_en: '' });
      setShowAddRegion(false);
      fetchRegions();
    } catch (error) {
      console.error('Failed to add region:', error);
      toast.error('שגיאה בהוספת אזור');
    } finally {
      setSaving(false);
    }
  };

  const updateRegion = async () => {
    if (!editingRegion || !regionForm.name.trim()) return;
    
    setSaving(true);
    try {
      await api.put(`/admin/regions/${editingRegion}`, {
        name: regionForm.name,
        name_en: regionForm.name_en
      });
      toast.success('האזור עודכן בהצלחה');
      setEditingRegion(null);
      setRegionForm({ name: '', name_en: '' });
      fetchRegions();
    } catch (error) {
      console.error('Failed to update region:', error);
      toast.error('שגיאה בעדכון אזור');
    } finally {
      setSaving(false);
    }
  };

  const deleteRegion = async (regionId, regionName) => {
    const confirmed = await confirm({
      title: 'מחיקת אזור',
      message: `האם אתה בטוח שברצונך למחוק את האזור "${regionName}"?`,
      type: 'danger',
      confirmText: 'מחק',
      cancelText: 'ביטול'
    });
    
    if (!confirmed) return;
    
    try {
      await api.delete(`/admin/regions/${regionId}`);
      toast.success('האזור נמחק בהצלחה');
      fetchRegions();
    } catch (error) {
      console.error('Failed to delete region:', error);
      toast.error('שגיאה במחיקת אזור');
    }
  };

  const addCity = async () => {
    if (!showAddCity || !cityForm.name.trim()) {
      toast.error('נא להזין שם עיר');
      return;
    }
    
    setSaving(true);
    try {
      await api.post(`/admin/regions/${showAddCity}/cities`, {
        name: cityForm.name,
        name_en: cityForm.name_en,
        lat: cityForm.lat ? parseFloat(cityForm.lat) : null,
        lng: cityForm.lng ? parseFloat(cityForm.lng) : null
      });
      toast.success('העיר נוספה בהצלחה');
      setCityForm({ name: '', name_en: '', lat: '', lng: '' });
      setShowAddCity(null);
      fetchRegions();
    } catch (error) {
      console.error('Failed to add city:', error);
      toast.error('שגיאה בהוספת עיר');
    } finally {
      setSaving(false);
    }
  };

  const removeCity = async (regionId, city) => {
    const cityName = typeof city === 'string' ? city : city.name;
    
    const confirmed = await confirm({
      title: 'הסרת עיר',
      message: `האם אתה בטוח שברצונך להסיר את "${cityName}"?`,
      type: 'danger',
      confirmText: 'הסר',
      cancelText: 'ביטול'
    });
    
    if (!confirmed) return;
    
    try {
      await api.delete(`/admin/regions/${regionId}/cities/${encodeURIComponent(cityName)}`);
      toast.success('העיר הוסרה בהצלחה');
      fetchRegions();
    } catch (error) {
      console.error('Failed to remove city:', error);
      toast.error('שגיאה בהסרת עיר');
    }
  };

  const openEditRegion = (region) => {
    setRegionForm({ name: region.name, name_en: region.name_en || '' });
    setEditingRegion(region.region_id);
  };

  const getCityName = (city) => typeof city === 'string' ? city : city.name;
  const getCityNameEn = (city) => typeof city === 'string' ? '' : city.name_en;
  const hasCoordinates = (city) => typeof city === 'object' && city.lat && city.lng;

  const filteredRegions = regions.filter(r => 
    r.name?.includes(searchQuery) || 
    r.name_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.cities?.some(c => getCityName(c).includes(searchQuery))
  );

  // Count total cities
  const totalCities = regions.reduce((acc, r) => acc + (r.cities?.length || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-carelink-navy">אזורים וערים</h1>
            <p className="text-carelink-slate mt-1">
              ניהול אזורים גיאוגרפיים • {regions.length} אזורים • {totalCities} ערים
            </p>
          </div>
          <button
            onClick={() => setShowAddRegion(true)}
            className="flex items-center gap-2 px-4 py-2 bg-carelink-teal text-carelink-navy rounded-lg hover:bg-carelink-teal/90 transition"
            data-testid="add-region-btn"
          >
            <FiPlus size={18} />
            הוסף אזור
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="relative">
            <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-carelink-slate" size={18} />
            <input
              type="text"
              placeholder="חפש אזור או עיר..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pr-10 pl-4 py-2.5 text-carelink-navy placeholder-carelink-gray focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
              data-testid="search-region-input"
            />
          </div>
        </div>

        {/* Regions List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-carelink-teal border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredRegions.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
              <FiMap className="mx-auto text-slate-600 mb-4" size={48} />
              <p className="text-carelink-slate">לא נמצאו אזורים</p>
            </div>
          ) : (
            filteredRegions.map((region) => (
              <div key={region.region_id} className="bg-white rounded-xl border border-gray-100 overflow-hidden" data-testid={`region-${region.region_id}`}>
                {/* Region Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/30 transition"
                  onClick={() => setExpandedRegion(expandedRegion === region.region_id ? null : region.region_id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-carelink-teal/20 rounded-lg flex items-center justify-center">
                      <FiGlobe className="text-carelink-teal" size={20} />
                    </div>
                    <div>
                      <h3 className="text-carelink-navy font-medium">{region.name}</h3>
                      <p className="text-carelink-slate text-sm">
                        {region.name_en && `${region.name_en} • `}
                        {region.cities?.length || 0} ערים
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditRegion(region);
                      }}
                      className="p-2 text-carelink-slate hover:text-carelink-teal hover:bg-carelink-teal/10 rounded-lg transition"
                      title="ערוך אזור"
                    >
                      <FiEdit2 size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAddCity(region.region_id);
                      }}
                      className="p-2 text-carelink-slate hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition"
                      title="הוסף עיר"
                    >
                      <FiPlus size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRegion(region.region_id, region.name);
                      }}
                      className="p-2 text-carelink-slate hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      title="מחק אזור"
                    >
                      <FiTrash2 size={18} />
                    </button>
                    <FiChevronDown 
                      className={`text-carelink-slate transition-transform ${expandedRegion === region.region_id ? 'rotate-180' : ''}`}
                      size={20}
                    />
                  </div>
                </div>

                {/* Cities List */}
                {expandedRegion === region.region_id && (
                  <div className="border-t border-gray-100 p-4">
                    {!region.cities || region.cities.length === 0 ? (
                      <p className="text-carelink-gray text-center py-4">אין ערים באזור זה</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {region.cities.map((city, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg group hover:border-carelink-teal/50 transition"
                          >
                            <FiMapPin className="text-carelink-teal" size={14} />
                            <div className="flex flex-col">
                              <span className="text-carelink-navy text-sm font-medium">{getCityName(city)}</span>
                              {getCityNameEn(city) && (
                                <span className="text-carelink-gray text-xs">{getCityNameEn(city)}</span>
                              )}
                            </div>
                            {hasCoordinates(city) && (
                              <span className="text-emerald-500 text-xs" title={`${city.lat}, ${city.lng}`}>
                                📍
                              </span>
                            )}
                            <button
                              onClick={() => removeCity(region.region_id, city)}
                              className="text-carelink-gray hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                              title="הסר עיר"
                            >
                              <FiX size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Region Modal */}
      {(showAddRegion || editingRegion) && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-carelink-navy mb-4">
              {editingRegion ? 'עריכת אזור' : 'הוסף אזור חדש'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-carelink-slate mb-1">שם האזור בעברית *</label>
                <input
                  type="text"
                  value={regionForm.name}
                  onChange={(e) => setRegionForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="לדוגמה: צפון"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carelink-navy placeholder-carelink-gray focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
                  data-testid="region-name-input"
                />
              </div>
              <div>
                <label className="block text-sm text-carelink-slate mb-1">שם באנגלית</label>
                <input
                  type="text"
                  value={regionForm.name_en}
                  onChange={(e) => setRegionForm(prev => ({ ...prev, name_en: e.target.value }))}
                  placeholder="e.g. North"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carelink-navy placeholder-carelink-gray focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
                  dir="ltr"
                  data-testid="region-name-en-input"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddRegion(false);
                  setEditingRegion(null);
                  setRegionForm({ name: '', name_en: '' });
                }}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-carelink-navy rounded-lg hover:bg-gray-200 transition"
              >
                ביטול
              </button>
              <button
                onClick={editingRegion ? updateRegion : addRegion}
                disabled={!regionForm.name.trim() || saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-carelink-teal text-carelink-navy rounded-lg hover:bg-carelink-teal/90 transition disabled:opacity-50"
                data-testid="save-region-btn"
              >
                {saving ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />}
                {editingRegion ? 'שמור' : 'הוסף'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add City Modal */}
      {showAddCity && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-carelink-navy mb-4">הוסף עיר חדשה</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-carelink-slate mb-1">שם העיר בעברית *</label>
                <input
                  type="text"
                  value={cityForm.name}
                  onChange={(e) => setCityForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="לדוגמה: תל אביב"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carelink-navy placeholder-carelink-gray focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
                  data-testid="city-name-input"
                />
              </div>
              <div>
                <label className="block text-sm text-carelink-slate mb-1">שם באנגלית</label>
                <input
                  type="text"
                  value={cityForm.name_en}
                  onChange={(e) => setCityForm(prev => ({ ...prev, name_en: e.target.value }))}
                  placeholder="e.g. Tel Aviv"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carelink-navy placeholder-carelink-gray focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
                  dir="ltr"
                  data-testid="city-name-en-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-carelink-slate mb-1">קו רוחב (Lat)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={cityForm.lat}
                    onChange={(e) => setCityForm(prev => ({ ...prev, lat: e.target.value }))}
                    placeholder="32.0853"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carelink-navy placeholder-carelink-gray focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm text-carelink-slate mb-1">קו אורך (Lng)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={cityForm.lng}
                    onChange={(e) => setCityForm(prev => ({ ...prev, lng: e.target.value }))}
                    placeholder="34.7818"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carelink-navy placeholder-carelink-gray focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
                    dir="ltr"
                  />
                </div>
              </div>
              <p className="text-xs text-carelink-gray">
                💡 ניתן למצוא קואורדינטות ב-Google Maps (לחיצה ימנית על מיקום)
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddCity(null);
                  setCityForm({ name: '', name_en: '', lat: '', lng: '' });
                }}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-carelink-navy rounded-lg hover:bg-gray-200 transition"
              >
                ביטול
              </button>
              <button
                onClick={addCity}
                disabled={!cityForm.name.trim() || saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-carelink-teal text-carelink-navy rounded-lg hover:bg-carelink-teal/90 transition disabled:opacity-50"
                data-testid="save-city-btn"
              >
                {saving ? <FiLoader className="animate-spin" size={18} /> : <FiPlus size={18} />}
                הוסף
              </button>
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
    </AdminLayout>
  );
};

export default AdminRegions;
