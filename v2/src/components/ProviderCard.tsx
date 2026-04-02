"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Star, Shield, Award, Phone, MessageCircle } from "lucide-react";

interface ProviderCardProps {
  provider: {
    provider_id: string; business_name?: string; profession_name?: string; profession_title?: string;
    profile_image?: string; location?: { city?: string }; rating: number; total_reviews: number;
    is_verified?: boolean; is_recommended?: boolean; distance_km?: number;
    phone?: string; show_phone?: boolean; whatsapp_number?: string; show_whatsapp?: boolean;
  };
}

export default function ProviderCard({ provider: p }: ProviderCardProps) {
  return (
    <Link href={`/providers/${p.provider_id}`} data-testid={`provider-${p.provider_id}`}>
      <Card className="p-5 hover-lift group">
        <div className="flex items-start gap-4">
          <Avatar className="w-14 h-14 flex-shrink-0">
            {p.profile_image && <AvatarImage src={p.profile_image} alt={p.business_name || ""} />}
            <AvatarFallback className="text-lg">{p.business_name?.[0] || "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-carefd-navy truncate group-hover:text-carefd-teal transition-colors">
              {p.business_name || "ספק"}
            </h3>
            <p className="text-sm text-carefd-teal font-medium">{p.profession_name || p.profession_title}</p>
            {p.location?.city && (
              <p className="text-sm text-carefd-gray flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />{p.location.city}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-carefd-teal fill-carefd-teal" />
                <span className="text-sm font-medium text-carefd-navy">{p.rating.toFixed(1)}</span>
                <span className="text-xs text-carefd-gray">({p.total_reviews})</span>
              </div>
              {p.is_verified && <Badge variant="teal" className="text-[10px]"><Shield className="w-3 h-3 me-0.5" />מאומת</Badge>}
              {p.is_recommended && <Badge variant="accent" className="text-[10px]"><Award className="w-3 h-3 me-0.5" />מומלץ</Badge>}
              {p.distance_km != null && <span className="text-xs text-carefd-gray">{p.distance_km} ק&quot;מ</span>}
            </div>
          </div>
        </div>
        {/* Contact buttons */}
        {(p.show_phone || p.show_whatsapp) && (
          <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
            {p.show_phone && p.phone && (
              <a href={`tel:${p.phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-xs text-carefd-teal hover:text-carefd-teal-medium">
                <Phone className="w-3.5 h-3.5" />התקשרו
              </a>
            )}
            {p.show_whatsapp && p.whatsapp_number && (
              <a href={`https://wa.me/${p.whatsapp_number}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700">
                <MessageCircle className="w-3.5 h-3.5" />WhatsApp
              </a>
            )}
          </div>
        )}
      </Card>
    </Link>
  );
}
