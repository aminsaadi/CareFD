"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Star, Check, X, MessageCircle, MapPin, Clock,
  DollarSign, AlertTriangle, Calendar, ArrowRight,
  FileText, Loader2, Send, Eye, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; variant: "success" | "accent" | "outline" | "destructive" }> = {
  open: { label: "פתוח", variant: "success" }, in_progress: { label: "בטיפול", variant: "accent" },
  completed: { label: "הושלם", variant: "outline" }, cancelled: { label: "בוטל", variant: "destructive" },
};
const urgencyLabels: Record<string, string> = { low: "נמוכה", medium: "בינונית", high: "גבוהה", urgent: "דחופה" };
const urgencyColors: Record<string, string> = { low: "bg-gray-100 text-gray-600", medium: "bg-yellow-100 text-yellow-700", high: "bg-orange-100 text-orange-700", urgent: "bg-red-100 text-red-700" };
const offerStatusLabels: Record<string, string> = { pending: "ממתין", accepted: "התקבל", rejected: "נדחה", withdrawn: "נמשכה" };
const offerStatusColors: Record<string, string> = { pending: "bg-yellow-100 text-yellow-800", accepted: "bg-green-100 text-green-800", rejected: "bg-red-100 text-red-800", withdrawn: "bg-gray-100 text-gray-600" };

