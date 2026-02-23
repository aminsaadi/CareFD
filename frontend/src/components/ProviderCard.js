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
  home_visit: { icon: FaHome, label: 'ביקור בית', color: 'bg-blue-50 text-blue-600' },
  video_call: { icon: FaVideo, label: 'טלרפואה', color: 'bg-purple-50 text-purple-600' },
  clinic_visit: { icon: FaClinicMedical, label: 'ביקור במרפאה', color: 'bg-green-50 text-green-600' },
  phone_call: { icon: FaPhoneAlt, label: 'שיחה טלפונית', color: 'bg-orange-50 text-orange-600' }
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
        className="card-soft p-8 relative group"
        data-testid={`provider-card-${provider.provider_id}`}
      >
        {/* Badges */}
        <div className="absolute -top-3 right-6 flex gap-2">
          {provider.is_verified && (
            <span className="inline-flex items-center gap-1.5 bg-carelink-teal text-white text-xs px-4 py-1.5 rounded-full font-medium shadow-soft" data-testid="verified-badge">
              <FaCheckCircle />
              מאומת
            </span>
          )}
          {provider.is_recommended && (
            <span className="inline-flex items-center gap-1.5 bg-carelink-gold text-carelink-deep text-xs px-4 py-1.5 rounded-full font-medium shadow-soft" data-testid="recommended-badge">
              <FaAward />
              מומלץ
            </span>
          )}
        </div>

        <div className="flex items-start justify-between mb-5 mt-3">
          <div className="flex-1">
            <h3 className="text-xl font-serif font-bold text-carelink-deep mb-2">
              {provider.business_name || 'ספק שירותים'}
            </h3>
            {/* Profession Title */}
            {provider.profession_title && (
              <p className="text-carelink-teal font-medium text-sm mb-2" data-testid="profession-title">
                {getProfessionLabel(provider.profession_title)}
              </p>
            )}
            <div className="flex items-center gap-2 text-sm text-carelink-gray">
              <FaBriefcase className="text-carelink-teal" />
              <span>{t(provider.provider_type)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-carelink-stone px-4 py-2 rounded-2xl">
            <FaStar className="text-carelink-gold" />
            <span className="font-bold text-carelink-deep">{(provider.rating || 0).toFixed(1)}</span>
            <span className="text-xs text-carelink-gray">({provider.total_reviews || 0})</span>
          </div>
        </div>

        {provider.description && (
          <p className="text-carelink-slate mb-5 line-clamp-2 leading-relaxed">{provider.description}</p>
        )}

        {/* Service Types */}
        <div className="flex flex-wrap gap-2 mb-5">
          {serviceTypes.map((type) => {
            const config = serviceTypeConfig[type];
            if (!config) return null;
            const Icon = config.icon;
            return (
              <span
                key={type}
                className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-medium ${config.color}`}
                data-testid={`service-type-${type}`}
              >
                <Icon className="text-xs" />
                {config.label}
              </span>
            );
          })}
        </div>

        {provider.specializations && provider.specializations.length > 0 && (
          <div className="mb-5">
            <div className="flex flex-wrap gap-2">
              {provider.specializations.slice(0, 3).map((spec, idx) => (
                <span
                  key={idx}
                  className="bg-carelink-deep text-white text-xs px-4 py-1.5 rounded-full font-medium"
                >
                  {spec}
                </span>
              ))}
              {provider.specializations.length > 3 && (
                <span className="text-xs text-carelink-gray py-1.5">
                  +{provider.specializations.length - 3} עוד
                </span>
              )}
            </div>
          </div>
        )}

        {provider.location && (
          <div className="flex items-center text-sm text-carelink-gray mb-6">
            <FaMapMarkerAlt className="text-carelink-teal ml-2" />
            <span>{provider.location.city}</span>
            {provider.distance_km && (
              <span className="mr-3 text-carelink-teal font-medium">
                ({provider.distance_km.toFixed(1)} ק"מ)
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 flex-wrap sm:flex-nowrap pt-5 border-t border-carelink-stone">
          <Link
            to={`/providers/${provider.provider_id}`}
            className="flex-1 min-w-[140px] text-center bg-carelink-deep text-white px-5 py-3 rounded-2xl hover:bg-carelink-charcoal transition-all duration-300 font-medium shadow-soft hover:shadow-soft-md"
            data-testid={`view-provider-${provider.provider_id}`}
          >
            צפה בפרופיל
          </Link>
          
          {showContact && (
            <div className="flex gap-2">
              <button
                onClick={handleCall}
                className="w-12 h-12 flex items-center justify-center bg-carelink-stone text-carelink-deep rounded-2xl hover:bg-carelink-teal hover:text-white transition-all duration-300"
                data-testid={`call-${provider.provider_id}`}
                title="התקשר"
              >
                <FaPhone />
              </button>
              <button
                onClick={handleWhatsApp}
                className="w-12 h-12 flex items-center justify-center bg-green-50 text-green-600 rounded-2xl hover:bg-green-500 hover:text-white transition-all duration-300"
                data-testid={`whatsapp-${provider.provider_id}`}
                title="WhatsApp"
              >
                <FaWhatsapp className="text-lg" />
              </button>
              <button
                onClick={handleChat}
                className="w-12 h-12 flex items-center justify-center bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-500 hover:text-white transition-all duration-300"
                data-testid={`chat-${provider.provider_id}`}
                title="צ'אט"
              >
                <FaComments />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Phone Modal (Desktop) - Premium Style */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-carelink-deep/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPhoneModal(false)}>
          <div className="glass-card-premium rounded-3xl shadow-premium max-w-sm w-full p-8 text-center animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="w-18 h-18 bg-carelink-teal rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FaPhone className="text-2xl text-white" />
            </div>
            <h3 className="text-xl font-serif font-bold text-carelink-deep mb-2">מספר טלפון</h3>
            <p className="text-carelink-gray mb-6">{provider.business_name || 'ספק שירותים'}</p>
            
            <div className="bg-carelink-stone px-6 py-5 rounded-2xl mb-6">
              <p className="text-2xl font-bold text-carelink-deep direction-ltr">
                {provider.phone || '050-0000000'}
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(provider.phone || '050-0000000');
                  setShowPhoneModal(false);
                }}
                className="flex-1 bg-carelink-deep text-white py-3.5 rounded-2xl font-semibold hover:bg-carelink-charcoal transition-all duration-300 shadow-soft"
              >
                העתק
              </button>
              <button
                onClick={() => setShowPhoneModal(false)}
                className="flex-1 bg-carelink-stone text-carelink-charcoal py-3.5 rounded-2xl font-semibold hover:bg-carelink-light-gray/30 transition-all duration-300"
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
