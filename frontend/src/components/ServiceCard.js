import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FaClock, FaMoneyBillWave, FaHome, FaVideo, FaClinicMedical, 
  FaPhoneAlt, FaStar, FaWhatsapp, FaPhone, FaTag, FaMapMarkerAlt
} from 'react-icons/fa';

const serviceTypeConfig = {
  home_visit: { icon: FaHome, label: 'ביקור בית', color: 'bg-blue-500 text-white' },
  video_call: { icon: FaVideo, label: 'טלרפואה', color: 'bg-purple-500 text-white' },
  clinic_visit: { icon: FaClinicMedical, label: 'ביקור במרפאה', color: 'bg-green-500 text-white' },
  phone_call: { icon: FaPhoneAlt, label: 'שיחה טלפונית', color: 'bg-orange-500 text-white' }
};

const categoryLabels = {
  visit: 'ביקור',
  hourly: 'שעתי',
  consultation: 'ייעוץ',
  product: 'מוצר'
};

const pricingLabels = {
  per_hour: 'לשעה',
  per_visit: 'לביקור',
  per_session: 'לפגישה',
  fixed: 'מחיר קבוע'
};

const ServiceCard = ({ service, showProvider = true }) => {
  const navigate = useNavigate();

  const serviceTypeInfo = serviceTypeConfig[service.service_type] || serviceTypeConfig.clinic_visit;
  const ServiceIcon = serviceTypeInfo.icon;

  const priceUnit = pricingLabels[service.pricing_type] || '';
  const categoryLabel = categoryLabels[service.service_category] || '';

  // Resolve the correct provider profile link
  const getProviderLink = () => {
    if (service.provider?.provider_id) return `/provider/${service.provider.provider_id}`;
    if (service.provider?.user_id) return `/provider/${service.provider.user_id}`;
    if (service.provider_id) return `/provider/${service.provider_id}`;
    return '#';
  };

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    const phone = service.provider?.phone?.replace(/[^0-9]/g, '') || '972500000000';
    window.open(`https://wa.me/${phone}?text=שלום, אני מתעניין/ת בשירות "${service.name}"`, '_blank');
  };

  const handleCall = (e) => {
    e.stopPropagation();
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const phone = service.provider?.phone || '050-0000000';
    if (isMobile) {
      window.location.href = `tel:${phone}`;
    } else {
      alert(`מספר טלפון: ${phone}`);
    }
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-100 hover:border-teal-300 relative group overflow-hidden"
      data-testid={`service-card-${service.service_id}`}
    >
      {/* Top color accent */}
      <div className="h-1 bg-gradient-to-l from-teal-400 to-teal-600" />

      <div className="p-5">
        {/* Tags row */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium shadow-sm ${serviceTypeInfo.color}`}>
            <ServiceIcon className="text-[10px]" />
            {serviceTypeInfo.label}
          </span>
          {categoryLabel && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-600">
              <FaTag className="text-[10px]" />
              {categoryLabel}
            </span>
          )}
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-bold text-gray-900 mb-1.5 line-clamp-1">{service.name}</h3>
        <p className="text-gray-500 text-sm line-clamp-2 mb-4 leading-relaxed">{service.description}</p>

        {/* Price + Duration row */}
        <div className="flex items-center justify-between mb-4 bg-teal-50/60 rounded-xl px-4 py-3">
          <div className="flex items-center gap-4">
            {service.duration_minutes && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <FaClock className="text-teal-500 text-xs" />
                <span>{service.duration_minutes} דק'</span>
              </div>
            )}
            {service.service_city && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <FaMapMarkerAlt className="text-teal-500 text-xs" />
                <span className="line-clamp-1">{service.service_city}</span>
              </div>
            )}
          </div>
          <div className="text-left">
            <span className="text-2xl font-extrabold text-teal-700">₪{service.price}</span>
            {priceUnit && (
              <span className="text-xs text-gray-500 mr-1">/{priceUnit}</span>
            )}
          </div>
        </div>

        {/* Provider Info */}
        {showProvider && service.provider && (
          <Link 
            to={getProviderLink()}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-between bg-gray-50 rounded-xl p-3 mb-4 hover:bg-gray-100 transition-colors group/provider"
            data-testid={`provider-link-${service.provider.provider_id || service.provider_id}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-teal-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {(service.provider.business_name || 'ס')[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 group-hover/provider:text-teal-700 transition-colors">
                  {service.provider.business_name || 'ספק שירותים'}
                </p>
                {service.provider.rating > 0 && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <FaStar className="text-yellow-500" />
                    <span>{service.provider.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
            <span className="text-xs text-teal-600 font-medium opacity-0 group-hover/provider:opacity-100 transition-opacity">
              צפה בפרופיל
            </span>
          </Link>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/book/${service.service_id}`)}
            className="flex-1 bg-teal-600 text-white px-4 py-2.5 rounded-xl hover:bg-teal-700 transition-colors font-medium text-sm"
            data-testid={`book-service-${service.service_id}`}
          >
            הזמן עכשיו
          </button>
          <button
            onClick={handleCall}
            className="w-10 h-10 flex items-center justify-center bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-colors"
            title="התקשר"
          >
            <FaPhone className="text-sm" />
          </button>
          <button
            onClick={handleWhatsApp}
            className="w-10 h-10 flex items-center justify-center bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
            title="WhatsApp"
          >
            <FaWhatsapp className="text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
