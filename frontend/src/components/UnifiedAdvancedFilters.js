import React, { useState, useRef, useEffect } from 'react';
import { 
  FaFilter, FaTimes, FaMapMarkerAlt, FaCrosshairs, FaStar,
  FaUserMd, FaBriefcase, FaHome, FaVideo, FaClinicMedical, FaPhoneAlt,
  FaCheckCircle, FaAward, FaClock, FaChevronDown, FaChevronUp,
  FaBox, FaMale, FaFemale, FaUsers, FaGlobe, FaHospital, FaSearch,
  FaSpinner
} from 'react-icons/fa';
import { israeliRegions, israeliLocalities } from '../data/israeliLocalities';
import { 
  healthcareProfessions, serviceCategories, serviceTypes,
  genderOptions, languageOptions, healthFunds 
} from '../data/searchData';

// Service type icons mapping
const serviceTypeIcons = {
  home_visit: FaHome,
  clinic_visit: FaClinicMedical,
  video_call: FaVideo,
  phone_call: FaPhoneAlt,
  hourly: FaClock,
  product: FaBox,
};

// Gender icons mapping
const genderIcons = {
  male: FaMale,
  female: FaFemale,
  any: FaUsers,
};

// Rating options
const ratingOptions = [
  { value: 4.5, label: '4.5+ כוכבים' },
  { value: 4.0, label: '4.0+ כוכבים' },
  { value: 3.5, label: '3.5+ כוכבים' },
  { value: 3.0, label: '3.0+ כוכבים' }
];

