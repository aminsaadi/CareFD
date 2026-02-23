import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProviderCard from '../components/ProviderCard';
import ServiceCard from '../components/ServiceCard';
import api from '../utils/api';
import { 
  FaUserNurse, FaWalking, FaUserMd, FaHeart, 
  FaHandHoldingHeart, FaSpa, FaStar, FaSearch,
  FaUsers, FaMapMarkerAlt, FaCheckCircle, FaArrowLeft,
  FaCrosshairs, FaSpinner, FaShieldAlt, FaClock, FaAward
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

// Intersection Observer Hook for scroll animations
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
      className={`transition-all duration-1000 ease-out ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
        transitionDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  );
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
      const providersRes = await api.get('/providers?recommended=true&limit=6');
      setFeaturedProviders(providersRes.data.providers || []);

      const servicesRes = await api.get('/services?limit=6');
      setPopularServices(servicesRes.data.services || []);

      const regionsRes = await api.get('/regions');
      setRegions(regionsRes.data.regions || []);

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
    <div className="min-h-screen bg-carelink-cream">
      <Navbar />
      
      {/* ============================================
          HERO SECTION - Premium Luxury
          ============================================ */}
      <section className="relative bg-carelink-deep overflow-hidden min-h-[90vh] flex items-center" data-testid="hero-section">
        {/* Subtle Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-carelink-teal/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-carelink-gold/5 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-carelink-teal/3 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl animate-float"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-32 w-full">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Left Content */}
            <div className="text-white">
              <AnimatedSection delay={0}>
                <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-sm px-5 py-2.5 rounded-full mb-8 border border-white/10">
                  <span className="w-2 h-2 bg-carelink-gold rounded-full animate-pulse"></span>
                  <span className="text-sm text-carelink-gold-light font-medium tracking-wide">הפלטפורמה המובילה לשירותי בריאות</span>
                </div>
              </AnimatedSection>
              
              <AnimatedSection delay={100}>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold mb-8 leading-tight tracking-tight" data-testid="hero-title">
                  טיפול רפואי
                  <br />
                  <span className="text-gradient-gold">פרטי ואיכותי</span>
                  <br />
                  בבית שלכם
                </h1>
              </AnimatedSection>
              
              <AnimatedSection delay={200}>
                <p className="text-lg lg:text-xl mb-10 text-carelink-light-gray/80 max-w-xl leading-relaxed" data-testid="hero-subtitle">
                  מצאו את המומחים הטובים ביותר בתחום הבריאות. 
                  שירות מקצועי, אישי ומותאם לצרכים שלכם.
                </p>
              </AnimatedSection>

              {/* Premium Search Bar */}
              <AnimatedSection delay={300}>
                <form onSubmit={handleSearch} className="mb-10" data-testid="hero-search-form">
                  <div className="glass-card-premium p-6 rounded-3xl">
                    {/* Search Type Selector */}
                    <div className="flex gap-3 mb-5">
                      <button
                        type="button"
                        onClick={() => setSearchType('providers')}
                        className={`flex-1 py-3 px-5 rounded-2xl font-medium transition-all duration-300 ${
                          searchType === 'providers'
                            ? 'bg-carelink-deep text-white shadow-soft'
                            : 'bg-carelink-stone text-carelink-slate hover:bg-carelink-stone/80'
                        }`}
                        data-testid="search-type-providers"
                      >
                        ספקים
                      </button>
                      <button
                        type="button"
                        onClick={() => setSearchType('services')}
                        className={`flex-1 py-3 px-5 rounded-2xl font-medium transition-all duration-300 ${
                          searchType === 'services'
                            ? 'bg-carelink-deep text-white shadow-soft'
                            : 'bg-carelink-stone text-carelink-slate hover:bg-carelink-stone/80'
                        }`}
                        data-testid="search-type-services"
                      >
                        שירותים
                      </button>
                    </div>

                    {/* Search Inputs */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="relative">
                        <FaSearch className="absolute right-5 top-1/2 -translate-y-1/2 text-carelink-gray/50" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="מקצוע, התמחות..."
                          className="input-premium pr-14"
                          data-testid="hero-search-input"
                        />
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="flex-1 relative">
                          <FaMapMarkerAlt className="absolute right-5 top-1/2 -translate-y-1/2 text-carelink-gray/50" />
                          <input
                            type="text"
                            value={locationQuery}
                            onChange={(e) => {
                              setLocationQuery(e.target.value);
                              if (e.target.value !== 'המיקום שלי') {
                                setUserLocation(null);
                              }
                            }}
                            placeholder="עיר או אזור"
                            className="input-premium pr-14"
                            data-testid="hero-location-input"
                          />
                        </div>
                        
                        <button
                          type="button"
                          onClick={handleGetLocation}
                          disabled={isLocating}
                          className="bg-carelink-stone hover:bg-carelink-teal-pale text-carelink-teal px-5 rounded-2xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
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

                    {/* Radius Selector */}
                    {userLocation && (
                      <div className="mt-4 flex items-center gap-3">
                        <span className="text-carelink-slate text-sm">רדיוס:</span>
                        <div className="flex gap-2">
                          {radiusOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setSelectedRadius(option.value)}
                              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                                selectedRadius === option.value
                                  ? 'bg-carelink-teal text-white'
                                  : 'bg-carelink-stone text-carelink-slate hover:bg-carelink-teal-pale'
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
                      className="w-full mt-5 bg-carelink-deep text-white px-8 py-4 rounded-2xl font-semibold hover:bg-carelink-charcoal transition-all duration-300 flex items-center justify-center gap-3 shadow-soft-md hover:shadow-soft-lg"
                      data-testid="hero-search-btn"
                    >
                      <FaSearch />
                      <span>חיפוש</span>
                    </button>
                  </div>
                  
                  {/* Quick Tags */}
                  <div className="flex flex-wrap gap-2 mt-6">
                    <span className="text-sm text-carelink-light-gray/60">פופולרי:</span>
                    {['סיעוד', 'פיזיותרפיה', 'רופא בבית', 'טיפול בקשישים'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSearchQuery(tag)}
                        className="text-sm bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-4 py-1.5 rounded-full transition-all duration-300 border border-white/10"
                        data-testid={`quick-search-${tag}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </form>
              </AnimatedSection>
              
              {/* CTA Buttons */}
              <AnimatedSection delay={400}>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    to="/register"
                    className="btn-premium inline-flex items-center justify-center gap-3 bg-carelink-teal text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300"
                    data-testid="get-started-btn"
                  >
                    {t('getStarted')}
                    <FaArrowLeft className="rtl:rotate-180" />
                  </Link>
                  <Link
                    to="/providers"
                    className="inline-flex items-center justify-center gap-3 bg-white/5 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white/10 transition-all duration-300 border border-white/10"
                    data-testid="browse-providers-btn"
                  >
                    <FaSearch />
                    צפה בספקים
                  </Link>
                </div>
              </AnimatedSection>
            </div>
            
            {/* Right Content - Stats Cards with Glassmorphism */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-2 gap-6">
                <AnimatedSection delay={200}>
                  <div className="glass-card-dark p-8 rounded-3xl hover-lift">
                    <div className="text-5xl font-serif font-bold text-white mb-3">{statistics.providers}+</div>
                    <div className="text-carelink-light-gray/70 text-lg">ספקים מאומתים</div>
                  </div>
                </AnimatedSection>
                <AnimatedSection delay={300}>
                  <div className="glass-card-dark p-8 rounded-3xl mt-12 hover-lift">
                    <div className="text-5xl font-serif font-bold text-carelink-gold mb-3">{statistics.services}+</div>
                    <div className="text-carelink-light-gray/70 text-lg">שירותים זמינים</div>
                  </div>
                </AnimatedSection>
                <AnimatedSection delay={400}>
                  <div className="glass-card-dark p-8 rounded-3xl hover-lift">
                    <div className="text-5xl font-serif font-bold text-carelink-teal-light mb-3">{statistics.happyClients}+</div>
                    <div className="text-carelink-light-gray/70 text-lg">לקוחות מרוצים</div>
                  </div>
                </AnimatedSection>
                <AnimatedSection delay={500}>
                  <div className="glass-card-dark p-8 rounded-3xl mt-12 hover-lift">
                    <div className="text-5xl font-serif font-bold text-white mb-3">{statistics.cities}+</div>
                    <div className="text-carelink-light-gray/70 text-lg">ערים בישראל</div>
                  </div>
                </AnimatedSection>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          TRUST INDICATORS - Luxury Style
          ============================================ */}
      <section className="py-16 bg-carelink-stone border-b border-carelink-light-gray/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: FaShieldAlt, text: 'ספקים מאומתים', color: 'text-carelink-teal' },
              { icon: FaClock, text: 'זמינות 24/7', color: 'text-carelink-navy' },
              { icon: FaStar, text: 'דירוג גבוה', color: 'text-carelink-gold' },
              { icon: FaAward, text: 'איכות מובטחת', color: 'text-carelink-teal' },
            ].map((item, index) => (
              <AnimatedSection key={index} delay={index * 100}>
                <div className="flex items-center gap-4 justify-center">
                  <item.icon className={`text-2xl ${item.color}`} />
                  <span className="text-carelink-charcoal font-medium">{item.text}</span>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          CATEGORIES SECTION - Glassmorphism Cards
          ============================================ */}
      <section className="py-24 lg:py-32 bg-carelink-cream" data-testid="categories-section">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-serif font-bold text-carelink-deep mb-6">
                קטגוריות שירותים
              </h2>
              <p className="text-carelink-slate text-lg max-w-2xl mx-auto leading-relaxed">
                מצאו את השירות המתאים לכם מתוך מגוון רחב של התמחויות רפואיות
              </p>
            </div>
          </AnimatedSection>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {serviceCategories.map((category, index) => {
              const IconComponent = categoryIcons[category.id] || FaHeart;
              return (
                <AnimatedSection key={category.id} delay={index * 100}>
                  <Link
                    to={`/services?category=${category.id}`}
                    className="group card-soft p-8 text-center hover-lift"
                    data-testid={`category-${category.id}`}
                  >
                    <div className="w-16 h-16 mx-auto bg-carelink-stone rounded-2xl flex items-center justify-center mb-5 group-hover:bg-carelink-teal transition-all duration-500">
                      <IconComponent className="text-2xl text-carelink-teal group-hover:text-white transition-colors duration-500" />
                    </div>
                    <h3 className="font-semibold text-carelink-deep mb-2">{category.name}</h3>
                    <p className="text-sm text-carelink-gray leading-relaxed line-clamp-2">{category.description}</p>
                  </Link>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================
          FEATURED PROVIDERS - Premium Cards
          ============================================ */}
      <section className="py-24 lg:py-32 bg-white" data-testid="featured-providers-section">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <AnimatedSection>
            <div className="flex justify-between items-end mb-16">
              <div>
                <h2 className="text-3xl lg:text-4xl font-serif font-bold text-carelink-deep mb-4">
                  ספקים מומלצים
                </h2>
                <p className="text-carelink-slate text-lg">המומחים המובילים בפלטפורמה שלנו</p>
              </div>
              <Link
                to="/providers"
                className="hidden md:flex items-center gap-2 text-carelink-teal hover:text-carelink-navy font-semibold transition-colors link-underline"
                data-testid="view-all-providers"
              >
                צפה בכל הספקים
                <FaArrowLeft className="rtl:rotate-180" />
              </Link>
            </div>
          </AnimatedSection>
          
          {loading ? (
            <div className="flex justify-center py-20">
              <FaSpinner className="animate-spin text-4xl text-carelink-teal" />
            </div>
          ) : featuredProviders.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProviders.slice(0, 3).map((provider, index) => (
                <AnimatedSection key={provider.provider_id} delay={index * 150}>
                  <ProviderCard provider={provider} />
                </AnimatedSection>
              ))}
            </div>
          ) : (
            <AnimatedSection>
              <div className="text-center py-20 bg-carelink-stone rounded-3xl">
                <p className="text-carelink-slate text-lg mb-4">בקרוב יתווספו ספקים מומלצים...</p>
                <Link to="/register/provider" className="text-carelink-teal font-semibold hover:underline">
                  הצטרפו כספק
                </Link>
              </div>
            </AnimatedSection>
          )}
          
          <div className="mt-10 text-center md:hidden">
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

      {/* ============================================
          HOW IT WORKS - Elegant Steps
          ============================================ */}
      <section className="py-24 lg:py-32 bg-carelink-stone" data-testid="how-it-works-section">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <AnimatedSection>
            <div className="text-center mb-20">
              <h2 className="text-3xl lg:text-4xl font-serif font-bold text-carelink-deep mb-6" data-testid="how-it-works-title">
                {t('howItWorks')}
              </h2>
              <p className="text-carelink-slate text-lg max-w-2xl mx-auto leading-relaxed">
                שלושה צעדים פשוטים לקבלת טיפול מקצועי ואיכותי
              </p>
            </div>
          </AnimatedSection>
          
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { num: '01', title: 'חפש שירות', desc: 'השתמשו במנוע החיפוש המתקדם שלנו כדי למצוא ספקים לפי מיקום והתמחות' },
              { num: '02', title: 'השוו והחליטו', desc: 'קראו ביקורות, בדקו דירוגים והשוו מחירים כדי לבחור את המומחה המתאים' },
              { num: '03', title: 'הזמינו טיפול', desc: 'הזמינו ישירות דרך הפלטפורמה וקבלו שירות מקצועי בזמן שנוח לכם' },
            ].map((step, index) => (
              <AnimatedSection key={index} delay={index * 200}>
                <div className="relative">
                  <div className="card-soft p-10">
                    <span className="text-6xl font-serif font-bold text-carelink-teal/20 absolute top-6 right-8">
                      {step.num}
                    </span>
                    <div className="relative z-10 pt-8">
                      <h3 className="text-xl font-serif font-bold text-carelink-deep mb-4">{step.title}</h3>
                      <p className="text-carelink-slate leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-1/2 -left-6 w-12 h-px bg-carelink-teal-pale"></div>
                  )}
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          TESTIMONIALS - Dark Luxury Section
          ============================================ */}
      <section className="py-24 lg:py-32 bg-carelink-deep" data-testid="testimonials-section">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-serif font-bold text-white mb-6">
                מה הלקוחות שלנו אומרים
              </h2>
              <p className="text-carelink-light-gray/70 text-lg max-w-2xl mx-auto">
                אלפי לקוחות מרוצים כבר נהנים משירותים איכותיים
              </p>
            </div>
          </AnimatedSection>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <AnimatedSection key={testimonial.id} delay={index * 150}>
                <div
                  className="glass-card-dark p-8 rounded-3xl hover-lift"
                  data-testid={`testimonial-${testimonial.id}`}
                >
                  <div className="flex items-center gap-1 mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <FaStar key={i} className="text-carelink-gold" />
                    ))}
                  </div>
                  <p className="text-white/90 mb-8 leading-relaxed text-lg">"{testimonial.content}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-carelink-teal/20 rounded-full flex items-center justify-center text-carelink-teal font-serif font-bold text-xl">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{testimonial.name}</div>
                      <div className="text-sm text-carelink-light-gray/60">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          FOR PATIENTS & PROVIDERS - Dual Cards
          ============================================ */}
      <section className="py-24 lg:py-32 bg-carelink-cream" data-testid="for-who-section">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-2 gap-10">
            {/* For Patients */}
            <AnimatedSection delay={0}>
              <div className="bg-gradient-to-br from-carelink-teal to-carelink-navy p-10 lg:p-12 rounded-3xl text-white hover-lift" data-testid="patients-card">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                    <FaUsers className="text-2xl" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold">{t('forPatients')}</h3>
                </div>
                <ul className="space-y-5 mb-10">
                  {[
                    'חפש ספקי שירותי בריאות לפי מיקום והתמחות',
                    'פרסם בקשה וקבל הצעות ממספר ספקים',
                    'הזמן שירותים ישירות דרך הפלטפורמה',
                    'קרא ביקורות מאומתות וקבל החלטות מושכלות'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <FaCheckCircle className="text-carelink-teal-light mt-1 flex-shrink-0" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-3 bg-white text-carelink-teal px-8 py-4 rounded-2xl font-semibold hover:bg-carelink-stone transition-all duration-300"
                  data-testid="register-patient-btn"
                >
                  {t('registerAsPatient')}
                  <FaArrowLeft className="rtl:rotate-180" />
                </Link>
              </div>
            </AnimatedSection>

            {/* For Providers */}
            <AnimatedSection delay={200}>
              <div className="bg-gradient-to-br from-carelink-charcoal to-carelink-deep p-10 lg:p-12 rounded-3xl text-white hover-lift" data-testid="providers-card">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                    <FaUserMd className="text-2xl" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold">{t('forProviders')}</h3>
                </div>
                <ul className="space-y-5 mb-10">
                  {[
                    'צור פרופיל מקצועי והצג את השירותים שלך',
                    'הגש הצעות לבקשות פעילות והרחב את קהל הלקוחות',
                    'נהל את הזמינות והפגישות שלך בקלות',
                    'בנה את המוניטין המקצועי שלך דרך ביקורות'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <FaCheckCircle className="text-carelink-gold mt-1 flex-shrink-0" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-3 bg-carelink-teal text-white px-8 py-4 rounded-2xl font-semibold hover:bg-carelink-teal-medium transition-all duration-300"
                  data-testid="register-provider-btn"
                >
                  {t('registerAsProvider')}
                  <FaArrowLeft className="rtl:rotate-180" />
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ============================================
          CTA SECTION - Luxury Final Call
          ============================================ */}
      <section className="py-24 lg:py-32 bg-carelink-deep relative overflow-hidden" data-testid="cta-section">
        {/* Subtle background glow */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-carelink-teal/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <AnimatedSection>
            <h2 className="text-3xl lg:text-5xl font-serif font-bold text-white mb-8">
              מוכנים להתחיל?
            </h2>
            <p className="text-xl text-carelink-light-gray/80 mb-12 leading-relaxed max-w-2xl mx-auto">
              הצטרפו לקהילה של אלפי משתמשים שכבר מצאו את הטיפול המושלם עבורם
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <Link
                to="/register"
                className="btn-premium inline-flex items-center justify-center gap-3 bg-carelink-teal text-white px-10 py-5 rounded-2xl font-semibold text-lg"
                data-testid="cta-register-btn"
              >
                {t('register')}
                <FaArrowLeft className="rtl:rotate-180" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-3 bg-transparent text-white px-10 py-5 rounded-2xl font-semibold text-lg hover:bg-white/10 transition-all duration-300 border border-white/20"
                data-testid="cta-login-btn"
              >
                {t('login')}
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
