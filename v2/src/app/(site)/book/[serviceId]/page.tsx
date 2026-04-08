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
import { toast } from "sonner";
import {
  CheckCircle, Calendar, Clock, MapPin, User, Phone, Mail,
  FileText, ChevronLeft, Star, ShieldCheck, Tag, Loader2, LogIn,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const DELIVERY_LABELS: Record<string, { label: string; emoji: string }> = {
  home_visit: { label: "בבית הלקוח", emoji: "🏠" },
  hospital:   { label: 'בי"ח / מוסד', emoji: "🏥" },
  clinic:     { label: "בקליניקה", emoji: "🏢" },
  virtual:    { label: "וירטואלי", emoji: "💻" },
};

const CATEGORY_LABELS: Record<string, { label: string; pricing: string }> = {
  visit:        { label: "ביקור", pricing: "לביקור" },
  hourly:       { label: "שעתי", pricing: "לשעה" },
  consultation: { label: "יעוץ", pricing: "ליעוץ" },
  product:      { label: "מוצר", pricing: "ליחידה" },
  procedure:    { label: "פעולה", pricing: "לפעולה" },
  series:       { label: "סדרה", pricing: "לסדרה" },
};

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function BookServicePage() {
  const { serviceId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<any>(null);
  const [form, setForm] = useState({
    delivery_type: "", booking_date: "", booking_time: "",
    service_city: "", service_address: "",
    client_name: "", client_phone: "", client_email: "",
    notes: "",
  });

  /* ---------- fetch service ---------- */
  useEffect(() => {
    if (!serviceId) return;
    api.get<any>(`/services/${serviceId}`)
      .then((data) => {
        setService(data);
        const dt = data.delivery_types || [];
        if (dt.length === 1) setForm((f) => ({ ...f, delivery_type: dt[0] }));
      })
      .catch(() => toast.error("שגיאה בטעינת השירות"))
      .finally(() => setLoading(false));
  }, [serviceId]);

  /* ---------- pre-fill user details ---------- */
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      client_name: f.client_name || user.name || "",
      client_phone: f.client_phone || user.phone || "",
      client_email: f.client_email || user.email || "",
    }));
  }, [user]);

  /* ---------- derived ---------- */
  const provider = service?.provider;
  const category = service?.service_category || "visit";
  const catInfo = CATEGORY_LABELS[category] || CATEGORY_LABELS.visit;
  const needsAddress = form.delivery_type === "home_visit" || form.delivery_type === "clinic";
  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  /* ---------- submit ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    setSubmitting(true);
    try {
      const data = await api.post<any>("/bookings", {
        service_id: serviceId,
        booking_date: form.booking_date || undefined,
        booking_time: form.booking_time || undefined,
        delivery_type: form.delivery_type || undefined,
        client_name: form.client_name || undefined,
        client_phone: form.client_phone || undefined,
        client_email: form.client_email || undefined,
        notes: form.notes || undefined,
        service_address: form.service_address || undefined,
        service_city: form.service_city || undefined,
      });
      setSuccess(data);
      toast.success("ההזמנה נשלחה בהצלחה!");
    } catch (err: any) {
      toast.error(err.message || "שגיאה ביצירת ההזמנה");
    } finally {
      setSubmitting(false);
    }
  };

  /* ================================================================ */
  /*  Loading                                                         */
  /* ================================================================ */
  if (loading) return (
    <div className="container-main py-10 max-w-5xl">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    </div>
  );

  /* ================================================================ */
  /*  Not found                                                       */
  /* ================================================================ */
  if (!service) return (
    <div className="text-center py-20">
      <p className="text-xl font-heading text-slate-600 mb-2">השירות לא נמצא</p>
      <Button variant="secondary" asChild>
        <Link href="/services">חזרה לשירותים</Link>
      </Button>
    </div>
  );

  /* ================================================================ */
  /*  Success screen                                                  */
  /* ================================================================ */
  if (success) return (
    <div className="container-main py-16 max-w-2xl">
      <Card className="p-10 text-center shadow-floating border-0">
        <div className="w-20 h-20 bg-carefd-teal/10 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-carefd-teal" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-carefd-navy mb-2">ההזמנה נשלחה בהצלחה!</h2>
        <p className="text-slate-500 mb-1">
          מספר הזמנה: <span className="font-mono font-semibold text-carefd-navy">{success.booking_number}</span>
        </p>
        <p className="text-slate-500 mb-2">
          מחיר סופי: <span className="font-heading font-bold text-carefd-navy">{"\u20AA"}{success.final_price}</span>
        </p>
        <div className="bg-carefd-teal-pale/30 rounded-xl p-5 text-right text-sm space-y-1.5 my-6 max-w-sm mx-auto">
          <p><strong>שירות:</strong> {service.name}</p>
          {provider && <p><strong>ספק:</strong> {provider.business_name || provider.businessName}</p>}
          {form.delivery_type && <p><strong>מיקום:</strong> {DELIVERY_LABELS[form.delivery_type]?.label}</p>}
          {form.booking_date && <p><strong>תאריך:</strong> {form.booking_date}</p>}
          {form.booking_time && <p><strong>שעה:</strong> {form.booking_time}</p>}
        </div>
        <div className="flex gap-3 justify-center">
          <Button asChild size="lg">
            <Link href="/bookings">
              לצפייה בהזמנות <ChevronLeft className="w-4 h-4 ms-2" />
            </Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link href="/services">חזרה לשירותים</Link>
          </Button>
        </div>
      </Card>
    </div>
  );

  /* ================================================================ */
  /*  Main booking form                                               */
  /* ================================================================ */
  const deliveryTypes: string[] = service.delivery_types || [];

  return (
    <div className="container-main py-10 md:py-16 max-w-5xl">
      <h1 className="mb-6">הזמנת שירות</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ============ LEFT COLUMN ============ */}
        <div className="lg:col-span-2 space-y-5">
          {/* --- Login prompt --- */}
          {!isAuthenticated && (
            <Card className="p-5 border-2 border-amber-300 bg-amber-50/60">
              <div className="flex items-center gap-3 justify-between flex-wrap">
                <p className="text-sm font-semibold text-carefd-navy">
                  כדי להשלים הזמנה, יש להתחבר למערכת
                </p>
                <Button asChild size="sm" className="gap-1.5">
                  <Link href={`/login?redirect=/book/${serviceId}`}>
                    <LogIn className="w-4 h-4" /> התחברות
                  </Link>
                </Button>
              </div>
            </Card>
          )}

          {/* --- Provider info card --- */}
          {provider && (
            <Card className="p-5 border-0 bg-white shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-carefd-navy flex items-center justify-center text-white text-xl font-bold flex-shrink-0 overflow-hidden">
                  {provider.profile_image
                    ? <img src={provider.profile_image} alt="" className="w-full h-full object-cover" />
                    : (provider.business_name || provider.businessName || "S")?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-heading font-semibold text-lg text-carefd-navy leading-tight">
                      {provider.business_name || provider.businessName}
                    </h3>
                    {(provider.is_verified || provider.isVerified) && (
                      <Badge variant="secondary" className="gap-1 text-xs bg-carefd-teal/10 text-carefd-teal border-0">
                        <ShieldCheck className="w-3 h-3" /> מאומת
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                    {provider.rating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                        {Number(provider.rating).toFixed(1)}
                      </span>
                    )}
                    {provider.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {provider.city}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* --- Service info card --- */}
          <Card className="p-5 bg-carefd-stone/50 border-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-heading font-semibold text-lg text-carefd-navy">{service.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    <Tag className="w-3 h-3 me-1" /> {catInfo.label}
                  </Badge>
                </div>
                {service.description && (
                  <p className="text-slate-500 text-sm mt-1 line-clamp-2">{service.description}</p>
                )}
                <div className="flex items-center gap-4 mt-3 flex-wrap text-sm text-slate-500">
                  {service.duration_minutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {service.duration_minutes} דקות
                    </span>
                  )}
                  {deliveryTypes.length > 0 && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {deliveryTypes.map((d) => DELIVERY_LABELS[d]?.emoji).filter(Boolean).join(" ")}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-left flex-shrink-0">
                <p className="text-2xl font-heading font-bold text-carefd-teal">{"\u20AA"}{service.price}</p>
                <p className="text-xs text-slate-400">{catInfo.pricing}</p>
              </div>
            </div>
          </Card>

          {/* --- Booking form card --- */}
          <Card className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Delivery type selector */}
              {deliveryTypes.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">איפה ניתן השירות?</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {deliveryTypes.map((dt) => {
                      const info = DELIVERY_LABELS[dt] || { label: dt, emoji: "📋" };
                      const active = form.delivery_type === dt;
                      return (
                        <button key={dt} type="button" onClick={() => set("delivery_type", dt)}
                          data-testid={`delivery-type-${dt}`}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${
                            active ? "border-carefd-teal bg-carefd-teal/5 shadow-sm" : "border-slate-200 hover:border-carefd-teal/40"
                          }`}>
                          <span className="text-2xl block mb-1">{info.emoji}</span>
                          <span className="text-xs font-medium text-carefd-navy">{info.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Date / Time */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> מועד
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input type="date" value={form.booking_date}
                    onChange={(e) => set("booking_date", e.target.value)} data-testid="book-date" />
                  <Input type="time" value={form.booking_time}
                    onChange={(e) => set("booking_time", e.target.value)} data-testid="book-time" />
                </div>
              </div>

              {/* Address fields (conditional) */}
              {needsAddress && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> כתובת
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input value={form.service_city} onChange={(e) => set("service_city", e.target.value)}
                      placeholder="עיר" data-testid="book-city" />
                    <Input value={form.service_address} onChange={(e) => set("service_address", e.target.value)}
                      placeholder="רחוב, מספר בית" data-testid="book-address" />
                  </div>
                </div>
              )}

              {/* Client details */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> פרטי מזמין
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input value={form.client_name} onChange={(e) => set("client_name", e.target.value)}
                    placeholder="שם מלא" data-testid="book-name" />
                  <Input value={form.client_phone} onChange={(e) => set("client_phone", e.target.value)}
                    placeholder="050-0000000" dir="ltr" data-testid="book-phone" />
                  <Input type="email" value={form.client_email} onChange={(e) => set("client_email", e.target.value)}
                    placeholder="email@example.com" dir="ltr" data-testid="book-email" />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" /> הערות
                </label>
                <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
                  placeholder="הערות מיוחדות, בקשות, מידע רלוונטי..." rows={3} data-testid="book-notes" />
              </div>

              {/* Submit */}
              <Button type="submit" disabled={submitting || !isAuthenticated} size="lg"
                className="w-full h-14 rounded-xl bg-gradient-to-l from-carefd-teal to-carefd-teal-medium hover:from-carefd-teal-medium hover:to-carefd-teal shadow-glow hover:shadow-lg transition-all text-lg disabled:opacity-60"
                data-testid="book-submit">
                {submitting
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <>הזמינו - {"\u20AA"}{service.price}</>}
              </Button>
            </form>
          </Card>
        </div>

        {/* ============ RIGHT COLUMN: price summary ============ */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <Card className="p-5 border-2 border-carefd-teal shadow-sm">
              <h3 className="font-heading font-semibold text-base text-carefd-navy mb-4">סיכום הזמנה</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">שירות:</span>
                  <span className="font-medium text-carefd-navy truncate max-w-[60%] text-left">{service.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">סוג:</span>
                  <span className="font-medium text-carefd-navy">{catInfo.label}</span>
                </div>
                {form.delivery_type && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">מיקום:</span>
                    <span className="font-medium text-carefd-navy">{DELIVERY_LABELS[form.delivery_type]?.label}</span>
                  </div>
                )}
                {form.booking_date && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">תאריך:</span>
                    <span className="font-medium text-carefd-navy">{form.booking_date}</span>
                  </div>
                )}
                {form.booking_time && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">שעה:</span>
                    <span className="font-medium text-carefd-navy">{form.booking_time}</span>
                  </div>
                )}

                <div className="border-t border-carefd-teal-pale my-3" />
                <div className="flex justify-between">
                  <span className="text-slate-500">מחיר בסיס:</span>
                  <span className="font-medium">{"\u20AA"}{service.price}</span>
                </div>
                <div className="border-t border-carefd-teal-pale my-3" />
                <div className="flex justify-between text-lg">
                  <span className="font-bold text-carefd-navy">{"סה\"כ:"}</span>
                  <span className="font-bold text-carefd-teal">{"\u20AA"}{service.price}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
