"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Star, Check, X } from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "success" | "accent" | "outline" }> = {
  open: { label: "פתוח", variant: "success" },
  in_progress: { label: "בטיפול", variant: "accent" },
  completed: { label: "הושלם", variant: "outline" },
  cancelled: { label: "בוטל", variant: "outline" },
};

export default function RequestDetailPage() {
  const { requestId } = useParams();
  const { user } = useAuth();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!requestId) return;
    api.get(`/requests/${requestId}`).then(setRequest).catch(() => {}).finally(() => setLoading(false));
  }, [requestId]);

  const handleOfferAction = async (offerId: string, action: string) => {
    try {
      await api.post(`/offers/${offerId}`, { action });
      api.get(`/requests/${requestId}`).then(setRequest);
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return (
    <div>
      <Skeleton className="h-10 w-64 mb-6" />
      <Card className="p-8 mb-6"><Skeleton className="h-40 w-full" /></Card>
      <Card className="p-8"><Skeleton className="h-60 w-full" /></Card>
    </div>
  );

  if (!request) return <div className="text-center py-20 text-slate-400">הבקשה לא נמצאה</div>;

  const status = statusConfig[request.status] || { label: request.status, variant: "outline" as const };

  return (
    <div>
      {/* Request Details */}
      <Card className="p-8 mb-8">
        <div className="flex justify-between items-start mb-4">
          <h1>{request.title}</h1>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <p className="text-slate-600 whitespace-pre-wrap mb-6 leading-relaxed">{request.description}</p>
        <div className="flex gap-6 text-sm text-slate-400">
          {request.budget && <span>תקציב: <span className="font-heading font-bold text-primary">{"\u20AA"}{request.budget}</span></span>}
          <span>נוצר: {new Date(request.createdAt).toLocaleDateString("he-IL")}</span>
        </div>
      </Card>

      {/* Offers */}
      <Card className="p-8">
        <h2 className="text-xl font-heading font-semibold mb-6">הצעות ({request.offers?.length || 0})</h2>
        {!request.offers?.length ? (
          <p className="text-slate-400 text-center py-10">אין הצעות עדיין</p>
        ) : (
          <div className="space-y-4">
            {request.offers.map((offer: any) => (
              <div key={offer.id} className="border border-slate-100 rounded-2xl p-5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-heading font-bold">
                      {offer.provider?.businessName?.[0] || "?"}
                    </div>
                    <div>
                      <p className="font-medium text-primary">{offer.providerName || offer.provider?.businessName}</p>
                      {offer.provider?.rating > 0 && (
                        <p className="text-xs text-slate-400 flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-accent fill-accent" />
                          {offer.provider.rating.toFixed(1)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-end">
                    <p className="text-xl font-heading font-bold text-primary">{"\u20AA"}{offer.price}</p>
                    <Badge variant={offer.status === "pending" ? "warning" : offer.status === "accepted" ? "success" : "outline"}>
                      {offer.status === "pending" ? "ממתין" : offer.status === "accepted" ? "התקבל" : offer.status === "rejected" ? "נדחה" : offer.status}
                    </Badge>
                  </div>
                </div>
                <p className="text-slate-500 mt-3 text-sm">{offer.message}</p>
                {offer.status === "pending" && request.userId === user?.user_id && (
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" onClick={() => handleOfferAction(offer.id, "accept")} data-testid={`accept-${offer.id}`}>
                      <Check className="w-4 h-4 me-1" />
                      קבל הצעה
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => handleOfferAction(offer.id, "reject")} data-testid={`reject-${offer.id}`}>
                      <X className="w-4 h-4 me-1" />
                      דחה
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
