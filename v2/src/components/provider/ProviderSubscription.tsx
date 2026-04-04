"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Crown, Zap, Star, Check, Loader2, CreditCard, ArrowUpRight,
} from "lucide-react";

interface Plan {
  plan_id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  limits: Record<string, number>;
  tier: string;
}

interface Subscription {
  subscription_id: string;
  plan_id: string;
  plan_name: string;
  tier: string;
  status: string;
  billing_cycle: string;
  current_period_end: string;
  trial_end?: string;
}

const tierConfig: Record<string, { icon: typeof Star; color: string; bg: string }> = {
  free: { icon: Star, color: "text-carefd-gray", bg: "bg-gray-100" },
  pro: { icon: Zap, color: "text-blue-600", bg: "bg-blue-100" },
  premium: { icon: Crown, color: "text-amber-600", bg: "bg-amber-100" },
  gold: { icon: Crown, color: "text-amber-600", bg: "bg-amber-100" },
};

export default function ProviderSubscription() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<{ plans: Plan[] }>("/subscription-plans").catch(() => ({ plans: [] })),
      api.get<{ subscription: Subscription }>("/subscriptions/my").catch(() => ({ subscription: null })),
    ]).then(([plansData, subData]) => {
      setPlans(plansData.plans || []);
      setSubscription(subData.subscription || null);
    }).finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (planId: string) => {
    setUpgrading(planId);
    try {
      await api.post("/subscriptions/upgrade", { plan_id: planId, billing_cycle: billingCycle });
      toast.success("המנוי שודרג בהצלחה!");
      const subData = await api.get<{ subscription: Subscription }>("/subscriptions/my");
      setSubscription(subData.subscription || null);
    } catch (err: any) {
      toast.error(err?.detail || "שגיאה בשדרוג המנוי");
    } finally {
      setUpgrading(null);
    }
  };

  const handleCancel = async () => {
    try {
      await api.post("/subscriptions/cancel", {});
      toast.success("המנוי בוטל");
      setSubscription(null);
    } catch (err: any) {
      toast.error(err?.detail || "שגיאה בביטול");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-carefd-teal" />
      </div>
    );
  }

  const currentTier = subscription?.tier || "free";
  const config = tierConfig[currentTier] || tierConfig.free;
  const TierIcon = config.icon;

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-carefd-navy flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-carefd-teal" />
            המנוי שלי
          </h3>
          {subscription && (
            <Badge variant="accent" className="text-sm">
              {subscription.status === "active" ? "פעיל" : subscription.status === "trialing" ? "תקופת ניסיון" : subscription.status}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4 bg-carefd-teal-pale/20 rounded-xl p-4">
          <div className={`w-14 h-14 rounded-xl ${config.bg} flex items-center justify-center`}>
            <TierIcon className={`w-7 h-7 ${config.color}`} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-carefd-navy text-lg">{subscription?.plan_name || "חינמי"}</p>
            {subscription?.current_period_end && (
              <p className="text-sm text-carefd-gray">
                בתוקף עד: {new Date(subscription.current_period_end).toLocaleDateString("he-IL")}
              </p>
            )}
            {subscription?.trial_end && new Date(subscription.trial_end) > new Date() && (
              <p className="text-sm text-amber-600">
                תקופת ניסיון עד: {new Date(subscription.trial_end).toLocaleDateString("he-IL")}
              </p>
            )}
          </div>
          {subscription && subscription.tier !== "free" && (
            <button onClick={handleCancel} className="text-sm text-red-500 hover:underline">
              בטל מנוי
            </button>
          )}
        </div>
      </Card>

      {/* Billing Cycle Toggle */}
      {plans.length > 0 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              billingCycle === "monthly" ? "bg-carefd-teal text-white" : "bg-gray-100 text-carefd-gray"
            }`}
          >
            חודשי
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              billingCycle === "yearly" ? "bg-carefd-teal text-white" : "bg-gray-100 text-carefd-gray"
            }`}
          >
            שנתי
            <span className="ms-1 text-xs text-green-600 font-bold">חסכו 20%</span>
          </button>
        </div>
      )}

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const planConfig = tierConfig[plan.tier] || tierConfig.free;
          const PlanIcon = planConfig.icon;
          const price = billingCycle === "yearly" ? plan.price_yearly / 12 : plan.price_monthly;
          const isCurrentPlan = currentTier === plan.tier;

          return (
            <Card key={plan.plan_id} className={`p-6 relative ${isCurrentPlan ? "ring-2 ring-carefd-teal" : ""}`}>
              {isCurrentPlan && (
                <div className="absolute -top-3 start-4 bg-carefd-teal text-white text-xs px-3 py-1 rounded-full font-medium">
                  המנוי הנוכחי
                </div>
              )}
              <div className="text-center mb-4">
                <div className={`w-12 h-12 rounded-xl ${planConfig.bg} flex items-center justify-center mx-auto mb-3`}>
                  <PlanIcon className={`w-6 h-6 ${planConfig.color}`} />
                </div>
                <h4 className="font-bold text-carefd-navy text-lg">{plan.name}</h4>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-carefd-navy">₪{Math.round(price)}</span>
                  <span className="text-carefd-gray text-sm"> / חודש</span>
                </div>
                {billingCycle === "yearly" && (
                  <p className="text-xs text-carefd-gray mt-1">₪{plan.price_yearly} לשנה</p>
                )}
              </div>

              <div className="space-y-2 mb-6">
                {plan.features?.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-carefd-navy">
                    <Check className="w-4 h-4 text-carefd-teal flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => handleUpgrade(plan.plan_id)}
                disabled={isCurrentPlan || upgrading === plan.plan_id}
                variant={isCurrentPlan ? "outline" : "default"}
                className="w-full"
              >
                {upgrading === plan.plan_id ? (
                  <Loader2 className="w-4 h-4 animate-spin me-2" />
                ) : isCurrentPlan ? (
                  "המנוי הנוכחי"
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4 me-2" />
                    {currentTier === "free" ? "שדרג" : "החלף"}
                  </>
                )}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
