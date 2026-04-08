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
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Calendar, Clock, MapPin, User, Phone, FileText, ChevronLeft } from "lucide-react";

export default function BookServicePage() {
  const { serviceId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    booking_date: "", booking_time: "", delivery_type: "",
    client_name: "", client_phone: "", notes: "",
    service_address: "", service_city: "",
  });
  const [success, setSuccess] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!serviceId) return;
    api.get(`/services/${serviceId}`).then(setService).catch(() => {}).finally(() => setLoading(false));
  }, [serviceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const data = await api.post<any>("/bookings", {
        service_id: serviceId,
        booking_date: form.booking_date || undefined,
        booking_time: form.booking_time || undefined,
        delivery_type: form.delivery_type || undefined,
        client_name: form.client_name || user?.name,
        client_phone: form.client_phone,
        notes: form.notes || undefined,
        service_address: form.service_address || undefined,
        service_city: form.service_city || undefined,
      });
      setSuccess(data);
    } catch (err: any) {
      setError(err.message || "שגיאה ביצירת ההזמנה");
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="container-main py-10 max-w-2xl">
      <Skeleton className="h-10 w-48 mb-6" />
      <Card className="p-8 mb-6"><Skeleton className="h-24 w-full" /></Card>
      <Card className="p-8"><Skeleton className="h-64 w-full" /></Card>
    </div>
  );

  if (!service) return (
    <div className="text-center py-20">
      <p className="text-xl font-heading text-slate-600 mb-2">השירות לא נמצא</p>
      <Button variant="secondary" asChild>
        <Link href="/services">חזרה לשירותים</Link>
      </Button>
    </div>
  );

  if (success) return (
    <div className="container-main py-16 max-w-2xl">
      <Card className="p-10 text-center shadow-floating border-0">
        <div className="w-16 h-16 bg-carefd-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-carefd-teal" />
        </div>
        <h2 className="mb-2">ההזמנה נשלחה בהצלחה!</h2>
        <p className="text-slate-500 mb-1">מספר הזמנה: <span className="font-mono font-semibold text-carefd-navy">{success.booking_number}</span></p>
        <p className="text-slate-500 mb-8">מחיר סופי: <span className="font-heading font-bold text-carefd-navy">{"\u20AA"}{success.final_price}</span></p>
        <Button asChild size="lg">
          <Link href="/bookings">
            לצפייה בהזמנות
            <ChevronLeft className="w-4 h-4 ms-2" />
          </Link>
        </Button>
      </Card>
    </div>
  );

  return (
    <div className="container-main py-10 md:py-16 max-w-2xl">
      <h1 className="mb-2">הזמנת שירות</h1>

      {/* Service Info */}
      <Card className="p-6 mb-8 bg-carefd-stone/50 border-0">
        <h3 className="font-heading font-semibold text-lg text-carefd-navy">{service.name}</h3>
        {service.description && <p className="text-slate-500 text-sm mt-1">{service.description}</p>}
        <p className="text-2xl font-heading font-bold text-carefd-navy mt-3">{"\u20AA"}{service.price}</p>
        {service.provider && <p className="text-sm text-slate-400 mt-1">{service.provider.businessName}</p>}
      </Card>

      {/* Booking Form */}
      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4 border border-red-100">{error}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                תאריך
              </label>
              <Input
                type="date"
                value={form.booking_date}
                onChange={(e) => setForm({ ...form, booking_date: e.target.value })}
                data-testid="book-date"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                שעה
              </label>
              <Input
                type="time"
                value={form.booking_time}
                onChange={(e) => setForm({ ...form, booking_time: e.target.value })}
                data-testid="book-time"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              שם
            </label>
            <Input
              value={form.client_name || user?.name || ""}
              onChange={(e) => setForm({ ...form, client_name: e.target.value })}
              data-testid="book-name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              טלפון
            </label>
            <Input
              value={form.client_phone}
              onChange={(e) => setForm({ ...form, client_phone: e.target.value })}
              placeholder="050-0000000"
              dir="ltr"
              data-testid="book-phone"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              כתובת לשירות
            </label>
            <Input
              value={form.service_address}
              onChange={(e) => setForm({ ...form, service_address: e.target.value })}
              data-testid="book-address"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              הערות
            </label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              data-testid="book-notes"
            />
          </div>

          <Button type="submit" className="w-full h-14 rounded-xl bg-gradient-to-l from-carefd-teal to-carefd-teal-medium hover:from-carefd-teal-medium hover:to-carefd-teal shadow-glow hover:shadow-lg transition-all text-lg" size="lg" disabled={submitting} data-testid="book-submit">
            {submitting ? (
              <span className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
            ) : (
              `הזמינו - ${"\u20AA"}${service.price}`
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
