import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import { FaUsers, FaUserMd, FaBriefcase, FaClipboardList, FaComments, FaStar, FaChartLine } from 'react-icons/fa';
import { format } from 'date-fns';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProviders: 0,
    totalServices: 0,
    totalRequests: 0,
    totalBookings: 0,
    totalReviews: 0,
    avgRating: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') {
      window.location.href = '/dashboard';
      return;
    }
    fetchAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data for statistics
      const [usersRes, providersRes, servicesRes, requestsRes, bookingsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/providers'),
        api.get('/services'),
        api.get('/requests?status=open'),
        api.get('/admin/bookings')
      ]).catch(() => [
        { data: { users: [] } },
        { data: { providers: [] } },
        { data: { services: [] } },
        { data: { requests: [] } },
        { data: { bookings: [] } }
      ]);

      const providers = providersRes.data.providers || [];
      const avgRating = providers.length > 0 
        ? providers.reduce((acc, p) => acc + (p.rating || 0), 0) / providers.length 
        : 0;

      setStats({
        totalUsers: usersRes.data?.users?.length || 0,
        totalProviders: providers.length,
        totalServices: servicesRes.data?.services?.length || 0,
        totalRequests: requestsRes.data?.requests?.length || 0,
        totalBookings: bookingsRes.data?.bookings?.length || 0,
        totalReviews: providers.reduce((acc, p) => acc + (p.total_reviews || 0), 0),
        avgRating: avgRating
      });

      // Mock recent activity
      setRecentActivity([
        { type: 'user', message: 'משתמש חדש נרשם', time: new Date() },
        { type: 'provider', message: 'ספק חדש הצטרף', time: new Date() },
        { type: 'booking', message: 'הזמנה חדשה נוצרה', time: new Date() }
      ]);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-12">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-carelink-teal-pale flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-carelink-navy font-heading">
            פאנל ניהול - Admin
          </h1>
          <p className="text-carelink-gray mt-2">ניהול כללי של הפלטפורמה</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-carelink-teal">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-carelink-gray text-sm mb-1">משתמשים</p>
                <p className="text-3xl font-bold text-carelink-navy">{stats.totalUsers}</p>
              </div>
              <div className="bg-carelink-teal-pale p-3 rounded-lg">
                <FaUsers className="text-2xl text-carelink-teal" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-carelink-navy">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-carelink-gray text-sm mb-1">ספקים</p>
                <p className="text-3xl font-bold text-carelink-navy">{stats.totalProviders}</p>
              </div>
              <div className="bg-carelink-navy bg-opacity-10 p-3 rounded-lg">
                <FaUserMd className="text-2xl text-carelink-navy" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-carelink-teal-pale">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-carelink-gray text-sm mb-1">שירותים</p>
                <p className="text-3xl font-bold text-carelink-navy">{stats.totalServices}</p>
              </div>
              <div className="bg-carelink-teal-light bg-opacity-30 p-3 rounded-lg">
                <FaBriefcase className="text-2xl text-carelink-teal" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-carelink-gray text-sm mb-1">הזמנות</p>
                <p className="text-3xl font-bold text-carelink-navy">{stats.totalBookings}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <FaClipboardList className="text-2xl text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Second Row Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-carelink-gray text-sm mb-1">בקשות פעילות</p>
                <p className="text-3xl font-bold text-carelink-navy">{stats.totalRequests}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <FaComments className="text-2xl text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-carelink-teal">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-carelink-gray text-sm mb-1">ביקורות</p>
                <p className="text-3xl font-bold text-carelink-navy">{stats.totalReviews}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <FaStar className="text-2xl text-yellow-500" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-carelink-navy">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-carelink-gray text-sm mb-1">דירוג ממוצע</p>
                <p className="text-3xl font-bold text-carelink-teal">{stats.avgRating.toFixed(1)}</p>
              </div>
              <div className="bg-carelink-teal-pale p-3 rounded-lg">
                <FaChartLine className="text-2xl text-carelink-teal" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <button className="bg-gradient-to-r from-carelink-teal to-carelink-teal-light text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
            <h3 className="text-xl font-bold mb-2">ניהול משתמשים</h3>
            <p className="text-carelink-teal-pale">צפה ונהל משתמשים</p>
          </button>

          <button className="bg-gradient-to-r from-carelink-navy to-carelink-slate text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
            <h3 className="text-xl font-bold mb-2">אישור ספקים</h3>
            <p className="text-carelink-teal-pale">אשר ספקים חדשים</p>
          </button>

          <button className="bg-gradient-to-r from-carelink-teal-light to-carelink-teal-pale text-carelink-navy p-6 rounded-xl shadow-lg hover:shadow-xl transition">
            <h3 className="text-xl font-bold mb-2">דוחות</h3>
            <p className="text-carelink-slate">צפה וייצא דוחות</p>
          </button>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-carelink-teal-pale">
          <h2 className="text-2xl font-bold mb-4 text-carelink-navy">פעילות אחרונה</h2>
          <div className="space-y-3">
            {recentActivity.map((activity, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-carelink-teal-pale rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-carelink-teal text-white p-2 rounded-full">
                    {activity.type === 'user' && <FaUsers />}
                    {activity.type === 'provider' && <FaUserMd />}
                    {activity.type === 'booking' && <FaClipboardList />}
                  </div>
                  <span className="text-carelink-navy">{activity.message}</span>
                </div>
                <span className="text-sm text-carelink-gray">
                  {format(activity.time, 'HH:mm')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Analytics Section */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6 border-2 border-carelink-navy">
          <h2 className="text-2xl font-bold mb-4 text-carelink-navy flex items-center gap-2">
            <FaChartLine className="text-carelink-teal" />
            אנליטיקה מתקדמת
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-carelink-teal-pale rounded-lg">
              <h3 className="font-bold text-carelink-navy mb-2">הזמנות לפי חודש</h3>
              <div className="h-32 flex items-end justify-around gap-2">
                {[60, 80, 70, 90, 75].map((height, idx) => (
                  <div
                    key={idx}
                    className="bg-carelink-teal rounded-t flex-1"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="p-4 bg-carelink-navy bg-opacity-5 rounded-lg">
              <h3 className="font-bold text-carelink-navy mb-2">התפלגות ספקים</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-carelink-slate">עצמאיים</span>
                  <span className="font-bold text-carelink-navy">45%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-carelink-slate">מרפאות</span>
                  <span className="font-bold text-carelink-navy">35%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-carelink-slate">חברות</span>
                  <span className="font-bold text-carelink-navy">20%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Export Reports */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6 border-2 border-carelink-teal-pale">
          <h2 className="text-2xl font-bold mb-4 text-carelink-navy">ייצוא דוחות</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <button className="bg-carelink-teal text-white px-6 py-3 rounded-lg hover:bg-carelink-teal-medium transition font-medium">
              ייצא דו"ח משתמשים
            </button>
            <button className="bg-carelink-navy text-white px-6 py-3 rounded-lg hover:bg-carelink-slate transition font-medium">
              ייצא דו"ח ספקים
            </button>
            <button className="bg-carelink-teal-light text-carelink-navy px-6 py-3 rounded-lg hover:bg-carelink-teal transition font-medium">
              ייצא דו"ח הזמנות
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminDashboard;