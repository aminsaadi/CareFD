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
  FaInfoCircle, FaCheck, FaTimes
} from 'react-icons/fa';

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
];

const SERVICE_AREAS = [
  'תל אביב', 'ירושלים', 'חיפה', 'באר שבע', 'רמת גן', 'הרצליה', 
  'פתח תקווה', 'ראשון לציון', 'נתניה', 'אשדוד', 'חולון', 'בני ברק',
  'רעננה', 'כפר סבא', 'מודיעין', 'אשקלון', 'רחובות', 'בת ים'
];

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
  'from-carelink-teal to-carelink-navy',
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

  // Form state
  const [formData, setFormData] = useState({
    business_name: '',
    profession_title: '',
    gender: '',
    years_experience: '',
    about: '',
    description: '',
    profile_image: '',
    profile_color: 'from-carelink-teal to-carelink-navy',
    provider_type: 'individual',
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
    fetchProvider();
  }, [providerId]);

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
        gender: data.gender || '',
        years_experience: data.years_experience || '',
        about: data.about || '',
        description: data.description || '',
        profile_image: data.profile_image || '',
        profile_color: data.profile_color || 'from-carelink-teal to-carelink-navy',
        provider_type: data.provider_type || 'individual',
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
    { id: 'basic', label: 'פרטים בסיסיים', icon: FaUser },
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
          <div className="w-12 h-12 border-4 border-carelink-teal border-t-transparent rounded-full animate-spin"></div>
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
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-carelink-teal to-carelink-navy flex items-center justify-center overflow-hidden">
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
                className="absolute bottom-0 right-0 w-8 h-8 bg-carelink-teal text-white rounded-full flex items-center justify-center shadow-lg hover:bg-carelink-teal/90 transition"
              >
                {uploadingImage ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FaCamera size={14} />
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
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-carelink-navy">עריכת פרופיל</h1>
              <p className="text-carelink-gray">עדכן את פרטי הפרופיל שלך</p>
            </div>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-carelink-teal text-white rounded-lg hover:bg-carelink-teal/90 transition flex items-center gap-2 disabled:opacity-50"
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
                    ? 'text-carelink-teal border-carelink-teal bg-carelink-teal-pale/20'
                    : 'text-carelink-gray border-transparent hover:text-carelink-navy hover:bg-gray-50'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
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
                  <p className="text-sm text-carelink-gray mb-2">ספר על עצמך, הניסיון שלך, והגישה המקצועית שלך</p>
                  <textarea
                    value={formData.about}
                    onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-carelink-teal focus:ring-1 focus:ring-carelink-teal outline-none resize-none"
                    placeholder="ספר על הרקע המקצועי שלך, ההשכלה, הניסיון וגישת הטיפול..."
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
                          onClick={() => removeArrayField('specializations', index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => addArrayField('specializations')}
                    className="mt-2 text-carelink-teal hover:underline flex items-center gap-1 text-sm"
                  >
                    <FaPlus size={12} /> הוסף התמחות
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
                    className="mt-2 text-carelink-teal hover:underline flex items-center gap-1 text-sm"
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
                  <p className="text-sm text-carelink-gray mb-3">בחר את האזורים בהם אתה מספק שירות</p>
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_AREAS.map(area => (
                      <button
                        key={area}
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
                
                <div>
                  <label className="block text-sm font-medium text-carelink-navy mb-2">רדיוס כיסוי (ק"מ)</label>
                  <input
                    type="number"
                    value={location.coverage_radius_km}
                    onChange={(e) => setLocation({ ...location, coverage_radius_km: parseInt(e.target.value) || 10 })}
                    className="w-32 px-4 py-3 border border-gray-200 rounded-lg focus:border-carelink-teal outline-none"
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
                  <h3 className="font-medium text-carelink-navy mb-2">לוח זמינות שבועי</h3>
                  <p className="text-sm text-carelink-gray mb-4">סמן את המשמרות בהן אתה זמין לעבודה</p>
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
                  <span className="text-sm text-carelink-gray">מקרא משמרות:</span>
                  {SHIFT_OPTIONS.map(shift => (
                    <div key={shift.value} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${shift.color.split(' ')[0]}`}></div>
                      <span className="text-sm text-carelink-navy">{shift.label} ({shift.time})</span>
                    </div>
                  ))}
                </div>
                
                {/* Summary */}
                {availability.length > 0 && (
                  <div className="bg-carelink-teal-pale/30 rounded-lg p-4">
                    <h4 className="font-medium text-carelink-navy mb-2">סיכום זמינות</h4>
                    <p className="text-sm text-carelink-gray">
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
                  <label className="block text-sm font-medium text-carelink-navy mb-2">שפות</label>
                  <p className="text-sm text-carelink-gray mb-3">בחר את השפות בהן אתה מספק שירות</p>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGE_OPTIONS.map(lang => (
                      <button
                        key={lang.value}
                        onClick={() => toggleMultiSelect('languages', lang.value)}
                        className={`px-4 py-2 rounded-full text-sm transition flex items-center gap-2 ${
                          formData.languages.includes(lang.value)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-carelink-gray hover:bg-gray-200'
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
                  <label className="block text-sm font-medium text-carelink-navy mb-2">קהל יעד</label>
                  <p className="text-sm text-carelink-gray mb-3">בחר את קהלי היעד שלך</p>
                  <div className="flex flex-wrap gap-2">
                    {TARGET_AUDIENCE_OPTIONS.map(audience => (
                      <button
                        key={audience.value}
                        onClick={() => toggleMultiSelect('target_audience', audience.value)}
                        className={`px-4 py-2 rounded-full text-sm transition flex items-center gap-2 ${
                          formData.target_audience.includes(audience.value)
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 text-carelink-gray hover:bg-gray-200'
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderEdit;
