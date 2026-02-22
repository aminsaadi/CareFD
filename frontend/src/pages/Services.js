import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ServiceCard from '../components/ServiceCard';
import SearchBar from '../components/SearchBar';
import api from '../utils/api';
import { FaFilter, FaTimes } from 'react-icons/fa';

const Services = () => {
  const { t } = useTranslation();
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    serviceType: '',
    priceMin: '',
    priceMax: '',
    city: ''
  });

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [services, filters]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/services');
      const apiServices = response.data.services || [];
      setServices(apiServices);
      setFilteredServices(apiServices);
    } catch (error) {
      console.error('Failed to fetch services:', error);
      setServices([]);
      setFilteredServices([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...services];
    
    if (filters.serviceType) {
      result = result.filter(s => s.service_type === filters.serviceType);
    }
    if (filters.priceMin) {
      result = result.filter(s => s.price >= parseInt(filters.priceMin));
    }
    if (filters.priceMax) {
      result = result.filter(s => s.price <= parseInt(filters.priceMax));
    }
    if (filters.city) {
      result = result.filter(s => s.provider?.location?.city?.includes(filters.city));
    }
    
    setFilteredServices(result);
  };

  const handleSearch = (searchTerm) => {
    if (!searchTerm) {
      setFilteredServices(services);
      return;
    }
    const term = searchTerm.toLowerCase();
    const filtered = services.filter(s => 
      s.name?.toLowerCase().includes(term) ||
      s.description?.toLowerCase().includes(term) ||
      s.provider?.business_name?.toLowerCase().includes(term)
    );
    setFilteredServices(filtered);
  };

  const resetFilters = () => {
    setFilters({ serviceType: '', priceMin: '', priceMax: '', city: '' });
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
