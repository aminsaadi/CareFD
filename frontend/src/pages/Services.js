import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';

const Services = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/services');
      setServices(response.data.services || []);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6" data-testid="services-title">
          {t('services')}
        </h1>

        {loading ? (
          <div className="text-center py-12" data-testid="loading-indicator">
            {t('loading')}
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12 text-gray-600" data-testid="no-services">
            לא נמצאו שירותים
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.service_id}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition"
                data-testid={`service-card-${service.service_id}`}
              >
                <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                <p className="text-gray-700 mb-4">{service.description}</p>
                
                <div className="mb-4">
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                    {t(service.service_type)}
                  </span>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold text-blue-600">
                    ₪{service.price}
                  </span>
                  <span className="text-sm text-gray-600">{t(service.pricing_type)}</span>
                </div>

                {service.provider && (
                  <p className="text-sm text-gray-600 mb-4">
                    ספק: {service.provider.business_name || 'ספק שירותים'}
                  </p>
                )}

                <button
                  onClick={() => navigate(`/book/${service.service_id}`)}
                  className="w-full bg-carelink-teal text-white px-4 py-2 rounded hover:bg-carelink-teal-medium transition-colors"
                  data-testid={`book-service-${service.service_id}`}
                >
                  {t('bookNow')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Services;