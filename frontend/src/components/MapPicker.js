import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position ? <Marker position={position} /> : null;
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
    <div className="h-64 rounded-lg overflow-hidden border border-gray-300">
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <LocationMarker position={position} setPosition={setPosition} />
      </MapContainer>
    </div>
  );
};

export default MapPicker;