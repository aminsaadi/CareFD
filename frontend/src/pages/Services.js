import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ServiceCard from '../components/ServiceCard';
import UnifiedAdvancedFilters from '../components/UnifiedAdvancedFilters';
import api from '../utils/api';
import { israeliLocalities } from '../data/israeliLocalities';
import { israeliRegions, healthcareProfessions, popularSearches as searchData, serviceTypes, serviceCategories } from '../data/searchData';
import {
  FaFilter, FaTimes, FaSearch, FaMapMarkerAlt, FaCrosshairs,
  FaSpinner, FaThLarge, FaList, FaBriefcase, FaStar, FaCheckCircle,
  FaAward, FaUserMd, FaGlobe, FaHospital
} from 'react-icons/fa';

const SESSION_STORAGE_KEY = 'carefd_services_filters';
const PAGE_LIMIT = 12;

const loadFiltersFromSession = (searchParams) => {
  const fromUrl = {
    serviceType: searchParams.get('type') || '',
    category: searchParams.get('category') || '',
    priceMin: searchParams.get('priceMin') || '',
    priceMax: searchParams.get('priceMax') || '',
    city: searchParams.get('city') || '',
    region: searchParams.get('region') || '',
    profession: searchParams.get('profession') || '',
    gender: searchParams.get('gender') || '',
    languages: searchParams.get('languages')?.split(',').filter(Boolean) || [],
    healthFunds: searchParams.get('healthFunds')?.split(',').filter(Boolean) || [],
    minRating: searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')) : null,
    verifiedOnly: searchParams.get('verifiedOnly') === 'true',
    recommendedOnly: searchParams.get('recommendedOnly') === 'true'
  };

  // If URL has meaningful params, prefer them over sessionStorage
  const hasUrlParams = Array.from(searchParams.keys()).some(k => k !== 'search');
  if (hasUrlParams) {
    return fromUrl;
  }

  try {
    const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    // ignore parse errors
  }
  return fromUrl;
};

const SkeletonCard = () => (
  <div className="bg-white rounded-xl shadow p-6 animate-pulse">
    <div className="h-40 bg-gray-200 rounded-lg mb-4" />
    <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
    <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
    <div className="flex gap-2">
      <div className="h-8 bg-gray-200 rounded-full w-16" />
      <div className="h-8 bg-gray-200 rounded-full w-20" />
    </div>
  </div>
);

