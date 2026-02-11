import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { FaStar, FaMapMarkerAlt, FaClock, FaEdit } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const ProviderProfile = () => {
  const { t } = useTranslation();
  const { providerId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetchProvider();
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId]);

  const fetchProvider = async () => {
    try {
      const response = await api.get(`/providers/${providerId}`);
      setProvider(response.data);
    } catch (error) {
      console.error('Failed to fetch provider:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await api.get(`/providers/${providerId}/reviews`);
      setReviews(response.data.reviews || []);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const isOwner = user?.user_id === provider?.user_id;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-12">{t('loading')}</div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-12">ספק לא נמצא</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2" data-testid="provider-name">
                {provider.business_name || 'ספק שירותים'}
              </h1>
              <p className="text-gray-600">{t(provider.provider_type)}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <FaStar className="text-yellow-500 mr-1" />
                <span className="text-2xl font-bold">{provider.rating.toFixed(1)}</span>
                <span className="text-gray-600 mr-2">({provider.total_reviews})</span>
              </div>
              {isOwner && (
                <button
                  onClick={() => navigate(`/provider/edit/${providerId}`)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  data-testid="edit-profile-btn"
                >
                  <FaEdit /> {t('editProfile')}
                </button>
              )}
            </div>
          </div>

          {provider.description && (
            <p className="text-gray-700 mb-4">{provider.description}</p>
          )}

          {/* Specializations */}
          {provider.specializations && provider.specializations.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">{t('specializations')}:</h3>
              <div className="flex flex-wrap gap-2">
                {provider.specializations.map((spec, idx) => (
                  <span
                    key={idx}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Location */}
          {provider.location && (
            <div className="mb-4">
              <div className="flex items-center gap-2 text-gray-700 mb-2">
                <FaMapMarkerAlt className="text-red-500" />
                <span>
                  {provider.location.address}, {provider.location.city}
                </span>
              </div>
              {provider.location.latitude && provider.location.longitude && (
                <div className="h-64 rounded-lg overflow-hidden border border-gray-300 mt-2">
                  <MapContainer
                    center={[provider.location.latitude, provider.location.longitude]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap contributors'
                    />
                    <Marker position={[provider.location.latitude, provider.location.longitude]} />
                  </MapContainer>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Services */}
        {provider.services_list && provider.services_list.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            <h2 className="text-2xl font-bold mb-4">{t('services')}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {provider.services_list.map((service) => (
                <div
                  key={service.service_id}
                  className="border border-gray-200 p-4 rounded-lg"
                  data-testid={`service-${service.service_id}`}
                >
                  <h3 className="font-semibold mb-2">{service.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">{service.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-blue-600">₪{service.price}</span>
                    <span className="text-sm text-gray-600">{t(service.pricing_type)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team Members */}
        {provider.team_members && provider.team_members.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            <h2 className="text-2xl font-bold mb-4">צוות</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {provider.team_members.map((member) => (
                <div
                  key={member.member_id}
                  className="border border-gray-200 p-4 rounded-lg"
                >
                  <h3 className="font-semibold">{member.name}</h3>
                  <p className="text-sm text-gray-600">{member.role}</p>
                  {member.specializations && member.specializations.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {member.specializations.map((spec, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-4">{t('reviews')}</h2>
          {reviews.length === 0 ? (
            <p className="text-gray-600">עדיין אין ביקורות</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.review_id} className="border-b border-gray-200 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={i < review.rating ? 'text-yellow-500' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                    <span className="font-semibold">{review.user?.name || 'משתמש'}</span>
                    <span className="text-sm text-gray-600">
                      {new Date(review.created_at).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderProfile;