"use client";

import {  useState, useEffect  } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import {
  FiUsers, FiBriefcase, FiCalendar, FiStar, FiTrendingUp,
  FiActivity, FiDollarSign, FiEye, FiArrowUp, FiArrowDown,
  FiShield, FiAlertCircle, FiCheckCircle
} from 'react-icons/fi';

export default function AdminOverview() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, bookingsData, reviewsData] = await Promise.all([api.get('/admin/stats'), api.get('/admin/bookings?limit=5'), api.get('/admin/reviews?status=pending')]);
      setStats(statsData);
      
      const activities: any[] = [];
      (bookingsData.bookings || []).slice(0, 3).forEach(b => {
        activities.push({
          id: b.booking_id,
          type: 'booking',
          message: `הזמנה ${b.status === 'pending' ? 'חדשה' : b.status === 'confirmed' ? 'אושרה' : b.status === 'completed' ? 'הושלמה' : 'בוטלה'} - ${b.client_name || b.user_name || 'לקוח'}`,
          time: b.created_at ? new Date(b.created_at).toLocaleDateString('he-IL') : ''
        });
      });
      (reviewsData.reviews || []).slice(0, 2).forEach(r => {
        activities.push({
          id: r.review_id,
          type: 'review',
          message: `ביקורת חדשה (${r.rating} כוכבים) ממתינה לאישור`,
          time: r.created_at ? new Date(r.created_at).toLocaleDateString('he-IL') : ''
        });
      });
      setRecentActivity(activities.length > 0 ? activities : [
        { id: 'empty', type: 'user', message: 'אין פעילות אחרונה', time: '' }
      ]);
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
      setError('שגיאה בטעינת נתוני המערכת');
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats ? [
    {
      label: 'משתמשים',
      value: stats.total_users,
      change: `+${stats.new_users_week || 0}`,
      changeType: 'positive',
      icon: FiUsers,
      color: 'from-blue-500 to-blue-600',
      bgLight: 'bg-blue-50',
      link: '/admin/users'
    },
    {
      label: 'ספקים',
      value: stats.total_providers,
      subtext: `${stats.verified_providers || 0} מאומתים`,
      icon: FiBriefcase,
      color: 'from-carefd-teal to-carefd-navy',
      bgLight: 'bg-carefd-teal-pale/30',
      link: '/admin/providers'
    },
    {
      label: 'הזמנות',
      value: stats.total_bookings,
      subtext: `${stats.pending_bookings || 0} ממתינות`,
      icon: FiCalendar,
      color: 'from-emerald-500 to-emerald-600',
      bgLight: 'bg-emerald-50',
      link: '/admin/bookings'
    },
    {
      label: 'ביקורות',
      value: stats.total_reviews,
      icon: FiStar,
      color: 'from-amber-500 to-amber-600',
      bgLight: 'bg-amber-50',
      link: '/admin/providers'
    },
  ] : [];

  const quickActions = [
    { label: 'אמת ספקים', icon: FiShield, path: '/admin/verification', color: 'bg-carefd-teal hover:bg-carefd-teal/90' },
    { label: 'נהל הזמנות', icon: FiCalendar, path: '/admin/bookings', color: 'bg-emerald-500 hover:bg-emerald-600' },
    { label: 'שלח הודעה', icon: FiActivity, path: '/admin/notifications', color: 'bg-carefd-navy hover:bg-carefd-navy/90' },
    { label: 'צפה בדוחות', icon: FiTrendingUp, path: '/admin/reports', color: 'bg-amber-500 hover:bg-amber-600' },
  ];

  if (loading) {
    return (
        <div className="flex items-center justify-center h-96">
          <div className="w-12 h-12 border-4 border-carefd-teal border-t-transparent rounded-full animate-spin"></div>
        </div>
      
    );
  }

  return (
    <>
    
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-carefd-navy">סקירה כללית</h1>
          <p className="text-carefd-slate mt-1">ברוך הבא לפאנל הניהול</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-4">
            <FiAlertCircle className="text-red-600 shrink-0" size={24} />
            <div className="flex-1">
              <p className="text-red-800 font-medium">{error}</p>
              <p className="text-red-600 text-sm">ייתכן שיש בעיה בחיבור לשרת</p>
            </div>
            <button
              onClick={fetchData}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-md"
            >
              נסה שוב
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <Link
              key={index}
              href={stat.link}
              className={`${stat.bgLight} rounded-xl p-6 border border-gray-100 hover:shadow-lg hover:border-carefd-teal/30 transition group`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-carefd-slate text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold text-carefd-navy mt-1">{stat.value}</p>
                  {stat.change && (
                    <p className={`text-sm mt-1 flex items-center gap-1 ${
                      stat.changeType === 'positive' ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      {stat.changeType === 'positive' ? <FiArrowUp size={14} /> : <FiArrowDown size={14} />}
                      {stat.change} השבוע
                    </p>
                  )}
                  {stat.subtext && (
                    <p className="text-carefd-gray text-sm mt-1">{stat.subtext}</p>
                  )}
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <stat.icon className="text-white" size={24} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-semibold text-carefd-navy mb-4">פעולות מהירות</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  href={action.path}
                  className={`${action.color} rounded-xl p-4 text-white text-center transition shadow-md`}
                >
                  <action.icon className="mx-auto mb-2" size={24} />
                  <span className="text-sm font-medium">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-semibold text-carefd-navy mb-4">פעילות אחרונה</h2>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === 'booking' ? 'bg-emerald-100 text-emerald-600' :
                    activity.type === 'provider' ? 'bg-carefd-teal-pale text-carefd-teal' :
                    activity.type === 'review' ? 'bg-amber-100 text-amber-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {activity.type === 'booking' && <FiCalendar size={18} />}
                    {activity.type === 'provider' && <FiBriefcase size={18} />}
                    {activity.type === 'review' && <FiStar size={18} />}
                    {activity.type === 'user' && <FiUsers size={18} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-carefd-navy text-sm">{activity.message}</p>
                    <p className="text-carefd-gray text-xs">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts */}
        {stats && stats.pending_bookings > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4">
            <FiAlertCircle className="text-amber-600" size={24} />
            <div className="flex-1">
              <p className="text-amber-800 font-medium">יש {stats.pending_bookings} הזמנות ממתינות לאישור</p>
              <p className="text-amber-600 text-sm">צפה בהזמנות כדי לאשר או לדחות</p>
            </div>
            <Link
              href="/admin/bookings?status=pending"
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-md"
            >
              צפה בהזמנות
            </Link>
          </div>
        )}

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <FiActivity className="text-carefd-teal" size={20} />
              <span className="text-carefd-slate">שירותים פעילים</span>
            </div>
            <p className="text-2xl font-bold text-carefd-navy">{stats?.total_services || 0}</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <FiEye className="text-emerald-500" size={20} />
              <span className="text-carefd-slate">צפיות היום</span>
            </div>
            <p className="text-2xl font-bold text-carefd-navy">{stats?.views_today || 0}</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <FiDollarSign className="text-amber-500" size={20} />
              <span className="text-carefd-slate">הכנסות החודש</span>
            </div>
            <p className="text-2xl font-bold text-carefd-navy">₪{stats?.revenue_month || 0}</p>
          </div>
        </div>
      </div>
    
    </>
  );
};


