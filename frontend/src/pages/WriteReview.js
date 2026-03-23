import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import { toast } from 'sonner';
import { 
  FaStar, FaSpinner, FaCheckCircle, FaArrowRight, FaThumbsUp
} from 'react-icons/fa';

const WriteReview = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState(null);
  const [provider, setProvider] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  
  // Review form
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [serviceQuality, setServiceQuality] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [priceValue, setPriceValue] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/review/${bookingId}`);
      return;
    }
    fetchBookingDetails();
  }, [bookingId, isAuthenticated]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      
      // Get booking
      const bookingsResponse = await api.get('/bookings');
      const bookings = bookingsResponse.data.bookings || [];
      const foundBooking = bookings.find(b => b.booking_id === bookingId);
      
      if (!foundBooking) {
        toast.error('ההזמנה לא נמצאה');
        navigate('/dashboard');
        return;
      }
      
      // Check if booking belongs to user
      if (foundBooking.user_id !== user?.user_id) {
        toast.error('אין לך הרשאה לכתוב חוות דעת להזמנה זו');
        navigate('/dashboard');
        return;
      }
      
      // Check if booking is completed
      if (foundBooking.status !== 'completed') {
        toast.error('ניתן לכתוב חוות דעת רק לאחר השלמת ההזמנה');
        navigate('/dashboard');
        return;
      }
      
      // Check if already reviewed
      if (foundBooking.has_review) {
        toast.error('כבר כתבת חוות דעת להזמנה זו');
        navigate('/dashboard');
        return;
      }
      
      setBooking(foundBooking);
      
      // Get provider
      const providerResponse = await api.get(`/providers/${foundBooking.provider_id}`);
      setProvider(providerResponse.data);
      
    } catch (error) {
      console.error('Failed to fetch booking:', error);
      toast.error('שגיאה בטעינת פרטי ההזמנה');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('נא לבחור דירוג');
      return;
    }
    
    if (comment.trim().length < 10) {
      toast.error('נא לכתוב חוות דעת של לפחות 10 תווים');
      return;
    }
    
    try {
      setSubmitting(true);
      
      await api.post('/reviews', {
        provider_id: booking.provider_id,
        booking_id: bookingId,
        rating,
        comment,
        service_quality: serviceQuality || null,
        punctuality: punctuality || null,
        communication: communication || null,
        price_value: priceValue || null,
        would_recommend: wouldRecommend
      });
      
      setSubmitted(true);
      toast.success('חוות הדעת נשלחה בהצלחה!');
      
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast.error(error.response?.data?.detail || 'שגיאה בשליחת חוות הדעת');
    } finally {
      setSubmitting(false);
    }
  };

  // Star rating component with its own hover state
  const StarRating = ({ value, onChange, size = 'text-2xl', label }) => {
    const [localHover, setLocalHover] = useState(0);
    return (
      <div className="flex flex-col gap-2">
        {label && <span className="text-sm text-carefd-gray">{label}</span>}
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setLocalHover(star)}
              onMouseLeave={() => setLocalHover(0)}
              className={`${size} transition-transform hover:scale-110 ${
                star <= (localHover || value) ? 'text-yellow-400' : 'text-gray-300'
              }`}
            >
              <FaStar />
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-carefd-teal-pale">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <FaSpinner className="animate-spin text-4xl text-carefd-teal" />
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-carefd-teal-pale">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center border-2 border-green-500">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaCheckCircle className="text-4xl text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-carefd-navy mb-4">תודה על חוות הדעת!</h2>
            <p className="text-carefd-gray mb-6">
              חוות הדעת שלך נשלחה בהצלחה וממתינה לאישור המנהל.
              <br />
              לאחר האישור, חוות הדעת תופיע בפרופיל הספק.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                to="/dashboard"
                className="bg-carefd-teal text-white px-6 py-3 rounded-xl font-semibold hover:bg-carefd-teal-medium transition"
              >
                חזור לדשבורד
              </Link>
              <Link
                to={`/providers/${provider?.provider_id}`}
                className="bg-white border-2 border-carefd-teal text-carefd-teal px-6 py-3 rounded-xl font-semibold hover:bg-carefd-teal-pale transition"
              >
                צפה בפרופיל הספק
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-carefd-teal-pale">
      <Navbar />
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back button */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-carefd-gray hover:text-carefd-teal transition mb-6"
        >
          <FaArrowRight />
          חזור לדשבורד
        </Link>
        
        {/* Provider Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-carefd-teal-pale">
          <div className="flex items-center gap-4">
            {provider?.profile_image ? (
              <img 
                src={provider.profile_image}
                alt={provider.business_name}
                className="w-16 h-16 rounded-xl object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-carefd-teal rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                {provider?.business_name?.[0] || 'S'}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-carefd-navy">{provider?.business_name}</h2>
              <p className="text-carefd-gray">{booking?.service_name}</p>
              <p className="text-sm text-carefd-gray">
                {booking?.booking_date ? new Date(booking.booking_date).toLocaleDateString('he-IL') : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-carefd-navy mb-6 text-center">
            כתוב חוות דעת
          </h2>
          
          {/* Overall Rating */}
          <div className="text-center mb-8">
            <p className="text-lg font-semibold text-carefd-navy mb-3">דירוג כללי</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className={`text-4xl transition-transform hover:scale-110 ${
                    star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  <FaStar />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-carefd-gray mt-2">
                {rating === 5 && 'מעולה!'}
                {rating === 4 && 'טוב מאוד'}
                {rating === 3 && 'טוב'}
                {rating === 2 && 'בסדר'}
                {rating === 1 && 'לא מומלץ'}
              </p>
            )}
          </div>

          {/* Detailed Ratings */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-sm font-medium text-carefd-navy mb-2">איכות השירות</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setServiceQuality(star)}
                    className={`text-xl ${star <= serviceQuality ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    <FaStar />
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-carefd-navy mb-2">דייקנות</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setPunctuality(star)}
                    className={`text-xl ${star <= punctuality ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    <FaStar />
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-carefd-navy mb-2">תקשורת</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setCommunication(star)}
                    className={`text-xl ${star <= communication ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    <FaStar />
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-carefd-navy mb-2">תמורה למחיר</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setPriceValue(star)}
                    className={`text-xl ${star <= priceValue ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    <FaStar />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-carefd-navy mb-2">
              חוות הדעת שלך *
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal outline-none resize-none"
              placeholder="ספר על החוויה שלך עם הספק, מה היה טוב ומה אפשר לשפר..."
              required
              minLength={10}
            />
            <p className="text-xs text-carefd-gray mt-1">{comment.length} תווים (מינימום 10)</p>
          </div>

          {/* Would Recommend */}
          <div className="mb-8">
            <p className="text-sm font-medium text-carefd-navy mb-3">האם היית ממליץ על הספק?</p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setWouldRecommend(true)}
                className={`flex-1 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
                  wouldRecommend 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-100 text-carefd-gray hover:bg-gray-200'
                }`}
              >
                <FaThumbsUp />
                כן, בהחלט
              </button>
              <button
                type="button"
                onClick={() => setWouldRecommend(false)}
                className={`flex-1 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
                  !wouldRecommend 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-100 text-carefd-gray hover:bg-gray-200'
                }`}
              >
                <FaThumbsUp className="transform rotate-180" />
                לא
              </button>
            </div>
          </div>

          {/* Notice */}
          <div className="bg-carefd-teal-pale/30 p-4 rounded-xl mb-6">
            <p className="text-sm text-carefd-gray text-center">
              חוות הדעת תפורסם לאחר אישור מנהל המערכת
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || rating === 0}
            className="w-full bg-carefd-teal text-white py-4 rounded-xl font-bold text-lg hover:bg-carefd-teal-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <FaSpinner className="animate-spin" />
                שולח...
              </>
            ) : (
              <>
                <FaStar />
                שלח חוות דעת
              </>
            )}
          </button>
        </form>
      </div>
      
      <Footer />
    </div>
  );
};

export default WriteReview;
