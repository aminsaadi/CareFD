"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api-client";
import type { Service } from "@/lib/types";

export default function ServicesPage() {
  return <Suspense><ServicesContent /></Suspense>;
}

function ServicesContent() {
  const searchParams = useSearchParams();
  const [services, setServices] = useState<Service[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: "20", sort_by: "popular" };
      if (search) params.search = search;
      const data = await api.get<{ services: Service[]; total: number }>("/services", params);
      setServices(data.services);
      setTotal(data.total);
    } catch { setServices([]); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" dir="rtl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">שירותים</h1>
      <form onSubmit={(e) => { e.preventDefault(); fetchServices(); }} className="bg-white rounded-xl shadow p-4 mb-6 flex gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חפשו שירות..." className="flex-1 px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-teal-500 focus:outline-none" />
        <button type="submit" className="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700">חיפוש</button>
      </form>
      <p className="text-gray-500 mb-4">{total} שירותים</p>
      {loading ? <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{[1,2,3,4,5,6].map(i => <div key={i} className="h-40 bg-white rounded-xl animate-pulse" />)}</div> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => (
            <div key={s.service_id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-gray-900 text-lg mb-2">{s.name}</h3>
              {s.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{s.description}</p>}
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xl font-bold text-teal-600">₪{s.price}</span>
                  {s.provider && <p className="text-sm text-gray-500">{s.provider.business_name}</p>}
                </div>
                <Link href={`/book/${s.service_id}`} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">הזמן</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
