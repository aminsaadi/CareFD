"use client";

import {  useState, useEffect  } from "react";
import api from "@/lib/api-client";
import { toast } from "sonner";
import {
  FaCrown, FaStar, FaCheck, FaTimes, FaEdit, FaSave, FaChartBar,
  FaUsers, FaBuilding, FaShieldAlt, FaMoneyBillWave
} from 'react-icons/fa';

export default function AdminSubscriptions() {
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans');
  const [editingPlan, setEditingPlan] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansData, subsData] = await Promise.all([api.get('/subscription-plans'), api.get('/admin/subscriptions')]);
      setPlans(plansData.plans || []);
      setSubscriptions(subsData.subscriptions || []);
      setStats(subsData.stats || {});
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (plan) => {
    setEditingPlan(plan.plan_id);
    setEditForm({
      name_he: plan.name_he,
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      max_services: plan.max_services,
      max_bookings_per_month: plan.max_bookings_per_month,
      max_clinics: plan.max_clinics || 0,
      max_team_members: plan.max_team_members || 0,
      has_promoted_profile: plan.has_promoted_profile || false,
      has_recommended_badge: plan.has_recommended_badge || false,
      has_team_management: plan.has_team_management || false,
      has_clinic_management: plan.has_clinic_management || false,
      has_priority_support: plan.has_priority_support || false,
      has_staff_support: plan.has_staff_support || false,
      features_list: (plan.features_list || []).join('\n')
    });
  };

  const savePlan = async (planId) => {
    try {
      const data = {
        ...editForm,
        price_monthly: parseFloat(editForm.price_monthly),
        price_yearly: parseFloat(editForm.price_yearly),
        max_services: parseInt(editForm.max_services),
        max_bookings_per_month: parseInt(editForm.max_bookings_per_month),
        max_clinics: parseInt(editForm.max_clinics),
        max_team_members: parseInt(editForm.max_team_members),
        features_list: editForm.features_list.split('\n').filter(f => f.trim())
      };
      await api.put(`/admin/subscription-plans/${planId}`, data);
      toast.success('המנוי עודכן בהצלחה');
      setEditingPlan(null);
      fetchData();
    } catch (error) {
      toast.error('שגיאה בעדכון');
    }
  };

  const tierIcons = { free: FaShieldAlt, pro: FaStar, gold: FaCrown };
  const tierColors = {
    free: 'from-gray-500 to-gray-600',
    pro: 'from-blue-500 to-blue-600',
    gold: 'from-yellow-500 to-amber-600'
  };

  if (loading) {
    return (
      
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      
    );
  }

  return (
    
    <div className="space-y-6" data-testid="admin-subscriptions">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">מנויים פעילים</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total_active || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">מנויי פרו</p>
          <p className="text-2xl font-bold text-blue-600">{stats.total_pro || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">מנויי זהב</p>
          <p className="text-2xl font-bold text-amber-600">{stats.total_gold || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">סה"כ מנויים</p>
          <p className="text-2xl font-bold text-teal-600">{subscriptions.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white p-2 rounded-xl shadow-sm border">
        <button
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'plans' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          <FaMoneyBillWave /> ניהול מנויים
        </button>
        <button
          onClick={() => setActiveTab('subscribers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'subscribers' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          <FaUsers /> מנויים פעילים
        </button>
      </div>

      {/* Plans Management */}
      {activeTab === 'plans' && (
        <div className="grid gap-6">
          {plans.map(plan => {
            const Icon = tierIcons[plan.tier] || FaShieldAlt;
            const isEditing = editingPlan === plan.plan_id;

            return (
              <div key={plan.plan_id} className="bg-white rounded-xl shadow-sm border overflow-hidden" data-testid={`plan-${plan.tier}`}>
                <div className={`bg-gradient-to-l ${tierColors[plan.tier] || 'from-gray-500 to-gray-600'} p-4 flex items-center justify-between`}>
                  <div className="flex items-center gap-3 text-white">
                    <Icon className="text-xl" />
                    <h3 className="text-lg font-bold">{plan.name_he}</h3>
                    <span className="text-sm opacity-80">({plan.tier})</span>
                  </div>
                  {!isEditing ? (
                    <button onClick={() => startEdit(plan)} className="bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-white/30 flex items-center gap-1">
                      <FaEdit /> ערוך
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => savePlan(plan.plan_id)} className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-600 flex items-center gap-1">
                        <FaSave /> שמור
                      </button>
                      <button onClick={() => setEditingPlan(null)} className="bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-white/30">
                        ביטול
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {isEditing ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">שם בעברית</label>
                        <input value={editForm.name_he} onChange={e => setEditForm({...editForm, name_he: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">מחיר חודשי (₪)</label>
                        <input type="number" value={editForm.price_monthly} onChange={e => setEditForm({...editForm, price_monthly: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">מחיר שנתי (₪)</label>
                        <input type="number" value={editForm.price_yearly} onChange={e => setEditForm({...editForm, price_yearly: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">מקסימום שירותים (-1=ללא הגבלה)</label>
                        <input type="number" value={editForm.max_services} onChange={e => setEditForm({...editForm, max_services: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">הזמנות בחודש (-1=ללא הגבלה)</label>
                        <input type="number" value={editForm.max_bookings_per_month} onChange={e => setEditForm({...editForm, max_bookings_per_month: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">מקסימום קליניקות</label>
                        <input type="number" value={editForm.max_clinics} onChange={e => setEditForm({...editForm, max_clinics: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">מקסימום חברי צוות</label>
                        <input type="number" value={editForm.max_team_members} onChange={e => setEditForm({...editForm, max_team_members: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                      </div>
                      <div className="col-span-2 md:col-span-4 grid grid-cols-3 gap-3">
                        {[
                          ['has_promoted_profile', 'פרופיל מקודם'],
                          ['has_recommended_badge', 'תווית מומלץ'],
                          ['has_team_management', 'ניהול צוות'],
                          ['has_clinic_management', 'ניהול קליניקות'],
                          ['has_priority_support', 'תמיכה בעדיפות'],
                          ['has_staff_support', 'לווי צוות']
                        ].map(([key, label]) => (
                          <label key={key} className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={editForm[key] || false} onChange={e => setEditForm({...editForm, [key]: e.target.checked})} className="w-4 h-4 text-teal-600 rounded" />
                            <span className="text-sm">{label}</span>
                          </label>
                        ))}
                      </div>
                      <div className="col-span-2 md:col-span-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">תכונות (שורה לכל תכונה)</label>
                        <textarea value={editForm.features_list} onChange={e => setEditForm({...editForm, features_list: e.target.value})} rows={4} className="w-full px-3 py-2 border rounded-lg" />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div>
                        <p className="text-sm text-gray-500">מחיר חודשי</p>
                        <p className="text-xl font-bold">{plan.price_monthly === 0 ? 'חינם' : `₪${plan.price_monthly}`}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">מחיר שנתי</p>
                        <p className="text-xl font-bold">{plan.price_yearly === 0 ? '-' : `₪${plan.price_yearly}`}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">שירותים</p>
                        <p className="text-xl font-bold">{plan.max_services === -1 ? 'ללא הגבלה' : plan.max_services}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">הזמנות / חודש</p>
                        <p className="text-xl font-bold">{plan.max_bookings_per_month === -1 ? 'ללא הגבלה' : plan.max_bookings_per_month}</p>
                      </div>
                      <div className="col-span-2 md:col-span-4">
                        <p className="text-sm text-gray-500 mb-2">תכונות</p>
                        <div className="flex flex-wrap gap-2">
                          {(plan.features_list || []).map((f, i) => (
                            <span key={i} className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full">{f}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Subscribers List */}
      {activeTab === 'subscribers' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">ספק</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">מנוי</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">סטטוס</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">מחזור</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">תאריך התחלה</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {subscriptions.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-gray-400">אין מנויים</td></tr>
              ) : subscriptions.map(sub => (
                <tr key={sub.subscription_id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900">{sub.user_name}</p>
                    <p className="text-xs text-gray-500">{sub.user_email}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      sub.tier === 'gold' ? 'bg-amber-100 text-amber-700' :
                      sub.tier === 'pro' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {sub.tier === 'gold' ? 'זהב' : sub.tier === 'pro' ? 'פרו' : 'חינם'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {sub.status === 'active' ? 'פעיל' : sub.status === 'cancelled' ? 'מבוטל' : sub.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">{sub.billing_cycle === 'yearly' ? 'שנתי' : 'חודשי'}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {sub.start_date ? new Date(sub.start_date).toLocaleDateString('he-IL') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    
  );
};


