import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ServiceCard from '../components/ServiceCard';
import api from '../utils/api';
import { israeliLocalities } from '../data/israeliLocalities';
import { israeliRegions, healthcareProfessions, popularSearches, serviceTypes, serviceCategories } from '../data/searchData';
import { 
  FaFilter, FaTimes, FaSearch, FaMapMarkerAlt, FaCrosshairs, 
  FaSpinner, FaSortAmountDown, FaThLarge, FaList, FaBriefcase
} from 'react-icons/fa';

const Services = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('popular');
  
  // Search states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [locationQuery, setLocationQuery] = useState(searchParams.get('city') || '');
  const [professionQuery, setProfessionQuery] = useState(searchParams.get('profession') || '');
  const [isLocating, setIsLocating] = useState(false);
  
  // Dropdown states
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showProfessionDropdown, setShowProfessionDropdown] = useState(false);
  
  // Refs
  const searchInputRef = useRef(null);
  const locationInputRef = useRef(null);
  const professionInputRef = useRef(null);
  const searchDropdownRef = useRef(null);
  const locationDropdownRef = useRef(null);
  const professionDropdownRef = useRef(null);
  
  const [filters, setFilters] = useState({
    serviceType: searchParams.get('type') || '',
    category: searchParams.get('category') || '',
    priceMin: searchParams.get('priceMin') || '',
    priceMax: searchParams.get('priceMax') || '',
    city: searchParams.get('city') || '',
    profession: searchParams.get('profession') || ''
  });

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [services, filters, sortBy]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target) &&
          searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target) &&
          locationInputRef.current && !locationInputRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
      }
      if (professionDropdownRef.current && !professionDropdownRef.current.contains(event.target) &&
          professionInputRef.current && !professionInputRef.current.contains(event.target)) {
        setShowProfessionDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    
    // Search filter
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.name?.toLowerCase().includes(term) ||
        s.description?.toLowerCase().includes(term) ||
        s.provider?.business_name?.toLowerCase().includes(term)
      );
    }
    
    // Service type filter
    if (filters.serviceType) {
      result = result.filter(s => s.service_type === filters.serviceType);
    }
    
    // Category filter
    if (filters.category) {
      result = result.filter(s => s.category === filters.category);
    }
    
    // Price filters
    if (filters.priceMin) {
      result = result.filter(s => s.price >= parseInt(filters.priceMin));
    }
    if (filters.priceMax) {
      result = result.filter(s => s.price <= parseInt(filters.priceMax));
    }
    
    // City filter
    if (filters.city) {
      result = result.filter(s => s.provider?.location?.city?.includes(filters.city));
    }
    
    // Profession filter
    if (filters.profession) {
      const professionLower = filters.profession.toLowerCase();
      result = result.filter(s => 
        s.provider?.profession?.toLowerCase().includes(professionLower) ||
        s.provider?.specialization?.some(spec => spec.toLowerCase().includes(professionLower))
      );
    }
    
    // Sort
    switch (sortBy) {
      case 'price_low':
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price_high':
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'rating':
        result.sort((a, b) => (b.provider?.rating || 0) - (a.provider?.rating || 0));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      default:
        break;
    }
    
    setFilteredServices(result);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    const newFilters = {
      ...filters,
      city: locationQuery && locationQuery !== 'המיקום שלי' ? locationQuery : '',
      profession: professionQuery
    };
    setFilters(newFilters);
    
    // Update URL
    const newParams = new URLSearchParams();
    if (searchQuery) newParams.set('search', searchQuery);
    if (newFilters.city) newParams.set('city', newFilters.city);
    if (newFilters.profession) newParams.set('profession', newFilters.profession);
    if (newFilters.serviceType) newParams.set('type', newFilters.serviceType);
    if (newFilters.category) newParams.set('category', newFilters.category);
    setSearchParams(newParams);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('הדפדפן שלך לא תומך באיתור מיקום');
      return;
    }
    setIsLocating(true);
    setShowLocationDropdown(false);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=he`
          );
          const data = await response.json();
          const cityName = data.address?.city || data.address?.town || data.address?.village || 'המיקום שלי';
          setLocationQuery(cityName);
          setFilters({ ...filters, city: cityName });
        } catch (error) {
          setLocationQuery('המיקום שלי');
        }
        setIsLocating(false);
      },
      () => {
        alert('לא הצלחנו לאתר את המיקום שלך');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const resetFilters = () => {
    setFilters({ serviceType: '', category: '', priceMin: '', priceMax: '', city: '', profession: '' });
    setSearchQuery('');
    setLocationQuery('');
    setProfessionQuery('');
    setSearchParams({});
  };

  // Filter data for dropdowns
  const filteredSearches = searchQuery.trim() 
    ? popularSearches.services.filter(s => s.includes(searchQuery))
    : popularSearches.services;
    
  const filteredCities = locationQuery.trim()
    ? israeliLocalities.filter(c => c.name?.includes(locationQuery)).slice(0, 10)
    : [];
    
  const filteredProfessions = professionQuery.trim()
    ? healthcareProfessions.filter(p => 
        p.name.includes(professionQuery) || 
        p.searchTerms.some(t => t.includes(professionQuery))
      )
    : healthcareProfessions;

  const activeFiltersCount = [
    filters.serviceType, filters.category, filters.priceMin, 
    filters.priceMax, filters.city, filters.profession
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-carelink-teal-pale flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-carelink-navy font-heading mb-2" data-testid="services-title">
            {t('services')}
          </h1>
          <p className="text-carelink-gray">מצאו את השירות המושלם עבורכם</p>
        </div>

        {/* Advanced Search Box */}
        <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Search Input */}
            <div className="relative">
              <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-carelink-gray z-10" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearchDropdown(true)}
                placeholder="חפש שירות, טיפול..."
                className="w-full px-5 py-3 pr-12 border border-gray-200 rounded-xl focus:border-carelink-teal focus:ring-2 focus:ring-carelink-teal/20 outline-none transition-all"
                data-testid="services-search-input"
              />
              
              {/* Search Dropdown */}
              {showSearchDropdown && (
                <div 
                  ref={searchDropdownRef}
                  className="absolute top-full right-0 left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-64 overflow-y-auto"
                >
                  <div className="p-3 border-b border-gray-100">
                    <span className="text-xs font-semibold text-carelink-gray">חיפושים נפוצים</span>
                  </div>
                  <div className="p-2">
                    {filteredSearches.map((search, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setSearchQuery(search);
                          setShowSearchDropdown(false);
                        }}
                        className="w-full text-right px-3 py-2.5 hover:bg-carelink-teal-pale/30 rounded-lg transition-colors flex items-center gap-3 text-carelink-navy"
                      >
                        <FaSearch className="text-carelink-gray text-sm" />
                        <span>{search}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profession Input */}
            <div className="relative">
              <FaBriefcase className="absolute right-4 top-1/2 -translate-y-1/2 text-carelink-gray z-10" />
              <input
                ref={professionInputRef}
                type="text"
                value={professionQuery}
                onChange={(e) => setProfessionQuery(e.target.value)}
                onFocus={() => setShowProfessionDropdown(true)}
                placeholder="מקצוע (אחות, רופא...)"
                className="w-full px-5 py-3 pr-12 border border-gray-200 rounded-xl focus:border-carelink-teal focus:ring-2 focus:ring-carelink-teal/20 outline-none transition-all"
                data-testid="services-profession-input"
              />
              
              {/* Profession Dropdown */}
              {showProfessionDropdown && (
                <div 
                  ref={professionDropdownRef}
                  className="absolute top-full right-0 left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-64 overflow-y-auto"
                >
                  <div className="p-3 border-b border-gray-100">
                    <span className="text-xs font-semibold text-carelink-gray">מקצועות</span>
                  </div>
                  <div className="p-2">
                    {filteredProfessions.slice(0, 10).map((profession) => (
                      <button
                        key={profession.id}
                        type="button"
                        onClick={() => {
                          setProfessionQuery(profession.name);
                          setShowProfessionDropdown(false);
                        }}
                        className="w-full text-right px-3 py-2.5 hover:bg-carelink-teal-pale/30 rounded-lg transition-colors flex items-center gap-3 text-carelink-navy"
                      >
                        <FaBriefcase className="text-carelink-gray text-sm" />
                        <span>{profession.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Location Input */}
            <div className="relative flex gap-2">
              <div className="flex-1 relative">
                <FaMapMarkerAlt className="absolute right-4 top-1/2 -translate-y-1/2 text-carelink-gray z-10" />
                <input
                  ref={locationInputRef}
                  type="text"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  onFocus={() => setShowLocationDropdown(true)}
                  placeholder="עיר או אזור"
                  className="w-full px-5 py-3 pr-12 border border-gray-200 rounded-xl focus:border-carelink-teal focus:ring-2 focus:ring-carelink-teal/20 outline-none transition-all"
                  data-testid="services-location-input"
                />
                
                {/* Location Dropdown */}
                {showLocationDropdown && (
                  <div 
                    ref={locationDropdownRef}
                    className="absolute top-full right-0 left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-64 overflow-y-auto"
                  >
                    {/* GPS Option */}
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      className="w-full text-right px-4 py-3 hover:bg-carelink-teal-pale/30 transition-colors flex items-center gap-3 text-carelink-teal border-b border-gray-100"
                    >
                      <FaCrosshairs className="text-lg" />
                      <span className="font-medium">השתמש במיקום שלי</span>
                      {isLocating && <FaSpinner className="animate-spin mr-auto" />}
                    </button>
                    
                    {/* Regions */}
                    {!locationQuery && (
                      <>
                        <div className="p-3 border-b border-gray-100">
                          <span className="text-xs font-semibold text-carelink-gray">אזורים</span>
                        </div>
                        <div className="p-2">
                          {israeliRegions.map((region) => (
                            <button
                              key={region.id}
                              type="button"
                              onClick={() => {
                                setLocationQuery(region.name);
                                setShowLocationDropdown(false);
                              }}
                              className="w-full text-right px-3 py-2.5 hover:bg-carelink-teal-pale/30 rounded-lg transition-colors flex items-center gap-3 text-carelink-navy"
                            >
                              <FaMapMarkerAlt className="text-carelink-gray text-sm" />
                              <span>{region.name}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                    
                    {/* Cities */}
                    {locationQuery && filteredCities.length > 0 && (
                      <>
                        <div className="p-3 border-b border-gray-100">
                          <span className="text-xs font-semibold text-carelink-gray">ערים</span>
                        </div>
                        <div className="p-2">
                          {filteredCities.map((city) => (
                            <button
                              key={city.name}
                              type="button"
                              onClick={() => {
                                setLocationQuery(city.name);
                                setShowLocationDropdown(false);
                              }}
                              className="w-full text-right px-3 py-2.5 hover:bg-carelink-teal-pale/30 rounded-lg transition-colors flex items-center gap-3 text-carelink-navy"
                            >
                              <FaMapMarkerAlt className="text-carelink-gray text-sm" />
                              <span>{city.name}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              {/* GPS Button */}
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isLocating}
                className="bg-carelink-teal-pale text-carelink-teal px-4 rounded-xl hover:bg-carelink-teal hover:text-white transition-all disabled:opacity-50 flex items-center justify-center"
                title="השתמש במיקום שלי"
              >
                {isLocating ? <FaSpinner className="animate-spin" /> : <FaCrosshairs className="text-lg" />}
              </button>
            </div>
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="w-full bg-carelink-teal text-white px-8 py-3 rounded-xl font-semibold hover:bg-carelink-teal-medium transition-all flex items-center justify-center gap-2"
            data-testid="services-search-btn"
          >
            <FaSearch />
            <span>חפש שירותים</span>
          </button>
        </form>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className={`lg:w-72 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-xl shadow-lg p-5 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-carelink-navy flex items-center gap-2">
                  <FaFilter className="text-carelink-teal" />
                  סינון מתקדם
                  {activeFiltersCount > 0 && (
                    <span className="bg-carelink-teal text-white text-xs px-2 py-0.5 rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </h3>
                <button 
                  onClick={resetFilters}
                  className="text-sm text-carelink-teal hover:underline"
                >
                  נקה הכל
                </button>
              </div>

              {/* Category */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-carelink-navy mb-2">קטגוריה</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                  className="w-full p-2.5 border border-gray-200 rounded-lg focus:border-carelink-teal outline-none"
                >
                  <option value="">הכל</option>
                  {serviceCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Service Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-carelink-navy mb-2">סוג שירות</label>
                <select
                  value={filters.serviceType}
                  onChange={(e) => setFilters({...filters, serviceType: e.target.value})}
                  className="w-full p-2.5 border border-gray-200 rounded-lg focus:border-carelink-teal outline-none"
                >
                  <option value="">הכל</option>
                  {serviceTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-carelink-navy mb-2">טווח מחירים (₪)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="מ-"
                    value={filters.priceMin}
                    onChange={(e) => setFilters({...filters, priceMin: e.target.value})}
                    className="w-1/2 p-2.5 border border-gray-200 rounded-lg focus:border-carelink-teal outline-none"
                  />
                  <input
                    type="number"
                    placeholder="עד"
                    value={filters.priceMax}
                    onChange={(e) => setFilters({...filters, priceMax: e.target.value})}
                    className="w-1/2 p-2.5 border border-gray-200 rounded-lg focus:border-carelink-teal outline-none"
                  />
                </div>
              </div>

              {/* Close button on mobile */}
              <button
                onClick={() => setShowFilters(false)}
                className="lg:hidden w-full mt-4 py-2.5 bg-carelink-teal text-white rounded-lg font-medium"
              >
                החל סינון
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              {/* Mobile Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm"
              >
                <FaFilter className="text-carelink-teal" />
                סינון
                {activeFiltersCount > 0 && (
                  <span className="bg-carelink-teal text-white text-xs px-2 py-0.5 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Results count */}
              <p className="text-carelink-gray">
                נמצאו <span className="font-bold text-carelink-navy">{filteredServices.length}</span> שירותים
              </p>

              {/* Sort & View */}
              <div className="flex items-center gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:border-carelink-teal outline-none text-sm"
                >
                  <option value="popular">פופולריים</option>
                  <option value="rating">דירוג</option>
                  <option value="price_low">מחיר: נמוך לגבוה</option>
                  <option value="price_high">מחיר: גבוה לנמוך</option>
                  <option value="newest">חדשים</option>
                </select>

                <div className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}
                  >
                    <FaThLarge className="text-carelink-gray" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow' : ''}`}
                  >
                    <FaList className="text-carelink-gray" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters Tags */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {filters.city && (
                  <span className="inline-flex items-center gap-1 bg-carelink-teal-pale text-carelink-teal px-3 py-1 rounded-full text-sm">
                    {filters.city}
                    <button onClick={() => { setFilters({...filters, city: ''}); setLocationQuery(''); }}>
                      <FaTimes className="text-xs" />
                    </button>
                  </span>
                )}
                {filters.profession && (
                  <span className="inline-flex items-center gap-1 bg-carelink-teal-pale text-carelink-teal px-3 py-1 rounded-full text-sm">
                    {filters.profession}
                    <button onClick={() => { setFilters({...filters, profession: ''}); setProfessionQuery(''); }}>
                      <FaTimes className="text-xs" />
                    </button>
                  </span>
                )}
                {filters.category && (
                  <span className="inline-flex items-center gap-1 bg-carelink-teal-pale text-carelink-teal px-3 py-1 rounded-full text-sm">
                    {serviceCategories.find(c => c.id === filters.category)?.name}
                    <button onClick={() => setFilters({...filters, category: ''})}>
                      <FaTimes className="text-xs" />
                    </button>
                  </span>
                )}
                {filters.serviceType && (
                  <span className="inline-flex items-center gap-1 bg-carelink-teal-pale text-carelink-teal px-3 py-1 rounded-full text-sm">
                    {serviceTypes.find(t => t.id === filters.serviceType)?.name}
                    <button onClick={() => setFilters({...filters, serviceType: ''})}>
                      <FaTimes className="text-xs" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Results */}
            {loading ? (
              <div className="text-center py-12" data-testid="loading-indicator">
                <div className="w-12 h-12 border-4 border-carelink-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-carelink-gray">טוען שירותים...</p>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                <FaSearch className="mx-auto text-5xl text-gray-300 mb-4" />
                <p className="text-xl text-carelink-navy mb-2">לא נמצאו שירותים</p>
                <p className="text-carelink-gray mb-4">נסה לשנות את הסינון או מילות החיפוש</p>
                <button
                  onClick={resetFilters}
                  className="px-6 py-2 bg-carelink-teal text-white rounded-lg font-medium hover:bg-carelink-teal-medium transition"
                >
                  נקה סינון
                </button>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 gap-6' : 'space-y-4'}>
                {filteredServices.map((service) => (
                  <ServiceCard key={service.service_id} service={service} viewMode={viewMode} />
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
