import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProviderCard from '../components/ProviderCard';
import SearchBar from '../components/SearchBar';
import api from '../utils/api';

const Providers = () => {
  const { t } = useTranslation();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterValues, setFilterValues] = useState({});

  const filters = [
    {
      name: 'specialization',
      label: t('specialization'),
      type: 'text',
      value: filterValues.specialization || '',
      placeholder: 'התמחות...'
    },
    {
      name: 'city',
      label: 'עיר',
      type: 'text',
      value: filterValues.city || '',
      placeholder: 'שם העיר...'
    },
    {
      name: 'provider_type',
      label: 'סוג ספק',
      type: 'select',
      value: filterValues.provider_type || '',
      options: [
        { value: 'individual', label: t('individual') },
        { value: 'company', label: t('company') },
        { value: 'clinic', label: t('clinic') }
      ]
    }
  ];

  useEffect(() => {
    fetchProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.keys(filterValues).forEach(key => {
        if (filterValues[key]) params.append(key, filterValues[key]);
      });
      
      const response = await api.get(`/providers?${params.toString()}`);
      setProviders(response.data.providers || []);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilterValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    fetchProviders();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-carelink-teal-pale flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <h1 className="text-3xl font-bold mb-6 text-carelink-navy font-heading" data-testid="providers-title">
          {t('providers')}
        </h1>

        {/* Search Bar */}
        <SearchBar
          onSearch={handleSearch}
          placeholder="חפש ספקי שירותים..."
          showFilters={true}
          filters={filters}
          onFilterChange={handleFilterChange}
        />

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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {providers.map((provider) => (
              <ProviderCard key={provider.provider_id} provider={provider} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Providers;
