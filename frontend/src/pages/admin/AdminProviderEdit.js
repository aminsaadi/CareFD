import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import { toast } from 'sonner';
import {
  FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiSave, FiArrowRight,
  FiCheck, FiX, FiStar, FiShield, FiAward, FiImage, FiFileText,
  FiClock, FiGlobe, FiUsers, FiBriefcase, FiCamera, FiPlus, FiTrash2
} from 'react-icons/fi';

// Options data
const PROFESSION_OPTIONS = [
  { value: 'doctor', label: 'רופא/ה' },
  { value: 'nurse', label: 'אח/ות מוסמך/ת' },
  { value: 'physiotherapist', label: 'פיזיותרפיסט/ית' },
  { value: 'occupational_therapist', label: 'מרפא/ה בעיסוק' },
  { value: 'student', label: 'סטודנט/ית' },
  { value: 'caregiver', label: 'מטפל/ת' },
  { value: 'psychologist', label: 'פסיכולוג/ית' },
  { value: 'social_worker', label: 'עובד/ת סוציאלי/ת' },
  { value: 'dietitian', label: 'דיאטן/ית' },
  { value: 'speech_therapist', label: 'קלינאי/ת תקשורת' },
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'זכר' },
  { value: 'female', label: 'נקבה' },
  { value: 'other', label: 'אחר' },
];

const LANGUAGE_OPTIONS = [
  { value: 'hebrew', label: 'עברית' },
  { value: 'arabic', label: 'ערבית' },
  { value: 'english', label: 'אנגלית' },
  { value: 'russian', label: 'רוסית' },
  { value: 'french', label: 'צרפתית' },
  { value: 'spanish', label: 'ספרדית' },
  { value: 'amharic', label: 'אמהרית' },
];

const TARGET_AUDIENCE_OPTIONS = [
  { value: 'adults', label: 'מבוגרים' },
  { value: 'children', label: 'ילדים' },
  { value: 'youth', label: 'נוער' },
  { value: 'babies', label: 'תינוקות' },
  { value: 'women', label: 'נשים' },
  { value: 'elderly', label: 'קשישים' },
  { value: 'pregnant', label: 'נשים בהריון' },
  { value: 'postpartum', label: 'יולדות' },
  { value: 'families', label: 'משפחות' },
];

const SERVICE_AREAS = [
  'תל אביב', 'ירושלים', 'חיפה', 'באר שבע', 'רמת גן', 'הרצליה', 
  'פתח תקווה', 'ראשון לציון', 'נתניה', 'אשדוד', 'חולון', 'בני ברק',
  'רעננה', 'כפר סבא', 'מודיעין', 'אשקלון', 'רחובות', 'בת ים'
];

const DAYS_OF_WEEK = [
  { value: 'sunday', label: 'ראשון' },
  { value: 'monday', label: 'שני' },
  { value: 'tuesday', label: 'שלישי' },
  { value: 'wednesday', label: 'רביעי' },
  { value: 'thursday', label: 'חמישי' },
  { value: 'friday', label: 'שישי' },
  { value: 'saturday', label: 'שבת' },
];

