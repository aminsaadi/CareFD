"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star, MapPin, Shield, Award, Phone, MessageCircle,
  Home, Video, Building2, PhoneCall, Briefcase
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api-client";

// Service type icons and labels
const serviceTypeConfig: Record<string, { icon: typeof Home; label: string; color: string }> = {
  home_visit: { icon: Home, label: "ביקור בית", color: "bg-blue-100 text-blue-600" },
  video_call: { icon: Video, label: "טלרפואה", color: "bg-purple-100 text-purple-600" },
  clinic_visit: { icon: Building2, label: "ביקור במרפאה", color: "bg-green-100 text-green-600" },
  phone_call: { icon: PhoneCall, label: "שיחה טלפונית", color: "bg-orange-100 text-orange-600" },
};

// Provider type translations
const providerTypeLabels: Record<string, string> = {
  individual: "עצמאי",
  company: "חברה",
  clinic: "מרפאה",
};

interface ProviderCardProps {
  provider: {
    provider_id: string;
    business_name?: string | null;
    profession_name?: string | null;
    profession_title?: string | null;
    provider_type?: string | null;
    description?: string | null;
    profile_image?: string | null;
    location?: { city?: string } | null;
    rating: number;
    total_reviews: number;
    is_verified?: boolean;
    is_recommended?: boolean;
    distance_km?: number | null;
    phone?: string | null;
    show_phone?: boolean;
    whatsapp_number?: string | null;
    show_whatsapp?: boolean;
    service_types?: string[];
    specializations?: string[];
  };
  showContact?: boolean;
}

