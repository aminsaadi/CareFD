"use client";

import {  useState, useEffect, useCallback  } from "react";
import api from "@/lib/api-client";
import { toast } from "sonner";
import {
  FiPlus, FiEdit2, FiTrash2, FiChevronDown, FiChevronRight,
  FiGrid, FiTag, FiLayers, FiSearch, FiSave, FiX, FiLoader,
  FiBriefcase
} from 'react-icons/fi';

export default function AdminProfessions() {
  const [professions, setProfessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('professions'); // 'professions' or 'categories'
  const [expandedProfession, setExpandedProfession] = useState<any>(null);
  const [expandedSubProfession, setExpandedSubProfession] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState<any>(null); // 'profession', 'sub', 'category'
  const [showEditModal, setShowEditModal] = useState<any>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemNameEn, setNewItemNameEn] = useState('');
  const [newSpecializations, setNewSpecializations] = useState('');
  const [selectedParent, setSelectedParent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  

  const fetchProfessions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get('/admin/professions');
      setProfessions(data.professions || []);
    } catch (error: any) {
      console.error('Failed to fetch professions:', error);
      toast.error('שגיאה בטעינת המקצועות');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfessions();
  }, [fetchProfessions]);

  const addItem = async () => {
    if (!newItemName.trim()) {
      toast.error('נא להזין שם');
      return;
    }

    setSaving(true);
    try {
      if (showAddModal === 'profession') {
        const specializations = newSpecializations
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0);

        await api.post('/admin/professions', {
          name: newItemName,
          name_en: newItemNameEn,
          specializations
        });
        toast.success('המקצוע נוסף בהצלחה');
      } else if (showAddModal === 'sub') {
        await api.post(`/admin/professions/${selectedParent}/sub-professions`, {
          name: newItemName,
          name_en: newItemNameEn
        });
        toast.success('תת-הקטגוריה נוספה בהצלחה');
      } else if (showAddModal === 'category') {
        await api.post(`/admin/sub-professions/${selectedParent}/categories`, {
          name: newItemName,
          name_en: newItemNameEn
        });
        toast.success('תת-הקטגוריה נוספה בהצלחה');
      }

      fetchProfessions();
      closeAddModal();
    } catch (error: any) {
      console.error('Failed to add item:', error);
      toast.error('שגיאה בהוספה');
    } finally {
      setSaving(false);
    }
  };

  const updateItem = async () => {
    if (!showEditModal) return;

    setSaving(true);
    try {
      if (showEditModal.type === 'profession') {
        const specializations = newSpecializations
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0);

        await api.put(`/admin/professions/${showEditModal.id}`, {
          name: newItemName,
          name_en: newItemNameEn,
          specializations
        });
        toast.success('המקצוע עודכן בהצלחה');
      } else if (showEditModal.type === 'sub') {
        await api.put(`/admin/sub-professions/${showEditModal.id}`, {
          name: newItemName,
          name_en: newItemNameEn
        });
        toast.success('עודכן בהצלחה');
      }

      fetchProfessions();
      closeEditModal();
    } catch (error: any) {
      console.error('Failed to update item:', error);
      toast.error('שגיאה בעדכון');
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (type, id, name) => {
    const confirmed = window.confirm(`האם אתה בטוח שברצונך למחוק את "${name}"?`);

    if (!confirmed) return;

    try {
      await api.delete(`/admin/${type}/${id}`);
      toast.success('נמחק בהצלחה');
      fetchProfessions();
    } catch (error: any) {
      console.error('Failed to delete:', error);
      toast.error('שגיאה במחיקה');
    }
  };

  const closeAddModal = () => {
    setShowAddModal(null);
    setNewItemName('');
    setNewItemNameEn('');
    setNewSpecializations('');
    setSelectedParent(null);
  };

  const closeEditModal = () => {
    setShowEditModal(null);
    setNewItemName('');
    setNewItemNameEn('');
    setNewSpecializations('');
  };

  const openEditModal = (type, item) => {
    setNewItemName(item.name || '');
    setNewItemNameEn(item.name_en || '');
    if (type === 'profession') {
      setNewSpecializations((item.specializations || []).join(', '));
    }
    setShowEditModal({ type, id: type === 'profession' ? item.profession_id : item.sub_profession_id, data: item });
  };

  const filteredProfessions = professions.filter(p =>
    p.name?.includes(searchQuery) ||
    p.name_en?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Count total sub-categories
  const totalSubCategories = professions.reduce((acc, p) => {
    return acc + (p.sub_professions || []).reduce((subAcc, sub) => {
      return subAcc + (sub.categories?.length || 0);
    }, 0) + (p.sub_professions?.length || 0);
  }, 0);

  return (
    <>
    
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-carefd-navy">מקצועות וקטגוריות</h1>
            <p className="text-carefd-slate mt-1">ניהול מקצועות, התמחויות וקטגוריות שירות</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => { setActiveTab('professions'); setExpandedProfession(null); }}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'professions'
                ? 'text-carefd-teal border-carefd-teal'
                : 'text-carefd-slate border-transparent hover:text-carefd-navy'
            }`}
          >
            <FiBriefcase className="inline-block ms-2" />
            מקצועות והתמחויות ({professions.length})
          </button>
          <button
            onClick={() => { setActiveTab('categories'); setExpandedProfession(null); }}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'categories'
                ? 'text-carefd-teal border-carefd-teal'
                : 'text-carefd-slate border-transparent hover:text-carefd-navy'
            }`}
          >
            <FiGrid className="inline-block ms-2" />
            קטגוריות ותתי קטגוריות ({totalSubCategories})
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="relative">
            <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-carefd-slate" size={18} />
            <input
              type="text"
              placeholder={activeTab === 'professions' ? 'חפש מקצוע...' : 'חפש קטגוריה...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pr-10 pl-4 py-2.5 text-carefd-navy placeholder-carefd-gray focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
              data-testid="search-profession-input"
            />
          </div>
        </div>

        {/* ==================== TAB 1: PROFESSIONS & SPECIALIZATIONS ==================== */}
        {activeTab === 'professions' && (
          <>
            {/* Add Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 flex-wrap text-sm text-carefd-slate">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-carefd-teal rounded"></div>
                  <span>מקצוע</span>
                </div>
                <FiChevronRight className="text-slate-600" />
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-500 rounded"></div>
                  <span>התמחויות</span>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal('profession')}
                className="flex items-center gap-2 px-4 py-2 bg-carefd-teal text-carefd-navy rounded-lg hover:bg-carefd-teal/90 transition"
                data-testid="add-profession-btn"
              >
                <FiPlus size={18} />
                הוסף מקצוע
              </button>
            </div>

            {/* Professions List */}
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-10 h-10 border-4 border-carefd-teal border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredProfessions.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
                  <FiBriefcase className="mx-auto text-slate-600 mb-4" size={48} />
                  <p className="text-carefd-slate">לא נמצאו מקצועות</p>
                </div>
              ) : (
                filteredProfessions.map((profession) => (
                  <div key={profession.profession_id} className="bg-white rounded-xl border border-gray-100 overflow-hidden" data-testid={`profession-${profession.profession_id}`}>
                    {/* Profession Header */}
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/30 transition"
                      onClick={() => setExpandedProfession(expandedProfession === profession.profession_id ? null : profession.profession_id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-carefd-teal/20 rounded-lg flex items-center justify-center">
                          <FiBriefcase className="text-carefd-teal" size={20} />
                        </div>
                        <div>
                          <h3 className="text-carefd-navy font-medium">{profession.name}</h3>
                          <p className="text-carefd-slate text-sm">
                            {profession.name_en}
                            {profession.specializations?.length > 0 && ` • ${profession.specializations.length} התמחויות`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal('profession', profession);
                          }}
                          className="p-2 text-carefd-slate hover:text-carefd-teal hover:bg-carefd-teal/10 rounded-lg transition"
                          title="ערוך מקצוע"
                        >
                          <FiEdit2 size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteItem('professions', profession.profession_id, profession.name);
                          }}
                          className="p-2 text-carefd-slate hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                          title="מחק מקצוע"
                        >
                          <FiTrash2 size={18} />
                        </button>
                        <FiChevronDown
                          className={`text-carefd-slate transition-transform ${expandedProfession === profession.profession_id ? 'rotate-180' : ''}`}
                          size={20}
                        />
                      </div>
                    </div>

                    {/* Expanded: Specializations */}
                    {expandedProfession === profession.profession_id && (
                      <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                        {profession.specializations?.length > 0 ? (
                          <>
                            <p className="text-carefd-slate text-sm mb-3 font-medium">התמחויות:</p>
                            <div className="flex flex-wrap gap-2">
                              {profession.specializations.map((spec, idx) => (
                                <span key={idx} className="px-3 py-1.5 bg-purple-100 text-purple-700 border border-purple-200 rounded-full text-sm font-medium">
                                  {spec}
                                </span>
                              ))}
                            </div>
                          </>
                        ) : (
                          <p className="text-carefd-gray text-sm">אין התמחויות מוגדרות. ערוך את המקצוע להוספת התמחויות.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ==================== TAB 2: CATEGORIES & SUB-CATEGORIES ==================== */}
        {activeTab === 'categories' && (
          <>
            {/* Guide */}
            <div className="flex items-center gap-6 flex-wrap text-sm text-carefd-slate">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-carefd-teal rounded"></div>
                <span>קטגוריה (מקצוע)</span>
              </div>
              <FiChevronRight className="text-slate-600" />
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span>תת-קטגוריה</span>
              </div>
              <FiChevronRight className="text-slate-600" />
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-emerald-500 rounded"></div>
                <span>שירות</span>
              </div>
            </div>

            {/* Categories List - each profession = category */}
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-10 h-10 border-4 border-carefd-teal border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredProfessions.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
                  <FiGrid className="mx-auto text-slate-600 mb-4" size={48} />
                  <p className="text-carefd-slate">לא נמצאו קטגוריות</p>
                </div>
              ) : (
                filteredProfessions.map((profession) => (
                  <div key={profession.profession_id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    {/* Category Header (Profession as Category) */}
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/30 transition"
                      onClick={() => setExpandedProfession(expandedProfession === profession.profession_id ? null : profession.profession_id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-carefd-teal/20 rounded-lg flex items-center justify-center">
                          <FiGrid className="text-carefd-teal" size={20} />
                        </div>
                        <div>
                          <h3 className="text-carefd-navy font-medium">{profession.name}</h3>
                          <p className="text-carefd-slate text-sm">
                            {profession.name_en} • {profession.sub_professions?.length || 0} תתי-קטגוריות
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedParent(profession.profession_id);
                            setShowAddModal('sub');
                          }}
                          className="p-2 text-carefd-slate hover:text-purple-500 hover:bg-purple-500/10 rounded-lg transition"
                          title="הוסף תת-קטגוריה"
                        >
                          <FiPlus size={18} />
                        </button>
                        <FiChevronDown
                          className={`text-carefd-slate transition-transform ${expandedProfession === profession.profession_id ? 'rotate-180' : ''}`}
                          size={20}
                        />
                      </div>
                    </div>

                    {/* Expanded: Sub-categories */}
                    {expandedProfession === profession.profession_id && (
                      <div className="border-t border-gray-100">
                        {profession.sub_professions?.length === 0 ? (
                          <div className="p-4 text-center text-carefd-gray">
                            אין תתי-קטגוריות. לחץ על + להוספה.
                          </div>
                        ) : (
                          profession.sub_professions?.map((subProf) => (
                            <div key={subProf.sub_profession_id} className="border-b border-gray-100/50 last:border-b-0">
                              {/* Sub-category Header */}
                              <div
                                className="flex items-center justify-between p-4 pr-8 cursor-pointer hover:bg-gray-50/20 transition"
                                onClick={() => setExpandedSubProfession(expandedSubProfession === subProf.sub_profession_id ? null : subProf.sub_profession_id)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                    <FiTag className="text-purple-500" size={16} />
                                  </div>
                                  <div>
                                    <h4 className="text-carefd-navy text-sm font-medium">{subProf.name}</h4>
                                    <p className="text-carefd-gray text-xs">{subProf.name_en} • {subProf.categories?.length || 0} שירותים</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditModal('sub', subProf);
                                    }}
                                    className="p-1.5 text-carefd-slate hover:text-purple-500 hover:bg-purple-500/10 rounded-lg transition"
                                    title="ערוך"
                                  >
                                    <FiEdit2 size={16} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedParent(subProf.sub_profession_id);
                                      setShowAddModal('category');
                                    }}
                                    className="p-1.5 text-carefd-slate hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition"
                                    title="הוסף שירות"
                                  >
                                    <FiPlus size={16} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteItem('sub-professions', subProf.sub_profession_id, subProf.name);
                                    }}
                                    className="p-1.5 text-carefd-slate hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                                    title="מחק"
                                  >
                                    <FiTrash2 size={16} />
                                  </button>
                                  <FiChevronDown
                                    className={`text-carefd-slate transition-transform ${expandedSubProfession === subProf.sub_profession_id ? 'rotate-180' : ''}`}
                                    size={16}
                                  />
                                </div>
                              </div>

                              {/* Services (Categories) */}
                              {expandedSubProfession === subProf.sub_profession_id && (
                                <div className="pr-16 pb-4">
                                  {subProf.categories?.length === 0 ? (
                                    <p className="text-carefd-gray text-sm py-2">אין שירותים</p>
                                  ) : (
                                    <div className="flex flex-wrap gap-2">
                                      {subProf.categories?.map((cat) => (
                                        <div
                                          key={cat.category_id}
                                          className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 px-3 py-1.5 rounded-lg text-sm group"
                                        >
                                          <FiLayers size={14} />
                                          {cat.name}
                                          <button
                                            onClick={() => deleteItem('categories', cat.category_id, cat.name)}
                                            className="text-emerald-400/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                                            title="מחק"
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
          </>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-carefd-navy mb-4">
              {showAddModal === 'profession' && 'הוסף מקצוע חדש'}
              {showAddModal === 'sub' && 'הוסף תת-קטגוריה'}
              {showAddModal === 'category' && 'הוסף שירות'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-carefd-slate mb-1">שם בעברית *</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="הזן שם..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy placeholder-carefd-gray focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                  data-testid="new-item-name"
                />
              </div>
              <div>
                <label className="block text-sm text-carefd-slate mb-1">שם באנגלית</label>
                <input
                  type="text"
                  value={newItemNameEn}
                  onChange={(e) => setNewItemNameEn(e.target.value)}
                  placeholder="Enter name..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy placeholder-carefd-gray focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                  dir="ltr"
                  data-testid="new-item-name-en"
                />
              </div>
              {showAddModal === 'profession' && (
                <div>
                  <label className="block text-sm text-carefd-slate mb-1">התמחויות (מופרדות בפסיקים)</label>
                  <input
                    type="text"
                    value={newSpecializations}
                    onChange={(e) => setNewSpecializations(e.target.value)}
                    placeholder="התמחות 1, התמחות 2, התמחות 3..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy placeholder-carefd-gray focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                    data-testid="new-item-specializations"
                  />
                  <p className="text-xs text-carefd-gray mt-1">ההתמחויות יוצגו כאופציות בפרופיל הספק</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={closeAddModal}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-carefd-navy rounded-lg hover:bg-gray-200 transition"
              >
                ביטול
              </button>
              <button
                onClick={addItem}
                disabled={!newItemName.trim() || saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-carefd-teal text-carefd-navy rounded-lg hover:bg-carefd-teal/90 transition disabled:opacity-50"
                data-testid="confirm-add-btn"
              >
                {saving ? <FiLoader className="animate-spin" size={18} /> : <FiPlus size={18} />}
                הוסף
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-carefd-navy mb-4">
              {showEditModal.type === 'profession' ? 'עריכת מקצוע' : 'עריכת תת-קטגוריה'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-carefd-slate mb-1">שם בעברית *</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="הזן שם..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy placeholder-carefd-gray focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-carefd-slate mb-1">שם באנגלית</label>
                <input
                  type="text"
                  value={newItemNameEn}
                  onChange={(e) => setNewItemNameEn(e.target.value)}
                  placeholder="Enter name..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy placeholder-carefd-gray focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                  dir="ltr"
                />
              </div>
              {showEditModal.type === 'profession' && (
                <div>
                  <label className="block text-sm text-carefd-slate mb-1">התמחויות (מופרדות בפסיקים)</label>
                  <input
                    type="text"
                    value={newSpecializations}
                    onChange={(e) => setNewSpecializations(e.target.value)}
                    placeholder="התמחות 1, התמחות 2, התמחות 3..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy placeholder-carefd-gray focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                  />
                  <p className="text-xs text-carefd-gray mt-1">ההתמחויות יוצגו כאופציות בפרופיל הספק</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={closeEditModal}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-carefd-navy rounded-lg hover:bg-gray-200 transition"
              >
                ביטול
              </button>
              <button
                onClick={updateItem}
                disabled={!newItemName.trim() || saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-carefd-teal text-carefd-navy rounded-lg hover:bg-carefd-teal/90 transition disabled:opacity-50"
              >
                {saving ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />}
                שמור
              </button>
            </div>
          </div>
        </div>
      )}

      
    
    </>
  );
};


