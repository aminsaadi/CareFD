import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { FaCalendar, FaComments, FaHeart, FaStar, FaClipboardList } from 'react-icons/fa';

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    bookings: 0,
    requests: 0,
    chats: 0,
    favorites: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'provider') {
      // Redirect providers to their own dashboard
      window.location.href = '/provider/dashboard';
    } else {
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, requestsRes, chatsRes] = await Promise.all([
        api.get('/bookings'),
        api.get('/requests'),
        api.get('/chat/rooms')
      ]);

      setStats({
        bookings: bookingsRes.data.bookings?.length || 0,
        requests: requestsRes.data.requests?.length || 0,
        chats: chatsRes.data.rooms?.length || 0,
        favorites: 0
      });

      setRecentBookings(bookingsRes.data.bookings?.slice(0, 5) || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
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
    <div className="min-h-screen bg-gradient-to-b from-white to-carelink-teal-pale">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8" data-testid="dashboard-header">
          <h1 className="text-3xl font-bold text-carelink-navy font-heading">
            {t('welcome')}, {user?.name}!
          </h1>
          <p className="text-carelink-gray mt-2">
            לוח הבקרה האישי שלך
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-carelink-teal-pale hover:shadow-xl transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-carelink-gray text-sm mb-1">ההזמנות שלי</p>
                <p className="text-3xl font-bold text-carelink-navy">{stats.bookings}</p>
              </div>
              <div className="bg-carelink-teal-pale p-3 rounded-lg">
                <FaCalendar className="text-2xl text-carelink-teal" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-carelink-teal-pale hover:shadow-xl transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-carelink-gray text-sm mb-1">הבקשות שלי</p>
                <p className="text-3xl font-bold text-carelink-navy">{stats.requests}</p>
              </div>
              <div className="bg-carelink-navy bg-opacity-10 p-3 rounded-lg">
                <FaClipboardList className="text-2xl text-carelink-navy" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-carelink-teal-pale hover:shadow-xl transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-carelink-gray text-sm mb-1">שיחות פעילות</p>
                <p className="text-3xl font-bold text-carelink-navy">{stats.chats}</p>
              </div>
              <div className="bg-carelink-teal-light bg-opacity-30 p-3 rounded-lg">
                <FaComments className="text-2xl text-carelink-teal" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-carelink-teal-pale hover:shadow-xl transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-carelink-gray text-sm mb-1">מועדפים</p>
                <p className="text-3xl font-bold text-carelink-navy">{stats.favorites}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <FaHeart className="text-2xl text-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            to="/providers"
            className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition border-2 border-carelink-teal group"
            data-testid="dashboard-providers-card"
          >
            <div className="text-carelink-teal text-4xl mb-3">🏥</div>
            <h3 className="text-xl font-semibold mb-2 text-carelink-navy group-hover:text-carelink-teal transition">{t('providers')}</h3>
            <p className="text-carelink-gray">חפש ספקי שירותים</p>
          </Link>

          <Link
            to="/services"
            className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition border-2 border-carelink-teal-pale group"
            data-testid="dashboard-services-card"
          >
            <div className="text-carelink-navy text-4xl mb-3">💼</div>
            <h3 className="text-xl font-semibold mb-2 text-carelink-navy group-hover:text-carelink-teal transition">{t('services')}</h3>
            <p className="text-carelink-gray">עיין בשירותים זמינים</p>
          </Link>

          <Link
            to="/requests"
            className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition border-2 border-carelink-navy group"
            data-testid="dashboard-requests-card"
          >
            <div className="text-carelink-teal text-4xl mb-3">📝</div>
            <h3 className="text-xl font-semibold mb-2 text-carelink-navy group-hover:text-carelink-teal transition">{t('requests')}</h3>
            <p className="text-carelink-gray">פרסם או צפה בבקשות</p>
          </Link>
        </div>

        {/* Recent Bookings */}
        {recentBookings.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-carelink-teal-pale">
            <h2 className="text-2xl font-bold mb-4 text-carelink-navy">הזמנות אחרונות</h2>
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <div
                  key={booking.booking_id}
                  className="flex items-center justify-between p-4 bg-carelink-teal-pale rounded-lg"
                >
                  <div>
                    <p className="font-semibold text-carelink-navy">הזמנה #{booking.booking_id.slice(-6)}</p>
                    <p className="text-sm text-carelink-gray">{booking.status}</p>
                  </div>
                  <Link
                    to="/bookings"
                    className="text-carelink-teal hover:text-carelink-teal-medium font-medium"
                  >
                    צפה →
                  </Link>
                </div>
              ))}
            </div>
            <Link
              to="/bookings"
              className="block text-center mt-4 text-carelink-teal hover:text-carelink-teal-medium font-medium"
            >
              צפה בכל ההזמנות
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