const UnifiedAdvancedFilters = ({ 
  filters, 
  onFilterChange, 
  onReset, 
  showMobile = false, 
  onClose,
  resultsCount = 0,
  pageType = 'providers' // 'providers' or 'services'
}) => {
  const [expandedSections, setExpandedSections] = useState({
    location: true,
    category: true,
    serviceType: false,
    profession: false,
    gender: false,
    languages: false,
    healthFunds: false,
    price: false,
    rating: false,
    badges: false
  });
  
  // Location search states
  const [locationSearch, setLocationSearch] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const locationInputRef = useRef(null);
  const locationDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target) &&
          locationInputRef.current && !locationInputRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
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
          setLocationSearch(cityName);
          onFilterChange({ ...filters, city: cityName, region: '' });
        } catch (error) {
          setLocationSearch('המיקום שלי');
          onFilterChange({ ...filters, city: 'המיקום שלי', region: '' });
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

  // Get filtered cities based on search
  const getFilteredCities = () => {
    if (!locationSearch.trim()) return [];
    
    // Try to get from israeliLocalities if available
    if (typeof israeliLocalities !== 'undefined' && israeliLocalities.length > 0) {
      return israeliLocalities
        .filter(c => c.name?.includes(locationSearch))
        .slice(0, 8);
    }
    
    // Fallback to region cities
    const allCities = [];
    israeliRegions.forEach(region => {
      region.cities.forEach(city => {
        if (city.includes(locationSearch)) {
          allCities.push({ name: city, region: region.name });
        }
      });
    });
    return allCities.slice(0, 8);
  };

  const filteredCities = getFilteredCities();

  // Count active filters
  const activeFiltersCount = [
    filters.city, filters.region, filters.category, filters.serviceType,
    filters.profession, filters.gender, filters.minRating,
    filters.verifiedOnly, filters.recommendedOnly,
    filters.languages?.length > 0, filters.healthFunds?.length > 0,
    filters.priceMin, filters.priceMax
  ].filter(Boolean).length;

  // Filter Section Component
  const FilterSection = ({ title, icon: Icon, sectionKey, children }) => (
    <div className="border-b border-carelink-teal-pale/50 last:border-0">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between py-3 px-4 hover:bg-carelink-teal-pale/10 transition"
      >
        <div className="flex items-center gap-2 font-semibold text-carelink-navy text-sm">
          <Icon className="text-carelink-teal" />
          {title}
        </div>
        {expandedSections[sectionKey] ? <FaChevronUp className="text-carelink-gray text-xs" /> : <FaChevronDown className="text-carelink-gray text-xs" />}
      </button>
      {expandedSections[sectionKey] && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden ${showMobile ? 'fixed inset-0 z-50 overflow-y-auto' : ''}`}>
      {/* Header */}
      <div className="bg-carelink-navy text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaFilter />
          <span className="font-bold">סינון מתקדם</span>
          {activeFiltersCount > 0 && (
            <span className="bg-carelink-teal text-white text-xs px-2 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onReset}
            className="text-sm text-carelink-teal-pale hover:text-white transition"
          >
            נקה הכל
          </button>
          {showMobile && (
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {/* Location Filter with Search */}
      <FilterSection title="מיקום" icon={FaMapMarkerAlt} sectionKey="location">
        <div className="space-y-3">
          {/* GPS Button */}
          <button
            onClick={handleGetLocation}
            disabled={isLocating}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition text-sm ${
              filters.city === 'המיקום שלי'
                ? 'bg-carelink-teal text-white'
                : 'bg-carelink-teal-pale/30 text-carelink-navy hover:bg-carelink-teal-pale'
            }`}
          >
            {isLocating ? <FaSpinner className="animate-spin" /> : <FaCrosshairs />}
            <span>המיקום שלי</span>
          </button>

          {/* Location Search Input */}
          <div className="relative">
            <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-carelink-gray text-sm" />
            <input
              ref={locationInputRef}
              type="text"
              value={locationSearch}
              onChange={(e) => {
                setLocationSearch(e.target.value);
                setShowLocationDropdown(true);
              }}
              onFocus={() => setShowLocationDropdown(true)}
              placeholder="חפש עיר או אזור..."
              className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl focus:border-carelink-teal outline-none text-sm"
            />
            
            {/* Location Dropdown */}
            {showLocationDropdown && (
              <div 
                ref={locationDropdownRef}
                className="absolute top-full right-0 left-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-64 overflow-y-auto"
              >
                {/* Regions */}
                {!locationSearch && (
                  <>
                    <div className="p-2 border-b border-gray-100">
                      <span className="text-xs font-semibold text-carelink-gray px-2">אזורים</span>
                    </div>
                    <div className="p-1">
                      {israeliRegions.map((region) => (
                        <button
                          key={region.id}
                          type="button"
                          onClick={() => {
                            setLocationSearch(region.name);
                            onFilterChange({ ...filters, region: region.name, city: '' });
                            setShowLocationDropdown(false);
                          }}
                          className={`w-full text-right px-3 py-2 hover:bg-carelink-teal-pale/30 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                            filters.region === region.name ? 'bg-carelink-teal text-white' : 'text-carelink-navy'
                          }`}
                        >
                          <FaMapMarkerAlt className="text-xs" />
                          <span>{region.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
                
                {/* Cities (when searching) */}
                {locationSearch && filteredCities.length > 0 && (
                  <>
                    <div className="p-2 border-b border-gray-100">
                      <span className="text-xs font-semibold text-carelink-gray px-2">ערים</span>
                    </div>
                    <div className="p-1">
                      {filteredCities.map((city, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            const cityName = city.name || city;
                            setLocationSearch(cityName);
                            onFilterChange({ ...filters, city: cityName, region: '' });
                            setShowLocationDropdown(false);
                          }}
                          className={`w-full text-right px-3 py-2 hover:bg-carelink-teal-pale/30 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                            filters.city === (city.name || city) ? 'bg-carelink-teal text-white' : 'text-carelink-navy'
                          }`}
                        >
                          <FaMapMarkerAlt className="text-xs" />
                          <span>{city.name || city}</span>
                          {city.region && <span className="text-xs text-carelink-gray mr-auto">({city.region})</span>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                
                {locationSearch && filteredCities.length === 0 && (
                  <div className="p-4 text-center text-carelink-gray text-sm">
                    לא נמצאו תוצאות
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Location Display */}
          {(filters.city || filters.region) && (
            <div className="flex items-center gap-2 bg-carelink-teal-pale/30 px-3 py-2 rounded-lg">
              <FaMapMarkerAlt className="text-carelink-teal text-sm" />
              <span className="text-sm text-carelink-navy">{filters.city || filters.region}</span>
              <button 
                onClick={() => {
                  setLocationSearch('');
                  onFilterChange({ ...filters, city: '', region: '' });
                }}
                className="mr-auto text-carelink-gray hover:text-red-500"
              >
                <FaTimes className="text-xs" />
              </button>
            </div>
          )}
        </div>
      </FilterSection>

      {/* Category Filter */}
      <FilterSection title="קטגוריה" icon={FaBriefcase} sectionKey="category">
        <div className="grid grid-cols-2 gap-1.5">
          {serviceCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => onFilterChange({...filters, category: filters.category === cat.id ? '' : cat.id})}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filters.category === cat.id
                  ? 'bg-carelink-teal text-white'
                  : 'bg-carelink-teal-pale/30 text-carelink-navy hover:bg-carelink-teal-pale'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Service Type Filter */}
      <FilterSection title="סוג שירות" icon={FaHome} sectionKey="serviceType">
        <div className="space-y-1.5">
          {serviceTypes.map(type => {
            const Icon = serviceTypeIcons[type.id] || FaHome;
            return (
              <button
                key={type.id}
                onClick={() => onFilterChange({...filters, serviceType: filters.serviceType === type.id ? '' : type.id})}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  filters.serviceType === type.id
                    ? 'bg-carelink-teal text-white'
                    : 'bg-carelink-teal-pale/30 text-carelink-navy hover:bg-carelink-teal-pale'
                }`}
              >
                <Icon className="text-sm" />
                {type.name}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Profession Filter */}
      <FilterSection title="מקצוע" icon={FaUserMd} sectionKey="profession">
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {healthcareProfessions.slice(0, 12).map(prof => (
            <button
              key={prof.id}
              onClick={() => onFilterChange({...filters, profession: filters.profession === prof.name ? '' : prof.name})}
              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filters.profession === prof.name
                  ? 'bg-carelink-teal text-white'
                  : 'bg-carelink-teal-pale/30 text-carelink-navy hover:bg-carelink-teal-pale'
              }`}
            >
              <FaUserMd className="text-xs" />
              {prof.name}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Gender Filter */}
      <FilterSection title="מגדר" icon={FaUsers} sectionKey="gender">
        <div className="flex gap-2">
          {genderOptions.map(option => {
            const Icon = genderIcons[option.id] || FaUsers;
            return (
              <button
                key={option.id}
                onClick={() => onFilterChange({...filters, gender: filters.gender === option.id ? '' : option.id})}
                className={`flex-1 flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  filters.gender === option.id
                    ? 'bg-carelink-teal text-white'
                    : 'bg-carelink-teal-pale/30 text-carelink-navy hover:bg-carelink-teal-pale'
                }`}
              >
                <Icon className="text-lg" />
                {option.name}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Languages Filter */}
      <FilterSection title="שפות" icon={FaGlobe} sectionKey="languages">
        <div className="grid grid-cols-2 gap-1.5">
          {languageOptions.map(lang => {
            const isSelected = filters.languages?.includes(lang.id);
            return (
              <button
                key={lang.id}
                onClick={() => {
                  const currentLangs = filters.languages || [];
                  const newLangs = isSelected 
                    ? currentLangs.filter(l => l !== lang.id)
                    : [...currentLangs, lang.id];
                  onFilterChange({...filters, languages: newLangs});
                }}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-carelink-teal text-white'
                    : 'bg-carelink-teal-pale/30 text-carelink-navy hover:bg-carelink-teal-pale'
                }`}
              >
                {lang.name}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Health Funds Filter */}
      <FilterSection title="קופות חולים" icon={FaHospital} sectionKey="healthFunds">
        <div className="space-y-1.5">
          {healthFunds.map(fund => {
            const isSelected = filters.healthFunds?.includes(fund.id);
            return (
              <button
                key={fund.id}
                onClick={() => {
                  const currentFunds = filters.healthFunds || [];
                  const newFunds = isSelected 
                    ? currentFunds.filter(f => f !== fund.id)
                    : [...currentFunds, fund.id];
                  onFilterChange({...filters, healthFunds: newFunds});
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-carelink-teal text-white'
                    : 'bg-carelink-teal-pale/30 text-carelink-navy hover:bg-carelink-teal-pale'
                }`}
              >
                <span 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: fund.color }}
                />
                {fund.name}
                {isSelected && <FaCheckCircle className="mr-auto text-xs" />}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Price Filter */}
      <FilterSection title="טווח מחירים" icon={FaClock} sectionKey="price">
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-carelink-gray mb-1 block">מ-</label>
              <input
                type="number"
                placeholder="₪0"
                value={filters.priceMin || ''}
                onChange={(e) => onFilterChange({...filters, priceMin: e.target.value})}
                className="w-full p-2 border border-gray-200 rounded-lg focus:border-carelink-teal outline-none text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-carelink-gray mb-1 block">עד</label>
              <input
                type="number"
                placeholder="₪999"
                value={filters.priceMax || ''}
                onChange={(e) => onFilterChange({...filters, priceMax: e.target.value})}
                className="w-full p-2 border border-gray-200 rounded-lg focus:border-carelink-teal outline-none text-sm"
              />
            </div>
          </div>
          {/* Quick price ranges */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { min: '', max: '100', label: 'עד ₪100' },
              { min: '100', max: '300', label: '₪100-300' },
              { min: '300', max: '500', label: '₪300-500' },
              { min: '500', max: '', label: '₪500+' }
            ].map((range, i) => (
              <button
                key={i}
                onClick={() => onFilterChange({...filters, priceMin: range.min, priceMax: range.max})}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                  filters.priceMin === range.min && filters.priceMax === range.max
                    ? 'bg-carelink-teal text-white'
                    : 'bg-gray-100 text-carelink-navy hover:bg-gray-200'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </FilterSection>

      {/* Rating Filter */}
      <FilterSection title="דירוג מינימלי" icon={FaStar} sectionKey="rating">
        <div className="space-y-1.5">
          {ratingOptions.map(option => (
            <button
              key={option.value}
              onClick={() => onFilterChange({...filters, minRating: filters.minRating === option.value ? null : option.value})}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                filters.minRating === option.value
                  ? 'bg-carelink-teal text-white'
                  : 'bg-carelink-teal-pale/30 text-carelink-navy hover:bg-carelink-teal-pale'
              }`}
            >
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className={`text-xs ${i < Math.floor(option.value) ? 'text-yellow-400' : 'text-gray-300'}`} />
                ))}
              </div>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Badges Filter */}
      <FilterSection title="תגיות מיוחדות" icon={FaAward} sectionKey="badges">
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-carelink-teal-pale/20 transition">
            <input
              type="checkbox"
              checked={filters.verifiedOnly || false}
              onChange={(e) => onFilterChange({...filters, verifiedOnly: e.target.checked})}
              className="w-4 h-4 text-carelink-teal rounded border-gray-300 focus:ring-carelink-teal"
            />
            <FaCheckCircle className="text-carelink-teal text-sm" />
            <span className="text-xs font-medium text-carelink-navy">מאומתים בלבד</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-carelink-teal-pale/20 transition">
            <input
              type="checkbox"
              checked={filters.recommendedOnly || false}
              onChange={(e) => onFilterChange({...filters, recommendedOnly: e.target.checked})}
              className="w-4 h-4 text-carelink-teal rounded border-gray-300 focus:ring-carelink-teal"
            />
            <FaAward className="text-amber-500 text-sm" />
            <span className="text-xs font-medium text-carelink-navy">מומלצים בלבד</span>
          </label>
        </div>
      </FilterSection>

      {/* Mobile Apply Button */}
      {showMobile && (
        <div className="p-4 border-t border-carelink-teal-pale bg-white sticky bottom-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-carelink-teal text-white rounded-xl font-semibold"
          >
            הצג תוצאות ({resultsCount})
          </button>
        </div>
      )}
    </div>
  );
};

export default UnifiedAdvancedFilters;