export default function RequestDetailPage() {
  const { requestId } = useParams();
  const { user, provider } = useAuth();
  const router = useRouter();
  const [request, setRequest] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [offerForm, setOfferForm] = useState({ price: "", pricing_type: "fixed", duration_days: "", message: "" });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [req, off] = await Promise.all([
        api.get<any>(`/requests/${requestId}`),
        api.get<any>(`/requests/${requestId}/offers`).catch(() => ({ offers: [] })),
      ]);
      setRequest(req);
      setOffers(off?.offers || req?.offers || []);
    } catch { toast.error("שגיאה בטעינה"); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (requestId) fetchData(); }, [requestId]);

  const isOwner = user?.user_id === request?.user_id;
  const isProvider_ = user?.role === "provider";
  const myOffer = isProvider_ ? offers.find((o) => o.provider_id === provider?.provider_id) : null;
  const visibleOffers = isOwner ? offers : myOffer ? [myOffer] : [];

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerForm.price) { toast.error("נא להזין מחיר"); return; }
    setActionLoading("submit");
    try {
      await api.post("/offers", {
        request_id: requestId, price: parseFloat(offerForm.price),
        pricing_type: offerForm.pricing_type,
        duration_days: offerForm.duration_days ? parseInt(offerForm.duration_days) : null,
        message: offerForm.message,
      });
      toast.success("ההצעה נשלחה בהצלחה!");
      setShowOfferForm(false);
      setOfferForm({ price: "", pricing_type: "fixed", duration_days: "", message: "" });
      fetchData();
    } catch (err: any) { toast.error(err?.message || "שגיאה"); }
    finally { setActionLoading(null); }
  };

  const handleOfferAction = async (offerId: string, action: string) => {
    const msgs: Record<string, string> = {
      accept: "האם לקבל הצעה זו? תיווצר הזמנה חדשה.", reject: "האם לדחות הצעה זו?",
    };
    if (msgs[action] && !confirm(msgs[action])) return;
    setActionLoading(offerId);
    try {
      await api.post(`/offers/${offerId}`, { action });
      toast.success(action === "accept" ? "ההצעה התקבלה!" : action === "reject" ? "ההצעה נדחתה" : "בוצע");
      fetchData();
      if (action === "accept") setTimeout(() => router.push("/bookings"), 1500);
    } catch (err: any) { toast.error(err?.message || "שגיאה"); }
    finally { setActionLoading(null); }
  };

  const handleCancelRequest = async () => {
    if (!confirm("האם לבטל בקשה זו? כל ההצעות הפתוחות יידחו.")) return;
    try {
      await api.put(`/requests/${requestId}`, { action: "cancel", reason: cancelReason });
      toast.success("הבקשה בוטלה");
      setShowCancelForm(false);
      fetchData();
    } catch { toast.error("שגיאה בביטול"); }
  };

  const handleContactProvider = async (providerId: string) => {
    try {
      const res = await api.post<any>("/chat/rooms", { provider_id: providerId, request_id: requestId });
      router.push(`/chats/${res.room_id}`);
    } catch { toast.error("שגיאה ביצירת צ'אט"); }
  };

  if (loading) return (
    <div><Skeleton className="h-10 w-64 mb-6" /><div className="grid lg:grid-cols-3 gap-6"><div className="lg:col-span-2 space-y-6"><Skeleton className="h-48 w-full" /><Skeleton className="h-64 w-full" /></div><Skeleton className="h-48 w-full" /></div></div>
  );

  if (!request) return (
    <div className="text-center py-20"><FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-lg">הבקשה לא נמצאה</p><Button variant="outline" className="mt-4" asChild><Link href="/requests">חזרה לבקשות</Link></Button></div>
  );

  const status = statusConfig[request.status] || { label: request.status, variant: "outline" as const };

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4"><ArrowRight className="w-4 h-4 me-1" />חזרה</Button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Info */}
          <Card className="p-6 md:p-8">
            <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
              <h1 className="text-2xl font-bold text-carefd-navy">{request.title}</h1>
              <div className="flex items-center gap-2">
                <Badge variant={status.variant}>{status.label}</Badge>
                {request.urgency && request.urgency !== "medium" && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${urgencyColors[request.urgency] || ""}`}>
                    <AlertTriangle className="w-3 h-3" />{urgencyLabels[request.urgency]}
                  </span>
                )}
              </div>
            </div>
            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed mb-6">{request.description}</p>

            {/* Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {request.budget && <div className="bg-green-50 rounded-xl p-3 text-center"><DollarSign className="w-4 h-4 text-green-600 mx-auto mb-1" /><p className="text-lg font-bold text-green-700">₪{request.budget}</p><p className="text-xs text-green-600">תקציב</p></div>}
              {(request.city || request.location?.city) && <div className="bg-blue-50 rounded-xl p-3 text-center"><MapPin className="w-4 h-4 text-blue-600 mx-auto mb-1" /><p className="text-sm font-medium text-blue-700">{request.city || request.location?.city}</p><p className="text-xs text-blue-600">מיקום</p></div>}
              <div className="bg-slate-50 rounded-xl p-3 text-center"><Calendar className="w-4 h-4 text-slate-500 mx-auto mb-1" /><p className="text-sm font-medium text-slate-700">{request.createdAt || request.created_at ? new Date(request.createdAt || request.created_at).toLocaleDateString("he-IL") : "-"}</p><p className="text-xs text-slate-500">תאריך</p></div>
              <div className="bg-purple-50 rounded-xl p-3 text-center"><FileText className="w-4 h-4 text-purple-600 mx-auto mb-1" /><p className="text-lg font-bold text-purple-700">{offers.length}</p><p className="text-xs text-purple-600">הצעות</p></div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {(request.professions || []).map((p: string, i: number) => <Badge key={i} className="bg-carefd-teal-pale text-carefd-teal border-0">{p}</Badge>)}
              {request.specialization && <Badge variant="outline">{request.specialization}</Badge>}
              {request.service_type && <Badge variant="outline">{request.service_type}</Badge>}
              {request.delivery_type && <Badge variant="outline">{request.delivery_type}</Badge>}
            </div>
          </Card>

          {/* Offer Form (Provider) */}
          {isProvider_ && request.status === "open" && !myOffer && (
            <Card className="p-6">
              {!showOfferForm ? (
                <div className="text-center py-4">
                  <p className="text-slate-500 mb-3">רוצה להגיש הצעה לבקשה זו?</p>
                  <Button onClick={() => setShowOfferForm(true)}><Send className="w-4 h-4 me-1" />הגש הצעה</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmitOffer} className="space-y-4">
                  <h3 className="font-bold text-carefd-navy text-lg">הגשת הצעה</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-1"><label className="text-sm font-medium">מחיר (₪) *</label><Input type="number" value={offerForm.price} onChange={(e) => setOfferForm({ ...offerForm, price: e.target.value })} placeholder="0" required /></div>
                    <div className="space-y-1"><label className="text-sm font-medium">סוג תמחור</label>
                      <select value={offerForm.pricing_type} onChange={(e) => setOfferForm({ ...offerForm, pricing_type: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                        <option value="fixed">מחיר קבוע</option><option value="hourly">לפי שעה</option><option value="daily">לפי יום</option>
                      </select>
                    </div>
                    <div className="space-y-1"><label className="text-sm font-medium">משך (ימים)</label><Input type="number" value={offerForm.duration_days} onChange={(e) => setOfferForm({ ...offerForm, duration_days: e.target.value })} placeholder="אופציונלי" /></div>
                  </div>
                  <div className="space-y-1"><label className="text-sm font-medium">הודעה ללקוח</label><Textarea value={offerForm.message} onChange={(e) => setOfferForm({ ...offerForm, message: e.target.value })} placeholder="תאר את ההצעה שלך, ניסיון רלוונטי, זמינות..." className="min-h-[100px]" /></div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={actionLoading === "submit"}>{actionLoading === "submit" ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : <Send className="w-4 h-4 me-1" />}שלח הצעה</Button>
                    <Button variant="ghost" type="button" onClick={() => setShowOfferForm(false)}>ביטול</Button>
                  </div>
                </form>
              )}
            </Card>
          )}

          {/* Offers List */}
          <Card className="p-6 md:p-8">
            <h2 className="text-xl font-heading font-semibold mb-6">הצעות ({visibleOffers.length})</h2>
            {visibleOffers.length === 0 ? (
              <div className="text-center py-10 text-slate-400"><DollarSign className="w-10 h-10 mx-auto mb-2 text-slate-300" /><p>{isOwner ? "אין הצעות עדיין" : "לא הגשת הצעה לבקשה זו"}</p></div>
            ) : (
              <div className="space-y-4">
                {visibleOffers.map((offer: any) => (
                  <div key={offer.id || offer.offer_id} className={`border-2 rounded-2xl p-5 transition ${offer.status === "accepted" ? "border-green-200 bg-green-50" : "border-slate-100 hover:border-carefd-teal/40"}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-carefd-teal to-carefd-navy flex items-center justify-center text-white font-bold text-lg">
                          {(offer.providerName || offer.provider?.business_name || offer.provider?.businessName || "?")[0]}
                        </div>
                        <div>
                          <Link href={`/providers/${offer.provider_id || offer.provider?.provider_id}`} className="font-bold text-carefd-navy hover:text-carefd-teal transition">
                            {offer.providerName || offer.provider?.business_name || offer.provider?.businessName || "ספק"}
                          </Link>
                          {(offer.provider?.rating || 0) > 0 && (
                            <p className="text-xs text-slate-400 flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" />{(offer.provider?.rating || 0).toFixed(1)} ({offer.provider?.total_reviews || 0})</p>
                          )}
                          <p className="text-xs text-slate-400">{offer.created_at || offer.createdAt ? new Date(offer.created_at || offer.createdAt).toLocaleDateString("he-IL") : ""}</p>
                        </div>
                      </div>
                      <div className="text-end">
                        <p className="text-2xl font-heading font-bold text-carefd-teal">₪{offer.price}</p>
                        {offer.pricing_type && offer.pricing_type !== "fixed" && <p className="text-xs text-slate-400">/{offer.pricing_type === "hourly" ? "שעה" : "יום"}</p>}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium mt-1 inline-block ${offerStatusColors[offer.status] || ""}`}>{offerStatusLabels[offer.status] || offer.status}</span>
                      </div>
                    </div>
                    {offer.message && <p className="text-slate-600 text-sm mb-4 bg-slate-50 rounded-xl p-3">{offer.message}</p>}
                    {offer.duration_days && <p className="text-xs text-slate-400 mb-3">משך משוער: {offer.duration_days} ימים</p>}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {offer.status === "pending" && isOwner && (
                        <>
                          <Button size="sm" onClick={() => handleOfferAction(offer.id || offer.offer_id, "accept")} disabled={actionLoading === (offer.id || offer.offer_id)}>
                            {actionLoading === (offer.id || offer.offer_id) ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : <Check className="w-4 h-4 me-1" />}קבל הצעה
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleOfferAction(offer.id || offer.offer_id, "reject")} disabled={actionLoading === (offer.id || offer.offer_id)}>
                            <X className="w-4 h-4 me-1" />דחה
                          </Button>
                        </>
                      )}
                      {offer.status === "pending" && !isOwner && (
                        <Button size="sm" variant="outline" className="text-red-500" onClick={() => handleOfferAction(offer.id || offer.offer_id, "withdraw")}>משוך הצעה</Button>
                      )}
                      {offer.status === "accepted" && (
                        <Button size="sm" variant="outline" onClick={() => handleContactProvider(offer.provider_id || offer.provider?.provider_id)}>
                          <MessageCircle className="w-4 h-4 me-1" />פתח צ'אט
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/providers/${offer.provider_id || offer.provider?.provider_id}`}><Eye className="w-4 h-4 me-1" />צפה בפרופיל</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Request Info Card */}
          <Card className="p-6">
            <h3 className="font-bold text-carefd-navy mb-4">פרטי הבקשה</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">סטטוס</span><Badge variant={status.variant}>{status.label}</Badge></div>
              {request.budget && <div className="flex justify-between"><span className="text-slate-500">תקציב</span><span className="font-bold text-carefd-navy">₪{request.budget}</span></div>}
              {request.budget_type && <div className="flex justify-between"><span className="text-slate-500">סוג תקציב</span><span>{request.budget_type === "fixed" ? "קבוע" : "לפי שעה"}</span></div>}
              {request.urgency && <div className="flex justify-between"><span className="text-slate-500">דחיפות</span><span className={`px-2 py-0.5 rounded-full text-xs ${urgencyColors[request.urgency] || ""}`}>{urgencyLabels[request.urgency]}</span></div>}
              {request.preferred_date && <div className="flex justify-between"><span className="text-slate-500">תאריך מועדף</span><span>{new Date(request.preferred_date).toLocaleDateString("he-IL")}</span></div>}
              {request.preferred_time && <div className="flex justify-between"><span className="text-slate-500">שעה מועדפת</span><span>{request.preferred_time}</span></div>}
              {request.gender_preference && <div className="flex justify-between"><span className="text-slate-500">העדפת מגדר</span><span>{request.gender_preference === "male" ? "גבר" : request.gender_preference === "female" ? "אישה" : "ללא"}</span></div>}
              {request.request_type && <div className="flex justify-between"><span className="text-slate-500">סוג</span><span>{request.request_type === "one_time" ? "חד פעמי" : "חוזר"}</span></div>}
            </div>
          </Card>

          {/* Owner Actions */}
          {isOwner && request.status === "open" && (
            <Card className="p-6">
              <h3 className="font-bold text-carefd-navy mb-3">פעולות</h3>
              {!showCancelForm ? (
                <Button variant="destructive" size="sm" className="w-full" onClick={() => setShowCancelForm(true)}>בטל בקשה</Button>
              ) : (
                <div className="space-y-3">
                  <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="סיבת ביטול (אופציונלי)..." className="min-h-[80px]" />
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm" onClick={handleCancelRequest}>אשר ביטול</Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowCancelForm(false)}>חזור</Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* User Info */}
          {request.user && (
            <Card className="p-6">
              <h3 className="font-bold text-carefd-navy mb-3">פרסם הבקשה</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-carefd-navy/10 flex items-center justify-center text-carefd-navy font-bold">{(request.user?.name || "M")[0]}</div>
                <div><p className="font-medium text-carefd-navy">{request.user?.name || "משתמש"}</p><p className="text-xs text-slate-400">{request.user?.city || ""}</p></div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
