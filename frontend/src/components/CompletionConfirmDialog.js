import React, { useState } from 'react';
import { X, Star, DollarSign, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import api from '../utils/api';

const CompletionConfirmDialog = ({ booking, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: confirm + payment, 2: review
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [paymentData, setPaymentData] = useState({
    final_price: '',
    payment_notes: ''
  });
  
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: '',
    service_quality: 5,
    punctuality: 5,
    communication: 5,
    price_value: 5,
    would_recommend: true
  });

  const handleConfirmCompletion = async () => {
    setLoading(true);
    setError('');
    
    try {
      await api.put(`/bookings/${booking.booking_id}/client-confirm`, {
        final_price: paymentData.final_price ? parseFloat(paymentData.final_price) : null,
        payment_notes: paymentData.payment_notes || null
      });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || 'שגיאה באישור ההשלמה');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    setLoading(true);
    setError('');
    
    try {
      await api.post('/reviews', {
        provider_id: booking.provider_id,
        booking_id: booking.booking_id,
        rating: reviewData.rating,
        comment: reviewData.comment,
        service_quality: reviewData.service_quality,
        punctuality: reviewData.punctuality,
        communication: reviewData.communication,
        price_value: reviewData.price_value,
        would_recommend: reviewData.would_recommend
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'שגיאה בשליחת הביקורת');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipReview = () => {
    onSuccess?.();
    onClose();
  };

  const RatingStars = ({ value, onChange, label }) => (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-0.5"
          >
            <Star
              className={`w-5 h-5 ${star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {step === 1 ? 'אישור השלמת השירות' : 'דירוג וביקורת'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              {/* Booking Info */}
              <div className="bg-teal-50 p-4 rounded-lg">
                <p className="font-medium text-teal-900">{booking.service_name}</p>
                <p className="text-sm text-teal-700">{booking.provider_name}</p>
                <p className="text-xs text-teal-600 mt-1">
                  {new Date(booking.booking_date).toLocaleDateString('he-IL')}
                </p>
              </div>

              {/* Payment Recording */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  רישום תשלום
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    כמה שילמת עבור השירות?
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={paymentData.final_price}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, final_price: e.target.value }))}
                      placeholder="0"
                      className="w-full px-4 py-2 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      dir="ltr"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                      ₪
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    הערות לתשלום (אופציונלי)
                  </label>
                  <input
                    type="text"
                    value={paymentData.payment_notes}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, payment_notes: e.target.value }))}
                    placeholder="למשל: שולם במזומן, קיבלתי קבלה..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                onClick={handleConfirmCompletion}
                disabled={loading}
                className="w-full px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium disabled:opacity-50"
                data-testid="confirm-completion-btn"
              >
                {loading ? 'מאשר...' : 'אשר השלמת השירות'}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              {/* Rating */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">דרג את השירות</h3>
                
                {/* Main Rating */}
                <div className="flex items-center justify-center gap-2 py-4">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewData(prev => ({ ...prev, rating: star }))}
                      className="p-1"
                    >
                      <Star
                        className={`w-10 h-10 ${star <= reviewData.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                      />
                    </button>
                  ))}
                </div>
                
                {/* Detailed Ratings */}
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <RatingStars
                    label="איכות השירות"
                    value={reviewData.service_quality}
                    onChange={(v) => setReviewData(prev => ({ ...prev, service_quality: v }))}
                  />
                  <RatingStars
                    label="דייקנות"
                    value={reviewData.punctuality}
                    onChange={(v) => setReviewData(prev => ({ ...prev, punctuality: v }))}
                  />
                  <RatingStars
                    label="תקשורת"
                    value={reviewData.communication}
                    onChange={(v) => setReviewData(prev => ({ ...prev, communication: v }))}
                  />
                  <RatingStars
                    label="תמורה למחיר"
                    value={reviewData.price_value}
                    onChange={(v) => setReviewData(prev => ({ ...prev, price_value: v }))}
                  />
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ספר על החוויה שלך
                </label>
                <textarea
                  value={reviewData.comment}
                  onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                  rows={4}
                  placeholder="מה אהבת? מה היה פחות טוב? האם תמליץ?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  data-testid="review-comment-input"
                />
              </div>

              {/* Would Recommend */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700">האם תמליץ על ספק זה?</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewData(prev => ({ ...prev, would_recommend: true }))}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                      reviewData.would_recommend 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    כן
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewData(prev => ({ ...prev, would_recommend: false }))}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                      !reviewData.would_recommend 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                    לא
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSkipReview}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  דלג
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={loading || !reviewData.comment.trim()}
                  className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium disabled:opacity-50"
                  data-testid="submit-review-btn"
                >
                  {loading ? 'שולח...' : 'שלח ביקורת'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompletionConfirmDialog;
