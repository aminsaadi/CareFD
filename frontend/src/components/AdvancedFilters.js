import React, { useState, useEffect } from 'react';
import { 
  FaFilter, FaTimes, FaMapMarkerAlt, FaCrosshairs, FaStar,
  FaUserMd, FaBriefcase, FaHome, FaVideo, FaClinicMedical, FaPhoneAlt,
  FaCheckCircle, FaAward, FaClock, FaChevronDown, FaChevronUp
} from 'react-icons/fa';

const serviceTypeConfig = {
  home_visit: { icon: FaHome, label: 'ביקור בית' },
  video_call: { icon: FaVideo, label: 'טלרפואה' },
  clinic_visit: { icon: FaClinicMedical, label: 'ביקור במרפאה' },
  phone_call: { icon: FaPhoneAlt, label: 'שיחה טלפונית' }
};

const providerTypeConfig = {
  individual: { icon: FaUserMd, label: 'עצמאי' },
  clinic: { icon: FaClinicMedical, label: 'מרפאה' },
  company: { icon: FaBriefcase, label: 'חברה' }
};

const categories = [
  { id: 'nursing', name: 'סיעוד' },
  { id: 'physiotherapy', name: 'פיזיותרפיה' },
  { id: 'doctor', name: 'רופא בבית' },
  { id: 'eldercare', name: 'טיפול בקשישים' },
  { id: 'therapy', name: 'ריפוי בעיסוק' },
  { id: 'alternative', name: 'רפואה משלימה' }
];

const ratingOptions = [
  { value: 4.5, label: '4.5+ כוכבים' },
  { value: 4.0, label: '4.0+ כוכבים' },
  { value: 3.5, label: '3.5+ כוכבים' },
  { value: 3.0, label: '3.0+ כוכבים' }
];

const experienceOptions = [
  { value: 1, label: 'שנה+' },
  { value: 3, label: '3 שנים+' },
  { value: 5, label: '5 שנים+' },
  { value: 10, label: '10 שנים+' }
];

const radiusOptions = [
  { value: 5, label: '5 ק"מ' },
  { value: 10, label: '10 ק"מ' },
  { value: 25, label: '25 ק"מ' },
  { value: 50, label: '50 ק"מ' },
  { value: 100, label: '100 ק"מ' }
];

const cities = ['תל אביב', 'ירושלים', 'חיפה', 'באר שבע', 'רמת גן', 'הרצליה', 'פתח תקווה', 'נתניה', 'אשדוד', 'ראשון לציון'];

