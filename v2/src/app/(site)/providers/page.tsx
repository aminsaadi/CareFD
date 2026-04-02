"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api-client";
import type { Provider } from "@/lib/types";

export default function ProvidersPage() {
  return <Suspense><ProvidersContent /></Suspense>;
}

function ProvidersContent() {
  const searchParams = useSearchParams();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
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
    <div className="max-w-7xl mx-auto px-4 py-8" dir="rtl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">מטפלים וספקי שירות</h1>
      <p className="text-gray-600 mb-6">מצאו את נותני השירות המתאימים לכם</p>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-lg p-4 mb-6">
        <div className="grid md:grid-cols-3 gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="מקצוע, התמחות, שם ספק..."
            className="px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-teal-500 focus:outline-none" />
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="עיר או אזור"
            className="px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-teal-500 focus:outline-none" />
          <button type="submit" className="bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 transition-colors">
            חיפוש
          </button>
        </div>
      </form>

      {/* Results */}
      <p className="text-gray-500 mb-4">{total} תוצאות</p>
      {loading && page === 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow p-6 animate-pulse">
              <div className="h-12 w-12 bg-gray-200 rounded-full mb-4" />
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((p) => (
              <Link key={p.provider_id} href={`/providers/${p.provider_id}`}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xl flex-shrink-0">
                    {p.business_name?.[0] || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{p.business_name || "ספק"}</h3>
                    <p className="text-sm text-teal-600">{p.profession_name || p.profession_title}</p>
                    <p className="text-sm text-gray-500 mt-1">{p.location?.city}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-yellow-500">⭐</span>
                      <span className="font-medium">{p.rating.toFixed(1)}</span>
                      <span className="text-gray-400">({p.total_reviews})</span>
                      {p.is_verified && <span className="bg-teal-100 text-teal-700 text-xs px-2 py-0.5 rounded-full">מאומת</span>}
                      {p.distance_km != null && <span className="text-gray-400 text-sm">{p.distance_km} ק&quot;מ</span>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {providers.length < total && (
            <div className="text-center mt-8">
              <button onClick={() => { const next = page + 1; setPage(next); fetchProviders(next); }}
                className="bg-white border-2 border-teal-600 text-teal-600 px-8 py-3 rounded-xl font-medium hover:bg-teal-50 transition-colors">
                {loading ? "טוען..." : "הצג עוד"}
              </button>
            </div>
          )}

          {!loading && providers.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <p className="text-xl mb-2">לא נמצאו תוצאות</p>
              <p>נסו לשנות את מילות החיפוש או הפילטרים</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
