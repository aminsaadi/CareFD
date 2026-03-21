import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProviderCard from '../components/ProviderCard';
import ServiceCard from '../components/ServiceCard';
import api from '../utils/api';
import { israeliLocalities } from '../data/israeliLocalities';
import { israeliRegions, healthcareProfessions, popularSearches as searchData } from '../data/searchData';
import { 
  FaUserNurse, FaWalking, FaUserMd, FaHeart, 
  FaHandHoldingHeart, FaSpa, FaStar, FaSearch,
  FaUsers, FaMapMarkerAlt, FaCheckCircle, FaArrowLeft,
  FaCrosshairs, FaSpinner, FaStethoscope, FaBaby,
  FaBrain, FaHeartbeat, FaHome, FaHospital
} from 'react-icons/fa';

// Custom hook for scroll animation
const useScrollAnimation = () => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
};

// Animated Section Component
const AnimatedSection = ({ children, className = '', delay = 0 }) => {
  const [ref, isVisible] = useScrollAnimation();
  
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.6s ease-out ${delay}ms, transform 0.6s ease-out ${delay}ms`
      }}
    >
      {children}
    </div>
  );
};

// Professions data
const professions = [
  { id: 'nurse', name: 'אחות/אח', icon: FaUserNurse, color: 'bg-pink-50 text-pink-600 shadow-soft hover:shadow-soft-md' },
  { id: 'doctor', name: 'רופא/ה', icon: FaStethoscope, color: 'bg-blue-50 text-blue-600 shadow-soft hover:shadow-soft-md' },
  { id: 'physiotherapist', name: 'פיזיותרפיסט/ית', icon: FaWalking, color: 'bg-green-50 text-green-600 shadow-soft hover:shadow-soft-md' },
  { id: 'caregiver', name: 'מטפל/ת', icon: FaHeart, color: 'bg-red-50 text-red-600 shadow-soft hover:shadow-soft-md' },
  { id: 'psychologist', name: 'פסיכולוג/ית', icon: FaBrain, color: 'bg-purple-50 text-purple-600 shadow-soft hover:shadow-soft-md' },
  { id: 'dietitian', name: 'דיאטן/ית', icon: FaHeartbeat, color: 'bg-orange-50 text-orange-600 shadow-soft hover:shadow-soft-md' },
];

// Categories data
const categories = [
  { id: 'nursing', name: 'סיעוד', icon: FaUserNurse, description: 'טיפול סיעודי מקצועי בבית', color: 'from-pink-500 to-rose-500' },
  { id: 'physiotherapy', name: 'פיזיותרפיה', icon: FaWalking, description: 'שיקום ופיזיותרפיה', color: 'from-green-500 to-emerald-500' },
  { id: 'doctor', name: 'רופא בבית', icon: FaUserMd, description: 'ביקור רופא עד הבית', color: 'from-blue-500 to-cyan-500' },
  { id: 'eldercare', name: 'טיפול בקשישים', icon: FaHeart, description: 'ליווי וטיפול בגיל השלישי', color: 'from-red-500 to-pink-500' },
  { id: 'therapy', name: 'טיפול רגשי', icon: FaHandHoldingHeart, description: 'פסיכולוגיה וייעוץ', color: 'from-purple-500 to-violet-500' },
  { id: 'baby', name: 'טיפול בתינוקות', icon: FaBaby, description: 'מטפלות ושמרטפות', color: 'from-amber-500 to-orange-500' },
];

// Testimonials
const testimonials = [
  { id: 1, name: 'שרה לוי', role: 'בת של מטופלת', content: 'מצאנו מטפלת סיעודית מדהימה לאמא שלי תוך יום אחד. השירות מקצועי ואמין!', rating: 5, avatar: 'ש' },
  { id: 2, name: 'דוד כהן', role: 'מטופל', content: 'אחרי ניתוח ברך, הפיזיותרפיסט שמצאתי כאן עזר לי לחזור ללכת תוך חודשיים.', rating: 5, avatar: 'ד' },
  { id: 3, name: 'רחל אברהם', role: 'ספקית שירות', content: 'הפלטפורמה עזרה לי להגיע ללקוחות חדשים ולפתח את העסק שלי בצורה משמעותית.', rating: 5, avatar: 'ר' },
];

// Popular searches data - use from searchData
const popularSearches = searchData;

const Landing = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedRadius, setSelectedRadius] = useState('');
  const [searchTab, setSearchTab] = useState('providers'); // 'providers' or 'services'
  
  // Dropdown states
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [cities, setCities] = useState([]);
  const searchInputRef = useRef(null);
  const locationInputRef = useRef(null);
  const searchDropdownRef = useRef(null);
  const locationDropdownRef = useRef(null);
  
  // Real data from API
  const [featuredProviders, setFeaturedProviders] = useState([]);
  const [popularServices, setPopularServices] = useState([]);
  const [statistics, setStatistics] = useState({
    providers: 0,
    services: 0,
    happyClients: 0,
    cities: 0
  });
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
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

  const fetchHomeData = async () => {
    try {
      const providersRes = await api.get('/providers?recommended=true&limit=6');
      setFeaturedProviders(providersRes.data.providers || []);

      const servicesRes = await api.get('/services?limit=6');
      setPopularServices(servicesRes.data.services || []);

      const regionsRes = await api.get('/regions');
      setRegions(regionsRes.data.regions || []);
      
      // Use comprehensive localities list
      setCities(israeliLocalities);

      try {
        const statsRes = await api.get('/stats/public');
        setStatistics({
          providers: statsRes.data.total_providers || 50,
          services: statsRes.data.total_services || 100,
          happyClients: statsRes.data.total_users || 500,
          cities: statsRes.data.total_cities || 20
        });
      } catch {
        setStatistics({ providers: 50, services: 100, happyClients: 500, cities: 20 });
      }
    } catch (error) {
      console.error('Failed to fetch home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const defaultRegions = israeliRegions.slice(0, 6);

  const displayRegions = regions.length > 0 ? regions.slice(0, 6) : defaultRegions;

  const radiusOptions = [
    { value: '5', label: '5 ק"מ' },
    { value: '10', label: '10 ק"מ' },
    { value: '25', label: '25 ק"מ' },
    { value: '50', label: '50 ק"מ' }
  ];

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
        
        setUserLocation({
          latitude: lat,
          longitude: lng
        });
        
        // Reverse geocoding to get city name
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=he`
          );
          const data = await response.json();
          const cityName = data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || 'המיקום שלי';
          setLocationQuery(cityName);
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          setLocationQuery('המיקום שלי');
        }
        
        setIsLocating(false);
      },
      (error) => {
        console.error('Location error:', error);
        alert('לא הצלחנו לאתר את המיקום שלך');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };
  
  // Filter cities based on input
  const filteredCities = cities.filter(city => 
    city.name?.includes(locationQuery)
  ).slice(0, 10);
  
  // Get current popular searches based on tab
  const currentPopularSearches = popularSearches[searchTab] || popularSearches.providers;
  
  // Filter popular searches based on input
  const filteredSearches = searchQuery.trim() 
    ? currentPopularSearches.filter(s => s.includes(searchQuery))
    : currentPopularSearches;

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    }
    if (locationQuery.trim() && locationQuery !== 'המיקום שלי') {
      params.set('city', locationQuery.trim());
    }
    if (userLocation && locationQuery === 'המיקום שלי') {
      params.set('latitude', userLocation.latitude);
      params.set('longitude', userLocation.longitude);
      if (selectedRadius) {
        params.set('radius_km', selectedRadius);
      }
    }

    const queryString = params.toString();
    // Navigate based on selected tab
    const targetPage = searchTab === 'services' ? '/services' : '/providers';
    navigate(`${targetPage}${queryString ? `?${queryString}` : ''}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* ==================== HERO SECTION ==================== */}
      <section className="relative bg-gradient-to-br from-carefd-navy via-carefd-slate to-carefd-teal overflow-hidden" data-testid="hero-section">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-carefd-teal rounded-full translate-x-1/3 translate-y-1/3"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 opacity-5"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-white">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <span className="w-2 h-2 bg-carefd-teal rounded-full animate-pulse"></span>
                <span className="text-sm text-carefd-teal-pale">הפלטפורמה המובילה לשירותי בריאות בישראל</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 font-heading leading-tight" data-testid="hero-title">
                מצא את שירותי
                <br />
                <span className="text-carefd-teal-light">הבריאות הטובים</span>
                <br />
                ביותר בישראל
              </h1>
              
              <p className="text-lg lg:text-xl mb-8 text-carefd-teal-pale max-w-xl leading-relaxed" data-testid="hero-subtitle">
                פלטפורמה משולבת המחברת בין מטופלים לספקי שירותי בריאות איכותיים
              </p>

              {/* ==================== SEARCH BOX ==================== */}
              <form onSubmit={handleSearch} className="mb-6" data-testid="hero-search-form">
                <div className="glass-card p-4 sm:p-5 rounded-2xl shadow-soft-xl">
                  {/* Search Tabs */}
                  <div className="flex mb-4 bg-white/10 rounded-xl p-1" data-testid="search-tabs">
                    <button
                      type="button"
                      onClick={() => setSearchTab('providers')}
                      className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                        searchTab === 'providers'
                          ? 'bg-white text-carefd-teal shadow-soft'
                          : 'text-white hover:bg-white/10'
                      }`}
                      data-testid="search-tab-providers"
                    >
                      <FaUserMd className="text-lg" />
                      <span>נותני שירות</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchTab('services')}
                      className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                        searchTab === 'services'
                          ? 'bg-white text-carefd-teal shadow-soft'
                          : 'text-white hover:bg-white/10'
                      }`}
                      data-testid="search-tab-services"
                    >
                      <FaHospital className="text-lg" />
                      <span>שירותים</span>
                    </button>
                  </div>
                  
                  {/* Search Inputs */}
                  <div className="grid sm:grid-cols-2 gap-3 mb-3">
                    {/* Search Input with Dropdown */}
                    <div className="relative">
                      <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-carefd-gray z-10" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setShowSearchDropdown(true)}
                        placeholder={searchTab === 'providers' ? 'מקצוע, התמחות, שם ספק...' : 'סוג שירות, טיפול, התמחות...'}
                        className="w-full input-soft text-carefd-navy px-5 py-3.5 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-carefd-teal placeholder-carefd-gray transition-all"
                        data-testid="hero-search-input"
                      />
                      
                      {/* Search Dropdown */}
                      {showSearchDropdown && (
                        <div 
                          ref={searchDropdownRef}
                          className="absolute top-full right-0 left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-64 overflow-y-auto"
                          data-testid="search-dropdown"
                        >
                          <div className="p-3 border-b border-gray-100">
                            <span className="text-xs font-semibold text-carefd-gray">חיפושים נפוצים</span>
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
                    
                    {/* Location Input with Dropdown */}
                    <div className="relative flex gap-2">
                      <div className="flex-1 relative">
                        <FaMapMarkerAlt className="absolute right-4 top-1/2 -translate-y-1/2 text-carefd-gray z-10" />
                        <input
                          ref={locationInputRef}
                          type="text"
                          value={locationQuery}
                          onChange={(e) => {
                            setLocationQuery(e.target.value);
                            if (e.target.value !== 'המיקום שלי') {
                              setUserLocation(null);
                            }
                            setShowLocationDropdown(true);
                          }}
                          onFocus={() => setShowLocationDropdown(true)}
                          placeholder="עיר או אזור"
                          className="w-full input-soft text-carefd-navy px-5 py-3.5 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-carefd-teal placeholder-carefd-gray transition-all"
                          data-testid="hero-location-input"
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
                              className="w-full text-right px-4 py-3 hover:bg-carefd-teal-pale/30 transition-colors flex items-center gap-3 text-carefd-teal border-b border-gray-100"
                            >
                              <FaCrosshairs className="text-lg" />
                              <span className="font-medium">השתמש במיקום שלי</span>
                              {isLocating && <FaSpinner className="animate-spin mr-auto" />}
                            </button>
                            
                            {/* Regions */}
                            {!locationQuery && (
                              <>
                                <div className="p-3 border-b border-gray-100">
                                  <span className="text-xs font-semibold text-carefd-gray">אזורים</span>
                                </div>
                                <div className="p-2">
                                  {displayRegions.map((region) => (
                                    <button
                                      key={region.id || region.name}
                                      type="button"
                                      onClick={() => {
                                        setLocationQuery(region.name || region.name_he);
                                        setUserLocation(null);
                                        setShowLocationDropdown(false);
                                      }}
                                      className="w-full text-right px-3 py-2.5 hover:bg-carefd-teal-pale/30 rounded-lg transition-colors flex items-center gap-3 text-carefd-navy"
                                    >
                                      <FaMapMarkerAlt className="text-carefd-gray text-sm" />
                                      <span>{region.name || region.name_he}</span>
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                            
                            {/* Cities (filtered) */}
                            {locationQuery && filteredCities.length > 0 && (
                              <>
                                <div className="p-3 border-b border-gray-100">
                                  <span className="text-xs font-semibold text-carefd-gray">ערים</span>
                                </div>
                                <div className="p-2">
                                  {filteredCities.map((city) => (
                                    <button
                                      key={city.city_id || city.name}
                                      type="button"
                                      onClick={() => {
                                        setLocationQuery(city.name || city.name_he);
                                        setUserLocation(null);
                                        setShowLocationDropdown(false);
                                      }}
                                      className="w-full text-right px-3 py-2.5 hover:bg-carefd-teal-pale/30 rounded-lg transition-colors flex items-center gap-3 text-carefd-navy"
                                    >
                                      <FaMapMarkerAlt className="text-carefd-gray text-sm" />
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
                        className="btn-soft bg-carefd-teal-pale text-carefd-teal px-4 rounded-xl hover:bg-carefd-teal hover:text-white transition-all disabled:opacity-50 flex items-center justify-center btn-press"
                        title="השתמש במיקום שלי"
                        data-testid="gps-btn"
                      >
                        {isLocating ? <FaSpinner className="animate-spin" /> : <FaCrosshairs className="text-lg" />}
                      </button>
                    </div>
                  </div>

                  {/* Radius selector */}
                  {userLocation && (
                    <div className="mb-3 flex items-center gap-3 flex-wrap">
                      <span className="text-carefd-slate text-sm">רדיוס:</span>
                      <div className="flex gap-2">
                        {radiusOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setSelectedRadius(option.value)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              selectedRadius === option.value
                                ? 'bg-carefd-teal text-white'
                                : 'bg-gray-100 text-carefd-slate hover:bg-gray-200'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search Button */}
                  <button
                    type="submit"
                    className="w-full bg-carefd-teal text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-carefd-teal-medium transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                    data-testid="hero-search-btn"
                  >
                    <FaSearch />
                    <span>{searchTab === 'providers' ? 'חפש נותני שירות' : 'חפש שירותים'}</span>
                  </button>
                </div>
                
                {/* Quick Region Tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="text-sm text-carefd-teal-pale">אזורים:</span>
                  {displayRegions.map((region) => (
                    <button
                      key={region.id || region.name}
                      type="button"
                      onClick={() => {
                        setLocationQuery(region.name || region.name_he);
                        setUserLocation(null);
                      }}
                      className="text-sm bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-full transition-colors"
                    >
                      {region.name || region.name_he}
                    </button>
                  ))}
                </div>
              </form>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-white text-carefd-teal px-8 py-4 rounded-xl font-semibold hover:bg-carefd-teal-pale transition-all shadow-lg"
                  data-testid="get-started-btn"
                >
                  התחל עכשיו
                  <FaArrowLeft className="rtl:rotate-180" />
                </Link>
                <Link
                  to="/providers"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20"
                  data-testid="browse-providers-btn"
                >
                  <FaSearch />
                  צפה בספקים
                </Link>
              </div>
            </div>
            
            {/* Right Content - Stats Cards */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              <AnimatedSection delay={100}>
                <div className="glass-card-dark p-6 rounded-2xl hover-lift">
                  <div className="text-4xl font-bold text-white mb-2">{statistics.providers}+</div>
                  <div className="text-carefd-teal-pale">ספקים מאומתים</div>
                </div>
              </AnimatedSection>
              <AnimatedSection delay={200}>
                <div className="glass-card-dark p-6 rounded-2xl mt-8 hover-lift">
                  <div className="text-4xl font-bold text-white mb-2">{statistics.services}+</div>
                  <div className="text-carefd-teal-pale">שירותים זמינים</div>
                </div>
              </AnimatedSection>
              <AnimatedSection delay={300}>
                <div className="glass-card-dark p-6 rounded-2xl hover-lift">
                  <div className="text-4xl font-bold text-white mb-2">{statistics.happyClients}+</div>
                  <div className="text-carefd-teal-pale">לקוחות מרוצים</div>
                </div>
              </AnimatedSection>
              <AnimatedSection delay={400}>
                <div className="glass-card-dark p-6 rounded-2xl mt-8 hover-lift">
                  <div className="text-4xl font-bold text-white mb-2">{statistics.cities}+</div>
                  <div className="text-carefd-teal-pale">ערים בישראל</div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== PROFESSIONS ROW ==================== */}
      <section className="py-8 bg-white" data-testid="professions-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-carefd-navy">חפש לפי מקצוע</h3>
              <Link to="/providers" className="text-carefd-teal hover:text-carefd-teal-medium text-sm font-medium">
                כל המקצועות ←
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide stagger-animation">
              {professions.map((prof) => (
                <Link
                  key={prof.id}
                  to={`/providers?search=${encodeURIComponent(prof.name)}`}
                  className={`flex items-center gap-3 px-5 py-3 rounded-xl ${prof.color} transition-all flex-shrink-0 btn-press`}
                  data-testid={`profession-${prof.id}`}
                >
                  <prof.icon className="text-xl" />
                  <span className="font-medium whitespace-nowrap">{prof.name}</span>
                </Link>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ==================== CATEGORIES SECTION ==================== */}
      <section className="py-16 bg-gradient-to-b from-white to-gray-50" data-testid="categories-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-carefd-navy font-heading mb-4">
                קטגוריות שירותים
              </h2>
              <p className="text-carefd-slate max-w-2xl mx-auto">
                מצאו את השירות המתאים לכם מתוך מגוון רחב של קטגוריות
              </p>
            </div>
          </AnimatedSection>
          
          <AnimatedSection>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/services?category=${category.id}`}
                  className="group relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-5 text-center shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  data-testid={`category-${category.id}`}
                >
                  {/* Gradient Background on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  
                  <div className="relative z-10">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-carefd-teal/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
                      <category.icon className="text-2xl text-carefd-teal group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-bold text-carefd-navy group-hover:text-white transition-colors mb-1 text-base">
                      {category.name}
                    </h3>
                    <p className="text-xs text-carefd-gray group-hover:text-white/80 transition-colors line-clamp-2">
                      {category.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ==================== FEATURED PROVIDERS ==================== */}
      <section className="py-16 bg-white" data-testid="featured-providers-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-carefd-navy font-heading mb-2">
                  ספקים מומלצים
                </h2>
                <p className="text-carefd-slate">הספקים המובילים בפלטפורמה שלנו</p>
              </div>
              <Link
                to="/providers"
                className="hidden md:flex items-center gap-2 text-carefd-teal hover:text-carefd-teal-medium font-medium"
              >
                צפה בכל הספקים
                <FaArrowLeft className="rtl:rotate-180" />
              </Link>
            </div>
          </AnimatedSection>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <FaSpinner className="animate-spin text-3xl text-carefd-teal" />
            </div>
          ) : featuredProviders.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProviders.slice(0, 3).map((provider) => (
                <ProviderCard key={provider.provider_id} provider={provider} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-2xl">
              <FaUsers className="mx-auto text-5xl text-gray-300 mb-4" />
              <p className="text-carefd-slate text-lg mb-2">בקרוב יתווספו ספקים מומלצים...</p>
              <Link to="/register/provider" className="text-carefd-teal font-semibold hover:underline">
                הצטרפו כספק
              </Link>
            </div>
          )}
          
          <div className="mt-8 text-center md:hidden">
            <Link
              to="/providers"
              className="inline-flex items-center gap-2 text-carefd-teal font-semibold"
            >
              צפה בכל הספקים
              <FaArrowLeft className="rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== POPULAR SERVICES ==================== */}
      <section className="py-16 bg-gray-50" data-testid="popular-services-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-carefd-navy font-heading mb-2">
                שירותים נפוצים
              </h2>
              <p className="text-carefd-slate">השירותים הפופולריים ביותר בפלטפורמה</p>
            </div>
            <Link
              to="/services"
              className="hidden md:flex items-center gap-2 text-carefd-teal hover:text-carefd-teal-medium font-medium"
            >
              צפה בכל השירותים
              <FaArrowLeft className="rtl:rotate-180" />
            </Link>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <FaSpinner className="animate-spin text-3xl text-carefd-teal" />
            </div>
          ) : popularServices.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularServices.slice(0, 6).map((service) => (
                <ServiceCard key={service.service_id} service={service} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl">
              <FaHospital className="mx-auto text-5xl text-gray-300 mb-4" />
              <p className="text-carefd-slate text-lg">בקרוב יתווספו שירותים נפוצים...</p>
            </div>
          )}
          
          <div className="mt-8 text-center md:hidden">
            <Link
              to="/services"
              className="inline-flex items-center gap-2 text-carefd-teal font-semibold"
            >
              צפה בכל השירותים
              <FaArrowLeft className="rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section className="py-16 bg-white" data-testid="how-it-works-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-carefd-navy font-heading mb-4">
                איך זה עובד?
              </h2>
              <p className="text-carefd-slate max-w-2xl mx-auto">
                שלושה צעדים פשוטים למציאת השירות המושלם
              </p>
            </div>
          </AnimatedSection>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: '01', title: 'חפש שירות', desc: 'השתמשו במנוע החיפוש שלנו למציאת ספקים לפי מיקום, מקצוע או התמחות', icon: FaSearch },
              { num: '02', title: 'השווה והחלט', desc: 'קראו ביקורות, בדקו דירוגים והשוו מחירים לבחירת הספק המתאים', icon: FaStar },
              { num: '03', title: 'הזמן טיפול', desc: 'צרו קשר ישירות או הזמינו דרך הפלטפורמה בזמן שנוח לכם', icon: FaCheckCircle },
            ].map((step, index) => (
              <AnimatedSection key={index} delay={index * 150}>
                <div className="relative text-center group">
                  <div className="shadow-soft w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-carefd-teal group-hover:scale-110 transition-all duration-300 bg-carefd-teal-pale/30">
                    <step.icon className="text-3xl text-carefd-teal group-hover:text-white transition-colors" />
                  </div>
                  <span className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-2 bg-carefd-navy text-white text-sm font-bold px-3 py-1 rounded-full shadow-soft badge-glow">
                    {step.num}
                  </span>
                  <h3 className="text-xl font-bold text-carefd-navy mb-3">{step.title}</h3>
                  <p className="text-carefd-slate leading-relaxed">{step.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== TESTIMONIALS ==================== */}
      <section className="py-16 bg-carefd-navy" data-testid="testimonials-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white font-heading mb-4">
                מה הלקוחות שלנו אומרים
              </h2>
              <p className="text-carefd-teal-pale">אלפי לקוחות מרוצים כבר נהנים משירותים איכותיים</p>
            </div>
          </AnimatedSection>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <AnimatedSection key={testimonial.id} delay={index * 150}>
                <div className="glass-card-dark p-6 rounded-2xl hover-lift">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <FaStar key={i} className="text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-white mb-6 leading-relaxed">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-carefd-teal rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-carefd-teal-pale">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FOR PATIENTS & PROVIDERS ==================== */}
      <section className="py-16 bg-white" data-testid="for-who-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* For Patients */}
            <AnimatedSection delay={0}>
              <div className="bg-gradient-to-br from-carefd-teal to-carefd-teal-medium p-8 rounded-2xl text-white shadow-soft-lg hover-lift">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <FaUsers className="text-xl" />
                  </div>
                  <h3 className="text-2xl font-bold">למטופלים</h3>
                </div>
                <ul className="space-y-4 mb-8">
                  {[
                    'חפש ספקי שירותי בריאות לפי מיקום והתמחות',
                    'קרא ביקורות מאומתות וקבל החלטות מושכלות',
                    'הזמן שירותים ישירות דרך הפלטפורמה',
                    'נהל את התורים וההזמנות שלך במקום אחד'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <FaCheckCircle className="text-carefd-teal-pale mt-1 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 bg-white text-carefd-teal px-6 py-3 rounded-xl font-semibold hover:bg-carefd-teal-pale transition-all btn-press shadow-soft"
                >
                  הרשם כמטופל
                  <FaArrowLeft className="rtl:rotate-180" />
                </Link>
              </div>
            </AnimatedSection>

            {/* For Providers */}
            <AnimatedSection delay={200}>
              <div className="bg-gradient-to-br from-carefd-navy to-carefd-slate p-8 rounded-2xl text-white shadow-soft-lg hover-lift">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <FaUserMd className="text-xl" />
                  </div>
                  <h3 className="text-2xl font-bold">לספקי שירות</h3>
                </div>
              <ul className="space-y-4 mb-8">
                {[
                  'צור פרופיל מקצועי והצג את השירותים שלך',
                  'הגע ללקוחות חדשים והרחב את העסק',
                  'נהל את הזמינות והפגישות שלך בקלות',
                  'בנה את המוניטין המקצועי שלך דרך ביקורות'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <FaCheckCircle className="text-carefd-teal-pale mt-1 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-carefd-teal text-white px-6 py-3 rounded-xl font-semibold hover:bg-carefd-teal-medium transition-all btn-press shadow-soft"
              >
                הרשם כספק
                <FaArrowLeft className="rtl:rotate-180" />
              </Link>
            </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ==================== CTA SECTION ==================== */}
      <section className="py-16 bg-gradient-to-br from-carefd-teal via-carefd-teal-medium to-carefd-navy" data-testid="cta-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              מוכנים להתחיל?
            </h2>
            <p className="text-xl text-carefd-teal-pale mb-10 max-w-2xl mx-auto">
              הצטרפו לאלפי משתמשים שכבר מצאו את הטיפול המושלם עבורם
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-carefd-teal px-10 py-4 rounded-xl font-bold text-lg hover:bg-carefd-teal-pale transition-all shadow-soft-lg btn-press hover-scale"
                data-testid="cta-register-btn"
              >
                הרשמה
                <FaArrowLeft className="rtl:rotate-180" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 bg-transparent text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-all border-2 border-white/30 btn-press"
                data-testid="cta-login-btn"
              >
                התחברות
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
