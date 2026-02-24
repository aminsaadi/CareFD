import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'sonner';
import {
  FaCrown, FaStar, FaShieldAlt, FaCheck, FaTimes, FaArrowUp,
  FaBuilding, FaUsers, FaHeadset, FaTag, FaRocket, FaCalendarAlt
} from 'react-icons/fa';

const ProviderSubscription = ({ provider, onRefresh }) => {
  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, subRes] = await Promise.all([
        api.get('/subscription-plans'),
        api.get('/subscriptions/my')
      ]);
      setPlans(plansRes.data.plans || []);
      setCurrentSub(subRes.data.subscription);
      setCurrentPlan(subRes.data.plan);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId, useTrial = false) => {
    try {
      setUpgrading(true);
      const res = await api.post('/subscriptions/upgrade', {
        plan_id: planId,
        billing_cycle: billingCycle,
        use_trial: useTrial
      });
      toast.success(res.data.message || 'המנוי שודרג בהצלחה!');
      fetchData();
      onRefresh?.();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'שגיאה בשדרוג המנוי');
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('האם אתה בטוח שברצונך לבטל את המנוי? תחזור למנוי חינם.')) return;
    try {
      await api.post('/subscriptions/cancel');
      toast.success('המנוי בוטל. חזרת למנוי חינם.');
      fetchData();
      onRefresh?.();
    } catch (error) {
      toast.error('שגיאה בביטול');
    }
  };

  const tierIcons = { free: FaShieldAlt, pro: FaStar, gold: FaCrown };
  const tierColors = {
    free: { bg: 'bg-gray-50', border: 'border-gray-200', gradient: 'from-gray-500 to-gray-600', badge: 'bg-gray-100 text-gray-700' },
    pro: { bg: 'bg-blue-50', border: 'border-blue-200', gradient: 'from-blue-500 to-blue-600', badge: 'bg-blue-100 text-blue-700' },
    gold: { bg: 'bg-amber-50', border: 'border-amber-200', gradient: 'from-yellow-500 to-amber-600', badge: 'bg-amber-100 text-amber-700' }
  };

  const currentTier = currentSub?.tier || 'free';
  const tierOrder = { free: 0, pro: 1, gold: 2 };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="provider-subscription">
      {/* Current Plan Banner */}
      <div className={`rounded-2xl p-6 border-2 ${tierColors[currentTier]?.border} ${tierColors[currentTier]?.bg}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tierColors[currentTier]?.gradient} flex items-center justify-center`}>
              {React.createElement(tierIcons[currentTier] || FaShieldAlt, { className: 'text-white text-2xl' })}
            </div>
            <div>
              <p className="text-sm text-gray-500">המנוי הנוכחי שלך</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {currentPlan?.name_he || 'חינם'}
              </h3>
              {currentSub?.billing_cycle && currentTier !== 'free' && (
                <p className="text-sm text-gray-500">
                  {currentSub.billing_cycle === 'yearly' ? 'מנוי שנתי' : 'מנוי חודשי'}
                </p>
              )}
            </div>
          </div>
          {currentTier !== 'free' && (
            <button
              onClick={handleCancel}
              className="text-sm text-red-500 hover:text-red-700 underline"
              data-testid="cancel-subscription-btn"
            >
              ביטול מנוי
            </button>
          )}
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 bg-white rounded-xl p-4 shadow-sm border">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
            billingCycle === 'monthly' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          חודשי
        </button>
        <button
          onClick={() => setBillingCycle('yearly')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
            billingCycle === 'yearly' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          שנתי
          <span className={`text-xs px-2 py-0.5 rounded-full ${billingCycle === 'yearly' ? 'bg-green-400 text-green-900' : 'bg-green-100 text-green-700'}`}>חיסכון</span>
        </button>
      </div>

      {/* Plans Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map(plan => {
          const Icon = tierIcons[plan.tier] || FaShieldAlt;
          const colors = tierColors[plan.tier] || tierColors.free;
          const isCurrent = plan.tier === currentTier;
          const isUpgrade = tierOrder[plan.tier] > tierOrder[currentTier];
          const isDowngrade = tierOrder[plan.tier] < tierOrder[currentTier];
          const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
          const monthlyEquivalent = billingCycle === 'yearly' && plan.price_yearly > 0
            ? Math.round(plan.price_yearly / 12)
            : null;

          return (
            <div
              key={plan.plan_id}
              className={`rounded-2xl overflow-hidden border-2 transition-all ${
                isCurrent ? `${colors.border} shadow-lg scale-[1.02]` : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
              data-testid={`plan-card-${plan.tier}`}
            >
              {/* Header */}
              <div className={`bg-gradient-to-l ${colors.gradient} p-5 text-white text-center relative`}>
                {plan.tier === 'pro' && (
                  <span className="absolute top-2 left-2 bg-white/20 text-xs px-2 py-1 rounded-full">הכי פופולרי</span>
                )}
                <Icon className="text-3xl mx-auto mb-2" />
                <h3 className="text-xl font-bold">{plan.name_he}</h3>
                {isCurrent && <span className="text-xs bg-white/20 px-3 py-1 rounded-full mt-1 inline-block">המנוי שלך</span>}
              </div>

              {/* Price */}
              <div className="p-6 text-center border-b">
                {plan.price_monthly === 0 ? (
                  <p className="text-3xl font-bold text-gray-900">חינם</p>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-gray-900">
                      ₪{price}
                      <span className="text-base font-normal text-gray-500">
                        /{billingCycle === 'yearly' ? 'שנה' : 'חודש'}
                      </span>
                    </p>
                    {monthlyEquivalent && (
                      <p className="text-sm text-green-600 mt-1">₪{monthlyEquivalent} לחודש</p>
                    )}
                  </>
                )}
              </div>

              {/* Features */}
              <div className="p-6 space-y-3">
                {(plan.features_list || []).map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <FaCheck className="text-teal-500 shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
                
                {/* Limits */}
                <div className="pt-3 border-t mt-3 space-y-2 text-xs text-gray-500">
                  <p>שירותים: {plan.max_services === -1 ? 'ללא הגבלה' : plan.max_services}</p>
                  <p>הזמנות/חודש: {plan.max_bookings_per_month === -1 ? 'ללא הגבלה' : plan.max_bookings_per_month}</p>
                  {plan.max_clinics > 0 && <p>קליניקות: {plan.max_clinics === -1 ? 'ללא הגבלה' : plan.max_clinics}</p>}
                  {plan.has_team_management && <p>חברי צוות: {plan.max_team_members === -1 ? 'ללא הגבלה' : plan.max_team_members}</p>}
                </div>
              </div>

              {/* Action */}
              <div className="p-4 border-t">
                {isCurrent ? (
                  <div className="text-center py-2 text-sm text-gray-500 font-medium">
                    המנוי הנוכחי שלך
                  </div>
                ) : isUpgrade ? (
                  <button
                    onClick={() => handleUpgrade(plan.plan_id)}
                    disabled={upgrading}
                    className="w-full py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    data-testid={`upgrade-to-${plan.tier}`}
                  >
                    {upgrading ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <FaArrowUp />
                        שדרג ל{plan.name_he}
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.plan_id)}
                    className="w-full py-3 border border-gray-300 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition text-sm"
                  >
                    שנמך ל{plan.name_he}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Free tier upgrade banner */}
      {currentTier === 'free' && (
        <div className="bg-gradient-to-l from-blue-500 to-blue-600 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4" data-testid="upgrade-banner">
          <div className="flex items-center gap-4">
            <FaRocket className="text-3xl" />
            <div>
              <h3 className="text-lg font-bold">שדרג את הפרופיל שלך לפרו!</h3>
              <p className="text-blue-100 text-sm">קבל פרופיל מקודם, שירותים ללא הגבלה ותווית מומלץ</p>
            </div>
          </div>
          <button
            onClick={() => handleUpgrade('plan_pro')}
            className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition whitespace-nowrap"
            data-testid="quick-upgrade-pro"
          >
            שדרג עכשיו - ₪59/חודש
          </button>
        </div>
      )}
    </div>
  );
};

export default ProviderSubscription;
