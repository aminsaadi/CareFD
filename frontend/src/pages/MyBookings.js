import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { format } from 'date-fns';
import { toast } from 'sonner';
import ConfirmDialog from '../components/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';
import { FaStar, FaSpinner } from 'react-icons/fa';

const MyBookings = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { confirmState, confirm, closeConfirm } = useConfirm();
  const [showReviewModal, setShowReviewModal] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewedBookings, setReviewedBookings] = useState([]);

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bookings');
      const bookingsData = response.data.bookings || [];
      
      // Fetch service and provider details for each booking
      const enrichedBookings = await Promise.all(
        bookingsData.map(async (booking) => {
          try {
            const serviceResponse = await api.get(`/services?service_id=${booking.service_id}`);
            const services = serviceResponse.data.services || [];
            const service = services.find(s => s.service_id === booking.service_id);
            
            if (service) {
              const providerResponse = await api.get(`/providers/${service.provider_id}`);
              return {
                ...booking,
                service,
                provider: providerResponse.data
              };
            }
            return booking;
          } catch (error) {
            return booking;
          }
        })
      );
      
      setBookings(enrichedBookings);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await confirm({
        title: 'ביטול הזמנה',
        message: 'האם אתה בטוח שברצונך לבטל הזמנה זו?',
        type: 'danger',
        confirmText: 'בטל הזמנה',
        cancelText: 'השאר'
      });
    } catch {
      return; // User cancelled
    }

    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      toast.success('ההזמנה בוטלה בהצלחה');
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'שגיאה בביטול ההזמנה');
    }
  };

  const handleSubmitReview = async (booking) => {
    if (reviewRating === 0) {
      toast.error('נא לבחור דירוג');
      return;
    }
    
    if (reviewComment.trim().length < 10) {
      toast.error('נא לכתוב ביקורת של לפחות 10 תווים');
      return;
    }

    setIsSubmittingReview(true);

    try {
      await api.post('/reviews', {
        provider_id: booking.provider?.provider_id || booking.service?.provider_id,
        booking_id: booking.booking_id,
        rating: reviewRating,
        comment: reviewComment.trim()
      });
      
      toast.success('הביקורת נשלחה בהצלחה! תודה על המשוב.');
      setReviewedBookings([...reviewedBookings, booking.booking_id]);
      setShowReviewModal(null);
      setReviewRating(0);
      setReviewComment('');
    } catch (err) {
      console.error('Failed to submit review:', err);
      toast.error('שגיאה בשליחת הביקורת. נסה שוב.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-carefd-teal-pale text-carefd-teal border-carefd-teal',
      completed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-12">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-carefd-teal-pale">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-carefd-navy font-heading" data-testid="my-bookings-title">
            {t('myBookings')}
          </h1>
          <Link
            to="/services"
            className="bg-carefd-teal text-white px-6 py-2 rounded-lg hover:bg-carefd-teal-medium transition-colors"
          >
            הזמן שירות חדש
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6 p-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-carefd-teal text-white'
                  : 'bg-carefd-light-gray text-carefd-navy hover:bg-carefd-teal-pale'
              }`}
            >
              הכל ({bookings.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-carefd-teal text-white'
                  : 'bg-carefd-light-gray text-carefd-navy hover:bg-carefd-teal-pale'
              }`}
            >
              ממתינות ({bookings.filter(b => b.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('confirmed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'confirmed'
                  ? 'bg-carefd-teal text-white'
                  : 'bg-carefd-light-gray text-carefd-navy hover:bg-carefd-teal-pale'
              }`}
            >
              מאושרות ({bookings.filter(b => b.status === 'confirmed').length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-carefd-teal text-white'
                  : 'bg-carefd-light-gray text-carefd-navy hover:bg-carefd-teal-pale'
              }`}
            >
              הושלמו ({bookings.filter(b => b.status === 'completed').length})
            </button>
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-carefd-gray text-lg">אין הזמנות</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.booking_id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-carefd-teal-pale"
                data-testid={`booking-${booking.booking_id}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-carefd-navy">
                      {booking.service?.name || 'שירות'}
                    </h3>
                    <p className="text-carefd-gray">
                      {booking.provider?.business_name || 'ספק שירותים'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border-2 ${getStatusColor(booking.status)}`}>
                    {booking.status === 'pending' && 'ממתין לאישור'}
                    {booking.status === 'confirmed' && 'מאושר'}
                    {booking.status === 'completed' && 'הושלם'}
                    {booking.status === 'cancelled' && 'בוטל'}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="font-semibold text-carefd-navy">תאריך:</span>
                    <span className="mr-2 text-carefd-slate">
                      {booking.booking_date ? format(new Date(booking.booking_date), 'dd/MM/yyyy HH:mm') : ''}
                    </span>
                  </div>
                  {booking.service?.price && (
                    <div>
                      <span className="font-semibold text-carefd-navy">מחיר:</span>
                      <span className="text-carefd-teal font-bold mr-2">₪{booking.service.price}</span>
                    </div>
                  )}
                </div>

                {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCancelBooking(booking.booking_id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                      data-testid={`cancel-booking-${booking.booking_id}`}
                    >
                      בטל הזמנה
                    </button>
                  </div>
                )}
                
                {/* Review button for completed bookings */}
                {booking.status === 'completed' && !reviewedBookings.includes(booking.booking_id) && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-carefd-teal-pale">
                    <button
                      onClick={() => setShowReviewModal(booking)}
                      className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-2"
                      data-testid={`review-booking-${booking.booking_id}`}
                    >
                      <FaStar />
                      כתוב ביקורת
                    </button>
                    <Link
                      to={`/providers/${booking.provider?.provider_id || booking.service?.provider_id}`}
                      className="bg-carefd-teal text-white px-4 py-2 rounded-lg hover:bg-carefd-teal-medium transition-colors"
                    >
                      צפה בפרופיל הספק
                    </Link>
                  </div>
                )}
                
                {booking.status === 'completed' && reviewedBookings.includes(booking.booking_id) && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-carefd-teal-pale text-green-600">
                    <FaStar className="text-yellow-500" />
                    <span>ביקורת נשלחה - תודה!</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
      
      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowReviewModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" role="dialog" aria-modal="true" aria-label="כתוב ביקורת" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-carefd-navy mb-2">כתוב ביקורת</h3>
            <p className="text-carefd-gray mb-6">
              ספר לנו על החוויה שלך עם {showReviewModal.provider?.business_name || 'הספק'}
            </p>
            
            {/* Star Rating */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-carefd-navy mb-2">דירוג</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    onMouseEnter={() => setReviewHoverRating(star)}
                    onMouseLeave={() => setReviewHoverRating(0)}
                    className="text-3xl transition-transform hover:scale-110"
                    data-testid={`review-star-${star}`}
                  >
                    <FaStar 
                      className={`${
                        star <= (reviewHoverRating || reviewRating) 
                          ? 'text-yellow-500' 
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="mr-3 text-sm text-carefd-gray self-center">
                  {reviewRating > 0 && `${reviewRating} מתוך 5`}
                </span>
              </div>
            </div>

            {/* Comment */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-carefd-navy mb-2">הביקורת שלך</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="ספר/י על החוויה שלך עם הספק..."
                rows={4}
                maxLength={500}
                className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:outline-none focus:border-carefd-teal resize-none"
                data-testid="review-modal-comment"
              />
              <p className="text-xs text-carefd-gray mt-1">{reviewComment.length}/500 תווים</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReviewModal(null);
                  setReviewRating(0);
                  setReviewComment('');
                }}
                className="flex-1 bg-gray-100 text-carefd-gray py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                ביטול
              </button>
              <button
                onClick={() => handleSubmitReview(showReviewModal)}
                disabled={isSubmittingReview}
                className="flex-1 bg-carefd-teal text-white py-3 rounded-xl font-semibold hover:bg-carefd-teal-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="submit-review-modal-btn"
              >
                {isSubmittingReview ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    שולח...
                  </>
                ) : (
                  'שלח ביקורת'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;