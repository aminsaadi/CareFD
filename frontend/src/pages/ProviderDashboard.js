import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import { 
  FaCalendarAlt, FaComments, FaFileAlt, FaStar, FaUser, FaCog,
  FaChevronLeft, FaPlus, FaMapMarkerAlt, FaClock, FaCheckCircle,
  FaHourglass, FaTimes, FaEdit, FaChartBar, FaMoneyBillWave,
  FaUsers, FaEye, FaBriefcase, FaPhone, FaEnvelope
} from 'react-icons/fa';

const ProviderDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [provider, setProvider] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [requests, setRequests] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalEarnings: 0,
    averageRating: 0,
    totalReviews: 0,
    profileViews: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch provider profile
      const providerRes = await api.get('/providers/me');
      setProvider(providerRes.data);

      // Fetch bookings
      const bookingsRes = await api.get('/bookings/provider');
      const providerBookings = bookingsRes.data.bookings || [];
      setBookings(providerBookings);

      // Fetch services
      const servicesRes = await api.get('/services/my');
      setServices(servicesRes.data.services || []);

      // Fetch open requests (for offers)
      const requestsRes = await api.get('/requests?status=open&limit=10');
      setRequests(requestsRes.data.requests || []);

      // Fetch reviews
      if (providerRes.data?.provider_id) {
        const reviewsRes = await api.get(`/providers/${providerRes.data.provider_id}/reviews`);
        setReviews(reviewsRes.data.reviews || []);
      }

      // Calculate stats
      const completed = providerBookings.filter(b => b.status === 'completed');
      setStats({
        totalBookings: providerBookings.length,
        pendingBookings: providerBookings.filter(b => b.status === 'pending').length,
        completedBookings: completed.length,
        totalEarnings: completed.reduce((acc, b) => acc + (b.price || 0), 0),
        averageRating: providerRes.data?.rating || 0,
        totalReviews: providerRes.data?.total_reviews || 0,
        profileViews: providerRes.data?.views_count || 0
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status });
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to update booking:', error);
    }
  };

  const tabs = [
    { id: 'overview', label: 'סקירה כללית', icon: FaChartBar },
    { id: 'bookings', label: 'תורים', icon: FaCalendarAlt },
    { id: 'services', label: 'שירותים', icon: FaBriefcase },
    { id: 'requests', label: 'בקשות פתוחות', icon: FaFileAlt },
    { id: 'reviews', label: 'ביקורות', icon: FaStar },
    { id: 'profile', label: 'פרופיל', icon: FaUser },
    { id: 'settings', label: 'הגדרות', icon: FaCog }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-600';
      case 'pending': return 'bg-yellow-100 text-yellow-600';
      case 'completed': return 'bg-blue-100 text-blue-600';
      case 'cancelled': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-carelink-teal-pale/30 flex flex-col">
      <Navbar />
      
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-carelink-navy font-heading mb-2">
                שלום, {provider?.business_name || user?.name}! 👋
              </h1>
              <p className="text-carelink-gray">ניהול העסק שלך</p>
            </div>
            {provider && (
              <div className="flex items-center gap-3">
                {provider.is_verified && (
                  <span className="inline-flex items-center gap-1 bg-carelink-teal text-white px-3 py-1 rounded-full text-sm">
                    <FaCheckCircle /> מאומת
                  </span>
                )}
                <Link
                  to={`/providers/${provider.provider_id}`}
                  className="bg-carelink-navy text-white px-4 py-2 rounded-xl font-medium hover:bg-carelink-slate transition flex items-center gap-2"
                >
                  <FaEye />
                  צפה בפרופיל
                </Link>
              </div>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden sticky top-24">
                <nav className="p-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition ${
                        activeTab === tab.id
                          ? 'bg-carelink-teal text-white'
                          : 'text-carelink-gray hover:bg-carelink-teal-pale/30'
                      }`}
                    >
                      <tab.icon />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-carelink-teal border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <>
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Stats Cards */}
                      <div className="grid md:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                              <FaCalendarAlt className="text-blue-600 text-xl" />
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-carelink-navy">{stats.totalBookings}</div>
                              <div className="text-sm text-carelink-gray">תורים</div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                              <FaMoneyBillWave className="text-green-600 text-xl" />
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-carelink-navy">₪{stats.totalEarnings}</div>
                              <div className="text-sm text-carelink-gray">הכנסות</div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                              <FaStar className="text-yellow-600 text-xl" />
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-carelink-navy">{stats.averageRating.toFixed(1)}</div>
                              <div className="text-sm text-carelink-gray">{stats.totalReviews} ביקורות</div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                              <FaEye className="text-purple-600 text-xl" />
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-carelink-navy">{stats.profileViews}</div>
                              <div className="text-sm text-carelink-gray">צפיות בפרופיל</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Pending Bookings */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-carelink-navy">
                            תורים ממתינים לאישור ({stats.pendingBookings})
                          </h3>
                          <button
                            onClick={() => setActiveTab('bookings')}
                            className="text-carelink-teal font-medium flex items-center gap-1"
                          >
                            צפה בכל
                            <FaChevronLeft className="rtl:rotate-180" />
                          </button>
                        </div>
                        {bookings.filter(b => b.status === 'pending').length === 0 ? (
                          <div className="text-center py-6 text-carelink-gray">
                            <FaCheckCircle className="text-3xl mx-auto mb-2 text-green-500" />
                            <p>אין תורים ממתינים</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {bookings.filter(b => b.status === 'pending').slice(0, 3).map((booking) => (
                              <div key={booking.booking_id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                                <div>
                                  <p className="font-medium text-carelink-navy">{booking.user_name || 'לקוח'}</p>
                                  <p className="text-sm text-carelink-gray">
                                    {booking.service_name} • {new Date(booking.booking_date).toLocaleDateString('he-IL')}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => updateBookingStatus(booking.booking_id, 'confirmed')}
                                    className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600"
                                  >
                                    אשר
                                  </button>
                                  <button
                                    onClick={() => updateBookingStatus(booking.booking_id, 'cancelled')}
                                    className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600"
                                  >
                                    בטל
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Open Requests */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-carelink-navy">בקשות פתוחות להצעה</h3>
                          <button
                            onClick={() => setActiveTab('requests')}
                            className="text-carelink-teal font-medium flex items-center gap-1"
                          >
                            צפה בכל
                            <FaChevronLeft className="rtl:rotate-180" />
                          </button>
                        </div>
                        {requests.length === 0 ? (
                          <div className="text-center py-6 text-carelink-gray">
                            <FaFileAlt className="text-3xl mx-auto mb-2 text-carelink-teal-pale" />
                            <p>אין בקשות פתוחות כרגע</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {requests.slice(0, 3).map((request) => (
                              <Link
                                key={request.request_id}
                                to={`/requests/${request.request_id}`}
                                className="block p-4 bg-gray-50 rounded-xl hover:bg-carelink-teal-pale/30 transition"
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-medium text-carelink-navy">{request.title}</p>
                                    <p className="text-sm text-carelink-gray line-clamp-1">{request.description}</p>
                                  </div>
                                  {request.budget && (
                                    <span className="text-carelink-teal font-bold">₪{request.budget}</span>
                                  )}
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bookings Tab */}
                  {activeTab === 'bookings' && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <h3 className="text-xl font-bold text-carelink-navy mb-6">ניהול תורים</h3>
                      {bookings.length === 0 ? (
                        <div className="text-center py-12 text-carelink-gray">
                          <FaCalendarAlt className="text-5xl mx-auto mb-3 text-carelink-teal-pale" />
                          <p className="text-lg">אין תורים עדיין</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-carelink-teal-pale">
                                <th className="text-right py-3 px-4 font-semibold text-carelink-navy">לקוח</th>
                                <th className="text-right py-3 px-4 font-semibold text-carelink-navy">שירות</th>
                                <th className="text-right py-3 px-4 font-semibold text-carelink-navy">תאריך</th>
                                <th className="text-right py-3 px-4 font-semibold text-carelink-navy">סטטוס</th>
                                <th className="text-right py-3 px-4 font-semibold text-carelink-navy">פעולות</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bookings.map((booking) => (
                                <tr key={booking.booking_id} className="border-b border-carelink-teal-pale/50">
                                  <td className="py-4 px-4">{booking.user_name || 'לקוח'}</td>
                                  <td className="py-4 px-4">{booking.service_name || 'שירות'}</td>
                                  <td className="py-4 px-4">{new Date(booking.booking_date).toLocaleDateString('he-IL')}</td>
                                  <td className="py-4 px-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                      {t(booking.status)}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4">
                                    {booking.status === 'pending' && (
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => updateBookingStatus(booking.booking_id, 'confirmed')}
                                          className="text-green-600 hover:text-green-700"
                                        >
                                          <FaCheckCircle />
                                        </button>
                                        <button
                                          onClick={() => updateBookingStatus(booking.booking_id, 'cancelled')}
                                          className="text-red-600 hover:text-red-700"
                                        >
                                          <FaTimes />
                                        </button>
                                      </div>
                                    )}
                                    {booking.status === 'confirmed' && (
                                      <button
                                        onClick={() => updateBookingStatus(booking.booking_id, 'completed')}
                                        className="text-blue-600 hover:text-blue-700 text-sm"
                                      >
                                        סמן כהושלם
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Services Tab */}
                  {activeTab === 'services' && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-carelink-navy">השירותים שלי</h3>
                        <Link
                          to="/provider/services/new"
                          className="bg-carelink-teal text-white px-4 py-2 rounded-xl font-medium hover:bg-carelink-teal-medium transition flex items-center gap-2"
                        >
                          <FaPlus />
                          הוסף שירות
                        </Link>
                      </div>
                      {services.length === 0 ? (
                        <div className="text-center py-12 text-carelink-gray">
                          <FaBriefcase className="text-5xl mx-auto mb-3 text-carelink-teal-pale" />
                          <p className="text-lg mb-2">אין שירותים עדיין</p>
                          <Link to="/provider/services/new" className="text-carelink-teal font-medium">
                            הוסף שירות ראשון
                          </Link>
                        </div>
                      ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                          {services.map((service) => (
                            <div key={service.service_id} className="border-2 border-carelink-teal-pale rounded-xl p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-bold text-carelink-navy">{service.name}</h4>
                                <span className="text-xl font-bold text-carelink-teal">₪{service.price}</span>
                              </div>
                              <p className="text-sm text-carelink-gray mb-3 line-clamp-2">{service.description}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs bg-carelink-navy text-white px-2 py-1 rounded-full">
                                  {t(service.service_type)}
                                </span>
                                <button className="text-carelink-teal hover:text-carelink-teal-medium">
                                  <FaEdit />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reviews Tab */}
                  {activeTab === 'reviews' && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-carelink-teal">{stats.averageRating.toFixed(1)}</div>
                          <div className="flex justify-center">
                            {[...Array(5)].map((_, i) => (
                              <FaStar
                                key={i}
                                className={i < Math.round(stats.averageRating) ? 'text-yellow-500' : 'text-gray-300'}
                              />
                            ))}
                          </div>
                          <div className="text-sm text-carelink-gray">{stats.totalReviews} ביקורות</div>
                        </div>
                      </div>
                      {reviews.length === 0 ? (
                        <div className="text-center py-8 text-carelink-gray">
                          <FaStar className="text-4xl mx-auto mb-2 text-carelink-teal-pale" />
                          <p>עדיין אין ביקורות</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {reviews.map((review) => (
                            <div key={review.review_id} className="border-b border-carelink-teal-pale pb-4 last:border-0">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-carelink-navy rounded-full flex items-center justify-center text-white font-bold">
                                  {(review.user?.name || 'M')[0]}
                                </div>
                                <div>
                                  <p className="font-medium text-carelink-navy">{review.user?.name || 'משתמש'}</p>
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <FaStar
                                        key={i}
                                        className={`text-sm ${i < review.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <p className="text-carelink-slate">{review.comment}</p>
                              <p className="text-xs text-carelink-gray mt-2">
                                {new Date(review.created_at).toLocaleDateString('he-IL')}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Profile Tab */}
                  {activeTab === 'profile' && provider && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-carelink-navy">פרופיל העסק</h3>
                        <Link
                          to={`/provider/edit/${provider.provider_id}`}
                          className="bg-carelink-teal text-white px-4 py-2 rounded-xl font-medium hover:bg-carelink-teal-medium transition flex items-center gap-2"
                        >
                          <FaEdit />
                          ערוך פרופיל
                        </Link>
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-carelink-gray mb-1">שם העסק</label>
                          <p className="text-lg text-carelink-navy">{provider.business_name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-carelink-gray mb-1">סוג ספק</label>
                          <p className="text-lg text-carelink-navy">{t(provider.provider_type)}</p>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-carelink-gray mb-1">תיאור</label>
                          <p className="text-carelink-navy">{provider.description || 'לא הוזן תיאור'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-carelink-gray mb-1">התמחויות</label>
                          <div className="flex flex-wrap gap-2">
                            {provider.specializations?.map((spec, idx) => (
                              <span key={idx} className="bg-carelink-teal text-white px-3 py-1 rounded-full text-sm">
                                {spec}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-carelink-gray mb-1">מיקום</label>
                          <p className="text-carelink-navy flex items-center gap-2">
                            <FaMapMarkerAlt className="text-carelink-teal" />
                            {provider.location?.city || 'לא הוזן'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Settings Tab */}
                  {activeTab === 'settings' && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <h3 className="text-xl font-bold text-carelink-navy mb-6">הגדרות</h3>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <p className="font-medium text-carelink-navy">התראות במייל</p>
                            <p className="text-sm text-carelink-gray">קבל התראות על תורים חדשים</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-carelink-teal"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <p className="font-medium text-carelink-navy">התראות SMS</p>
                            <p className="text-sm text-carelink-gray">קבל SMS על תורים חדשים</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-carelink-teal"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProviderDashboard;
