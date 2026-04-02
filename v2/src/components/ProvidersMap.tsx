"use client";

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom SVG provider marker (teal)
const createProviderIcon = () => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50">
      <defs>
        <filter id="pshadow" x="-20%" y="-10%" width="140%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity="0.25"/>
        </filter>
      </defs>
      <path d="M20 0C9 0 0 9 0 20c0 14 20 30 20 30s20-16 20-30C40 9 31 0 20 0z"
            fill="#0d9488" filter="url(#pshadow)"/>
      <circle cx="20" cy="18" r="6" fill="none" stroke="#fff" stroke-width="2"/>
      <path d="M20 24c-5 0-9 2.5-9 5.5V31h18v-1.5C29 26.5 25 24 20 24z"
            fill="#fff" opacity="0.9"/>
      <circle cx="20" cy="18" r="4.5" fill="#fff" opacity="0.9"/>
    </svg>`;
  return new L.DivIcon({
    html: svg,
    className: 'custom-map-marker',
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -50],
  });
};

// Custom SVG user location marker (blue pulse)
const createUserIcon = () => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="#3b82f6" opacity="0.15">
        <animate attributeName="r" values="14;18;14" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="20" cy="20" r="10" fill="#3b82f6" opacity="0.2"/>
      <circle cx="20" cy="20" r="7" fill="#fff" stroke="#3b82f6" stroke-width="3"/>
      <circle cx="20" cy="20" r="3.5" fill="#3b82f6"/>
    </svg>`;
  return new L.DivIcon({
    html: svg,
    className: 'custom-map-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

const providerIcon = createProviderIcon();
const userIcon = createUserIcon();

// Component to fit bounds when providers change
const FitBounds = ({ providers, userLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (providers.length === 0 && !userLocation) return;

    const bounds: any[] = [];

    if (userLocation) {
      bounds.push([userLocation.lat, userLocation.lng]);
    }

    providers.forEach(p => {
      if (p.location?.coordinates?.lat && p.location?.coordinates?.lng) {
        bounds.push([p.location.coordinates.lat, p.location.coordinates.lng]);
      }
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [providers, userLocation, map]);

  return null;
};

const ProvidersMap = ({
  providers = [],
  userLocation = null,
  radiusKm = null,
  onProviderClick = null,
  height = '400px',
  className = ''
}: any) => {
  // Default center - Israel
  const defaultCenter: [number, number] = [31.7683, 35.2137]; // Jerusalem

  // Filter providers with valid coordinates
  const validProviders = providers.filter(
    p => p.location?.coordinates?.lat && p.location?.coordinates?.lng
  );

  return (
    <div className={`rounded-xl overflow-hidden border border-gray-200 shadow-sm ${className}`} style={{ height }}>
      <style>{`
        .custom-map-marker {
          background: none !important;
          border: none !important;
        }
      `}</style>
      <MapContainer
        center={userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />

        <FitBounds providers={validProviders} userLocation={userLocation} />

        {/* User location marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div className="text-center" dir="rtl">
                <strong>📍 המיקום שלך</strong>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Search radius circle */}
        {userLocation && radiusKm && (
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={radiusKm * 1000}
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.06,
              weight: 2,
              dashArray: '8, 4',
            }}
          />
        )}

        {/* Provider markers */}
        {validProviders.map((provider) => (
          <Marker
            key={provider.provider_id}
            position={[provider.location.coordinates.lat, provider.location.coordinates.lng]}
            icon={providerIcon}
            eventHandlers={{
              click: () => onProviderClick && onProviderClick(provider)
            }}
          >
            <Popup>
              <div className="min-w-[200px]" dir="rtl">
                <div className="flex items-center gap-2 mb-2">
                  {provider.profile_image ? (
                    <img
                      src={provider.profile_image}
                      alt={provider.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-carefd-teal/20 flex items-center justify-center text-carefd-teal font-bold">
                      {provider.name?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <strong className="text-carefd-navy">{provider.name}</strong>
                    <p className="text-xs text-carefd-slate">{provider.profession_name || provider.profession}</p>
                  </div>
                </div>

                <div className="text-sm space-y-1">
                  {provider.location?.city && (
                    <p className="text-carefd-slate">📍 {provider.location.city}</p>
                  )}
                  {provider.distance_km != null && (
                    <p className="text-carefd-teal font-medium">
                      🚗 {provider.distance_km} ק״מ ממך
                    </p>
                  )}
                  {provider.rating != null && provider.rating > 0 && (
                    <p className="text-amber-500">
                      ⭐ {Number(provider.rating).toFixed(1)} ({provider.total_reviews || 0} ביקורות)
                    </p>
                  )}
                </div>

                <a
                  href={`/providers/${provider.provider_id}`}
                  className="block mt-3 text-center bg-carefd-teal text-white py-1.5 px-3 rounded-lg text-sm font-medium hover:bg-carefd-teal/90 transition"
                >
                  צפה בפרופיל
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default ProvidersMap;
