"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { SlidersHorizontal, X, Star, Shield, Award } from "lucide-react";
import { serviceTypes, languageOptions, healthFunds } from "@/data/searchData";

interface Filters {
  verifiedOnly: boolean; recommendedOnly: boolean; minRating: number;
  serviceType: string; languages: string[]; healthFunds: string[];
  gender: string;
}

interface AdvancedFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onReset: () => void;
}

export default function AdvancedFilters({ filters, onChange, onReset }: AdvancedFiltersProps) {
  const [open, setOpen] = useState(false);

  const activeCount = [
    filters.verifiedOnly, filters.recommendedOnly, filters.minRating > 0,
    !!filters.serviceType, filters.languages.length > 0, filters.healthFunds.length > 0, !!filters.gender,
  ].filter(Boolean).length;

  const toggleArray = (arr: string[], val: string) => arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  return (
    <div>
      <Button variant="secondary" size="sm" onClick={() => setOpen(!open)} className="gap-2">
        <SlidersHorizontal className="w-4 h-4" />
        פילטרים
        {activeCount > 0 && <Badge variant="teal" className="ms-1">{activeCount}</Badge>}
      </Button>

      {open && (
        <Card className="mt-3 p-5 animate-fade-in space-y-5">
          {/* Quick toggles */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Switch checked={filters.verifiedOnly} onCheckedChange={(v) => onChange({ ...filters, verifiedOnly: v })} />
              <Label className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-carefd-teal" />מאומתים בלבד</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={filters.recommendedOnly} onCheckedChange={(v) => onChange({ ...filters, recommendedOnly: v })} />
              <Label className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-carefd-gold" />מומלצים בלבד</Label>
            </div>
          </div>

          {/* Min rating */}
          <div>
            <Label className="mb-2 block">דירוג מינימלי</Label>
            <div className="flex gap-2">
              {[0, 3, 3.5, 4, 4.5].map((r) => (
                <button key={r} onClick={() => onChange({ ...filters, minRating: r })}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm transition-all ${filters.minRating === r ? "bg-carefd-teal text-white" : "bg-white border border-slate-200 text-carefd-navy hover:border-carefd-teal"}`}>
                  {r === 0 ? "הכל" : <><Star className="w-3 h-3 fill-current" />{r}+</>}
                </button>
              ))}
            </div>
          </div>

          {/* Service types */}
          <div>
            <Label className="mb-2 block">סוג שירות</Label>
            <div className="flex gap-2 flex-wrap">
              {serviceTypes.map((t) => (
                <button key={t.id} onClick={() => onChange({ ...filters, serviceType: filters.serviceType === t.id ? "" : t.id })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filters.serviceType === t.id ? "bg-carefd-teal text-white" : "bg-carefd-stone text-carefd-navy hover:bg-carefd-teal/10"}`}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div>
            <Label className="mb-2 block">שפות</Label>
            <div className="flex gap-2 flex-wrap">
              {languageOptions.map((l) => (
                <button key={l.id} onClick={() => onChange({ ...filters, languages: toggleArray(filters.languages, l.id) })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filters.languages.includes(l.id) ? "bg-carefd-teal text-white" : "bg-carefd-stone text-carefd-navy hover:bg-carefd-teal/10"}`}>
                  {l.name}
                </button>
              ))}
            </div>
          </div>

          {/* Health funds */}
          <div>
            <Label className="mb-2 block">קופות חולים</Label>
            <div className="flex gap-2 flex-wrap">
              {healthFunds.map((f) => (
                <button key={f.id} onClick={() => onChange({ ...filters, healthFunds: toggleArray(filters.healthFunds, f.id) })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filters.healthFunds.includes(f.id) ? "bg-carefd-teal text-white" : "bg-carefd-stone text-carefd-navy hover:bg-carefd-teal/10"}`}>
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-2 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={onReset}><X className="w-3 h-3 me-1" />נקה הכל</Button>
            <Button size="sm" onClick={() => setOpen(false)}>החל פילטרים</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
