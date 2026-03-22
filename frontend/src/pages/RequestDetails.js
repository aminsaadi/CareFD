import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { format } from 'date-fns';
import { FaStar, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaCalendar, FaComments, FaEnvelope } from 'react-icons/fa';
import { toast } from 'sonner';
import ConfirmDialog from '../components/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';

const RequestDetails = () => {
  const { t } = useTranslation();
  const { requestId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [offers, setOffers] = useState([]);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [offerData, setOfferData] = useState({
    price: '',
    pricing_type: 'fixed',
    duration_days: '',
    message: ''
  });
  const { confirmState, confirm, closeConfirm } = useConfirm();

  const handleContactProvider = async (providerId) => {
    try {
      const response = await api.post('/chat/rooms', {
        user_id: user.user_id,
        provider_id: providerId,
        request_id: requestId
      });
      const roomId = response.data.room_id;
      navigate(`/chat/${roomId}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'שגיאה ביצירת צ\'אט');
    }
  };

  useEffect(() => {
    fetchRequestDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const requestResponse = await api.get(`/requests/${requestId}`);
      setRequest(requestResponse.data);

      const offersResponse = await api.get(`/requests/${requestId}/offers`);
      setOffers(offersResponse.data.offers || []);
    } catch (error) {
      console.error('Failed to fetch request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    try {
      await api.post('/offers', {
        request_id: requestId,
        ...offerData,
        price: parseFloat(offerData.price),
        duration_days: offerData.duration_days ? parseInt(offerData.duration_days) : null
      });
      toast.success('ההצעה נשלחה בהצלחה!');
      setShowOfferForm(false);
      setOfferData({ price: '', pricing_type: 'fixed', duration_days: '', message: '' });
      fetchRequestDetails();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('errorOccurred'));
    }
  };

  const handleAcceptOffer = async (offerId) => {
    try {
      await confirm({
        title: 'קבלת הצעה',
        message: 'האם אתה בטוח שברצונך לקבל הצעה זו? תיווצר הזמנה חדשה ושיחת צ\'אט עם הספק.',
        type: 'info',
        confirmText: 'קבל הצעה',
        cancelText: 'ביטול'
      });
    } catch {
      return; // User cancelled
    }

    try {
      const response = await api.post(`/offers/${offerId}/accept`);
      const { booking_id, room_id } = response.data;
      toast.success('ההצעה התקבלה! נוצרה הזמנה חדשה.');
      fetchRequestDetails();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('errorOccurred'));
    }
  };

  const handleRejectOffer = async (offerId) => {
    try {
      await confirm({
        title: 'דחיית הצעה',
        message: 'האם אתה בטוח שברצונך לדחות הצעה זו?',
        type: 'warning',
        confirmText: 'דחה',
        cancelText: 'ביטול'
      });
    } catch {
      return; // User cancelled
    }

    try {
      await api.post(`/offers/${offerId}/reject`);
      toast.success('ההצעה נדחתה');
      fetchRequestDetails();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('errorOccurred'));
    }
  };

  const handleCancelRequest = async () => {
    try {
      await confirm({
        title: 'ביטול בקשה',
        message: 'האם אתה בטוח שברצונך לבטל את הבקשה? כל ההצעות הפתוחות יידחו.',
        type: 'warning',
        confirmText: 'בטל בקשה',
        cancelText: 'חזור'
      });
    } catch {
      return; // User cancelled
    }

    try {
      await api.put(`/requests/${requestId}/cancel`, { reason: cancelReason });
      toast.success('הבקשה בוטלה');
      setShowCancelForm(false);
      fetchRequestDetails();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('errorOccurred'));
    }
  };

  const getOfferStatusBadge = (status) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: t('offerPending') },
      accepted: { color: 'bg-green-100 text-green-800', text: t('offerAccepted') },
      rejected: { color: 'bg-red-100 text-red-800', text: t('offerRejected') },
      withdrawn: { color: 'bg-gray-100 text-gray-800', text: t('offerWithdrawn') }
    };
    const c = config[status] || config.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.color}`}>
        {c.text}
      </span>
    );
  };

  const getUrgencyBadge = (urgency) => {
    const colors = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${colors[urgency] || colors.medium}`}>
        <FaExclamationTriangle className="text-xs" />
        {t(urgency)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-12">{t('loading')}</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-12">בקשה לא נמצאה</div>
      </div>
    );
  }

  const isOwner = user?.user_id === request.user_id;
  const isProvider = user?.role === 'provider';

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-carefd-teal-pale">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6 text-carefd-navy font-heading" data-testid="request-details-title">
          {request.title}
        </h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Request Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-carefd-teal-pale">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-carefd-navy">{request.title}</h2>
                  <p className="text-carefd-gray text-sm">
                    {request.created_at ? format(new Date(request.created_at), 'dd/MM/yyyy HH:mm') : ''}
                  </p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    request.status === 'open' ? 'bg-green-100 text-green-800' :
                    request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    request.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {request.status === 'open' && 'פתוח'}
                    {request.status === 'in_progress' && 'בתהליך'}
                    {request.status === 'completed' && 'הושלם'}
                    {request.status === 'cancelled' && 'בוטל'}
                  </span>
                  {request.urgency && getUrgencyBadge(request.urgency)}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-carefd-navy mb-2">תיאור:</h3>
                  <p className="text-carefd-slate">{request.description}</p>
                </div>

                {/* Professions */}
                {request.professions && request.professions.length > 0 && (
                  <div>
                    <span className="font-semibold text-carefd-navy">מקצוע:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {request.professions.map((prof, idx) => (
                        <span key={idx} className="bg-carefd-teal-pale text-carefd-teal text-sm px-3 py-1 rounded-full">
                          {prof}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Legacy specialization fallback */}
                {(!request.professions || request.professions.length === 0) && request.specialization && (
                  <div>
                    <span className="font-semibold text-carefd-navy">{t('specialization')}:</span>
                    <span className="mr-2 text-carefd-slate">{request.specialization}</span>
                  </div>
                )}

                {request.service_type && (
                  <div>
                    <span className="font-semibold text-carefd-navy">סוג שירות:</span>
                    <span className="mr-2 text-carefd-slate">{t(request.service_type)}</span>
                  </div>
                )}

                {request.delivery_type && (
                  <div>
                    <span className="font-semibold text-carefd-navy">דרך מתן השירות:</span>
                    <span className="mr-2 text-carefd-slate">{t(request.delivery_type)}</span>
                  </div>
                )}

                {request.request_type && (
                  <div>
                    <span className="font-semibold text-carefd-navy">{t('requestType')}:</span>
                    <span className="mr-2 text-carefd-slate">{t(request.request_type)}</span>
                  </div>
                )}

                {request.budget && (
                  <div>
                    <span className="font-semibold text-carefd-navy">{t('budget')}:</span>
                    <span className="text-carefd-teal font-bold text-xl mr-2">
                      ₪{request.budget}
                      {request.budget_type && (
                        <span className="text-sm font-normal text-carefd-gray mr-1">
                          {request.budget_type === 'per_hour' ? 'לשעה' :
                           request.budget_type === 'per_treatment' ? 'לטיפול' :
                           request.budget_type === 'per_visit' ? 'לביקור' : request.budget_type}
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {request.preferred_date && (
                  <div className="flex items-center gap-2">
                    <FaCalendar className="text-carefd-teal" />
                    <span className="font-semibold text-carefd-navy">{t('preferredDate')}:</span>
                    <span className="text-carefd-slate">
                      {request.preferred_date ? format(new Date(request.preferred_date), 'dd/MM/yyyy') : ''}
                      {request.preferred_time && ` בשעה ${request.preferred_time}`}
                    </span>
                  </div>
                )}

                {request.gender_preference && request.gender_preference !== 'no_preference' && (
                  <div>
                    <span className="font-semibold text-carefd-navy">העדפת מגדר:</span>
                    <span className="mr-2 text-carefd-slate">
                      {request.gender_preference === 'male' ? 'זכר' :
                       request.gender_preference === 'female' ? 'נקבה' : request.gender_preference}
                    </span>
                  </div>
                )}

                {request.language_preferences && request.language_preferences.length > 0 && (
                  <div>
                    <span className="font-semibold text-carefd-navy">העדפות שפה:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {request.language_preferences.map((lang, idx) => {
                        const labels = {
                          hebrew: 'עברית', arabic: 'ערבית', english: 'אנגלית',
                          russian: 'רוסית', french: 'צרפתית', spanish: 'ספרדית', amharic: 'אמהרית'
                        };
                        return (
                          <span key={idx} className="bg-blue-50 text-blue-600 text-sm px-2 py-0.5 rounded-full">
                            {labels[lang] || lang}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {request.preferences && (
                  <div>
                    <span className="font-semibold text-carefd-navy">{t('preferences')}:</span>
                    <p className="text-carefd-slate mt-1">{request.preferences}</p>
                  </div>
                )}

                {request.location && (request.location.city || request.location.address) && (
                  <div>
                    <span className="font-semibold text-carefd-navy">מיקום:</span>
                    <span className="mr-2 text-carefd-slate">
                      {request.location.city}
                      {request.location.city && request.location.address && ', '}
                      {request.location.address}
                    </span>
                  </div>
                )}
              </div>

              {/* Booking/Chat links for accepted requests */}
              {request.status === 'in_progress' && request.booking_id && isOwner && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg flex gap-3">
                  <Link
                    to="/dashboard?tab=bookings"
                    className="flex-1 text-center bg-carefd-teal text-white py-2 rounded-lg hover:bg-carefd-teal-medium transition font-medium"
                  >
                    {t('viewBooking')}
                  </Link>
                  <Link
                    to="/chats"
                    className="flex-1 text-center bg-carefd-navy text-white py-2 rounded-lg hover:bg-carefd-slate transition font-medium flex items-center justify-center gap-2"
                  >
                    <FaComments /> {t('goToChat')}
                  </Link>
                </div>
              )}
            </div>

            {/* Offers Section - visible to owner and the provider who made the offer */}
            {(isOwner || (isProvider && offers.some(o => o.provider_id === user?.provider_id || o.provider?.provider_id === user?.provider_id))) && (
            <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-carefd-teal-pale">
              <h2 className="text-2xl font-bold mb-4 text-carefd-navy">
                {isOwner ? `${t('offersReceived')} (${offers.length})` : 'ההצעה שלי'}
              </h2>

              {offers.length === 0 ? (
                <p className="text-carefd-gray text-center py-8">{t('noOffers')}</p>
              ) : (
                <div className="space-y-4">
                  {offers.map((offer) => (
                    <div
                      key={offer.offer_id}
                      className={`border-2 p-4 rounded-lg transition ${
                        offer.status === 'accepted' ? 'border-green-300 bg-green-50' :
                        offer.status === 'rejected' ? 'border-red-200 bg-red-50 opacity-60' :
                        offer.status === 'withdrawn' ? 'border-gray-200 bg-gray-50 opacity-60' :
                        'border-carefd-light-gray hover:border-carefd-teal'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-start gap-3">
                          {/* Provider avatar */}
                          {offer.provider?.profile_image ? (
                            <img
                              src={offer.provider.profile_image}
                              alt=""
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-carefd-teal-pale flex items-center justify-center text-carefd-teal font-bold">
                              {(offer.provider?.business_name || 'ס')[0]}
                            </div>
                          )}
                          <div>
                            <h3 className="font-bold text-carefd-navy">
                              {offer.provider?.business_name || offer.provider_name || 'ספק שירותים'}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-carefd-gray">
                              {offer.provider?.rating != null && offer.provider.rating > 0 && (
                                <div className="flex items-center">
                                  <FaStar className="text-yellow-500 ml-1" />
                                  <span>{Number(offer.provider.rating).toFixed(1)}</span>
                                  {offer.provider?.total_reviews > 0 && (
                                    <span className="text-xs mr-1">({offer.provider.total_reviews})</span>
                                  )}
                                </div>
                              )}
                              {offer.provider?.specialization_name && (
                                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                                  {offer.provider.specialization_name}
                                </span>
                              )}
                              {offer.provider?.is_verified && (
                                <FaCheckCircle className="text-green-500" title="ספק מאומת" />
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-left flex flex-col items-end gap-1">
                          <div className="text-2xl font-bold text-carefd-teal">₪{offer.price}</div>
                          <div className="text-sm text-carefd-gray">{t(offer.pricing_type)}</div>
                          {getOfferStatusBadge(offer.status)}
                        </div>
                      </div>

                      <p className="text-carefd-slate mb-3">{offer.message}</p>

                      {offer.duration_days && (
                        <p className="text-sm text-carefd-gray mb-3">
                          משך ביצוע: {offer.duration_days} ימים
                        </p>
                      )}

                      {/* Action buttons for request owner */}
                      {isOwner && offer.status === 'pending' && request.status === 'open' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleContactProvider(offer.provider_id || offer.provider?.provider_id)}
                            className="px-4 bg-blue-100 text-blue-700 py-2 rounded-lg hover:bg-blue-200 transition flex items-center gap-2"
                            data-testid={`contact-provider-${offer.offer_id}`}
                          >
                            <FaEnvelope /> צור קשר
                          </button>
                          <button
                            onClick={() => handleAcceptOffer(offer.offer_id)}
                            className="flex-1 bg-carefd-teal text-white py-2 rounded-lg hover:bg-carefd-teal-medium transition flex items-center justify-center gap-2"
                            data-testid={`accept-offer-${offer.offer_id}`}
                          >
                            <FaCheckCircle /> {t('acceptOffer')}
                          </button>
                          <button
                            onClick={() => handleRejectOffer(offer.offer_id)}
                            className="px-4 bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200 transition flex items-center gap-2"
                            data-testid={`reject-offer-${offer.offer_id}`}
                          >
                            <FaTimesCircle /> {t('rejectOffer')}
                          </button>
                        </div>
                      )}

                      {offer.status === 'accepted' && (
                        <div className="bg-green-100 text-green-800 p-2 rounded text-center font-medium flex items-center justify-center gap-2">
                          <FaCheckCircle /> {t('offerAccepted')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-4">
            {/* Provider: Make Offer */}
            {isProvider && request.status === 'open' && (
              <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-carefd-teal">
                {!showOfferForm ? (
                  <button
                    onClick={() => setShowOfferForm(true)}
                    className="w-full bg-carefd-teal text-white py-3 rounded-lg hover:bg-carefd-teal-medium transition font-bold"
                    data-testid="make-offer-btn"
                  >
                    {t('makeOffer')}
                  </button>
                ) : (
                  <form onSubmit={handleSubmitOffer} className="space-y-4">
                    <h3 className="font-bold text-carefd-navy mb-3">הגש הצעה</h3>

                    <div>
                      <label className="block text-sm font-medium text-carefd-navy mb-1">מחיר *</label>
                      <input
                        type="number"
                        required
                        value={offerData.price}
                        onChange={(e) => setOfferData({...offerData, price: e.target.value})}
                        className="w-full px-3 py-2 border border-carefd-light-gray rounded-md focus:ring-carefd-teal focus:border-carefd-teal"
                        placeholder="₪"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-carefd-navy mb-1">סוג תמחור</label>
                      <select
                        value={offerData.pricing_type}
                        onChange={(e) => setOfferData({...offerData, pricing_type: e.target.value})}
                        className="w-full px-3 py-2 border border-carefd-light-gray rounded-md focus:ring-carefd-teal focus:border-carefd-teal"
                      >
                        <option value="fixed">מחיר קבוע</option>
                        <option value="per_hour">{t('per_hour')}</option>
                        <option value="per_visit">לפי ביקור</option>
                        <option value="consultation">{t('consultation')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-carefd-navy mb-1">משך ביצוע (ימים)</label>
                      <input
                        type="number"
                        value={offerData.duration_days}
                        onChange={(e) => setOfferData({...offerData, duration_days: e.target.value})}
                        className="w-full px-3 py-2 border border-carefd-light-gray rounded-md focus:ring-carefd-teal focus:border-carefd-teal"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-carefd-navy mb-1">הודעה *</label>
                      <textarea
                        required
                        value={offerData.message}
                        onChange={(e) => setOfferData({...offerData, message: e.target.value})}
                        className="w-full px-3 py-2 border border-carefd-light-gray rounded-md focus:ring-carefd-teal focus:border-carefd-teal"
                        rows="4"
                        placeholder="פרט על ההצעה שלך..."
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 bg-carefd-teal text-white py-2 rounded-lg hover:bg-carefd-teal-medium transition"
                      >
                        שלח
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowOfferForm(false)}
                        className="px-4 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Owner: Cancel Request */}
            {isOwner && request.status === 'open' && (
              <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-red-200">
                {!showCancelForm ? (
                  <button
                    onClick={() => setShowCancelForm(true)}
                    className="w-full bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200 transition font-medium"
                    data-testid="cancel-request-btn"
                  >
                    {t('cancelRequest')}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <h3 className="font-bold text-red-700">{t('cancelRequest')}</h3>
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full px-3 py-2 border border-red-200 rounded-md"
                      rows="2"
                      placeholder={t('cancelReason') + '...'}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancelRequest}
                        className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
                      >
                        {t('cancelRequest')}
                      </button>
                      <button
                        onClick={() => setShowCancelForm(false)}
                        className="px-4 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tips for owner */}
            {isOwner && request.status === 'open' && (
              <div className="bg-carefd-teal-pale p-4 rounded-lg">
                <h3 className="font-bold text-carefd-navy mb-2">עצות</h3>
                <ul className="text-sm text-carefd-slate space-y-2">
                  <li>• השווה בין מספר הצעות</li>
                  <li>• בדוק דירוגי ספקים</li>
                  <li>• קרא ביקורות</li>
                  <li>• שאל שאלות בצ'אט</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
      />
    </div>
  );
};

export { RequestDetails };
export default RequestDetails;
