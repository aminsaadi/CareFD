"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api-client";

export default function WriteReviewPage() {
  const { bookingId } = useParams();
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [serviceQuality, setServiceQuality] = useState(5);
  const [punctuality, setPunctuality] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // We need provider_id from the booking
      const booking = await api.get<any>(`/bookings/${bookingId}`);
      await api.post("/reviews", {
        provider_id: booking.providerId,
        booking_id: bookingId,
        rating,
        comment,
        service_quality: serviceQuality,
        punctuality,
        communication,
      });
      alert("הביקורת נשלחה לאישור!");
      router.push("/bookings");
    } catch (err: any) {
      alert(err.message || "שגיאה");
    } finally { setSubmitting(false); }
  };

  const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} type="button" onClick={() => onChange(s)}
            className={`text-2xl ${s <= value ? "text-yellow-400" : "text-gray-200"}`}>★</button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto" dir="rtl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">כתיבת ביקורת</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <StarRating label="דירוג כללי" value={rating} onChange={setRating} />
        <StarRating label="איכות השירות" value={serviceQuality} onChange={setServiceQuality} />
        <StarRating label="דייקנות" value={punctuality} onChange={setPunctuality} />
        <StarRating label="תקשורת" value={communication} onChange={setCommunication} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ביקורת</label>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} required rows={4}
            placeholder="ספרו על החוויה שלכם..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none" />
        </div>
        <button type="submit" disabled={submitting}
          className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 disabled:opacity-50">
          {submitting ? "שולח..." : "שלח ביקורת"}
        </button>
      </form>
    </div>
  );
}
