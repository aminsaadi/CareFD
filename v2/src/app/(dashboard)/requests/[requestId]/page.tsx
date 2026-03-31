"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";

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

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full" /></div>;
  if (!request) return <div className="text-center py-20 text-gray-500">הבקשה לא נמצאה</div>;

  return (
    <div dir="rtl">
      {/* Request Details */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{request.title}</h1>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${request.status === "open" ? "bg-green-100 text-green-700" : request.status === "in_progress" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
            {request.status === "open" ? "פתוח" : request.status === "in_progress" ? "בטיפול" : request.status}
          </span>
        </div>
        <p className="text-gray-700 whitespace-pre-wrap mb-4">{request.description}</p>
        <div className="flex gap-4 text-sm text-gray-500">
          {request.budget && <span>תקציב: ₪{request.budget}</span>}
          <span>נוצר: {new Date(request.createdAt).toLocaleDateString("he-IL")}</span>
        </div>
      </div>

      {/* Offers */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">הצעות ({request.offers?.length || 0})</h2>
        {!request.offers?.length ? (
          <p className="text-gray-500 text-center py-8">אין הצעות עדיין</p>
        ) : (
          <div className="space-y-4">
            {request.offers.map((offer: any) => (
              <div key={offer.id} className="border border-gray-100 rounded-xl p-5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">
                      {offer.provider?.businessName?.[0] || "?"}
                    </div>
                    <div>
                      <p className="font-medium">{offer.providerName || offer.provider?.businessName}</p>
                      {offer.provider?.rating > 0 && <p className="text-xs text-gray-400">⭐ {offer.provider.rating.toFixed(1)}</p>}
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-bold text-teal-600">₪{offer.price}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${offer.status === "pending" ? "bg-yellow-100 text-yellow-700" : offer.status === "accepted" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {offer.status === "pending" ? "ממתין" : offer.status === "accepted" ? "התקבל" : offer.status === "rejected" ? "נדחה" : offer.status}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 mt-3">{offer.message}</p>
                {offer.status === "pending" && request.userId === user?.user_id && (
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => handleOfferAction(offer.id, "accept")}
                      className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">קבל הצעה</button>
                    <button onClick={() => handleOfferAction(offer.id, "reject")}
                      className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">דחה</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
