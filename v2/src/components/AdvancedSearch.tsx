"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search, MapPin, Navigation, X, Crosshair, Loader2,
  Stethoscope, ChevronDown,
} from "lucide-react";
import { israeliRegions, popularSearches, radiusOptions } from "@/data/searchData";

interface AdvancedSearchProps {
  defaultTab?: "providers" | "services";
  className?: string;
  compact?: boolean;
  /** When true, tabs and quick regions are hidden */
  inline?: boolean;
  /** Pre-fill search query */
  initialSearch?: string;
  /** Pre-fill location */
  initialCity?: string;
}

interface Profession {
  profession_id: string;
  name: string;
}

export default function AdvancedSearch({
  defaultTab = "providers",
  className = "",
  compact = false,
  inline = false,
  initialSearch = "",
  initialCity = "",
}: AdvancedSearchProps) {
  const router = useRouter();
  const [searchTab, setSearchTab] = useState(defaultTab);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [professionQuery, setProfessionQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState(initialCity);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedRadius, setSelectedRadius] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  // Dropdown states
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showProfessionDropdown, setShowProfessionDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // Professions from API
  const [professions, setProfessions] = useState<Profession[]>([]);

  const searchRef = useRef<HTMLDivElement>(null);
  const professionRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);

  // Fetch professions
  useEffect(() => {
    api.get<{ professions: Profession[] }>("/professions")
      .then((data) => {
        const profs = data.professions || [];
        if (profs.length > 0) setProfessions(profs);
      })
      .catch(() => {});
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearchDropdown(false);
      if (professionRef.current && !professionRef.current.contains(e.target as Node)) setShowProfessionDropdown(false);
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) setShowLocationDropdown(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // All cities from regions
  const allCities = israeliRegions.flatMap((r) => r.cities);
  const filteredCities = locationQuery ? allCities.filter((c) => c.includes(locationQuery)).slice(0, 8) : [];

  // Filtered popular searches
  const suggestions = (popularSearches[searchTab] || [])
    .filter((s) => !searchQuery || s.includes(searchQuery))
    .slice(0, 6);

  // Filtered professions
  const filteredProfessions = professions
    .filter((p) => !professionQuery || p.name.includes(professionQuery))
    .slice(0, 8);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("הדפדפן שלך לא תומך באיתור מיקום");
      return;
    }
    setIsLocating(true);
    setShowLocationDropdown(false);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation({ lat, lng });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=he`
          );
          const data = await res.json();
          const city =
            data.address?.city || data.address?.town || data.address?.village || "המיקום שלי";
          setLocationQuery(city);
        } catch {
          setLocationQuery("המיקום שלי");
        }
        setSelectedRadius("10");
        setIsLocating(false);
      },
      () => {
        alert("לא הצלחנו לזהות את המיקום");
        setIsLocating(false);
      }
    );
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (professionQuery) params.set("category", professionQuery);
    if (locationQuery && !userLocation) params.set("city", locationQuery);
    if (userLocation) {
      params.set("latitude", String(userLocation.lat));
      params.set("longitude", String(userLocation.lng));
      if (selectedRadius) params.set("radius_km", selectedRadius);
    }
    const target = searchTab === "services" ? "/services" : "/providers";
    router.push(`${target}?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const selectCity = (city: string) => {
    setLocationQuery(city);
    setUserLocation(null);
    setSelectedRadius("");
    setShowLocationDropdown(false);
  };

  const selectRegion = (region: (typeof israeliRegions)[0]) => {
    setLocationQuery(region.cities[0] || region.name);
    setUserLocation({ lat: region.lat, lng: region.lng });
    setSelectedRadius("25");
    setShowLocationDropdown(false);
  };

  const selectProfession = (name: string) => {
    setProfessionQuery(name);
    setShowProfessionDropdown(false);
  };

  const showTabs = !compact && !inline;
  const showQuickRegions = !compact && !inline && !userLocation && !locationQuery;

  return (
    <div className={`bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-100 p-4 md:p-6 ${className}`}>
      {/* Tabs */}
      {showTabs && (
        <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-xl w-fit">
          {(["providers", "services"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSearchTab(tab)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                searchTab === tab
                  ? "bg-carefd-teal text-white shadow-md"
                  : "text-carefd-slate hover:text-carefd-navy"
              }`}
              data-testid={`tab-${tab}`}
            >
              {tab === "providers" ? "מטפלים" : "שירותים"}
            </button>
          ))}
        </div>
      )}

      {/* Search Fields Row */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Field 1: Category / Provider Name Search */}
        <div className="relative flex-1 min-w-0" ref={searchRef}>
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-carefd-gray pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder={
              searchTab === "providers"
                ? "קטגוריה, שם מטפל, התמחות..."
                : "שם שירות, סוג טיפול..."
            }
            className="ps-12 h-14 border-2 border-slate-200 focus:border-carefd-teal bg-white rounded-xl"
            data-testid="search-input"
          />

          {/* Search Suggestions Dropdown */}
          {showSearchDropdown && suggestions.length > 0 && (
            <div className="absolute top-full mt-2 start-0 end-0 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-30 max-h-64 overflow-y-auto">
              <p className="px-4 py-1.5 text-xs text-carefd-gray font-semibold">חיפושים נפוצים</p>
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSearchQuery(s);
                    setShowSearchDropdown(false);
                  }}
                  className="w-full text-start px-4 py-2.5 text-sm text-carefd-navy hover:bg-carefd-teal/5 transition-colors flex items-center gap-3"
                >
                  <Search className="w-3.5 h-3.5 text-carefd-gray" />
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Field 2: Profession */}
        <div className="relative lg:w-56" ref={professionRef}>
          <Stethoscope className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-carefd-gray pointer-events-none" />
          <Input
            value={professionQuery}
            onChange={(e) => {
              setProfessionQuery(e.target.value);
              setShowProfessionDropdown(true);
            }}
            onFocus={() => setShowProfessionDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder="מקצוע"
            className="ps-12 h-14 border-2 border-slate-200 focus:border-carefd-teal bg-white rounded-xl"
            data-testid="profession-input"
          />

          {/* Profession Dropdown */}
          {showProfessionDropdown && filteredProfessions.length > 0 && (
            <div className="absolute top-full mt-2 start-0 end-0 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-30 max-h-64 overflow-y-auto">
              <p className="px-4 py-1.5 text-xs text-carefd-gray font-semibold">מקצועות</p>
              {filteredProfessions.map((p) => (
                <button
                  key={p.profession_id}
                  onClick={() => selectProfession(p.name)}
                  className={`w-full text-start px-4 py-2.5 text-sm hover:bg-carefd-teal/5 transition-colors flex items-center gap-3 ${
                    professionQuery === p.name ? "text-carefd-teal font-medium" : "text-carefd-navy"
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5 text-carefd-gray" />
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Field 3: Location + GPS */}
        <div className="relative lg:w-64" ref={locationRef}>
          <MapPin className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-carefd-gray pointer-events-none" />
          <Input
            value={locationQuery}
            onChange={(e) => {
              setLocationQuery(e.target.value);
              setUserLocation(null);
              setShowLocationDropdown(true);
            }}
            onFocus={() => setShowLocationDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder="עיר או אזור"
            className="ps-12 pe-12 h-14 border-2 border-slate-200 focus:border-carefd-teal bg-white rounded-xl"
            data-testid="location-input"
          />
          {/* GPS button */}
          <button
            onClick={handleGetLocation}
            className="absolute end-3 top-1/2 -translate-y-1/2 p-1.5 text-carefd-teal hover:bg-carefd-teal/10 rounded-lg transition-colors"
            title="המיקום שלי"
            aria-label="זהה מיקום"
            data-testid="gps-btn"
          >
            {isLocating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Navigation className="w-5 h-5" />
            )}
          </button>

          {/* Location Dropdown */}
          {showLocationDropdown && (
            <div className="absolute top-full mt-2 start-0 end-0 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-30 max-h-80 overflow-y-auto">
              {/* GPS Option at top */}
              <button
                onClick={handleGetLocation}
                className="w-full text-start px-4 py-3 text-sm text-carefd-teal hover:bg-carefd-teal/5 transition-colors flex items-center gap-3 border-b border-slate-100 font-medium"
              >
                <Crosshair className="w-4 h-4" />
                השתמש במיקום שלי
                {isLocating && <Loader2 className="w-4 h-4 animate-spin ms-auto" />}
              </button>

              {/* Regions (when empty) */}
              {!locationQuery && (
                <>
                  <p className="px-4 py-1.5 text-xs text-carefd-gray font-semibold mt-1">אזורים</p>
                  <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                    {israeliRegions.map((r) => (
                      <button key={r.id} onClick={() => selectRegion(r)}>
                        <Badge
                          variant="teal"
                          className="cursor-pointer hover:bg-carefd-teal/20 transition-colors"
                        >
                          {r.name}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Filtered cities */}
              {filteredCities.length > 0 && (
                <>
                  <p className="px-4 py-1.5 text-xs text-carefd-gray font-semibold">ערים</p>
                  {filteredCities.map((c) => (
                    <button
                      key={c}
                      onClick={() => selectCity(c)}
                      className="w-full text-start px-4 py-2.5 text-sm text-carefd-navy hover:bg-carefd-teal/5 transition-colors flex items-center gap-3"
                    >
                      <MapPin className="w-3.5 h-3.5 text-carefd-gray" />
                      {c}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          className="h-14 px-8 rounded-xl text-base font-semibold shadow-md hover:shadow-lg transition-all"
          data-testid="search-btn"
        >
          <Search className="w-5 h-5 me-2" />
          חיפוש
        </Button>
      </div>

      {/* Radius selector (when location detected) */}
      {userLocation && (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 flex-wrap">
          <span className="text-sm text-carefd-gray font-medium">רדיוס חיפוש:</span>
          {radiusOptions.map((r) => (
            <button
              key={r.value}
              onClick={() => setSelectedRadius(r.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedRadius === r.value
                  ? "bg-carefd-teal text-white shadow-sm"
                  : "bg-slate-100 text-carefd-slate hover:bg-slate-200"
              }`}
              data-testid={`radius-${r.value}`}
            >
              {r.label}
            </button>
          ))}
          <button
            onClick={() => {
              setUserLocation(null);
              setLocationQuery("");
              setSelectedRadius("");
            }}
            className="text-xs text-carefd-gray hover:text-red-500 ms-2 p-1"
            aria-label="נקה מיקום"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick region tags */}
      {showQuickRegions && (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-xs text-carefd-gray">אזורים מובילים:</span>
          {israeliRegions.map((r) => (
            <button
              key={r.id}
              onClick={() => selectRegion(r)}
              className="text-xs text-carefd-slate hover:text-carefd-teal transition-colors"
            >
              {r.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
