import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import { toast } from 'sonner';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';
import {
  FiPlus, FiEdit2, FiTrash2, FiChevronDown, FiChevronRight,
  FiGrid, FiTag, FiLayers, FiSearch, FiSave, FiX
} from 'react-icons/fi';

const AdminProfessions = () => {
  const [professions, setProfessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedProfession, setExpandedProfession] = useState(null);
  const [expandedSubProfession, setExpandedSubProfession] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(null); // 'profession', 'sub', 'category'
  const [newItemName, setNewItemName] = useState('');
  const [newItemNameEn, setNewItemNameEn] = useState('');
  const [selectedParent, setSelectedParent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { confirmState, confirm, closeConfirm } = useConfirm();

  useEffect(() => {
    fetchProfessions();
  }, []);

  const fetchProfessions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/professions');
      setProfessions(response.data.professions || []);
    } catch (error) {
      console.error('Failed to fetch professions:', error);
      // Initialize with default structure if API doesn't exist
      setProfessions([
        {
          profession_id: 'prof_1',
          name: 'רפואה',
          name_en: 'Medicine',
          sub_professions: [
            {
              sub_profession_id: 'sub_1',
              name: 'רפואת משפחה',
              name_en: 'Family Medicine',
              categories: [
                { category_id: 'cat_1', name: 'ביקור בית', name_en: 'Home Visit' },
                { category_id: 'cat_2', name: 'בדיקה כללית', name_en: 'General Checkup' }
              ]
            },
            {
              sub_profession_id: 'sub_2',
              name: 'ילדים',
              name_en: 'Pediatrics',
              categories: []
            }
          ]
        },
        {
          profession_id: 'prof_2',
          name: 'סיעוד',
          name_en: 'Nursing',
          sub_professions: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async () => {
    if (!newItemName.trim()) return;

    try {
      if (showAddModal === 'profession') {
        await api.post('/admin/professions', {
          name: newItemName,
          name_en: newItemNameEn
        });
      } else if (showAddModal === 'sub') {
        await api.post(`/admin/professions/${selectedParent}/sub-professions`, {
          name: newItemName,
          name_en: newItemNameEn
        });
      } else if (showAddModal === 'category') {
        await api.post(`/admin/sub-professions/${selectedParent}/categories`, {
          name: newItemName,
          name_en: newItemNameEn
        });
      }
      
      fetchProfessions();
      setShowAddModal(null);
      setNewItemName('');
      setNewItemNameEn('');
      setSelectedParent(null);
    } catch (error) {
      console.error('Failed to add item:', error);
      // For demo, add locally
      if (showAddModal === 'profession') {
        setProfessions(prev => [...prev, {
          profession_id: `prof_${Date.now()}`,
          name: newItemName,
          name_en: newItemNameEn,
          sub_professions: []
        }]);
      }
      setShowAddModal(null);
      setNewItemName('');
      setNewItemNameEn('');
    }
  };

  const deleteItem = async (type, id) => {
    await confirm({
      title: 'מחיקה',
      message: 'האם אתה בטוח שברצונך למחוק?',
      type: 'danger',
      confirmText: 'מחק',
      cancelText: 'ביטול'
    });
    
    try {
      await api.delete(`/admin/${type}/${id}`);
      fetchProfessions();
    } catch (error) {
      console.error('Failed to delete:', error);
      // For demo, remove locally
      if (type === 'professions') {
        setProfessions(prev => prev.filter(p => p.profession_id !== id));
      }
    }
  };

  const filteredProfessions = professions.filter(p => 
    p.name.includes(searchQuery) || 
    p.name_en?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-carelink-navy">מקצועות וקטגוריות</h1>
            <p className="text-carelink-slate mt-1">ניהול היררכיית המקצועות באתר</p>
          </div>
          <button
            onClick={() => setShowAddModal('profession')}
            className="flex items-center gap-2 px-4 py-2 bg-carelink-teal text-carelink-navy rounded-lg hover:bg-carelink-teal/90 transition"
          >
            <FiPlus size={18} />
            הוסף מקצוע
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="relative">
            <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-carelink-slate" size={18} />
            <input
              type="text"
              placeholder="חפש מקצוע..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pr-10 pl-4 py-2.5 text-carelink-navy placeholder-carelink-gray focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
            />
          </div>
        </div>

        {/* Hierarchy Guide */}
        <div className="bg-white/50 rounded-xl p-4 border border-gray-100 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-carelink-teal rounded"></div>
            <span className="text-carelink-slate text-sm">מקצוע</span>
          </div>
          <FiChevronRight className="text-slate-600" />
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <span className="text-carelink-slate text-sm">תת-מקצוע</span>
          </div>
          <FiChevronRight className="text-slate-600" />
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-500 rounded"></div>
            <span className="text-carelink-slate text-sm">קטגוריה</span>
          </div>
        </div>

        {/* Professions List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-carelink-teal border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredProfessions.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
              <FiGrid className="mx-auto text-slate-600 mb-4" size={48} />
              <p className="text-carelink-slate">לא נמצאו מקצועות</p>
            </div>
          ) : (
            filteredProfessions.map((profession) => (
              <div key={profession.profession_id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {/* Profession Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/30 transition"
                  onClick={() => setExpandedProfession(expandedProfession === profession.profession_id ? null : profession.profession_id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-carelink-teal/20 rounded-lg flex items-center justify-center">
                      <FiGrid className="text-carelink-teal" size={20} />
                    </div>
                    <div>
                      <h3 className="text-carelink-navy font-medium">{profession.name}</h3>
                      <p className="text-carelink-slate text-sm">{profession.name_en} • {profession.sub_professions?.length || 0} תתי-מקצועות</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedParent(profession.profession_id);
                        setShowAddModal('sub');
                      }}
                      className="p-2 text-carelink-slate hover:text-carelink-teal hover:bg-carelink-teal/10 rounded-lg transition"
                    >
                      <FiPlus size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteItem('professions', profession.profession_id);
                      }}
                      className="p-2 text-carelink-slate hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                    >
                      <FiTrash2 size={18} />
                    </button>
                    <FiChevronDown 
                      className={`text-carelink-slate transition-transform ${expandedProfession === profession.profession_id ? 'rotate-180' : ''}`}
                      size={20}
                    />
                  </div>
                </div>

                {/* Sub-professions */}
                {expandedProfession === profession.profession_id && (
                  <div className="border-t border-gray-100">
                    {profession.sub_professions?.length === 0 ? (
                      <div className="p-4 text-center text-carelink-gray">
                        אין תתי-מקצועות. לחץ על + להוספה.
                      </div>
                    ) : (
                      profession.sub_professions?.map((subProf) => (
                        <div key={subProf.sub_profession_id} className="border-b border-gray-100/50 last:border-b-0">
                          {/* Sub-profession Header */}
                          <div
                            className="flex items-center justify-between p-4 pr-8 cursor-pointer hover:bg-gray-50/20 transition"
                            onClick={() => setExpandedSubProfession(expandedSubProfession === subProf.sub_profession_id ? null : subProf.sub_profession_id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <FiTag className="text-purple-400" size={16} />
                              </div>
                              <div>
                                <h4 className="text-carelink-navy text-sm font-medium">{subProf.name}</h4>
                                <p className="text-carelink-gray text-xs">{subProf.name_en} • {subProf.categories?.length || 0} קטגוריות</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedParent(subProf.sub_profession_id);
                                  setShowAddModal('category');
                                }}
                                className="p-1.5 text-carelink-slate hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition"
                              >
                                <FiPlus size={16} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteItem('sub-professions', subProf.sub_profession_id);
                                }}
                                className="p-1.5 text-carelink-slate hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                              >
                                <FiTrash2 size={16} />
                              </button>
                              <FiChevronDown 
                                className={`text-carelink-slate transition-transform ${expandedSubProfession === subProf.sub_profession_id ? 'rotate-180' : ''}`}
                                size={16}
                              />
                            </div>
                          </div>

                          {/* Categories */}
                          {expandedSubProfession === subProf.sub_profession_id && (
                            <div className="pr-16 pb-4">
                              {subProf.categories?.length === 0 ? (
                                <p className="text-carelink-gray text-sm py-2">אין קטגוריות</p>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {subProf.categories?.map((cat) => (
                                    <div
                                      key={cat.category_id}
                                      className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-lg text-sm group"
                                    >
                                      <FiLayers size={14} />
                                      {cat.name}
                                      <button
                                        onClick={() => deleteItem('categories', cat.category_id)}
                                        className="text-emerald-400/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
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
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-carelink-navy mb-4">
              {showAddModal === 'profession' && 'הוסף מקצוע'}
              {showAddModal === 'sub' && 'הוסף תת-מקצוע'}
              {showAddModal === 'category' && 'הוסף קטגוריה'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-carelink-slate mb-1">שם בעברית</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="הזן שם..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carelink-navy placeholder-carelink-gray focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-carelink-slate mb-1">שם באנגלית</label>
                <input
                  type="text"
                  value={newItemNameEn}
                  onChange={(e) => setNewItemNameEn(e.target.value)}
                  placeholder="Enter name..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carelink-navy placeholder-carelink-gray focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(null);
                  setNewItemName('');
                  setNewItemNameEn('');
                }}
                className="flex-1 px-4 py-2.5 bg-gray-50 text-carelink-navy rounded-lg hover:bg-gray-100 transition"
              >
                ביטול
              </button>
              <button
                onClick={addItem}
                disabled={!newItemName.trim()}
                className="flex-1 px-4 py-2.5 bg-carelink-teal text-carelink-navy rounded-lg hover:bg-carelink-teal/90 transition disabled:opacity-50"
              >
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

export default AdminProfessions;
