import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import { toast } from 'sonner';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';
import {
  FiPlus, FiEdit2, FiTrash2, FiPackage, FiClock, FiHome, FiVideo,
  FiMessageCircle, FiTruck, FiMapPin, FiSave, FiX, FiLoader,
  FiToggleLeft, FiToggleRight, FiSettings
} from 'react-icons/fi';

const AdminServiceTypes = () => {
  const [serviceTypes, setServiceTypes] = useState([]);
  const [deliveryTypes, setDeliveryTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('service'); // 'service' or 'delivery'
  const [showModal, setShowModal] = useState(null); // 'add-service', 'add-delivery', 'edit-service', 'edit-delivery'
  const [editingItem, setEditingItem] = useState(null);
  
  const [form, setForm] = useState({
    name: '',
    name_en: '',
    description: '',
    icon: 'box',
    requires_location: true,
    requires_address: true,
    has_minimum_hours: false,
    has_shipping: false,
    is_active: true
  });
  
  const { confirmState, confirm, closeConfirm } = useConfirm();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [serviceRes, deliveryRes] = await Promise.all([
        api.get('/admin/service-types'),
        api.get('/admin/delivery-types')
      ]);
      setServiceTypes(serviceRes.data.service_types || []);
      setDeliveryTypes(deliveryRes.data.delivery_types || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setForm({
      name: '',
      name_en: '',
      description: '',
      icon: 'box',
      requires_location: true,
      requires_address: true,
      has_minimum_hours: false,
      has_shipping: false,
      is_active: true
    });
    setEditingItem(null);
  };

  const openAddModal = (type) => {
    resetForm();
    setShowModal(type === 'service' ? 'add-service' : 'add-delivery');
  };

  const openEditModal = (type, item) => {
    setForm({
      name: item.name || '',
      name_en: item.name_en || '',
      description: item.description || '',
      icon: item.icon || 'box',
      requires_location: item.requires_location ?? true,
      requires_address: item.requires_address ?? true,
      has_minimum_hours: item.has_minimum_hours ?? false,
      has_shipping: item.has_shipping ?? false,
      is_active: item.is_active ?? true
    });
    setEditingItem(item);
    setShowModal(type === 'service' ? 'edit-service' : 'edit-delivery');
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('נא להזין שם');
      return;
    }
    
    setSaving(true);
    try {
      const isService = showModal.includes('service');
      const isEdit = showModal.includes('edit');
      const endpoint = isService ? 'service-types' : 'delivery-types';
      
      if (isEdit) {
        const id = isService ? editingItem.type_id : editingItem.type_id;
        await api.put(`/admin/${endpoint}/${id}`, form);
        toast.success('עודכן בהצלחה');
      } else {
        await api.post(`/admin/${endpoint}`, form);
        toast.success('נוסף בהצלחה');
      }
      
      setShowModal(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type, item) => {
    const confirmed = await confirm({
      title: 'מחיקה',
      message: `האם אתה בטוח שברצונך למחוק את "${item.name}"?`,
      type: 'danger',
      confirmText: 'מחק',
      cancelText: 'ביטול'
    });
    
    if (!confirmed) return;
    
    try {
      const endpoint = type === 'service' ? 'service-types' : 'delivery-types';
      await api.delete(`/admin/${endpoint}/${item.type_id}`);
      toast.success('נמחק בהצלחה');
      fetchData();
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('שגיאה במחיקה');
    }
  };

  const toggleActive = async (type, item) => {
    try {
      const endpoint = type === 'service' ? 'service-types' : 'delivery-types';
      await api.put(`/admin/${endpoint}/${item.type_id}`, { is_active: !item.is_active });
      toast.success(item.is_active ? 'הושבת' : 'הופעל');
      fetchData();
    } catch (error) {
      console.error('Failed to toggle:', error);
      toast.error('שגיאה בעדכון');
    }
  };

  const getIcon = (iconName) => {
    const icons = {
      'home': FiHome,
      'clock': FiClock,
      'message-circle': FiMessageCircle,
      'package': FiPackage,
      'video': FiVideo,
      'truck': FiTruck,
      'map-pin': FiMapPin,
      'building': FiSettings,
      'building-2': FiSettings,
    };
    const IconComponent = icons[iconName] || FiPackage;
    return <IconComponent size={20} />;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-carefd-navy">סוגי שירותים</h1>
            <p className="text-carefd-slate mt-1">ניהול סוגי שירות ואופני מתן שירות</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('service')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'service'
                ? 'text-carefd-teal border-carefd-teal'
                : 'text-carefd-slate border-transparent hover:text-carefd-navy'
            }`}
          >
            <FiPackage className="inline-block ml-2" />
            סוגי שירות ({serviceTypes.length})
          </button>
          <button
            onClick={() => setActiveTab('delivery')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'delivery'
                ? 'text-carefd-teal border-carefd-teal'
                : 'text-carefd-slate border-transparent hover:text-carefd-navy'
            }`}
          >
            <FiMapPin className="inline-block ml-2" />
            אופני מתן שירות ({deliveryTypes.length})
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-carefd-teal border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Add Button */}
            <button
              onClick={() => openAddModal(activeTab)}
              className="flex items-center gap-2 px-4 py-2 bg-carefd-teal text-carefd-navy rounded-lg hover:bg-carefd-teal/90 transition"
              data-testid="add-type-btn"
            >
              <FiPlus size={18} />
              {activeTab === 'service' ? 'הוסף סוג שירות' : 'הוסף אופן מתן שירות'}
            </button>

            {/* Items Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(activeTab === 'service' ? serviceTypes : deliveryTypes).map((item) => (
                <div
                  key={item.type_id}
                  className={`bg-white rounded-xl border p-5 transition ${
                    item.is_active ? 'border-gray-100' : 'border-red-200 bg-red-50/30'
                  }`}
                  data-testid={`type-card-${item.type_id}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        item.is_active ? 'bg-carefd-teal/20 text-carefd-teal' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {getIcon(item.icon)}
                      </div>
                      <div>
                        <h3 className="font-bold text-carefd-navy">{item.name}</h3>
                        <p className="text-carefd-slate text-sm">{item.name_en}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleActive(activeTab, item)}
                      className={`p-1 rounded transition ${
                        item.is_active ? 'text-emerald-500' : 'text-gray-400'
                      }`}
                      title={item.is_active ? 'לחץ להשבתה' : 'לחץ להפעלה'}
                    >
                      {item.is_active ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
                    </button>
                  </div>
                  
                  <p className="text-carefd-gray text-sm mb-4">{item.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {activeTab === 'service' && (
                      <>
                        {item.requires_location && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">דורש מיקום</span>
                        )}
                        {item.has_minimum_hours && (
                          <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">מינימום שעות</span>
                        )}
                        {item.has_shipping && (
                          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">משלוח</span>
                        )}
                      </>
                    )}
                    {activeTab === 'delivery' && (
                      <>
                        {item.requires_address && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">דורש כתובת</span>
                        )}
                        {item.sub_types?.length > 0 && (
                          <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                            {item.sub_types.join(', ')}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => openEditModal(activeTab, item)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 text-carefd-slate hover:text-carefd-teal hover:bg-carefd-teal/10 rounded-lg transition"
                    >
                      <FiEdit2 size={16} />
                      ערוך
                    </button>
                    <button
                      onClick={() => handleDelete(activeTab, item)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 text-carefd-slate hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <FiTrash2 size={16} />
                      מחק
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-carefd-navy">
                {showModal.includes('edit') ? 'עריכה' : 'הוספה'} - {showModal.includes('service') ? 'סוג שירות' : 'אופן מתן שירות'}
              </h3>
              <button
                onClick={() => { setShowModal(null); resetForm(); }}
                className="p-2 text-carefd-slate hover:text-carefd-navy rounded-lg transition"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-carefd-slate mb-1">שם בעברית *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="לדוגמה: שירות ביקור"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy placeholder-carefd-gray focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                    data-testid="type-name-input"
                  />
                </div>
                <div>
                  <label className="block text-sm text-carefd-slate mb-1">שם באנגלית</label>
                  <input
                    type="text"
                    value={form.name_en}
                    onChange={(e) => setForm(prev => ({ ...prev, name_en: e.target.value }))}
                    placeholder="e.g. Visit Service"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy placeholder-carefd-gray focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-carefd-slate mb-1">תיאור</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="תיאור קצר..."
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy placeholder-carefd-gray focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-carefd-slate mb-1">אייקון</label>
                <select
                  value={form.icon}
                  onChange={(e) => setForm(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                >
                  <option value="home">🏠 בית</option>
                  <option value="clock">⏰ שעון</option>
                  <option value="message-circle">💬 הודעה</option>
                  <option value="package">📦 חבילה</option>
                  <option value="video">📹 וידאו</option>
                  <option value="building">🏥 מוסד</option>
                  <option value="map-pin">📍 מיקום</option>
                  <option value="truck">🚚 משלוח</option>
                </select>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                {showModal.includes('service') ? (
                  <>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-carefd-navy">דורש מיקום</span>
                      <input
                        type="checkbox"
                        checked={form.requires_location}
                        onChange={(e) => setForm(prev => ({ ...prev, requires_location: e.target.checked }))}
                        className="w-5 h-5 text-carefd-teal rounded border-gray-300 focus:ring-carefd-teal"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-carefd-navy">יש מינימום שעות</span>
                      <input
                        type="checkbox"
                        checked={form.has_minimum_hours}
                        onChange={(e) => setForm(prev => ({ ...prev, has_minimum_hours: e.target.checked }))}
                        className="w-5 h-5 text-carefd-teal rounded border-gray-300 focus:ring-carefd-teal"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-carefd-navy">כולל משלוח</span>
                      <input
                        type="checkbox"
                        checked={form.has_shipping}
                        onChange={(e) => setForm(prev => ({ ...prev, has_shipping: e.target.checked }))}
                        className="w-5 h-5 text-carefd-teal rounded border-gray-300 focus:ring-carefd-teal"
                      />
                    </label>
                  </>
                ) : (
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-carefd-navy">דורש כתובת</span>
                    <input
                      type="checkbox"
                      checked={form.requires_address}
                      onChange={(e) => setForm(prev => ({ ...prev, requires_address: e.target.checked }))}
                      className="w-5 h-5 text-carefd-teal rounded border-gray-300 focus:ring-carefd-teal"
                    />
                  </label>
                )}
                
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-carefd-navy">פעיל</span>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-5 h-5 text-carefd-teal rounded border-gray-300 focus:ring-carefd-teal"
                  />
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowModal(null); resetForm(); }}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-carefd-navy rounded-lg hover:bg-gray-200 transition"
              >
                ביטול
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.name.trim() || saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-carefd-teal text-carefd-navy rounded-lg hover:bg-carefd-teal/90 transition disabled:opacity-50"
                data-testid="save-type-btn"
              >
                {saving ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />}
                שמור
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

export default AdminServiceTypes;
