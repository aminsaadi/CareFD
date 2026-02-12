import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProviderCard from '../components/ProviderCard';
import AdvancedFilters from '../components/AdvancedFilters';
import api from '../utils/api';
import { dummyProviders } from '../data/dummyData';
import { 
  FaSearch, FaFilter, FaTimes, FaSortAmountDown, FaMapMarkerAlt,
  FaThLarge, FaList, FaCrosshairs, FaSpinner
} from 'react-icons/fa';

const Providers = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [sortBy, setSortBy] = useState('rating');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [locationQuery, setLocationQuery] = useState(searchParams.get('city') || '');
  const [isLocating, setIsLocating] = useState(false);
  
  // Israeli regions for quick selection
  const regions = [
    { id: 'north', name: 'צפון', cities: ['חיפה', 'נהריה', 'עכו', 'כרמיאל', 'צפת'] },
    { id: 'center', name: 'מרכז', cities: ['תל אביב', 'רמת גן', 'פתח תקווה', 'הרצליה', 'רעננה'] },
    { id: 'south', name: 'דרום', cities: ['באר שבע', 'אשדוד', 'אשקלון', 'אילת'] },
    { id: 'jerusalem', name: 'ירושלים', cities: ['ירושלים', 'בית שמש', 'מודיעין'] }
  ];

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
  }, []);

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
      
      // Use dummy data if no providers from API
      if (apiProviders.length === 0) {
        apiProviders = filterDummyProviders(dummyProviders);
      }
      
      setProviders(apiProviders);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      // Fallback to dummy data
      setProviders(filterDummyProviders(dummyProviders));
    } finally {
      setLoading(false);
    }
  };

  const filterDummyProviders = (providers) => {
    let filtered = [...providers];
    
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.business_name?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower) ||
        p.specializations?.some(s => s.toLowerCase().includes(searchLower))
      );
    }
    
    // City filter
    if (filters.city) {
      filtered = filtered.filter(p => p.location?.city === filters.city);
    }
    
    // Category filter
    if (filters.category) {
      const categoryMapping = {
        nursing: ['סיעוד', 'סיעוד ביתי', 'טיפול בקשישים'],
        physiotherapy: ['פיזיותרפיה', 'שיקום', 'שיקום לאחר ניתוח'],
        doctor: ['רפואת משפחה', 'רפואה פנימית'],
        eldercare: ['גריאטריה', 'טיפול בקשישים', 'סיעוד'],
        therapy: ['ריפוי בעיסוק', 'ריפוי בדיבור'],
        alternative: ['רפואה משלימה', 'דיקור', 'עיסוי רפואי']
      };
      const specs = categoryMapping[filters.category] || [];
      filtered = filtered.filter(p => 
        p.specializations?.some(s => specs.includes(s))
      );
    }
    
    // Service type filter
    if (filters.serviceType) {
      filtered = filtered.filter(p => 
        p.service_types?.includes(filters.serviceType)
      );
    }
    
    // Provider type filter
    if (filters.providerType) {
      filtered = filtered.filter(p => p.provider_type === filters.providerType);
    }
    
    // Rating filter
    if (filters.minRating) {
      filtered = filtered.filter(p => (p.rating || 0) >= filters.minRating);
    }
    
    // Experience filter
    if (filters.minExperience) {
      filtered = filtered.filter(p => (p.years_experience || 0) >= filters.minExperience);
    }
    
    // Verified filter
    if (filters.verifiedOnly) {
      filtered = filtered.filter(p => p.is_verified);
    }
    
    // Recommended filter
    if (filters.recommendedOnly) {
      filtered = filtered.filter(p => p.is_recommended);
    }
    
    // Location filter
    if (filters.useMyLocation && filters.latitude && filters.longitude) {
      filtered = filtered.map(p => {
        if (p.location?.latitude && p.location?.longitude) {
          const distance = calculateDistance(
            filters.latitude, filters.longitude,
            p.location.latitude, p.location.longitude
          );
          return { ...p, distance_km: distance };
        }
        return { ...p, distance_km: null };
      });
      
      if (filters.radius) {
        filtered = filtered.filter(p => 
          p.distance_km !== null && p.distance_km <= filters.radius
        );
      }
    }
    
    // Sort
    if (sortBy === 'rating') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'reviews') {
      filtered.sort((a, b) => (b.total_reviews || 0) - (a.total_reviews || 0));
    } else if (sortBy === 'distance' && filters.useMyLocation) {
      filtered.sort((a, b) => (a.distance_km || Infinity) - (b.distance_km || Infinity));
    }
    
    return filtered;
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
    setFilters(prev => ({ ...prev, search: searchQuery }));
    
    // Update URL
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery) {
      newParams.set('search', searchQuery);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
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
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <FaSearch className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 text-carelink-gray" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="חפש ספקים לפי שם, התמחות..."
                    className="w-full px-4 py-3 pr-12 rtl:pr-4 rtl:pl-12 border-2 border-carelink-teal-pale rounded-xl focus:outline-none focus:border-carelink-teal"
                    data-testid="search-input"
                  />
                </div>
              </form>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {/* Filter Toggle (Mobile) */}
                <button
                  onClick={() => setShowFilters(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-3 bg-carelink-navy text-white rounded-xl font-medium"
                >
                  <FaFilter />
                  סינון
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
                  className="px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:outline-none focus:border-carelink-teal bg-white"
                >
                  <option value="rating">מיון: דירוג</option>
                  <option value="reviews">מיון: ביקורות</option>
                  {filters.useMyLocation && <option value="distance">מיון: מרחק</option>}
                </select>

                {/* View Mode */}
                <div className="hidden md:flex border-2 border-carelink-teal-pale rounded-xl overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-3 ${viewMode === 'grid' ? 'bg-carelink-teal text-white' : 'bg-white text-carelink-gray'}`}
                  >
                    <FaThLarge />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-3 ${viewMode === 'list' ? 'bg-carelink-teal text-white' : 'bg-white text-carelink-gray'}`}
                  >
                    <FaList />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters Tags */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-carelink-teal-pale">
                {filters.useMyLocation && (
                  <span className="inline-flex items-center gap-1 bg-carelink-teal-pale text-carelink-navy px-3 py-1 rounded-full text-sm">
                    <FaMapMarkerAlt /> המיקום שלי
                    {filters.radius && ` (${filters.radius} ק"מ)`}
                  </span>
                )}
                {filters.city && (
                  <span className="inline-flex items-center gap-1 bg-carelink-teal-pale text-carelink-navy px-3 py-1 rounded-full text-sm">
                    עיר: {filters.city}
                    <button onClick={() => setFilters(prev => ({ ...prev, city: null }))}><FaTimes className="text-xs" /></button>
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
                  נמצאו <span className="font-bold text-carelink-navy">{providers.length}</span> ספקים
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
