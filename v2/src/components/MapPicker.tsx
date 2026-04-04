"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

interface MapPickerProps {
  location?: { lat: number; lng: number } | null;
  radius?: number;
  providers?: { provider_id: string; business_name?: string | null; profession_name?: string | null; profile_image?: string | null; location?: { latitude?: number; longitude?: number } | null }[];
  onLocationSelect?: (lat: number, lng: number) => void;
  height?: string;
  className?: string;
}

export default function MapPicker({
  location,
  radius,
  providers = [],
  onLocationSelect,
  height = "400px",
  className = "",
}: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const loadMap = async () => {
      const L = (await import("leaflet")).default;
      // CSS loaded via link tag below

      const center = location ? [location.lat, location.lng] : [32.08, 34.78]; // Default: Tel Aviv
      const map = L.map(mapRef.current!, {
        center: center as [number, number],
        zoom: location ? 13 : 8,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Click to select location
      if (onLocationSelect) {
        map.on("click", (e: any) => {
          onLocationSelect(e.latlng.lat, e.latlng.lng);
        });
      }

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update selected location marker
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    const updateMarker = async () => {
      const L = (await import("leaflet")).default;
      const map = mapInstanceRef.current;

      // Remove old marker/circle
      if (markerRef.current) { map.removeLayer(markerRef.current); markerRef.current = null; }
      if (circleRef.current) { map.removeLayer(circleRef.current); circleRef.current = null; }

      if (location) {
        const icon = L.divIcon({
          className: "custom-marker",
          html: `<div style="width:28px;height:28px;background:linear-gradient(135deg,#14b8a6,#0d9488);border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(20,184,166,0.4)"></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        markerRef.current = L.marker([location.lat, location.lng], { icon }).addTo(map);
        map.setView([location.lat, location.lng], 13);

        if (radius) {
          circleRef.current = L.circle([location.lat, location.lng], {
            radius: radius * 1000,
            color: "#14b8a6",
            fillColor: "#14b8a6",
            fillOpacity: 0.08,
            weight: 2,
            dashArray: "6 4",
          }).addTo(map);
        }
      }
    };

    updateMarker();
  }, [location, radius, mapLoaded]);

  // Update provider markers
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded || !providers.length) return;

    const updateProviders = async () => {
      const L = (await import("leaflet")).default;
      const map = mapInstanceRef.current;

      providers.forEach((p) => {
        const lat = p.location?.latitude;
        const lng = p.location?.longitude;
        if (!lat || !lng) return;

        const icon = L.divIcon({
          className: "custom-marker",
          html: `<div style="width:24px;height:24px;background:#3b82f6;border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(59,130,246,0.3)"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([lat, lng], { icon }).addTo(map);
        marker.bindPopup(`
          <div style="direction:rtl;text-align:right;min-width:120px">
            <strong>${p.business_name || "ספק"}</strong>
            <div style="font-size:12px;color:#64748b">${p.profession_name || ""}</div>
            <a href="/providers/${p.provider_id}" style="display:block;margin-top:6px;color:#14b8a6;font-size:12px">צפה בפרופיל</a>
          </div>
        `);
      });
    };

    updateProviders();
  }, [providers, mapLoaded]);

  return (
    <div className={`relative rounded-xl overflow-hidden border border-gray-200 ${className}`} style={{ height }}>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-carefd-teal border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {onLocationSelect && (
        <div className="absolute top-3 start-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-carefd-gray flex items-center gap-1 shadow-sm z-[1000]">
          <MapPin className="w-3 h-3" />
          לחץ על המפה לבחירת מיקום
        </div>
      )}
    </div>
  );
}
