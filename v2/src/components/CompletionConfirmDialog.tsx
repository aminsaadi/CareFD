"use client";

import { useState } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  X, CheckCircle, Star, ThumbsUp, ThumbsDown, Loader2, MessageSquare,
} from "lucide-react";

interface CompletionConfirmDialogProps {
  bookingId: string;
  providerName: string;
  serviceName: string;
  onClose: () => void;
  onComplete: () => void;
}

type Step = "confirm" | "success" | "review";

export default function CompletionConfirmDialog({
  bookingId,
  providerName,
  serviceName,
  onClose,
  onComplete,
}: CompletionConfirmDialogProps) {
  const [step, setStep] = useState<Step>("confirm");
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [detailedRatings, setDetailedRatings] = useState({
    service_quality: 0,
    punctuality: 0,
    communication: 0,
    value_for_money: 0,
  });

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await api.post(`/bookings/${bookingId}/client-confirm`, { notes: notes || undefined });
      setStep("success");
      onComplete();
    } catch (err: any) {
      toast.error(err?.detail || "שגיאה באישור ההשלמה");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) { toast.error("נא לבחור דירוג"); return; }
    setLoading(true);
    try {
      await api.post("/reviews", {
        booking_id: bookingId,
        rating,
        comment: comment || undefined,
        recommend,
        detailed_ratings: detailedRatings,
      });
      toast.success("הביקורת נשלחה בהצלחה!");
      onClose();
    } catch (err: any) {
      toast.error(err?.detail || "שגיאה בשליחת הביקורת");
    } finally {
      setLoading(false);
    }
  };

  const detailedLabels: { key: keyof typeof detailedRatings; label: string }[] = [
    { key: "service_quality", label: "איכות השירות" },
    { key: "punctuality", label: "דייקנות" },
    { key: "communication", label: "תקשורת" },
    { key: "value_for_money", label: "תמורה למחיר" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-carefd-navy">
            {step === "confirm" ? "אישור השלמת שירות" : step === "success" ? "השירות הושלם" : "כתיבת ביקורת"}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5 text-carefd-gray" />
          </button>
        </div>

        <div className="p-6">
          {step === "confirm" && (
            <div className="space-y-4">
              <div className="bg-carefd-teal-pale/20 rounded-xl p-4">
                <p className="font-medium text-carefd-navy">{serviceName}</p>
                <p className="text-sm text-carefd-gray">ספק: {providerName}</p>
              </div>
              <p className="text-sm text-carefd-gray">
                בלחיצה על &quot;אשר השלמה&quot; אתה מאשר שהשירות בוצע כצפוי.
              </p>
              <div>
                <label className="block text-sm font-medium text-carefd-navy mb-2">הערות (אופציונלי)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-carefd-teal outline-none text-sm resize-none"
                  placeholder="הוסף הערות לגבי השירות..."
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleConfirm} disabled={loading} className="flex-1">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <CheckCircle className="w-4 h-4 me-2" />}
                  אשר השלמה
                </Button>
                <Button variant="outline" onClick={onClose}>ביטול</Button>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-xl font-bold text-carefd-navy">השירות אושר בהצלחה!</h4>
              <p className="text-carefd-gray">תודה על האישור. תרצה לכתוב ביקורת?</p>
              <div className="flex gap-3">
                <Button onClick={() => setStep("review")} className="flex-1">
                  <Star className="w-4 h-4 me-2" />
                  כתוב ביקורת
                </Button>
                <Button variant="outline" onClick={onClose}>לא עכשיו</Button>
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-5">
              {/* Main Rating */}
              <div className="text-center">
                <p className="text-sm font-medium text-carefd-navy mb-2">דירוג כללי</p>
                <div className="flex items-center justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      onMouseEnter={() => setHoverRating(i)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(i)}
                    >
                      <Star className={`w-8 h-8 transition-colors ${
                        i <= (hoverRating || rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-200"
                      }`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Detailed Ratings */}
              <div className="space-y-3">
                {detailedLabels.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-carefd-navy">{label}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <button key={i} onClick={() => setDetailedRatings((p) => ({ ...p, [key]: i }))}>
                          <Star className={`w-5 h-5 transition-colors ${
                            i <= detailedRatings[key] ? "text-yellow-400 fill-yellow-400" : "text-gray-200"
                          }`} />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-carefd-navy mb-2">
                  <MessageSquare className="w-4 h-4 inline me-1" />
                  ביקורת מילולית
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-carefd-teal outline-none text-sm resize-none"
                  placeholder="ספרו על החוויה שלכם..."
                />
              </div>

              {/* Recommendation */}
              <div>
                <p className="text-sm font-medium text-carefd-navy mb-2">ממליץ על ספק זה?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setRecommend(true)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition ${
                      recommend === true ? "bg-green-100 text-green-700 border-2 border-green-300" : "bg-gray-50 text-carefd-gray border-2 border-transparent"
                    }`}
                  >
                    <ThumbsUp className="w-5 h-5" />
                    כן
                  </button>
                  <button
                    onClick={() => setRecommend(false)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition ${
                      recommend === false ? "bg-red-100 text-red-700 border-2 border-red-300" : "bg-gray-50 text-carefd-gray border-2 border-transparent"
                    }`}
                  >
                    <ThumbsDown className="w-5 h-5" />
                    לא
                  </button>
                </div>
              </div>

              <Button onClick={handleSubmitReview} disabled={loading} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Star className="w-4 h-4 me-2" />}
                שלח ביקורת
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
