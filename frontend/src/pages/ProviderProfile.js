import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AddReviewForm from '../components/AddReviewForm';
import api from '../utils/api';
import { 
  FaStar, FaMapMarkerAlt, FaClock, FaEdit, FaPhone, FaEnvelope,
  FaCheckCircle, FaUserMd, FaCalendarAlt, FaComments, FaShareAlt,
  FaHeart, FaBriefcase, FaUsers, FaAward, FaQuoteRight, FaWhatsapp,
  FaHome, FaVideo, FaClinicMedical, FaPhoneAlt, FaRegHeart, FaLink,
  FaCopy, FaCheck, FaInfoCircle, FaGraduationCap, FaCreditCard,
  FaHospital, FaFileContract, FaIdCard, FaCertificate
} from 'react-icons/fa';
import { dummyProviders, dummyServices } from '../data/dummyData';

// Service type config
const serviceTypeConfig = {
  home_visit: { icon: FaHome, label: 'ביקור בית', color: 'bg-blue-100 text-blue-600' },
  video_call: { icon: FaVideo, label: 'טלרפואה', color: 'bg-purple-100 text-purple-600' },
  clinic_visit: { icon: FaClinicMedical, label: 'ביקור במרפאה', color: 'bg-green-100 text-green-600' },
  phone_call: { icon: FaPhoneAlt, label: 'שיחה טלפונית', color: 'bg-orange-100 text-orange-600' }
};

// Profession titles mapping
const professionTitles = {
  doctor: 'רופא/ה',
  nurse: 'אח/ות מוסמך/ת',
  physiotherapist: 'פיזיותרפיסט/ית',
  occupational_therapist: 'מרפא/ה בעיסוק',
  student: 'סטודנט/ית',
  caregiver: 'מטפל/ת',
  psychologist: 'פסיכולוג/ית',
  social_worker: 'עובד/ת סוציאלי/ת',
  dietitian: 'דיאטן/ית',
  speech_therapist: 'קלינאי/ת תקשורת'
};

// Health funds labels
const healthFundLabels = {
  clalit: 'כללית',
  maccabi: 'מכבי',
  meuhedet: 'מאוחדת',
  leumit: 'לאומית',
  private: 'פרטי בלבד'
};

// Payment methods labels
const paymentMethodLabels = {
  cash: 'מזומן',
  credit_card: 'כרטיס אשראי',
  bit: 'ביט',
  paybox: 'PayBox',
  bank_transfer: 'העברה בנקאית',
  check: 'צ\'ק'
};

// Education level labels
const educationLevelLabels = {
  diploma: 'תעודה מקצועית',
  bachelor: 'תואר ראשון',
  master: 'תואר שני',
  phd: 'דוקטורט',
  specialist: 'התמחות רפואית'
};

const getProfessionLabel = (professionValue) => {
  return professionTitles[professionValue] || professionValue;
};

// Demo reviews for display
const demoReviews = [
  {
    review_id: 'review_1',
    rating: 5,
    comment: 'שירות מקצועי ואדיב מאוד. ממליץ בחום!',
    created_at: '2025-01-10T10:00:00Z',
    user: { name: 'יוסי כהן', picture: null }
  },
  {
    review_id: 'review_2',
    rating: 5,
    comment: 'הטיפול עזר לי מאוד. צוות מסור ומקצועי.',
    created_at: '2025-01-05T14:00:00Z',
    user: { name: 'רחל לוי', picture: null }
  },
  {
    review_id: 'review_3',
    rating: 4,
    comment: 'חוויה טובה, זמני המתנה סבירים והצוות נעים.',
    created_at: '2024-12-20T09:00:00Z',
    user: { name: 'דוד ישראלי', picture: null }
  }
];

