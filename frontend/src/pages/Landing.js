import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Logo from '../components/Logo';
import ProviderCard from '../components/ProviderCard';
import ServiceCard from '../components/ServiceCard';
import api from '../utils/api';
import { 
  FaUserNurse, FaWalking, FaUserMd, FaHeart, 
  FaHandHoldingHeart, FaSpa, FaStar, FaSearch,
  FaUsers, FaMapMarkerAlt, FaCheckCircle, FaArrowLeft,
  FaCrosshairs, FaSpinner
} from 'react-icons/fa';
import { 
  serviceCategories, 
  testimonials 
} from '../data/dummyData';

const categoryIcons = {
  nursing: FaUserNurse,
  physiotherapy: FaWalking,
  doctor: FaUserMd,
  eldercare: FaHeart,
  therapy: FaHandHoldingHeart,
  alternative: FaSpa
};

const Landing = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [searchType, setSearchType] = useState('providers');
  const [isLocating, setIsLocating] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedRadius, setSelectedRadius] = useState('');
  
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

  const fetchHomeData = async () => {
    try {
      // Fetch featured/recommended providers
      const providersRes = await api.get('/providers?recommended=true&limit=6');
      setFeaturedProviders(providersRes.data.providers || []);

      // Fetch popular services
      const servicesRes = await api.get('/services?limit=6');
      setPopularServices(servicesRes.data.services || []);

      // Fetch regions
      const regionsRes = await api.get('/regions');
      setRegions(regionsRes.data.regions || []);

      // Fetch statistics
      try {
        const statsRes = await api.get('/admin/stats');
        setStatistics({
          providers: statsRes.data.total_providers || 50,
          services: statsRes.data.total_services || 100,
          happyClients: statsRes.data.total_users || 500,
          cities: statsRes.data.total_cities || 20
        });
      } catch {
        // Use defaults for non-admin users
        setStatistics({
          providers: 50,
          services: 100,
          happyClients: 500,
          cities: 20
        });
      }
    } catch (error) {
      console.error('Failed to fetch home data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fallback regions if API returns nothing
  const defaultRegions = [
    { id: 'north', name: 'צפון', cities: ['חיפה', 'נהריה', 'עכו', 'כרמיאל', 'צפת'] },
    { id: 'center', name: 'מרכז', cities: ['תל אביב', 'רמת גן', 'פתח תקווה', 'הרצליה', 'רעננה'] },
    { id: 'south', name: 'דרום', cities: ['באר שבע', 'אשדוד', 'אשקלון', 'אילת'] },
    { id: 'jerusalem', name: 'ירושלים', cities: ['ירושלים', 'בית שמש', 'מודיעין'] }
  ];

  const displayRegions = regions.length > 0 ? regions : defaultRegions;

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
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocationQuery('המיקום שלי');
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
    navigate(`/${searchType}${queryString ? `?${queryString}` : ''}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-carelink-navy via-carelink-slate to-carelink-teal overflow-hidden" data-testid="hero-section">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-carelink-teal rounded-full translate-x-1/3 translate-y-1/3"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-white">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <span className="w-2 h-2 bg-carelink-teal rounded-full animate-pulse"></span>
                <span className="text-sm text-carelink-teal-pale">הפלטפורמה המובילה לשירותי בריאות בישראל</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 font-heading leading-tight" data-testid="hero-title">
                {t('heroTitle')}
              </h1>
              
              <p className="text-lg lg:text-xl mb-8 text-carelink-teal-pale max-w-xl leading-relaxed" data-testid="hero-subtitle">
                {t('heroSubtitle')}
              </p>

              {/* Hero Search Bar */}
              <form onSubmit={handleSearch} className="mb-8" data-testid="hero-search-form">
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                  {/* Search Type Selector */}
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setSearchType('providers')}
                      className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${
                        searchType === 'providers'
                          ? 'bg-carelink-teal text-white'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                      data-testid="search-type-providers"
                    >
                      ספקים
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchType('services')}
                      className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${
                        searchType === 'services'
                          ? 'bg-carelink-teal text-white'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                      data-testid="search-type-services"
                    >
                      שירותים
                    </button>
                  </div>

                  {/* Two Column Search */}
                  <div className="grid md:grid-cols-2 gap-3">
                    {/* Column 1: Profession/Category */}
                    <div className="relative">
                      <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-carelink-gray" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="מקצוע, התמחות, קטגוריה..."
                        className="w-full bg-white text-carelink-navy px-5 py-3 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-carelink-teal placeholder-carelink-gray"
                        data-testid="hero-search-input"
                      />
                    </div>
                    
                    {/* Column 2: Location */}
                    <div className="relative flex gap-2">
                      <div className="flex-1 relative">
                        <FaMapMarkerAlt className="absolute right-4 top-1/2 -translate-y-1/2 text-carelink-gray" />
                        <input
                          type="text"
                          value={locationQuery}
                          onChange={(e) => {
                            setLocationQuery(e.target.value);
                            if (e.target.value !== 'המיקום שלי') {
                              setUserLocation(null);
                            }
                          }}
                          placeholder="עיר, אזור או 'המיקום שלי'"
                          className="w-full bg-white text-carelink-navy px-5 py-3 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-carelink-teal placeholder-carelink-gray"
                          data-testid="hero-location-input"
                        />
                      </div>
                      
                      {/* GPS Button */}
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={isLocating}
                        className="bg-white text-carelink-teal px-4 rounded-xl hover:bg-carelink-teal-pale transition-colors disabled:opacity-50 flex items-center justify-center"
                        title="השתמש במיקום שלי"
                        data-testid="gps-btn"
                      >
                        {isLocating ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <FaCrosshairs className="text-lg" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Radius selector (appears when using GPS) */}
                  {userLocation && (
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-white text-sm">רדיוס חיפוש:</span>
                      <div className="flex gap-2">
                        {radiusOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setSelectedRadius(option.value)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                              selectedRadius === option.value
                                ? 'bg-carelink-teal text-white'
                                : 'bg-white/20 text-white hover:bg-white/30'
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
                    className="w-full mt-3 bg-carelink-teal text-white px-8 py-3 rounded-xl font-semibold hover:bg-carelink-teal-medium transition-all flex items-center justify-center gap-2 shadow-lg"
                    data-testid="hero-search-btn"
                  >
                    <FaSearch />
                    <span>חפש</span>
                  </button>
                </div>
                
                {/* Quick Location Tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="text-sm text-carelink-teal-pale">אזורים:</span>
                  {displayRegions.map((region) => (
                    <button
                      key={region.id || region.name}
                      type="button"
                      onClick={() => {
                        setLocationQuery(region.name);
                        setUserLocation(null);
                      }}
                      className="text-sm bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-full transition-colors"
                      data-testid={`region-${region.id || region.name}`}
                    >
                      {region.name}
                    </button>
                  ))}
                </div>

                {/* Quick Search Tags */}
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-sm text-carelink-teal-pale">חיפושים פופולריים:</span>
                  {['סיעוד', 'פיזיותרפיה', 'רופא בבית', 'טיפול בקשישים'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setSearchQuery(tag);
                      }}
                      className="text-sm bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-full transition-colors"
                      data-testid={`quick-search-${tag}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </form>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-carelink-teal text-white px-8 py-4 rounded-xl font-semibold hover:bg-carelink-teal-medium transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  data-testid="get-started-btn"
                >
                  {t('getStarted')}
                  <FaArrowLeft className="rtl:rotate-180" />
                </Link>
                <Link
                  to="/providers"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20"
                  data-testid="browse-providers-btn"
                >
                  <FaSearch />
                  חפש ספקים
                </Link>
              </div>
            </div>
            
            {/* Right Content - Stats Cards */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                <div className="text-4xl font-bold text-white mb-2">{statistics.providers}+</div>
                <div className="text-carelink-teal-pale">ספקים מאומתים</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 mt-8">
                <div className="text-4xl font-bold text-white mb-2">{statistics.services}+</div>
                <div className="text-carelink-teal-pale">שירותים זמינים</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                <div className="text-4xl font-bold text-white mb-2">{statistics.happyClients}+</div>
                <div className="text-carelink-teal-pale">לקוחות מרוצים</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 mt-8">
                <div className="text-4xl font-bold text-white mb-2">{statistics.cities}+</div>
                <div className="text-carelink-teal-pale">ערים בישראל</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gradient-to-b from-white to-carelink-teal-pale/30" data-testid="categories-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-carelink-navy font-heading mb-4">
              קטגוריות שירותים
            </h2>
            <p className="text-carelink-slate max-w-2xl mx-auto">
              מצאו את השירות המתאים לכם מתוך מגוון רחב של קטגוריות
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {serviceCategories.map((category) => {
              const IconComponent = categoryIcons[category.id] || FaHeart;
              return (
                <Link
                  key={category.id}
                  to={`/services?category=${category.id}`}
                  className="group bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-carelink-teal text-center"
                  data-testid={`category-${category.id}`}
                >
                  <div className="w-14 h-14 mx-auto bg-carelink-teal-pale rounded-xl flex items-center justify-center mb-4 group-hover:bg-carelink-teal transition-colors">
                    <IconComponent className="text-2xl text-carelink-teal group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-bold text-carelink-navy mb-1">{category.name}</h3>
                  <p className="text-xs text-carelink-gray line-clamp-2">{category.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Providers Section */}
      <section className="py-16 bg-white" data-testid="featured-providers-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-carelink-navy font-heading mb-2">
                ספקים מומלצים
              </h2>
              <p className="text-carelink-slate">הספקים הכי מדורגים בפלטפורמה שלנו</p>
            </div>
            <Link
              to="/providers"
              className="hidden md:flex items-center gap-2 text-carelink-teal hover:text-carelink-teal-medium font-semibold transition-colors"
              data-testid="view-all-providers"
            >
              צפה בכל הספקים
              <FaArrowLeft className="rtl:rotate-180" />
            </Link>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <FaSpinner className="animate-spin text-4xl text-carelink-teal" />
            </div>
          ) : featuredProviders.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProviders.slice(0, 3).map((provider) => (
                <ProviderCard key={provider.provider_id} provider={provider} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-carelink-teal-pale/20 rounded-2xl">
              <p className="text-carelink-slate">בקרוב יתווספו ספקים מומלצים...</p>
              <Link to="/register/provider" className="text-carelink-teal font-semibold hover:underline mt-2 inline-block">
                הצטרפו כספק
              </Link>
            </div>
          )}
          
          <div className="mt-8 text-center md:hidden">
            <Link
              to="/providers"
              className="inline-flex items-center gap-2 text-carelink-teal font-semibold"
            >
              צפה בכל הספקים
              <FaArrowLeft className="rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gradient-to-b from-carelink-teal-pale/30 to-white" data-testid="how-it-works-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-carelink-navy font-heading mb-4" data-testid="how-it-works-title">
              {t('howItWorks')}
            </h2>
            <p className="text-carelink-slate max-w-2xl mx-auto">
              שלושה צעדים פשוטים למציאת השירות המושלם עבורכם
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-carelink-teal-pale hover:border-carelink-teal transition-colors">
                <div className="w-12 h-12 bg-carelink-teal text-white rounded-full flex items-center justify-center text-xl font-bold mb-6">
                  1
                </div>
                <h3 className="text-xl font-bold text-carelink-navy mb-3">חפש שירות</h3>
                <p className="text-carelink-slate">
                  השתמשו במנוע החיפוש שלנו כדי למצוא ספקים לפי מיקום, התמחות או סוג שירות
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -left-4 w-8 h-0.5 bg-carelink-teal-light"></div>
            </div>
            
            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-carelink-teal-pale hover:border-carelink-teal transition-colors">
                <div className="w-12 h-12 bg-carelink-teal text-white rounded-full flex items-center justify-center text-xl font-bold mb-6">
                  2
                </div>
                <h3 className="text-xl font-bold text-carelink-navy mb-3">השוו והחליטו</h3>
                <p className="text-carelink-slate">
                  קראו ביקורות, בדקו דירוגים והשוו מחירים כדי לבחור את הספק המתאים
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -left-4 w-8 h-0.5 bg-carelink-teal-light"></div>
            </div>
            
            {/* Step 3 */}
            <div>
              <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-carelink-teal-pale hover:border-carelink-teal transition-colors">
                <div className="w-12 h-12 bg-carelink-teal text-white rounded-full flex items-center justify-center text-xl font-bold mb-6">
                  3
                </div>
                <h3 className="text-xl font-bold text-carelink-navy mb-3">הזמינו וקבלו שירות</h3>
                <p className="text-carelink-slate">
                  הזמינו ישירות דרך הפלטפורמה וקבלו שירות מקצועי ואיכותי
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Services Section */}
      <section className="py-16 bg-white" data-testid="featured-services-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-carelink-navy font-heading mb-2">
                שירותים פופולריים
              </h2>
              <p className="text-carelink-slate">השירותים הכי מבוקשים בפלטפורמה שלנו</p>
            </div>
            <Link
              to="/services"
              className="hidden md:flex items-center gap-2 text-carelink-teal hover:text-carelink-teal-medium font-semibold transition-colors"
              data-testid="view-all-services"
            >
              צפה בכל השירותים
              <FaArrowLeft className="rtl:rotate-180" />
            </Link>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <FaSpinner className="animate-spin text-4xl text-carelink-teal" />
            </div>
          ) : popularServices.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularServices.slice(0, 6).map((service) => (
                <ServiceCard key={service.service_id} service={service} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-carelink-teal-pale/20 rounded-2xl">
              <p className="text-carelink-slate">בקרוב יתווספו שירותים...</p>
            </div>
          )}
          
          <div className="mt-8 text-center md:hidden">
            <Link
              to="/services"
              className="inline-flex items-center gap-2 text-carelink-teal font-semibold"
            >
              צפה בכל השירותים
              <FaArrowLeft className="rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gradient-to-b from-carelink-navy to-carelink-slate" data-testid="testimonials-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white font-heading mb-4">
              מה הלקוחות שלנו אומרים
            </h2>
            <p className="text-carelink-teal-pale max-w-2xl mx-auto">
              אלפי לקוחות מרוצים כבר השתמשו בשירותים שלנו
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20"
                data-testid={`testimonial-${testimonial.id}`}
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FaStar key={i} className="text-yellow-400" />
                  ))}
                </div>
                <p className="text-white mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-carelink-teal rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-white">{testimonial.name}</div>
                    <div className="text-sm text-carelink-teal-pale">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Patients & Providers Section */}
      <section className="py-16 bg-white" data-testid="for-who-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* For Patients */}
            <div className="bg-gradient-to-br from-carelink-teal to-carelink-teal-medium p-8 rounded-2xl text-white" data-testid="patients-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <FaUsers className="text-2xl" />
                </div>
                <h3 className="text-2xl font-bold font-heading">{t('forPatients')}</h3>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <FaCheckCircle className="text-carelink-teal-pale mt-1 flex-shrink-0" />
                  <span>חפש ספקי שירותי בריאות לפי מיקום והתמחות</span>
                </li>
                <li className="flex items-start gap-3">
                  <FaCheckCircle className="text-carelink-teal-pale mt-1 flex-shrink-0" />
                  <span>פרסם בקשה וקבל הצעות ממספר ספקים</span>
                </li>
                <li className="flex items-start gap-3">
                  <FaCheckCircle className="text-carelink-teal-pale mt-1 flex-shrink-0" />
                  <span>הזמן שירותים ישירות דרך הפלטפורמה</span>
                </li>
                <li className="flex items-start gap-3">
                  <FaCheckCircle className="text-carelink-teal-pale mt-1 flex-shrink-0" />
                  <span>קרא ביקורות מאומתות וקבל החלטות מושכלות</span>
                </li>
              </ul>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-white text-carelink-teal px-6 py-3 rounded-xl font-semibold hover:bg-carelink-teal-pale transition-colors"
                data-testid="register-patient-btn"
              >
                {t('registerAsPatient')}
                <FaArrowLeft className="rtl:rotate-180" />
              </Link>
            </div>

            {/* For Providers */}
            <div className="bg-gradient-to-br from-carelink-navy to-carelink-slate p-8 rounded-2xl text-white" data-testid="providers-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <FaUserMd className="text-2xl" />
                </div>
                <h3 className="text-2xl font-bold font-heading">{t('forProviders')}</h3>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <FaCheckCircle className="text-carelink-teal-light mt-1 flex-shrink-0" />
                  <span>צור פרופיל מקצועי והצג את השירותים שלך</span>
                </li>
                <li className="flex items-start gap-3">
                  <FaCheckCircle className="text-carelink-teal-light mt-1 flex-shrink-0" />
                  <span>הגש הצעות לבקשות פעילות והרחב את קהל הלקוחות</span>
                </li>
                <li className="flex items-start gap-3">
                  <FaCheckCircle className="text-carelink-teal-light mt-1 flex-shrink-0" />
                  <span>נהל את הזמינות והפגישות שלך בקלות</span>
                </li>
                <li className="flex items-start gap-3">
                  <FaCheckCircle className="text-carelink-teal-light mt-1 flex-shrink-0" />
                  <span>בנה את המוניטין המקצועי שלך דרך ביקורות</span>
                </li>
              </ul>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-carelink-teal text-white px-6 py-3 rounded-xl font-semibold hover:bg-carelink-teal-medium transition-colors"
                data-testid="register-provider-btn"
              >
                {t('registerAsProvider')}
                <FaArrowLeft className="rtl:rotate-180" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-carelink-teal to-carelink-teal-medium" data-testid="cta-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white font-heading mb-6">
            מוכנים להתחיל?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            הצטרפו לאלפי משתמשים שכבר מצאו את השירות המושלם עבורם
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-carelink-teal px-8 py-4 rounded-xl font-semibold hover:bg-carelink-teal-pale transition-all shadow-lg hover:shadow-xl"
              data-testid="cta-register-btn"
            >
              {t('register')}
              <FaArrowLeft className="rtl:rotate-180" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 bg-transparent text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-all border-2 border-white"
              data-testid="cta-login-btn"
            >
              {t('login')}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
