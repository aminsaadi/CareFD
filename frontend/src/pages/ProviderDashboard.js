import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { FaCalendar, FaComments, FaStar, FaMoneyBillWave, FaUsers, FaClipboardList } from 'react-icons/fa';
import { format } from 'date-fns';

const ProviderDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [provider, setProvider] = useState(null);
  const [stats, setStats] = useState({
    bookings: 0,
    pendingBookings: 0,
    requests: 0,
    services: 0,
    rating: 0,
    revenue: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProviderData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProviderData = async () => {
    try {
      setLoading(true);
      
      // Get provider profile
      const providersRes = await api.get('/providers');
      const providers = providersRes.data.providers || [];
      const myProvider = providers.find(p => p.user_id === user.user_id);
      
      if (!myProvider) {
        setLoading(false);
        return;
      }
      
      setProvider(myProvider);

      // Get bookings and stats
      const bookingsRes = await api.get(`/bookings?provider_id=${myProvider.provider_id}`);
      const bookings = bookingsRes.data.bookings || [];
      
      const servicesRes = await api.get('/services');
      const services = servicesRes.data.services || [];
      const myServices = services.filter(s => s.provider_id === myProvider.provider_id);

      setStats({
        bookings: bookings.length,
        pendingBookings: bookings.filter(b => b.status === 'pending').length,
        requests: 0,
        services: myServices.length,
        rating: myProvider.rating || 0,
        revenue: bookings.filter(b => b.status === 'completed').length * 100 // Mock calculation
      });

      setRecentBookings(bookings.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch provider data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/confirm`);
      alert('ההזמנה אושרה בהצלחה!');
      fetchProviderData();
    } catch (error) {
      alert('שגיאה באישור ההזמנה');
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

  if (!provider) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-carelink-teal-pale">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold text-carelink-navy mb-4">פרופיל ספק לא נמצא</h2>
          <p className="text-carelink-gray mb-6">נראה שעדיין לא השלמת את הגדרת הפרופיל שלך כספק</p>
          <Link
            to="/provider/setup"
            className="inline-block bg-carelink-teal text-white px-6 py-3 rounded-lg hover:bg-carelink-teal-medium transition"
          >
            השלם הגדרת פרופיל
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-carelink-teal-pale">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-carelink-navy font-heading">
            שלום, {provider.business_name || user?.name}!
          </h1>
          <p className="text-carelink-gray mt-2">דשבורד ספק - נהל את העסק שלך</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-carelink-teal-pale">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-carelink-gray text-sm mb-1">הזמנות כולל</p>
                <p className="text-3xl font-bold text-carelink-navy">{stats.bookings}</p>
              </div>
              <div className="bg-carelink-teal-pale p-3 rounded-lg">
                <FaCalendar className="text-2xl text-carelink-teal" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-carelink-gray text-sm mb-1">ממתינות לאישור</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingBookings}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <FaClipboardList className="text-2xl text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-carelink-navy">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-carelink-gray text-sm mb-1">השירותים שלי</p>
                <p className="text-3xl font-bold text-carelink-navy">{stats.services}</p>
              </div>
              <div className="bg-carelink-navy bg-opacity-10 p-3 rounded-lg">
                <FaUsers className="text-2xl text-carelink-navy" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-carelink-teal">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-carelink-gray text-sm mb-1">דירוג ממוצע</p>
                <p className="text-3xl font-bold text-carelink-teal">{stats.rating.toFixed(1)}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <FaStar className="text-2xl text-yellow-500" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-carelink-gray text-sm mb-1">הכנסות משוערות</p>
                <p className="text-3xl font-bold text-green-600">₪{stats.revenue}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <FaMoneyBillWave className="text-2xl text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-carelink-teal-light">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-carelink-gray text-sm mb-1">הודעות</p>
                <p className="text-3xl font-bold text-carelink-teal">0</p>
              </div>
              <div className="bg-carelink-teal-pale p-3 rounded-lg">
                <FaComments className="text-2xl text-carelink-teal" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            to={`/provider/edit/${provider.provider_id}`}
            className="bg-gradient-to-r from-carelink-teal to-carelink-teal-light text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition"
          >
            <h3 className="text-xl font-bold mb-2">ערוך פרופיל</h3>
            <p className="text-carelink-teal-pale">עדכן את הפרטים שלך</p>
          </Link>

          <Link
            to="/requests"
            className="bg-gradient-to-r from-carelink-navy to-carelink-slate text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition"
          >
            <h3 className="text-xl font-bold mb-2">בקשות פעילות</h3>
            <p className="text-carelink-teal-pale">הגש הצעות חדשות</p>
          </Link>

          <Link
            to="/chats"
            className="bg-gradient-to-r from-carelink-teal-light to-carelink-teal-pale text-carelink-navy p-6 rounded-xl shadow-lg hover:shadow-xl transition"
          >
            <h3 className="text-xl font-bold mb-2">הודעות</h3>
            <p className="text-carelink-slate">תקשר עם לקוחות</p>
          </Link>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-carelink-teal-pale">
          <h2 className="text-2xl font-bold mb-4 text-carelink-navy">הזמנות אחרונות</h2>
          {recentBookings.length === 0 ? (
            <p className="text-carelink-gray text-center py-8">אין הזמנות עדיין</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <div
                  key={booking.booking_id}
                  className="flex items-center justify-between p-4 bg-carelink-teal-pale rounded-lg"
                >
                  <div>
                    <p className="font-semibold text-carelink-navy">
                      הזמנה #{booking.booking_id.slice(-6)}
                    </p>
                    <p className="text-sm text-carelink-gray">
                      {format(new Date(booking.booking_date), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {booking.status}
                    </span>
                    {booking.status === 'pending' && (
                      <button
                        onClick={() => handleConfirmBooking(booking.booking_id)}
                        className="bg-carelink-teal text-white px-4 py-1 rounded hover:bg-carelink-teal-medium transition text-sm"
                      >
                        אשר
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;