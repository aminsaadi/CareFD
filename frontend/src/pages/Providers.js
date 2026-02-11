import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import api from '../utils/api';

const Providers = () => {
  const { t } = useTranslation();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    specialization: '',
    city: '',
    provider_type: '',
    min_rating: ''
  });

  useEffect(() => {
    fetchProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      
      const response = await api.get(`/providers?${params.toString()}`);
      setProviders(response.data.providers || []);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    fetchProviders();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6" data-testid="providers-title">
          {t('providers')}
        </h1>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6" data-testid="filters-section">
          <h2 className="text-xl font-semibold mb-4">{t('filter')}</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <input
              type="text"
              name="specialization"
              placeholder={t('specialization')}
              value={filters.specialization}
              onChange={handleFilterChange}
              className="px-3 py-2 border border-gray-300 rounded-md"
              data-testid="filter-specialization"
            />
            <input
              type="text"
              name="city"
              placeholder="עיר"
              value={filters.city}
              onChange={handleFilterChange}
              className="px-3 py-2 border border-gray-300 rounded-md"
              data-testid="filter-city"
            />
            <select
              name="provider_type"
              value={filters.provider_type}
              onChange={handleFilterChange}
              className="px-3 py-2 border border-gray-300 rounded-md"
              data-testid="filter-type"
            >
              <option value="">כל הסוגים</option>
              <option value="individual">{t('individual')}</option>
              <option value="company">{t('company')}</option>
              <option value="clinic">{t('clinic')}</option>
            </select>
            <button
              onClick={handleSearch}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              data-testid="search-btn"
            >
              {t('search')}
            </button>
          </div>
        </div>

        {/* Providers List */}
        {loading ? (
          <div className="text-center py-12" data-testid="loading-indicator">
            {t('loading')}
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-12 text-gray-600" data-testid="no-providers">
            לא נמצאו ספקים
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
              <div
                key={provider.provider_id}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition"
                data-testid={`provider-card-${provider.provider_id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {provider.business_name || 'ספק שירותים'}
                    </h3>
                    <p className="text-sm text-gray-600">{t(provider.provider_type)}</p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-yellow-500 mr-1">⭐</span>
                    <span className="font-semibold">{provider.rating.toFixed(1)}</span>
                  </div>
                </div>

                {provider.description && (
                  <p className="text-gray-700 mb-4 line-clamp-2">{provider.description}</p>
                )}

                {provider.specializations && provider.specializations.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {provider.specializations.slice(0, 3).map((spec, idx) => (
                        <span
                          key={idx}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {provider.location && (
                  <p className="text-sm text-gray-600 mb-4">
                    📍 {provider.location.city}
                  </p>
                )}

                <a
                  href={`/providers/${provider.provider_id}`}
                  className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  data-testid={`view-provider-${provider.provider_id}`}
                >
                  צפה בפרופיל
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Providers;