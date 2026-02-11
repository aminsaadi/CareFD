import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaClock, FaMoneyBillWave, FaHome, FaVideo, FaClinicMedical, 
  FaPhoneAlt, FaStar, FaWhatsapp
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

// Service type icons and labels
const serviceTypeConfig = {
  home_visit: { icon: FaHome, label: 'ביקור בית', color: 'bg-blue-500 text-white' },
  video_call: { icon: FaVideo, label: 'טלרפואה', color: 'bg-purple-500 text-white' },
  clinic_visit: { icon: FaClinicMedical, label: 'ביקור במרפאה', color: 'bg-green-500 text-white' },
  phone_call: { icon: FaPhoneAlt, label: 'שיחה טלפונית', color: 'bg-orange-500 text-white' }
};

const ServiceCard = ({ service, showProvider = true }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const serviceTypeInfo = serviceTypeConfig[service.service_type] || serviceTypeConfig.clinic_visit;
  const ServiceIcon = serviceTypeInfo.icon;

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    const phone = service.provider?.phone?.replace(/[^0-9]/g, '') || '972500000000';
    window.open(`https://wa.me/${phone}?text=שלום, אני מתעניין/ת בשירות "${service.name}"`, '_blank');
  };

  return (
    <div
      className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all border-2 border-carelink-teal-pale hover:border-carelink-teal relative group"
      data-testid={`service-card-${service.service_id}`}
    >
      {/* Service Type Badge */}
      <div className="absolute -top-3 right-4">
        <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium shadow-md ${serviceTypeInfo.color}`}>
          <ServiceIcon />
          {serviceTypeInfo.label}
        </span>
      </div>

      <div className="mb-4 mt-2">
        <h3 className="text-xl font-bold text-carelink-navy mb-2">{service.name}</h3>
        <p className="text-carelink-slate line-clamp-2 text-sm">{service.description}</p>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-carelink-gray">
            <FaMoneyBillWave className="text-carelink-teal" />
            <span className="text-sm">{t(service.pricing_type)}</span>
          </div>
          <span className="text-2xl font-bold text-carelink-teal">₪{service.price}</span>
        </div>

        {service.duration_minutes && (
          <div className="flex items-center gap-2 text-carelink-gray text-sm">
            <FaClock className="text-carelink-teal" />
            <span>{service.duration_minutes} דקות</span>
          </div>
        )}
      </div>

      {showProvider && service.provider && (
        <div className="flex items-center justify-between bg-carelink-teal-pale/20 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-carelink-navy rounded-full flex items-center justify-center text-white font-bold">
              {(service.provider.business_name || 'ס')[0]}
            </div>
            <div>
              <p className="text-sm font-semibold text-carelink-navy">
                {service.provider.business_name || 'ספק שירותים'}
              </p>
              {service.provider.rating && (
                <div className="flex items-center gap-1 text-xs text-carelink-gray">
                  <FaStar className="text-yellow-500" />
                  <span>{service.provider.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/book/${service.service_id}`)}
          className="flex-1 bg-carelink-teal text-white px-4 py-2.5 rounded-xl hover:bg-carelink-teal-medium transition-colors font-medium"
          data-testid={`book-service-${service.service_id}`}
        >
          {t('bookNow')}
        </button>
        <button
          onClick={handleWhatsApp}
          className="w-11 h-11 flex items-center justify-center bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
          title="WhatsApp"
        >
          <FaWhatsapp className="text-lg" />
        </button>
      </div>
    </div>
  );
};

export default ServiceCard;
