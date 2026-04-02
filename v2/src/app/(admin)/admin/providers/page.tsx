"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Check, X } from "lucide-react";

const filters = [
  { v: "", l: "הכל" }, { v: "pending", l: "ממתין" },
  { v: "verified", l: "מאומת" }, { v: "rejected", l: "נדחה" },
];

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    const params: Record<string, string> = { limit: "20" };
    if (search) params.search = search;
    if (filter) params.status = filter;
    api.get<{ providers: any[]; total: number }>("/admin/providers", params)
      .then((d) => { setProviders(d.providers); setTotal(d.total); })
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filter]);

  const handleVerify = async (id: string) => { await api.put(`/admin/providers/${id}`, { action: "verify" }); fetchData(); };
  const handleReject = async (id: string) => {
    const notes = prompt("סיבת הדחייה:");
    if (notes === null) return;
    await api.put(`/admin/providers/${id}`, { action: "reject", notes });
    fetchData();
  };

  return (
    <div>
      <h2 className="font-heading font-semibold text-2xl mb-6">ניהול ספקים ({total})</h2>

      <div className="flex gap-2 mb-4 flex-wrap">
        {filters.map((f) => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === f.v ? "bg-primary text-primary-foreground shadow-sm" : "bg-white text-slate-600 hover:bg-secondary border border-slate-200"}`}>
            {f.l}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); fetchData(); }} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חפש..." className="ps-10 h-10" />
        </div>
        <Button type="submit" size="sm">חפש</Button>
      </form>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : (
        <div className="space-y-3">
          {providers.map((p) => (
            <Card key={p.id} className="p-5 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-primary">{p.businessName || "ללא שם"}</h3>
                <p className="text-sm text-slate-400">{p.user?.email} &bull; {p.city || ""}</p>
                <Badge variant={p.verificationStatus === "verified" ? "success" : p.verificationStatus === "rejected" ? "destructive" : "warning"} className="mt-1">
                  {p.verificationStatus}
                </Badge>
              </div>
              <div className="flex gap-2">
                {p.verificationStatus !== "verified" && (
                  <Button size="sm" onClick={() => handleVerify(p.id)} className="bg-emerald-600 hover:bg-emerald-700">
                    <Check className="w-3 h-3 me-1" />
                    אמת
                  </Button>
                )}
                {!["verified", "rejected"].includes(p.verificationStatus) && (
                  <Button variant="secondary" size="sm" onClick={() => handleReject(p.id)} className="text-red-600 border-red-200 hover:bg-red-50">
                    <X className="w-3 h-3 me-1" />
                    דחה
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
