import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaStar, FaMapMarkerAlt, FaBriefcase, FaCheckCircle, FaAward,
  FaHome, FaVideo, FaClinicMedical, FaPhoneAlt, FaWhatsapp
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

// Service type icons and labels
const serviceTypeConfig = {
  home_visit: { icon: FaHome, label: 'ביקור בית', color: 'bg-blue-100 text-blue-600' },
  video_call: { icon: FaVideo, label: 'טלרפואה', color: 'bg-purple-100 text-purple-600' },
  clinic_visit: { icon: FaClinicMedical, label: 'ביקור במרפאה', color: 'bg-green-100 text-green-600' },
  phone_call: { icon: FaPhoneAlt, label: 'שיחה טלפונית', color: 'bg-orange-100 text-orange-600' }
};

const ProviderCard = ({ provider, showContact = true }) => {
  const { t } = useTranslation();

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
    const phone = provider.phone || '050-0000000';
    window.location.href = `tel:${phone}`;
  };

  return (
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
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Link
          to={`/providers/${provider.provider_id}`}
          className="flex-1 text-center bg-carelink-teal text-white px-4 py-2.5 rounded-xl hover:bg-carelink-teal-medium transition-colors font-medium"
          data-testid={`view-provider-${provider.provider_id}`}
        >
          צפה בפרופיל
        </Link>
        
        {showContact && (
          <>
            <button
              onClick={handleWhatsApp}
              className="w-11 h-11 flex items-center justify-center bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
              data-testid={`whatsapp-${provider.provider_id}`}
              title="WhatsApp"
            >
              <FaWhatsapp className="text-lg" />
            </button>
            <button
              onClick={handleCall}
              className="w-11 h-11 flex items-center justify-center bg-carelink-navy text-white rounded-xl hover:bg-carelink-slate transition-colors"
              data-testid={`call-${provider.provider_id}`}
              title="התקשר"
            >
              <FaPhoneAlt />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ProviderCard;
