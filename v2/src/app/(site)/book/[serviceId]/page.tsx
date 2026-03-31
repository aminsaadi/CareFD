"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";

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

  useEffect(() => {
    if (!serviceId) return;
    api.get(`/services/${serviceId}`).then(setService).catch(() => {}).finally(() => setLoading(false));
  }, [serviceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
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
      alert(err.message || "שגיאה ביצירת ההזמנה");
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full" /></div>;
  if (!service) return <div className="text-center py-20 text-gray-500">השירות לא נמצא</div>;

  if (success) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-teal-600 mb-4">✓ ההזמנה נשלחה!</h1>
        <p className="text-gray-600 mb-2">מספר הזמנה: {success.booking_number}</p>
        <p className="text-gray-600 mb-6">מחיר סופי: ₪{success.final_price}</p>
        <button onClick={() => router.push("/bookings")} className="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700">
          לצפייה בהזמנות
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8" dir="rtl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">הזמנת שירות</h1>

      {/* Service Info */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold">{service.name}</h2>
        <p className="text-gray-600 mt-1">{service.description}</p>
        <p className="text-2xl font-bold text-teal-600 mt-3">₪{service.price}</p>
        {service.provider && <p className="text-sm text-gray-500 mt-1">{service.provider.businessName}</p>}
      </div>

      {/* Booking Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תאריך</label>
            <input type="date" value={form.booking_date} onChange={(e) => setForm({ ...form, booking_date: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שעה</label>
            <input type="time" value={form.booking_time} onChange={(e) => setForm({ ...form, booking_time: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שם</label>
          <input value={form.client_name || user?.name || ""} onChange={(e) => setForm({ ...form, client_name: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
          <input value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none" placeholder="050-0000000" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">כתובת לשירות</label>
          <input value={form.service_address} onChange={(e) => setForm({ ...form, service_address: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none" />
        </div>
        <button type="submit" disabled={submitting}
          className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 disabled:opacity-50 text-lg">
          {submitting ? "שולח..." : `הזמן - ₪${service.price}`}
        </button>
      </form>
    </div>
  );
}
