"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  MapPin, Star, Shield, Phone, MessageCircle, Clock, Globe, Heart,
  Award, ChevronLeft, Share2, Copy, Check, GraduationCap, Users,
  CalendarDays, Briefcase, CreditCard, Home, Video, Building2,
  PhoneCall, Info, FileText, User,
} from "lucide-react";
import type { Provider, Review } from "@/lib/types";

/* ---------- constants ---------- */
const serviceTypeConfig: Record<string, { icon: typeof Home; label: string; color: string }> = {
  home_visit:   { icon: Home,      label: "ביקור בית",       color: "bg-blue-100 text-blue-600" },
  video_call:   { icon: Video,     label: "טלרפואה",        color: "bg-purple-100 text-purple-600" },
  clinic_visit: { icon: Building2, label: "ביקור במרפאה",    color: "bg-green-100 text-green-600" },
  phone_call:   { icon: PhoneCall, label: "שיחה טלפונית",   color: "bg-orange-100 text-orange-600" },
};

const dayLabels: Record<string, string> = {
  sunday: "ראשון", monday: "שני", tuesday: "שלישי",
  wednesday: "רביעי", thursday: "חמישי", friday: "שישי", saturday: "שבת",
};
const shiftLabels: Record<string, string> = { morning: "בוקר", afternoon: "צהריים", evening: "ערב", night: "לילה" };
const shiftColors: Record<string, string> = {
  morning: "bg-amber-100 text-amber-700", afternoon: "bg-orange-100 text-orange-700",
  evening: "bg-purple-100 text-purple-700", night: "bg-indigo-100 text-indigo-700",
};
const educationLevelLabels: Record<string, string> = {
  diploma: "תעודה מקצועית", bachelor: "תואר ראשון", master: "תואר שני",
  phd: "דוקטורט", specialist: "התמחות רפואית",
};
const pricingUnits: Record<string, string> = {
  per_hour: "לשעה", per_visit: "לביקור", per_session: "לפגישה", fixed: "",
};
const DAYS_ORDER = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/* ---------- component ---------- */
export default function ProviderProfilePage() {
  const { providerId } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [provider, setProvider] = useState<Provider | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"services" | "reviews" | "team">("services");
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  /* --- data fetching --- */
  useEffect(() => {
    if (!providerId) return;
    Promise.all([
      api.get<Provider>(`/providers/${providerId}`),
      api.get<{ reviews: Review[] }>("/reviews", { provider_id: providerId as string }),
    ])
      .then(([p, r]) => { setProvider(p); setReviews(r.reviews ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [providerId]);

  useEffect(() => {
    if (!providerId || !isAuthenticated) return;
    api.get<{ is_favorite: boolean }>(`/favorites/check/${providerId}`)
      .then((r) => setIsFavorite(r.is_favorite))
      .catch(() => {});
  }, [providerId, isAuthenticated]);

  /* --- actions --- */
  const toggleFavorite = async () => {
    if (!isAuthenticated) { router.push("/login"); return; }
    try {
      if (isFavorite) { await api.delete(`/favorites/${providerId}`); setIsFavorite(false); toast.success("הוסר מהמועדפים"); }
      else { await api.post("/favorites", { provider_id: providerId }); setIsFavorite(true); toast.success("נוסף למועדפים"); }
    } catch { toast.error("שגיאה בעדכון מועדפים"); }
  };

  const handleStartChat = async () => {
    if (!isAuthenticated) { router.push("/login"); return; }
    try {
      const res = await api.post<{ room_id: string }>("/chat/rooms", { provider_id: providerId });
      router.push(`/chat/${res.room_id}`);
    } catch { toast.error("לא ניתן לפתוח צ׳אט"); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("הקישור הועתק");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = `בדוק/י את ${provider?.business_name ?? "הספק הזה"} ב-CareFD: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  /* --- loading skeleton --- */
  if (loading) return (
    <div className="container-main py-10">
      <Card className="p-8 mb-6"><div className="flex flex-col md:flex-row items-start gap-6">
        <Skeleton className="w-28 h-28 rounded-2xl" />
        <div className="flex-1 space-y-3"><Skeleton className="h-8 w-64" /><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-72" /></div>
      </div></Card>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
    </div>
  );

  if (!provider) return (
    <div className="text-center py-20">
      <p className="text-xl font-heading text-slate-600 mb-2">הספק לא נמצא</p>
      <Button variant="secondary" asChild><Link href="/providers">חזרה לרשימת המטפלים</Link></Button>
    </div>
  );

  const tabs = [
    { id: "services" as const, label: "שירותים", icon: CalendarDays },
    { id: "reviews" as const, label: "ביקורות", icon: Star },
    { id: "team" as const, label: "הצוות", icon: Users },
  ];

  return (
    <div className="container-main py-10 md:py-16">
      {/* ====== HEADER CARD ====== */}
      <Card className="p-8 md:p-10 mb-6 border-0 shadow-floating">
        <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8">
          {/* avatar */}
          <div className="w-28 h-28 rounded-2xl bg-carefd-teal/10 flex items-center justify-center text-carefd-teal font-heading font-bold text-4xl flex-shrink-0 overflow-hidden">
            {provider.profile_image
              ? <img src={provider.profile_image} alt="" className="w-full h-full object-cover" />
              : provider.business_name?.[0]}
          </div>

          {/* info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-3xl">{provider.business_name}</h1>
              {provider.is_verified && <Badge variant="success"><Shield className="w-3 h-3 me-1" />מאומת</Badge>}
              {provider.is_recommended && <Badge variant="accent"><Award className="w-3 h-3 me-1" />מומלץ</Badge>}
            </div>
            <p className="text-carefd-teal text-lg font-medium">{provider.profession_name}</p>
            {provider.specialization_name && <p className="text-slate-500">התמחות: {provider.specialization_name}</p>}

            <div className="flex items-center gap-5 mt-3 flex-wrap text-sm text-slate-500">
              {provider.location?.city && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{provider.location.city}</span>}
              {provider.years_experience && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{provider.years_experience} שנות ניסיון</span>}
              <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-carefd-teal fill-carefd-teal" />{provider.rating?.toFixed(1) ?? "0.0"} ({provider.total_reviews ?? 0} ביקורות)</span>
            </div>

            {/* action buttons row */}
            <div className="flex flex-wrap items-center gap-3 mt-5">
              {provider.show_phone !== false && provider.phone && (
                <Button asChild><a href={`tel:${provider.phone}`}><Phone className="w-4 h-4 me-2" />התקשרו</a></Button>
              )}
              {provider.show_whatsapp !== false && provider.whatsapp_number && (
                <Button variant="secondary" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" asChild>
                  <a href={`https://wa.me/${provider.whatsapp_number}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="w-4 h-4 me-2" />WhatsApp</a>
                </Button>
              )}
              <Button variant="secondary" onClick={handleStartChat}><MessageCircle className="w-4 h-4 me-2" />צ׳אט</Button>
              <Button variant="ghost" size="icon" onClick={() => setShowShare((p) => !p)} title="שתף"><Share2 className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={toggleFavorite} title={isFavorite ? "הסר ממועדפים" : "הוסף למועדפים"}>
                <Heart className={`w-4 h-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* share dropdown */}
        {showShare && (
          <div className="mt-4 p-4 bg-slate-50 rounded-2xl flex flex-wrap items-center gap-3">
            <Button variant="secondary" size="sm" onClick={copyLink}>{copied ? <Check className="w-3 h-3 me-1" /> : <Copy className="w-3 h-3 me-1" />}{copied ? "הועתק!" : "העתק קישור"}</Button>
            <Button variant="secondary" size="sm" onClick={shareWhatsApp}><MessageCircle className="w-3 h-3 me-1" />WhatsApp</Button>
          </div>
        )}

        {/* description */}
        {provider.description && <><Separator className="my-6" /><p className="text-slate-600 leading-relaxed">{provider.description}</p></>}
        {provider.about && <p className="text-slate-500 mt-4 leading-relaxed whitespace-pre-line">{provider.about}</p>}
      </Card>

      {/* ====== STATS BAR ====== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { value: provider.services_list?.length ?? 0, label: "שירותים" },
          { value: provider.total_reviews ?? 0, label: "ביקורות" },
          { value: provider.team_members?.length ?? 1, label: "אנשי צוות" },
          { value: provider.specializations?.length ?? 0, label: "התמחויות" },
        ].map((s) => (
          <Card key={s.label} className="p-5 text-center border-0 shadow-sm">
            <p className="text-3xl font-bold text-carefd-teal font-heading">{s.value}</p>
            <p className="text-sm text-slate-500 mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* ====== MAIN GRID ====== */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* --- left: tabbed content --- */}
        <div className="md:col-span-2 space-y-8">
          {/* tab bar */}
          <Card className="overflow-hidden border-0 shadow-floating">
            <div className="flex border-b border-slate-100">
              {tabs.map((t) => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 font-medium transition text-sm ${activeTab === t.id ? "text-carefd-teal border-b-2 border-carefd-teal bg-carefd-teal-pale/20" : "text-slate-400 hover:text-carefd-navy hover:bg-slate-50"}`}>
                  <t.icon className="w-4 h-4" />{t.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* --- SERVICES TAB --- */}
              {activeTab === "services" && (
                <div className="space-y-4">
                  {provider.services_list && provider.services_list.length > 0 ? provider.services_list.map((s) => {
                    const tc = serviceTypeConfig[s.service_type || ""] || serviceTypeConfig.clinic_visit;
                    const TypeIcon = tc.icon;
                    const unit = pricingUnits[s.pricing_type] ?? "";
                    return (
                      <div key={s.service_id} className="border border-slate-100 rounded-2xl p-5 hover:border-carefd-teal hover:shadow-md transition group">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap gap-2 mb-2">
                              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${tc.color}`}><TypeIcon className="w-3 h-3" />{tc.label}</span>
                              {s.service_category && <Badge variant="outline" className="text-xs">{s.service_category}</Badge>}
                            </div>
                            <h3 className="font-semibold text-lg text-carefd-navy">{s.name}</h3>
                            {s.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{s.description}</p>}
                            {s.duration_minutes && <span className="inline-flex items-center gap-1 text-xs text-slate-400 mt-2"><Clock className="w-3 h-3" />{s.duration_minutes} דקות</span>}
                          </div>
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <p className="font-heading font-bold text-2xl text-carefd-teal">{"\u20AA"}{s.price}{unit && <span className="text-sm text-slate-400 font-normal">/{unit}</span>}</p>
                            <Button size="sm" asChild><Link href={`/book/${s.service_id}`}>הזמן עכשיו<ChevronLeft className="w-3 h-3 ms-1" /></Link></Button>
                          </div>
                        </div>
                      </div>
                    );
                  }) : (
                    <p className="text-slate-400 text-center py-8">אין שירותים להצגה כרגע</p>
                  )}
                </div>
              )}

              {/* --- REVIEWS TAB --- */}
              {activeTab === "reviews" && (
                <div className="space-y-6">
                  {/* rating summary */}
                  <div className="bg-carefd-teal-pale/20 rounded-2xl p-6 flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-5xl font-bold text-carefd-teal font-heading">{provider.rating?.toFixed(1) ?? "0.0"}</p>
                      <div className="flex justify-center my-1">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-4 h-4 ${i < Math.round(provider.rating ?? 0) ? "text-yellow-500 fill-yellow-500" : "text-slate-200"}`} />)}</div>
                      <p className="text-xs text-slate-500">{provider.total_reviews ?? 0} ביקורות</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map((n) => {
                        const cnt = reviews.filter((r) => Math.round(r.rating) === n).length;
                        const pct = reviews.length ? (cnt / reviews.length) * 100 : 0;
                        return (
                          <div key={n} className="flex items-center gap-2 text-sm">
                            <span className="w-3">{n}</span><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-yellow-500 rounded-full" style={{ width: `${pct}%` }} /></div>
                            <span className="text-slate-400 w-6 text-end">{cnt}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* review list */}
                  {reviews.length > 0 ? reviews.map((r) => (
                    <div key={r.id ?? (r as any).review_id} className="pb-5 border-b border-slate-100 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 bg-carefd-teal/10 rounded-full flex items-center justify-center text-carefd-teal text-xs font-bold">{r.user?.name?.[0] ?? "?"}</div>
                        <span className="font-medium text-carefd-navy text-sm">{r.user?.name}</span>
                        <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-3 h-3 ${i < r.rating ? "text-yellow-500 fill-yellow-500" : "text-slate-200"}`} />)}</div>
                        <span className="text-xs text-slate-400 ms-auto">{new Date(r.createdAt).toLocaleDateString("he-IL")}</span>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">{r.comment}</p>
                    </div>
                  )) : <p className="text-slate-400 text-center py-8">עדיין אין ביקורות</p>}
                </div>
              )}

              {/* --- TEAM TAB --- */}
              {activeTab === "team" && (
                <div>
                  {provider.team_members && provider.team_members.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {provider.team_members.map((m: any) => (
                        <div key={m.member_id} className="border-2 border-slate-100 rounded-2xl p-5 hover:border-carefd-teal transition">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-carefd-navy rounded-xl flex items-center justify-center text-white text-lg font-bold">{(m.name || "M")[0]}</div>
                            <div><h4 className="font-semibold text-carefd-navy">{m.name}</h4><p className="text-carefd-teal text-sm">{m.role}</p></div>
                          </div>
                          {m.specializations?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">{m.specializations.map((s: string, i: number) => <Badge key={i} variant="outline" className="text-xs">{s}</Badge>)}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-carefd-navy rounded-xl flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">{provider.business_name?.[0]}</div>
                      <h4 className="font-semibold text-carefd-navy">{provider.business_name}</h4>
                      <p className="text-slate-400 text-sm">בעלים</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* --- right sidebar --- */}
        <div className="space-y-6">
          {/* specializations */}
          {provider.specializations && provider.specializations.length > 0 && (
            <Card className="p-6">
              <h3 className="font-heading font-semibold text-carefd-navy mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-carefd-teal" />התמחויות</h3>
              <div className="flex flex-wrap gap-2">{provider.specializations.map((s: string, i: number) => <Badge key={i} className="bg-carefd-teal text-white">{s}</Badge>)}</div>
            </Card>
          )}

          {/* education */}
          {(provider.education?.length ?? 0) > 0 && provider.education!.some((e: any) => e.institution || e.degree) && (
            <Card className="p-6">
              <h3 className="font-heading font-semibold text-carefd-navy mb-3 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-carefd-teal" />השכלה</h3>
              <div className="space-y-3">
                {provider.education!.filter((e: any) => e.institution || e.degree).map((edu: any, i: number) => (
                  <div key={i} className="border-r-4 border-carefd-teal pr-3">
                    <p className="font-medium text-carefd-navy">{educationLevelLabels[edu.degree] || edu.degree}</p>
                    {edu.field && <p className="text-sm text-slate-500">{edu.field}</p>}
                    {edu.institution && <p className="text-sm text-slate-400">{edu.institution}</p>}
                    {edu.year && <p className="text-xs text-slate-400 mt-0.5">{edu.year}</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* certifications */}
          {(provider.certifications?.length ?? 0) > 0 && provider.certifications!.some((c: any) => c.name || c.license_number) && (
            <Card className="p-6">
              <h3 className="font-heading font-semibold text-carefd-navy mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-carefd-teal" />תעודות ורישיונות</h3>
              <div className="space-y-3">
                {provider.certifications!.filter((c: any) => c.name || c.license_number).map((cert: any, i: number) => (
                  <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="font-medium text-carefd-navy text-sm">{cert.name}</p>
                    {cert.issuer && <p className="text-xs text-slate-500 mt-0.5">מנפיק: {cert.issuer}</p>}
                    {cert.license_number && <p className="text-xs text-slate-400">מספר רישיון: {cert.license_number}</p>}
                    {cert.year && <p className="text-xs text-slate-400">שנה: {cert.year}</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* languages */}
          {provider.languages?.length > 0 && (
            <Card className="p-6">
              <h3 className="font-heading font-semibold text-carefd-navy mb-3 flex items-center gap-2"><Globe className="w-4 h-4 text-carefd-teal" />שפות</h3>
              <div className="flex flex-wrap gap-2">{provider.languages.map((l: string) => <Badge key={l} variant="outline">{l}</Badge>)}</div>
            </Card>
          )}

          {/* health funds */}
          {provider.health_funds?.length > 0 && (
            <Card className="p-6">
              <h3 className="font-heading font-semibold text-carefd-navy mb-3 flex items-center gap-2"><Heart className="w-4 h-4 text-carefd-teal" />קופות חולים</h3>
              <div className="flex flex-wrap gap-2">{provider.health_funds.map((f: string) => <Badge key={f} variant="outline">{f}</Badge>)}</div>
            </Card>
          )}

          {/* payment methods */}
          {provider.payment_methods?.length > 0 && (
            <Card className="p-6">
              <h3 className="font-heading font-semibold text-carefd-navy mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-carefd-teal" />אמצעי תשלום</h3>
              <div className="flex flex-wrap gap-2">{provider.payment_methods.map((m: string, i: number) => <Badge key={i} variant="outline">{m}</Badge>)}</div>
            </Card>
          )}

          {/* availability */}
          <Card className="p-6">
            <h3 className="font-heading font-semibold text-carefd-navy mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-carefd-teal" />זמינות</h3>
            {provider.availability && provider.availability.length > 0 ? (
              <div className="space-y-2.5">
                {DAYS_ORDER.map((day) => {
                  const slots = (provider.availability as any[]).filter((a) => a.day === day && a.is_available);
                  return (
                    <div key={day} className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 font-medium w-14">{dayLabels[day]}</span>
                      <div className="flex gap-1 flex-1 justify-end">
                        {slots.length > 0
                          ? slots.map((s, i) => <span key={i} className={`px-2 py-0.5 rounded text-xs ${shiftColors[s.shift] || "bg-slate-100"}`}>{shiftLabels[s.shift] || s.shift}</span>)
                          : <span className="text-slate-300 text-xs">לא זמין</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-400 text-sm text-center py-4">לא צוינו שעות זמינות</p>
            )}
          </Card>

          {/* cancellation policy */}
          {(provider as any).cancellation_policy && (
            <Card className="p-6">
              <h3 className="font-heading font-semibold text-carefd-navy mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-carefd-teal" />מדיניות ביטולים</h3>
              {(provider as any).cancellation_notice_hours && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2.5 mb-3">
                  <p className="text-xs text-yellow-800 font-medium">נדרשת הודעה מראש: {(provider as any).cancellation_notice_hours} שעות</p>
                </div>
              )}
              <p className="text-slate-500 text-sm whitespace-pre-line leading-relaxed">{(provider as any).cancellation_policy}</p>
            </Card>
          )}

          {/* location */}
          {provider.location && (
            <Card className="p-6">
              <h3 className="font-heading font-semibold text-carefd-navy mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-carefd-teal" />מיקום</h3>
              <p className="text-slate-500 text-sm">{provider.location.address && `${provider.location.address}, `}{provider.location.city}</p>
              {(provider.location as any)?.coverage_radius_km && <p className="text-xs text-slate-400 mt-1">רדיוס שירות: {(provider.location as any).coverage_radius_km} ק״מ</p>}
              {(provider as any).service_areas?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
                  {(provider as any).service_areas.map((a: string, i: number) => <Badge key={i} variant="outline" className="text-xs">{a}</Badge>)}
                </div>
              )}
            </Card>
          )}

          {/* about */}
          {provider.about && (
            <Card className="p-6">
              <h3 className="font-heading font-semibold text-carefd-navy mb-3 flex items-center gap-2"><User className="w-4 h-4 text-carefd-teal" />אודות</h3>
              <p className="text-slate-500 text-sm leading-relaxed whitespace-pre-line">{provider.about}</p>
            </Card>
          )}

          {/* target audience */}
          {(provider as any).target_audience?.length > 0 && (
            <Card className="p-6">
              <h3 className="font-heading font-semibold text-carefd-navy mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-carefd-teal" />קהל יעד</h3>
              <div className="flex flex-wrap gap-2">
                {((provider as any).target_audience as string[]).map((t, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                ))}
              </div>
            </Card>
          )}

          {/* gender */}
          {provider.gender && (
            <Card className="p-6">
              <h3 className="font-heading font-semibold text-carefd-navy mb-3">מגדר</h3>
              <p className="text-slate-500 text-sm">{provider.gender === "male" ? "גבר" : provider.gender === "female" ? "אישה" : provider.gender}</p>
            </Card>
          )}

          {/* contact CTA */}
          <Card className="p-6 bg-gradient-to-br from-carefd-teal to-carefd-navy text-white border-0">
            <h3 className="font-heading font-semibold text-lg mb-2">צור קשר</h3>
            <p className="text-white/80 text-sm mb-4">מעוניינים בשירותים? צרו קשר ונשמח לעזור</p>
            <Button variant="secondary" className="w-full bg-white text-carefd-teal hover:bg-carefd-teal-pale" onClick={handleStartChat}>
              <MessageCircle className="w-4 h-4 me-2" />שלח הודעה
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
