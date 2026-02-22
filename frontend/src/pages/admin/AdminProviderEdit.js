import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import { toast } from 'sonner';
import {
  FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiSave, FiArrowRight,
  FiCheck, FiX, FiStar, FiShield, FiAward, FiImage, FiFileText
} from 'react-icons/fi';

const AdminProviderEdit = () => {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [provider, setProvider] = useState(null);
  const [formData, setFormData] = useState({
    business_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    bio: '',
    experience_years: 0,
    specializations: [],
    languages: [],
    is_verified: false,
    is_recommended: false,
    provider_type: 'individual'
  });

  useEffect(() => {
    fetchProvider();
  }, [providerId]);

  const fetchProvider = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/providers/${providerId}`);
      const data = response.data;
      setProvider(data);
      setFormData({
        business_name: data.business_name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        bio: data.bio || '',
        experience_years: data.experience_years || 0,
        specializations: data.specializations || [],
        languages: data.languages || [],
        is_verified: data.is_verified || false,
        is_recommended: data.is_recommended || false,
        provider_type: data.provider_type || 'individual'
      });
    } catch (error) {
      console.error('Failed to fetch provider:', error);
      toast.error('שגיאה בטעינת נתוני הספק');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/admin/providers/${providerId}`, formData);
      toast.success('פרטי הספק עודכנו בהצלחה!');
      navigate('/admin/providers');
    } catch (error) {
      console.error('Failed to update provider:', error);
      toast.error('שגיאה בעדכון פרטי הספק');
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async () => {
    try {
      await api.put(`/admin/providers/${providerId}/verify`);
      setFormData(prev => ({ ...prev, is_verified: true }));
      toast.success('הספק אומת בהצלחה!');
    } catch (error) {
      toast.error('שגיאה באימות הספק');
    }
  };

  const handleToggleRecommended = async () => {
    try {
      if (formData.is_recommended) {
        await api.put(`/admin/providers/${providerId}/unrecommend`);
      } else {
        await api.put(`/admin/providers/${providerId}/recommend`);
      }
      setFormData(prev => ({ ...prev, is_recommended: !prev.is_recommended }));
      toast.success(formData.is_recommended ? 'ההמלצה הוסרה' : 'הספק סומן כמומלץ');
    } catch (error) {
      toast.error('שגיאה בעדכון המלצה');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-carelink-teal border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/providers')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <FiArrowRight size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-carelink-navy">עריכת ספק</h1>
              <p className="text-carelink-slate">{provider?.business_name}</p>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2">
            {!formData.is_verified && (
              <button
                onClick={handleVerify}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
              >
                <FiShield />
                אמת ספק
              </button>
            )}
            <button
              onClick={handleToggleRecommended}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                formData.is_recommended
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiAward />
              {formData.is_recommended ? 'הסר המלצה' : 'המלץ'}
            </button>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex gap-3 mb-6">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            formData.is_verified 
              ? 'bg-emerald-100 text-emerald-700' 
              : 'bg-amber-100 text-amber-700'
          }`}>
            {formData.is_verified ? '✓ מאומת' : '⏳ ממתין לאימות'}
          </span>
          {formData.is_recommended && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
              ⭐ מומלץ
            </span>
          )}
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
            {formData.provider_type === 'individual' ? 'עצמאי' : 'חברה'}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-carelink-navy mb-4 flex items-center gap-2">
              <FiUser className="text-carelink-teal" />
              פרטים בסיסיים
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-carelink-navy mb-2">שם העסק</label>
                <input
                  type="text"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-carelink-teal focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-carelink-navy mb-2">סוג ספק</label>
                <select
                  name="provider_type"
                  value={formData.provider_type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-carelink-teal focus:outline-none"
                >
                  <option value="individual">עצמאי</option>
                  <option value="company">חברה</option>
                  <option value="clinic">מרפאה</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-carelink-navy mb-4 flex items-center gap-2">
              <FiMail className="text-carelink-teal" />
              פרטי קשר
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-carelink-navy mb-2">אימייל</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-carelink-teal focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-carelink-navy mb-2">טלפון</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-carelink-teal focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-carelink-navy mb-2">עיר</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-carelink-teal focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-carelink-navy mb-2">כתובת</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-carelink-teal focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Professional Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-carelink-navy mb-4 flex items-center gap-2">
              <FiFileText className="text-carelink-teal" />
              מידע מקצועי
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-carelink-navy mb-2">שנות ניסיון</label>
                <input
                  type="number"
                  name="experience_years"
                  value={formData.experience_years}
                  onChange={handleChange}
                  min="0"
                  className="w-full max-w-xs px-4 py-3 border border-gray-200 rounded-xl focus:border-carelink-teal focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-carelink-navy mb-2">תיאור / ביו</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-carelink-teal focus:outline-none resize-none"
                  placeholder="תיאור קצר על הספק..."
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/providers')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-carelink-teal text-white rounded-xl hover:bg-carelink-teal-medium transition disabled:opacity-50"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiSave />
              )}
              שמור שינויים
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminProviderEdit;
