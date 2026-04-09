"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Star, Send, CheckCircle, ArrowRight, Loader2,
  ThumbsUp, ThumbsDown, MapPin, Calendar, Shield,
} from "lucide-react";
import { toast } from "sonner";

export default function WriteReviewPage() {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [serviceQuality, setServiceQuality] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [priceValue, setPriceValue] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    api.get<any>(`/bookings/${bookingId}`)
      .then((b) => {
        setBooking(b);
        if (b?.providerId || b?.provider_id) {
          api.get<any>(`/providers/${b.providerId || b.provider_id}`)
            .then(setProvider).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bookingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { toast.error("נא לבחור דירוג כללי"); return; }
    if (comment.length < 10) { toast.error("חוות הדעת חייבת להכיל לפחות 10 תווים"); return; }
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
        price_value: priceValue || rating,
        would_recommend: wouldRecommend,
      });
      setSuccess(true);
      toast.success("חוות הדעת נשלחה בהצלחה!");
    } catch (err: any) {
      toast.error(err.message || "שגיאה בשליחת חוות הדעת");
    } finally { setSubmitting(false); }
  };

  const StarRow = ({ value, onChange, label, size = "md" }: {
    value: number; onChange: (v: number) => void; label: string; size?: "sm" | "md" | "lg";
  }) => {
    const [hover, setHover] = useState(0);
    const starClass = size === "lg" ? "w-10 h-10" : size === "md" ? "w-7 h-7" : "w-5 h-5";
    return (
      <div className={size === "lg" ? "text-center" : "flex items-center justify-between"}>
        {size !== "lg" && <span className="text-sm font-medium text-carefd-navy">{label}</span>}
        <div className={`flex ${size === "lg" ? "justify-center gap-2" : "gap-1"}`} onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} type="button" onClick={() => onChange(s)} onMouseEnter={() => setHover(s)}
              className="p-0.5 transition-transform hover:scale-110">
              <Star className={`${starClass} transition-colors ${s <= (hover || value) ? "text-amber-400 fill-amber-400" : "text-slate-200 hover:text-amber-200"}`} />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const ratingLabels: Record<number, string> = { 1: "לא מומלץ", 2: "בסדר", 3: "טוב", 4: "טוב מאוד", 5: "מעולה!" };

  if (loading) return (
    <div className="max-w-2xl mx-auto"><Skeleton className="h-10 w-48 mb-6" /><Skeleton className="h-24 w-full mb-4" /><Skeleton className="h-96 w-full" /></div>
  );

  if (success) return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-10 text-center border-0 shadow-floating">
        <div className="w-20 h-20 bg-carefd-teal/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-carefd-teal" />
        </div>
        <h2 className="text-2xl font-bold text-carefd-navy mb-4">תודה על חוות הדעת!</h2>
        <p className="text-slate-500 mb-2">חוות הדעת שלך נשלחה בהצלחה וממתינה לאישור.</p>
        <p className="text-sm text-slate-400 mb-8">לאחר האישור, חוות הדעת תופיע בפרופיל הספק.</p>
        <div className="flex gap-4 justify-center">
          <Button asChild><Link href="/bookings">חזרה להזמנות</Link></Button>
          {provider && (
            <Button variant="outline" asChild>
              <Link href={`/providers/${provider.provider_id}`}>צפה בפרופיל הספק</Link>
            </Button>
          )}
        </div>
      </Card>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
        <ArrowRight className="w-4 h-4 me-1" />חזרה
      </Button>

      {/* Provider Info Card */}
      {(provider || booking) && (
        <Card className="p-6 mb-6 border-2 border-carefd-teal-pale">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-carefd-teal to-carefd-navy flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 overflow-hidden">
              {provider?.profile_image ? (
                <img src={provider.profile_image} alt="" className="w-full h-full object-cover" />
              ) : (
                (provider?.business_name || booking?.providerName || "S")[0]
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-carefd-navy">{provider?.business_name || booking?.providerName || "ספק"}</h2>
                {provider?.is_verified && <Badge variant="success" className="text-xs"><Shield className="w-3 h-3 me-1" />מאומת</Badge>}
              </div>
              <p className="text-slate-500">{booking?.serviceName || booking?.service_name || ""}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                {booking?.bookingDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(booking.bookingDate || booking.booking_date).toLocaleDateString("he-IL")}</span>}
                {provider?.location?.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{provider.location.city}</span>}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Review Form */}
      <Card className="p-8 border-0 shadow-floating">
        <form onSubmit={handleSubmit} className="space-y-8">
          <h2 className="text-2xl font-bold text-carefd-navy text-center">כתוב חוות דעת</h2>

          {/* Overall Rating - Large */}
          <div className="text-center pb-6 border-b border-slate-100">
            <p className="text-lg font-semibold text-carefd-navy mb-4">דירוג כללי *</p>
            <div className="flex justify-center gap-2" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" onClick={() => setRating(s)} onMouseEnter={() => setHoverRating(s)}
                  className="p-1 transition-transform hover:scale-125">
                  <Star className={`w-12 h-12 transition-colors ${s <= (hoverRating || rating) ? "text-amber-400 fill-amber-400" : "text-slate-200 hover:text-amber-200"}`} />
                </button>
              ))}
            </div>
            {rating > 0 && <p className="text-slate-500 mt-3 font-medium">{ratingLabels[rating]}</p>}
          </div>

          {/* Detailed Ratings - 2x2 Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <StarRow label="איכות השירות" value={serviceQuality} onChange={setServiceQuality} />
            <StarRow label="דייקנות" value={punctuality} onChange={setPunctuality} />
            <StarRow label="תקשורת" value={communication} onChange={setCommunication} />
            <StarRow label="תמורה למחיר" value={priceValue} onChange={setPriceValue} />
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-carefd-navy">חוות הדעת שלך *</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              minLength={10}
              placeholder="ספרו על החוויה שלכם - מה היה טוב? מה אפשר לשפר? האם הייתם ממליצים?"
              className="min-h-[140px]"
            />
            <p className={`text-xs ${comment.length < 10 ? "text-red-400" : "text-slate-400"}`}>
              {comment.length} תווים (מינימום 10)
            </p>
          </div>

          {/* Would Recommend */}
          <div>
            <p className="text-sm font-medium text-carefd-navy mb-3">האם היית ממליץ/ה על הספק?</p>
            <div className="flex gap-4">
              <button type="button" onClick={() => setWouldRecommend(true)}
                className={`flex-1 py-3.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  wouldRecommend === true ? "bg-carefd-teal text-white shadow-glow" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}>
                <ThumbsUp className="w-5 h-5" />כן, בהחלט
              </button>
              <button type="button" onClick={() => setWouldRecommend(false)}
                className={`flex-1 py-3.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  wouldRecommend === false ? "bg-red-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}>
                <ThumbsDown className="w-5 h-5" />לא
              </button>
            </div>
          </div>

          {/* Notice */}
          <div className="bg-carefd-teal-pale/20 p-4 rounded-xl text-center">
            <p className="text-sm text-slate-500">חוות הדעת תפורסם לאחר אישור מנהל המערכת</p>
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full h-14 rounded-xl bg-gradient-to-l from-carefd-teal to-carefd-teal-medium shadow-glow hover:shadow-lg transition-all text-lg" size="lg" disabled={submitting || rating === 0}>
            {submitting ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <Star className="w-5 h-5 me-2" />}
            {submitting ? "שולח..." : "שלח חוות דעת"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
