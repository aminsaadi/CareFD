import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import {
  FiCreditCard, FiUsers, FiTrendingUp, FiDollarSign,
  FiCheck, FiX, FiEdit2, FiEye, FiFilter, FiSearch,
  FiStar, FiAward, FiPackage
} from 'react-icons/fi';

const AdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('subscriptions');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [showEditModal, setShowEditModal] = useState(null);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    fetchData();
  }, [selectedStatus, selectedTier]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch subscriptions
      const params = new URLSearchParams();
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedTier) params.append('tier', selectedTier);
      
      const [subsRes, paymentsRes, plansRes] = await Promise.all([
        api.get(`/admin/subscriptions?${params.toString()}`),
        api.get('/admin/payments'),
        api.get('/subscription-plans')
      ]);
      
      setSubscriptions(subsRes.data.subscriptions || []);
      setStats(subsRes.data.stats || {});
      setPayments(paymentsRes.data.payments || []);
      setTotalRevenue(paymentsRes.data.total_revenue || 0);
      setPlans(plansRes.data.plans || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubscription = async (subscriptionId, data) => {
    try {
      await api.put(`/admin/subscriptions/${subscriptionId}`, data);
      setShowEditModal(null);
      fetchData();
    } catch (error) {
      console.error('Failed to update subscription:', error);
    }
  };

  const getTierBadge = (tier) => {
    switch (tier) {
      case 'premium':
        return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
      case 'pro':
        return 'bg-gradient-to-r from-carelink-teal to-carelink-navy text-white';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'premium':
        return <FiAward className="text-amber-500" />;
      case 'pro':
        return <FiStar className="text-carelink-teal" />;
      default:
        return <FiPackage className="text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-600';
      case 'cancelled':
        return 'bg-red-100 text-red-600';
      case 'expired':
        return 'bg-gray-100 text-gray-600';
      case 'pending':
        return 'bg-amber-100 text-amber-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'פעיל';
      case 'cancelled': return 'בוטל';
      case 'expired': return 'פג תוקף';
      case 'pending': return 'ממתין';
      default: return status;
    }
  };

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-600';
      case 'failed':
        return 'bg-red-100 text-red-600';
      case 'pending':
        return 'bg-amber-100 text-amber-600';
      case 'refunded':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-carelink-navy">ניהול מנויים ותשלומים</h1>
          <p className="text-carelink-slate mt-1">ניהול חבילות מנוי והיסטוריית תשלומים</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 text-carelink-slate text-sm mb-1">
              <FiUsers size={14} />
              מנויים פעילים
            </div>
            <p className="text-2xl font-bold text-carelink-navy">{stats.total_active || 0}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 text-carelink-slate text-sm mb-1">
              <FiStar size={14} className="text-carelink-teal" />
              מנויי פרו
            </div>
            <p className="text-2xl font-bold text-carelink-teal">{stats.total_pro || 0}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 text-carelink-slate text-sm mb-1">
              <FiAward size={14} className="text-amber-500" />
              מנויי פרימיום
            </div>
            <p className="text-2xl font-bold text-amber-500">{stats.total_premium || 0}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 text-carelink-slate text-sm mb-1">
              <FiDollarSign size={14} className="text-emerald-500" />
              סה"כ הכנסות
            </div>
            <p className="text-2xl font-bold text-emerald-500">₪{totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`px-4 py-2 font-medium transition border-b-2 -mb-px ${
              activeTab === 'subscriptions'
                ? 'text-carelink-teal border-carelink-teal'
                : 'text-carelink-slate border-transparent hover:text-carelink-navy'
            }`}
          >
            מנויים
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 font-medium transition border-b-2 -mb-px ${
              activeTab === 'payments'
                ? 'text-carelink-teal border-carelink-teal'
                : 'text-carelink-slate border-transparent hover:text-carelink-navy'
            }`}
          >
            תשלומים
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 font-medium transition border-b-2 -mb-px ${
              activeTab === 'plans'
                ? 'text-carelink-teal border-carelink-teal'
                : 'text-carelink-slate border-transparent hover:text-carelink-navy'
            }`}
          >
            חבילות
          </button>
        </div>

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex gap-4">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-carelink-navy focus:border-carelink-teal outline-none"
                >
                  <option value="">כל הסטטוסים</option>
                  <option value="active">פעיל</option>
                  <option value="cancelled">בוטל</option>
                  <option value="pending">ממתין</option>
                  <option value="expired">פג תוקף</option>
                </select>
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-carelink-navy focus:border-carelink-teal outline-none"
                >
                  <option value="">כל החבילות</option>
                  <option value="free">חינם</option>
                  <option value="pro">פרו</option>
                  <option value="premium">פרימיום</option>
                </select>
              </div>
            </div>

            {/* Subscriptions Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-right py-4 px-4 text-carelink-slate font-medium text-sm">משתמש</th>
                      <th className="text-right py-4 px-4 text-carelink-slate font-medium text-sm">חבילה</th>
                      <th className="text-right py-4 px-4 text-carelink-slate font-medium text-sm">סטטוס</th>
                      <th className="text-right py-4 px-4 text-carelink-slate font-medium text-sm">מחזור חיוב</th>
                      <th className="text-right py-4 px-4 text-carelink-slate font-medium text-sm">תאריך התחלה</th>
                      <th className="text-right py-4 px-4 text-carelink-slate font-medium text-sm">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center">
                          <div className="w-8 h-8 border-4 border-carelink-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
                        </td>
                      </tr>
                    ) : subscriptions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-carelink-gray">
                          לא נמצאו מנויים
                        </td>
                      </tr>
                    ) : (
                      subscriptions.map((sub) => (
                        <tr key={sub.subscription_id} className="border-b border-gray-50 hover:bg-carelink-teal-pale/10 transition">
                          <td className="py-4 px-4">
                            <div>
                              <p className="text-carelink-navy font-medium">{sub.user_name}</p>
                              <p className="text-carelink-gray text-sm">{sub.user_email}</p>
                              <p className="text-carelink-teal text-xs font-mono">{sub.user_number}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getTierBadge(sub.tier)}`}>
                              {getTierIcon(sub.tier)}
                              {sub.tier === 'premium' ? 'פרימיום' : sub.tier === 'pro' ? 'פרו' : 'חינם'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(sub.status)}`}>
                              {getStatusLabel(sub.status)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-carelink-slate text-sm">
                            {sub.billing_cycle === 'yearly' ? 'שנתי' : 'חודשי'}
                          </td>
                          <td className="py-4 px-4 text-carelink-slate text-sm">
                            {sub.start_date ? new Date(sub.start_date).toLocaleDateString('he-IL') : '-'}
                          </td>
                          <td className="py-4 px-4">
                            <button
                              onClick={() => setShowEditModal(sub)}
                              className="p-2 text-carelink-slate hover:text-carelink-navy hover:bg-gray-100 rounded-lg transition"
                            >
                              <FiEdit2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-right py-4 px-4 text-carelink-slate font-medium text-sm">מזהה</th>
                    <th className="text-right py-4 px-4 text-carelink-slate font-medium text-sm">משתמש</th>
                    <th className="text-right py-4 px-4 text-carelink-slate font-medium text-sm">סכום</th>
                    <th className="text-right py-4 px-4 text-carelink-slate font-medium text-sm">סטטוס</th>
                    <th className="text-right py-4 px-4 text-carelink-slate font-medium text-sm">תיאור</th>
                    <th className="text-right py-4 px-4 text-carelink-slate font-medium text-sm">תאריך</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <div className="w-8 h-8 border-4 border-carelink-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
                      </td>
                    </tr>
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-carelink-gray">
                        לא נמצאו תשלומים
                      </td>
                    </tr>
                  ) : (
                    payments.map((payment) => (
                      <tr key={payment.payment_id} className="border-b border-gray-50 hover:bg-carelink-teal-pale/10 transition">
                        <td className="py-4 px-4 text-carelink-teal font-mono text-sm">
                          {payment.payment_id.slice(0, 12)}...
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-carelink-navy">{payment.user_name}</p>
                          <p className="text-carelink-gray text-sm">{payment.user_email}</p>
                        </td>
                        <td className="py-4 px-4 text-emerald-600 font-bold">
                          ₪{payment.amount}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${getPaymentStatusBadge(payment.status)}`}>
                            {payment.status === 'completed' ? 'הושלם' : 
                             payment.status === 'pending' ? 'ממתין' :
                             payment.status === 'failed' ? 'נכשל' :
                             payment.status === 'refunded' ? 'הוחזר' : payment.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-carelink-slate text-sm">
                          {payment.description}
                        </td>
                        <td className="py-4 px-4 text-carelink-slate text-sm">
                          {new Date(payment.created_at).toLocaleDateString('he-IL')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div 
                key={plan.plan_id}
                className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
                  plan.tier === 'premium' ? 'border-amber-300 ring-2 ring-amber-100' :
                  plan.tier === 'pro' ? 'border-carelink-teal' : 'border-gray-200'
                }`}
              >
                {plan.tier === 'premium' && (
                  <div className="bg-gradient-to-r from-amber-400 to-amber-600 text-white text-center py-1 text-sm font-medium">
                    הכי פופולרי
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    {getTierIcon(plan.tier)}
                    <h3 className="text-xl font-bold text-carelink-navy">{plan.name_he}</h3>
                  </div>
                  
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-carelink-navy">₪{plan.price_monthly}</span>
                    <span className="text-carelink-slate">/חודש</span>
                  </div>
                  
                  {plan.price_yearly > 0 && (
                    <p className="text-sm text-carelink-gray mb-4">
                      או ₪{plan.price_yearly}/שנה (חיסכון של {Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100)}%)
                    </p>
                  )}
                  
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-carelink-slate">
                        <FiCheck className="text-emerald-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <div className="pt-4 border-t border-gray-100 space-y-2 text-sm text-carelink-gray">
                    <p>שירותים: {plan.max_services === -1 ? 'ללא הגבלה' : plan.max_services}</p>
                    <p>הזמנות: {plan.max_bookings_per_month === -1 ? 'ללא הגבלה' : `${plan.max_bookings_per_month}/חודש`}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Subscription Modal */}
      {showEditModal && (
        <EditSubscriptionModal
          subscription={showEditModal}
          onClose={() => setShowEditModal(null)}
          onSave={handleUpdateSubscription}
        />
      )}
    </AdminLayout>
  );
};

// Edit Subscription Modal
const EditSubscriptionModal = ({ subscription, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    status: subscription.status,
    tier: subscription.tier
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(subscription.subscription_id, formData);
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 border border-gray-200 shadow-xl">
        <h3 className="text-lg font-bold text-carelink-navy mb-4">עריכת מנוי</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-carelink-navy mb-1">סטטוס</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-carelink-teal outline-none"
            >
              <option value="active">פעיל</option>
              <option value="cancelled">בוטל</option>
              <option value="pending">ממתין</option>
              <option value="expired">פג תוקף</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-carelink-navy mb-1">חבילה</label>
            <select
              value={formData.tier}
              onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-carelink-teal outline-none"
            >
              <option value="free">חינם</option>
              <option value="pro">פרו</option>
              <option value="premium">פרימיום</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-carelink-navy rounded-lg hover:bg-gray-200 transition"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-carelink-teal text-white rounded-lg hover:bg-carelink-teal/90 transition"
            >
              שמור
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSubscriptions;
