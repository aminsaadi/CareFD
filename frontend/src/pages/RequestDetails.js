import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { format } from 'date-fns';
import { FaStar, FaEnvelope } from 'react-icons/fa';
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
  const [offerData, setOfferData] = useState({
    price: '',
    pricing_type: 'consultation',
    duration_days: '',
    message: ''
  });
  const { confirmState, confirm, closeConfirm } = useConfirm();

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
      fetchRequestDetails();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('errorOccurred'));
    }
  };

  const handleAcceptOffer = async (offerId) => {
    await confirm({
      title: 'קבלת הצעה',
      message: 'האם אתה בטוח שברצונך לקבל הצעה זו?',
      type: 'info',
      confirmText: 'קבל הצעה',
      cancelText: 'ביטול'
    });

    try {
      await api.post(`/offers/${offerId}/accept`);
      toast.success('ההצעה התקבלה! תוכל לתקשר עם הספק בצ\'אט');
      navigate('/chats');
    } catch (error) {
      toast.error(error.response?.data?.detail || t('errorOccurred'));
    }
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
                    {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  request.status === 'open' ? 'bg-green-100 text-green-800' :
                  request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {request.status === 'open' && 'פתוח'}
                  {request.status === 'in_progress' && 'בתהליך'}
                  {request.status === 'completed' && 'הושלם'}
                  {request.status === 'cancelled' && 'בוטל'}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-carefd-navy mb-2">תיאור:</h3>
                  <p className="text-carefd-slate">{request.description}</p>
                </div>

                {request.specialization && (
                  <div>
                    <span className="font-semibold text-carefd-navy">התמחות:</span>
                    <span className="mr-2 text-carefd-slate">{request.specialization}</span>
                  </div>
                )}

                {request.service_type && (
                  <div>
                    <span className="font-semibold text-carefd-navy">סוג שירות:</span>
                    <span className="mr-2 text-carefd-slate">{t(request.service_type)}</span>
                  </div>
                )}

                {request.budget && (
                  <div>
                    <span className="font-semibold text-carefd-navy">תקציב:</span>
                    <span className="text-carefd-teal font-bold text-xl mr-2">₪{request.budget}</span>
                  </div>
                )}

                {request.location && (
                  <div>
                    <span className="font-semibold text-carefd-navy">מיקום:</span>
                    <span className="mr-2 text-carefd-slate">{request.location.city}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Offers Section */}
            <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-carefd-teal-pale">
              <h2 className="text-2xl font-bold mb-4 text-carefd-navy">הצעות ({offers.length})</h2>

              {offers.length === 0 ? (
                <p className="text-carefd-gray text-center py-8">עדיין אין הצעות לבקשה זו</p>
              ) : (
                <div className="space-y-4">
                  {offers.map((offer) => (
                    <div
                      key={offer.offer_id}
                      className="border-2 border-carefd-light-gray p-4 rounded-lg hover:border-carefd-teal transition"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-carefd-navy">
                            {offer.provider?.business_name || 'ספק שירותים'}
                          </h3>
                          {offer.provider?.rating && (
                            <div className="flex items-center text-sm text-carefd-gray">
                              <FaStar className="text-yellow-500 ml-1" />
                              <span>{offer.provider.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-left">
                          <div className="text-2xl font-bold text-carefd-teal">₪{offer.price}</div>
                          <div className="text-sm text-carefd-gray">{t(offer.pricing_type)}</div>
                        </div>
                      </div>

                      <p className="text-carefd-slate mb-3">{offer.message}</p>

                      {offer.duration_days && (
                        <p className="text-sm text-carefd-gray mb-3">
                          משך ביצוע: {offer.duration_days} ימים
                        </p>
                      )}

                      {isOwner && offer.status === 'pending' && (
                        <button
                          onClick={() => handleAcceptOffer(offer.offer_id)}
                          className="w-full bg-carefd-teal text-white py-2 rounded-lg hover:bg-carefd-teal-medium transition"
                          data-testid={`accept-offer-${offer.offer_id}`}
                        >
                          קבל הצעה
                        </button>
                      )}

                      {offer.status === 'accepted' && (
                        <div className="bg-green-100 text-green-800 p-2 rounded text-center font-medium">
                          ✓ הצעה התקבלה
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-4">
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
                      <label className="block text-sm font-medium text-carefd-navy mb-1">מחיר</label>
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
                      <label className="block text-sm font-medium text-carefd-navy mb-1">משך ביצוע (ימים)</label>
                      <input
                        type="number"
                        value={offerData.duration_days}
                        onChange={(e) => setOfferData({...offerData, duration_days: e.target.value})}
                        className="w-full px-3 py-2 border border-carefd-light-gray rounded-md focus:ring-carefd-teal focus:border-carefd-teal"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-carefd-navy mb-1">הודעה</label>
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
                        ביטול
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {isOwner && (
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