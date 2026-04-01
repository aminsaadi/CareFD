"use client";

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom SVG marker icon for selected location
const createLocationIcon = () => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">
      <defs>
        <filter id="shadow" x="-20%" y="-10%" width="140%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.3"/>
        </filter>
      </defs>
      <path d="M18 0C8.06 0 0 8.06 0 18c0 12.6 18 28 18 28s18-15.4 18-28C36 8.06 27.94 0 18 0z"
            fill="#0d9488" filter="url(#shadow)"/>
      <circle cx="18" cy="18" r="8" fill="#fff"/>
      <circle cx="18" cy="18" r="4" fill="#0d9488"/>
    </svg>`;
  return new L.DivIcon({
    html: svg,
    className: 'custom-map-marker',
    iconSize: [36, 46],
    iconAnchor: [18, 46],
    popupAnchor: [0, -46],
  });
};

// Provider marker icon (smaller, blue)
const createProviderIcon = () => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38">
      <path d="M15 0C6.72 0 0 6.72 0 15c0 10.5 15 23 15 23s15-12.5 15-23C30 6.72 23.28 0 15 0z"
            fill="#3b82f6" opacity="0.85"/>
      <circle cx="15" cy="13" r="4" fill="none" stroke="#fff" stroke-width="1.5"/>
      <path d="M15 17c-3.5 0-6.5 1.8-6.5 4V22h13v-1C21.5 18.8 18.5 17 15 17z"
            fill="#fff" opacity="0.85"/>
    </svg>`;
  return new L.DivIcon({
    html: svg,
    className: 'custom-map-marker',
    iconSize: [30, 38],
    iconAnchor: [15, 38],
    popupAnchor: [0, -38],
  });
};

const locationIcon = createLocationIcon();
const providerIcon = createProviderIcon();

// Component to handle click events
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position ? <Marker position={position} icon={locationIcon} /> : null;
}

// Component to recenter map when position changes
function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);
  return null;
}

const MapPicker = ({
  location,
  setLocation,
  radiusKm = null,
  providers = [],
  showProviders = false,
  height = 'h-64'
}) => {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (location?.latitude && location?.longitude) {
      setPosition({ lat: location.latitude, lng: location.longitude });
    } else {
      // Default to Tel Aviv
      setPosition({ lat: 32.0853, lng: 34.7818 });
    }
  }, [location]);

  useEffect(() => {
    if (position) {
      setLocation(prev => ({
        ...prev,
        latitude: position.lat,
        longitude: position.lng
      }));
    }
  }, [position, setLocation]);

  // Determine radius to show
  const displayRadius = radiusKm || location?.coverage_radius_km;

  if (!position) return <div>Loading map...</div>;

  return (
    <div className={`${height} rounded-xl overflow-hidden border border-gray-200 shadow-sm`}>
      <style>{`
        .custom-map-marker {
          background: none !important;
          border: none !important;
        }
      `}</style>
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />
        <RecenterMap position={position} />
        <LocationMarker position={position} setPosition={setPosition} />

        {/* Radius circle */}
        {displayRadius && position && (
          <Circle
            center={position}
            radius={displayRadius * 1000}
            pathOptions={{
              color: '#0d9488',
              fillColor: '#0d9488',
              fillOpacity: 0.08,
              weight: 2,
              dashArray: '8, 4',
            }}
          />
        )}

        {/* Provider markers */}
        {showProviders && providers.map((provider) => {
          const lat = provider.location?.coordinates?.lat || provider.location?.latitude;
          const lng = provider.location?.coordinates?.lng || provider.location?.longitude;
          if (!lat || !lng) return null;
          return (
            <Marker
              key={provider.provider_id}
              position={[lat, lng]}
              icon={providerIcon}
            >
              <Popup>
                <div className="min-w-[180px]" dir="rtl">
                  <div className="flex items-center gap-2 mb-2">
                    {provider.profile_image ? (
                      <img
                        src={provider.profile_image}
                        alt={provider.business_name || provider.name}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                        {(provider.business_name || provider.name || '?')[0]}
                      </div>
                    )}
                    <div>
                      <strong className="text-sm">{provider.business_name || provider.name}</strong>
                      <p className="text-xs text-gray-500">{provider.profession_name || provider.profession || ''}</p>
                    </div>
                  </div>
                  {provider.location?.city && (
                    <p className="text-xs text-gray-500 mb-2">📍 {provider.location.city}</p>
                  )}
                  <a
                    href={`/providers/${provider.provider_id}`}
                    className="block text-center bg-blue-500 text-white py-1.5 px-3 rounded-lg text-xs font-medium hover:bg-blue-600 transition"
                  >
                    צפה בפרופיל
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapPicker;
