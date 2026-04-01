"use client";

import React, { useState } from 'react';
import { FaStar, FaSpinner } from 'react-icons/fa';
import api from '@/lib/api-client';

const AddReviewForm = ({ providerId, onReviewAdded }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('נא לבחור דירוג');
      return;
    }
    
    if (comment.trim().length < 10) {
      setError('נא לכתוב ביקורת של לפחות 10 תווים');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.post('/reviews', {
        provider_id: providerId,
        rating,
        comment: comment.trim()
      });
      
      setSuccess(true);
      setRating(0);
      setComment('');
      
      if (onReviewAdded) {
        onReviewAdded();
      }
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to submit review:', err);
      setError('שגיאה בשליחת הביקורת. נסה שוב.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Star Rating */}
      <div>
        <label className="block text-sm font-medium text-carefd-navy mb-2">דירוג</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-2xl transition-transform hover:scale-110"
              data-testid={`star-${star}`}
            >
              <FaStar 
                className={`${
                  star <= (hoverRating || rating) 
                    ? 'text-yellow-500' 
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
          <span className="me-2 text-sm text-carefd-gray">
            {rating > 0 && `${rating} מתוך 5`}
          </span>
        </div>
      </div>

      {/* Comment */}
      <div>
        <label className="block text-sm font-medium text-carefd-navy mb-2">הביקורת שלך</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="ספר/י על החוויה שלך עם הספק..."
          rows={4}
          className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:outline-none focus:border-carefd-teal resize-none"
          data-testid="review-comment"
        />
        <p className="text-xs text-carefd-gray mt-1">{comment.length}/500 תווים</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 text-green-600 px-4 py-3 rounded-xl text-sm">
          הביקורת נשלחה בהצלחה! תודה על המשוב.
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-carefd-teal text-white px-6 py-3 rounded-xl font-semibold hover:bg-carefd-teal-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        data-testid="submit-review-btn"
      >
        {isSubmitting ? (
          <>
            <FaSpinner className="animate-spin" />
            שולח...
          </>
        ) : (
          'שלח ביקורת'
        )}
      </button>
    </form>
  );
};

export default AddReviewForm;
