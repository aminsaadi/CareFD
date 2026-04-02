"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api-client";
import type { Provider, Review } from "@/lib/types";

export default function ProviderProfilePage() {
  const { providerId } = useParams();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!providerId) return;
    Promise.all([
      api.get<Provider>(`/providers/${providerId}`),
      api.get<{ reviews: Review[] }>(`/reviews`, { provider_id: providerId as string }),
    ]).then(([p, r]) => {
      setProvider(p);
      setReviews(r.reviews);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [providerId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full" /></div>;
  if (!provider) return <div className="text-center py-20 text-gray-500">הספק לא נמצא</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8" dir="rtl">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-3xl flex-shrink-0">
            {provider.profile_image ? <img src={provider.profile_image} alt="" className="w-full h-full rounded-full object-cover" /> : provider.business_name?.[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{provider.business_name}</h1>
              {provider.is_verified && <span className="bg-teal-100 text-teal-700 text-sm px-3 py-1 rounded-full font-medium">✓ מאומת</span>}
              {provider.is_recommended && <span className="bg-yellow-100 text-yellow-700 text-sm px-3 py-1 rounded-full font-medium">⭐ מומלץ</span>}
            </div>
            <p className="text-teal-600 text-lg">{provider.profession_name}</p>
            {provider.specialization_name && <p className="text-gray-500">התמחות: {provider.specialization_name}</p>}
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
              {provider.location?.city && <span>📍 {provider.location.city}</span>}
              {provider.years_experience && <span>📅 {provider.years_experience} שנות ניסיון</span>}
              <span>⭐ {provider.rating.toFixed(1)} ({provider.total_reviews} ביקורות)</span>
            </div>
          </div>
          {/* Contact buttons */}
          <div className="flex flex-col gap-2">
            {provider.show_phone && provider.phone && <a href={`tel:${provider.phone}`} className="bg-teal-600 text-white px-6 py-3 rounded-xl font-medium text-center hover:bg-teal-700">📞 התקשר</a>}
            {provider.show_whatsapp && provider.whatsapp_number && <a href={`https://wa.me/${provider.whatsapp_number}`} target="_blank" className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium text-center hover:bg-green-700">💬 WhatsApp</a>}
          </div>
        </div>
        {provider.description && <p className="mt-6 text-gray-700 leading-relaxed">{provider.description}</p>}
        {provider.about && <p className="mt-4 text-gray-600">{provider.about}</p>}
      </div>

      {/* Services */}
      {provider.services_list && provider.services_list.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">שירותים</h2>
          <div className="space-y-3">
            {provider.services_list.map((s) => (
              <div key={s.service_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h3 className="font-medium text-gray-900">{s.name}</h3>
                  {s.description && <p className="text-sm text-gray-500 mt-1">{s.description}</p>}
                </div>
                <div className="text-left">
                  <p className="font-bold text-teal-600 text-lg">₪{s.price}</p>
                  <Link href={`/book/${s.service_id}`} className="text-sm text-teal-600 hover:underline">הזמן</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {provider.languages?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-gray-900 mb-3">שפות</h3>
            <div className="flex flex-wrap gap-2">
              {provider.languages.map((l) => <span key={l} className="bg-gray-100 px-3 py-1 rounded-full text-sm">{l}</span>)}
            </div>
          </div>
        )}
        {provider.health_funds?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-gray-900 mb-3">קופות חולים</h3>
            <div className="flex flex-wrap gap-2">
              {provider.health_funds.map((f) => <span key={f} className="bg-gray-100 px-3 py-1 rounded-full text-sm">{f}</span>)}
            </div>
          </div>
        )}
      </div>

      {/* Reviews */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">ביקורות ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <p className="text-gray-500">אין ביקורות עדיין</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">{r.user?.name}</span>
                  <span className="text-yellow-500">{"⭐".repeat(Math.round(r.rating))}</span>
                  <span className="text-sm text-gray-400">{new Date(r.createdAt).toLocaleDateString("he-IL")}</span>
                </div>
                <p className="text-gray-700">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
