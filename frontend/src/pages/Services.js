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

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className={`lg:w-72 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-xl shadow-lg p-5 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-carelink-navy flex items-center gap-2">
                  <FaFilter className="text-carelink-teal" />
                  סינון
                </h3>
                <button 
                  onClick={resetFilters}
                  className="text-sm text-carelink-teal hover:underline"
                >
                  נקה הכל
                </button>
              </div>

              {/* Service Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-carelink-navy mb-2">סוג שירות</label>
                <select
                  value={filters.serviceType}
                  onChange={(e) => setFilters({...filters, serviceType: e.target.value})}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:border-carelink-teal outline-none"
                >
                  <option value="">הכל</option>
                  <option value="home_visit">ביקור בית</option>
                  <option value="clinic_visit">ביקור במרפאה</option>
                  <option value="video_call">שיחת וידאו</option>
                  <option value="phone_call">שיחה טלפונית</option>
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-carelink-navy mb-2">טווח מחירים</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="מ-"
                    value={filters.priceMin}
                    onChange={(e) => setFilters({...filters, priceMin: e.target.value})}
                    className="w-1/2 p-2 border border-gray-200 rounded-lg focus:border-carelink-teal outline-none"
                  />
                  <input
                    type="number"
                    placeholder="עד"
                    value={filters.priceMax}
                    onChange={(e) => setFilters({...filters, priceMax: e.target.value})}
                    className="w-1/2 p-2 border border-gray-200 rounded-lg focus:border-carelink-teal outline-none"
                  />
                </div>
              </div>

              {/* City */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-carelink-navy mb-2">עיר</label>
                <input
                  type="text"
                  placeholder="הזן עיר..."
                  value={filters.city}
                  onChange={(e) => setFilters({...filters, city: e.target.value})}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:border-carelink-teal outline-none"
                />
              </div>

              {/* Close button on mobile */}
              <button
                onClick={() => setShowFilters(false)}
                className="lg:hidden w-full mt-4 py-2 bg-carelink-teal text-white rounded-lg"
              >
                החל סינון
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden mb-4 flex items-center gap-2 px-4 py-2 bg-carelink-teal text-white rounded-lg"
            >
              <FaFilter />
              {showFilters ? 'הסתר סינון' : 'סינון'}
            </button>

            <SearchBar
              onSearch={handleSearch}
              placeholder="חפש שירותים..."
            />

            <p className="text-carelink-gray my-4">
              נמצאו <span className="font-bold text-carelink-navy">{filteredServices.length}</span> שירותים
            </p>

            {loading ? (
              <div className="text-center py-12" data-testid="loading-indicator">
                <div className="w-12 h-12 border-4 border-carelink-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                <p className="text-xl text-carelink-navy mb-2">לא נמצאו שירותים</p>
                <p className="text-carelink-gray">נסה לשנות את הסינון או מילות החיפוש</p>
                <button
                  onClick={resetFilters}
                  className="mt-4 px-4 py-2 bg-carelink-teal text-white rounded-lg"
                >
                  נקה סינון
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredServices.map((service) => (
                  <ServiceCard key={service.service_id} service={service} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Services;
