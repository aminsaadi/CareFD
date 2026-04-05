"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Star, StarOff, Search } from "lucide-react";
import { toast } from "sonner";

export default function AdminFeaturedPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    api.get<{ providers: any[]; total: number }>("/admin/providers", { limit: "50" })
      .then((d) => setProviders(d.providers)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const toggleFeatured = async (id: string, current: boolean) => {
    try {
      await api.put(`/admin/providers/${id}/recommend`);
      toast.success(current ? "ההמלצה הוסרה" : "הספק סומן כמומלץ");
      fetchData();
    } catch { toast.error("שגיאה בעדכון"); }
  };

  return (
    <div>
      <h2 className="font-heading font-semibold text-2xl mb-6">ספקים מומלצים</h2>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : providers.length === 0 ? (
        <Card className="p-10 text-center"><Award className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400">אין ספקים</p></Card>
      ) : (
        <div className="space-y-3">
          {providers.map((p) => (
            <Card key={p.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-carefd-teal/10 flex items-center justify-center text-carefd-teal font-heading font-bold">
                  {p.businessName?.[0] || "?"}
                </div>
                <div>
                  <h3 className="font-semibold text-carefd-navy text-sm">{p.businessName || "ללא שם"}</h3>
                  <p className="text-xs text-slate-400">{p.city || ""} &bull; {p.verificationStatus}</p>
                </div>
                {p.isRecommended && <Badge variant="accent"><Star className="w-3 h-3 me-1 fill-current" /> מומלץ</Badge>}
              </div>
              <Button variant={p.isRecommended ? "ghost" : "secondary"} size="sm" onClick={() => toggleFeatured(p.id, p.isRecommended)}>
                {p.isRecommended ? <><StarOff className="w-4 h-4 me-1" /> הסר המלצה</> : <><Star className="w-4 h-4 me-1" /> המלץ</>}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
