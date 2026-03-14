import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom SVG marker icon
const createCustomIcon = () => {
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

const locationIcon = createCustomIcon();

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position ? <Marker position={position} icon={locationIcon} /> : null;
}

const MapPicker = ({ location, setLocation }) => {
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

  if (!position) return <div>Loading map...</div>;

  return (
    <div className="h-64 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
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
        <LocationMarker position={position} setPosition={setPosition} />
      </MapContainer>
    </div>
  );
};

export default MapPicker;
