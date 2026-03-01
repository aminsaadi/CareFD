import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaStar, FaMapMarkerAlt, FaBriefcase, FaCheckCircle, FaAward,
  FaHome, FaVideo, FaClinicMedical, FaPhoneAlt, FaWhatsapp, FaComments, FaPhone
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

// Service type icons and labels
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

const getProfessionLabel = (professionValue) => {
  return professionTitles[professionValue] || professionValue;
};

const ProviderCard = ({ provider, showContact = true }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  // Determine service types offered (from services or default)
  const serviceTypes = provider.service_types || ['home_visit', 'clinic_visit'];

  const handleWhatsApp = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const phone = provider.phone?.replace(/[^0-9]/g, '') || '972500000000';
    window.open(`https://wa.me/${phone}?text=שלום, מצאתי אתכם ב-CareLink ואשמח לקבל מידע נוסף`, '_blank');
  };

  const handleCall = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const phone = provider.phone || '050-0000000';
    
    if (isMobile) {
      window.location.href = `tel:${phone}`;
    } else {
      setShowPhoneModal(true);
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const response = await api.post('/chat/rooms', {
        user_id: user.user_id,
        provider_id: provider.provider_id
      });
      navigate(`/chat/${response.data.room_id}`);
    } catch (error) {
      console.error('Failed to create chat room:', error);
    }
  };

  return (
    <>
      <div
        className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all border-2 border-carelink-teal-pale hover:border-carelink-teal relative group"
        data-testid={`provider-card-${provider.provider_id}`}
      >
        {/* Badges */}
        <div className="absolute -top-3 right-4 flex gap-2">
          {provider.is_verified && (
            <span className="inline-flex items-center gap-1 bg-carelink-teal text-white text-xs px-3 py-1 rounded-full font-medium shadow-md" data-testid="verified-badge">
              <FaCheckCircle />
              מאומת
            </span>
          )}
          {provider.is_recommended && (
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-md" data-testid="recommended-badge">
              <FaAward />
              מומלץ
            </span>
          )}
        </div>

        <div className="flex items-start justify-between mb-4 mt-2">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-carelink-navy mb-1">
              {provider.business_name || 'ספק שירותים'}
            </h3>
            {/* Profession Title */}
            {provider.profession_title && (
              <p className="text-carelink-teal font-medium text-sm mb-1" data-testid="profession-title">
                {getProfessionLabel(provider.profession_title)}
              </p>
            )}
            <div className="flex items-center gap-2 text-sm text-carelink-gray">
              <FaBriefcase className="text-carelink-teal" />
              <span>{t(provider.provider_type)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-carelink-teal-pale px-3 py-1.5 rounded-full">
            <FaStar className="text-yellow-500" />
            <span className="font-bold text-carelink-navy">{(provider.rating || 0).toFixed(1)}</span>
            <span className="text-xs text-carelink-gray">({provider.total_reviews || 0})</span>
          </div>
        </div>

        {provider.description && (
          <p className="text-carelink-slate mb-4 line-clamp-2">{provider.description}</p>
        )}

        {/* Service Types */}
        <div className="flex flex-wrap gap-2 mb-4">
          {serviceTypes.map((type) => {
            const config = serviceTypeConfig[type];
            if (!config) return null;
            const Icon = config.icon;
            return (
              <span
                key={type}
                className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium ${config.color}`}
                data-testid={`service-type-${type}`}
              >
                <Icon className="text-xs" />
                {config.label}
              </span>
            );
          })}
        </div>

        {provider.specializations && provider.specializations.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {provider.specializations.slice(0, 3).map((spec, idx) => (
                <span
                  key={idx}
                  className="bg-carelink-navy text-white text-xs px-3 py-1 rounded-full font-medium"
                >
                  {spec}
                </span>
              ))}
              {provider.specializations.length > 3 && (
                <span className="text-xs text-carelink-gray py-1">
                  +{provider.specializations.length - 3} עוד
                </span>
              )}
            </div>
          </div>
        )}

        {provider.location && (
          <div className="flex items-center text-sm text-carelink-gray mb-4">
            <FaMapMarkerAlt className="text-carelink-teal ml-1" />
            <span>{provider.location.city}</span>
            {provider.distance_km != null && (
              <span className="mr-auto bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1" data-testid="distance-badge">
                <FaMapMarkerAlt className="text-[10px]" />
                {provider.distance_km} ק״מ
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Link
            to={`/providers/${provider.provider_id}`}
            className="flex-1 min-w-[140px] text-center bg-carelink-teal text-white px-4 py-2.5 rounded-xl hover:bg-carelink-teal-medium transition-colors font-medium text-sm sm:text-base"
            data-testid={`view-provider-${provider.provider_id}`}
          >
            צפה בפרופיל
          </Link>
          
          {showContact && (
            <div className="flex gap-2">
              <button
                onClick={handleCall}
                className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-carelink-navy text-white rounded-xl hover:bg-carelink-slate transition-colors"
                data-testid={`call-${provider.provider_id}`}
                title="התקשר"
              >
                <FaPhone className="text-sm sm:text-base" />
              </button>
              <button
                onClick={handleWhatsApp}
                className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                data-testid={`whatsapp-${provider.provider_id}`}
                title="WhatsApp"
              >
                <FaWhatsapp className="text-base sm:text-lg" />
              </button>
              <button
                onClick={handleChat}
                className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                data-testid={`chat-${provider.provider_id}`}
                title="צ'אט"
              >
                <FaComments className="text-sm sm:text-base" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Phone Modal (Desktop) */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPhoneModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 bg-carelink-teal rounded-full flex items-center justify-center mx-auto mb-4">
              <FaPhone className="text-2xl text-white" />
            </div>
            <h3 className="text-xl font-bold text-carelink-navy mb-2">מספר טלפון</h3>
            <p className="text-carelink-gray mb-4">{provider.business_name || 'ספק שירותים'}</p>
            
            <div className="bg-carelink-teal-pale/30 px-6 py-4 rounded-xl mb-4">
              <p className="text-2xl font-bold text-carelink-navy direction-ltr">
                {provider.phone || '050-0000000'}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(provider.phone || '050-0000000');
                  setShowPhoneModal(false);
                }}
                className="flex-1 bg-carelink-teal text-white py-3 rounded-xl font-semibold hover:bg-carelink-teal-medium transition"
              >
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
    </>
  );
};

export default ProviderCard;
