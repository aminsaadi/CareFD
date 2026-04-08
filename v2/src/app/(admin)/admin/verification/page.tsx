"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield, Check, X, Eye, FileText, MapPin, Mail,
  Phone, Star, Loader2, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminVerificationPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectDialogId, setRejectDialogId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchData = () => {
    setLoading(true);
    api.get<{ providers: any[] }>("/admin/providers/pending")
      .then((d) => setProviders(d.providers || []))
      .catch(() => api.get<{ providers: any[] }>("/admin/providers", { status: "pending" })
        .then((d) => setProviders(d.providers || []))
        .catch(() => {}))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleVerify = async (id: string) => {
    setActionLoading(id);
    try {
      await api.put(`/admin/providers/${id}`, { action: "verify" });
      toast.success("הספק אומת בהצלחה!");
      fetchData();
    } catch { toast.error("שגיאה באימות"); }
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
    } catch { toast.error("שגיאה בדחייה"); }
    finally { setActionLoading(null); }
  };

  return (
    <div>
      <h2 className="font-heading font-semibold text-2xl mb-6">
        תור אימות ספקים ({providers.length})
      </h2>

      {/* Reject Dialog */}
      {rejectDialogId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-carefd-navy mb-4">דחיית בקשת אימות</h3>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-carefd-teal focus:outline-none h-24 resize-none mb-4"
              placeholder="סיבת הדחייה (תישלח לספק)..." />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setRejectDialogId(null); setRejectReason(""); }}>ביטול</Button>
              <Button variant="destructive" onClick={() => handleReject(rejectDialogId)}
                disabled={actionLoading === rejectDialogId}>
                {actionLoading === rejectDialogId ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : <X className="w-4 h-4 me-1" />}
                דחה
              </Button>
            </div>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
      ) : providers.length === 0 ? (
        <Card className="p-12 text-center">
          <Shield className="w-12 h-12 text-green-300 mx-auto mb-3" />
          <p className="text-lg font-medium text-carefd-navy mb-1">אין ספקים ממתינים</p>
          <p className="text-slate-400 text-sm">כל הבקשות טופלו</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {providers.map((p) => {
            const id = p.provider_id || p.id;
            const isExpanded = expandedId === id;
            return (
              <Card key={id} className="overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {(p.business_name || p.businessName || p.user?.name || "S")[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-carefd-navy text-lg">{p.business_name || p.businessName || "ללא שם"}</h3>
                        <p className="text-sm text-slate-500">{p.profession_name || p.professionName || "לא צוין מקצוע"}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                          {(p.user?.email || p.email) && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{p.user?.email || p.email}</span>}
                          {(p.city || p.user?.city) && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.city || p.user?.city}</span>}
                          {(p.phone || p.user?.phone) && <span className="flex items-center gap-1" dir="ltr"><Phone className="w-3 h-3" />{p.phone || p.user?.phone}</span>}
                        </div>
                        <Badge variant="warning" className="mt-2">ממתין לאימות</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => setExpandedId(isExpanded ? null : id)}>
                        {isExpanded ? <ChevronUp className="w-4 h-4 me-1" /> : <ChevronDown className="w-4 h-4 me-1" />}
                        פרטים
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/providers/${id}`}><Eye className="w-4 h-4 me-1" />צפה</Link>
                      </Button>
                      <Button size="sm" className="bg-carefd-teal hover:bg-carefd-teal-medium" onClick={() => handleVerify(id)}
                        disabled={actionLoading === id}>
                        {actionLoading === id ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : <Check className="w-4 h-4 me-1" />}
                        אמת
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setRejectDialogId(id)}
                        disabled={actionLoading === id}>
                        <X className="w-4 h-4 me-1" />דחה
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50 p-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h4 className="font-medium text-carefd-navy text-sm">פרטי העסק</h4>
                        <div className="bg-white rounded-lg p-3"><p className="text-xs text-slate-400">תיאור</p><p className="text-sm">{p.description || p.about || "לא צוין"}</p></div>
                        <div className="bg-white rounded-lg p-3"><p className="text-xs text-slate-400">ניסיון</p><p className="text-sm">{p.experience_years || 0} שנים</p></div>
                        <div className="bg-white rounded-lg p-3"><p className="text-xs text-slate-400">שפות</p><p className="text-sm">{(p.languages || []).join(", ") || "לא צוין"}</p></div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-medium text-carefd-navy text-sm">מסמכים</h4>
                        {(p.documents || p.verification_documents || []).length > 0 ? (
                          (p.documents || p.verification_documents || []).map((doc: any, i: number) => (
                            <a key={i} href={doc.url || doc} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-2 bg-white rounded-lg p-3 hover:bg-carefd-teal-pale/20 transition">
                              <FileText className="w-4 h-4 text-carefd-teal" />
                              <span className="text-sm text-carefd-navy">{doc.name || `מסמך ${i + 1}`}</span>
                            </a>
                          ))
                        ) : (
                          <p className="text-sm text-slate-400 bg-white rounded-lg p-3">לא הועלו מסמכים</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
