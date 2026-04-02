"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FaClock, FaHome, FaVideo, FaClinicMedical,
  FaPhoneAlt, FaStar, FaWhatsapp, FaPhone, FaTag, FaMapMarkerAlt
} from 'react-icons/fa';

const serviceTypeConfig: Record<string, { icon: React.ComponentType<any>; label: string; color: string }> = {
  home_visit: { icon: FaHome, label: 'ביקור בית', color: 'bg-blue-500 text-white' },
  video_call: { icon: FaVideo, label: 'טלרפואה', color: 'bg-purple-500 text-white' },
  clinic_visit: { icon: FaClinicMedical, label: 'ביקור במרפאה', color: 'bg-green-500 text-white' },
  phone_call: { icon: FaPhoneAlt, label: 'שיחה טלפונית', color: 'bg-orange-500 text-white' },
};

const categoryLabels: Record<string, string> = { visit: 'ביקור', hourly: 'שעתי', consultation: 'ייעוץ', product: 'מוצר' };
const pricingLabels: Record<string, string> = { per_hour: 'לשעה', per_visit: 'לביקור', per_session: 'לפגישה', fixed: 'מחיר קבוע' };

interface ServiceCardProps {
  service: any;
  showProvider?: boolean;
  viewMode?: string;
}

const ServiceCard = ({ service, showProvider = true }: ServiceCardProps) => {
  const router = useRouter();
  const serviceTypeInfo = serviceTypeConfig[service.service_type] || serviceTypeConfig.clinic_visit;
  const ServiceIcon = serviceTypeInfo.icon;
  const priceUnit = pricingLabels[service.pricing_type] || '';
  const categoryLabel = categoryLabels[service.service_category] || '';

  const getProviderLink = () => {
    if (service.provider?.provider_id) return `/providers/${service.provider.provider_id}`;
    if (service.provider?.user_id) return `/providers/${service.provider.user_id}`;
    if (service.provider_id) return `/providers/${service.provider_id}`;
    return '#';
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!service.provider?.phone) return;
    const phone = service.provider.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone}?text=שלום, אני מתעניין/ת בשירות "${service.name}"`, '_blank');
  };

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!service.provider?.phone) return;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) { window.location.href = `tel:${service.provider.phone}`; }
    else { alert(`מספר טלפון: ${service.provider.phone}`); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-100 hover:border-carefd-teal relative group overflow-hidden">
      <div className="p-5">
        {/* Tags row */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium shadow-sm ${serviceTypeInfo.color}`}>
            <ServiceIcon className="text-[10px]" />{serviceTypeInfo.label}
          </span>
          {categoryLabel && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-600">
              <FaTag className="text-[10px]" />{categoryLabel}
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-1.5 line-clamp-1">{service.name || 'שירות'}</h3>
        <p className="text-gray-500 text-sm line-clamp-2 mb-4 leading-relaxed">{service.description}</p>

        {/* Price + Duration */}
        <div className="flex items-center justify-between mb-4 bg-carefd-teal-pale/20 rounded-xl px-4 py-3">
          <div className="flex items-center gap-4">
            {service.duration_minutes && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <FaClock className="text-carefd-teal text-xs" /><span>{service.duration_minutes} דק&apos;</span>
              </div>
            )}
            {service.service_city && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <FaMapMarkerAlt className="text-carefd-teal text-xs" /><span className="line-clamp-1">{service.service_city}</span>
              </div>
            )}
          </div>
          <div className="text-left">
            <span className="text-2xl font-extrabold text-carefd-navy">₪{service.price ?? 0}</span>
            {priceUnit && <span className="text-xs text-gray-500 me-1">/{priceUnit}</span>}
          </div>
        </div>

        {/* Provider Info */}
        {showProvider && service.provider && (
          <Link href={getProviderLink()} onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-between bg-gray-50 rounded-xl p-3 mb-4 hover:bg-carefd-teal-pale/20 transition-colors group/provider">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-carefd-teal to-carefd-navy rounded-full flex items-center justify-center text-white font-bold text-sm">
                {(service.provider.business_name || 'ס')[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 group-hover/provider:text-carefd-teal transition-colors">
                  {service.provider.business_name || 'ספק שירותים'}
                </p>
                {service.provider.rating != null && service.provider.rating > 0 && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <FaStar className="text-yellow-500" /><span>{Number(service.provider.rating).toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
            <span className="text-xs text-carefd-teal font-medium opacity-0 group-hover/provider:opacity-100 transition-opacity">צפה בפרופיל</span>
          </Link>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button onClick={() => router.push(`/book/${service.service_id}`)}
            className="flex-1 bg-carefd-teal text-white px-4 py-2.5 rounded-xl hover:bg-carefd-teal-medium transition-colors font-medium text-sm">
            הזמן עכשיו
          </button>
          {service.provider?.phone && (
            <button onClick={handleCall} className="w-10 h-10 flex items-center justify-center bg-carefd-navy text-white rounded-xl hover:bg-carefd-slate transition-colors" title="התקשר">
              <FaPhone className="text-sm" />
            </button>
          )}
          {service.provider?.phone && (
            <button onClick={handleWhatsApp} className="w-10 h-10 flex items-center justify-center bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors" title="WhatsApp">
              <FaWhatsapp className="text-sm" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
