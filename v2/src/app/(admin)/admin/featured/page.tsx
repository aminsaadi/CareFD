"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Star, StarOff, Search, Eye, MapPin, ChevronDown } from "lucide-react";
import { toast } from "sonner";

export default function AdminFeaturedPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "recommended" | "not_recommended">("all");

  const fetchData = () => {
    setLoading(true);
    api.get<{ providers: any[]; total: number }>("/admin/providers", { limit: "100" })
      .then((d) => setProviders(d.providers || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const toggleFeatured = async (id: string, current: boolean) => {
    try {
      await api.put(`/admin/providers/${id}`, { action: current ? "unrecommend" : "recommend" });
      toast.success(current ? "ההמלצה הוסרה" : "הספק סומן כמומלץ");
      fetchData();
    } catch { toast.error("שגיאה בעדכון"); }
  };

  const filtered = providers.filter((p) => {
    const name = (p.businessName || p.business_name || "").toLowerCase();
    const matchesSearch = !search || name.includes(search.toLowerCase());
    const isRec = p.isRecommended || p.is_recommended;
    const matchesFilter = filter === "all" || (filter === "recommended" && isRec) || (filter === "not_recommended" && !isRec);
    return matchesSearch && matchesFilter;
  });

  const recommendedCount = providers.filter((p) => p.isRecommended || p.is_recommended).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-heading font-semibold text-2xl">ספקים מומלצים</h2>
          <p className="text-sm text-slate-400 mt-1">{recommendedCount} מומלצים מתוך {providers.length} ספקים</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חפש ספק..." className="ps-10 h-10" />
        </div>
        <div className="flex gap-2">
          {([["all", "הכל"], ["recommended", "מומלצים"], ["not_recommended", "לא מומלצים"]] as const).map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${filter === v ? "bg-carefd-teal text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center"><Award className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400">{search ? "לא נמצאו ספקים" : "אין ספקים"}</p></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const id = p.id || p.provider_id;
            const isRec = p.isRecommended || p.is_recommended;
            const name = p.businessName || p.business_name || "ללא שם";
            return (
              <Card key={id} className={`p-4 flex items-center justify-between ${isRec ? "border-amber-200 bg-amber-50/30" : ""}`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-heading font-bold flex-shrink-0 ${isRec ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" : "bg-carefd-teal/10 text-carefd-teal"}`}>
                    {name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-carefd-navy text-sm truncate">{name}</h3>
                      {isRec && <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs"><Star className="w-3 h-3 me-1 fill-current" />מומלץ</Badge>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      {(p.city || p.user?.city) && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.city || p.user?.city}</span>}
                      <span>{p.profession_name || p.professionName || ""}</span>
                      {(p.rating || p.average_rating) > 0 && <span className="flex items-center gap-1 text-amber-500"><Star className="w-3 h-3 fill-current" />{(p.rating || p.average_rating || 0).toFixed(1)}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button size="sm" variant="outline" asChild><Link href={`/providers/${id}`}><Eye className="w-4 h-4" /></Link></Button>
                  <Button size="sm" variant={isRec ? "ghost" : "default"} className={isRec ? "text-red-500 hover:text-red-600" : "bg-amber-500 hover:bg-amber-600"} onClick={() => toggleFeatured(id, isRec)}>
                    {isRec ? <><StarOff className="w-4 h-4 me-1" />הסר</> : <><Star className="w-4 h-4 me-1" />המלץ</>}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
