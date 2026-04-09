"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, X, ChevronDown } from "lucide-react";

interface CitySelectProps {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  className?: string;
  showRegion?: boolean;
}

interface CityItem { name: string; region: string; }

// Import from data if available, fallback to inline
let localities: CityItem[] = [];
try {
  const mod = require("@/data/israeliLocalities");
  localities = mod.israeliLocalities || [];
} catch {
  // fallback: use regions from searchData
}

// Also get cities from searchData regions
import { israeliRegions } from "@/data/searchData";
const regionCities = israeliRegions.flatMap((r) => (r.cities || []).map((c: string) => ({ name: c, region: r.name })));
const allCities: CityItem[] = localities.length > 0 ? localities : regionCities;
const uniqueCities = Array.from(new Map(allCities.map((c) => [c.name, c])).values());

export default function CitySelect({ value, onChange, placeholder = "בחר עיר", className, showRegion = true }: CitySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query
    ? uniqueCities.filter((c) => c.name.includes(query)).slice(0, 15)
    : uniqueCities.slice(0, 15);

  const grouped = filtered.reduce<Record<string, CityItem[]>>((acc, c) => {
    if (!acc[c.region]) acc[c.region] = [];
    acc[c.region].push(c);
    return acc;
  }, {});

  const handleSelect = (city: string) => { onChange(city); setQuery(city); setOpen(false); };
  const handleClear = () => { onChange(""); setQuery(""); };

  return (
    <div className="relative" ref={ref}>
      <MapPin className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-carefd-gray pointer-events-none" />
      <Input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); if (!e.target.value) onChange(""); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={`ps-11 pe-10 ${className || ""}`}
      />
      {value && (
        <button onClick={handleClear} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
          <X className="w-4 h-4" />
        </button>
      )}
      {!value && !open && (
        <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
      )}

      {open && (Object.keys(grouped).length > 0 || query) && (
        <div className="absolute top-full mt-1 start-0 end-0 bg-white rounded-xl shadow-soft-lg border border-slate-100 py-1 z-30 max-h-72 overflow-y-auto animate-scale-in">
          {Object.keys(grouped).length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-4">לא נמצאו ערים</p>
          ) : showRegion ? (
            Object.entries(grouped).map(([region, cities]) => (
              <div key={region}>
                <p className="px-4 py-1.5 text-[10px] font-medium text-slate-400 uppercase tracking-wider bg-slate-50">{region}</p>
                {cities.map((c) => (
                  <button key={c.name} onClick={() => handleSelect(c.name)}
                    className="w-full text-start px-4 py-2 text-sm text-carefd-navy hover:bg-carefd-teal-pale/20 transition-colors flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-carefd-teal flex-shrink-0" />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            ))
          ) : (
            filtered.map((c) => (
              <button key={c.name} onClick={() => handleSelect(c.name)}
                className="w-full text-start px-4 py-2 text-sm text-carefd-navy hover:bg-carefd-teal-pale/20 transition-colors flex items-center gap-2">
                <MapPin className="w-3 h-3 text-carefd-teal flex-shrink-0" />
                <span>{c.name}</span>
                <span className="text-[10px] text-slate-400 ms-auto">{c.region}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
