import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClock, FaMoneyBillWave } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const ServiceCard = ({ service }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div
      className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border-2 border-carelink-teal-pale hover:border-carelink-teal"
      data-testid={`service-card-${service.service_id}`}
    >
      <div className="mb-4">
        <h3 className="text-xl font-bold text-carelink-navy mb-2">{service.name}</h3>
        <p className="text-carelink-slate line-clamp-2">{service.description}</p>
      </div>

      <div className="space-y-2 mb-4">
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

      {service.service_type && (
        <div className="mb-4">
          <span className="bg-carelink-navy text-white text-xs px-3 py-1 rounded-full">
            {t(service.service_type)}
          </span>
        </div>
      )}

      {service.provider && (
        <p className="text-sm text-carelink-gray mb-4">
          ספק: {service.provider.business_name || 'ספק שירותים'}
        </p>
      )}

      <button
        onClick={() => navigate(`/book/${service.service_id}`)}
        className="w-full bg-carelink-teal text-white px-4 py-2 rounded-lg hover:bg-carelink-teal-medium transition-colors font-medium"
        data-testid={`book-service-${service.service_id}`}
      >
        {t('bookNow')}
      </button>
    </div>
  );
};

export default ServiceCard;