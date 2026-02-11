import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ServiceCard from '../components/ServiceCard';
import SearchBar from '../components/SearchBar';
import api from '../utils/api';

const Services = () => {
  const { t } = useTranslation();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleSearch = (searchTerm) => {
    console.log('Searching for:', searchTerm);
    // Filter services by search term
    fetchServices();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-carelink-teal-pale flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <h1 className="text-3xl font-bold mb-6 text-carelink-navy font-heading" data-testid="services-title">
          {t('services')}
        </h1>

        <SearchBar
          onSearch={handleSearch}
          placeholder="חפש שירותים..."
        />

        {loading ? (
          <div className="text-center py-12" data-testid="loading-indicator">
            {t('loading')}
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12 text-gray-600" data-testid="no-services">
            לא נמצאו שירותים
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {services.map((service) => (
              <ServiceCard key={service.service_id} service={service} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Services;
