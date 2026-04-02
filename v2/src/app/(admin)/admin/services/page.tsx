"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Wrench } from "lucide-react";

export default function AdminServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = { limit: "30" };
    if (search) params.search = search;
    api.get<{ services: any[]; total: number }>("/services", params)
      .then((d) => { setServices(d.services); setTotal(d.total); }).catch(() => {}).finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { fetchData(); }, []);

  return (
    <div>
      <h2 className="font-heading font-semibold text-2xl mb-6">ניהול שירותים ({total})</h2>

      <form onSubmit={(e) => { e.preventDefault(); fetchData(); }} className="flex gap-2 mb-6">
        <div className="relative flex-1"><Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חפש שירות..." className="ps-10 h-10" /></div>
        <Button type="submit" size="sm">חפש</Button>
      </form>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : (
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 text-slate-500 bg-carefd-stone/50"><th className="p-3 text-start font-medium">שם</th><th className="p-3 text-start font-medium">ספק</th><th className="p-3 text-start font-medium">מחיר</th><th className="p-3 text-start font-medium">קטגוריה</th><th className="p-3 text-start font-medium">סטטוס</th></tr></thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.service_id} className="border-b border-slate-50 hover:bg-carefd-stone/30 transition-colors">
                  <td className="p-3 font-medium text-carefd-navy">{s.name}</td>
                  <td className="p-3 text-slate-500">{s.provider?.business_name || "-"}</td>
                  <td className="p-3 font-heading font-medium">{"\u20AA"}{s.price}</td>
                  <td className="p-3"><Badge variant="outline">{s.serviceCategory || "-"}</Badge></td>
                  <td className="p-3">{s.isActive ? <Badge variant="success">פעיל</Badge> : <Badge variant="outline">לא פעיל</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
