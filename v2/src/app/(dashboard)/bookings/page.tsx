"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import api from '@/lib/api-client';
import { format } from 'date-fns';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useConfirm } from '@/hooks/useConfirm';
import { FaStar, FaSpinner, FaCheckCircle } from 'react-icons/fa';

const MyBookings = () => {
  const t = (key: string) => ({ loading: 'טוען...', myBookings: 'ההזמנות שלי' }[key] || key);
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { confirmState, confirm, closeConfirm } = useConfirm();
  const [showReviewModal, setShowReviewModal] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewedBookings, setReviewedBookings] = useState<any[]>([]);

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await api.get('/bookings/my');
      const bookingsData = data.bookings || [];
      setBookings(bookingsData);
    } catch (error: any) {
      console.error('Failed to fetch bookings:', error);
      toast.error('שגיאה בטעינת ההזמנות');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      const confirmed = window.confirm('בקשת הביטול תישלח לספק לאישור. האם להמשיך?');
      if (!confirmed) return;
    } catch {
      return; // User cancelled
    }

    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      toast.success('ההזמנה בוטלה בהצלחה');
      fetchBookings();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'שגיאה בביטול ההזמנה');
    }
  };

  const handleConfirmCompletion = async (booking) => {
    try {
      const confirmed = window.confirm(`האם השירות "${booking.service_name || 'שירות'}" הושלם לשביעות רצונך?`);
      if (!confirmed) return;
      await api.put(`/bookings/${booking.booking_id}/client-confirm`, {
        final_price: booking.final_price || booking.base_price
      });
      toast.success('השירות אושר כהושלם! תוכל לכתוב ביקורת.');
      fetchBookings();
    } catch (error: any) {
      if (error?.response) {
        toast.error(error.response?.data?.detail || 'שגיאה באישור ההשלמה');
      }
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
        provider_id: booking.provider_id || booking.provider?.provider_id,
        booking_id: booking.booking_id,
        rating: reviewRating,
        comment: reviewComment.trim()
      });
      
      toast.success('הביקורת נשלחה בהצלחה! תודה על המשוב.');
      setReviewedBookings([...reviewedBookings, booking.booking_id]);
      setShowReviewModal(null);
      setReviewRating(0);
      setReviewComment('');
    } catch (err: any) {
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
      in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
      provider_completed: 'bg-purple-100 text-purple-800 border-purple-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
      cancellation_requested: 'bg-orange-100 text-orange-800 border-orange-300',
      on_hold: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'ממתין לאישור',
      confirmed: 'מאושר',
      in_progress: 'בביצוע',
      provider_completed: 'הספק סיים - ממתין לאישורך',
      completed: 'הושלם',
      cancelled: 'בוטל',
      rejected: 'נדחה',
      cancellation_requested: 'בקשת ביטול',
      on_hold: 'בהמתנה'
    };
    return labels[status] || status;
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        
        <div className="text-center py-12">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-carefd-teal-pale">
      
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-carefd-navy font-heading" data-testid="my-bookings-title">
            {t('myBookings')}
          </h1>
          <Link
            href="/services"
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
                      {booking.service_name || booking.service?.name || 'שירות'}
                    </h3>
                    <p className="text-carefd-gray">
                      {booking.provider_name || booking.provider?.business_name || 'ספק שירותים'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border-2 ${getStatusColor(booking.status)}`}>
                    {getStatusLabel(booking.status)}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="font-semibold text-carefd-navy">תאריך:</span>
                    <span className="me-2 text-carefd-slate">
                      {booking.booking_date ? format(new Date(booking.booking_date), 'dd/MM/yyyy HH:mm') : ''}
                    </span>
                  </div>
                  {(booking.final_price || booking.base_price || booking.service?.price) && (
                    <div>
                      <span className="font-semibold text-carefd-navy">מחיר:</span>
                      <span className="text-carefd-teal font-bold me-2">₪{booking.final_price || booking.base_price || booking.service?.price}</span>
                    </div>
                  )}
                </div>

                {booking.status !== 'cancelled' && booking.status !== 'completed' && booking.status !== 'cancellation_requested' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCancelBooking(booking.booking_id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                      data-testid={`cancel-booking-${booking.booking_id}`}
                    >
                      בקש ביטול הזמנה
                    </button>
                  </div>
                )}
                {booking.status === 'cancellation_requested' && (
                  <div className="flex items-center gap-2 text-orange-600 text-sm mt-2">
                    <FaSpinner className="animate-spin" />
                    <span>בקשת ביטול נשלחה לספק - ממתין לאישור</span>
                  </div>
                )}

                {/* Confirm completion for provider_completed */}
                {booking.status === 'provider_completed' && (
                  <div className="mt-4 pt-4 border-t border-purple-200 bg-purple-50 rounded-lg p-4">
                    <p className="text-purple-800 font-medium mb-3 flex items-center gap-2">
                      <FaCheckCircle />
                      הספק סימן שהשירות הושלם — אנא אשר
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConfirmCompletion(booking)}
                        className="bg-green-500 text-white px-5 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 font-medium"
                      >
                        <FaCheckCircle />
                        אשר השלמה
                      </button>
                      <Link
                        href={`/providers/${booking.provider_id || booking.provider?.provider_id}`}
                        className="bg-carefd-teal text-white px-4 py-2 rounded-lg hover:bg-carefd-teal-medium transition-colors"
                      >
                        צפה בפרופיל הספק
                      </Link>
                    </div>
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
                      href={`/providers/${booking.provider_id || booking.provider?.provider_id}`}
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
                <span className="me-3 text-sm text-carefd-gray self-center">
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