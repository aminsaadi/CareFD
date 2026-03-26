import React, { useState, useEffect } from 'react';
import {
  FaFilter, FaTimes, FaMapMarkerAlt, FaCrosshairs, FaStar,
  FaUserMd, FaBriefcase, FaHome, FaVideo, FaClinicMedical, FaPhoneAlt,
  FaCheckCircle, FaAward, FaClock, FaChevronDown, FaChevronUp
} from 'react-icons/fa';
import api from '../utils/api';

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

import CitySelect from './CitySelect';

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
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/professions');
        const profs = response.data.professions || [];
        setCategories(profs.map(p => ({
          id: p.profession_id,
          name: p.name
        })));
      } catch (err) {
        // Fallback to defaults if API fails
        setCategories([
          { id: 'nursing', name: 'סיעוד' },
          { id: 'physiotherapy', name: 'פיזיותרפיה' },
          { id: 'doctor', name: 'רופא בבית' },
          { id: 'eldercare', name: 'טיפול בקשישים' },
          { id: 'therapy', name: 'ריפוי בעיסוק' },
          { id: 'alternative', name: 'רפואה משלימה' }
        ]);
      }
    };
    fetchCategories();
  }, []);

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
          useMyLocation: true,
          city: null,
          radius: filters.radius || 10
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
    <div className="border-b border-carefd-teal-pale/50 last:border-0">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between py-3 px-4 hover:bg-carefd-teal-pale/10 transition"
      >
        <div className="flex items-center gap-2 font-semibold text-carefd-navy">
          <Icon className="text-carefd-teal" />
          {title}
        </div>
        {expandedSections[sectionKey] ? <FaChevronUp className="text-carefd-gray" /> : <FaChevronDown className="text-carefd-gray" />}
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
      <div className="bg-carefd-navy text-white p-4 flex items-center justify-between">
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
                ? 'bg-carefd-teal text-white'
                : 'bg-carefd-teal-pale/30 text-carefd-navy hover:bg-carefd-teal-pale'
            }`}
          >
            <FaCrosshairs className={gettingLocation ? 'animate-spin' : ''} />
            {gettingLocation ? 'מאתר...' : filters.useMyLocation ? 'המיקום שלי (פעיל)' : 'המיקום שלי'}
          </button>

          {filters.useMyLocation && (
            <button
              onClick={clearLocation}
              className="text-sm text-carefd-teal hover:underline"
            >
              נקה מיקום
            </button>
          )}

          {/* Radius */}
          {filters.useMyLocation && (
            <div>
              <label className="block text-sm font-medium text-carefd-navy mb-2">רדיוס חיפוש</label>
              <div className="flex flex-wrap gap-2">
                {radiusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => onFilterChange({ ...filters, radius: option.value })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      filters.radius === option.value
                        ? 'bg-carefd-teal text-white'
                        : 'bg-carefd-teal-pale/30 text-carefd-navy hover:bg-carefd-teal-pale'
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
            <label className="block text-sm font-medium text-carefd-navy mb-2">או בחר עיר</label>
            <CitySelect
              name="city"
              value={filters.city || ''}
              onChange={(e) => onFilterChange({ ...filters, city: e.target.value || null, latitude: null, longitude: null, useMyLocation: false, radius: null })}
              placeholder="כל הערים"
              inputClassName="w-full px-4 py-2 rounded-xl border-2 border-carefd-teal-pale focus:border-carefd-teal focus:outline-none"
            />
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
                  ? 'bg-carefd-teal text-white'
                  : 'bg-carefd-teal-pale/30 text-carefd-navy hover:bg-carefd-teal-pale'
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
                    ? 'bg-carefd-teal text-white'
                    : 'bg-carefd-teal-pale/30 text-carefd-navy hover:bg-carefd-teal-pale'
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
                    ? 'bg-carefd-teal text-white'
                    : 'bg-carefd-teal-pale/30 text-carefd-navy hover:bg-carefd-teal-pale'
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
                  : 'bg-carefd-teal-pale/30 text-carefd-navy hover:bg-carefd-teal-pale'
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
                  ? 'bg-carefd-teal text-white'
                  : 'bg-carefd-teal-pale/30 text-carefd-navy hover:bg-carefd-teal-pale'
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
                ? 'bg-carefd-teal text-white'
                : 'bg-carefd-teal-pale/30 text-carefd-navy hover:bg-carefd-teal-pale'
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
                : 'bg-carefd-teal-pale/30 text-carefd-navy hover:bg-carefd-teal-pale'
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
          className="flex-1 py-3 rounded-xl border-2 border-carefd-teal-pale text-carefd-navy font-semibold hover:bg-carefd-teal-pale/30 transition"
        >
          נקה הכל
        </button>
        <button
          onClick={onApply}
          className="flex-1 py-3 rounded-xl bg-carefd-teal text-white font-semibold hover:bg-carefd-teal-medium transition"
        >
          החל סינון
        </button>
      </div>
    </div>
  );
};

export default AdvancedFilters;
