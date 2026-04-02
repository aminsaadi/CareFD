"use client";

import { useState } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Star, Send } from "lucide-react";

interface AddReviewFormProps {
  providerId: string;
  bookingId?: string;
  onSuccess?: () => void;
}

export default function AddReviewForm({ providerId, bookingId, onSuccess }: AddReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.post("/reviews", { provider_id: providerId, booking_id: bookingId, rating, comment });
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "שגיאה בשליחת הביקורת");
    } finally { setSubmitting(false); }
  };

  return (
    <Card className="p-6">
      <h3 className="font-heading font-semibold text-carefd-navy mb-4">כתיבת ביקורת</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 border border-red-100">{error}</div>}
        <div className="flex items-center gap-2">
          <span className="text-sm text-carefd-gray me-2">דירוג:</span>
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} type="button" onClick={() => setRating(s)}>
              <Star className={`w-7 h-7 transition-colors ${s <= rating ? "text-carefd-teal fill-carefd-teal" : "text-slate-200"}`} />
            </button>
          ))}
        </div>
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="ספרו על החוויה שלכם..." required />
        <Button type="submit" disabled={submitting}>
          {submitting ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" /> : <><Send className="w-4 h-4 me-2" />שלח ביקורת</>}
        </Button>
      </form>
    </Card>
  );
}
