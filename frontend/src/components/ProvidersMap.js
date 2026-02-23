import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom provider marker icon
const providerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// User location marker icon
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to fit bounds when providers change
const FitBounds = ({ providers, userLocation }) => {
  const map = useMap();
  
  useEffect(() => {
    if (providers.length === 0 && !userLocation) return;
    
    const bounds = [];
    
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
  onProviderClick = null,
  height = '400px',
  className = ''
}) => {
  // Default center - Israel
  const defaultCenter = [31.7683, 35.2137]; // Jerusalem
  
  // Filter providers with valid coordinates
  const validProviders = providers.filter(
    p => p.location?.coordinates?.lat && p.location?.coordinates?.lng
  );
  
  return (
    <div className={`rounded-xl overflow-hidden border border-gray-200 ${className}`} style={{ height }}>
      <MapContainer
        center={userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
                    <div className="w-10 h-10 rounded-full bg-carelink-teal/20 flex items-center justify-center text-carelink-teal font-bold">
                      {provider.name?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <strong className="text-carelink-navy">{provider.name}</strong>
                    <p className="text-xs text-carelink-slate">{provider.profession}</p>
                  </div>
                </div>
                
                <div className="text-sm space-y-1">
                  {provider.location?.city && (
                    <p className="text-carelink-slate">📍 {provider.location.city}</p>
                  )}
                  {provider.distance_km != null && (
                    <p className="text-carelink-teal font-medium">
                      🚗 {provider.distance_km} ק״מ ממך
                    </p>
                  )}
                  {provider.rating > 0 && (
                    <p className="text-amber-500">
                      ⭐ {provider.rating.toFixed(1)} ({provider.review_count} ביקורות)
                    </p>
                  )}
                </div>
                
                <a 
                  href={`/providers/${provider.provider_id}`}
                  className="block mt-3 text-center bg-carelink-teal text-carelink-navy py-1.5 px-3 rounded-lg text-sm font-medium hover:bg-carelink-teal/80 transition"
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
