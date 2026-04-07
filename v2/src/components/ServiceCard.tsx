"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock, MapPin, Star, Tag, Phone, MessageCircle,
  Home, Video, Building2, PhoneCall
} from "lucide-react";

// Service type icons and labels
const serviceTypeConfig: Record<string, { icon: typeof Home; label: string; color: string }> = {
  home_visit: { icon: Home, label: "ביקור בית", color: "bg-blue-500 text-white" },
  video_call: { icon: Video, label: "טלרפואה", color: "bg-purple-500 text-white" },
  clinic_visit: { icon: Building2, label: "ביקור במרפאה", color: "bg-green-500 text-white" },
  phone_call: { icon: PhoneCall, label: "שיחה טלפונית", color: "bg-orange-500 text-white" },
};

const categoryLabels: Record<string, string> = {
  visit: "ביקור",
  hourly: "שעתי",
  consultation: "ייעוץ",
  product: "מוצר",
  procedure: "פרוצדורה",
  series: "סדרה",
};

const pricingLabels: Record<string, string> = {
  per_hour: "לשעה",
  per_visit: "לביקור",
  per_session: "לפגישה",
  per_unit: "ליחידה",
  per_procedure: "לפרוצדורה",
  per_series: "לסדרה",
  fixed: "מחיר קבוע",
};

interface ServiceCardProps {
  service: {
    service_id: string;
    name: string;
    description?: string | null;
    price: number;
    pricing_type?: string;
    service_category?: string;
    service_type?: string;
    delivery_types?: string[];
    duration_minutes?: number;
    provider_id?: string;
    provider?: {
      provider_id?: string;
      business_name?: string | null;
      rating?: number;
      total_reviews?: number;
      phone?: string | null;
      user_id?: string;
      is_verified?: boolean;
    } | null;
    location?: { city?: string } | null;
  };
  showProvider?: boolean;
}

export default function ServiceCard({ service: s, showProvider = true }: ServiceCardProps) {
  const router = useRouter();

  const serviceTypeInfo = serviceTypeConfig[s.service_type || ""] || serviceTypeConfig.clinic_visit;
  const ServiceIcon = serviceTypeInfo.icon;
  const priceUnit = pricingLabels[s.pricing_type || ""] || "";
  const categoryLabel = categoryLabels[s.service_category || ""] || "";

  const getProviderLink = () => {
    if (s.provider?.provider_id) return `/providers/${s.provider.provider_id}`;
    if (s.provider_id) return `/providers/${s.provider_id}`;
    return "#";
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!s.provider?.phone) return;
    const phone = s.provider.phone.replace(/[^0-9]/g, "");
    window.open(
      `https://wa.me/${phone}?text=שלום, אני מתעניין/ת בשירות "${s.name}"`,
      "_blank"
    );
  };

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!s.provider?.phone) return;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `tel:${s.provider.phone}`;
    } else {
      alert(`מספר טלפון: ${s.provider.phone}`);
    }
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 border-2 border-transparent hover:border-carefd-teal/40 relative group overflow-hidden hover:-translate-y-1"
      data-testid={`service-card-${s.service_id}`}
    >
      <div className="p-5">
        {/* Tags row */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium shadow-sm ${serviceTypeInfo.color}`}
          >
            <ServiceIcon className="w-3 h-3" />
            {serviceTypeInfo.label}
          </span>
          {categoryLabel && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-carefd-teal-pale/40 text-carefd-navy">
              <Tag className="w-3 h-3" />
              {categoryLabel}
            </span>
          )}
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-bold text-gray-900 mb-1.5 line-clamp-1">
          {s.name || "שירות"}
        </h3>
        {s.description && (
          <p className="text-gray-500 text-sm line-clamp-2 mb-4 leading-relaxed">
            {s.description}
          </p>
        )}

        {/* Price + Duration row */}
        <div className="flex items-center justify-between mb-4 bg-carefd-teal-pale/20 rounded-xl px-4 py-3">
          <div className="flex items-center gap-4">
            {s.duration_minutes && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Clock className="w-3.5 h-3.5 text-carefd-teal" />
                <span>{s.duration_minutes} דק&apos;</span>
              </div>
            )}
            {s.location?.city && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <MapPin className="w-3.5 h-3.5 text-carefd-teal" />
                <span className="line-clamp-1">{s.location.city}</span>
              </div>
            )}
          </div>
          <div className="text-left">
            <span className="text-2xl font-extrabold text-carefd-navy">
              ₪{s.price ?? 0}
            </span>
            {priceUnit && (
              <span className="text-xs text-gray-500 me-1">/{priceUnit}</span>
            )}
          </div>
        </div>

        {/* Provider Info */}
        {showProvider && s.provider && (
          <Link
            href={getProviderLink()}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-between bg-gray-50 rounded-xl p-3 mb-4 hover:bg-carefd-teal-pale/20 transition-colors group/provider"
            data-testid={`provider-link-${s.provider.provider_id || s.provider_id}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-carefd-teal to-carefd-navy rounded-full flex items-center justify-center text-white font-bold text-sm">
                {(s.provider.business_name || "ס")[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 group-hover/provider:text-carefd-teal transition-colors">
                  {s.provider.business_name || "ספק שירותים"}
                </p>
                {s.provider.rating != null && s.provider.rating > 0 && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span>{Number(s.provider.rating).toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
            <span className="text-xs text-carefd-teal font-medium opacity-0 group-hover/provider:opacity-100 transition-opacity">
              צפה בפרופיל
            </span>
          </Link>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/book/${s.service_id}`)}
            className="flex-1 bg-carefd-teal text-white px-4 py-2.5 rounded-xl hover:bg-carefd-teal-medium transition-colors font-medium text-sm"
            data-testid={`book-service-${s.service_id}`}
          >
            הזמן עכשיו
          </button>
          {s.provider?.phone && (
            <>
              <button
                onClick={handleCall}
                className="w-10 h-10 flex items-center justify-center bg-carefd-navy text-white rounded-xl hover:bg-carefd-slate transition-colors"
                title="התקשר"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                onClick={handleWhatsApp}
                className="w-10 h-10 flex items-center justify-center bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                title="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
