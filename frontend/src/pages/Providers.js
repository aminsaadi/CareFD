import React, { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProviderCard from '../components/ProviderCard';
import AdvancedFilters from '../components/AdvancedFilters';
import api from '../utils/api';
import { israeliLocalities } from '../data/israeliLocalities';
import { israeliRegions, healthcareProfessions, popularSearches as searchData } from '../data/searchData';
import { 
  FaSearch, FaFilter, FaTimes, FaSortAmountDown, FaMapMarkerAlt,
  FaThLarge, FaList, FaCrosshairs, FaSpinner, FaMap, FaBriefcase
} from 'react-icons/fa';

// Lazy load map component
const ProvidersMap = lazy(() => import('../components/ProvidersMap'));

// Popular searches data - use from searchData
const popularSearches = searchData.providers;
const Providers = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [providers, setProviders] = useState([]);
  const [totalProviders, setTotalProviders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [sortBy, setSortBy] = useState('rating');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [locationQuery, setLocationQuery] = useState(searchParams.get('city') || '');
  const [isLocating, setIsLocating] = useState(false);
  
  // Dropdown states
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [cities, setCities] = useState([]);
  const searchInputRef = useRef(null);
  const locationInputRef = useRef(null);
  const searchDropdownRef = useRef(null);
  const locationDropdownRef = useRef(null);
  
  // Israeli regions for quick selection - use from searchData
  const regions = israeliRegions;

  const radiusOptions = [
    { value: 5, label: '5 ק"מ' },
    { value: 10, label: '10 ק"מ' },
    { value: 25, label: '25 ק"מ' },
    { value: 50, label: '50 ק"מ' }
  ];

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    city: searchParams.get('city') || null,
    category: searchParams.get('category') || null,
    specialization: searchParams.get('specialization') || null,
    serviceType: searchParams.get('serviceType') || null,
    providerType: searchParams.get('providerType') || null,
    minRating: searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')) : null,
    minExperience: searchParams.get('minExperience') ? parseInt(searchParams.get('minExperience')) : null,
    verifiedOnly: searchParams.get('verifiedOnly') === 'true',
    recommendedOnly: searchParams.get('recommendedOnly') === 'true',
    latitude: searchParams.get('latitude') ? parseFloat(searchParams.get('latitude')) : null,
    longitude: searchParams.get('longitude') ? parseFloat(searchParams.get('longitude')) : null,
    radius: searchParams.get('radius_km') ? parseFloat(searchParams.get('radius_km')) : null,
    useMyLocation: searchParams.has('latitude') && searchParams.has('longitude')
  });

  // Initialize location if provided via URL
  useEffect(() => {
    if (searchParams.has('latitude') && searchParams.has('longitude')) {
      setLocationQuery('המיקום שלי');
    }
    // Fetch cities from backend (includes coordinates)
    const fetchCities = async () => {
      try {
        const res = await api.get('/localities?limit=500');
        setCities(res.data.localities || []);
      } catch {
        // Fallback to static list
        setCities(israeliLocalities.map(c => ({ name: c.name, region: c.region })));
      }
    };
    fetchCities();
  }, []);

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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter cities based on input
  const filteredCities = cities.filter(city => 
    city.name?.includes(locationQuery)
  ).slice(0, 10);

  // Filter popular searches based on input
  const filteredSearches = searchQuery.trim() 
    ? popularSearches.filter(s => s.includes(searchQuery))
    : popularSearches;

  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useEffect(() => {
    // Count active filters
    let count = 0;
    if (filters.city) count++;
    if (filters.category) count++;
    if (filters.specialization) count++;
    if (filters.serviceType) count++;
    if (filters.providerType) count++;
    if (filters.minRating) count++;
    if (filters.minExperience) count++;
    if (filters.verifiedOnly) count++;
    if (filters.recommendedOnly) count++;
    if (filters.useMyLocation) count++;
    setActiveFiltersCount(count);
  }, [filters]);

  useEffect(() => {
    fetchProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortBy]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.city) params.append('city', filters.city);
      if (filters.category) params.append('category', filters.category);
      if (filters.specialization) params.append('specialization', filters.specialization);
      if (filters.serviceType) params.append('service_type', filters.serviceType);
      if (filters.providerType) params.append('provider_type', filters.providerType);
      if (filters.minRating) params.append('min_rating', filters.minRating.toString());
      if (filters.minExperience) params.append('min_experience', filters.minExperience.toString());
      if (filters.verifiedOnly) params.append('verified_only', 'true');
      if (filters.recommendedOnly) params.append('recommended_only', 'true');
      if (filters.latitude && filters.longitude) {
        params.append('latitude', filters.latitude.toString());
        params.append('longitude', filters.longitude.toString());
        if (filters.radius) params.append('radius_km', filters.radius.toString());
      }
      params.append('sort_by', sortBy);
      params.append('sort_order', 'desc');
      
      const response = await api.get(`/providers?${params.toString()}`);
      let apiProviders = response.data.providers || [];
      
      // Show actual providers from API (no dummy data fallback)
      setProviders(apiProviders);
      setTotalProviders(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      // Show empty on error - no dummy data
      setProviders([]);
      setTotalProviders(0);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 10) / 10;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const newFilters = { ...filters, search: searchQuery };
    
    // Handle location
    if (locationQuery && locationQuery !== 'המיקום שלי') {
      newFilters.city = locationQuery;
      newFilters.useMyLocation = false;
      newFilters.latitude = null;
      newFilters.longitude = null;
    } else if (locationQuery === '' || !locationQuery) {
      newFilters.city = null;
    }
    
    setFilters(newFilters);
    
    // Update URL
    const newParams = new URLSearchParams();
    if (searchQuery) newParams.set('search', searchQuery);
    if (newFilters.city) newParams.set('city', newFilters.city);
    if (newFilters.latitude) newParams.set('latitude', newFilters.latitude);
    if (newFilters.longitude) newParams.set('longitude', newFilters.longitude);
    if (newFilters.radius) newParams.set('radius_km', newFilters.radius);
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
        
        // Reverse geocoding to get city name
        let cityName = 'המיקום שלי';
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=he`
          );
          const data = await response.json();
          cityName = data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || 'המיקום שלי';
        } catch (error) {
          console.error('Reverse geocoding error:', error);
        }
        
        const newFilters = {
          ...filters,
          latitude: lat,
          longitude: lng,
          useMyLocation: true,
          city: null,
          radius: filters.radius || 10
        };
        setFilters(newFilters);
        setLocationQuery(cityName);
        setIsLocating(false);
        
        // Update sort to distance
        setSortBy('distance');
        
        // Update URL
        const newParams = new URLSearchParams(searchParams);
        newParams.set('latitude', lat);
        newParams.set('longitude', lng);
        newParams.set('radius_km', newFilters.radius);
        newParams.delete('city');
        setSearchParams(newParams);
      },
      (error) => {
        console.error('Location error:', error);
        alert('לא הצלחנו לאתר את המיקום שלך');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleRadiusChange = (radius) => {
    const newFilters = { ...filters, radius };
    setFilters(newFilters);
    
    if (filters.useMyLocation) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('radius_km', radius);
      setSearchParams(newParams);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    setShowFilters(false);
    fetchProviders();
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      city: null,
      category: null,
      specialization: null,
      serviceType: null,
      providerType: null,
      minRating: null,
      minExperience: null,
      verifiedOnly: false,
      recommendedOnly: false,
      latitude: null,
      longitude: null,
      radius: null,
      useMyLocation: false
    });
    setSearchQuery('');
    setLocationQuery('');
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-carelink-teal-pale/30 flex flex-col">
      <Navbar />
      
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-carelink-navy font-heading mb-2" data-testid="providers-title">
              {t('providers')}
            </h1>
            <p className="text-carelink-gray">מצאו את נותני השירות המתאימים לכם</p>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
            <form onSubmit={handleSearch} className="space-y-4">
              {/* Two Column Search */}
              <div className="grid md:grid-cols-2 gap-3">
                {/* Column 1: Profession/Category with Dropdown */}
                <div className="relative">
                  <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-carelink-gray z-10" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSearchDropdown(true)}
                    placeholder="מקצוע, התמחות, שם ספק..."
                    className="w-full px-4 py-3 pr-12 border-2 border-carelink-teal-pale rounded-xl focus:outline-none focus:border-carelink-teal"
                    data-testid="search-input"
                  />
                  
                  {/* Search Dropdown */}
                  {showSearchDropdown && (
                    <div 
                      ref={searchDropdownRef}
                      className="absolute top-full right-0 left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-64 overflow-y-auto"
                      data-testid="search-dropdown"
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
                
                {/* Column 2: Location with Dropdown */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <FaMapMarkerAlt className="absolute right-4 top-1/2 -translate-y-1/2 text-carelink-gray z-10" />
                    <input
                      ref={locationInputRef}
                      type="text"
                      value={locationQuery}
                      onChange={(e) => {
                        setLocationQuery(e.target.value);
                        if (e.target.value !== 'המיקום שלי') {
                          setFilters(prev => ({ ...prev, useMyLocation: false, latitude: null, longitude: null }));
                        }
                        setShowLocationDropdown(true);
                      }}
                      onFocus={() => setShowLocationDropdown(true)}
                      placeholder="עיר או אזור"
                      className="w-full px-4 py-3 pr-12 border-2 border-carelink-teal-pale rounded-xl focus:outline-none focus:border-carelink-teal"
                      data-testid="location-input"
                    />
                    
                    {/* Location Dropdown */}
                    {showLocationDropdown && (
                      <div 
                        ref={locationDropdownRef}
                        className="absolute top-full right-0 left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-64 overflow-y-auto"
                        data-testid="location-dropdown"
                      >
                        {/* GPS Option */}
                        <button
                          type="button"
                          onClick={() => {
                            handleGetLocation();
                          }}
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
                              {regions.map((region) => (
                                <button
                                  key={region.id}
                                  type="button"
                                  onClick={() => {
                                    setLocationQuery(region.name);
                                    setFilters(prev => ({ ...prev, city: region.name, useMyLocation: false, latitude: null, longitude: null }));
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
                        
                        {/* Cities (filtered) */}
                        {locationQuery && filteredCities.length > 0 && (
                          <>
                            <div className="p-3 border-b border-gray-100">
                              <span className="text-xs font-semibold text-carelink-gray">ערים</span>
                            </div>
                            <div className="p-2">
                              {filteredCities.map((city) => (
                                <button
                                  key={city.city_id || city.name}
                                  type="button"
                                  onClick={() => {
                                    setLocationQuery(city.name || city.name_he);
                                    setFilters(prev => ({ ...prev, city: city.name || city.name_he, useMyLocation: false, latitude: null, longitude: null }));
                                    setShowLocationDropdown(false);
                                  }}
                                  className="w-full text-right px-3 py-2.5 hover:bg-carelink-teal-pale/30 rounded-lg transition-colors flex items-center gap-3 text-carelink-navy"
                                >
                                  <FaMapMarkerAlt className="text-carelink-gray text-sm" />
                                  <span>{city.name || city.name_he}</span>
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
                    className="px-4 border-2 border-carelink-teal-pale rounded-xl hover:bg-carelink-teal-pale/30 transition-colors disabled:opacity-50 flex items-center justify-center text-carelink-teal"
                    title="השתמש במיקום שלי"
                    data-testid="gps-btn"
                  >
                    {isLocating ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaCrosshairs className="text-lg" />
                    )}
                  </button>
                  
                  {/* Search Button */}
                  <button
                    type="submit"
                    className="px-6 py-3 bg-carelink-teal text-white rounded-xl font-semibold hover:bg-carelink-teal-medium transition-colors flex items-center gap-2"
                    data-testid="search-btn"
                  >
                    <FaSearch />
                    <span className="hidden sm:inline">חפש</span>
                  </button>
                </div>
              </div>

              {/* Radius selector (appears when using GPS) */}
              {filters.useMyLocation && (
                <div className="flex items-center gap-3 pt-2 border-t border-carelink-teal-pale">
                  <span className="text-sm text-carelink-gray">רדיוס חיפוש:</span>
                  <div className="flex gap-2">
                    {radiusOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleRadiusChange(option.value)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                          filters.radius === option.value
                            ? 'bg-carelink-teal text-white'
                            : 'bg-carelink-teal-pale/50 text-carelink-navy hover:bg-carelink-teal-pale'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Region Tags */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-carelink-gray">אזורים:</span>
                {regions.map((region) => (
                  <button
                    key={region.id}
                    type="button"
                    onClick={() => {
                      setLocationQuery(region.name);
                      setFilters(prev => ({ ...prev, city: region.name, useMyLocation: false, latitude: null, longitude: null }));
                    }}
                    className={`text-sm px-3 py-1 rounded-full transition-colors ${
                      locationQuery === region.name
                        ? 'bg-carelink-teal text-white'
                        : 'bg-carelink-teal-pale/50 text-carelink-navy hover:bg-carelink-teal-pale'
                    }`}
                    data-testid={`region-${region.id}`}
                  >
                    {region.name}
                  </button>
                ))}
              </div>
            </form>

            {/* Action Buttons Row */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-carelink-teal-pale">
              <div className="flex gap-3">
                {/* Filter Toggle (Mobile) */}
                <button
                  onClick={() => setShowFilters(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 bg-carelink-navy text-white rounded-xl font-medium"
                >
                  <FaFilter />
                  סינון מתקדם
                  {activeFiltersCount > 0 && (
                    <span className="bg-carelink-teal px-2 py-0.5 rounded-full text-xs">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border-2 border-carelink-teal-pale rounded-xl focus:outline-none focus:border-carelink-teal bg-white text-sm"
                >
                  <option value="rating">מיון: דירוג</option>
                  <option value="reviews">מיון: ביקורות</option>
                  {filters.useMyLocation && <option value="distance">מיון: מרחק</option>}
                </select>
              </div>

              {/* View Mode */}
              <div className="hidden md:flex border-2 border-carelink-teal-pale rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-carelink-teal text-white' : 'bg-white text-carelink-gray'}`}
                  title="תצוגת רשת"
                >
                  <FaThLarge />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 ${viewMode === 'list' ? 'bg-carelink-teal text-white' : 'bg-white text-carelink-gray'}`}
                  title="תצוגת רשימה"
                >
                  <FaList />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-2 ${viewMode === 'map' ? 'bg-carelink-teal text-white' : 'bg-white text-carelink-gray'}`}
                  title="תצוגת מפה"
                  data-testid="map-view-btn"
                >
                  <FaMap />
                </button>
              </div>
            </div>

            {/* Active Filters Tags */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-carelink-teal-pale">
                {filters.useMyLocation && (
                  <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                    <FaMapMarkerAlt /> המיקום שלי
                    {filters.radius && ` (${filters.radius} ק"מ)`}
                    <button onClick={() => {
                      setFilters(prev => ({ ...prev, useMyLocation: false, latitude: null, longitude: null }));
                      setLocationQuery('');
                    }}><FaTimes className="text-xs" /></button>
                  </span>
                )}
                {filters.city && !filters.useMyLocation && (
                  <span className="inline-flex items-center gap-1 bg-carelink-teal-pale text-carelink-navy px-3 py-1 rounded-full text-sm">
                    <FaMapMarkerAlt /> {filters.city}
                    <button onClick={() => {
                      setFilters(prev => ({ ...prev, city: null }));
                      setLocationQuery('');
                    }}><FaTimes className="text-xs" /></button>
                  </span>
                )}
                {filters.search && (
                  <span className="inline-flex items-center gap-1 bg-carelink-teal-pale text-carelink-navy px-3 py-1 rounded-full text-sm">
                    חיפוש: {filters.search}
                    <button onClick={() => {
                      setFilters(prev => ({ ...prev, search: '' }));
                      setSearchQuery('');
                    }}><FaTimes className="text-xs" /></button>
                  </span>
                )}
                {filters.category && (
                  <span className="inline-flex items-center gap-1 bg-carelink-teal-pale text-carelink-navy px-3 py-1 rounded-full text-sm">
                    קטגוריה: {filters.category}
                    <button onClick={() => setFilters(prev => ({ ...prev, category: null }))}><FaTimes className="text-xs" /></button>
                  </span>
                )}
                {filters.verifiedOnly && (
                  <span className="inline-flex items-center gap-1 bg-carelink-teal text-white px-3 py-1 rounded-full text-sm">
                    מאומתים בלבד
                  </span>
                )}
                {filters.recommendedOnly && (
                  <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm">
                    מומלצים בלבד
                  </span>
                )}
                <button
                  onClick={handleResetFilters}
                  className="text-sm text-carelink-teal hover:underline"
                >
                  נקה הכל
                </button>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex gap-6">
            {/* Filters Sidebar (Desktop) */}
            <div className="hidden lg:block w-80 flex-shrink-0">
              <div className="sticky top-24">
                <AdvancedFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onApply={handleApplyFilters}
                  onReset={handleResetFilters}
                />
              </div>
            </div>

            {/* Results */}
            <div className="flex-1">
              {/* Results Count */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-carelink-gray">
                  נמצאו <span className="font-bold text-carelink-navy">{totalProviders}</span> ספקים
                </p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-carelink-teal border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : providers.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
                  <FaSearch className="text-5xl text-carelink-teal-pale mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-carelink-navy mb-2">לא נמצאו ספקים</h3>
                  <p className="text-carelink-gray mb-4">נסו לשנות את הסינון או מילות החיפוש</p>
                  <button
                    onClick={handleResetFilters}
                    className="text-carelink-teal font-medium hover:underline"
                  >
                    נקה סינון
                  </button>
                </div>
              ) : viewMode === 'map' ? (
                /* Map View */
                <div className="space-y-6">
                  <Suspense fallback={
                    <div className="h-[500px] bg-gray-100 rounded-xl flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-carelink-teal border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  }>
                    <ProvidersMap
                      providers={providers}
                      userLocation={filters.latitude && filters.longitude ? { lat: filters.latitude, lng: filters.longitude } : null}
                      height="500px"
                    />
                  </Suspense>
                  
                  {/* Provider list below map */}
                  <div className="bg-white rounded-xl p-4 shadow-lg">
                    <h3 className="font-bold text-carelink-navy mb-4">ספקים באזור ({providers.length})</h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {providers.map((provider) => (
                        <a
                          key={provider.provider_id}
                          href={`/providers/${provider.provider_id}`}
                          className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition border border-gray-100"
                        >
                          {provider.profile_image ? (
                            <img src={provider.profile_image} alt={provider.name} className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-carelink-teal/20 flex items-center justify-center text-carelink-teal font-bold">
                              {provider.name?.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-carelink-navy truncate">{provider.name}</p>
                            <p className="text-sm text-carelink-gray truncate">{provider.profession} • {provider.location?.city}</p>
                          </div>
                          {provider.distance_km != null && (
                            <div className="text-sm text-blue-600 font-medium whitespace-nowrap">
                              {provider.distance_km} ק״מ
                            </div>
                          )}
                          {provider.rating > 0 && (
                            <div className="text-sm text-amber-500 whitespace-nowrap">
                              ⭐ {provider.rating.toFixed(1)}
                            </div>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={viewMode === 'grid' 
                  ? 'grid md:grid-cols-2 gap-6' 
                  : 'space-y-4'
                }>
                  {providers.map((provider) => (
                    <div key={provider.provider_id} className="relative">
                      {provider.distance_km !== undefined && provider.distance_km !== null && (
                        <div className="absolute -top-2 left-4 z-10 bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <FaMapMarkerAlt />
                          {provider.distance_km} ק"מ
                        </div>
                      )}
                      <ProviderCard provider={provider} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {showFilters && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)}></div>
          <div className="absolute inset-y-0 right-0 w-full max-w-md">
            <AdvancedFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onApply={handleApplyFilters}
              onReset={handleResetFilters}
              showMobile={true}
              onClose={() => setShowFilters(false)}
            />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Providers;
