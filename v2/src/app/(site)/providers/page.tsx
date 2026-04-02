"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, Star, Shield, ChevronDown } from "lucide-react";
import type { Provider } from "@/lib/types";

export default function ProvidersPage() {
  return <Suspense><ProvidersContent /></Suspense>;
}

function ProvidersContent() {
  const searchParams = useSearchParams();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || searchParams.get("q") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [page, setPage] = useState(0);

  const fetchProviders = useCallback(async (pageNum = 0) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { skip: String(pageNum * 20), limit: "20", sort_by: "rating" };
      if (search) params.search = search;
      if (city) params.city = city;
      if (category) params.category = category;

      const data = await api.get<{ providers: Provider[]; total: number }>("/providers", params);
      if (pageNum === 0) setProviders(data.providers);
      else setProviders((prev) => [...prev, ...data.providers]);
      setTotal(data.total);
    } catch {
      if (pageNum === 0) setProviders([]);
    } finally {
      setLoading(false);
    }
  }, [search, city, category]);

  useEffect(() => { setPage(0); fetchProviders(0); }, [fetchProviders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchProviders(0);
  };

  return (
    <div className="container-main py-10 md:py-16">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-3">מטפלים וספקי שירות</h1>
        <p className="text-lg text-slate-500">מצאו את נותני השירות המתאימים לכם מתוך מאות מטפלים מאומתים</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="glass-card p-4 mb-8">
        <div className="grid md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="מקצוע, התמחות, שם ספק..."
              className="ps-11 border-0 bg-white/60"
              data-testid="providers-search"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="עיר או אזור"
              className="ps-11 border-0 bg-white/60"
              data-testid="providers-city"
            />
          </div>
          <Button type="submit" className="h-12" data-testid="providers-search-btn">
            <Search className="w-4 h-4 me-2" />
            חיפוש
          </Button>
        </div>
      </form>

      {/* Results count */}
      <p className="text-sm text-slate-400 mb-6">{total} תוצאות</p>

      {/* Loading */}
      {loading && page === 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="w-14 h-14 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Results grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((p) => (
              <Link key={p.provider_id} href={`/providers/${p.provider_id}`} data-testid={`provider-${p.provider_id}`}>
                <Card className="p-6 hover-lift group">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center text-accent font-heading font-bold text-xl flex-shrink-0">
                      {p.profile_image ? (
                        <img src={p.profile_image} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        p.business_name?.[0] || "?"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-primary truncate group-hover:text-accent transition-colors">
                        {p.business_name || "ספק"}
                      </h3>
                      <p className="text-sm text-accent font-medium">{p.profession_name || p.profession_title}</p>
                      {p.location?.city && (
                        <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {p.location.city}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-accent fill-accent" />
                          <span className="text-sm font-medium text-primary">{p.rating.toFixed(1)}</span>
                          <span className="text-xs text-slate-400">({p.total_reviews})</span>
                        </div>
                        {p.is_verified && (
                          <Badge variant="success" className="text-[10px]">
                            <Shield className="w-3 h-3 me-1" />
                            מאומת
                          </Badge>
                        )}
                        {p.distance_km != null && (
                          <span className="text-xs text-slate-400">{p.distance_km} ק&quot;מ</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {/* Load more */}
          {providers.length < total && (
            <div className="text-center mt-10">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => { const next = page + 1; setPage(next); fetchProviders(next); }}
                disabled={loading}
                data-testid="providers-load-more"
              >
                {loading ? (
                  <span className="animate-spin rounded-full h-5 w-5 border-2 border-primary/30 border-t-primary" />
                ) : (
                  <>
                    הצג עוד
                    <ChevronDown className="w-4 h-4 ms-2" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Empty state */}
          {!loading && providers.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-xl font-heading text-slate-600 mb-2">לא נמצאו תוצאות</p>
              <p className="text-slate-400">נסו לשנות את מילות החיפוש או הפילטרים</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