export default function ProviderCard({ provider: p, showContact = true }: ProviderCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  const serviceTypes = p.service_types && p.service_types.length > 0 ? p.service_types : [];

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const phone = (p.whatsapp_number || p.phone || "").replace(/[^0-9]/g, "");
    if (!phone) return;
    window.open(
      `https://wa.me/${phone}?text=שלום, מצאתי אתכם ב-CareFD ואשמח לקבל מידע נוסף`,
      "_blank"
    );
  };

  const handleCall = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!p.phone) return;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `tel:${p.phone}`;
    } else {
      setShowPhoneModal(true);
    }
  };

  const handleChat = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      const res = await api.post<{ room_id: string }>("/chat/rooms", {
        user_id: user.user_id,
        provider_id: p.provider_id,
      });
      router.push(`/chats/${res.room_id}`);
    } catch (error) {
      console.error("Failed to create chat room:", error);
    }
  };

  return (
    <>
      <div
        className="bg-white p-6 rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 border-2 border-transparent hover:border-carefd-teal/40 relative group hover:-translate-y-1"
        data-testid={`provider-card-${p.provider_id}`}
      >
        {/* Badges - positioned above card */}
        <div className="absolute -top-3 right-4 flex gap-2">
          {p.is_verified && (
            <span
              className="inline-flex items-center gap-1 bg-carefd-teal text-white text-xs px-3 py-1 rounded-full font-medium shadow-md"
              data-testid="verified-badge"
            >
              <Shield className="w-3 h-3" />
              מאומת
            </span>
          )}
          {p.is_recommended && (
            <span
              className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-md"
              data-testid="recommended-badge"
            >
              <Award className="w-3 h-3" />
              מומלץ
            </span>
          )}
        </div>

        {/* Header: Name, Profession, Type + Rating Badge */}
        <div className="flex items-start justify-between mb-4 mt-2">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-carefd-navy mb-1">
              {p.business_name || "ספק שירותים"}
            </h3>
            {(p.profession_name || p.profession_title) && (
              <p className="text-carefd-teal font-medium text-sm mb-1" data-testid="profession-title">
                {p.profession_name || p.profession_title}
              </p>
            )}
            {p.provider_type && (
              <div className="flex items-center gap-2 text-sm text-carefd-gray">
                <Briefcase className="w-3.5 h-3.5 text-carefd-teal" />
                <span>{providerTypeLabels[p.provider_type] || p.provider_type}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 bg-carefd-teal-pale px-3 py-1.5 rounded-full">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="font-bold text-carefd-navy">{(p.rating || 0).toFixed(1)}</span>
            <span className="text-xs text-carefd-gray">({p.total_reviews || 0})</span>
          </div>
        </div>

        {/* Description */}
        {p.description && (
          <p className="text-carefd-slate mb-4 line-clamp-2">{p.description}</p>
        )}

        {/* Service Types */}
        {serviceTypes.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {serviceTypes.map((type) => {
              const config = serviceTypeConfig[type];
              if (!config) return null;
              const Icon = config.icon;
              return (
                <span
                  key={type}
                  className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium ${config.color}`}
                  data-testid={`service-type-${type}`}
                >
                  <Icon className="w-3 h-3" />
                  {config.label}
                </span>
              );
            })}
          </div>
        )}

        {/* Specializations */}
        {p.specializations && p.specializations.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {p.specializations.slice(0, 3).map((spec, idx) => (
                <span
                  key={idx}
                  className="bg-carefd-navy text-white text-xs px-3 py-1 rounded-full font-medium"
                >
                  {spec}
                </span>
              ))}
              {p.specializations.length > 3 && (
                <span className="text-xs text-carefd-gray py-1">
                  +{p.specializations.length - 3} עוד
                </span>
              )}
            </div>
          </div>
        )}

        {/* Location & Distance */}
        {p.location?.city && (
          <div className="flex items-center text-sm text-carefd-gray mb-4">
            <MapPin className="w-4 h-4 text-carefd-teal me-1" />
            <span>{p.location.city}</span>
            {p.distance_km != null && (
              <span
                className="ms-auto bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1"
                data-testid="distance-badge"
              >
                <MapPin className="w-3 h-3" />
                {p.distance_km} ק&quot;מ
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Link
            href={`/providers/${p.provider_id}`}
            className="flex-1 min-w-[140px] text-center bg-carefd-teal text-white px-4 py-2.5 rounded-xl hover:bg-carefd-teal-medium transition-colors font-medium text-sm sm:text-base"
            data-testid={`view-provider-${p.provider_id}`}
          >
            צפה בפרופיל
          </Link>

          {showContact && (
            <div className="flex gap-2">
              {p.phone && (p.show_phone !== false) && (
                <button
                  onClick={handleCall}
                  className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-carefd-navy text-white rounded-xl hover:bg-carefd-slate transition-colors"
                  data-testid={`call-${p.provider_id}`}
                  title="התקשר"
                >
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
              {(p.whatsapp_number || p.phone) && (p.show_whatsapp !== false) && (
                <button
                  onClick={handleWhatsApp}
                  className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                  data-testid={`whatsapp-${p.provider_id}`}
                  title="WhatsApp"
                >
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
              <button
                onClick={handleChat}
                className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                data-testid={`chat-${p.provider_id}`}
                title="צ׳אט"
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Phone Modal (Desktop) */}
      {showPhoneModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPhoneModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 bg-carefd-teal rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-carefd-navy mb-2">מספר טלפון</h3>
            <p className="text-carefd-gray mb-4">{p.business_name || "ספק שירותים"}</p>

            <div className="bg-carefd-teal-pale/30 px-6 py-4 rounded-xl mb-4">
              <p className="text-2xl font-bold text-carefd-navy direction-ltr">{p.phone}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (p.phone) navigator.clipboard.writeText(p.phone);
                  setShowPhoneModal(false);
                }}
                className="flex-1 bg-carefd-teal text-white py-3 rounded-xl font-semibold hover:bg-carefd-teal-medium transition"
              >
                העתק
              </button>
              <button
                onClick={() => setShowPhoneModal(false)}
                className="flex-1 bg-gray-100 text-carefd-gray py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
