"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FaStar, FaMapMarkerAlt, FaBriefcase, FaCheckCircle, FaAward,
  FaHome, FaVideo, FaClinicMedical, FaPhoneAlt, FaWhatsapp, FaComments, FaPhone
} from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api-client';

const serviceTypeConfig: Record<string, { icon: React.ComponentType<any>; label: string; color: string }> = {
  home_visit: { icon: FaHome, label: 'ביקור בית', color: 'bg-blue-100 text-blue-600' },
  video_call: { icon: FaVideo, label: 'טלרפואה', color: 'bg-purple-100 text-purple-600' },
  clinic_visit: { icon: FaClinicMedical, label: 'ביקור במרפאה', color: 'bg-green-100 text-green-600' },
  phone_call: { icon: FaPhoneAlt, label: 'שיחה טלפונית', color: 'bg-orange-100 text-orange-600' },
};

const professionTitles: Record<string, string> = {
  doctor: 'רופא/ה',
  nurse: 'אח/ות מוסמך/ת',
  physiotherapist: 'פיזיותרפיסט/ית',
  occupational_therapist: 'מרפא/ה בעיסוק',
  student: 'סטודנט/ית',
  caregiver: 'מטפל/ת',
  psychologist: 'פסיכולוג/ית',
  social_worker: 'עובד/ת סוציאלי/ת',
  dietitian: 'דיאטן/ית',
  speech_therapist: 'קלינאי/ת תקשורת',
};

interface ProviderCardProps {
  provider: any;
  showContact?: boolean;
}

const ProviderCard = ({ provider, showContact = true }: ProviderCardProps) => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  const serviceTypes: string[] = provider.service_types && provider.service_types.length > 0 ? provider.service_types : [];

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!provider.phone) return;
    const phone = provider.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone}?text=שלום, מצאתי אתכם ב-CareFD ואשמח לקבל מידע נוסף`, '_blank');
  };

  const handleCall = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!provider.phone) return;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `tel:${provider.phone}`;
    } else {
      setShowPhoneModal(true);
    }
  };

  const handleChat = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { router.push('/login'); return; }
    try {
      const data = await api.post<{ room_id: string }>('/chat/rooms', {
        user_id: user?.id,
        provider_id: provider.provider_id,
      });
      router.push(`/chats/${data.room_id}`);
    } catch { /* ignore */ }
  };

  return (
    <>
      <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all border-2 border-carefd-teal-pale hover:border-carefd-teal relative group">
        {/* Badges */}
        <div className="absolute -top-3 right-4 flex gap-2">
          {provider.is_verified && (
            <span className="inline-flex items-center gap-1 bg-carefd-teal text-white text-xs px-3 py-1 rounded-full font-medium shadow-md">
              <FaCheckCircle />מאומת
            </span>
          )}
          {provider.is_recommended && (
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-md">
              <FaAward />מומלץ
            </span>
          )}
        </div>

        <div className="flex items-start justify-between mb-4 mt-2">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-carefd-navy mb-1">{provider.business_name || 'ספק שירותים'}</h3>
            {(provider.profession_name || provider.profession_title) && (
              <p className="text-carefd-teal font-medium text-sm mb-1">
                {provider.profession_name || professionTitles[provider.profession_title] || provider.profession_title}
              </p>
            )}
            <div className="flex items-center gap-2 text-sm text-carefd-gray">
              <FaBriefcase className="text-carefd-teal" />
              <span>{provider.provider_type}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-carefd-teal-pale px-3 py-1.5 rounded-full">
            <FaStar className="text-yellow-500" />
            <span className="font-bold text-carefd-navy">{(provider.rating || 0).toFixed(1)}</span>
            <span className="text-xs text-carefd-gray">({provider.total_reviews || 0})</span>
          </div>
        </div>

        {provider.description && (
          <p className="text-carefd-slate mb-4 line-clamp-2">{provider.description}</p>
        )}

        {/* Service Types */}
        <div className="flex flex-wrap gap-2 mb-4">
          {serviceTypes.map((type) => {
            const config = serviceTypeConfig[type];
            if (!config) return null;
            const Icon = config.icon;
            return (
              <span key={type} className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium ${config.color}`}>
                <Icon className="text-xs" />{config.label}
              </span>
            );
          })}
        </div>

        {provider.specializations && provider.specializations.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {provider.specializations.slice(0, 3).map((spec: string, idx: number) => (
                <span key={idx} className="bg-carefd-navy text-white text-xs px-3 py-1 rounded-full font-medium">{spec}</span>
              ))}
              {provider.specializations.length > 3 && (
                <span className="text-xs text-carefd-gray py-1">+{provider.specializations.length - 3} עוד</span>
              )}
            </div>
          </div>
        )}

        {(provider.city || provider.location?.city) && (
          <div className="flex items-center text-sm text-carefd-gray mb-4">
            <FaMapMarkerAlt className="text-carefd-teal ms-1" />
            <span>{provider.city || provider.location?.city}</span>
            {provider.distance_km != null && (
              <span className="ms-auto bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                <FaMapMarkerAlt className="text-[10px]" />{provider.distance_km} ק״מ
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Link href={`/providers/${provider.provider_id}`}
            className="flex-1 min-w-[140px] text-center bg-carefd-teal text-white px-4 py-2.5 rounded-xl hover:bg-carefd-teal-medium transition-colors font-medium text-sm sm:text-base">
            צפה בפרופיל
          </Link>
          {showContact && (
            <div className="flex gap-2">
              {provider.phone && (
                <button onClick={handleCall} className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-carefd-navy text-white rounded-xl hover:bg-carefd-slate transition-colors" title="התקשר">
                  <FaPhone className="text-sm sm:text-base" />
                </button>
              )}
              {provider.phone && (
                <button onClick={handleWhatsApp} className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors" title="WhatsApp">
                  <FaWhatsapp className="text-base sm:text-lg" />
                </button>
              )}
              <button onClick={handleChat} className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors" title="צ'אט">
                <FaComments className="text-sm sm:text-base" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Phone Modal (Desktop) */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPhoneModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 bg-carefd-teal rounded-full flex items-center justify-center mx-auto mb-4">
              <FaPhone className="text-2xl text-white" />
            </div>
            <h3 className="text-xl font-bold text-carefd-navy mb-2">מספר טלפון</h3>
            <p className="text-carefd-gray mb-4">{provider.business_name || 'ספק שירותים'}</p>
            <div className="bg-carefd-teal-pale/30 px-6 py-4 rounded-xl mb-4">
              <p className="text-2xl font-bold text-carefd-navy direction-ltr">{provider.phone}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { navigator.clipboard.writeText(provider.phone); setShowPhoneModal(false); }}
                className="flex-1 bg-carefd-teal text-white py-3 rounded-xl font-semibold hover:bg-carefd-teal-medium transition">העתק</button>
              <button onClick={() => setShowPhoneModal(false)}
                className="flex-1 bg-gray-100 text-carefd-gray py-3 rounded-xl font-semibold hover:bg-gray-200 transition">סגור</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProviderCard;
