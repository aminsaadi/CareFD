import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import MapPicker from '../components/MapPicker';
import api from '../utils/api';
import {
  FaPlus, FaTrash, FaSave, FaCamera, FaUser, FaMapMarkerAlt,
  FaClock, FaLanguage, FaUsers, FaBriefcase, FaGraduationCap,
  FaInfoCircle, FaCheck, FaTimes, FaAward, FaCreditCard, FaPhone,
  FaWhatsapp, FaEnvelope, FaFileAlt, FaUpload, FaEye, FaEyeSlash
} from 'react-icons/fa';
import CitySelect, { sortedCities } from '../components/CitySelect';
import { israeliRegions } from '../data/searchData';

// Options data - professions loaded from API (admin-managed)

const PROVIDER_TYPE_OPTIONS = [
  { value: 'individual', label: 'עצמאי / פרילנסר' },
  { value: 'company', label: 'חברה / עסק' },
  { value: 'clinic', label: 'מרפאה' },
  { value: 'organization', label: 'עמותה / ארגון' },
];

const SERVICE_TYPE_OPTIONS = [
  { value: 'home_visit', label: 'ביקור בית' },
  { value: 'clinic_visit', label: 'ביקור במרפאה' },
  { value: 'video_call', label: 'טלרפואה / שיחת וידאו' },
  { value: 'phone_call', label: 'ייעוץ טלפוני' },
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
];

const SERVICE_AREAS = sortedCities;

// New options for enhanced profile
const HEALTH_FUNDS = [
  { value: 'clalit', label: 'כללית' },
  { value: 'maccabi', label: 'מכבי' },
  { value: 'meuhedet', label: 'מאוחדת' },
  { value: 'leumit', label: 'לאומית' },
  { value: 'private', label: 'פרטי בלבד' },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'מזומן' },
  { value: 'credit_card', label: 'כרטיס אשראי' },
  { value: 'bit', label: 'ביט' },
  { value: 'paybox', label: 'PayBox' },
  { value: 'bank_transfer', label: 'העברה בנקאית' },
  { value: 'check', label: 'צ\'ק' },
];

const EDUCATION_LEVELS = [
  { value: 'diploma', label: 'תעודה מקצועית' },
  { value: 'bachelor', label: 'תואר ראשון' },
  { value: 'master', label: 'תואר שני' },
  { value: 'phd', label: 'דוקטורט' },
  { value: 'specialist', label: 'התמחות רפואית' },
];

