"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, Check, X, Eye, Edit, Star, MapPin,
  Phone, Mail, Award, ChevronDown, Stethoscope, Loader2,
} from "lucide-react";
import { toast } from "sonner";

const statusFilters = [
  { v: "", l: "הכל" },
  { v: "pending", l: "ממתין לאימות" },
  { v: "verified", l: "מאומת" },
  { v: "rejected", l: "נדחה" },
];

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectDialogId, setRejectDialogId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchData = (s = search, f = filter) => {
    setLoading(true);
    const params: Record<string, string> = { limit: "50" };
    if (s) params.search = s;
    if (f) params.status = f;
    api.get<{ providers: any[]; total: number }>("/admin/providers", params)
      .then((d) => { setProviders(d.providers || []); setTotal(d.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filter]);

  const handleVerify = async (id: string) => {
    setActionLoading(id);
    try {
      await api.put(`/admin/providers/${id}`, { action: "verify" });
      toast.success("הספק אומת בהצלחה!");
      fetchData();
    } catch { toast.error("שגיאה באימות הספק"); }
    finally { setActionLoading(null); }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await api.put(`/admin/providers/${id}`, { action: "reject", notes: rejectReason || "נדחה על ידי מנהל" });
      toast.success("הספק נדחה");
      setRejectDialogId(null);
      setRejectReason("");
      fetchData();
    } catch { toast.error("שגיאה בדחיית הספק"); }
    finally { setActionLoading(null); }
  };

  const handleRecommend = async (id: string) => {
    setActionLoading(id);
    try {
      await api.put(`/admin/providers/${id}`, { action: "recommend" });
      toast.success("הספק סומן כמומלץ");
      fetchData();
    } catch { toast.error("שגיאה בעדכון"); }
    finally { setActionLoading(null); }
  };

  const getStatusBadge = (p: any) => {
    const status = p.verificationStatus || p.verification_status || p.status;
    if (status === "verified" || p.is_verified) return <Badge variant="success">מאומת</Badge>;
    if (status === "rejected") return <Badge variant="destructive">נדחה</Badge>;
    return <Badge variant="warning">ממתין</Badge>;
  };

  return (
    <div>
      <h2 className="font-heading font-semibold text-2xl mb-6">ניהול ספקים ({total})</h2>

      {/* Status Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {statusFilters.map((f) => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === f.v
                ? "bg-carefd-navy text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-carefd-stone border border-slate-200"
            }`}
          >
            {f.l}
          </button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={(e) => { e.preventDefault(); fetchData(); }} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חפש לפי שם, אימייל, מקצוע..." className="ps-10 h-10" />
        </div>
        <Button type="submit" size="sm">חפש</Button>
      </form>

      {/* Reject Dialog */}
      {rejectDialogId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-carefd-navy mb-4">דחיית ספק</h3>
            <p className="text-sm text-slate-500 mb-4">נא לציין את סיבת הדחייה:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-carefd-teal focus:outline-none h-24 resize-none mb-4"
              placeholder="סיבת הדחייה..."
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setRejectDialogId(null); setRejectReason(""); }}>ביטול</Button>
              <Button variant="destructive" onClick={() => handleReject(rejectDialogId)} disabled={actionLoading === rejectDialogId}>
                {actionLoading === rejectDialogId ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : <X className="w-4 h-4 me-1" />}
                דחה
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Providers List */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : providers.length === 0 ? (
        <Card className="p-12 text-center">
          <Stethoscope className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-400">לא נמצאו ספקים</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {providers.map((p) => {
            const id = p.id || p.provider_id;
            return (
              <Card key={id} className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-carefd-teal to-carefd-navy flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {(p.businessName || p.business_name || p.user?.name || "S")[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-carefd-navy text-lg">
                          {p.businessName || p.business_name || "ללא שם"}
                        </h3>
                        {getStatusBadge(p)}
                        {(p.is_recommended || p.isRecommended) && (
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                            <Award className="w-3 h-3 me-1" /> מומלץ
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {p.profession_name || p.professionName || "לא צוין מקצוע"}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
                        {(p.user?.email || p.email) && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {p.user?.email || p.email}
                          </span>
                        )}
                        {(p.city || p.user?.city) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {p.city || p.user?.city}
                          </span>
                        )}
                        {(p.phone || p.user?.phone) && (
                          <span className="flex items-center gap-1" dir="ltr">
                            <Phone className="w-3 h-3" /> {p.phone || p.user?.phone}
                          </span>
                        )}
                        {(p.rating > 0 || p.average_rating > 0) && (
                          <span className="flex items-center gap-1 text-amber-500">
                            <Star className="w-3 h-3 fill-current" /> {(p.rating || p.average_rating || 0).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/providers/${id}`}>
                        <Eye className="w-4 h-4 me-1" /> צפה
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/provider/edit/${id}`}>
                        <Edit className="w-4 h-4 me-1" /> ערוך
                      </Link>
                    </Button>
                    {!(p.is_verified || p.verificationStatus === "verified") && (
                      <Button
                        size="sm"
                        className="bg-carefd-teal hover:bg-carefd-teal-medium"
                        onClick={() => handleVerify(id)}
                        disabled={actionLoading === id}
                      >
                        {actionLoading === id ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : <Check className="w-4 h-4 me-1" />}
                        אמת
                      </Button>
                    )}
                    {!(p.verificationStatus === "rejected" || p.is_verified || p.verificationStatus === "verified") && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setRejectDialogId(id)}
                        disabled={actionLoading === id}
                      >
                        <X className="w-4 h-4 me-1" /> דחה
                      </Button>
                    )}
                    {!(p.is_recommended || p.isRecommended) && (p.is_verified || p.verificationStatus === "verified") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-amber-600 border-amber-200 hover:bg-amber-50"
                        onClick={() => handleRecommend(id)}
                        disabled={actionLoading === id}
                      >
                        <Award className="w-4 h-4 me-1" /> המלץ
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