const ProviderProfile = () => {
  const { t } = useTranslation();
  const { providerId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('services');
  const [showContactModal, setShowContactModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  useEffect(() => {
    fetchProvider();
    fetchReviews();
    if (isAuthenticated) {
      checkFavorite();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId, isAuthenticated]);

  const fetchProvider = async () => {
    try {
      const response = await api.get(`/providers/${providerId}`);
      setProvider(response.data);
    } catch (error) {
      console.error('Failed to fetch provider:', error);
      // Fallback to dummy data
      const dummyProvider = dummyProviders.find(p => p.provider_id === providerId);
      if (dummyProvider) {
        // Add services to dummy provider
        const providerServices = dummyServices.filter(s => s.provider_id === providerId);
        setProvider({ ...dummyProvider, services_list: providerServices });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await api.get(`/providers/${providerId}/reviews`);
      const apiReviews = response.data.reviews || [];
      setReviews(apiReviews.length > 0 ? apiReviews : demoReviews);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setReviews(demoReviews);
    }
  };

  const checkFavorite = async () => {
    try {
      const response = await api.get(`/favorites/check/${providerId}`);
      setIsFavorite(response.data.is_favorite);
    } catch (error) {
      console.error('Failed to check favorite:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      if (isFavorite) {
        await api.delete(`/favorites/${providerId}`);
        setIsFavorite(false);
      } else {
        await api.post(`/favorites/${providerId}`);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const copyToClipboard = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareToWhatsApp = () => {
    const url = window.location.href;
    const text = `בדוק את ${provider?.business_name || 'הספק הזה'} ב-CareLink: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const isOwner = user?.user_id === provider?.user_id;

  const handleContact = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setShowContactModal(true);
  };

  const handleWhatsApp = () => {
    const phone = provider?.phone?.replace(/[^0-9]/g, '') || '972500000000';
    window.open(`https://wa.me/${phone}?text=שלום, מצאתי אתכם ב-CareLink ואשמח לקבל מידע נוסף`, '_blank');
  };

  const handleCall = () => {
    // Check if mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // On mobile, directly call
      const phone = provider?.phone || '050-0000000';
      window.location.href = `tel:${phone}`;
    } else {
      // On desktop, show phone number modal
      setShowPhoneModal(true);
    }
  };

  const handleStartChat = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      // Create or get existing chat room
      const response = await api.post('/chat/rooms', {
        user_id: user.user_id,
        provider_id: providerId
      });
      navigate(`/chat/${response.data.room_id}`);
    } catch (error) {
      console.error('Failed to create chat room:', error);
    }
  };

  const handleBookService = (serviceId) => {
    // Navigate directly to booking page - guests are handled there
    navigate(`/book/${serviceId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-carelink-teal-pale flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-carelink-teal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-carelink-slate">{t('loading')}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-carelink-teal-pale flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FaUserMd className="text-6xl text-carelink-gray mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-carelink-navy mb-2">ספק לא נמצא</h2>
            <p className="text-carelink-slate mb-4">הספק שחיפשת לא קיים במערכת</p>
            <Link
              to="/providers"
              className="inline-flex items-center gap-2 bg-carelink-teal text-white px-6 py-3 rounded-xl font-semibold hover:bg-carelink-teal-medium transition"
            >
              חזור לרשימת הספקים
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-carelink-teal-pale flex flex-col">
      <Navbar />
      
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-carelink-navy via-carelink-slate to-carelink-teal text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Provider Avatar/Logo */}
            <div className="w-32 h-32 lg:w-40 lg:h-40 bg-white rounded-2xl shadow-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
              {provider.profile_image ? (
                <img 
                  src={provider.profile_image} 
                  alt={provider.business_name || 'Profile'} 
                  className="w-full h-full object-cover"
                  data-testid="provider-profile-image"
                />
              ) : (
                <span className="text-5xl lg:text-6xl font-bold text-carelink-teal">
                  {(provider.business_name || 'ס')[0]}
                </span>
              )}
            </div>
            
            {/* Provider Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl lg:text-4xl font-bold font-heading" data-testid="provider-name">
                  {provider.business_name || 'ספק שירותים'}
                </h1>
                {provider.is_verified && (
                  <span className="inline-flex items-center gap-1 bg-carelink-teal px-3 py-1 rounded-full text-sm" data-testid="verified-badge">
                    <FaCheckCircle /> מאומת
                  </span>
                )}
                {provider.is_recommended && (
                  <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 rounded-full text-sm" data-testid="recommended-badge">
                    <FaAward /> מומלץ
                  </span>
                )}
              </div>
              
              {/* Profession & Specialization */}
              {(provider.profession_name || provider.profession_title) && (
                <div className="mb-3" data-testid="profession-title">
                  <p className="text-xl text-carelink-teal-pale font-medium mb-1">
                    {provider.profession_name || getProfessionLabel(provider.profession_title)}
                  </p>
                  {provider.specialization_name && (
                    <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm">
                      {provider.specialization_name}
                    </span>
                  )}
                </div>
              )}

              {/* Provider Number */}
              {provider.provider_number && (
                <p className="text-sm text-white/70 mb-3 font-mono" data-testid="provider-number">
                  מספר ספק: {provider.provider_number}
                </p>
              )}
              
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                  <FaBriefcase />
                  {t(provider.provider_type)}
                </span>
                
                {provider.years_experience && (
                  <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full" data-testid="years-experience">
                    <FaClock />
                    {provider.years_experience} שנות ניסיון
                  </span>
                )}
                
                {provider.location && (
                  <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                    <FaMapMarkerAlt />
                    {provider.location.city}
                  </span>
                )}
                
                <div className="inline-flex items-center gap-2 bg-yellow-500/20 px-3 py-1 rounded-full">
                  <FaStar className="text-yellow-400" />
                  <span className="font-bold">{provider.rating?.toFixed(1) || '0.0'}</span>
                  <span className="text-carelink-teal-pale">({provider.total_reviews || 0} ביקורות)</span>
                </div>
              </div>

              {/* Service Types */}
              {provider.service_types && provider.service_types.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {provider.service_types.map((type) => {
                    const config = serviceTypeConfig[type];
                    if (!config) return null;
                    const Icon = config.icon;
                    return (
                      <span key={type} className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium ${config.color}`}>
                        <Icon />
                        {config.label}
                      </span>
                    );
                  })}
                </div>
              )}
              
              {provider.description && (
                <p className="text-carelink-teal-pale text-lg max-w-2xl leading-relaxed mb-6">
                  {provider.description}
                </p>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleWhatsApp}
                  className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-600 transition shadow-lg"
                  data-testid="whatsapp-btn"
                >
                  <FaWhatsapp className="text-xl" />
                  WhatsApp
                </button>

                <button
                  onClick={handleCall}
                  className="inline-flex items-center gap-2 bg-carelink-teal text-white px-6 py-3 rounded-xl font-semibold hover:bg-carelink-teal-medium transition shadow-lg"
                  data-testid="call-btn"
                >
                  <FaPhone />
                  התקשר
                </button>
                
                <button
                  onClick={() => setActiveTab('services')}
                  className="inline-flex items-center gap-2 bg-white text-carelink-navy px-6 py-3 rounded-xl font-semibold hover:bg-carelink-teal-pale transition"
                  data-testid="view-services-btn"
                >
                  <FaCalendarAlt />
                  הזמן תור
                </button>
                
                {isOwner && (
                  <button
                    onClick={() => navigate(`/provider/edit/${providerId}`)}
                    className="inline-flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition border border-white/20"
                    data-testid="edit-profile-btn"
                  >
                    <FaEdit />
                    {t('editProfile')}
                  </button>
                )}

                {/* Chat Button */}
                <button
                  onClick={handleStartChat}
                  className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 transition shadow-lg"
                  data-testid="chat-btn"
                >
                  <FaComments className="text-xl" />
                  צ'אט
                </button>
                
                {/* Share Button */}
                <button 
                  onClick={handleShare}
                  className="inline-flex items-center justify-center w-12 h-12 bg-white/10 text-white rounded-xl hover:bg-white/20 transition border border-white/20"
                  data-testid="share-btn"
                  title="שתף"
                >
                  <FaShareAlt />
                </button>
                
                {/* Favorite Button */}
                <button 
                  onClick={toggleFavorite}
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-xl transition border border-white/20 ${
                    isFavorite 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  data-testid="favorite-btn"
                  title={isFavorite ? 'הסר ממועדפים' : 'הוסף למועדפים'}
                >
                  {isFavorite ? <FaHeart /> : <FaRegHeart />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-carelink-teal-pale">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-carelink-teal mb-1">
                {provider.services_list?.length || 0}
              </div>
              <div className="text-sm text-carelink-gray">שירותים</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-carelink-teal mb-1">
                {provider.total_reviews || 0}
              </div>
              <div className="text-sm text-carelink-gray">ביקורות</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-carelink-teal mb-1">
                {provider.team_members?.length || 1}
              </div>
              <div className="text-sm text-carelink-gray">אנשי צוות</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-carelink-teal mb-1">
                {provider.specializations?.length || 0}
              </div>
              <div className="text-sm text-carelink-gray">התמחויות</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="flex border-b border-carelink-teal-pale">
                {[
                  { id: 'services', label: 'שירותים', icon: FaCalendarAlt },
                  { id: 'reviews', label: 'ביקורות', icon: FaStar },
                  { id: 'team', label: 'הצוות', icon: FaUsers }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition ${
                      activeTab === tab.id
                        ? 'text-carelink-teal border-b-2 border-carelink-teal bg-carelink-teal-pale/20'
                        : 'text-carelink-gray hover:text-carelink-navy hover:bg-gray-50'
                    }`}
                    data-testid={`tab-${tab.id}`}
                  >
                    <tab.icon />
                    {tab.label}
                  </button>
                ))}
              </div>
              
              <div className="p-6">
                {/* Services Tab */}
                {activeTab === 'services' && (
                  <div className="space-y-4" data-testid="services-section">
                    {provider.services_list && provider.services_list.length > 0 ? (
                      provider.services_list.map((service) => {
                        const typeConfig = serviceTypeConfig[service.service_type] || serviceTypeConfig.clinic_visit;
                        const TypeIcon = typeConfig.icon;
                        const categoryLabels = { visit: 'ביקור', hourly: 'שעתי', consultation: 'ייעוץ', product: 'מוצר' };
                        const pricingUnits = { per_hour: 'לשעה', per_visit: 'לביקור', per_session: 'לפגישה', fixed: '' };
                        const catLabel = categoryLabels[service.service_category] || '';
                        const priceUnit = pricingUnits[service.pricing_type] || '';

                        return (
                          <div
                            key={service.service_id}
                            className="border border-gray-100 rounded-xl p-5 hover:border-carelink-teal hover:shadow-md transition group bg-white"
                            data-testid={`service-${service.service_id}`}
                          >
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                              <div className="flex-1">
                                {/* Tags */}
                                <div className="flex flex-wrap gap-2 mb-2">
                                  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${typeConfig.color}`}>
                                    <TypeIcon className="text-[10px]" />
                                    {typeConfig.label}
                                  </span>
                                  {catLabel && (
                                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-600">
                                      {catLabel}
                                    </span>
                                  )}
                                </div>
                                <h3 className="text-xl font-bold text-carelink-navy mb-1.5">{service.name}</h3>
                                <p className="text-carelink-slate text-sm mb-3 line-clamp-2">{service.description}</p>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-carelink-gray">
                                  {service.duration_minutes && (
                                    <span className="inline-flex items-center gap-1">
                                      <FaClock className="text-carelink-teal text-xs" />
                                      {service.duration_minutes} דקות
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-3">
                                <div className="text-left">
                                  <span className="text-3xl font-bold text-carelink-teal">₪{service.price}</span>
                                  {priceUnit && (
                                    <span className="text-sm text-carelink-gray mr-1">/{priceUnit}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleBookService(service.service_id)}
                                  className="bg-carelink-teal text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-carelink-teal-medium transition text-sm"
                                  data-testid={`book-${service.service_id}`}
                                >
                                  הזמן עכשיו
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-carelink-gray">
                        <FaCalendarAlt className="text-4xl mx-auto mb-3 text-carelink-teal-pale" />
                        <p>אין שירותים להצגה כרגע</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                  <div className="space-y-6" data-testid="reviews-section">
                    {/* Rating Summary */}
                    <div className="bg-carelink-teal-pale/20 rounded-xl p-6 mb-6">
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-5xl font-bold text-carelink-teal mb-1">
                            {provider.rating?.toFixed(1) || '0.0'}
                          </div>
                          <div className="flex justify-center mb-1">
                            {[...Array(5)].map((_, i) => (
                              <FaStar
                                key={i}
                                className={i < Math.round(provider.rating || 0) ? 'text-yellow-500' : 'text-gray-300'}
                              />
                            ))}
                          </div>
                          <div className="text-sm text-carelink-gray">
                            {provider.total_reviews || 0} ביקורות
                          </div>
                        </div>
                        <div className="flex-1 space-y-2">
                          {[5, 4, 3, 2, 1].map((stars) => {
                            const count = reviews.filter(r => Math.round(r.rating) === stars).length;
                            const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                            return (
                              <div key={stars} className="flex items-center gap-2">
                                <span className="text-sm w-3">{stars}</span>
                                <FaStar className="text-yellow-500 text-sm" />
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-yellow-500 rounded-full"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-carelink-gray w-8">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Add Review Form */}
                    {isAuthenticated && !isOwner && (
                      <div className="bg-carelink-teal-pale/20 rounded-xl p-6 mb-6">
                        <h4 className="font-bold text-carelink-navy mb-4">הוסף ביקורת</h4>
                        <AddReviewForm 
                          providerId={providerId} 
                          onReviewAdded={fetchReviews}
                        />
                      </div>
                    )}

                    {/* Reviews List */}
                    {reviews.length > 0 ? (
                      reviews.map((review) => (
                        <div key={review.review_id} className="border-b border-carelink-teal-pale pb-6 last:border-0">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-carelink-teal rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                              {(review.user?.name || 'מ')[0]}
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-3 mb-2">
                                <span className="font-bold text-carelink-navy">{review.user?.name || 'משתמש'}</span>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <FaStar
                                      key={i}
                                      className={i < review.rating ? 'text-yellow-500' : 'text-gray-300'}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-carelink-gray">
                                  {new Date(review.created_at).toLocaleDateString('he-IL')}
                                </span>
                              </div>
                              <p className="text-carelink-slate leading-relaxed">
                                <FaQuoteRight className="inline text-carelink-teal-pale ml-2" />
                                {review.comment}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-carelink-gray">
                        <FaStar className="text-4xl mx-auto mb-3 text-carelink-teal-pale" />
                        <p>עדיין אין ביקורות</p>
                        {isAuthenticated && !isOwner && (
                          <p className="mt-2">היה הראשון לכתוב ביקורת!</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Team Tab */}
                {activeTab === 'team' && (
                  <div data-testid="team-section">
                    {provider.team_members && provider.team_members.length > 0 ? (
                      <div className="grid md:grid-cols-2 gap-4">
                        {provider.team_members.map((member) => (
                          <div
                            key={member.member_id}
                            className="border-2 border-carelink-teal-pale rounded-xl p-5 hover:border-carelink-teal transition"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-carelink-navy rounded-xl flex items-center justify-center text-white text-xl font-bold">
                                {member.name[0]}
                              </div>
                              <div>
                                <h4 className="font-bold text-carelink-navy text-lg">{member.name}</h4>
                                <p className="text-carelink-teal">{member.role}</p>
                              </div>
                            </div>
                            {member.specializations && member.specializations.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-4">
                                {member.specializations.map((spec, idx) => (
                                  <span key={idx} className="bg-carelink-teal-pale text-carelink-navy text-xs px-3 py-1 rounded-full">
                                    {spec}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-20 h-20 bg-carelink-navy rounded-xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                          {(provider.business_name || 'ס')[0]}
                        </div>
                        <h4 className="font-bold text-carelink-navy text-lg mb-1">{provider.business_name}</h4>
                        <p className="text-carelink-gray">בעלים</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* About Section */}
            {provider.about && (
              <div className="bg-white rounded-2xl shadow-lg p-6" data-testid="about-section">
                <h3 className="text-lg font-bold text-carelink-navy mb-4 flex items-center gap-2">
                  <FaInfoCircle className="text-carelink-teal" />
                  אודות
                </h3>
                <p className="text-carelink-slate leading-relaxed whitespace-pre-line">
                  {provider.about}
                </p>
              </div>
            )}

            {/* Specializations */}
            {provider.specializations && provider.specializations.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-carelink-navy mb-4 flex items-center gap-2">
                  <FaAward className="text-carelink-teal" />
                  התמחויות
                </h3>
                <div className="flex flex-wrap gap-2">
                  {provider.specializations.map((spec, idx) => (
                    <span
                      key={idx}
                      className="bg-carelink-teal text-white px-4 py-2 rounded-full text-sm font-medium"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Expertise */}
            {provider.expertise && provider.expertise.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6" data-testid="expertise-section">
                <h3 className="text-lg font-bold text-carelink-navy mb-4 flex items-center gap-2">
                  <FaBriefcase className="text-carelink-teal" />
                  מומחיויות
                </h3>
                <div className="flex flex-wrap gap-2">
                  {provider.expertise.map((exp, idx) => (
                    <span
                      key={idx}
                      className="bg-carelink-navy/10 text-carelink-navy px-3 py-1.5 rounded-lg text-sm"
                    >
                      {exp}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {provider.languages && provider.languages.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6" data-testid="languages-section">
                <h3 className="text-lg font-bold text-carelink-navy mb-4 flex items-center gap-2">
                  <FaComments className="text-carelink-teal" />
                  שפות
                </h3>
                <div className="flex flex-wrap gap-2">
                  {provider.languages.map((lang, idx) => {
                    const langLabels = {
                      hebrew: 'עברית', arabic: 'ערבית', english: 'אנגלית',
                      russian: 'רוסית', french: 'צרפתית', spanish: 'ספרדית', amharic: 'אמהרית'
                    };
                    return (
                      <span
                        key={idx}
                        className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm"
                      >
                        {langLabels[lang] || lang}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Target Audience */}
            {provider.target_audience && provider.target_audience.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6" data-testid="target-audience-section">
                <h3 className="text-lg font-bold text-carelink-navy mb-4 flex items-center gap-2">
                  <FaUsers className="text-carelink-teal" />
                  קהל יעד
                </h3>
                <div className="flex flex-wrap gap-2">
                  {provider.target_audience.map((audience, idx) => {
                    const audienceLabels = {
                      adults: 'מבוגרים', children: 'ילדים', youth: 'נוער',
                      babies: 'תינוקות', women: 'נשים', elderly: 'קשישים',
                      pregnant: 'נשים בהריון', postpartum: 'יולדות'
                    };
                    return (
                      <span
                        key={idx}
                        className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-sm"
                      >
                        {audienceLabels[audience] || audience}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Education */}
            {provider.education && provider.education.length > 0 && provider.education.some(e => e.institution || e.degree) && (
              <div className="bg-white rounded-2xl shadow-lg p-6" data-testid="education-section">
                <h3 className="text-lg font-bold text-carelink-navy mb-4 flex items-center gap-2">
                  <FaGraduationCap className="text-carelink-teal" />
                  השכלה
                </h3>
                <div className="space-y-4">
                  {provider.education.filter(e => e.institution || e.degree).map((edu, idx) => (
                    <div key={idx} className="border-r-4 border-carelink-teal pr-4">
                      <p className="font-semibold text-carelink-navy">
                        {educationLevelLabels[edu.degree] || edu.degree}
                      </p>
                      {edu.field && (
                        <p className="text-sm text-carelink-slate">{edu.field}</p>
                      )}
                      {edu.institution && (
                        <p className="text-sm text-carelink-gray">{edu.institution}</p>
                      )}
                      {edu.year && (
                        <p className="text-xs text-carelink-gray mt-1">{edu.year}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {provider.certifications && provider.certifications.length > 0 && provider.certifications.some(c => c.name || c.license_number) && (
              <div className="bg-white rounded-2xl shadow-lg p-6" data-testid="certifications-section">
                <h3 className="text-lg font-bold text-carelink-navy mb-4 flex items-center gap-2">
                  <FaCertificate className="text-carelink-teal" />
                  תעודות ורישיונות
                </h3>
                <div className="space-y-4">
                  {provider.certifications.filter(c => c.name || c.license_number).map((cert, idx) => (
                    <div key={idx} className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200">
                      <p className="font-semibold text-carelink-navy flex items-center gap-2">
                        <FaAward className="text-amber-500" />
                        {cert.name}
                      </p>
                      {cert.issuer && (
                        <p className="text-sm text-carelink-slate mt-1">מנפיק: {cert.issuer}</p>
                      )}
                      {cert.license_number && (
                        <p className="text-sm text-carelink-gray mt-1">מספר רישיון: {cert.license_number}</p>
                      )}
                      {cert.year && (
                        <p className="text-xs text-carelink-gray mt-1">שנה: {cert.year}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Health Funds */}
            {provider.health_funds && provider.health_funds.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6" data-testid="health-funds-section">
                <h3 className="text-lg font-bold text-carelink-navy mb-4 flex items-center gap-2">
                  <FaHospital className="text-carelink-teal" />
                  קופות חולים
                </h3>
                <div className="flex flex-wrap gap-2">
                  {provider.health_funds.map((fund, idx) => (
                    <span
                      key={idx}
                      className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium"
                    >
                      {healthFundLabels[fund] || fund}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Methods */}
            {provider.payment_methods && provider.payment_methods.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6" data-testid="payment-methods-section">
                <h3 className="text-lg font-bold text-carelink-navy mb-4 flex items-center gap-2">
                  <FaCreditCard className="text-carelink-teal" />
                  אמצעי תשלום
                </h3>
                <div className="flex flex-wrap gap-2">
                  {provider.payment_methods.map((method, idx) => (
                    <span
                      key={idx}
                      className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium"
                    >
                      {paymentMethodLabels[method] || method}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Cancellation Policy */}
            {provider.cancellation_policy && (
              <div className="bg-white rounded-2xl shadow-lg p-6" data-testid="cancellation-policy-section">
                <h3 className="text-lg font-bold text-carelink-navy mb-4 flex items-center gap-2">
                  <FaFileContract className="text-carelink-teal" />
                  מדיניות ביטולים
                </h3>
                {provider.cancellation_notice_hours && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                    <p className="text-sm text-yellow-800 font-medium">
                      נדרשת הודעה מראש: {provider.cancellation_notice_hours} שעות
                    </p>
                  </div>
                )}
                <p className="text-carelink-slate whitespace-pre-line text-sm leading-relaxed">
                  {provider.cancellation_policy}
                </p>
              </div>
            )}

            {/* Location */}
            {provider.location && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-carelink-navy mb-4 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-carelink-teal" />
                  מיקום
                </h3>
                <p className="text-carelink-slate mb-4">
                  {provider.location.address && `${provider.location.address}, `}
                  {provider.location.city}
                </p>
                {/* Service Areas */}
                {provider.service_areas && provider.service_areas.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm font-medium text-carelink-navy mb-2">אזורי שירות:</p>
                    <div className="flex flex-wrap gap-1">
                      {provider.service_areas.map((area, idx) => (
                        <span key={idx} className="bg-gray-100 text-carelink-gray text-xs px-2 py-1 rounded">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Contact Card */}
            <div className="bg-gradient-to-br from-carelink-teal to-carelink-teal-medium rounded-2xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-bold mb-4">צור קשר</h3>
              <p className="text-white/80 mb-6">
                מעוניינים בשירותים? צרו קשר ונשמח לעזור
              </p>
              <button
                onClick={handleContact}
                className="w-full bg-white text-carelink-teal py-3 rounded-xl font-semibold hover:bg-carelink-teal-pale transition"
              >
                שלח הודעה
              </button>
            </div>

            {/* Working Hours - Dynamic Availability */}
            <div className="bg-white rounded-2xl shadow-lg p-6" data-testid="availability-section">
              <h3 className="text-lg font-bold text-carelink-navy mb-4 flex items-center gap-2">
                <FaClock className="text-carelink-teal" />
                זמינות
              </h3>
              {provider.availability && provider.availability.length > 0 ? (
                <div className="space-y-3">
                  {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((day) => {
                    const dayLabels = {
                      sunday: 'ראשון', monday: 'שני', tuesday: 'שלישי',
                      wednesday: 'רביעי', thursday: 'חמישי', friday: 'שישי', saturday: 'שבת'
                    };
                    const shiftLabels = {
                      morning: 'בוקר', afternoon: 'צהריים', evening: 'ערב', night: 'לילה'
                    };
                    const shiftColors = {
                      morning: 'bg-amber-100 text-amber-700',
                      afternoon: 'bg-orange-100 text-orange-700',
                      evening: 'bg-purple-100 text-purple-700',
                      night: 'bg-indigo-100 text-indigo-700'
                    };
                    const daySlots = provider.availability.filter(a => a.day === day && a.is_available);
                    
                    return (
                      <div key={day} className="flex items-center justify-between text-sm">
                        <span className="text-carelink-gray font-medium w-16">{dayLabels[day]}</span>
                        <div className="flex gap-1 flex-1 justify-end">
                          {daySlots.length > 0 ? (
                            daySlots.map((slot, idx) => (
                              <span 
                                key={idx} 
                                className={`px-2 py-0.5 rounded text-xs ${shiftColors[slot.shift] || 'bg-gray-100'}`}
                              >
                                {shiftLabels[slot.shift] || slot.shift}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-xs">לא זמין</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  {['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'].map((day) => (
                    <div key={day} className="flex justify-between">
                      <span className="text-carelink-gray">{day}</span>
                      <span className="text-carelink-navy font-medium">09:00 - 18:00</span>
                    </div>
                  ))}
                  <div className="flex justify-between">
                    <span className="text-carelink-gray">שישי</span>
                    <span className="text-carelink-navy font-medium">09:00 - 13:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-carelink-gray">שבת</span>
                    <span className="text-red-500 font-medium">סגור</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-carelink-navy mb-4">צור קשר עם {provider.business_name}</h3>
            <p className="text-carelink-gray mb-6">
              שלח הודעה ישירה לספק השירות
            </p>
            <textarea
              className="w-full border-2 border-carelink-teal-pale rounded-xl p-4 h-32 focus:border-carelink-teal focus:outline-none resize-none"
              placeholder="כתוב את ההודעה שלך..."
            ></textarea>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowContactModal(false)}
                className="flex-1 bg-gray-100 text-carelink-gray py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                ביטול
              </button>
              <button
                onClick={() => {
                  setShowContactModal(false);
                  navigate('/chats');
                }}
                className="flex-1 bg-carelink-teal text-white py-3 rounded-xl font-semibold hover:bg-carelink-teal-medium transition"
              >
                שלח הודעה
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-carelink-navy mb-4">שתף את הפרופיל</h3>
            <p className="text-carelink-gray mb-6">
              שתף את {provider?.business_name || 'הספק'} עם חברים ומשפחה
            </p>
            
            {/* Copy Link */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 bg-carelink-teal-pale/30 px-4 py-3 rounded-xl text-sm text-carelink-navy truncate">
                {window.location.href}
              </div>
              <button
                onClick={copyToClipboard}
                className={`px-4 py-3 rounded-xl font-semibold transition flex items-center gap-2 ${
                  copied 
                    ? 'bg-green-500 text-white' 
                    : 'bg-carelink-teal text-white hover:bg-carelink-teal-medium'
                }`}
              >
                {copied ? <FaCheck /> : <FaCopy />}
                {copied ? 'הועתק!' : 'העתק'}
              </button>
            </div>

            {/* Share Options */}
            <div className="flex gap-3">
              <button
                onClick={shareToWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition"
              >
                <FaWhatsapp className="text-xl" />
                WhatsApp
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: provider?.business_name || 'CareLink',
                      text: `בדוק את ${provider?.business_name || 'הספק הזה'} ב-CareLink`,
                      url: window.location.href
                    });
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition"
              >
                <FaShareAlt />
                שתף
              </button>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full mt-4 bg-gray-100 text-carelink-gray py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
            >
              סגור
            </button>
          </div>
        </div>
      )}

      {/* Phone Modal (Desktop) */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPhoneModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 bg-carelink-teal rounded-full flex items-center justify-center mx-auto mb-4">
              <FaPhone className="text-2xl text-white" />
            </div>
            <h3 className="text-xl font-bold text-carelink-navy mb-2">מספר טלפון</h3>
            <p className="text-carelink-gray mb-4">{provider?.business_name || 'ספק שירותים'}</p>
            
            <div className="bg-carelink-teal-pale/30 px-6 py-4 rounded-xl mb-4">
              <p className="text-2xl font-bold text-carelink-navy direction-ltr">
                {provider?.phone || '050-0000000'}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(provider?.phone || '050-0000000');
                  setShowPhoneModal(false);
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-carelink-teal text-white py-3 rounded-xl font-semibold hover:bg-carelink-teal-medium transition"
              >
                <FaCopy />
                העתק
              </button>
              <button
                onClick={() => setShowPhoneModal(false)}
                className="flex-1 bg-gray-100 text-carelink-gray py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ProviderProfile;
