"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Send, CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function WriteReviewPage() {
  const { bookingId } = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [serviceQuality, setServiceQuality] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    api.get<any>(`/bookings/${bookingId}`)
      .then(setBooking)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bookingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { toast.error("נא לבחור דירוג"); return; }
    if (!comment.trim()) { toast.error("נא לכתוב ביקורת"); return; }
    setSubmitting(true);
    try {
      await api.post("/reviews", {
        provider_id: booking?.providerId || booking?.provider_id,
        booking_id: bookingId,
        rating,
        comment: comment.trim(),
        service_quality: serviceQuality || rating,
        punctuality: punctuality || rating,
        communication: communication || rating,
      });
      setSuccess(true);
      toast.success("הביקורת נשלחה בהצלחה!");
    } catch (err: any) {
      toast.error(err.message || "שגיאה בשליחת הביקורת");
    } finally { setSubmitting(false); }
  };

  const StarRating = ({ value, onChange, onHover, label, size = "lg" }: {
    value: number; onChange: (v: number) => void; onHover?: (v: number) => void;
    label: string; size?: "sm" | "lg";
  }) => {
    const starSize = size === "lg" ? "w-8 h-8" : "w-6 h-6";
    const displayValue = onHover ? (hoverRating || value) : value;
    return (
      <div className="flex items-center justify-between">
        <span className={`font-medium text-carefd-navy ${size === "lg" ? "text-base" : "text-sm"}`}>{label}</span>
        <div className="flex gap-1" onMouseLeave={() => onHover?.(0)}>
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} type="button" onClick={() => onChange(s)}
              onMouseEnter={() => onHover?.(s)} className="p-0.5 transition-transform hover:scale-110">
              <Star className={`${starSize} transition-colors ${s <= displayValue ? "text-amber-400 fill-amber-400" : "text-slate-200 hover:text-amber-200"}`} />
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="max-w-xl mx-auto"><Skeleton className="h-10 w-48 mb-6" /><Skeleton className="h-96 w-full" /></div>
  );

  if (success) return (
    <div className="max-w-xl mx-auto">
      <Card className="p-10 text-center border-0 shadow-floating">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-carefd-navy mb-2">תודה על הביקורת!</h2>
        <p className="text-slate-500 mb-6">הביקורת שלך תעזור למשתמשים אחרים לבחור את הספק המתאים</p>
        <div className="flex justify-center gap-3">
          <Button asChild><Link href="/bookings">חזרה להזמנות</Link></Button>
          <Button variant="outline" asChild><Link href="/dashboard">לוח בקרה</Link></Button>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
        <ArrowRight className="w-4 h-4 me-1" />חזרה
      </Button>

      <h1 className="mb-2">כתיבת ביקורת</h1>
      {booking && (
        <p className="text-slate-500 mb-6">
          על: <span className="font-medium text-carefd-navy">{booking.providerName || booking.provider_name || "ספק"}</span>
          {" • "}שירות: <span className="font-medium">{booking.serviceName || booking.service_name || ""}</span>
        </p>
      )}

      <Card className="p-8 border-0 shadow-floating">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Main Rating */}
          <div className="text-center pb-6 border-b border-slate-100">
            <p className="text-lg font-bold text-carefd-navy mb-4">איך היה השירות?</p>
            <div className="flex justify-center gap-2" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" onClick={() => setRating(s)} onMouseEnter={() => setHoverRating(s)} className="p-1 transition-transform hover:scale-125">
                  <Star className={`w-10 h-10 transition-colors ${s <= (hoverRating || rating) ? "text-amber-400 fill-amber-400" : "text-slate-200 hover:text-amber-200"}`} />
                </button>
              ))}
            </div>
            <p className="text-sm text-slate-400 mt-2">
              {rating === 0 ? "בחרו דירוג" : rating <= 2 ? "לא משביע רצון" : rating === 3 ? "בסדר" : rating === 4 ? "טוב מאוד" : "מצוין!"}
            </p>
          </div>

          {/* Sub Ratings */}
          <div className="space-y-4">
            <StarRating label="איכות השירות" value={serviceQuality} onChange={setServiceQuality} size="sm" />
            <StarRating label="דייקנות" value={punctuality} onChange={setPunctuality} size="sm" />
            <StarRating label="תקשורת" value={communication} onChange={setCommunication} size="sm" />
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-carefd-navy">הביקורת שלך *</label>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} required
              placeholder="ספרו על החוויה שלכם - מה היה טוב? מה אפשר לשפר?" className="min-h-[140px]" />
            <p className="text-xs text-slate-400">{comment.length}/500 תווים</p>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={submitting || rating === 0}>
            {submitting ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <Send className="w-4 h-4 me-2" />}
            {submitting ? "שולח..." : "שלח ביקורת"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