const PROFILE_COLORS = [
  'from-carefd-teal to-carefd-navy',
  'from-blue-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-red-500',
  'from-pink-500 to-rose-500',
  'from-indigo-500 to-blue-600',
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

const ProviderEdit = () => {
  const { t } = useTranslation();
  const { providerId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const certificateInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCertificate, setUploadingCertificate] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [professions, setProfessions] = useState([]); // From admin hierarchy

  // Form state
  const [formData, setFormData] = useState({
    business_name: '',
    profession_title: '',
    // Profession hierarchy (from admin)
    profession_id: '',
    profession_name: '',
    specialization_id: '',
    specialization_name: '',
    service_categories: [], // [{category_id, name, profession_id}]
    gender: '',
    years_experience: '',
    about: '',
    description: '',
    profile_image: '',
    profile_color: 'from-carefd-teal to-carefd-navy',
    provider_type: 'individual',
    service_types: [],
    specializations: [''],
    expertise: [''],
    languages: [],
    target_audience: [],
    service_areas: [],
    phone: '',
    email: '',
    website: '',
    // New fields
    health_funds: [],
    payment_methods: [],
    cancellation_policy: '',
    cancellation_notice_hours: 24,
    // Contact visibility settings
    show_phone: true,
    show_email: true,
    show_whatsapp: true,
    whatsapp_number: '',
    // Education
    education: [{
      degree: '',
      institution: '',
      year: '',
      field: ''
    }],
    // Certifications
    certifications: [{
      name: '',
      issuer: '',
      year: '',
      license_number: '',
      document_url: ''
    }],
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
    fetchProfessions();
    fetchProvider();
  }, [providerId]);

  const fetchProfessions = async () => {
    try {
      const response = await api.get('/professions');
      setProfessions(response.data.professions || []);
    } catch (err) {
      console.error('Failed to fetch professions:', err);
    }
  };

  const fetchProvider = async () => {
    try {
      const response = await api.get(`/providers/${providerId}`);
      const data = response.data;

      if (data.user_id !== user?.user_id && user?.role !== 'admin') {
        navigate('/dashboard');
        return;
      }

      setFormData({
        business_name: data.business_name || '',
        profession_title: data.profession_title || '',
        profession_id: data.profession_id || '',
        profession_name: data.profession_name || '',
        specialization_id: data.specialization_id || '',
        specialization_name: data.specialization_name || '',
        service_categories: data.service_categories || [],
        gender: data.gender || '',
        years_experience: data.years_experience || '',
        about: data.about || '',
        description: data.description || '',
        profile_image: data.profile_image || '',
        profile_color: data.profile_color || 'from-carefd-teal to-carefd-navy',
        provider_type: data.provider_type || 'individual',
        service_types: data.service_types || [],
        specializations: data.specializations?.length > 0 ? data.specializations : [''],
        expertise: data.expertise?.length > 0 ? data.expertise : [''],
        languages: data.languages || [],
        target_audience: data.target_audience || [],
        service_areas: data.service_areas || [],
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',
        // New fields
        health_funds: data.health_funds || [],
        payment_methods: data.payment_methods || [],
        cancellation_policy: data.cancellation_policy || '',
        cancellation_notice_hours: data.cancellation_notice_hours || 24,
        show_phone: data.show_phone !== false,
        show_email: data.show_email !== false,
        show_whatsapp: data.show_whatsapp !== false,
        whatsapp_number: data.whatsapp_number || data.phone || '',
        education: data.education?.length > 0 ? data.education : [{
          degree: '',
          institution: '',
          year: '',
          field: ''
        }],
        certifications: data.certifications?.length > 0 ? data.certifications : [{
          name: '',
          issuer: '',
          year: '',
          license_number: '',
          document_url: ''
        }],
      });
      
      setLocation(data.location || location);
      setAvailability(data.availability || []);
    } catch (error) {
      console.error('Failed to fetch provider:', error);
      setError('שגיאה בטעינת הפרופיל');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const dataToSave = {
        ...formData,
        years_experience: formData.years_experience ? parseInt(formData.years_experience) : null,
        specializations: formData.specializations.filter(s => s.trim() !== ''),
        expertise: formData.expertise.filter(e => e.trim() !== ''),
        service_types: formData.service_types || [],
        service_categories: formData.service_categories || [],
        education: formData.education.filter(e => e.institution || e.degree),
        certifications: formData.certifications.filter(c => c.name || c.license_number),
        location,
        availability
      };
      
      await api.put(`/providers/${providerId}`, dataToSave);
      setSuccess('הפרופיל נשמר בהצלחה!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'שגיאה בשמירת הפרופיל');
    } finally {
      setSaving(false);
    }
  };

  const handleCertificateUpload = async (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('גודל הקובץ חייב להיות עד 10MB');
      return;
    }

    setUploadingCertificate(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      
      const response = await api.post('/upload/image', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const newCertifications = [...formData.certifications];
      newCertifications[index] = { ...newCertifications[index], document_url: response.data.url };
      setFormData({ ...formData, certifications: newCertifications });
      setSuccess('התעודה הועלתה בהצלחה!');
    } catch (err) {
      setError('שגיאה בהעלאת התעודה');
    } finally {
      setUploadingCertificate(false);
    }
  };

  // Education management functions
  const addEducation = () => {
    setFormData({
      ...formData,
      education: [...formData.education, { degree: '', institution: '', year: '', field: '' }]
    });
  };

  const updateEducation = (index, field, value) => {
    const newEducation = [...formData.education];
    newEducation[index] = { ...newEducation[index], [field]: value };
    setFormData({ ...formData, education: newEducation });
  };

  const removeEducation = (index) => {
    const newEducation = formData.education.filter((_, i) => i !== index);
    setFormData({ ...formData, education: newEducation.length > 0 ? newEducation : [{ degree: '', institution: '', year: '', field: '' }] });
  };

  // Certification management functions
  const addCertification = () => {
    setFormData({
      ...formData,
      certifications: [...formData.certifications, { name: '', issuer: '', year: '', license_number: '', document_url: '' }]
    });
  };

  const updateCertification = (index, field, value) => {
    const newCertifications = [...formData.certifications];
    newCertifications[index] = { ...newCertifications[index], [field]: value };
    setFormData({ ...formData, certifications: newCertifications });
  };

  const removeCertification = (index) => {
    const newCertifications = formData.certifications.filter((_, i) => i !== index);
    setFormData({ ...formData, certifications: newCertifications.length > 0 ? newCertifications : [{ name: '', issuer: '', year: '', license_number: '', document_url: '' }] });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('נא להעלות קובץ תמונה בלבד');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('גודל הקובץ חייב להיות עד 5MB');
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
      setSuccess('התמונה הועלתה בהצלחה!');
    } catch (err) {
      setError('שגיאה בהעלאת התמונה');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = () => {
    setFormData({ ...formData, profile_image: '' });
    setSuccess('התמונה הוסרה. לחץ "שמור שינויים" לעדכון הפרופיל.');
    setTimeout(() => setSuccess(''), 3000);
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

  const addAvailabilitySlot = () => {
    setAvailability([...availability, {
      day: 'sunday',
      start_time: '09:00',
      end_time: '17:00',
      is_available: true
    }]);
  };

  const updateAvailabilitySlot = (index, field, value) => {
    const newAvailability = [...availability];
    newAvailability[index] = { ...newAvailability[index], [field]: value };
    setAvailability(newAvailability);
  };

  const removeAvailabilitySlot = (index) => {
    setAvailability(availability.filter((_, i) => i !== index));
  };

  const tabs = [
    { id: 'basic', label: 'פרטי פרופיל', icon: FaUser },
    { id: 'about', label: 'אודות', icon: FaInfoCircle },
    { id: 'expertise', label: 'התמחויות', icon: FaGraduationCap },
    { id: 'education', label: 'השכלה ותעודות', icon: FaAward },
    { id: 'location', label: 'מיקום ואזורים', icon: FaMapMarkerAlt },
    { id: 'availability', label: 'זמינות', icon: FaClock },
    { id: 'audience', label: 'קהל יעד ושפות', icon: FaUsers },
    { id: 'business', label: 'תשלום וקופות', icon: FaCreditCard },
    { id: 'contact', label: 'הגדרות קשר', icon: FaPhone },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="w-12 h-12 border-4 border-carefd-teal border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-6">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-carefd-teal to-carefd-navy flex items-center justify-center overflow-hidden">
                {formData.profile_image ? (
                  <img 
                    src={formData.profile_image} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-3xl font-bold">
                    {formData.business_name?.[0] || 'P'}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="absolute bottom-0 right-0 w-8 h-8 bg-carefd-teal text-white rounded-full flex items-center justify-center shadow-lg hover:bg-carefd-teal/90 transition"
                title="העלה תמונה"
              >
                {uploadingImage ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FaCamera size={14} />
                )}
              </button>
              {formData.profile_image && (
                <button
                  onClick={handleDeleteImage}
                  className="absolute bottom-0 left-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition"
                  title="מחק תמונה"
                  data-testid="delete-profile-image-btn"
                >
                  <FaTrash size={12} />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-carefd-navy">עריכת פרופיל</h1>
              <p className="text-carefd-gray">עדכן את פרטי הפרופיל שלך</p>
            </div>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-carefd-teal text-white rounded-lg hover:bg-carefd-teal/90 transition flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FaSave />
              )}
              שמור שינויים
            </button>
          </div>
          
          {/* Alerts */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
              <FaTimes /> {error}
            </div>
          )}
          {success && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-600 flex items-center gap-2">
              <FaCheck /> {success}
            </div>
          )}
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
                    ? 'text-carefd-teal border-carefd-teal bg-carefd-teal-pale/20'
                    : 'text-carefd-gray border-transparent hover:text-carefd-navy hover:bg-gray-50'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Profile Details Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-8">
                {/* Section: Personal / Business Info */}
                <div>
                  <h3 className="text-lg font-semibold text-carefd-navy mb-4 flex items-center gap-2">
                    <FaUser className="text-carefd-teal" />
                    פרטים אישיים
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-carefd-navy mb-2">שם מלא / שם העסק *</label>
                      <input
                        type="text"
                        value={formData.business_name}
                        onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                        placeholder="ד״ר ישראל ישראלי"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-carefd-navy mb-2">מגדר</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none bg-white"
                      >
                        <option value="">בחר מגדר</option>
                        {GENDER_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-carefd-navy mb-2">טלפון</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                        placeholder="050-1234567"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-carefd-navy mb-2">אימייל</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-carefd-navy mb-2">תיאור קצר</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none resize-none"
                      placeholder="תיאור קצר שיופיע בכרטיס הספק..."
                    />
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Section: Professional Details */}
                <div>
                  <h3 className="text-lg font-semibold text-carefd-navy mb-4 flex items-center gap-2">
                    <FaBriefcase className="text-carefd-teal" />
                    פרטים מקצועיים
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-carefd-navy mb-2">מקצוע *</label>
                      <select
                        value={formData.profession_id}
                        onChange={(e) => {
                          const prof = professions.find(p => p.profession_id === e.target.value);
                          setFormData({
                            ...formData,
                            profession_id: e.target.value,
                            profession_name: prof?.name || '',
                            profession_title: prof?.name || '',
                            specialization_id: '',
                            specialization_name: '',
                            service_categories: [],
                          });
                        }}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none bg-white"
                      >
                        <option value="">בחר מקצוע</option>
                        {professions.map(prof => (
                          <option key={prof.profession_id} value={prof.profession_id}>{prof.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Specialization inline (from selected profession) */}
                    <div>
                      <label className="block text-sm font-medium text-carefd-navy mb-2">התמחות</label>
                      {formData.profession_id ? (() => {
                        const selectedProfession = professions.find(p => p.profession_id === formData.profession_id);
                        const subProfessions = selectedProfession?.sub_professions || [];
                        return subProfessions.length > 0 ? (
                          <select
                            value={formData.specialization_id}
                            onChange={(e) => {
                              const sub = subProfessions.find(s => s.sub_profession_id === e.target.value);
                              setFormData({
                                ...formData,
                                specialization_id: e.target.value,
                                specialization_name: sub?.name || '',
                              });
                            }}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none bg-white"
                          >
                            <option value="">בחר התמחות</option>
                            {subProfessions.map(sub => (
                              <option key={sub.sub_profession_id} value={sub.sub_profession_id}>{sub.name}</option>
                            ))}
                          </select>
                        ) : (
                          <p className="px-4 py-3 text-sm text-carefd-gray border border-gray-200 rounded-lg bg-gray-50">אין התמחויות מוגדרות למקצוע זה</p>
                        );
                      })() : (
                        <p className="px-4 py-3 text-sm text-carefd-gray border border-gray-200 rounded-lg bg-gray-50">יש לבחור מקצוע תחילה</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-carefd-navy mb-2">סוג ספק</label>
                      <select
                        value={formData.provider_type}
                        onChange={(e) => setFormData({ ...formData, provider_type: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none bg-white"
                      >
                        {PROVIDER_TYPE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-carefd-navy mb-2">שנות ניסיון</label>
                      <input
                        type="number"
                        value={formData.years_experience}
                        onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                        placeholder="10"
                        min="0"
                        max="60"
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Section: Service Types */}
                <div>
                  <h3 className="text-lg font-semibold text-carefd-navy mb-2 flex items-center gap-2">
                    <FaGraduationCap className="text-carefd-teal" />
                    סוגי שירות
                  </h3>
                  <p className="text-sm text-carefd-gray mb-4">באילו דרכים את/ה מספק/ת שירות?</p>
                  <div className="flex flex-wrap gap-3">
                    {SERVICE_TYPE_OPTIONS.map(opt => {
                      const isSelected = (formData.service_types || []).includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            const current = formData.service_types || [];
                            const updated = isSelected
                              ? current.filter(t => t !== opt.value)
                              : [...current, opt.value];
                            setFormData({ ...formData, service_types: updated });
                          }}
                          className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-carefd-teal text-white border-carefd-teal shadow-sm'
                              : 'bg-white text-carefd-navy border-gray-200 hover:border-carefd-teal hover:bg-carefd-teal-pale/20'
                          }`}
                        >
                          {isSelected && <FaCheck className="inline ms-1.5" size={12} />}
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Section: Specializations (free text) */}
                <div>
                  <h3 className="text-lg font-semibold text-carefd-navy mb-2 flex items-center gap-2">
                    <FaGraduationCap className="text-carefd-teal" />
                    התמחויות נוספות
                  </h3>
                  <p className="text-sm text-carefd-gray mb-4">הוסף תחומי מומחיות ספציפיים</p>
                  <div className="space-y-2">
                    {formData.specializations.map((spec, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={spec}
                          onChange={(e) => handleArrayFieldChange('specializations', index, e.target.value)}
                          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:border-carefd-teal outline-none"
                          placeholder="לדוגמה: טיפול בכאבי גב, שיקום ספורטאים..."
                        />
                        <button
                          onClick={() => removeArrayField('specializations', index)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => addArrayField('specializations')}
                    className="mt-2 text-carefd-teal hover:underline flex items-center gap-1 text-sm"
                  >
                    <FaPlus size={12} /> הוסף התמחות
                  </button>
                </div>
              </div>
            )}

            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-carefd-navy mb-2">אודות</label>
                  <p className="text-sm text-carefd-gray mb-2">ספר על עצמך, הניסיון שלך, והגישה המקצועית שלך</p>
                  <textarea
                    value={formData.about}
                    onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none resize-none"
                    placeholder="ספר על הרקע המקצועי שלך, ההשכלה, הניסיון וגישת הטיפול..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-carefd-navy mb-2">אתר אינטרנט</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-carefd-teal focus:ring-1 focus:ring-carefd-teal outline-none"
                    placeholder="https://www.mywebsite.com"
                  />
                </div>
              </div>
            )}

            {/* Expertise Tab */}
            {activeTab === 'expertise' && (
              <div className="space-y-6">
                {/* Profession Selection Info */}
                {!formData.profession_id && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 flex items-center gap-2">
                    <FaInfoCircle /> יש לבחור מקצוע בטאב "פרטי פרופיל" כדי לראות התמחויות וקטגוריות רלוונטיות
                  </div>
                )}

                {/* Specialization (sub-profession) - dropdown from hierarchy */}
                {formData.profession_id && (() => {
                  const selectedProfession = professions.find(p => p.profession_id === formData.profession_id);
                  const subProfessions = selectedProfession?.sub_professions || [];
                  return (
                    <div>
                      <label className="block text-sm font-medium text-carefd-navy mb-2">
                        <FaBriefcase className="inline ms-1" />
                        התמחות
                      </label>
                      <p className="text-sm text-carefd-gray mb-2">בחר את תחום ההתמחות שלך בתוך {selectedProfession?.name}</p>
                      {subProfessions.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {subProfessions.map(sub => (
                            <button
                              key={sub.sub_profession_id}
                              onClick={() => setFormData({
                                ...formData,
                                specialization_id: sub.sub_profession_id,
                                specialization_name: sub.name,
                              })}
                              className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
                                formData.specialization_id === sub.sub_profession_id
                                  ? 'bg-carefd-teal text-white border-carefd-teal'
                                  : 'bg-white text-carefd-navy border-gray-200 hover:border-carefd-teal hover:bg-carefd-teal/5'
                              }`}
                            >
                              {formData.specialization_id === sub.sub_profession_id && <FaCheck className="inline ms-1" size={12} />}
                              {sub.name}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-carefd-gray italic">אין התמחויות מוגדרות למקצוע זה</p>
                      )}
                    </div>
                  );
                })()}

                {/* Service Categories - multi-select from all professions hierarchy */}
                {formData.profession_id && (() => {
                  // Collect all categories from all professions
                  const allCategories = [];
                  professions.forEach(prof => {
                    (prof.sub_professions || []).forEach(sub => {
                      (sub.categories || []).forEach(cat => {
                        allCategories.push({
                          ...cat,
                          profession_id: prof.profession_id,
                          profession_name: prof.name,
                          sub_profession_name: sub.name,
                        });
                      });
                    });
                  });

                  const selectedCategories = formData.service_categories || [];
                  const isSelected = (catId) => selectedCategories.some(c => c.category_id === catId);

                  const toggleCategory = (cat) => {
                    if (isSelected(cat.category_id)) {
                      setFormData({
                        ...formData,
                        service_categories: selectedCategories.filter(c => c.category_id !== cat.category_id)
                      });
                    } else if (selectedCategories.length < 3) {
                      setFormData({
                        ...formData,
                        service_categories: [...selectedCategories, {
                          category_id: cat.category_id,
                          name: cat.name,
                          profession_id: cat.profession_id,
                          profession_name: cat.profession_name,
                        }]
                      });
                    }
                  };

                  // Group categories by profession
                  const categoriesByProfession = {};
                  allCategories.forEach(cat => {
                    const key = cat.profession_name;
                    if (!categoriesByProfession[key]) categoriesByProfession[key] = [];
                    categoriesByProfession[key].push(cat);
                  });

                  return (
                    <div>
                      <label className="block text-sm font-medium text-carefd-navy mb-2">
                        <FaGraduationCap className="inline ms-1" />
                        קטגוריות שירות ({selectedCategories.length}/3)
                      </label>
                      <p className="text-sm text-carefd-gray mb-3">בחר עד 3 קטגוריות שירות שאתה מציע</p>

                      {/* Selected categories */}
                      {selectedCategories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {selectedCategories.map(cat => (
                            <span key={cat.category_id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-carefd-teal/10 text-carefd-teal border border-carefd-teal/30 rounded-full text-sm font-medium">
                              {cat.name}
                              <span className="text-xs text-carefd-gray">({cat.profession_name})</span>
                              <button onClick={() => toggleCategory(cat)} className="me-1 hover:text-red-500">
                                <FaTimes size={10} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Available categories grouped by profession */}
                      {Object.keys(categoriesByProfession).length > 0 ? (
                        <div className="space-y-3">
                          {Object.entries(categoriesByProfession).map(([profName, cats]) => (
                            <div key={profName} className="border border-gray-100 rounded-lg p-3">
                              <p className="text-sm font-medium text-carefd-navy mb-2">{profName}</p>
                              <div className="flex flex-wrap gap-2">
                                {cats.map(cat => (
                                  <button
                                    key={cat.category_id}
                                    onClick={() => toggleCategory(cat)}
                                    disabled={!isSelected(cat.category_id) && selectedCategories.length >= 3}
                                    className={`px-3 py-1.5 rounded-full border text-sm transition ${
                                      isSelected(cat.category_id)
                                        ? 'bg-carefd-teal text-white border-carefd-teal'
                                        : selectedCategories.length >= 3
                                          ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                                          : 'bg-white text-carefd-navy border-gray-200 hover:border-carefd-teal'
                                    }`}
                                  >
                                    {isSelected(cat.category_id) && <FaCheck className="inline ms-1" size={10} />}
                                    {cat.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-carefd-gray italic">אין קטגוריות שירות מוגדרות עדיין. ניתן להגדירן בפאנל האדמין.</p>
                      )}
                    </div>
                  );
                })()}

                {/* Free text expertise */}
                <div>
                  <label className="block text-sm font-medium text-carefd-navy mb-2">מומחיויות ספציפיות</label>
                  <p className="text-sm text-carefd-gray mb-2">הוסף מומחיויות ספציפיות שלא מופיעות ברשימה</p>
                  <div className="space-y-2">
                    {formData.expertise.map((exp, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={exp}
                          onChange={(e) => handleArrayFieldChange('expertise', index, e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:border-carefd-teal outline-none"
                          placeholder="לדוגמה: טיפול בכאבי גב, שיקום ספורטאים..."
                        />
                        <button
                          onClick={() => removeArrayField('expertise', index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => addArrayField('expertise')}
                    className="mt-2 text-carefd-teal hover:underline flex items-center gap-1 text-sm"
                  >
                    <FaPlus size={12} /> הוסף מומחיות
                  </button>
                </div>
              </div>
            )}

            {/* Location Tab */}
            {activeTab === 'location' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-carefd-navy mb-2">כתובת</label>
                    <input
                      type="text"
                      value={location.address}
                      onChange={(e) => setLocation({ ...location, address: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-carefd-teal outline-none"
                      placeholder="רחוב, מספר בית"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-carefd-navy mb-2">עיר</label>
                    <CitySelect
                      name="city"
                      value={location.city}
                      onChange={(e) => setLocation({ ...location, city: e.target.value })}
                      placeholder="בחר עיר..."
                      inputClassName="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-carefd-teal outline-none bg-white"
                    />
                  </div>
                </div>

                {/* Map + Radius */}
                <div>
                  <label className="block text-sm font-medium text-carefd-navy mb-2">מיקום במפה ורדיוס כיסוי</label>
                  <p className="text-sm text-carefd-gray mb-2">לחץ על המפה לבחירת מיקום. הרדיוס מוצג בקו מקווקו.</p>
                  <MapPicker
                    location={location}
                    setLocation={setLocation}
                    height="h-80"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-carefd-navy mb-2">אזורי מתן שירות</label>
                  <p className="text-sm text-carefd-gray mb-3">בחר אזור שלם או חפש והוסף ערים בודדות</p>

                  {/* Region quick-select buttons */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {israeliRegions.map(region => {
                      const regionTag = `אזור: ${region.name}`;
                      const isSelected = formData.service_areas.includes(regionTag);
                      return (
                        <button
                          key={region.id}
                          type="button"
                          onClick={() => {
                            const current = formData.service_areas || [];
                            if (isSelected) {
                              // Remove region tag and its cities
                              const regionCities = region.cities || [];
                              const filtered = current.filter(a => a !== regionTag && !regionCities.includes(a));
                              setFormData({ ...formData, service_areas: filtered });
                            } else {
                              // Add region tag and all its cities (avoid duplicates)
                              const regionCities = region.cities || [];
                              const merged = [...new Set([...current, regionTag, ...regionCities])];
                              setFormData({ ...formData, service_areas: merged });
                            }
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm border transition flex items-center gap-1 ${
                            isSelected
                              ? 'bg-carefd-navy text-white border-carefd-navy'
                              : 'bg-white text-carefd-navy border-gray-300 hover:border-carefd-teal'
                          }`}
                        >
                          <FaMapMarkerAlt className="text-xs" />
                          {region.name}
                          {isSelected && <FaCheck className="text-xs" />}
                        </button>
                      );
                    })}
                  </div>

                  <CitySelect
                    name="service_area_add"
                    value=""
                    onChange={(e) => {
                      if (e.target.value && !formData.service_areas.includes(e.target.value)) {
                        toggleMultiSelect('service_areas', e.target.value);
                      }
                    }}
                    placeholder="חפש עיר להוספה..."
                    inputClassName="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-carefd-teal outline-none bg-white mb-3"
                  />
                  {formData.service_areas.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.service_areas.map(area => (
                        <button
                          key={area}
                          onClick={() => {
                            if (area.startsWith('אזור: ')) {
                              // Removing a region tag - also remove its cities
                              const regionName = area.replace('אזור: ', '');
                              const region = israeliRegions.find(r => r.name === regionName);
                              const regionCities = region?.cities || [];
                              const current = formData.service_areas || [];
                              const filtered = current.filter(a => a !== area && !regionCities.includes(a));
                              setFormData({ ...formData, service_areas: filtered });
                            } else {
                              toggleMultiSelect('service_areas', area);
                            }
                          }}
                          className={`px-4 py-2 rounded-full text-sm transition flex items-center gap-1 ${
                            area.startsWith('אזור: ')
                              ? 'bg-carefd-navy text-white'
                              : 'bg-carefd-teal text-white'
                          }`}
                        >
                          {area.startsWith('אזור: ') && <FaMapMarkerAlt className="text-xs" />}
                          {area}
                          <FaTimes className="text-xs" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-carefd-navy mb-2">רדיוס כיסוי (ק"מ)</label>
                  <input
                    type="number"
                    value={location.coverage_radius_km}
                    onChange={(e) => setLocation({ ...location, coverage_radius_km: parseInt(e.target.value) || 10 })}
                    className="w-32 px-4 py-3 border border-gray-200 rounded-lg focus:border-carefd-teal outline-none"
                    min="1"
                    max="100"
                  />
                </div>
              </div>
            )}

            {/* Availability Tab */}
            {activeTab === 'availability' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-carefd-navy mb-2">לוח זמינות שבועי</h3>
                  <p className="text-sm text-carefd-gray mb-4">סמן את המשמרות בהן אתה זמין לעבודה</p>
                </div>
                
                {/* Weekly Schedule Grid */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="p-3 text-right text-sm font-medium text-carefd-navy bg-gray-50 border border-gray-200 rounded-tr-lg">יום</th>
                        {SHIFT_OPTIONS.map(shift => (
                          <th key={shift.value} className="p-3 text-center text-sm font-medium text-carefd-navy bg-gray-50 border border-gray-200">
                            <div>{shift.label}</div>
                            <div className="text-xs text-carefd-gray font-normal">{shift.time}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {DAYS_OF_WEEK.map((day, dayIndex) => (
                        <tr key={day.value}>
                          <td className={`p-3 text-sm font-medium text-carefd-navy bg-gray-50 border border-gray-200 ${dayIndex === DAYS_OF_WEEK.length - 1 ? 'rounded-br-lg' : ''}`}>
                            {day.label}
                          </td>
                          {SHIFT_OPTIONS.map(shift => {
                            const isSelected = availability.some(
                              a => a.day === day.value && a.shift === shift.value && a.is_available
                            );
                            return (
                              <td key={`${day.value}-${shift.value}`} className="p-2 border border-gray-200 text-center">
                                <button
                                  onClick={() => {
                                    if (isSelected) {
                                      // Remove this availability
                                      setAvailability(availability.filter(
                                        a => !(a.day === day.value && a.shift === shift.value)
                                      ));
                                    } else {
                                      // Add this availability
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
                                  data-testid={`availability-${day.value}-${shift.value}`}
                                >
                                  {isSelected && <FaCheck className="mx-auto text-sm" />}
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
                  <span className="text-sm text-carefd-gray">מקרא משמרות:</span>
                  {SHIFT_OPTIONS.map(shift => (
                    <div key={shift.value} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${shift.color.split(' ')[0]}`}></div>
                      <span className="text-sm text-carefd-navy">{shift.label} ({shift.time})</span>
                    </div>
                  ))}
                </div>
                
                {/* Summary */}
                {availability.length > 0 && (
                  <div className="bg-carefd-teal-pale/30 rounded-lg p-4">
                    <h4 className="font-medium text-carefd-navy mb-2">סיכום זמינות</h4>
                    <p className="text-sm text-carefd-gray">
                      {availability.filter(a => a.is_available).length} משמרות זמינות בשבוע
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Audience Tab */}
            {activeTab === 'audience' && (
              <div className="space-y-6">
                {/* Languages */}
                <div>
                  <label className="block text-sm font-medium text-carefd-navy mb-2">שפות</label>
                  <p className="text-sm text-carefd-gray mb-3">בחר את השפות בהן אתה מספק שירות</p>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGE_OPTIONS.map(lang => (
                      <button
                        key={lang.value}
                        onClick={() => toggleMultiSelect('languages', lang.value)}
                        className={`px-4 py-2 rounded-full text-sm transition flex items-center gap-2 ${
                          formData.languages.includes(lang.value)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-carefd-gray hover:bg-gray-200'
                        }`}
                      >
                        <FaLanguage size={14} />
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Target Audience */}
                <div>
                  <label className="block text-sm font-medium text-carefd-navy mb-2">קהל יעד</label>
                  <p className="text-sm text-carefd-gray mb-3">בחר את קהלי היעד שלך</p>
                  <div className="flex flex-wrap gap-2">
                    {TARGET_AUDIENCE_OPTIONS.map(audience => (
                      <button
                        key={audience.value}
                        onClick={() => toggleMultiSelect('target_audience', audience.value)}
                        className={`px-4 py-2 rounded-full text-sm transition flex items-center gap-2 ${
                          formData.target_audience.includes(audience.value)
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 text-carefd-gray hover:bg-gray-200'
                        }`}
                      >
                        <FaUsers size={14} />
                        {audience.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Education & Certifications Tab */}
            {activeTab === 'education' && (
              <div className="space-y-8">
                {/* Education Section */}
                <div>
                  <h3 className="text-lg font-bold text-carefd-navy mb-4 flex items-center gap-2">
                    <FaGraduationCap className="text-carefd-teal" />
                    השכלה
                  </h3>
                  <div className="space-y-4">
                    {formData.education.map((edu, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-sm font-medium text-carefd-gray">השכלה {index + 1}</span>
                          {formData.education.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeEducation(index)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-carefd-gray mb-1">תואר/תעודה</label>
                            <select
                              value={edu.degree}
                              onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-carefd-teal outline-none bg-white"
                            >
                              <option value="">בחר סוג</option>
                              {EDUCATION_LEVELS.map(level => (
                                <option key={level.value} value={level.value}>{level.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm text-carefd-gray mb-1">תחום</label>
                            <input
                              type="text"
                              value={edu.field}
                              onChange={(e) => updateEducation(index, 'field', e.target.value)}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-carefd-teal outline-none"
                              placeholder="רפואה, סיעוד, פיזיותרפיה..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-carefd-gray mb-1">מוסד לימודים</label>
                            <input
                              type="text"
                              value={edu.institution}
                              onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-carefd-teal outline-none"
                              placeholder="אוניברסיטת תל אביב, טכניון..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-carefd-gray mb-1">שנת סיום</label>
                            <input
                              type="number"
                              value={edu.year}
                              onChange={(e) => updateEducation(index, 'year', e.target.value)}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-carefd-teal outline-none"
                              placeholder="2020"
                              min="1950"
                              max={new Date().getFullYear()}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addEducation}
                    className="mt-3 text-carefd-teal hover:text-carefd-teal-medium flex items-center gap-2 text-sm font-medium"
                  >
                    <FaPlus /> הוסף השכלה
                  </button>
                </div>

                {/* Certifications Section */}
                <div>
                  <h3 className="text-lg font-bold text-carefd-navy mb-4 flex items-center gap-2">
                    <FaAward className="text-carefd-teal" />
                    תעודות ורישיונות
                  </h3>
                  <div className="space-y-4">
                    {formData.certifications.map((cert, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-sm font-medium text-carefd-gray">תעודה {index + 1}</span>
                          {formData.certifications.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeCertification(index)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-carefd-gray mb-1">שם התעודה/רישיון</label>
                            <input
                              type="text"
                              value={cert.name}
                              onChange={(e) => updateCertification(index, 'name', e.target.value)}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-carefd-teal outline-none"
                              placeholder="רישיון לעסוק ברפואה, הסמכה בפיזיותרפיה..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-carefd-gray mb-1">גוף מנפיק</label>
                            <input
                              type="text"
                              value={cert.issuer}
                              onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-carefd-teal outline-none"
                              placeholder="משרד הבריאות, לשכת רופאים..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-carefd-gray mb-1">מספר רישיון</label>
                            <input
                              type="text"
                              value={cert.license_number}
                              onChange={(e) => updateCertification(index, 'license_number', e.target.value)}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-carefd-teal outline-none"
                              placeholder="123456"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-carefd-gray mb-1">שנה</label>
                            <input
                              type="number"
                              value={cert.year}
                              onChange={(e) => updateCertification(index, 'year', e.target.value)}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-carefd-teal outline-none"
                              placeholder="2020"
                              min="1950"
                              max={new Date().getFullYear()}
                            />
                          </div>
                        </div>
                        {/* Document Upload */}
                        <div className="mt-4">
                          <label className="block text-sm text-carefd-gray mb-2">העלאת תעודה (אופציונלי)</label>
                          {cert.document_url ? (
                            <div className="flex items-center gap-3">
                              <a 
                                href={cert.document_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-carefd-teal hover:underline flex items-center gap-2"
                              >
                                <FaFileAlt /> צפה בתעודה
                              </a>
                              <button
                                type="button"
                                onClick={() => updateCertification(index, 'document_url', '')}
                                className="text-red-500 hover:text-red-700 text-sm"
                              >
                                הסר
                              </button>
                            </div>
                          ) : (
                            <label className="flex items-center gap-2 cursor-pointer text-carefd-teal hover:text-carefd-teal-medium">
                              <FaUpload />
                              <span className="text-sm">העלה קובץ</span>
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => handleCertificateUpload(e, index)}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addCertification}
                    className="mt-3 text-carefd-teal hover:text-carefd-teal-medium flex items-center gap-2 text-sm font-medium"
                  >
                    <FaPlus /> הוסף תעודה/רישיון
                  </button>
                </div>
              </div>
            )}

            {/* Business Tab - Payment & Health Funds */}
            {activeTab === 'business' && (
              <div className="space-y-8">
                {/* Health Funds */}
                <div>
                  <h3 className="text-lg font-bold text-carefd-navy mb-2">קופות חולים</h3>
                  <p className="text-sm text-carefd-gray mb-4">בחר את קופות החולים איתן אתה עובד</p>
                  <div className="flex flex-wrap gap-3">
                    {HEALTH_FUNDS.map(fund => (
                      <button
                        key={fund.value}
                        type="button"
                        onClick={() => {
                          const current = formData.health_funds || [];
                          const newValue = current.includes(fund.value)
                            ? current.filter(v => v !== fund.value)
                            : [...current, fund.value];
                          setFormData({ ...formData, health_funds: newValue });
                        }}
                        className={`px-5 py-3 rounded-xl font-medium transition ${
                          formData.health_funds?.includes(fund.value)
                            ? 'bg-emerald-500 text-white shadow-md'
                            : 'bg-gray-100 text-carefd-gray hover:bg-gray-200'
                        }`}
                      >
                        {fund.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Methods */}
                <div>
                  <h3 className="text-lg font-bold text-carefd-navy mb-2">אמצעי תשלום</h3>
                  <p className="text-sm text-carefd-gray mb-4">סמן את אמצעי התשלום שאתה מקבל</p>
                  <div className="flex flex-wrap gap-3">
                    {PAYMENT_METHODS.map(method => (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => {
                          const current = formData.payment_methods || [];
                          const newValue = current.includes(method.value)
                            ? current.filter(v => v !== method.value)
                            : [...current, method.value];
                          setFormData({ ...formData, payment_methods: newValue });
                        }}
                        className={`px-5 py-3 rounded-xl font-medium transition flex items-center gap-2 ${
                          formData.payment_methods?.includes(method.value)
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'bg-gray-100 text-carefd-gray hover:bg-gray-200'
                        }`}
                      >
                        <FaCreditCard size={14} />
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cancellation Policy */}
                <div>
                  <h3 className="text-lg font-bold text-carefd-navy mb-2">מדיניות ביטולים</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-carefd-gray mb-2">זמן הודעה מראש לביטול (שעות)</label>
                      <select
                        value={formData.cancellation_notice_hours}
                        onChange={(e) => setFormData({ ...formData, cancellation_notice_hours: parseInt(e.target.value) })}
                        className="w-full max-w-xs px-4 py-3 border border-gray-200 rounded-lg focus:border-carefd-teal outline-none bg-white"
                      >
                        <option value={0}>ללא הגבלה</option>
                        <option value={2}>2 שעות</option>
                        <option value={6}>6 שעות</option>
                        <option value={12}>12 שעות</option>
                        <option value={24}>24 שעות (יום)</option>
                        <option value={48}>48 שעות (יומיים)</option>
                        <option value={72}>72 שעות (3 ימים)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-carefd-gray mb-2">פירוט מדיניות הביטולים</label>
                      <textarea
                        value={formData.cancellation_policy}
                        onChange={(e) => setFormData({ ...formData, cancellation_policy: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-carefd-teal outline-none resize-none"
                        placeholder="תאר את מדיניות הביטולים שלך. לדוגמה: ביטול עד 24 שעות לפני התור - ללא חיוב. ביטול פחות מ-24 שעות - חיוב של 50% מהמחיר..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Settings Tab */}
            {activeTab === 'contact' && (
              <div className="space-y-8">
                <div className="bg-blue-50 p-4 rounded-xl mb-6">
                  <p className="text-blue-700 text-sm">
                    <strong>הגדרות פרטיות:</strong> בחר אילו פרטי קשר יוצגו בפרופיל הציבורי שלך
                  </p>
                </div>

                {/* Profile Image Settings */}
                <div>
                  <h3 className="text-lg font-bold text-carefd-navy mb-4">תמונת פרופיל</h3>
                  <div className="flex items-center gap-6">
                    {/* Preview */}
                    <div className={`w-24 h-24 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br ${formData.profile_color}`}>
                      {formData.profile_image ? (
                        <img src={formData.profile_image} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-3xl font-bold">
                          {formData.business_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'NN'}
                        </span>
                      )}
                    </div>
                    <div className="space-y-3">
                      {formData.profile_image && (
                        <button
                          type="button"
                          onClick={handleDeleteImage}
                          className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                          data-testid="delete-profile-image-contact-tab"
                        >
                          <FaTrash size={12} />
                          מחק תמונת פרופיל
                        </button>
                      )}
                      <p className="text-sm text-carefd-gray">בחר צבע רקע (יוצג כאשר אין תמונה)</p>
                      <div className="flex gap-2">
                        {PROFILE_COLORS.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setFormData({ ...formData, profile_color: color })}
                            className={`w-8 h-8 rounded-full bg-gradient-to-br ${color} ${
                              formData.profile_color === color ? 'ring-2 ring-offset-2 ring-carefd-teal' : ''
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phone Settings */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FaPhone className="text-carefd-teal text-xl" />
                    <div>
                      <p className="font-medium text-carefd-navy">מספר טלפון</p>
                      <p className="text-sm text-carefd-gray">{formData.phone || 'לא הוגדר'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, show_phone: !formData.show_phone })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                      formData.show_phone 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {formData.show_phone ? <FaEye /> : <FaEyeSlash />}
                    {formData.show_phone ? 'מוצג' : 'מוסתר'}
                  </button>
                </div>

                {/* Email Settings */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FaEnvelope className="text-carefd-teal text-xl" />
                    <div>
                      <p className="font-medium text-carefd-navy">אימייל</p>
                      <p className="text-sm text-carefd-gray">{formData.email || 'לא הוגדר'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, show_email: !formData.show_email })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                      formData.show_email 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {formData.show_email ? <FaEye /> : <FaEyeSlash />}
                    {formData.show_email ? 'מוצג' : 'מוסתר'}
                  </button>
                </div>

                {/* WhatsApp Settings */}
                <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FaWhatsapp className="text-green-500 text-xl" />
                      <div>
                        <p className="font-medium text-carefd-navy">WhatsApp</p>
                        <p className="text-sm text-carefd-gray">אפשר ללקוחות ליצור קשר בוואטסאפ</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, show_whatsapp: !formData.show_whatsapp })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                        formData.show_whatsapp 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {formData.show_whatsapp ? <FaEye /> : <FaEyeSlash />}
                      {formData.show_whatsapp ? 'מופעל' : 'כבוי'}
                    </button>
                  </div>
                  {formData.show_whatsapp && (
                    <div>
                      <label className="block text-sm text-carefd-gray mb-1">מספר WhatsApp</label>
                      <input
                        type="tel"
                        value={formData.whatsapp_number}
                        onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                        className="w-full max-w-xs px-4 py-2 border border-gray-200 rounded-lg focus:border-carefd-teal outline-none"
                        placeholder="050-1234567"
                      />
                      <p className="text-xs text-carefd-gray mt-1">השאר ריק לשימוש במספר הטלפון הראשי</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderEdit;
