"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import { israeliRegions } from "@/data/searchData";

const allCities = israeliRegions.flatMap((r) => r.cities);

interface CitySelectProps {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  className?: string;
}

export default function CitySelect({ value, onChange, placeholder = "בחר עיר", className }: CitySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query ? allCities.filter((c) => c.includes(query)).slice(0, 10) : allCities.slice(0, 10);

  return (
    <div className="relative" ref={ref}>
      <MapPin className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-carefd-gray" />
      <Input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={`ps-11 ${className || ""}`}
      />
      {open && filtered.length > 0 && (
        <div className="absolute top-full mt-1 start-0 end-0 bg-white rounded-xl shadow-soft-lg border border-slate-100 py-1 z-20 max-h-60 overflow-y-auto">
          {filtered.map((c) => (
            <button key={c} onClick={() => { onChange(c); setQuery(c); setOpen(false); }} className="w-full text-start px-4 py-2 text-sm text-carefd-navy hover:bg-carefd-teal/5 transition-colors">
              <MapPin className="w-3 h-3 inline me-2 text-carefd-gray" />{c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
