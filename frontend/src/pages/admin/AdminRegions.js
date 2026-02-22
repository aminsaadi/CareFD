import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import { toast } from 'sonner';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';
import {
  FiPlus, FiEdit2, FiTrash2, FiMapPin, FiX, FiChevronDown
} from 'react-icons/fi';

const AdminRegions = () => {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRegion, setExpandedRegion] = useState(null);
  const [showAddRegion, setShowAddRegion] = useState(false);
  const [newRegionName, setNewRegionName] = useState('');
  const [editingRegion, setEditingRegion] = useState(null);
  const [newCityName, setNewCityName] = useState('');
  const [addingCityTo, setAddingCityTo] = useState(null);
  const { confirmState, confirm, closeConfirm } = useConfirm();

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/regions');
      setRegions(response.data.regions || []);
    } catch (error) {
      console.error('Failed to fetch regions:', error);
    } finally {
      setLoading(false);
    }
  };

  const addRegion = async () => {
    if (!newRegionName.trim()) return;
    try {
      await api.post('/admin/regions', { name: newRegionName, cities: [] });
      setNewRegionName('');
      setShowAddRegion(false);
      fetchRegions();
    } catch (error) {
      console.error('Failed to add region:', error);
    }
  };

  const updateRegion = async (regionId, data) => {
    try {
      await api.put(`/admin/regions/${regionId}`, data);
      setEditingRegion(null);
      fetchRegions();
    } catch (error) {
      console.error('Failed to update region:', error);
    }
  };

  const deleteRegion = async (regionId) => {
    await confirm({
      title: 'מחיקת אזור',
      message: 'האם אתה בטוח שברצונך למחוק אזור זה?',
      type: 'danger',
      confirmText: 'מחק',
      cancelText: 'ביטול'
    });
    try {
      await api.delete(`/admin/regions/${regionId}`);
      fetchRegions();
    } catch (error) {
      console.error('Failed to delete region:', error);
    }
  };

  const addCity = async (regionId) => {
    if (!newCityName.trim()) return;
    try {
      await api.post(`/admin/regions/${regionId}/cities`, { city: newCityName });
      setNewCityName('');
      setAddingCityTo(null);
      fetchRegions();
    } catch (error) {
      console.error('Failed to add city:', error);
    }
  };

  const removeCity = async (regionId, cityName) => {
    try {
      await api.delete(`/admin/regions/${regionId}/cities/${encodeURIComponent(cityName)}`);
      fetchRegions();
    } catch (error) {
      console.error('Failed to remove city:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-carelink-navy">אזורים וערים</h1>
            <p className="text-carelink-slate mt-1">ניהול אזורים גיאוגרפיים לחיפוש</p>
          </div>
          <button
            onClick={() => setShowAddRegion(true)}
            className="flex items-center gap-2 px-4 py-2 bg-carelink-teal text-carelink-navy rounded-lg hover:bg-carelink-teal/90 transition"
          >
            <FiPlus size={18} />
            הוסף אזור
          </button>
        </div>

        {/* Add Region Form */}
        {showAddRegion && (
          <div className="bg-white rounded-xl p-4 border border-carelink-teal/50">
            <h3 className="text-carelink-navy font-medium mb-3">אזור חדש</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newRegionName}
                onChange={(e) => setNewRegionName(e.target.value)}
                placeholder="שם האזור..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carelink-navy placeholder-carelink-gray focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
                autoFocus
              />
              <button
                onClick={addRegion}
                disabled={!newRegionName.trim()}
                className="px-6 py-2.5 bg-carelink-teal text-carelink-navy rounded-lg hover:bg-carelink-teal/90 transition disabled:opacity-50"
              >
                הוסף
              </button>
              <button
                onClick={() => {
                  setShowAddRegion(false);
                  setNewRegionName('');
                }}
                className="px-4 py-2.5 bg-gray-50 text-carelink-slate rounded-lg hover:bg-gray-100 transition"
              >
                ביטול
              </button>
            </div>
          </div>
        )}

        {/* Regions List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-carelink-teal border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : regions.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
              <FiMapPin className="mx-auto text-slate-600 mb-4" size={48} />
              <p className="text-carelink-slate">לא הוגדרו אזורים</p>
              <button
                onClick={() => setShowAddRegion(true)}
                className="mt-4 text-carelink-teal hover:text-indigo-300"
              >
                הוסף אזור ראשון
              </button>
            </div>
          ) : (
            regions.map((region) => (
              <div key={region.region_id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {/* Region Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/30 transition"
                  onClick={() => setExpandedRegion(expandedRegion === region.region_id ? null : region.region_id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-carelink-teal/20 rounded-lg flex items-center justify-center">
                      <FiMapPin className="text-carelink-teal" size={20} />
                    </div>
                    <div>
                      {editingRegion === region.region_id ? (
                        <input
                          type="text"
                          defaultValue={region.name}
                          className="bg-gray-50 border border-carelink-teal rounded px-2 py-1 text-carelink-navy focus:outline-none"
                          onClick={(e) => e.stopPropagation()}
                          onBlur={(e) => updateRegion(region.region_id, { name: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateRegion(region.region_id, { name: e.target.value });
                            }
                            if (e.key === 'Escape') {
                              setEditingRegion(null);
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <h3 className="text-carelink-navy font-medium">{region.name}</h3>
                      )}
                      <p className="text-carelink-slate text-sm">{region.cities?.length || 0} ערים</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingRegion(region.region_id);
                      }}
                      className="p-2 text-carelink-slate hover:text-carelink-teal hover:bg-carelink-teal/10 rounded-lg transition"
                    >
                      <FiEdit2 size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRegion(region.region_id);
                      }}
                      className="p-2 text-carelink-slate hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                    >
                      <FiTrash2 size={18} />
                    </button>
                    <FiChevronDown 
                      className={`text-carelink-slate transition-transform ${expandedRegion === region.region_id ? 'rotate-180' : ''}`}
                      size={20}
                    />
                  </div>
                </div>

                {/* Cities */}
                {expandedRegion === region.region_id && (
                  <div className="border-t border-gray-100 p-4">
                    {/* Existing Cities */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {region.cities?.length === 0 ? (
                        <p className="text-carelink-gray">אין ערים באזור זה</p>
                      ) : (
                        region.cities?.map((city) => (
                          <span
                            key={city}
                            className="inline-flex items-center gap-2 bg-gray-50 text-carelink-slate px-3 py-1.5 rounded-lg text-sm group"
                          >
                            {city}
                            <button
                              onClick={() => removeCity(region.region_id, city)}
                              className="text-carelink-gray hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                            >
                              <FiX size={14} />
                            </button>
                          </span>
                        ))
                      )}
                    </div>

                    {/* Add City */}
                    {addingCityTo === region.region_id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCityName}
                          onChange={(e) => setNewCityName(e.target.value)}
                          placeholder="שם העיר..."
                          className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-carelink-navy text-sm placeholder-carelink-gray focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') addCity(region.region_id);
                            if (e.key === 'Escape') {
                              setAddingCityTo(null);
                              setNewCityName('');
                            }
                          }}
                        />
                        <button
                          onClick={() => addCity(region.region_id)}
                          disabled={!newCityName.trim()}
                          className="px-4 py-2 bg-carelink-teal text-carelink-navy rounded-lg text-sm hover:bg-carelink-teal/90 transition disabled:opacity-50"
                        >
                          הוסף
                        </button>
                        <button
                          onClick={() => {
                            setAddingCityTo(null);
                            setNewCityName('');
                          }}
                          className="px-4 py-2 bg-gray-50 text-carelink-slate rounded-lg text-sm hover:bg-gray-100 transition"
                        >
                          ביטול
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingCityTo(region.region_id)}
                        className="flex items-center gap-2 text-carelink-teal hover:text-indigo-300 text-sm"
                      >
                        <FiPlus size={16} />
                        הוסף עיר
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      
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
