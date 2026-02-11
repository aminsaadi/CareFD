import React from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaMapMarkerAlt, FaBriefcase } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const ProviderCard = ({ provider }) => {
  const { t } = useTranslation();

  return (
    <div
      className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border-2 border-carelink-teal-pale hover:border-carelink-teal"
      data-testid={`provider-card-${provider.provider_id}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-carelink-navy mb-1">
            {provider.business_name || 'ספק שירותים'}
          </h3>
          <div className="flex items-center gap-2 text-sm text-carelink-gray">
            <FaBriefcase className="text-carelink-teal" />
            <span>{t(provider.provider_type)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-carelink-teal-pale px-3 py-1 rounded-full">
          <FaStar className="text-yellow-500" />
          <span className="font-bold text-carelink-navy">{provider.rating.toFixed(1)}</span>
          <span className="text-xs text-carelink-gray">({provider.total_reviews})</span>
        </div>
      </div>

      {provider.description && (
        <p className="text-carelink-slate mb-4 line-clamp-2">{provider.description}</p>
      )}

      {provider.specializations && provider.specializations.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {provider.specializations.slice(0, 3).map((spec, idx) => (
              <span
                key={idx}
                className="bg-carelink-teal-light text-white text-xs px-3 py-1 rounded-full font-medium"
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

      <Link
        to={`/providers/${provider.provider_id}`}
        className="block w-full text-center bg-carelink-teal text-white px-4 py-2 rounded-lg hover:bg-carelink-teal-medium transition-colors font-medium"
        data-testid={`view-provider-${provider.provider_id}`}
      >
        צפה בפרופיל
      </Link>
    </div>
  );
};

export default ProviderCard;