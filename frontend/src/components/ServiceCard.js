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
    if (service.provider?.provider_id) return `/providers/${service.provider.provider_id}`;
    if (service.provider?.user_id) return `/providers/${service.provider.user_id}`;
    if (service.provider_id) return `/providers/${service.provider_id}`;
    return '#';
  };

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    if (!service.provider?.phone) return;
    const phone = service.provider.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone}?text=שלום, אני מתעניין/ת בשירות "${service.name}"`, '_blank');
  };

  const handleCall = (e) => {
    e.stopPropagation();
    if (!service.provider?.phone) return;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const phone = service.provider.phone;
    if (isMobile) {
      window.location.href = `tel:${phone}`;
    } else {
      alert(`מספר טלפון: ${phone}`);
    }
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-100 hover:border-carelink-teal relative group overflow-hidden"
      data-testid={`service-card-${service.service_id}`}
    >
      {/* Top color accent */}

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
        <div className="flex items-center justify-between mb-4 bg-carelink-teal-pale/20 rounded-xl px-4 py-3">
          <div className="flex items-center gap-4">
            {service.duration_minutes && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <FaClock className="text-carelink-teal text-xs" />
                <span>{service.duration_minutes} דק'</span>
              </div>
            )}
            {service.service_city && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <FaMapMarkerAlt className="text-carelink-teal text-xs" />
                <span className="line-clamp-1">{service.service_city}</span>
              </div>
            )}
          </div>
          <div className="text-left">
            <span className="text-2xl font-extrabold text-carelink-navy">₪{service.price}</span>
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
            className="flex items-center justify-between bg-gray-50 rounded-xl p-3 mb-4 hover:bg-carelink-teal-pale/20 transition-colors group/provider"
            data-testid={`provider-link-${service.provider.provider_id || service.provider_id}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-carelink-teal to-carelink-navy rounded-full flex items-center justify-center text-white font-bold text-sm">
                {(service.provider.business_name || 'ס')[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 group-hover/provider:text-carelink-teal transition-colors">
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
            <span className="text-xs text-carelink-teal font-medium opacity-0 group-hover/provider:opacity-100 transition-opacity">
              צפה בפרופיל
            </span>
          </Link>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/book/${service.service_id}`)}
            className="flex-1 bg-carelink-teal text-white px-4 py-2.5 rounded-xl hover:bg-carelink-teal-medium transition-colors font-medium text-sm"
            data-testid={`book-service-${service.service_id}`}
            aria-label={`הזמן עכשיו את ${service.name}`}
          >
            הזמן עכשיו
          </button>
          {service.provider?.phone && (
            <button
              onClick={handleCall}
              className="w-10 h-10 flex items-center justify-center bg-carelink-navy text-white rounded-xl hover:bg-carelink-slate transition-colors"
              title="התקשר"
              aria-label="התקשר לספק"
            >
              <FaPhone className="text-sm" />
            </button>
          )}
          {service.provider?.phone && (
            <button
              onClick={handleWhatsApp}
              className="w-10 h-10 flex items-center justify-center bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
              title="WhatsApp"
              aria-label="שלח הודעת WhatsApp לספק"
            >
              <FaWhatsapp className="text-sm" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
