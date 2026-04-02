"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Navigation, ChevronLeft, X } from "lucide-react";
import { israeliRegions, popularSearches, radiusOptions } from "@/data/searchData";

interface AdvancedSearchProps {
  defaultTab?: "providers" | "services";
  className?: string;
  compact?: boolean;
}

export default function AdvancedSearch({ defaultTab = "providers", className = "", compact = false }: AdvancedSearchProps) {
  const router = useRouter();
  const [searchTab, setSearchTab] = useState(defaultTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedRadius, setSelectedRadius] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearchDropdown(false);
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) setShowLocationDropdown(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // All cities from regions
  const allCities = israeliRegions.flatMap((r) => r.cities);
  const filteredCities = locationQuery ? allCities.filter((c) => c.includes(locationQuery)).slice(0, 8) : [];

  // Filtered popular searches
  const suggestions = (popularSearches[searchTab] || []).filter((s) =>
    !searchQuery || s.includes(searchQuery)
  ).slice(0, 6);

  const handleGetLocation = () => {
    if (!navigator.geolocation) { alert("הדפדפן שלך לא תומך באיתור מיקום"); return; }
    setIsLocating(true);
    setShowLocationDropdown(false);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation({ lat, lng });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=he`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || "המיקום שלי";
          setLocationQuery(city);
        } catch {
          setLocationQuery("המיקום שלי");
        }
        setIsLocating(false);
      },
      () => { alert("לא הצלחנו לזהות את המיקום"); setIsLocating(false); }
    );
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (locationQuery && !userLocation) params.set("city", locationQuery);
    if (userLocation) {
      params.set("latitude", String(userLocation.lat));
      params.set("longitude", String(userLocation.lng));
      if (selectedRadius) params.set("radius_km", selectedRadius);
    }
    const target = searchTab === "services" ? "/services" : "/providers";
    router.push(`${target}?${params.toString()}`);
  };

  const selectCity = (city: string) => {
    setLocationQuery(city);
    setUserLocation(null);
    setSelectedRadius("");
    setShowLocationDropdown(false);
  };

  const selectRegion = (region: typeof israeliRegions[0]) => {
    setLocationQuery(region.cities[0] || region.name);
    setUserLocation({ lat: region.lat, lng: region.lng });
    setSelectedRadius("25");
    setShowLocationDropdown(false);
  };

  return (
    <div className={`glass-card p-4 md:p-5 ${className}`}>
      {/* Tabs */}
      {!compact && (
        <div className="flex gap-2 mb-4">
          {(["providers", "services"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSearchTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                searchTab === tab
                  ? "bg-carefd-teal text-white shadow-glow"
                  : "bg-white text-carefd-slate hover:bg-carefd-teal/5"
              }`}
              data-testid={`tab-${tab}`}
            >
              {tab === "providers" ? "מטפלים" : "שירותים"}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1" ref={searchRef}>
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-carefd-gray" />
          <Input
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowSearchDropdown(true); }}
            onFocus={() => setShowSearchDropdown(true)}
            placeholder={searchTab === "providers" ? "מקצוע, שם מטפל..." : "שם שירות, סוג טיפול..."}
            className="ps-12 h-14 border-0 bg-white/80"
            data-testid="search-input"
          />

          {/* Search dropdown */}
          {showSearchDropdown && suggestions.length > 0 && (
            <div className="absolute top-full mt-2 start-0 end-0 bg-white rounded-xl shadow-soft-lg border border-slate-100 py-2 z-20 animate-scale-in">
              <p className="px-4 py-1 text-xs text-carefd-gray font-medium">חיפושים פופולריים</p>
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => { setSearchQuery(s); setShowSearchDropdown(false); }}
                  className="w-full text-start px-4 py-2.5 text-sm text-carefd-navy hover:bg-carefd-teal/5 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Location input */}
        <div className="relative md:w-64" ref={locationRef}>
          <MapPin className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-carefd-gray" />
          <Input
            value={locationQuery}
            onChange={(e) => { setLocationQuery(e.target.value); setUserLocation(null); setShowLocationDropdown(true); }}
            onFocus={() => setShowLocationDropdown(true)}
            placeholder="עיר או אזור"
            className="ps-12 pe-12 h-14 border-0 bg-white/80"
            data-testid="location-input"
          />
          {/* GPS button */}
          <button
            onClick={handleGetLocation}
            className="absolute end-3 top-1/2 -translate-y-1/2 p-1.5 text-carefd-teal hover:bg-carefd-teal/10 rounded-lg transition-colors"
            title="זהה מיקום"
            data-testid="gps-btn"
          >
            {isLocating ? (
              <span className="animate-spin block rounded-full h-5 w-5 border-2 border-carefd-teal/30 border-t-carefd-teal" />
            ) : (
              <Navigation className="w-5 h-5" />
            )}
          </button>

          {/* Location dropdown */}
          {showLocationDropdown && (
            <div className="absolute top-full mt-2 start-0 end-0 bg-white rounded-xl shadow-soft-lg border border-slate-100 py-2 z-20 animate-scale-in max-h-80 overflow-y-auto">
              {/* Regions */}
              {!locationQuery && (
                <>
                  <p className="px-4 py-1 text-xs text-carefd-gray font-medium">אזורים</p>
                  <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                    {israeliRegions.map((r) => (
                      <button key={r.id} onClick={() => selectRegion(r)}>
                        <Badge variant="teal" className="cursor-pointer hover:bg-carefd-teal/20 transition-colors">
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
                  <p className="px-4 py-1 text-xs text-carefd-gray font-medium">ערים</p>
                  {filteredCities.map((c) => (
                    <button
                      key={c}
                      onClick={() => selectCity(c)}
                      className="w-full text-start px-4 py-2.5 text-sm text-carefd-navy hover:bg-carefd-teal/5 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 inline me-2 text-carefd-gray" />
                      {c}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Search button */}
        <Button onClick={handleSearch} className="h-14 px-8" data-testid="search-btn">
          <Search className="w-5 h-5 me-2" />
          חיפוש
        </Button>
      </div>

      {/* Radius selector (shown when location detected) */}
      {userLocation && (
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-xs text-carefd-gray">רדיוס:</span>
          {radiusOptions.map((r) => (
            <button
              key={r.value}
              onClick={() => setSelectedRadius(r.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                selectedRadius === r.value
                  ? "bg-carefd-teal text-white shadow-glow"
                  : "bg-white text-carefd-slate border border-slate-200 hover:border-carefd-teal"
              }`}
              data-testid={`radius-${r.value}`}
            >
              {r.label}
            </button>
          ))}
          <button onClick={() => { setUserLocation(null); setLocationQuery(""); setSelectedRadius(""); }} className="text-xs text-carefd-gray hover:text-red-500 ms-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Quick region tags (when no location selected) */}
      {!compact && !userLocation && !locationQuery && (
        <div className="flex flex-wrap gap-2 mt-3">
          {israeliRegions.slice(0, 5).map((r) => (
            <button key={r.id} onClick={() => selectRegion(r)} className="text-xs text-carefd-slate hover:text-carefd-teal transition-colors">
              {r.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
