"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin, Star, Shield, Phone, MessageCircle, Clock,
  Globe, Heart, Award, ChevronLeft, Building2, Users,
  Calendar, Briefcase,
} from "lucide-react";
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

  if (loading) return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-r from-carefd-navy via-carefd-slate to-carefd-teal py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <Skeleton className="w-32 h-32 lg:w-40 lg:h-40 rounded-2xl bg-white/20" />
            <div className="flex-1">
              <Skeleton className="h-10 w-64 mb-3 bg-white/20" />
              <Skeleton className="h-6 w-40 mb-2 bg-white/20" />
              <Skeleton className="h-4 w-60 bg-white/20" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  if (!provider) return (
    <div className="min-h-screen bg-white flex items-center justify-center py-20">
      <div className="text-center">
        <p className="text-xl font-heading text-carefd-navy mb-4">הספק לא נמצא</p>
        <Button variant="secondary" asChild>
          <Link href="/providers">חזרה לרשימת המטפלים</Link>
        </Button>
      </div>
    </div>
  );

  const servicesCount = provider.services_list?.length || 0;
  const specsCount = (provider.specializations as any[])?.length || 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - V1 style gradient */}
      <section className="bg-gradient-to-r from-carefd-navy via-carefd-slate to-carefd-teal text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8">
            {/* Avatar */}
            <div className={`w-32 h-32 lg:w-40 lg:h-40 rounded-2xl shadow-xl flex items-center justify-center flex-shrink-0 overflow-hidden ${provider.profile_image ? "bg-white" : "bg-gradient-to-br from-carefd-teal to-carefd-navy"}`}>
              {provider.profile_image ? (
                <img src={provider.profile_image} alt={provider.business_name || ""} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-5xl font-bold font-heading">{provider.business_name?.[0]}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-3xl md:text-4xl font-bold font-heading">{provider.business_name}</h1>
                {provider.is_verified && (
                  <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm font-medium border border-green-400/30">
                    <Shield className="w-3.5 h-3.5" />
                    מאומת
                  </span>
                )}
                {provider.is_recommended && (
                  <span className="inline-flex items-center gap-1 bg-amber-400/20 text-amber-300 px-3 py-1 rounded-full text-sm font-medium border border-amber-400/30">
                    <Award className="w-3.5 h-3.5" />
                    מומלץ
                  </span>
                )}
              </div>

              <p className="text-xl text-carefd-teal-pale font-medium mb-3">{provider.profession_name}</p>

              {provider.specialization_name && (
                <span className="inline-block bg-white/20 text-white px-3 py-1 rounded-full text-sm mb-4">
                  {provider.specialization_name}
                </span>
              )}

              {/* Stats badges */}
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                {provider.location?.city && (
                  <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-sm">
                    <MapPin className="w-4 h-4" />
                    {provider.location.city}
                  </span>
                )}
                {provider.years_experience && (
                  <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-sm">
                    <Clock className="w-4 h-4" />
                    {provider.years_experience} שנות ניסיון
                  </span>
                )}
                {(provider as any).provider_type && (
                  <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-sm">
                    <Building2 className="w-4 h-4" />
                    {(provider as any).provider_type === "individual" ? "עצמאי" : (provider as any).provider_type === "clinic" ? "מרפאה" : "חברה"}
                  </span>
                )}
                {provider.rating > 0 && (
                  <span className="inline-flex items-center gap-2 bg-yellow-500/20 px-3 py-1.5 rounded-full text-sm border border-yellow-400/30">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <strong>{provider.rating.toFixed(1)}</strong> ({provider.total_reviews} ביקורות)
                  </span>
                )}
              </div>

              {provider.description && (
                <p className="text-carefd-teal-pale mt-5 leading-relaxed max-w-2xl">{provider.description}</p>
              )}
            </div>

            {/* Action Buttons Column */}
            <div className="flex flex-col gap-3 w-full lg:w-auto lg:min-w-[200px]">
              {provider.show_phone && provider.phone && (
                <a
                  href={`tel:${provider.phone}`}
                  className="flex items-center justify-center gap-2 bg-carefd-teal hover:bg-carefd-teal-medium text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                  data-testid="provider-call"
                >
                  <Phone className="w-4 h-4" />
                  התקשרו
                </a>
              )}
              {provider.show_whatsapp && provider.whatsapp_number && (
                <a
                  href={`https://wa.me/${provider.whatsapp_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                  data-testid="provider-whatsapp"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              )}
              <Link
                href={`/chats?provider=${provider.provider_id}`}
                className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                צ&apos;אט
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-carefd-teal-pale">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-carefd-teal-pale/30 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Briefcase className="w-6 h-6 text-carefd-teal" />
              </div>
              <p className="text-2xl font-bold text-carefd-navy font-heading">{servicesCount}</p>
              <p className="text-xs text-carefd-gray">שירותים</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-carefd-teal-pale/30 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Star className="w-6 h-6 text-carefd-teal" />
              </div>
              <p className="text-2xl font-bold text-carefd-navy font-heading">{reviews.length}</p>
              <p className="text-xs text-carefd-gray">ביקורות</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-carefd-teal-pale/30 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6 text-carefd-teal" />
              </div>
              <p className="text-2xl font-bold text-carefd-navy font-heading">{provider.years_experience || 0}</p>
              <p className="text-xs text-carefd-gray">שנות ניסיון</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-carefd-teal-pale/30 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-6 h-6 text-carefd-teal" />
              </div>
              <p className="text-2xl font-bold text-carefd-navy font-heading">{specsCount}</p>
              <p className="text-xs text-carefd-gray">התמחויות</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main column */}
          <div className="md:col-span-2 space-y-8">
            {/* Services */}
            {provider.services_list && provider.services_list.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-carefd-teal-pale">
                <h2 className="text-xl font-heading font-bold text-carefd-navy mb-6 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-carefd-teal" />
                  שירותים
                </h2>
                <div className="space-y-3">
                  {provider.services_list.map((s) => (
                    <div key={s.service_id} className="flex items-center justify-between p-4 bg-carefd-teal-pale/20 rounded-xl hover:bg-carefd-teal-pale/40 transition-colors">
                      <div>
                        <h3 className="font-semibold text-carefd-navy">{s.name}</h3>
                        {s.description && <p className="text-sm text-carefd-gray mt-1">{s.description}</p>}
                      </div>
                      <div className="text-end flex-shrink-0 ms-4">
                        <p className="font-heading font-bold text-lg text-carefd-navy">₪{s.price}</p>
                        <Link href={`/book/${s.service_id}`} className="text-carefd-teal text-xs hover:underline flex items-center gap-1 justify-end mt-1">
                          הזמינו
                          <ChevronLeft className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-carefd-teal-pale">
              <h2 className="text-xl font-heading font-bold text-carefd-navy mb-6 flex items-center gap-2">
                <Star className="w-5 h-5 text-carefd-teal" />
                ביקורות ({reviews.length})
              </h2>
              {reviews.length === 0 ? (
                <div className="text-center py-10">
                  <Star className="w-12 h-12 mx-auto mb-3 text-carefd-teal-pale" />
                  <p className="text-carefd-gray">אין ביקורות עדיין</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {reviews.map((r) => (
                    <div key={r.id} className="pb-5 border-b border-carefd-teal-pale last:border-0 last:pb-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 bg-gradient-to-br from-carefd-teal to-carefd-navy rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {r.user?.name?.[0] || "?"}
                        </div>
                        <span className="font-semibold text-carefd-navy text-sm">{r.user?.name}</span>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: Math.round(r.rating) }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                          ))}
                        </div>
                        <span className="text-xs text-carefd-gray ms-auto">
                          {new Date(r.createdAt).toLocaleDateString("he-IL")}
                        </span>
                      </div>
                      <p className="text-carefd-slate text-sm leading-relaxed">{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* About */}
            {provider.about && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-carefd-teal-pale">
                <h3 className="font-heading font-bold text-carefd-navy mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-carefd-teal" />
                  אודות
                </h3>
                <p className="text-carefd-slate text-sm leading-relaxed whitespace-pre-wrap">{provider.about}</p>
              </div>
            )}

            {/* Languages */}
            {provider.languages?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-carefd-teal-pale">
                <h3 className="font-heading font-bold text-carefd-navy mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-carefd-teal" />
                  שפות
                </h3>
                <div className="flex flex-wrap gap-2">
                  {provider.languages.map((l) => (
                    <Badge key={l} variant="outline" className="border-carefd-teal text-carefd-teal">{l}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Health Funds */}
            {provider.health_funds?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-carefd-teal-pale">
                <h3 className="font-heading font-bold text-carefd-navy mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-carefd-teal" />
                  קופות חולים
                </h3>
                <div className="flex flex-wrap gap-2">
                  {provider.health_funds.map((f) => (
                    <Badge key={f} variant="outline" className="border-carefd-teal text-carefd-teal">{f}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            {provider.location?.city && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-carefd-teal-pale">
                <h3 className="font-heading font-bold text-carefd-navy mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-carefd-teal" />
                  מיקום
                </h3>
                <p className="text-carefd-slate text-sm">{provider.location.city}</p>
                {(provider.location as any).address && (
                  <p className="text-carefd-gray text-xs mt-1">{(provider.location as any).address}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
