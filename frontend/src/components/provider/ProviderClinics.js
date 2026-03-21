import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'sonner';
import {
  FaBuilding, FaPlus, FaEdit, FaTrash, FaMapMarkerAlt, FaPhone,
  FaClock, FaSave, FaTimes, FaDirections, FaLock
} from 'react-icons/fa';

const ProviderClinics = ({ provider }) => {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClinic, setEditingClinic] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [form, setForm] = useState({
    name: '', address: '', city: '', phone: '', working_hours: '', notes: ''
  });

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      const response = await api.get('/clinics');
      setClinics(response.data.clinics || []);
      setHasAccess(true);
    } catch (error) {
      if (error.response?.status === 403) {
        setHasAccess(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: '', address: '', city: '', phone: '', working_hours: '', notes: '' });
    setEditingClinic(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClinic) {
        await api.put(`/clinics/${editingClinic}`, form);
        toast.success('הקליניקה עודכנה');
      } else {
        await api.post('/clinics', form);
        toast.success('הקליניקה נוספה');
      }
      resetForm();
      fetchClinics();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'שגיאה');
    }
  };

  const handleEdit = (clinic) => {
    setForm({
      name: clinic.name, address: clinic.address, city: clinic.city,
      phone: clinic.phone || '', working_hours: clinic.working_hours || '', notes: clinic.notes || ''
    });
    setEditingClinic(clinic.clinic_id);
    setShowForm(true);
  };

  const handleDelete = async (clinicId) => {
    if (!window.confirm('האם למחוק את הקליניקה?')) return;
    try {
      await api.delete(`/clinics/${clinicId}`);
      toast.success('הקליניקה נמחקה');
      fetchClinics();
    } catch (error) {
      toast.error('שגיאה במחיקה');
    }
  };

  const openNavigation = (clinic) => {
    const address = encodeURIComponent(`${clinic.address}, ${clinic.city}`);
    if (clinic.latitude && clinic.longitude) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${clinic.latitude},${clinic.longitude}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, '_blank');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!hasAccess) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl shadow-lg" data-testid="clinics-locked">
        <FaLock className="text-4xl text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-700 mb-2">ניהול קליניקות זמין במנוי פרו וזהב</h3>
        <p className="text-gray-500 text-sm">שדרג את המנוי שלך כדי לנהל סניפים ומיקומים</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="provider-clinics">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-carefd-navy flex items-center gap-2">
          <FaBuilding className="text-carefd-teal" />
          ניהול קליניקות / סניפים
        </h3>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-carefd-teal text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-carefd-teal-medium transition flex items-center gap-2"
          data-testid="add-clinic-btn"
        >
          <FaPlus /> הוסף קליניקה
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border-2 border-carefd-teal-pale shadow-sm space-y-4">
          <h4 className="font-semibold text-gray-900">{editingClinic ? 'עריכת קליניקה' : 'הוספת קליניקה חדשה'}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שם הקליניקה *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" data-testid="clinic-name-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">עיר *</label>
              <input value={form.city} onChange={e => setForm({...form, city: e.target.value})} required className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" data-testid="clinic-city-input" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">כתובת מלאה *</label>
              <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} required className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" data-testid="clinic-address-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} dir="ltr" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שעות פעילות</label>
              <input value={form.working_hours} onChange={e => setForm({...form, working_hours: e.target.value})} placeholder="א-ה 08:00-18:00" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
              <input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="למשל: קומה 3, חניה זמינה" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-carefd-teal text-white px-6 py-2.5 rounded-xl font-medium hover:bg-carefd-teal-medium transition flex items-center gap-2" data-testid="save-clinic-btn">
              <FaSave /> {editingClinic ? 'עדכן' : 'הוסף'}
            </button>
            <button type="button" onClick={resetForm} className="border border-gray-300 text-gray-600 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition">
              ביטול
            </button>
          </div>
        </form>
      )}

      {/* Clinics List */}
      {clinics.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <FaBuilding className="text-4xl text-carefd-teal-pale mx-auto mb-3" />
          <p className="text-gray-500">אין קליניקות עדיין</p>
          <p className="text-sm text-gray-400 mt-1">הוסף את הסניפים והמיקומים שלך</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {clinics.map(clinic => (
            <div key={clinic.clinic_id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition" data-testid={`clinic-${clinic.clinic_id}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-lg">{clinic.name}</h4>
                  <div className="mt-2 space-y-1.5 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <FaMapMarkerAlt className="text-carefd-teal" />
                      {clinic.address}, {clinic.city}
                    </p>
                    {clinic.phone && (
                      <p className="flex items-center gap-2">
                        <FaPhone className="text-carefd-teal" />
                        <span dir="ltr">{clinic.phone}</span>
                      </p>
                    )}
                    {clinic.working_hours && (
                      <p className="flex items-center gap-2">
                        <FaClock className="text-carefd-teal" />
                        {clinic.working_hours}
                      </p>
                    )}
                    {clinic.notes && (
                      <p className="text-gray-500 text-xs mt-1">{clinic.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openNavigation(clinic)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="נווט"
                  >
                    <FaDirections />
                  </button>
                  <button onClick={() => handleEdit(clinic)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                    <FaEdit />
                  </button>
                  <button onClick={() => handleDelete(clinic.clinic_id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProviderClinics;
