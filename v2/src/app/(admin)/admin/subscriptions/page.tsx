"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, Crown, Gem, User } from "lucide-react";

const tierIcons: Record<string, React.ElementType> = { free: User, pro: Crown, premium: Gem };
const tierColors: Record<string, string> = { free: "bg-slate-50 text-slate-600", pro: "bg-blue-50 text-blue-600", premium: "bg-accent/10 text-accent" };

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ plans: any[] }>("/subscription-plans")
      .then((d) => setPlans(d.plans)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="font-heading font-semibold text-2xl mb-6">ניהול מנויים</h2>

      <h3 className="font-heading font-semibold text-lg mb-4">תוכניות</h3>
      {loading ? (
        <div className="grid md:grid-cols-3 gap-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full" />)}</div>
      ) : plans.length === 0 ? (
        <Card className="p-10 text-center"><CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400">אין תוכניות מנויים</p></Card>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((p) => {
            const Icon = tierIcons[p.tier] || User;
            return (
              <Card key={p.id} className={`p-6 ${tierColors[p.tier] || ""} border-0`}>
                <Icon className="w-8 h-8 mb-3" />
                <h3 className="font-heading font-bold text-xl mb-1">{p.name}</h3>
                <p className="text-sm opacity-70 mb-4">{p.description || p.tier}</p>
                <div className="space-y-1 text-sm">
                  <p>חודשי: <span className="font-heading font-bold">{"\u20AA"}{p.monthlyPrice || 0}</span></p>
                  <p>שנתי: <span className="font-heading font-bold">{"\u20AA"}{p.yearlyPrice || 0}</span></p>
                </div>
                <div className="mt-4 flex flex-wrap gap-1">
                  {p.features?.map((f: string) => <Badge key={f} variant="outline" className="text-[10px]">{f}</Badge>)}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
