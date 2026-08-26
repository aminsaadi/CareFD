"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AdvancedSearch from "@/components/AdvancedSearch";
import { Search, MapPin, Star, ShieldCheck, ChevronDown, ArrowLeft } from "lucide-react";
import type { Provider } from "@/lib/types";

export default function ProvidersPage() {
  return <Suspense><ProvidersContent /></Suspense>;
}

function ProvidersContent() {
  const searchParams = useSearchParams();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search] = useState(searchParams.get("search") || searchParams.get("q") || "");
  const [city] = useState(searchParams.get("city") || "");
  const [category] = useState(searchParams.get("category") || "");
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

  return (
    <div className="bg-slate-50/60 min-h-screen">
      <section className="border-b border-slate-100 bg-white">
        <div className="container-main py-10 md:py-14">
          <div className="mb-7 max-w-3xl">
            <span className="section-eyebrow">נותני שירות</span>
            <h1 className="mb-3 text-3xl md:text-4xl lg:text-5xl">מטפלים ונותני שירות</h1>
            <p className="text-base leading-relaxed text-slate-500 md:text-lg">חפשו לפי מקצוע, התמחות ואזור, ועברו לפרופיל כדי להכיר את נותן השירות לפני הפנייה.</p>
          </div>
          <AdvancedSearch defaultTab="providers" compact />
        </div>
      </section>

      <section className="container-main py-8 md:py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-carefd-navy">{loading && page === 0 ? "מחפשים עבורכם..." : `${total} תוצאות`}</p>
            {(search || city) && !loading && (
              <p className="mt-1 text-xs text-slate-400">{search && `חיפוש: ${search}`}{search && city ? " · " : ""}{city && `אזור: ${city}`}</p>
            )}
          </div>
          <Link href="/services" className="hidden items-center gap-1 text-sm font-medium text-carefd-teal hover:text-carefd-navy sm:inline-flex">מחפשים שירות? <ArrowLeft className="h-4 w-4" /></Link>
        </div>

        {loading && page === 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="border-slate-100 p-6 shadow-none">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-16 w-16 rounded-2xl" />
                  <div className="flex-1 pt-1">
                    <Skeleton className="mb-3 h-5 w-3/4" />
                    <Skeleton className="mb-2 h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : providers.length > 0 ? (
          <>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {providers.map((p) => (
                <Link key={p.provider_id} href={`/providers/${p.provider_id}`} className="group block h-full" data-testid={`provider-${p.provider_id}`}>
                  <Card className="h-full border-slate-100 p-5 shadow-none transition-all hover:-translate-y-0.5 hover:border-carefd-teal/20 hover:shadow-soft-md md:p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl bg-carefd-teal/10 flex items-center justify-center text-xl font-bold text-carefd-teal">
                        {p.profile_image ? <img src={p.profile_image} alt={p.business_name || "נותן שירות"} className="h-full w-full object-cover" /> : (p.business_name?.[0] || "?")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h2 className="truncate text-lg font-semibold tracking-normal text-carefd-navy transition-colors group-hover:text-carefd-teal">{p.business_name || "נותן שירות"}</h2>
                            <p className="mt-0.5 text-sm font-medium text-carefd-teal">{p.profession_name || p.profession_title}</p>
                          </div>
                          {p.is_verified && (
                            <span title="פרופיל מאומת" aria-label="פרופיל מאומת" className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                              <ShieldCheck className="h-4 w-4" />
                            </span>
                          )}
                        </div>

                        {p.location?.city && (
                          <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-400"><MapPin className="h-3.5 w-3.5" />{p.location.city}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                      <div className="flex items-center gap-1.5">
                        <Star className="h-4 w-4 fill-carefd-teal text-carefd-teal" />
                        <span className="text-sm font-semibold text-carefd-navy">{Number.isFinite(p.rating) ? p.rating.toFixed(1) : "-"}</span>
                        <span className="text-xs text-slate-400">({p.total_reviews || 0})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.distance_km != null && <Badge variant="secondary" className="text-[11px]">{p.distance_km} ק&quot;מ</Badge>}
                        <span className="text-sm font-semibold text-carefd-teal">לפרופיל</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {providers.length < total && (
              <div className="mt-10 text-center">
                <Button variant="secondary" size="lg" onClick={() => { const next = page + 1; setPage(next); fetchProviders(next); }} disabled={loading} data-testid="providers-load-more">
                  {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" /> : <>הצג עוד <ChevronDown className="ms-2 h-4 w-4" /></>}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="mx-auto max-w-xl py-16 text-center md:py-24">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-soft"><Search className="h-7 w-7" /></div>
            <h2 className="mb-2 text-xl font-semibold tracking-normal text-carefd-navy">לא מצאנו התאמה בחיפוש הזה</h2>
            <p className="mb-6 text-sm leading-relaxed text-slate-500 md:text-base">נסו לחפש מקצוע רחב יותר, להסיר את האזור או לבחור תחום אחר.</p>
            <Button variant="secondary" asChild><Link href="/providers">ניקוי החיפוש</Link></Button>
          </div>
        )}
      </section>
    </div>
  );
}
