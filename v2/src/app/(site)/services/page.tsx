"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import AdvancedSearch from "@/components/AdvancedSearch";
import ServiceCard from "@/components/ServiceCard";
import UnifiedAdvancedFilters, { type Filters } from "@/components/UnifiedAdvancedFilters";
import {
  Search, Filter, X, ChevronDown, LayoutGrid, List, Loader2, MapPin,
} from "lucide-react";
import { israeliRegions, radiusOptions } from "@/data/searchData";
import type { Service } from "@/lib/types";

const PAGE_SIZE = 20;

const defaultFilters: Filters = {
  search: "", city: "", region: "", category: "", specialization: "",
  serviceType: "", providerType: "", minRating: null, minExperience: null,
  verifiedOnly: false, recommendedOnly: false, gender: "", languages: [],
  healthFunds: [], priceMin: "", priceMax: "", latitude: null, longitude: null,
  radius: null, useMyLocation: false, profession: "",
};

export default function ServicesPage() {
  return <Suspense><ServicesContent /></Suspense>;
}

function ServicesContent() {
  const searchParams = useSearchParams();
  const [services, setServices] = useState<Service[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("popular");

  const [filters, setFilters] = useState<Filters>(() => ({
    ...defaultFilters,
    search: searchParams.get("search") || "",
    city: searchParams.get("city") || "",
    category: searchParams.get("category") || "",
  }));

  const activeFiltersCount = [
    filters.city, filters.region, filters.category, filters.serviceType,
    filters.minRating, filters.verifiedOnly, filters.recommendedOnly,
    filters.priceMin, filters.priceMax,
  ].filter(Boolean).length;

  const fetchServices = useCallback(async (pageNum = 0) => {
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const params: Record<string, string> = {
        skip: String(pageNum * PAGE_SIZE),
        limit: String(PAGE_SIZE),
        sort_by: sortBy,
      };
      if (filters.search) params.search = filters.search;
      if (filters.city) params.city = filters.city;
      if (filters.category) params.category = filters.category;
      if (filters.serviceType) params.service_type = filters.serviceType;
      if (filters.minRating) params.min_rating = String(filters.minRating);
      if (filters.verifiedOnly) params.verified_only = "true";
      if (filters.priceMin) params.price_min = filters.priceMin;
      if (filters.priceMax) params.price_max = filters.priceMax;
      if (filters.latitude && filters.longitude) {
        params.latitude = String(filters.latitude);
        params.longitude = String(filters.longitude);
        if (filters.radius) params.radius_km = String(filters.radius);
      }

      const data = await api.get<{ services: Service[]; total: number }>("/services", params);
      if (pageNum === 0) setServices(data.services || []);
      else setServices((prev) => [...prev, ...(data.services || [])]);
      setTotal(data.total || 0);
    } catch {
      if (pageNum === 0) { setServices([]); setTotal(0); }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, sortBy]);

  useEffect(() => { setPage(0); fetchServices(0); }, [fetchServices]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchServices(next);
  };

  const handleResetFilters = () => setFilters({ ...defaultFilters });

  const serviceTypeLabel = (t: string) => {
    const map: Record<string, string> = { home_visit: "ביקור בית", clinic_visit: "מרפאה", video_call: "טלרפואה", phone_call: "שיחה טלפונית" };
    return map[t] || t;
  };

  return (
    <div className="container-main py-10 md:py-16">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-3">שירותים</h1>
        <p className="text-lg text-slate-500">מצאו את השירות המתאים לכם מתוך מגוון שירותי בריאות</p>
      </div>

      {/* Search Bar */}
      <AdvancedSearch defaultTab="services" compact className="mb-6" />

      {/* Action Bar */}
      <div className="bg-white rounded-2xl shadow-md p-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setShowFilters(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-carefd-navy text-white rounded-xl font-medium text-sm"
              aria-label="פתח סינון מתקדם"
            >
              <Filter className="w-4 h-4" />
              סינון מתקדם
              {activeFiltersCount > 0 && (
                <span className="bg-carefd-teal px-2 py-0.5 rounded-full text-xs">{activeFiltersCount}</span>
              )}
            </button>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border-2 border-carefd-teal-pale rounded-xl focus:outline-none focus:border-carefd-teal bg-white text-sm"
            >
              <option value="popular">מיון: פופולריות</option>
              <option value="rating">מיון: דירוג</option>
              <option value="price_asc">מיון: מחיר (נמוך לגבוה)</option>
              <option value="price_desc">מיון: מחיר (גבוה לנמוך)</option>
              <option value="newest">מיון: חדש ביותר</option>
            </select>

            <p className="text-sm text-carefd-gray hidden sm:block">
              נמצאו <span className="font-bold text-carefd-navy">{total}</span> שירותים
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="hidden md:flex border-2 border-carefd-teal-pale rounded-xl overflow-hidden" role="group" aria-label="מצב תצוגה">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 transition-colors ${viewMode === "grid" ? "bg-carefd-teal text-white" : "bg-white text-carefd-gray hover:bg-carefd-teal-pale/30"}`}
              aria-label="תצוגת רשת"
              aria-pressed={viewMode === "grid"}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 transition-colors ${viewMode === "list" ? "bg-carefd-teal text-white" : "bg-white text-carefd-gray hover:bg-carefd-teal-pale/30"}`}
              aria-label="תצוגת רשימה"
              aria-pressed={viewMode === "list"}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Region Tags */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-carefd-teal-pale">
          <span className="text-sm text-carefd-gray">אזורים:</span>
          {israeliRegions.map((region) => (
            <button
              key={region.id}
              onClick={() => setFilters((prev) => ({ ...prev, city: region.name, latitude: region.lat, longitude: region.lng, radius: 25 }))}
              className={`text-sm px-3 py-1 rounded-full transition-colors ${
                filters.city === region.name ? "bg-carefd-teal text-white" : "bg-carefd-teal-pale/50 text-carefd-navy hover:bg-carefd-teal-pale"
              }`}
            >
              {region.name}
            </button>
          ))}
        </div>

        {/* Active Filters Tags */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-carefd-teal-pale">
            {filters.city && (
              <span className="inline-flex items-center gap-1 bg-carefd-teal-pale text-carefd-navy px-3 py-1 rounded-full text-sm">
                <MapPin className="w-3 h-3" /> {filters.city}
                <button onClick={() => setFilters((p) => ({ ...p, city: "", latitude: null, longitude: null, radius: null }))}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.category && (
              <span className="inline-flex items-center gap-1 bg-carefd-teal-pale text-carefd-navy px-3 py-1 rounded-full text-sm">
                קטגוריה: {filters.category}
                <button onClick={() => setFilters((p) => ({ ...p, category: "" }))}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.serviceType && (
              <span className="inline-flex items-center gap-1 bg-carefd-teal-pale text-carefd-navy px-3 py-1 rounded-full text-sm">
                סוג: {serviceTypeLabel(filters.serviceType)}
                <button onClick={() => setFilters((p) => ({ ...p, serviceType: "" }))}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.priceMin && (
              <span className="inline-flex items-center gap-1 bg-carefd-teal-pale text-carefd-navy px-3 py-1 rounded-full text-sm">
                מחיר מ-₪{filters.priceMin}
                <button onClick={() => setFilters((p) => ({ ...p, priceMin: "" }))}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.priceMax && (
              <span className="inline-flex items-center gap-1 bg-carefd-teal-pale text-carefd-navy px-3 py-1 rounded-full text-sm">
                מחיר עד ₪{filters.priceMax}
                <button onClick={() => setFilters((p) => ({ ...p, priceMax: "" }))}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.minRating && (
              <span className="inline-flex items-center gap-1 bg-carefd-teal-pale text-carefd-navy px-3 py-1 rounded-full text-sm">
                דירוג: {filters.minRating}+
                <button onClick={() => setFilters((p) => ({ ...p, minRating: null }))}><X className="w-3 h-3" /></button>
              </span>
            )}
            <button onClick={handleResetFilters} className="text-sm text-carefd-teal hover:underline">נקה הכל</button>
          </div>
        )}
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex gap-6">
        {/* Filters Sidebar (Desktop) */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <div className="sticky top-24">
            <UnifiedAdvancedFilters
              filters={filters}
              onFilterChange={setFilters}
              onReset={handleResetFilters}
              resultsCount={total}
              pageType="services"
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-carefd-gray mb-4 sm:hidden">
            נמצאו <span className="font-bold text-carefd-navy">{total}</span> שירותים
          </p>

          {loading && page === 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-10 w-full" />
                </Card>
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
              <div className="w-16 h-16 bg-carefd-teal-pale/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-carefd-teal-pale" />
              </div>
              <h3 className="text-xl font-bold text-carefd-navy mb-2">לא נמצאו שירותים</h3>
              <p className="text-carefd-gray mb-4">נסו לשנות את הסינון או מילות החיפוש</p>
              <Button onClick={handleResetFilters}>נקה סינון והצג הכל</Button>
            </div>
          ) : (
            <div className={viewMode === "grid" ? "grid md:grid-cols-2 gap-6" : "space-y-4"}>
              {services.map((s) => (
                <ServiceCard key={s.service_id} service={s} />
              ))}
            </div>
          )}

          {/* Load More */}
          {services.length < total && !loading && (
            <div className="mt-8 text-center">
              <Button variant="secondary" size="lg" onClick={handleLoadMore} disabled={loadingMore}>
                {loadingMore ? (
                  <><Loader2 className="w-4 h-4 animate-spin me-2" />טוען...</>
                ) : (
                  <>טען עוד ({services.length} מתוך {total})<ChevronDown className="w-4 h-4 ms-2" /></>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {showFilters && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-md">
            <UnifiedAdvancedFilters
              filters={filters}
              onFilterChange={setFilters}
              onReset={handleResetFilters}
              showMobile
              onClose={() => setShowFilters(false)}
              resultsCount={total}
              pageType="services"
            />
          </div>
        </div>
      )}
    </div>
  );
}