const Services = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('popular');

  // Search states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [locationQuery, setLocationQuery] = useState(searchParams.get('city') || '');
  const [professionQuery, setProfessionQuery] = useState(searchParams.get('profession') || '');
  const [isLocating, setIsLocating] = useState(false);
  const [apiProfessions, setApiProfessions] = useState([]);

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
  const abortControllerRef = useRef(null);

  const [filters, setFilters] = useState(() => loadFiltersFromSession(searchParams));

  // Build query params from current filter state
  const buildQueryParams = useCallback((skip = 0) => {
    const params = {};
    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (filters.serviceType) params.service_type = filters.serviceType;
    if (filters.category) params.service_category = filters.category;
    if (filters.priceMin) params.price_min = filters.priceMin;
    if (filters.priceMax) params.price_max = filters.priceMax;
    if (filters.city) params.city = filters.city;
    if (filters.region) params.region = filters.region;
    if (filters.profession) params.profession = filters.profession;
    if (filters.gender && filters.gender !== 'any') params.gender = filters.gender;
    if (filters.languages?.length > 0) params.languages = filters.languages.join(',');
    if (filters.healthFunds?.length > 0) params.health_funds = filters.healthFunds.join(',');
    if (filters.minRating) params.min_rating = filters.minRating;
    if (filters.verifiedOnly) params.verified_only = true;
    if (filters.recommendedOnly) params.recommended_only = true;
    if (sortBy && sortBy !== 'popular') params.sort_by = sortBy;
    else params.sort_by = 'popular';
    params.skip = skip;
    params.limit = PAGE_LIMIT;
    return params;
  }, [searchQuery, filters, sortBy]);

  // Fetch services from server with current filters
  const fetchServices = useCallback(async (append = false) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const skip = append ? services.length : 0;
      const params = buildQueryParams(skip);
      const response = await api.get('/services', { params, signal: controller.signal });
      const apiServices = response.data.services || [];

      if (append) {
        setServices(prev => [...prev, ...apiServices]);
      } else {
        setServices(apiServices);
      }
      setHasMore(apiServices.length === PAGE_LIMIT);
    } catch (error) {
      if (error.name === 'AbortError' || error.name === 'CanceledError') return;
      console.error('Failed to fetch services:', error);
      if (!append) {
        setServices([]);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [buildQueryParams, services.length]);

  // Initial fetch
  useEffect(() => {
    fetchServices(false);
    // Fetch professions from API
    api.get('/professions').then(res => {
      const profs = res.data.professions || [];
      // Flatten: main professions + their sub_professions as individual entries
      const flatList = [];
      profs.forEach(prof => {
        flatList.push({
          id: prof.profession_id,
          name: prof.name,
          searchTerms: prof.specializations || []
        });
        (prof.sub_professions || []).forEach(sub => {
          flatList.push({
            id: sub.sub_profession_id,
            name: sub.name,
            searchTerms: [sub.name, prof.name]
          });
        });
      });
      if (flatList.length > 0) {
        setApiProfessions(flatList);
      }
    }).catch(() => {
      console.warn('Failed to load professions, using defaults');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when filters or sortBy change
  useEffect(() => {
    fetchServices(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortBy]);

  // Debounced search: re-fetch 400ms after searchQuery changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchServices(false);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Save filters to sessionStorage on change
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(filters));
    } catch (e) {
      // ignore storage errors
    }
  }, [filters]);

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

  const handleSearch = (e) => {
    e.preventDefault();

    const newFilters = {
      ...filters,
      city: locationQuery && locationQuery !== 'המיקום שלי' ? locationQuery : filters.city,
      profession: professionQuery || filters.profession
    };
    setFilters(newFilters);
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
          setFilters({ ...filters, city: cityName, region: '' });
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
    setFilters({
      serviceType: '', category: '', priceMin: '', priceMax: '',
      city: '', region: '', profession: '', gender: '',
      languages: [], healthFunds: [],
      minRating: null, verifiedOnly: false, recommendedOnly: false
    });
    setSearchQuery('');
    setLocationQuery('');
    setProfessionQuery('');
    setSearchParams({});
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  };

  const handleLoadMore = () => {
    fetchServices(true);
  };

  const handleCategoryClick = (categoryId) => {
    setFilters(prev => ({ ...prev, category: categoryId }));
  };

  // Filter data for dropdowns
  const filteredSearches = searchQuery.trim()
    ? searchData.services.filter(s => s.includes(searchQuery))
    : searchData.services;

  const filteredCities = locationQuery.trim()
    ? israeliLocalities.filter(c => c.name?.includes(locationQuery)).slice(0, 10)
    : [];

  const professionsList = apiProfessions.length > 0 ? apiProfessions : healthcareProfessions;
  const filteredProfessions = professionQuery.trim()
    ? professionsList.filter(p =>
        p.name.includes(professionQuery) ||
        (p.searchTerms || []).some(t => t.includes(professionQuery))
      )
    : professionsList;

  const activeFiltersCount = [
    filters.serviceType, filters.category, filters.priceMin,
    filters.priceMax, filters.city, filters.region, filters.profession,
    filters.gender, filters.minRating, filters.verifiedOnly, filters.recommendedOnly,
    filters.languages?.length > 0, filters.healthFunds?.length > 0
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-carefd-teal-pale flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-carefd-navy font-heading mb-2" data-testid="services-title">
            {t('services')}
          </h1>
          <p className="text-carefd-gray">מצאו את השירות המושלם עבורכם</p>
        </div>

        {/* Search Box */}
        <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6" role="search" aria-label="חיפוש שירותים">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Search Input */}
            <div className="relative">
              <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-carefd-gray z-10" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearchDropdown(true)}
                placeholder="חפש שירות, טיפול..."
                className="w-full px-5 py-3 pr-12 border border-gray-200 rounded-xl focus:border-carefd-teal focus:ring-2 focus:ring-carefd-teal/20 outline-none transition-all"
                data-testid="services-search-input"
                aria-label="חיפוש שירות או טיפול"
              />

              {showSearchDropdown && (
                <div
                  ref={searchDropdownRef}
                  className="absolute top-full right-0 left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-64 overflow-y-auto"
                  role="listbox"
                  aria-label="הצעות חיפוש"
                >
                  <div className="p-3 border-b border-gray-100">
                    <span className="text-xs font-semibold text-carefd-gray">חיפושים נפוצים</span>
                  </div>
                  <div className="p-2">
                    {filteredSearches.map((search, index) => (
                      <button
                        key={index}
                        type="button"
                        role="option"
                        onClick={() => {
                          setSearchQuery(search);
                          setShowSearchDropdown(false);
                        }}
                        className="w-full text-right px-3 py-2.5 hover:bg-carefd-teal-pale/30 rounded-lg transition-colors flex items-center gap-3 text-carefd-navy"
                      >
                        <FaSearch className="text-carefd-gray text-sm" />
                        <span>{search}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profession Input */}
            <div className="relative">
              <FaBriefcase className="absolute right-4 top-1/2 -translate-y-1/2 text-carefd-gray z-10" />
              <input
                ref={professionInputRef}
                type="text"
                value={professionQuery}
                onChange={(e) => setProfessionQuery(e.target.value)}
                onFocus={() => setShowProfessionDropdown(true)}
                placeholder="מקצוע (אחות, רופא...)"
                className="w-full px-5 py-3 pr-12 border border-gray-200 rounded-xl focus:border-carefd-teal focus:ring-2 focus:ring-carefd-teal/20 outline-none transition-all"
                data-testid="services-profession-input"
                aria-label="חיפוש לפי מקצוע"
              />

              {showProfessionDropdown && (
                <div
                  ref={professionDropdownRef}
                  className="absolute top-full right-0 left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-64 overflow-y-auto"
                  role="listbox"
                  aria-label="רשימת מקצועות"
                >
                  <div className="p-3 border-b border-gray-100">
                    <span className="text-xs font-semibold text-carefd-gray">מקצועות</span>
                  </div>
                  <div className="p-2">
                    {filteredProfessions.slice(0, 10).map((profession) => (
                      <button
                        key={profession.id}
                        type="button"
                        role="option"
                        onClick={() => {
                          setProfessionQuery(profession.name);
                          setShowProfessionDropdown(false);
                        }}
                        className="w-full text-right px-3 py-2.5 hover:bg-carefd-teal-pale/30 rounded-lg transition-colors flex items-center gap-3 text-carefd-navy"
                      >
                        <FaBriefcase className="text-carefd-gray text-sm" />
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
                <FaMapMarkerAlt className="absolute right-4 top-1/2 -translate-y-1/2 text-carefd-gray z-10" />
                <input
                  ref={locationInputRef}
                  type="text"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  onFocus={() => setShowLocationDropdown(true)}
                  placeholder="עיר או אזור"
                  className="w-full px-5 py-3 pr-12 border border-gray-200 rounded-xl focus:border-carefd-teal focus:ring-2 focus:ring-carefd-teal/20 outline-none transition-all"
                  data-testid="services-location-input"
                  aria-label="חיפוש לפי עיר או אזור"
                />

                {showLocationDropdown && (
                  <div
                    ref={locationDropdownRef}
                    className="absolute top-full right-0 left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-64 overflow-y-auto"
                    role="listbox"
                    aria-label="רשימת מיקומים"
                  >
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      className="w-full text-right px-4 py-3 hover:bg-carefd-teal-pale/30 transition-colors flex items-center gap-3 text-carefd-teal border-b border-gray-100"
                    >
                      <FaCrosshairs className="text-lg" />
                      <span className="font-medium">השתמש במיקום שלי</span>
                      {isLocating && <FaSpinner className="animate-spin mr-auto" />}
                    </button>

                    {!locationQuery && (
                      <>
                        <div className="p-3 border-b border-gray-100">
                          <span className="text-xs font-semibold text-carefd-gray">אזורים</span>
                        </div>
                        <div className="p-2">
                          {israeliRegions.map((region) => (
                            <button
                              key={region.id}
                              type="button"
                              role="option"
                              onClick={() => {
                                setLocationQuery(region.name);
                                setShowLocationDropdown(false);
                              }}
                              className="w-full text-right px-3 py-2.5 hover:bg-carefd-teal-pale/30 rounded-lg transition-colors flex items-center gap-3 text-carefd-navy"
                            >
                              <FaMapMarkerAlt className="text-carefd-gray text-sm" />
                              <span>{region.name}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {locationQuery && filteredCities.length > 0 && (
                      <>
                        <div className="p-3 border-b border-gray-100">
                          <span className="text-xs font-semibold text-carefd-gray">ערים</span>
                        </div>
                        <div className="p-2">
                          {filteredCities.map((city) => (
                            <button
                              key={city.name}
                              type="button"
                              role="option"
                              onClick={() => {
                                setLocationQuery(city.name);
                                setShowLocationDropdown(false);
                              }}
                              className="w-full text-right px-3 py-2.5 hover:bg-carefd-teal-pale/30 rounded-lg transition-colors flex items-center gap-3 text-carefd-navy"
                            >
                              <FaMapMarkerAlt className="text-carefd-gray text-sm" />
                              <span>{city.name}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isLocating}
                className="bg-carefd-teal-pale text-carefd-teal px-4 rounded-xl hover:bg-carefd-teal hover:text-white transition-all disabled:opacity-50 flex items-center justify-center"
                title="השתמש במיקום שלי"
                aria-label="איתור מיקום נוכחי"
              >
                {isLocating ? <FaSpinner className="animate-spin" /> : <FaCrosshairs className="text-lg" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-carefd-teal text-white px-8 py-3 rounded-xl font-semibold hover:bg-carefd-teal-medium transition-all flex items-center justify-center gap-2"
            data-testid="services-search-btn"
            aria-label="חפש שירותים"
          >
            <FaSearch />
            <span>חפש שירותים</span>
          </button>
        </form>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Advanced Filters Sidebar - Using Unified Component */}
          <div className={`lg:w-80 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="sticky top-4">
              <UnifiedAdvancedFilters
                filters={filters}
                onFilterChange={setFilters}
                onReset={resetFilters}
                showMobile={showFilters}
                onClose={() => setShowFilters(false)}
                resultsCount={services.length}
                pageType="services"
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm"
                aria-label="פתח סינון מתקדם"
                aria-expanded={showFilters}
              >
                <FaFilter className="text-carefd-teal" />
                סינון מתקדם
                {activeFiltersCount > 0 && (
                  <span className="bg-carefd-teal text-white text-xs px-2 py-0.5 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <p className="text-carefd-gray">
                נמצאו <span className="font-bold text-carefd-navy">{services.length}</span> שירותים
              </p>

              <div className="flex items-center gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:border-carefd-teal outline-none text-sm"
                  aria-label="מיון תוצאות"
                >
                  <option value="popular">פופולריים</option>
                  <option value="rating">דירוג</option>
                  <option value="price_low">מחיר: נמוך לגבוה</option>
                  <option value="price_high">מחיר: גבוה לנמוך</option>
                  <option value="newest">חדשים</option>
                </select>

                <div className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-lg p-1" role="group" aria-label="מצב תצוגה">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}
                    aria-label="תצוגת רשת"
                    aria-pressed={viewMode === 'grid'}
                  >
                    <FaThLarge className="text-carefd-gray" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow' : ''}`}
                    aria-label="תצוגת רשימה"
                    aria-pressed={viewMode === 'list'}
                  >
                    <FaList className="text-carefd-gray" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters Tags */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-4" role="list" aria-label="מסננים פעילים">
                {filters.city && (
                  <span className="inline-flex items-center gap-1 bg-carefd-teal-pale text-carefd-teal px-3 py-1 rounded-full text-sm" role="listitem">
                    <FaMapMarkerAlt className="text-xs" />
                    {filters.city}
                    <button onClick={() => setFilters({...filters, city: ''})} aria-label={`הסר סינון עיר: ${filters.city}`}>
                      <FaTimes className="text-xs" />
                    </button>
                  </span>
                )}
                {filters.region && (
                  <span className="inline-flex items-center gap-1 bg-carefd-teal-pale text-carefd-teal px-3 py-1 rounded-full text-sm" role="listitem">
                    <FaMapMarkerAlt className="text-xs" />
                    {filters.region}
                    <button onClick={() => setFilters({...filters, region: ''})} aria-label={`הסר סינון אזור: ${filters.region}`}>
                      <FaTimes className="text-xs" />
                    </button>
                  </span>
                )}
                {filters.profession && (
                  <span className="inline-flex items-center gap-1 bg-carefd-teal-pale text-carefd-teal px-3 py-1 rounded-full text-sm" role="listitem">
                    <FaUserMd className="text-xs" />
                    {filters.profession}
                    <button onClick={() => setFilters({...filters, profession: ''})} aria-label={`הסר סינון מקצוע: ${filters.profession}`}>
                      <FaTimes className="text-xs" />
                    </button>
                  </span>
                )}
                {filters.category && (
                  <span className="inline-flex items-center gap-1 bg-carefd-teal-pale text-carefd-teal px-3 py-1 rounded-full text-sm" role="listitem">
                    {serviceCategories.find(c => c.id === filters.category)?.name}
                    <button onClick={() => setFilters({...filters, category: ''})} aria-label="הסר סינון קטגוריה">
                      <FaTimes className="text-xs" />
                    </button>
                  </span>
                )}
                {filters.serviceType && (
                  <span className="inline-flex items-center gap-1 bg-carefd-teal-pale text-carefd-teal px-3 py-1 rounded-full text-sm" role="listitem">
                    {serviceTypes.find(t => t.id === filters.serviceType)?.name}
                    <button onClick={() => setFilters({...filters, serviceType: ''})} aria-label="הסר סינון סוג שירות">
                      <FaTimes className="text-xs" />
                    </button>
                  </span>
                )}
                {filters.gender && filters.gender !== 'any' && (
                  <span className="inline-flex items-center gap-1 bg-carefd-teal-pale text-carefd-teal px-3 py-1 rounded-full text-sm" role="listitem">
                    {filters.gender === 'male' ? 'זכר' : 'נקבה'}
                    <button onClick={() => setFilters({...filters, gender: ''})} aria-label="הסר סינון מגדר">
                      <FaTimes className="text-xs" />
                    </button>
                  </span>
                )}
                {filters.languages?.length > 0 && (
                  <span className="inline-flex items-center gap-1 bg-carefd-teal-pale text-carefd-teal px-3 py-1 rounded-full text-sm" role="listitem">
                    <FaGlobe className="text-xs" />
                    {filters.languages.length} שפות
                    <button onClick={() => setFilters({...filters, languages: []})} aria-label="הסר סינון שפות">
                      <FaTimes className="text-xs" />
                    </button>
                  </span>
                )}
                {filters.healthFunds?.length > 0 && (
                  <span className="inline-flex items-center gap-1 bg-carefd-teal-pale text-carefd-teal px-3 py-1 rounded-full text-sm" role="listitem">
                    <FaHospital className="text-xs" />
                    {filters.healthFunds.length} קופות
                    <button onClick={() => setFilters({...filters, healthFunds: []})} aria-label="הסר סינון קופות חולים">
                      <FaTimes className="text-xs" />
                    </button>
                  </span>
                )}
                {filters.minRating && (
                  <span className="inline-flex items-center gap-1 bg-carefd-teal-pale text-carefd-teal px-3 py-1 rounded-full text-sm" role="listitem">
                    <FaStar className="text-xs" />
                    {filters.minRating}+ כוכבים
                    <button onClick={() => setFilters({...filters, minRating: null})} aria-label="הסר סינון דירוג">
                      <FaTimes className="text-xs" />
                    </button>
                  </span>
                )}
                {filters.verifiedOnly && (
                  <span className="inline-flex items-center gap-1 bg-carefd-teal-pale text-carefd-teal px-3 py-1 rounded-full text-sm" role="listitem">
                    <FaCheckCircle className="text-xs" />
                    מאומתים
                    <button onClick={() => setFilters({...filters, verifiedOnly: false})} aria-label="הסר סינון מאומתים בלבד">
                      <FaTimes className="text-xs" />
                    </button>
                  </span>
                )}
                {filters.recommendedOnly && (
                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-sm" role="listitem">
                    <FaAward className="text-xs" />
                    מומלצים
                    <button onClick={() => setFilters({...filters, recommendedOnly: false})} aria-label="הסר סינון מומלצים בלבד">
                      <FaTimes className="text-xs" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Results */}
            {loading ? (
              <div data-testid="loading-indicator" aria-label="טוען שירותים" role="status">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
                <p className="sr-only">טוען שירותים...</p>
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                <FaSearch className="mx-auto text-5xl text-gray-300 mb-4" />
                <p className="text-xl text-carefd-navy mb-2">לא נמצאו שירותים</p>
                <p className="text-carefd-gray mb-6">נסו את ההצעות הבאות:</p>
                <ul className="text-carefd-gray text-sm mb-6 space-y-2">
                  <li>נסו מילות חיפוש אחרות</li>
                  <li>הרחיבו את טווח המיקום</li>
                  <li>הפחיתו את מספר הסינונים הפעילים</li>
                </ul>
                <div className="mb-6">
                  <p className="text-sm font-semibold text-carefd-navy mb-3">קטגוריות פופולריות:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {serviceCategories.slice(0, 6).map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryClick(cat.id)}
                        className="px-4 py-2 bg-carefd-teal-pale text-carefd-teal rounded-full text-sm hover:bg-carefd-teal hover:text-white transition-all"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={resetFilters}
                  className="px-6 py-2 bg-carefd-teal text-white rounded-lg font-medium hover:bg-carefd-teal-medium transition"
                >
                  נקה סינון
                </button>
              </div>
            ) : (
              <>
                <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 gap-6' : 'space-y-4'}>
                  {services.map((service) => (
                    <ServiceCard key={service.service_id} service={service} viewMode={viewMode} />
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="text-center mt-8">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="px-8 py-3 bg-white border-2 border-carefd-teal text-carefd-teal rounded-xl font-semibold hover:bg-carefd-teal hover:text-white transition-all disabled:opacity-50 inline-flex items-center gap-2"
                      aria-label="טען עוד שירותים"
                    >
                      {loadingMore ? (
                        <>
                          <FaSpinner className="animate-spin" />
                          <span>טוען...</span>
                        </>
                      ) : (
                        <span>טען עוד שירותים</span>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Services;
