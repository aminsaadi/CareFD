"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, FileText, Check, X, ExternalLink } from "lucide-react";

export default function AdminVerificationPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    api.get<{ providers: any[]; total: number }>("/admin/providers", { status: "pending" })
      .then((d) => setProviders(d.providers)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleVerify = async (id: string) => { await api.put(`/admin/providers/${id}`, { action: "verify" }); fetchData(); };
  const handleReject = async (id: string) => {
    const notes = prompt("סיבת הדחייה:");
    if (notes === null) return;
    await api.put(`/admin/providers/${id}`, { action: "reject", notes }); fetchData();
  };

  return (
    <div>
      <h2 className="font-heading font-semibold text-2xl mb-6">תור אימות ספקים</h2>
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : providers.length === 0 ? (
        <Card className="p-10 text-center"><Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400">אין ספקים ממתינים לאימות</p></Card>
      ) : (
        <div className="space-y-4">
          {providers.map((p) => (
            <Card key={p.id} className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-primary text-lg">{p.businessName || "ללא שם"}</h3>
                  <p className="text-sm text-slate-400">{p.user?.email} &bull; {p.city || ""}</p>
                  <Badge variant="warning" className="mt-2">{p.verificationStatus}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleVerify(p.id)} className="bg-emerald-600 hover:bg-emerald-700"><Check className="w-4 h-4 me-1" /> אמת</Button>
                  <Button variant="secondary" size="sm" onClick={() => handleReject(p.id)} className="text-red-600 border-red-200 hover:bg-red-50"><X className="w-4 h-4 me-1" /> דחה</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
