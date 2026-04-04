"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MapPin, Star, Navigation } from "lucide-react";

interface MapProvider {
  provider_id: string;
  business_name?: string | null;
  profession_name?: string | null;
  profession_title?: string | null;
  profile_image?: string | null;
  rating?: number;
  total_reviews?: number;
  distance_km?: number | null;
  location?: { city?: string; latitude?: number; longitude?: number } | null;
}

interface ProvidersMapProps {
  providers: MapProvider[];
  userLocation?: { lat: number; lng: number } | null;
  radiusKm?: number | null;
  onProviderClick?: (provider: MapProvider) => void;
  height?: string;
  className?: string;
}

export default function ProvidersMap({
  providers,
  userLocation,
  radiusKm,
  onProviderClick,
  height = "500px",
  className = "",
}: ProvidersMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamically import Leaflet
    const loadMap = async () => {
      const L = (await import("leaflet")).default;
      // CSS loaded via link tag below

      const map = L.map(mapRef.current!, {
        center: userLocation ? [userLocation.lat, userLocation.lng] : [31.77, 35.23],
        zoom: userLocation ? 12 : 8,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      mapInstanceRef.current = map;
      setMapLoaded(true);
    };

    loadMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when providers change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    const loadMarkers = async () => {
      const L = (await import("leaflet")).default;
      const map = mapInstanceRef.current;

      // Clear existing markers
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.Circle) {
          map.removeLayer(layer);
        }
      });

      // User location marker
      if (userLocation) {
        const userIcon = L.divIcon({
          className: "custom-marker",
          html: `<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(59,130,246,0.5);animation:pulse 2s infinite"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map);

        if (radiusKm) {
          L.circle([userLocation.lat, userLocation.lng], {
            radius: radiusKm * 1000,
            color: "#3b82f6",
            fillColor: "#3b82f6",
            fillOpacity: 0.08,
            weight: 2,
            dashArray: "6 4",
          }).addTo(map);
        }
      }

      // Provider markers
      const bounds = L.latLngBounds([]);
      let hasMarkers = false;

      providers.forEach((provider) => {
        const lat = provider.location?.latitude;
        const lng = provider.location?.longitude;
        if (!lat || !lng) return;

        hasMarkers = true;
        bounds.extend([lat, lng]);

        const providerIcon = L.divIcon({
          className: "custom-marker",
          html: `<div style="width:32px;height:32px;background:linear-gradient(135deg,#14b8a6,#0d9488);border:2px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(20,184,166,0.4);display:flex;align-items:center;justify-content:center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="#0d9488"/></svg>
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        const marker = L.marker([lat, lng], { icon: providerIcon }).addTo(map);

        const popupContent = `
          <div style="min-width:180px;font-family:inherit;direction:rtl;text-align:right">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              ${provider.profile_image
                ? `<img src="${provider.profile_image}" style="width:40px;height:40px;border-radius:50%;object-fit:cover" />`
                : `<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#14b8a6,#0d9488);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:16px">${(provider.business_name || "?")[0]}</div>`
              }
              <div>
                <div style="font-weight:600;color:#1e293b">${provider.business_name || "ספק"}</div>
                <div style="font-size:12px;color:#64748b">${provider.profession_name || provider.profession_title || ""}</div>
              </div>
            </div>
            ${provider.rating ? `<div style="font-size:12px;color:#f59e0b;margin-bottom:4px">⭐ ${Number(provider.rating).toFixed(1)} (${provider.total_reviews || 0})</div>` : ""}
            ${provider.distance_km != null ? `<div style="font-size:12px;color:#3b82f6">📍 ${provider.distance_km} ק"מ</div>` : ""}
            <a href="/providers/${provider.provider_id}" style="display:block;margin-top:8px;text-align:center;padding:6px;background:#14b8a6;color:white;border-radius:8px;text-decoration:none;font-size:13px;font-weight:500">צפה בפרופיל</a>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 250 });

        marker.on("click", () => {
          if (onProviderClick) onProviderClick(provider);
        });
      });

      if (userLocation) bounds.extend([userLocation.lat, userLocation.lng]);

      if (hasMarkers) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } else if (userLocation) {
        map.setView([userLocation.lat, userLocation.lng], 12);
      }
    };

    loadMarkers();
  }, [providers, userLocation, radiusKm, mapLoaded, onProviderClick]);

  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`} style={{ height }}>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-carefd-teal border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
