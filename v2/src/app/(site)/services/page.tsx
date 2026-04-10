"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import AdvancedSearch from "@/components/AdvancedSearch";
import ServiceCard from "@/components/ServiceCard";
import { Search } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-b from-white to-carefd-teal-pale/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-carefd-navy font-heading mb-2">שירותים</h1>
          <p className="text-carefd-gray">מצאו את השירות המתאים לכם</p>
        </div>

        {/* Search */}
        <AdvancedSearch defaultTab="services" className="mb-8" />

        <p className="text-sm text-carefd-gray mb-6">נמצאו <span className="font-bold text-carefd-navy">{total}</span> שירותים</p>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-3/4 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-8 w-20" />
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((s) => (
                <ServiceCard key={s.service_id} service={s} />
              ))}
            </div>

            {!loading && services.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-carefd-teal-pale/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-carefd-teal-pale" />
                </div>
                <p className="text-xl font-heading text-carefd-navy mb-2">לא נמצאו שירותים</p>
                <p className="text-carefd-gray">נסו לשנות את מילות החיפוש</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