const SHIFT_OPTIONS = [
  { value: 'morning', label: 'בוקר', time: '06:00-12:00', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { value: 'afternoon', label: 'צהריים', time: '12:00-18:00', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { value: 'evening', label: 'ערב', time: '18:00-22:00', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { value: 'night', label: 'לילה', time: '22:00-06:00', color: 'bg-indigo-100 text-indigo-700 border-indigo-300' },
];

const AdminProviderEdit = () => {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  const [formData, setFormData] = useState({
    business_name: '',
    profession_title: '',
    gender: '',
    years_experience: '',
    about: '',
    description: '',
    profile_image: '',
    provider_type: 'individual',
    specializations: [''],
    expertise: [''],
    languages: [],
    target_audience: [],
    service_areas: [],
    phone: '',
    email: '',
    website: '',
    is_verified: false,
    is_recommended: false
  });

  const [location, setLocation] = useState({
    address: '',
    city: '',
    country: 'Israel',
    latitude: null,
    longitude: null,
    coverage_radius_km: 10
  });

  const [availability, setAvailability] = useState([]);

  useEffect(() => {
    fetchProvider();
  }, [providerId]);

  const fetchProvider = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/providers/${providerId}`);
      const data = response.data;

      setFormData({
        business_name: data.business_name || '',
        profession_title: data.profession_title || '',
        gender: data.gender || '',
        years_experience: data.years_experience || '',
        about: data.about || '',
        description: data.description || '',
        profile_image: data.profile_image || '',
        provider_type: data.provider_type || 'individual',
        specializations: data.specializations?.length > 0 ? data.specializations : [''],
        expertise: data.expertise?.length > 0 ? data.expertise : [''],
        languages: data.languages || [],
        target_audience: data.target_audience || [],
        service_areas: data.service_areas || [],
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',
        is_verified: data.is_verified || false,
        is_recommended: data.is_recommended || false
      });
      
      setLocation(data.location || location);
      setAvailability(data.availability || []);
    } catch (error) {
      console.error('Failed to fetch provider:', error);
      toast.error('שגיאה בטעינת נתוני הספק');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('נא להעלות קובץ תמונה בלבד');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('גודל הקובץ חייב להיות עד 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      
      const response = await api.post('/upload/image', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setFormData({ ...formData, profile_image: response.data.url });
      toast.success('התמונה הועלתה בהצלחה!');
    } catch (err) {
      toast.error('שגיאה בהעלאת התמונה');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleArrayFieldChange = (field, index, value) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const addArrayField = (field) => {
    setFormData({ ...formData, [field]: [...formData[field], ''] });
  };

  const removeArrayField = (field, index) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: newArray.length > 0 ? newArray : [''] });
  };

  const toggleMultiSelect = (field, value) => {
    const current = formData[field] || [];
    const newValue = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setFormData({ ...formData, [field]: newValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const dataToSave = {
        ...formData,
        years_experience: formData.years_experience ? parseInt(formData.years_experience) : null,
        specializations: formData.specializations.filter(s => s.trim() !== ''),
        expertise: formData.expertise.filter(e => e.trim() !== ''),
        location,
        availability
      };
      
      await api.put(`/admin/providers/${providerId}`, dataToSave);
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

  const tabs = [
    { id: 'basic', label: 'פרטים בסיסיים', icon: FiUser },
    { id: 'about', label: 'אודות', icon: FiFileText },
    { id: 'expertise', label: 'התמחויות', icon: FiBriefcase },
    { id: 'location', label: 'מיקום ואזורים', icon: FiMapPin },
    { id: 'availability', label: 'זמינות', icon: FiClock },
    { id: 'audience', label: 'קהל יעד ושפות', icon: FiUsers },
  ];

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
      <div className="max-w-5xl mx-auto" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/providers')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <FiArrowRight size={20} />
            </button>
            <div className="flex items-center gap-4">
              {/* Profile Image */}
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-carelink-teal to-carelink-navy flex items-center justify-center overflow-hidden">
                  {formData.profile_image ? (
                    <img 
                      src={formData.profile_image} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-2xl font-bold">
                      {formData.business_name?.[0] || 'P'}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="absolute bottom-0 right-0 w-6 h-6 bg-carelink-teal text-white rounded-full flex items-center justify-center shadow-lg hover:bg-carelink-teal/90 transition"
                >
                  {uploadingImage ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FiCamera size={12} />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-carelink-navy">עריכת ספק</h1>
                <p className="text-carelink-slate">{formData.business_name}</p>
              </div>
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
            {formData.provider_type === 'individual' ? 'עצמאי' : formData.provider_type === 'company' ? 'חברה' : 'מרפאה'}
          </span>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 font-medium whitespace-nowrap transition border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'text-carelink-teal border-carelink-teal bg-carelink-teal-pale/20'
                    : 'text-carelink-gray border-transparent hover:text-carelink-navy hover:bg-gray-50'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-carelink-navy mb-2">שם מלא / שם העסק *</label>
                    <input
                      type="text"
                      value={formData.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
                      placeholder="ד״ר ישראל ישראלי"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-carelink-navy mb-2">מקצוע</label>
                    <select
                      value={formData.profession_title}
                      onChange={(e) => setFormData({ ...formData, profession_title: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none bg-white"
                    >
                      <option value="">בחר מקצוע</option>
                      {PROFESSION_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-carelink-navy mb-2">מגדר</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none bg-white"
                    >
                      <option value="">בחר מגדר</option>
                      {GENDER_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-carelink-navy mb-2">שנות ותק</label>
                    <input
                      type="number"
                      value={formData.years_experience}
                      onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
                      placeholder="15"
                      min="0"
                      max="60"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-carelink-navy mb-2">סוג ספק</label>
                    <select
                      value={formData.provider_type}
                      onChange={(e) => setFormData({ ...formData, provider_type: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none bg-white"
                    >
                      <option value="individual">עצמאי</option>
                      <option value="company">חברה</option>
                      <option value="clinic">מרפאה</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-carelink-navy mb-2">טלפון</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
                      placeholder="050-1234567"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-carelink-navy mb-2">אימייל</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-carelink-navy mb-2">אתר אינטרנט</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none"
                      placeholder="https://www.mywebsite.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-carelink-navy mb-2">תיאור קצר</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none resize-none"
                    placeholder="תיאור קצר שיופיע בכרטיס הספק..."
                  />
                </div>
              </div>
            )}

            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-carelink-navy mb-2">אודות</label>
                  <p className="text-sm text-carelink-gray mb-2">ספר על הספק, הניסיון, והגישה המקצועית</p>
                  <textarea
                    value={formData.about}
                    onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none resize-none"
                    placeholder="ספר על הרקע המקצועי, ההשכלה, הניסיון וגישת הטיפול..."
                  />
                </div>
              </div>
            )}

            {/* Expertise Tab */}
            {activeTab === 'expertise' && (
              <div className="space-y-6">
                {/* Specializations */}
                <div>
                  <label className="block text-sm font-medium text-carelink-navy mb-2">התמחויות</label>
                  <div className="space-y-2">
                    {formData.specializations.map((spec, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={spec}
                          onChange={(e) => handleArrayFieldChange('specializations', index, e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:border-carelink-teal outline-none"
                          placeholder="לדוגמה: רפואת משפחה, כירורגיה..."
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayField('specializations', index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => addArrayField('specializations')}
                    className="mt-2 text-carelink-teal hover:underline flex items-center gap-1 text-sm"
                  >
                    <FiPlus size={12} /> הוסף התמחות
                  </button>
                </div>
                
                {/* Expertise */}
                <div>
                  <label className="block text-sm font-medium text-carelink-navy mb-2">מומחיויות ספציפיות</label>
                  <div className="space-y-2">
                    {formData.expertise.map((exp, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={exp}
                          onChange={(e) => handleArrayFieldChange('expertise', index, e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:border-carelink-teal outline-none"
                          placeholder="לדוגמה: טיפול בכאבי גב, שיקום ספורטאים..."
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayField('expertise', index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => addArrayField('expertise')}
                    className="mt-2 text-carelink-teal hover:underline flex items-center gap-1 text-sm"
                  >
                    <FiPlus size={12} /> הוסף מומחיות
                  </button>
                </div>
              </div>
            )}

            {/* Location Tab */}
            {activeTab === 'location' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-carelink-navy mb-2">כתובת</label>
                    <input
                      type="text"
                      value={location.address}
                      onChange={(e) => setLocation({ ...location, address: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-carelink-teal outline-none"
                      placeholder="רחוב, מספר בית"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-carelink-navy mb-2">עיר</label>
                    <select
                      value={location.city}
                      onChange={(e) => setLocation({ ...location, city: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-carelink-teal outline-none bg-white"
                    >
                      <option value="">בחר עיר</option>
                      {SERVICE_AREAS.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-carelink-navy mb-2">אזורי מתן שירות</label>
                  <p className="text-sm text-carelink-gray mb-3">בחר את האזורים בהם הספק מספק שירות</p>
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_AREAS.map(area => (
                      <button
                        key={area}
                        type="button"
                        onClick={() => toggleMultiSelect('service_areas', area)}
                        className={`px-4 py-2 rounded-full text-sm transition ${
                          formData.service_areas.includes(area)
                            ? 'bg-carelink-teal text-white'
                            : 'bg-gray-100 text-carelink-gray hover:bg-gray-200'
                        }`}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Availability Tab */}
            {activeTab === 'availability' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-carelink-navy mb-2">לוח זמינות שבועי</h3>
                  <p className="text-sm text-carelink-gray mb-4">סמן את המשמרות בהן הספק זמין לעבודה</p>
                </div>
                
                {/* Weekly Schedule Grid */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="p-3 text-right text-sm font-medium text-carelink-navy bg-gray-50 border border-gray-200 rounded-tr-lg">יום</th>
                        {SHIFT_OPTIONS.map(shift => (
                          <th key={shift.value} className="p-3 text-center text-sm font-medium text-carelink-navy bg-gray-50 border border-gray-200">
                            <div>{shift.label}</div>
                            <div className="text-xs text-carelink-gray font-normal">{shift.time}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {DAYS_OF_WEEK.map((day, dayIndex) => (
                        <tr key={day.value}>
                          <td className={`p-3 text-sm font-medium text-carelink-navy bg-gray-50 border border-gray-200 ${dayIndex === DAYS_OF_WEEK.length - 1 ? 'rounded-br-lg' : ''}`}>
                            {day.label}
                          </td>
                          {SHIFT_OPTIONS.map(shift => {
                            const isSelected = availability.some(
                              a => a.day === day.value && a.shift === shift.value && a.is_available
                            );
                            return (
                              <td key={`${day.value}-${shift.value}`} className="p-2 border border-gray-200 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      setAvailability(availability.filter(
                                        a => !(a.day === day.value && a.shift === shift.value)
                                      ));
                                    } else {
                                      setAvailability([...availability, {
                                        day: day.value,
                                        shift: shift.value,
                                        is_available: true
                                      }]);
                                    }
                                  }}
                                  className={`w-full h-10 rounded-lg transition-all duration-200 ${
                                    isSelected 
                                      ? `${shift.color} border-2 shadow-sm` 
                                      : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'
                                  }`}
                                >
                                  {isSelected && <FiCheck className="mx-auto text-sm" />}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Legend */}
                <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
                  <span className="text-sm text-carelink-gray">מקרא משמרות:</span>
                  {SHIFT_OPTIONS.map(shift => (
                    <div key={shift.value} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${shift.color.split(' ')[0]}`}></div>
                      <span className="text-sm text-carelink-navy">{shift.label} ({shift.time})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audience Tab */}
            {activeTab === 'audience' && (
              <div className="space-y-6">
                {/* Languages */}
                <div>
                  <label className="block text-sm font-medium text-carelink-navy mb-2">שפות</label>
                  <p className="text-sm text-carelink-gray mb-3">בחר את השפות בהן הספק מספק שירות</p>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGE_OPTIONS.map(lang => (
                      <button
                        key={lang.value}
                        type="button"
                        onClick={() => toggleMultiSelect('languages', lang.value)}
                        className={`px-4 py-2 rounded-full text-sm transition flex items-center gap-2 ${
                          formData.languages.includes(lang.value)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-carelink-gray hover:bg-gray-200'
                        }`}
                      >
                        <FiGlobe size={14} />
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Target Audience */}
                <div>
                  <label className="block text-sm font-medium text-carelink-navy mb-2">קהל יעד</label>
                  <p className="text-sm text-carelink-gray mb-3">בחר את קהלי היעד של הספק</p>
                  <div className="flex flex-wrap gap-2">
                    {TARGET_AUDIENCE_OPTIONS.map(audience => (
                      <button
                        key={audience.value}
                        type="button"
                        onClick={() => toggleMultiSelect('target_audience', audience.value)}
                        className={`px-4 py-2 rounded-full text-sm transition flex items-center gap-2 ${
                          formData.target_audience.includes(audience.value)
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 text-carelink-gray hover:bg-gray-200'
                        }`}
                      >
                        <FiUsers size={14} />
                        {audience.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
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
      </div>
    </AdminLayout>
  );
};

export default AdminProviderEdit;
