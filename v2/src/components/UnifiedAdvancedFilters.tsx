"use client";

import { useState, useRef, useEffect } from "react";
import {
  Filter, X, MapPin, Crosshair, Star, Briefcase, Home, Video,
  Building2, PhoneCall, Clock, Package, UserCheck, Award,
  ChevronDown, ChevronUp, Search, Globe, Hospital, Users,
  Loader2, CheckCircle2, Coins,
} from "lucide-react";
import {
  israeliRegions, serviceTypes, languageOptions, healthFunds, genderOptions,
} from "@/data/searchData";
import api from "@/lib/api-client";

const serviceTypeIcons: Record<string, typeof Home> = {
  home_visit: Home, clinic_visit: Building2, video_call: Video,
  phone_call: PhoneCall, hourly: Clock, product: Package,
};

const ratingOptions = [
  { value: 4.5, label: "4.5+ כוכבים" },
  { value: 4.0, label: "4.0+ כוכבים" },
  { value: 3.5, label: "3.5+ כוכבים" },
  { value: 3.0, label: "3.0+ כוכבים" },
];

export interface Filters {
  search: string;
  city: string;
  region: string;
  category: string;
  specialization: string;
  serviceType: string;
  providerType: string;
  minRating: number | null;
  minExperience: number | null;
  verifiedOnly: boolean;
  recommendedOnly: boolean;
  gender: string;
  languages: string[];
  healthFunds: string[];
  priceMin: string;
  priceMax: string;
  latitude: number | null;
  longitude: number | null;
  radius: number | null;
  useMyLocation: boolean;
  profession: string;
}

// Keep backward compat
export type ProviderFilters = Filters;

interface UnifiedAdvancedFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  onReset: () => void;
  showMobile?: boolean;
  onClose?: () => void;
  resultsCount?: number;
  /** Controls which filter sections are shown */
  pageType?: "providers" | "services";
}

