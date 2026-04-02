"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Star, Send } from "lucide-react";

export default function WriteReviewPage() {
  const { bookingId } = useParams();
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [serviceQuality, setServiceQuality] = useState(5);
  const [punctuality, setPunctuality] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const booking = await api.get<any>(`/bookings/${bookingId}`);
      await api.post("/reviews", {
        provider_id: booking.providerId,
        booking_id: bookingId,
        rating, comment, service_quality: serviceQuality,
        punctuality, communication,
      });
      router.push("/bookings");
    } catch (err: any) {
      setError(err.message || "שגיאה");
    } finally { setSubmitting(false); }
  };

  const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-600">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} type="button" onClick={() => onChange(s)} className="p-0.5" data-testid={`star-${label}-${s}`}>
            <Star className={`w-6 h-6 transition-colors ${s <= value ? "text-accent fill-accent" : "text-slate-200"}`} />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="mb-6">כתיבת ביקורת</h1>
      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4 border border-red-100">{error}</div>}

          <StarRating label="דירוג כללי" value={rating} onChange={setRating} />
          <StarRating label="איכות השירות" value={serviceQuality} onChange={setServiceQuality} />
          <StarRating label="דייקנות" value={punctuality} onChange={setPunctuality} />
          <StarRating label="תקשורת" value={communication} onChange={setCommunication} />

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">ביקורת</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              placeholder="ספרו על החוויה שלכם..."
              className="min-h-[140px]"
              data-testid="review-comment"
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={submitting} data-testid="review-submit">
            {submitting ? (
              <span className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
            ) : (
              <>
                <Send className="w-4 h-4 me-2" />
                שלח ביקורת
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
