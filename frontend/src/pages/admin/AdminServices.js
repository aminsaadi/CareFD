import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import {
  FiSearch, FiFilter, FiEdit2, FiTrash2, FiEye,
  FiDollarSign, FiClock, FiTag, FiUser, FiX, FiCheck,
  FiPackage, FiDownload
} from 'react-icons/fi';

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  useEffect(() => {
    fetchServices();
  }, [searchQuery, selectedCategory, pagination.page]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      params.append('skip', (pagination.page - 1) * pagination.limit);
      params.append('limit', pagination.limit);
      
      const response = await api.get(`/admin/services?${params.toString()}`);
      setServices(response.data.services || []);
      setPagination(prev => ({ ...prev, total: response.data.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    try {
      await api.delete(`/admin/services/${serviceId}`);
      setShowDeleteModal(null);
      fetchServices();
    } catch (error) {
      console.error('Failed to delete service:', error);
    }
  };

  const handleEditService = async (serviceData) => {
    try {
      await api.put(`/admin/services/${showEditModal.service_id}`, serviceData);
      setShowEditModal(null);
      fetchServices();
    } catch (error) {
      console.error('Failed to update service:', error);
    }
  };

  const formatPrice = (price, pricingType) => {
    if (!price) return 'לא צוין';
    switch (pricingType) {
      case 'hourly':
        return `₪${price}/שעה`;
      case 'fixed':
        return `₪${price}`;
      case 'starting_from':
        return `החל מ-₪${price}`;
      default:
        return `₪${price}`;
    }
  };

  const getServiceTypeLabel = (type) => {
    switch (type) {
      case 'home_visit': return 'ביקור בית';
      case 'clinic_visit': return 'קליניקה';
      case 'video_call': return 'שיחת וידאו';
      case 'phone_call': return 'שיחה טלפונית';
      default: return type;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-carelink-navy">ניהול שירותים</h1>
            <p className="text-carelink-slate mt-1">{pagination.total} שירותים במערכת</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-carelink-slate rounded-lg hover:bg-gray-50 transition">
            <FiDownload size={18} />
            ייצוא
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-carelink-gray" size={18} />
              <input
                type="text"
                placeholder="חפש לפי שם שירות, תיאור..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pr-10 pl-4 py-2.5 text-carelink-navy placeholder-carelink-gray focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carelink-navy focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none min-w-[150px]"
            >
              <option value="">כל הקטגוריות</option>
              <option value="medical">רפואה</option>
              <option value="nursing">סיעוד</option>
              <option value="therapy">טיפול</option>
              <option value="elderly_care">טיפול קשישים</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-right py-4 px-4 text-carelink-slate font-medium text-sm">שירות</th>
                  <th className="text-right py-4 px-4 text-carelink-slate font-medium text-sm">ספק</th>
                  <th className="text-right py-4 px-4 text-carelink-slate font-medium text-sm">מחיר</th>
                  <th className="text-right py-4 px-4 text-carelink-slate font-medium text-sm">משך</th>
                  <th className="text-right py-4 px-4 text-carelink-slate font-medium text-sm">סוג</th>
                  <th className="text-right py-4 px-4 text-carelink-slate font-medium text-sm">סטטוס</th>
                  <th className="text-right py-4 px-4 text-carelink-slate font-medium text-sm">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="w-8 h-8 border-4 border-carelink-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </td>
                  </tr>
                ) : services.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-carelink-gray">
                      <FiPackage size={48} className="mx-auto mb-4 opacity-50" />
                      <p>לא נמצאו שירותים</p>
                    </td>
                  </tr>
                ) : (
                  services.map((service) => (
                    <tr key={service.service_id} className="border-b border-gray-50 hover:bg-carelink-teal-pale/10 transition">
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-carelink-navy font-medium">{service.name}</p>
                          <p className="text-carelink-gray text-sm line-clamp-1">{service.description}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-carelink-navy text-sm">{service.provider_name || 'לא ידוע'}</p>
                          <p className="text-carelink-teal text-xs font-mono">{service.provider_number || ''}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-emerald-600 font-medium">
                          {formatPrice(service.price, service.pricing_type)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-carelink-slate text-sm">
                        {service.duration ? `${service.duration} דקות` : '-'}
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-carelink-slate rounded text-xs">
                          {getServiceTypeLabel(service.service_type)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {service.is_active !== false ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 text-sm">
                            <FiCheck size={14} />
                            פעיל
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-carelink-gray text-sm">
                            <FiX size={14} />
                            לא פעיל
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setShowEditModal(service)}
                            className="p-2 text-carelink-slate hover:text-carelink-navy hover:bg-gray-100 rounded-lg transition"
                            title="ערוך"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button 
                            onClick={() => setShowDeleteModal(service)}
                            className="p-2 text-carelink-slate hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="מחק"
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

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
              <p className="text-carelink-slate text-sm">
                מציג {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} מתוך {pagination.total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-white border border-gray-200 text-carelink-navy rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  הקודם
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page * pagination.limit >= pagination.total}
                  className="px-4 py-2 bg-white border border-gray-200 text-carelink-navy rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  הבא
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Service Modal */}
      {showEditModal && (
        <EditServiceModal
          service={showEditModal}
          onClose={() => setShowEditModal(null)}
          onSave={handleEditService}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 border border-gray-200 shadow-xl">
            <h3 className="text-lg font-bold text-carelink-navy mb-2">מחיקת שירות</h3>
            <p className="text-carelink-slate mb-6">
              האם אתה בטוח שברצונך למחוק את השירות "{showDeleteModal.name}"? 
              פעולה זו לא ניתנת לביטול.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-carelink-navy rounded-lg hover:bg-gray-200 transition"
              >
                ביטול
              </button>
              <button
                onClick={() => handleDeleteService(showDeleteModal.service_id)}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                מחק
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

// Edit Service Modal Component
const EditServiceModal = ({ service, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: service.name || '',
    description: service.description || '',
    price: service.price || '',
    duration: service.duration || '',
    is_active: service.is_active !== false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      price: parseFloat(formData.price) || 0,
      duration: parseInt(formData.duration) || null
    });
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 border border-gray-200 shadow-xl">
        <h3 className="text-lg font-bold text-carelink-navy mb-4">עריכת שירות</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-carelink-navy mb-1">שם השירות</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-carelink-navy mb-1">תיאור</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-carelink-navy mb-1">מחיר (₪)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-carelink-navy mb-1">משך (דקות)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-carelink-teal focus:ring-carelink-teal"
            />
            <label htmlFor="is_active" className="text-sm text-carelink-navy">שירות פעיל</label>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-carelink-navy rounded-lg hover:bg-gray-200 transition"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-carelink-teal text-white rounded-lg hover:bg-carelink-teal/90 transition"
            >
              שמור
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminServices;
