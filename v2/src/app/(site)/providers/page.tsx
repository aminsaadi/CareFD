"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import ProviderCard from "@/components/ProviderCard";
import AdvancedSearch from "@/components/AdvancedSearch";
import UnifiedAdvancedFilters, { type ProviderFilters } from "@/components/UnifiedAdvancedFilters";
import {
  Search, MapPin, Filter, X, ChevronDown, LayoutGrid, List, Map,
  Loader2, ChevronLeft, Star,
} from "lucide-react";
import { israeliRegions, radiusOptions } from "@/data/searchData";
import type { Provider } from "@/lib/types";

const PAGE_SIZE = 20;

const defaultFilters: ProviderFilters = {
  search: "",
  city: "",
  region: "",
  category: "",
  specialization: "",
  serviceType: "",
  providerType: "",
  minRating: null,
  minExperience: null,
  verifiedOnly: false,
  recommendedOnly: false,
  gender: "",
  languages: [],
  healthFunds: [],
  priceMin: "",
  priceMax: "",
  latitude: null,
  longitude: null,
  radius: null,
  useMyLocation: false,
  profession: "",
};

export default function ProvidersPage() {
  return <Suspense><ProvidersContent /></Suspense>;
}

function ProvidersContent() {
  const searchParams = useSearchParams();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
  const [sortBy, setSortBy] = useState("rating");

  const [filters, setFilters] = useState<ProviderFilters>(() => ({
    ...defaultFilters,
    search: searchParams.get("search") || searchParams.get("q") || "",
    city: searchParams.get("city") || "",
    category: searchParams.get("category") || "",
    latitude: searchParams.get("latitude") ? parseFloat(searchParams.get("latitude")!) : null,
    longitude: searchParams.get("longitude") ? parseFloat(searchParams.get("longitude")!) : null,
    radius: searchParams.get("radius_km") ? parseFloat(searchParams.get("radius_km")!) : null,
    useMyLocation: !!(searchParams.get("latitude") && searchParams.get("longitude")),
  }));

  const activeFiltersCount = [
    filters.city, filters.region, filters.category, filters.serviceType,
    filters.providerType, filters.minRating, filters.minExperience,
    filters.verifiedOnly, filters.recommendedOnly, filters.gender,
    (filters.languages?.length || 0) > 0, (filters.healthFunds?.length || 0) > 0,
    filters.useMyLocation, filters.profession,
  ].filter(Boolean).length;

  const fetchProviders = useCallback(async (pageNum = 0) => {
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const params: Record<string, string> = {
        skip: String(pageNum * PAGE_SIZE),
        limit: String(PAGE_SIZE),
        sort_by: sortBy,
        sort_order: "desc",
      };
      if (filters.search) params.search = filters.search;
      if (filters.city) params.city = filters.city;
      if (filters.category) params.category = filters.category;
      if (filters.specialization) params.specialization = filters.specialization;
      if (filters.serviceType) params.service_type = filters.serviceType;
      if (filters.providerType) params.provider_type = filters.providerType;
      if (filters.minRating) params.min_rating = String(filters.minRating);
      if (filters.minExperience) params.min_experience = String(filters.minExperience);
      if (filters.verifiedOnly) params.verified_only = "true";
      if (filters.recommendedOnly) params.recommended_only = "true";
      if (filters.gender) params.gender = filters.gender;
      if (filters.languages?.length) params.languages = filters.languages.join(",");
      if (filters.healthFunds?.length) params.health_funds = filters.healthFunds.join(",");
      if (filters.latitude && filters.longitude) {
        params.latitude = String(filters.latitude);
        params.longitude = String(filters.longitude);
        if (filters.radius) params.radius_km = String(filters.radius);
      }

      const data = await api.get<{ providers: Provider[]; total: number }>("/providers", params);
      if (pageNum === 0) setProviders(data.providers || []);
      else setProviders((prev) => [...prev, ...(data.providers || [])]);
      setTotal(data.total || 0);
    } catch {
      if (pageNum === 0) { setProviders([]); setTotal(0); }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, sortBy]);

  useEffect(() => { setPage(0); fetchProviders(0); }, [fetchProviders]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchProviders(next);
  };

  const handleFilterChange = (newFilters: ProviderFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({ ...defaultFilters });
  };

  const handleRadiusChange = (radius: number) => {
    setFilters((prev) => ({ ...prev, radius }));
  };

  const serviceTypeLabel = (t: string) => {
    const map: Record<string, string> = {
      home_visit: "ביקור בית", clinic_visit: "מרפאה", video_call: "טלרפואה", phone_call: "שיחה טלפונית",
    };
    return map[t] || t;
  };

  const providerTypeLabel = (t: string) => {
    const map: Record<string, string> = { individual: "עצמאי", clinic: "מרפאה", company: "חברה" };
    return map[t] || t;
  };

  return (
    <div className="container-main py-10 md:py-16">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-3">מטפלים וספקי שירות</h1>
        <p className="text-lg text-slate-500">מצאו את נותני השירות המתאימים לכם מתוך מאות מטפלים מאומתים</p>
      </div>

      {/* Search Bar */}
      <AdvancedSearch defaultTab="providers" compact className="mb-6" />

      {/* Action Bar: Filter toggle, Sort, View modes */}
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
              <option value="rating">מיון: דירוג</option>
              <option value="reviews">מיון: ביקורות</option>
              <option value="price">מיון: מחיר</option>
              {(filters.useMyLocation || (filters.latitude && filters.longitude)) && (
                <option value="distance">מיון: מרחק</option>
              )}
            </select>

            {/* Results count */}
            <p className="text-sm text-carefd-gray hidden sm:block">
              נמצאו <span className="font-bold text-carefd-navy">{total}</span> ספקים
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="hidden md:flex border-2 border-carefd-teal-pale rounded-xl overflow-hidden" role="group" aria-label="מצב תצוגה">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 transition-colors ${viewMode === "grid" ? "bg-carefd-teal text-white" : "bg-white text-carefd-gray hover:bg-carefd-teal-pale/30"}`}
              title="תצוגת רשת"
              aria-label="תצוגת רשת"
              aria-pressed={viewMode === "grid"}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 transition-colors ${viewMode === "list" ? "bg-carefd-teal text-white" : "bg-white text-carefd-gray hover:bg-carefd-teal-pale/30"}`}
              title="תצוגת רשימה"
              aria-label="תצוגת רשימה"
              aria-pressed={viewMode === "list"}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`px-3 py-2 transition-colors ${viewMode === "map" ? "bg-carefd-teal text-white" : "bg-white text-carefd-gray hover:bg-carefd-teal-pale/30"}`}
              title="תצוגת מפה"
              aria-label="תצוגת מפה"
              aria-pressed={viewMode === "map"}
              data-testid="map-view-btn"
            >
              <Map className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Radius selector */}
        {(filters.useMyLocation || (filters.latitude && filters.longitude)) && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-carefd-teal-pale">
            <span className="text-sm text-carefd-gray">רדיוס חיפוש:</span>
            <div className="flex gap-2">
              {radiusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleRadiusChange(parseInt(option.value))}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    filters.radius === parseInt(option.value)
                      ? "bg-carefd-teal text-white"
                      : "bg-carefd-teal-pale/50 text-carefd-navy hover:bg-carefd-teal-pale"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Region Tags */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-carefd-teal-pale">
          <span className="text-sm text-carefd-gray">אזורים:</span>
          {israeliRegions.map((region) => (
            <button
              key={region.id}
              onClick={() => {
                setFilters((prev) => ({
                  ...prev,
                  city: region.name,
                  region: "",
                  useMyLocation: false,
                  latitude: region.lat,
                  longitude: region.lng,
                  radius: 25,
                }));
              }}
              className={`text-sm px-3 py-1 rounded-full transition-colors ${
                filters.city === region.name
                  ? "bg-carefd-teal text-white"
                  : "bg-carefd-teal-pale/50 text-carefd-navy hover:bg-carefd-teal-pale"
              }`}
              data-testid={`region-${region.id}`}
            >
              {region.name}
            </button>
          ))}
        </div>

        {/* Active Filters Tags */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-carefd-teal-pale">
            {filters.useMyLocation && (
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                <MapPin className="w-3 h-3" /> המיקום שלי
                {filters.radius && ` (${filters.radius} ק"מ)`}
                <button onClick={() => setFilters((p) => ({ ...p, useMyLocation: false, latitude: null, longitude: null, radius: null }))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.city && !filters.useMyLocation && (
              <span className="inline-flex items-center gap-1 bg-carefd-teal-pale text-carefd-navy px-3 py-1 rounded-full text-sm">
                <MapPin className="w-3 h-3" /> {filters.city}
                {filters.radius && filters.latitude ? ` (${filters.radius} ק"מ)` : ""}
                <button onClick={() => setFilters((p) => ({ ...p, city: "", latitude: null, longitude: null, radius: null }))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.search && (
              <span className="inline-flex items-center gap-1 bg-carefd-teal-pale text-carefd-navy px-3 py-1 rounded-full text-sm">
                חיפוש: {filters.search}
                <button onClick={() => setFilters((p) => ({ ...p, search: "" }))}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.category && (
              <span className="inline-flex items-center gap-1 bg-carefd-teal-pale text-carefd-navy px-3 py-1 rounded-full text-sm">
                קטגוריה: {filters.category}
                <button onClick={() => setFilters((p) => ({ ...p, category: "" }))}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.verifiedOnly && (
              <span className="inline-flex items-center gap-1 bg-carefd-teal text-white px-3 py-1 rounded-full text-sm">
                מאומתים בלבד
                <button onClick={() => setFilters((p) => ({ ...p, verifiedOnly: false }))}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.recommendedOnly && (
              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm">
                מומלצים בלבד
                <button onClick={() => setFilters((p) => ({ ...p, recommendedOnly: false }))}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.serviceType && (
              <span className="inline-flex items-center gap-1 bg-carefd-teal-pale text-carefd-navy px-3 py-1 rounded-full text-sm">
                סוג שירות: {serviceTypeLabel(filters.serviceType)}
                <button onClick={() => setFilters((p) => ({ ...p, serviceType: "" }))}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.providerType && (
              <span className="inline-flex items-center gap-1 bg-carefd-teal-pale text-carefd-navy px-3 py-1 rounded-full text-sm">
                סוג ספק: {providerTypeLabel(filters.providerType)}
                <button onClick={() => setFilters((p) => ({ ...p, providerType: "" }))}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.minRating && (
              <span className="inline-flex items-center gap-1 bg-carefd-teal-pale text-carefd-navy px-3 py-1 rounded-full text-sm">
                דירוג: {filters.minRating}+
                <button onClick={() => setFilters((p) => ({ ...p, minRating: null }))}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.gender && (
              <span className="inline-flex items-center gap-1 bg-carefd-teal-pale text-carefd-navy px-3 py-1 rounded-full text-sm">
                מגדר: {filters.gender === "male" ? "גבר" : filters.gender === "female" ? "אישה" : "לא משנה"}
                <button onClick={() => setFilters((p) => ({ ...p, gender: "" }))}><X className="w-3 h-3" /></button>
              </span>
            )}
            <button onClick={handleResetFilters} className="text-sm text-carefd-teal hover:underline">
              נקה הכל
            </button>
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
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
              resultsCount={total}
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {/* Mobile results count */}
          <p className="text-sm text-carefd-gray mb-4 sm:hidden">
            נמצאו <span className="font-bold text-carefd-navy">{total}</span> ספקים
          </p>

          {loading && page === 0 ? (
            /* Loading Skeleton */
            <div className="grid md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-md border-2 border-carefd-teal-pale animate-pulse">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="h-6 bg-gray-200 rounded-lg w-3/4 mb-2" />
                      <div className="h-4 bg-gray-200 rounded-lg w-1/2 mb-1" />
                      <div className="h-4 bg-gray-200 rounded-lg w-1/3" />
                    </div>
                    <div className="h-8 w-20 bg-gray-200 rounded-full" />
                  </div>
                  <div className="h-10 bg-gray-200 rounded-lg mb-4" />
                  <div className="flex gap-2 mb-4">
                    <div className="h-6 w-20 bg-gray-200 rounded-lg" />
                    <div className="h-6 w-20 bg-gray-200 rounded-lg" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-10 flex-1 bg-gray-200 rounded-xl" />
                    <div className="h-10 w-10 bg-gray-200 rounded-xl" />
                    <div className="h-10 w-10 bg-gray-200 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : providers.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
              <div className="w-16 h-16 bg-carefd-teal-pale/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-carefd-teal-pale" />
              </div>
              <h3 className="text-xl font-bold text-carefd-navy mb-2">לא נמצאו ספקים</h3>
              <p className="text-carefd-gray mb-4">נסו לשנות את הסינון או מילות החיפוש</p>
              <div className="space-y-3 max-w-md mx-auto text-sm text-carefd-slate mb-6">
                <p>הנה כמה טיפים לשיפור החיפוש:</p>
                <ul className="text-right list-disc list-inside space-y-1">
                  <li>נסו להרחיב את אזור החיפוש</li>
                  <li>שנו את מילות החיפוש</li>
                  <li>הסירו חלק מהפילטרים</li>
                </ul>
              </div>
              <Button onClick={handleResetFilters}>
                נקה סינון והצג הכל
              </Button>
            </div>
          ) : viewMode === "map" ? (
            /* Map View */
            <div className="flex flex-col lg:flex-row gap-4" style={{ height: "650px" }}>
              <div className="flex-1 min-h-[350px] lg:min-h-0 bg-gray-100 rounded-xl flex items-center justify-center">
                <div className="text-center text-carefd-gray">
                  <Map className="w-12 h-12 mx-auto mb-3 text-carefd-teal-pale" />
                  <p className="font-medium">תצוגת מפה</p>
                  <p className="text-sm">המפה תהיה זמינה בקרוב</p>
                </div>
              </div>
              {/* Provider list sidebar */}
              <div className="lg:w-80 xl:w-96 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-bold text-carefd-navy flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-carefd-teal" />
                    ספקים באזור
                    <span className="text-sm font-normal text-carefd-gray">({providers.length})</span>
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {providers.map((provider) => (
                    <Link
                      key={provider.provider_id}
                      href={`/providers/${provider.provider_id}`}
                      className="flex items-center gap-3 p-3 hover:bg-carefd-teal/5 transition group"
                    >
                      {provider.profile_image ? (
                        <img src={provider.profile_image} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-100 group-hover:ring-carefd-teal/30" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-carefd-teal/20 to-carefd-navy/10 flex items-center justify-center text-carefd-teal font-bold flex-shrink-0">
                          {(provider.business_name || "?").charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-carefd-navy text-sm truncate group-hover:text-carefd-teal transition">
                          {provider.business_name}
                        </p>
                        <p className="text-xs text-carefd-gray truncate">
                          {provider.profession_name || provider.profession_title} • {provider.location?.city}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {provider.rating > 0 && (
                            <span className="text-xs text-amber-500 flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-amber-500" />
                              {Number(provider.rating).toFixed(1)}
                            </span>
                          )}
                          {provider.distance_km != null && (
                            <span className="text-xs text-blue-500">{provider.distance_km} ק&quot;מ</span>
                          )}
                        </div>
                      </div>
                      <ChevronLeft className="w-3 h-3 text-gray-300 group-hover:text-carefd-teal flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Grid / List View */
            <div className={viewMode === "grid" ? "grid md:grid-cols-2 gap-6" : "space-y-4"}>
              {providers.map((provider) => (
                <div key={provider.provider_id} className="relative">
                  {provider.distance_km != null && (
                    <div className="absolute -top-2 left-4 z-10 bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {provider.distance_km} ק&quot;מ
                    </div>
                  )}
                  <ProviderCard provider={provider} />
                </div>
              ))}
            </div>
          )}

          {/* Load More */}
          {providers.length < total && !loading && viewMode !== "map" && (
            <div className="mt-8 text-center">
              <Button
                variant="secondary"
                size="lg"
                onClick={handleLoadMore}
                disabled={loadingMore}
                data-testid="providers-load-more"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin me-2" />
                    טוען...
                  </>
                ) : (
                  <>
                    טען עוד ({providers.length} מתוך {total})
                    <ChevronDown className="w-4 h-4 ms-2" />
                  </>
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
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
              showMobile
              onClose={() => setShowFilters(false)}
              resultsCount={total}
            />
          </div>
        </div>
      )}
    </div>
  );
}
