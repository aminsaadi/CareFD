import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import {
  FiUsers, FiBriefcase, FiCalendar, FiStar, FiTrendingUp,
  FiActivity, FiDollarSign, FiEye, FiArrowUp, FiArrowDown,
  FiShield, FiAlertCircle, FiCheckCircle
} from 'react-icons/fi';

const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes.data);
      
      setRecentActivity([
        { id: 1, type: 'booking', message: 'הזמנה חדשה מ-יוסי כהן', time: '5 דקות' },
        { id: 2, type: 'provider', message: 'ספק חדש נרשם - ד"ר שרה לוי', time: '12 דקות' },
        { id: 3, type: 'review', message: 'ביקורת חדשה (5 כוכבים)', time: '30 דקות' },
        { id: 4, type: 'user', message: 'משתמש חדש נרשם', time: '1 שעה' },
      ]);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
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
      color: 'from-carelink-teal to-carelink-navy',
      bgLight: 'bg-carelink-teal-pale/30',
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
    { label: 'אמת ספקים', icon: FiShield, path: '/admin/verification', color: 'bg-carelink-teal hover:bg-carelink-teal/90' },
    { label: 'נהל הזמנות', icon: FiCalendar, path: '/admin/bookings', color: 'bg-emerald-500 hover:bg-emerald-600' },
    { label: 'שלח הודעה', icon: FiActivity, path: '/admin/notifications', color: 'bg-carelink-navy hover:bg-carelink-navy/90' },
    { label: 'צפה בדוחות', icon: FiTrendingUp, path: '/admin/reports', color: 'bg-amber-500 hover:bg-amber-600' },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="w-12 h-12 border-4 border-carelink-teal border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-carelink-navy">סקירה כללית</h1>
          <p className="text-carelink-slate mt-1">ברוך הבא לפאנל הניהול</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <Link
              key={index}
              to={stat.link}
              className={`${stat.bgLight} rounded-xl p-6 border border-gray-100 hover:shadow-lg hover:border-carelink-teal/30 transition group`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-carelink-slate text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold text-carelink-navy mt-1">{stat.value}</p>
                  {stat.change && (
                    <p className={`text-sm mt-1 flex items-center gap-1 ${
                      stat.changeType === 'positive' ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      {stat.changeType === 'positive' ? <FiArrowUp size={14} /> : <FiArrowDown size={14} />}
                      {stat.change} השבוע
                    </p>
                  )}
                  {stat.subtext && (
                    <p className="text-carelink-gray text-sm mt-1">{stat.subtext}</p>
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
            <h2 className="text-lg font-semibold text-carelink-navy mb-4">פעולות מהירות</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.path}
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
            <h2 className="text-lg font-semibold text-carelink-navy mb-4">פעילות אחרונה</h2>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === 'booking' ? 'bg-emerald-100 text-emerald-600' :
                    activity.type === 'provider' ? 'bg-carelink-teal-pale text-carelink-teal' :
                    activity.type === 'review' ? 'bg-amber-100 text-amber-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {activity.type === 'booking' && <FiCalendar size={18} />}
                    {activity.type === 'provider' && <FiBriefcase size={18} />}
                    {activity.type === 'review' && <FiStar size={18} />}
                    {activity.type === 'user' && <FiUsers size={18} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-carelink-navy text-sm">{activity.message}</p>
                    <p className="text-carelink-gray text-xs">{activity.time}</p>
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
              to="/admin/bookings?status=pending"
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
              <FiActivity className="text-carelink-teal" size={20} />
              <span className="text-carelink-slate">שירותים פעילים</span>
            </div>
            <p className="text-2xl font-bold text-carelink-navy">{stats?.total_services || 0}</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <FiEye className="text-emerald-500" size={20} />
              <span className="text-carelink-slate">צפיות היום</span>
            </div>
            <p className="text-2xl font-bold text-carelink-navy">{stats?.views_today || 0}</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <FiDollarSign className="text-amber-500" size={20} />
              <span className="text-carelink-slate">הכנסות החודש</span>
            </div>
            <p className="text-2xl font-bold text-carelink-navy">₪{stats?.revenue_month || 0}</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOverview;
