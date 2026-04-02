"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  MapPin, Star, Shield, Phone, MessageCircle, Clock,
  Globe, Heart, Award, ChevronLeft,
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
    <div className="container-main py-10">
      <Card className="p-8 mb-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-8 w-64 mb-3" />
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-4 w-60" />
          </div>
        </div>
      </Card>
    </div>
  );

  if (!provider) return (
    <div className="text-center py-20">
      <p className="text-xl font-heading text-slate-600 mb-2">הספק לא נמצא</p>
      <Button variant="secondary" asChild>
        <Link href="/providers">חזרה לרשימת המטפלים</Link>
      </Button>
    </div>
  );

  return (
    <div className="container-main py-10 md:py-16">
      {/* Header Card */}
      <Card className="p-8 md:p-10 mb-8 border-0 shadow-floating">
        <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-carefd-teal/10 flex items-center justify-center text-carefd-teal font-heading font-bold text-3xl flex-shrink-0 overflow-hidden">
            {provider.profile_image ? (
              <img src={provider.profile_image} alt="" className="w-full h-full object-cover" />
            ) : (
              provider.business_name?.[0]
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-3xl">{provider.business_name}</h1>
              {provider.is_verified && (
                <Badge variant="success">
                  <Shield className="w-3 h-3 me-1" />
                  מאומת
                </Badge>
              )}
              {provider.is_recommended && (
                <Badge variant="accent">
                  <Award className="w-3 h-3 me-1" />
                  מומלץ
                </Badge>
              )}
            </div>
            <p className="text-carefd-teal text-lg font-medium">{provider.profession_name}</p>
            {provider.specialization_name && (
              <p className="text-slate-500">התמחות: {provider.specialization_name}</p>
            )}

            <div className="flex items-center gap-5 mt-4 flex-wrap text-sm text-slate-500">
              {provider.location?.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {provider.location.city}
                </span>
              )}
              {provider.years_experience && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {provider.years_experience} שנות ניסיון
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-carefd-teal fill-carefd-teal" />
                {provider.rating.toFixed(1)} ({provider.total_reviews} ביקורות)
              </span>
            </div>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-3 w-full md:w-auto">
            {provider.show_phone && provider.phone && (
              <Button asChild data-testid="provider-call">
                <a href={`tel:${provider.phone}`}>
                  <Phone className="w-4 h-4 me-2" />
                  התקשרו
                </a>
              </Button>
            )}
            {provider.show_whatsapp && provider.whatsapp_number && (
              <Button variant="secondary" asChild className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" data-testid="provider-whatsapp">
                <a href={`https://wa.me/${provider.whatsapp_number}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 me-2" />
                  WhatsApp
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Description */}
        {provider.description && (
          <>
            <Separator className="my-6" />
            <p className="text-slate-600 leading-relaxed">{provider.description}</p>
          </>
        )}
        {provider.about && (
          <p className="text-slate-500 mt-4 leading-relaxed">{provider.about}</p>
        )}
      </Card>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main column */}
        <div className="md:col-span-2 space-y-8">
          {/* Services */}
          {provider.services_list && provider.services_list.length > 0 && (
            <Card className="p-8">
              <h2 className="text-xl font-heading font-semibold mb-6">שירותים</h2>
              <div className="space-y-3">
                {provider.services_list.map((s) => (
                  <div key={s.service_id} className="flex items-center justify-between p-4 bg-carefd-stone/50 rounded-2xl group hover:bg-carefd-stone transition-colors">
                    <div>
                      <h3 className="font-medium text-carefd-navy">{s.name}</h3>
                      {s.description && <p className="text-sm text-slate-400 mt-1">{s.description}</p>}
                    </div>
                    <div className="text-end flex-shrink-0 ms-4">
                      <p className="font-heading font-bold text-lg text-carefd-navy">{"\u20AA"}{s.price}</p>
                      <Button variant="ghost" size="sm" asChild className="text-carefd-teal text-xs">
                        <Link href={`/book/${s.service_id}`}>
                          הזמינו
                          <ChevronLeft className="w-3 h-3 ms-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Reviews */}
          <Card className="p-8">
            <h2 className="text-xl font-heading font-semibold mb-6">
              ביקורות ({reviews.length})
            </h2>
            {reviews.length === 0 ? (
              <p className="text-slate-400 text-center py-6">אין ביקורות עדיין</p>
            ) : (
              <div className="space-y-5">
                {reviews.map((r) => (
                  <div key={r.id} className="pb-5 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-carefd-teal/10 rounded-full flex items-center justify-center text-carefd-teal text-xs font-bold">
                        {r.user?.name?.[0] || "?"}
                      </div>
                      <span className="font-medium text-carefd-navy text-sm">{r.user?.name}</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: Math.round(r.rating) }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-carefd-teal fill-carefd-teal" />
                        ))}
                      </div>
                      <span className="text-xs text-slate-400 ms-auto">
                        {new Date(r.createdAt).toLocaleDateString("he-IL")}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {provider.languages?.length > 0 && (
            <Card className="p-6">
              <h3 className="font-heading font-semibold text-carefd-navy mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-carefd-teal" />
                שפות
              </h3>
              <div className="flex flex-wrap gap-2">
                {provider.languages.map((l) => (
                  <Badge key={l} variant="outline">{l}</Badge>
                ))}
              </div>
            </Card>
          )}

          {provider.health_funds?.length > 0 && (
            <Card className="p-6">
              <h3 className="font-heading font-semibold text-carefd-navy mb-3 flex items-center gap-2">
                <Heart className="w-4 h-4 text-carefd-teal" />
                קופות חולים
              </h3>
              <div className="flex flex-wrap gap-2">
                {provider.health_funds.map((f) => (
                  <Badge key={f} variant="outline">{f}</Badge>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
