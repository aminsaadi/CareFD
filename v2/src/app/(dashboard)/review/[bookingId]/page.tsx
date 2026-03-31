"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api, { ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import {
  FaStar, FaSpinner, FaCheckCircle, FaArrowRight, FaThumbsUp,
} from "react-icons/fa";

interface BookingData {
  booking_id: string;
  user_id: string;
  provider_id: string;
  service_name?: string;
  booking_date?: string;
  status: string;
  has_review?: boolean;
}

interface ProviderData {
  provider_id: string;
  business_name?: string;
  profile_image?: string;
}

export default function WriteReviewPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [provider, setProvider] = useState<ProviderData | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Review form
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [serviceQuality, setServiceQuality] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [priceValue, setPriceValue] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/review/${bookingId}`);
      return;
    }
    fetchBookingDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, isAuthenticated]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const bookingsData = await api.get<{ bookings: BookingData[] }>("/bookings");
      const bookings = bookingsData.bookings || [];
      const foundBooking = bookings.find((b) => b.booking_id === bookingId);

      if (!foundBooking) { toast.error("ההזמנה לא נמצאה"); router.push("/dashboard"); return; }
      if (foundBooking.user_id !== user?.user_id) { toast.error("אין לך הרשאה לכתוב חוות דעת להזמנה זו"); router.push("/dashboard"); return; }
      if (foundBooking.status !== "completed") { toast.error("ניתן לכתוב חוות דעת רק לאחר השלמת ההזמנה"); router.push("/dashboard"); return; }
      if (foundBooking.has_review) { toast.error("כבר כתבת חוות דעת להזמנה זו"); router.push("/dashboard"); return; }

      setBooking(foundBooking);
      const providerData = await api.get<ProviderData>(`/providers/${foundBooking.provider_id}`);
      setProvider(providerData);
    } catch (error) {
      console.error("Failed to fetch booking:", error);
      toast.error("שגיאה בטעינת פרטי ההזמנה");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) { toast.error("נא לבחור דירוג"); return; }
    if (comment.trim().length < 10) { toast.error("נא לכתוב חוות דעת של לפחות 10 תווים"); return; }

    try {
      setSubmitting(true);
      await api.post("/reviews", {
        provider_id: booking!.provider_id,
        booking_id: bookingId,
        rating,
        comment,
        service_quality: serviceQuality || null,
        punctuality: punctuality || null,
        communication: communication || null,
        price_value: priceValue || null,
        would_recommend: wouldRecommend,
      });
      setSubmitted(true);
      toast.success("חוות הדעת נשלחה בהצלחה!");
    } catch (error) {
      console.error("Failed to submit review:", error);
      const err = error as ApiError;
      toast.error(err.data?.detail || "שגיאה בשליחת חוות הדעת");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-carefd-teal-pale">
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <FaSpinner className="animate-spin text-4xl text-carefd-teal" />
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-carefd-teal-pale">
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
              <Link href="/dashboard" className="bg-carefd-teal text-white px-6 py-3 rounded-xl font-semibold hover:bg-carefd-teal-medium transition">
                חזור לדשבורד
              </Link>
              <Link href={`/providers/${provider?.provider_id}`} className="bg-white border-2 border-carefd-teal text-carefd-teal px-6 py-3 rounded-xl font-semibold hover:bg-carefd-teal-pale transition">
                צפה בפרופיל הספק
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-carefd-teal-pale">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back button */}
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-carefd-gray hover:text-carefd-teal transition mb-6">
          <FaArrowRight />
          חזור לדשבורד
        </Link>

        {/* Provider Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-carefd-teal-pale">
          <div className="flex items-center gap-4">
            {provider?.profile_image ? (
              <img src={provider.profile_image} alt={provider.business_name || ""} className="w-16 h-16 rounded-xl object-cover" />
            ) : (
              <div className="w-16 h-16 bg-carefd-teal rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                {provider?.business_name?.[0] || "S"}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-carefd-navy">{provider?.business_name}</h2>
              <p className="text-carefd-gray">{booking?.service_name}</p>
              <p className="text-sm text-carefd-gray">
                {booking?.booking_date ? new Date(booking.booking_date).toLocaleDateString("he-IL") : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-carefd-navy mb-6 text-center">כתוב חוות דעת</h2>

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
                    star <= (hoverRating || rating) ? "text-yellow-400" : "text-gray-300"
                  }`}
                >
                  <FaStar />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-carefd-gray mt-2">
                {rating === 5 && "מעולה!"}
                {rating === 4 && "טוב מאוד"}
                {rating === 3 && "טוב"}
                {rating === 2 && "בסדר"}
                {rating === 1 && "לא מומלץ"}
              </p>
            )}
          </div>

          {/* Detailed Ratings */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {([
              { label: "איכות השירות", value: serviceQuality, setter: setServiceQuality },
              { label: "דייקנות", value: punctuality, setter: setPunctuality },
              { label: "תקשורת", value: communication, setter: setCommunication },
              { label: "תמורה למחיר", value: priceValue, setter: setPriceValue },
            ] as const).map((item) => (
              <div key={item.label}>
                <p className="text-sm font-medium text-carefd-navy mb-2">{item.label}</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => item.setter(star)}
                      className={`text-xl ${star <= item.value ? "text-yellow-400" : "text-gray-300"}`}
                    >
                      <FaStar />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-carefd-navy mb-2">חוות הדעת שלך *</label>
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
                  wouldRecommend ? "bg-green-500 text-white" : "bg-gray-100 text-carefd-gray hover:bg-gray-200"
                }`}
              >
                <FaThumbsUp />
                כן, בהחלט
              </button>
              <button
                type="button"
                onClick={() => setWouldRecommend(false)}
                className={`flex-1 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
                  !wouldRecommend ? "bg-red-500 text-white" : "bg-gray-100 text-carefd-gray hover:bg-gray-200"
                }`}
              >
                <FaThumbsUp className="transform rotate-180" />
                לא
              </button>
            </div>
          </div>

          {/* Notice */}
          <div className="bg-carefd-teal-pale/30 p-4 rounded-xl mb-6">
            <p className="text-sm text-carefd-gray text-center">חוות הדעת תפורסם לאחר אישור מנהל המערכת</p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || rating === 0}
            className="w-full bg-carefd-teal text-white py-4 rounded-xl font-bold text-lg hover:bg-carefd-teal-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (<><FaSpinner className="animate-spin" />שולח...</>) : (<><FaStar />שלח חוות דעת</>)}
          </button>
        </form>
      </div>
    </div>
  );
}