const AdvancedFilters = ({ filters, onFilterChange, onApply, onReset, showMobile = false, onClose }) => {
  const [expandedSections, setExpandedSections] = useState({
    location: true,
    category: true,
    serviceType: false,
    providerType: false,
    rating: false,
    experience: false,
    badges: false
  });
  const [gettingLocation, setGettingLocation] = useState(false);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getMyLocation = () => {
    if (!navigator.geolocation) {
      alert('הדפדפן שלך לא תומך באיתור מיקום');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onFilterChange({
          ...filters,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          useMyLocation: true
        });
        setGettingLocation(false);
      },
      (error) => {
        console.error('Location error:', error);
        alert('לא הצלחנו לאתר את המיקום שלך');
        setGettingLocation(false);
      }
    );
  };

  const clearLocation = () => {
    onFilterChange({
      ...filters,
      latitude: null,
      longitude: null,
      useMyLocation: false,
      radius: null
    });
  };

  const FilterSection = ({ title, icon: Icon, sectionKey, children }) => (
    <div className="border-b border-carelink-teal-pale/50 last:border-0">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between py-3 px-4 hover:bg-carelink-teal-pale/10 transition"
      >
        <div className="flex items-center gap-2 font-semibold text-carelink-navy">
          <Icon className="text-carelink-teal" />
          {title}
        </div>
        {expandedSections[sectionKey] ? <FaChevronUp className="text-carelink-gray" /> : <FaChevronDown className="text-carelink-gray" />}
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
        </div>
        {showMobile && (
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <FaTimes />
          </button>
        )}
      </div>

      {/* Location Filter */}
      <FilterSection title="מיקום" icon={FaMapMarkerAlt} sectionKey="location">
        <div className="space-y-3">
          {/* My Location Button */}
          <button
            onClick={getMyLocation}
            disabled={gettingLocation}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition ${
              filters.useMyLocation
                ? 'bg-carelink-teal text-white'
                : 'bg-carelink-teal-pale/30 text-carelink-navy hover:bg-carelink-teal-pale'
            }`}
          >
            <FaCrosshairs className={gettingLocation ? 'animate-spin' : ''} />
            {gettingLocation ? 'מאתר...' : filters.useMyLocation ? 'המיקום שלי (פעיל)' : 'המיקום שלי'}
          </button>

          {filters.useMyLocation && (
            <button
              onClick={clearLocation}
              className="text-sm text-carelink-teal hover:underline"
            >
              נקה מיקום
            </button>
          )}

          {/* Radius */}
          {filters.useMyLocation && (
            <div>
              <label className="block text-sm font-medium text-carelink-navy mb-2">רדיוס חיפוש</label>
              <div className="flex flex-wrap gap-2">
                {radiusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => onFilterChange({ ...filters, radius: option.value })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      filters.radius === option.value
                        ? 'bg-carelink-teal text-white'
                        : 'bg-carelink-teal-pale/30 text-carelink-navy hover:bg-carelink-teal-pale'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* City Select */}
          <div>
            <label className="block text-sm font-medium text-carelink-navy mb-2">או בחר עיר</label>
            <select
              value={filters.city || ''}
              onChange={(e) => onFilterChange({ ...filters, city: e.target.value || null })}
              className="w-full px-4 py-2 rounded-xl border-2 border-carelink-teal-pale focus:border-carelink-teal focus:outline-none"
            >
              <option value="">כל הערים</option>
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>
      </FilterSection>

      {/* Category Filter */}
      <FilterSection title="קטגוריה" icon={FaBriefcase} sectionKey="category">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onFilterChange({ 
                ...filters, 
                category: filters.category === cat.id ? null : cat.id 
              })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
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
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(serviceTypeConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <button
                key={key}
                onClick={() => onFilterChange({ 
                  ...filters, 
                  serviceType: filters.serviceType === key ? null : key 
                })}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition ${
                  filters.serviceType === key
                    ? 'bg-carelink-teal text-white'
                    : 'bg-carelink-teal-pale/30 text-carelink-navy hover:bg-carelink-teal-pale'
                }`}
              >
                <Icon />
                {config.label}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Provider Type Filter */}
      <FilterSection title="סוג נותן שירות" icon={FaUserMd} sectionKey="providerType">
        <div className="flex flex-wrap gap-2">
          {Object.entries(providerTypeConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <button
                key={key}
                onClick={() => onFilterChange({ 
                  ...filters, 
                  providerType: filters.providerType === key ? null : key 
                })}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition ${
                  filters.providerType === key
                    ? 'bg-carelink-teal text-white'
                    : 'bg-carelink-teal-pale/30 text-carelink-navy hover:bg-carelink-teal-pale'
                }`}
              >
                <Icon />
                {config.label}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Rating Filter */}
      <FilterSection title="דירוג מינימלי" icon={FaStar} sectionKey="rating">
        <div className="flex flex-wrap gap-2">
          {ratingOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onFilterChange({ 
                ...filters, 
                minRating: filters.minRating === option.value ? null : option.value 
              })}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                filters.minRating === option.value
                  ? 'bg-yellow-500 text-white'
                  : 'bg-carelink-teal-pale/30 text-carelink-navy hover:bg-carelink-teal-pale'
              }`}
            >
              <FaStar className="text-xs" />
              {option.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Experience Filter */}
      <FilterSection title="ותק" icon={FaClock} sectionKey="experience">
        <div className="flex flex-wrap gap-2">
          {experienceOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onFilterChange({ 
                ...filters, 
                minExperience: filters.minExperience === option.value ? null : option.value 
              })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                filters.minExperience === option.value
                  ? 'bg-carelink-teal text-white'
                  : 'bg-carelink-teal-pale/30 text-carelink-navy hover:bg-carelink-teal-pale'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Badges Filter */}
      <FilterSection title="תגיות" icon={FaAward} sectionKey="badges">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onFilterChange({ ...filters, verifiedOnly: !filters.verifiedOnly })}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition ${
              filters.verifiedOnly
                ? 'bg-carelink-teal text-white'
                : 'bg-carelink-teal-pale/30 text-carelink-navy hover:bg-carelink-teal-pale'
            }`}
          >
            <FaCheckCircle />
            מאומתים בלבד
          </button>
          <button
            onClick={() => onFilterChange({ ...filters, recommendedOnly: !filters.recommendedOnly })}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition ${
              filters.recommendedOnly
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                : 'bg-carelink-teal-pale/30 text-carelink-navy hover:bg-carelink-teal-pale'
            }`}
          >
            <FaAward />
            מומלצים בלבד
          </button>
        </div>
      </FilterSection>

      {/* Action Buttons */}
      <div className="p-4 bg-gray-50 flex gap-3">
        <button
          onClick={onReset}
          className="flex-1 py-3 rounded-xl border-2 border-carelink-teal-pale text-carelink-navy font-semibold hover:bg-carelink-teal-pale/30 transition"
        >
          נקה הכל
        </button>
        <button
          onClick={onApply}
          className="flex-1 py-3 rounded-xl bg-carelink-teal text-white font-semibold hover:bg-carelink-teal-medium transition"
        >
          החל סינון
        </button>
      </div>
    </div>
  );
};

export default AdvancedFilters;