export default function UnifiedAdvancedFilters({
  filters,
  onFilterChange,
  onReset,
  showMobile = false,
  onClose,
  resultsCount = 0,
  pageType = "providers",
}: UnifiedAdvancedFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    location: true,
    category: true,
    serviceType: pageType === "services",
    profession: false,
    gender: false,
    languages: false,
    healthFunds: false,
    price: pageType === "services",
    rating: false,
    badges: false,
  });

  const [serviceCategories, setServiceCategories] = useState<{ id: string; name: string }[]>([]);
  const [locationSearch, setLocationSearch] = useState("");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<{ professions: { profession_id: string; name: string }[] }>("/professions")
      .then((data) => {
        const profs = data.professions || [];
        if (profs.length > 0) setServiceCategories(profs.map((p) => ({ id: p.profession_id, name: p.name })));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node) &&
        locationInputRef.current && !locationInputRef.current.contains(event.target as Node)
      ) setShowLocationDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) { alert("הדפדפן שלך לא תומך באיתור מיקום"); return; }
    setIsLocating(true);
    setShowLocationDropdown(false);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=he`);
          const data = await response.json();
          const cityName = data.address?.city || data.address?.town || data.address?.village || "המיקום שלי";
          setLocationSearch(cityName);
          onFilterChange({ ...filters, city: cityName, region: "", latitude: lat, longitude: lng, useMyLocation: true, radius: filters.radius || 10 });
        } catch {
          setLocationSearch("המיקום שלי");
          onFilterChange({ ...filters, city: "המיקום שלי", region: "", latitude: lat, longitude: lng, useMyLocation: true, radius: filters.radius || 10 });
        }
        setIsLocating(false);
      },
      () => { alert("לא הצלחנו לאתר את המיקום שלך"); setIsLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const getFilteredCities = () => {
    if (!locationSearch.trim()) return [];
    const allCities: { name: string; region: string }[] = [];
    israeliRegions.forEach((region) => {
      region.cities.forEach((city) => {
        if (city.includes(locationSearch)) allCities.push({ name: city, region: region.name });
      });
    });
    return allCities.slice(0, 8);
  };
  const filteredCities = getFilteredCities();

  const activeFiltersCount = [
    filters.city, filters.region, filters.category, filters.serviceType,
    filters.profession, filters.gender, filters.minRating,
    filters.verifiedOnly, filters.recommendedOnly,
    (filters.languages?.length || 0) > 0, (filters.healthFunds?.length || 0) > 0,
    filters.priceMin, filters.priceMax,
  ].filter(Boolean).length;

  const FilterSection = ({ title, icon: Icon, sectionKey, children }: {
    title: string; icon: typeof Home; sectionKey: string; children: React.ReactNode;
  }) => (
    <div className="border-b border-carefd-teal-pale/50 last:border-0">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between py-3 px-4 hover:bg-carefd-teal-pale/10 transition"
      >
        <div className="flex items-center gap-2 font-semibold text-carefd-navy text-sm">
          <Icon className="w-4 h-4 text-carefd-teal" />
          {title}
        </div>
        {expandedSections[sectionKey] ? <ChevronUp className="w-3 h-3 text-carefd-gray" /> : <ChevronDown className="w-3 h-3 text-carefd-gray" />}
      </button>
      {expandedSections[sectionKey] && <div className="px-4 pb-4">{children}</div>}
    </div>
  );

  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden ${showMobile ? "fixed inset-0 z-50 overflow-y-auto" : ""}`}>
      {/* Header */}
      <div className="bg-carefd-navy text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <span className="font-bold">סינון מתקדם</span>
          {activeFiltersCount > 0 && (
            <span className="bg-carefd-teal text-white text-xs px-2 py-0.5 rounded-full">{activeFiltersCount}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onReset} className="text-sm text-carefd-teal-pale hover:text-white transition">נקה הכל</button>
          {showMobile && onClose && (
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded"><X className="w-4 h-4" /></button>
          )}
        </div>
      </div>

      {/* ===== LOCATION (both) ===== */}
      <FilterSection title="מיקום" icon={MapPin} sectionKey="location">
        <div className="space-y-3">
          <button
            onClick={handleGetLocation}
            disabled={isLocating}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition text-sm ${
              filters.useMyLocation ? "bg-carefd-teal text-white" : "bg-carefd-teal-pale/30 text-carefd-navy hover:bg-carefd-teal-pale"
            }`}
          >
            {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
            <span>המיקום שלי</span>
          </button>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-carefd-gray" />
            <input
              ref={locationInputRef}
              type="text"
              value={locationSearch}
              onChange={(e) => { setLocationSearch(e.target.value); setShowLocationDropdown(true); }}
              onFocus={() => setShowLocationDropdown(true)}
              placeholder="חפש עיר או אזור..."
              className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl focus:border-carefd-teal outline-none text-sm"
            />
            {showLocationDropdown && (
              <div ref={locationDropdownRef} className="absolute top-full right-0 left-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-64 overflow-y-auto">
                {!locationSearch && (
                  <>
                    <div className="p-2 border-b border-gray-100">
                      <span className="text-xs font-semibold text-carefd-gray px-2">אזורים</span>
                    </div>
                    <div className="p-1">
                      {israeliRegions.map((region) => (
                        <button key={region.id} type="button" onClick={() => {
                          setLocationSearch(region.name);
                          onFilterChange({ ...filters, region: region.name, city: "", latitude: region.lat, longitude: region.lng, radius: 25, useMyLocation: false });
                          setShowLocationDropdown(false);
                        }} className={`w-full text-right px-3 py-2 hover:bg-carefd-teal-pale/30 rounded-lg transition-colors flex items-center gap-2 text-sm ${filters.region === region.name ? "bg-carefd-teal text-white" : "text-carefd-navy"}`}>
                          <MapPin className="w-3 h-3" /><span>{region.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {locationSearch && filteredCities.length > 0 && (
                  <>
                    <div className="p-2 border-b border-gray-100"><span className="text-xs font-semibold text-carefd-gray px-2">ערים</span></div>
                    <div className="p-1">
                      {filteredCities.map((city, i) => (
                        <button key={i} type="button" onClick={() => {
                          setLocationSearch(city.name);
                          onFilterChange({ ...filters, city: city.name, region: "", useMyLocation: false });
                          setShowLocationDropdown(false);
                        }} className={`w-full text-right px-3 py-2 hover:bg-carefd-teal-pale/30 rounded-lg transition-colors flex items-center gap-2 text-sm ${filters.city === city.name ? "bg-carefd-teal text-white" : "text-carefd-navy"}`}>
                          <MapPin className="w-3 h-3" /><span>{city.name}</span>
                          <span className="text-xs text-carefd-gray me-auto">({city.region})</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {locationSearch && filteredCities.length === 0 && (
                  <div className="p-4 text-center text-carefd-gray text-sm">לא נמצאו תוצאות</div>
                )}
              </div>
            )}
          </div>
          {(filters.city || filters.region) && (
            <div className="flex items-center gap-2 bg-carefd-teal-pale/30 px-3 py-2 rounded-lg">
              <MapPin className="w-3.5 h-3.5 text-carefd-teal" />
              <span className="text-sm text-carefd-navy">{filters.city || filters.region}</span>
              <button onClick={() => { setLocationSearch(""); onFilterChange({ ...filters, city: "", region: "", latitude: null, longitude: null, radius: null, useMyLocation: false }); }} className="me-auto text-carefd-gray hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </FilterSection>

      {/* ===== CATEGORY (both) ===== */}
      <FilterSection title="קטגוריה" icon={Briefcase} sectionKey="category">
        <div className="grid grid-cols-2 gap-1.5">
          {serviceCategories.map((cat) => (
            <button key={cat.id} onClick={() => onFilterChange({ ...filters, category: filters.category === cat.id ? "" : cat.id })}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${filters.category === cat.id ? "bg-carefd-teal text-white" : "bg-carefd-teal-pale/30 text-carefd-navy hover:bg-carefd-teal-pale"}`}>
              {cat.name}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* ===== SERVICE TYPE (both) ===== */}
      <FilterSection title="סוג שירות" icon={Home} sectionKey="serviceType">
        <div className="space-y-1.5">
          {serviceTypes.map((type) => {
            const Icon = serviceTypeIcons[type.id] || Home;
            return (
              <button key={type.id} onClick={() => onFilterChange({ ...filters, serviceType: filters.serviceType === type.id ? "" : type.id })}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${filters.serviceType === type.id ? "bg-carefd-teal text-white" : "bg-carefd-teal-pale/30 text-carefd-navy hover:bg-carefd-teal-pale"}`}>
                <Icon className="w-3.5 h-3.5" />{type.name}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* ===== PRICE (both) ===== */}
      <FilterSection title="טווח מחירים" icon={Coins} sectionKey="price">
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-carefd-gray mb-1 block">מ-</label>
              <input type="number" placeholder="₪0" value={filters.priceMin || ""} onChange={(e) => onFilterChange({ ...filters, priceMin: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg focus:border-carefd-teal outline-none text-sm" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-carefd-gray mb-1 block">עד</label>
              <input type="number" placeholder="₪999" value={filters.priceMax || ""} onChange={(e) => onFilterChange({ ...filters, priceMax: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg focus:border-carefd-teal outline-none text-sm" />
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[{ min: "", max: "100", label: "עד ₪100" }, { min: "100", max: "300", label: "₪100-300" }, { min: "300", max: "500", label: "₪300-500" }, { min: "500", max: "", label: "₪500+" }].map((range, i) => (
              <button key={i} onClick={() => onFilterChange({ ...filters, priceMin: range.min, priceMax: range.max })}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${filters.priceMin === range.min && filters.priceMax === range.max ? "bg-carefd-teal text-white" : "bg-gray-100 text-carefd-navy hover:bg-gray-200"}`}>
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </FilterSection>

      {/* ===== RATING (both) ===== */}
      <FilterSection title="דירוג מינימלי" icon={Star} sectionKey="rating">
        <div className="space-y-1.5">
          {ratingOptions.map((option) => (
            <button key={option.value} onClick={() => onFilterChange({ ...filters, minRating: filters.minRating === option.value ? null : option.value })}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${filters.minRating === option.value ? "bg-carefd-teal text-white" : "bg-carefd-teal-pale/30 text-carefd-navy hover:bg-carefd-teal-pale"}`}>
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3 h-3 ${i < Math.floor(option.value) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                ))}
              </div>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </FilterSection>

      {/* ===== GENDER (both) ===== */}
      <FilterSection title="מגדר" icon={Users} sectionKey="gender">
          <div className="flex gap-2">
            {genderOptions.map((option) => (
              <button key={option.id} onClick={() => onFilterChange({ ...filters, gender: filters.gender === option.id ? "" : option.id })}
                className={`flex-1 flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${filters.gender === option.id ? "bg-carefd-teal text-white" : "bg-carefd-teal-pale/30 text-carefd-navy hover:bg-carefd-teal-pale"}`}>
                <Users className="w-4 h-4" />{option.name}
              </button>
            ))}
          </div>
        </FilterSection>

      {/* ===== LANGUAGES (both) ===== */}
      <FilterSection title="שפות" icon={Globe} sectionKey="languages">
        <div className="grid grid-cols-2 gap-1.5">
          {languageOptions.map((lang) => {
            const isSelected = filters.languages?.includes(lang.id);
            return (
              <button key={lang.id} onClick={() => {
                const current = filters.languages || [];
                const next = isSelected ? current.filter((l) => l !== lang.id) : [...current, lang.id];
                onFilterChange({ ...filters, languages: next });
              }} className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${isSelected ? "bg-carefd-teal text-white" : "bg-carefd-teal-pale/30 text-carefd-navy hover:bg-carefd-teal-pale"}`}>
                {lang.name}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* ===== HEALTH FUNDS (both) ===== */}
      <FilterSection title="קופות חולים" icon={Hospital} sectionKey="healthFunds">
          <div className="space-y-1.5">
            {healthFunds.map((fund) => {
              const isSelected = filters.healthFunds?.includes(fund.id);
              return (
                <button key={fund.id} onClick={() => {
                  const current = filters.healthFunds || [];
                  const next = isSelected ? current.filter((f) => f !== fund.id) : [...current, fund.id];
                  onFilterChange({ ...filters, healthFunds: next });
                }} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${isSelected ? "bg-carefd-teal text-white" : "bg-carefd-teal-pale/30 text-carefd-navy hover:bg-carefd-teal-pale"}`}>
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: fund.color }} />
                  {fund.name}
                  {isSelected && <CheckCircle2 className="w-3 h-3 me-auto" />}
                </button>
              );
            })}
          </div>
        </FilterSection>

      {/* ===== BADGES (both) ===== */}
      <FilterSection title="תגיות מיוחדות" icon={Award} sectionKey="badges">
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-carefd-teal-pale/20 transition">
            <input type="checkbox" checked={filters.verifiedOnly || false} onChange={(e) => onFilterChange({ ...filters, verifiedOnly: e.target.checked })} className="w-4 h-4 text-carefd-teal rounded border-gray-300 focus:ring-carefd-teal" />
            <UserCheck className="w-3.5 h-3.5 text-carefd-teal" />
            <span className="text-xs font-medium text-carefd-navy">מאומתים בלבד</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-carefd-teal-pale/20 transition">
            <input type="checkbox" checked={filters.recommendedOnly || false} onChange={(e) => onFilterChange({ ...filters, recommendedOnly: e.target.checked })} className="w-4 h-4 text-carefd-teal rounded border-gray-300 focus:ring-carefd-teal" />
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-medium text-carefd-navy">מומלצים בלבד</span>
          </label>
        </div>
      </FilterSection>

      {/* Mobile Apply Button */}
      {showMobile && (
        <div className="p-4 border-t border-carefd-teal-pale bg-white sticky bottom-0">
          <button onClick={onClose} className="w-full py-3 bg-carefd-teal text-white rounded-xl font-semibold">
            הצג תוצאות ({resultsCount})
          </button>
        </div>
      )}
    </div>
  );
}
