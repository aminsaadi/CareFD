"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Navigation, X } from "lucide-react";
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

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearchDropdown(false);
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) setShowLocationDropdown(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const allCities = israeliRegions.flatMap((r) => r.cities);
  const filteredCities = locationQuery ? allCities.filter((c) => c.includes(locationQuery)).slice(0, 8) : [];
  const suggestions = (popularSearches[searchTab] || []).filter((s) => !searchQuery || s.includes(searchQuery)).slice(0, 6);

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
    <div className={`glass-card p-3.5 md:p-4 ${className}`}>
      {!compact && (
        <div className="mb-3 flex gap-1 rounded-xl bg-slate-100/80 p-1 w-fit">
          {(["providers", "services"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSearchTab(tab)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${searchTab === tab ? "bg-white text-carefd-navy shadow-soft" : "text-slate-500 hover:text-carefd-navy"}`}
              data-testid={`tab-${tab}`}
              aria-pressed={searchTab === tab}
            >
              {tab === "providers" ? "מטפלים" : "שירותים"}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2.5 md:flex-row">
        <div className="relative flex-1" ref={searchRef}>
          <Search className="absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowSearchDropdown(true); }}
            onFocus={() => setShowSearchDropdown(true)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            placeholder={searchTab === "providers" ? "מקצוע, התמחות או שם מטפל" : "שירות או סוג טיפול"}
            className="h-14 border-slate-200 bg-white ps-12 shadow-none"
            data-testid="search-input"
            aria-label={searchTab === "providers" ? "חיפוש מטפל" : "חיפוש שירות"}
          />
          {showSearchDropdown && suggestions.length > 0 && (
            <div className="absolute start-0 end-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-slate-100 bg-white py-2 shadow-soft-lg animate-scale-in">
              <p className="px-4 py-1.5 text-xs font-medium text-slate-400">חיפושים נפוצים</p>
              {suggestions.map((s) => (
                <button key={s} onClick={() => { setSearchQuery(s); setShowSearchDropdown(false); }} className="w-full px-4 py-2.5 text-start text-sm text-carefd-navy transition-colors hover:bg-carefd-teal/5">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative md:w-64" ref={locationRef}>
          <MapPin className="absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <Input
            value={locationQuery}
            onChange={(e) => { setLocationQuery(e.target.value); setUserLocation(null); setShowLocationDropdown(true); }}
            onFocus={() => setShowLocationDropdown(true)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            placeholder="עיר או אזור"
            className="h-14 border-slate-200 bg-white ps-12 pe-12 shadow-none"
            data-testid="location-input"
            aria-label="עיר או אזור"
          />
          <button onClick={handleGetLocation} className="absolute end-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-carefd-teal transition-colors hover:bg-carefd-teal/10" title="איתור המיקום שלי" aria-label="איתור המיקום שלי" data-testid="gps-btn">
            {isLocating ? <span className="block h-5 w-5 animate-spin rounded-full border-2 border-carefd-teal/30 border-t-carefd-teal" /> : <Navigation className="h-5 w-5" />}
          </button>

          {showLocationDropdown && (
            <div className="absolute start-0 end-0 top-full z-20 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-slate-100 bg-white py-2 shadow-soft-lg animate-scale-in">
              {!locationQuery && (
                <>
                  <p className="px-4 py-1.5 text-xs font-medium text-slate-400">אזורים</p>
                  <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                    {israeliRegions.map((r) => (
                      <button key={r.id} onClick={() => selectRegion(r)}><Badge variant="teal" className="cursor-pointer transition-colors hover:bg-carefd-teal/20">{r.name}</Badge></button>
                    ))}
                  </div>
                </>
              )}
              {filteredCities.length > 0 && (
                <>
                  <p className="px-4 py-1.5 text-xs font-medium text-slate-400">ערים</p>
                  {filteredCities.map((c) => (
                    <button key={c} onClick={() => selectCity(c)} className="w-full px-4 py-2.5 text-start text-sm text-carefd-navy transition-colors hover:bg-carefd-teal/5">
                      <MapPin className="me-2 inline h-3.5 w-3.5 text-slate-400" />{c}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <Button onClick={handleSearch} className="h-14 px-7 md:min-w-28" data-testid="search-btn">
          <Search className="me-2 h-5 w-5" />חיפוש
        </Button>
      </div>

      {userLocation && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <span className="text-xs text-slate-400">רדיוס חיפוש:</span>
          {radiusOptions.map((r) => (
            <button key={r.value} onClick={() => setSelectedRadius(r.value)} className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${selectedRadius === r.value ? "bg-carefd-teal text-white" : "border border-slate-200 bg-white text-carefd-slate hover:border-carefd-teal"}`} data-testid={`radius-${r.value}`}>{r.label}</button>
          ))}
          <button onClick={() => { setUserLocation(null); setLocationQuery(""); setSelectedRadius(""); }} className="ms-1 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500" aria-label="ניקוי מיקום"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {!compact && !userLocation && !locationQuery && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100 pt-3">
          <span className="text-xs text-slate-400">חיפוש מהיר:</span>
          {israeliRegions.slice(0, 5).map((r) => (
            <button key={r.id} onClick={() => selectRegion(r)} className="text-xs font-medium text-carefd-slate transition-colors hover:text-carefd-teal">{r.name}</button>
          ))}
        </div>
      )}
    </div>
  );
}
