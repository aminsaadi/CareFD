import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CompletionConfirmDialog from '../components/CompletionConfirmDialog';
import api from '../utils/api';
import { 
  FaCalendarAlt, FaComments, FaFileAlt, FaStar, FaUser, FaCog,
  FaChevronLeft, FaPlus, FaMapMarkerAlt, FaClock, FaCheckCircle,
  FaHourglass, FaTimes, FaEdit, FaBell, FaHeart
} from 'react-icons/fa';

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [bookings, setBookings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [chats, setChats] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalRequests: 0,
    unreadMessages: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch bookings
      const bookingsRes = await api.get('/bookings/my');
      const userBookings = bookingsRes.data.bookings || [];
      setBookings(userBookings);

      // Fetch requests
      const requestsRes = await api.get('/requests/my');
      setRequests(requestsRes.data.requests || []);

      // Fetch chat rooms
      const chatsRes = await api.get('/chat/rooms');
      setChats(chatsRes.data.rooms || []);

      // Calculate stats
      setStats({
        totalBookings: userBookings.length,
        pendingBookings: userBookings.filter(b => b.status === 'pending').length,
        completedBookings: userBookings.filter(b => b.status === 'completed').length,
        totalRequests: (requestsRes.data.requests || []).length,
        unreadMessages: (chatsRes.data.rooms || []).reduce((acc, r) => acc + (r.unread_count || 0), 0)
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-600';
      case 'pending': return 'bg-yellow-100 text-yellow-600';
      case 'completed': return 'bg-blue-100 text-blue-600';
      case 'cancelled': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return FaCheckCircle;
      case 'pending': return FaHourglass;
      case 'completed': return FaCheckCircle;
      case 'cancelled': return FaTimes;
      default: return FaClock;
    }
  };

  const tabs = [
    { id: 'overview', label: 'סקירה כללית', icon: FaUser },
    { id: 'bookings', label: 'התורים שלי', icon: FaCalendarAlt },
    { id: 'requests', label: 'הבקשות שלי', icon: FaFileAlt },
    { id: 'messages', label: 'הודעות', icon: FaComments },
    { id: 'favorites', label: 'מועדפים', icon: FaHeart },
    { id: 'settings', label: 'הגדרות', icon: FaCog }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-carelink-teal-pale/30 flex flex-col">
      <Navbar />
      
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-carelink-navy font-heading mb-2">
              שלום, {user?.name || 'משתמש'}! 👋
            </h1>
            <p className="text-carelink-gray">ברוכים הבאים לאזור האישי שלך</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden sticky top-24">
                {/* User Info */}
                <div className="bg-gradient-to-r from-carelink-navy to-carelink-slate p-6 text-white text-center">
                  <div className="w-20 h-20 bg-white rounded-full mx-auto mb-3 flex items-center justify-center text-carelink-navy text-2xl font-bold">
                    {(user?.name || 'U')[0]}
                  </div>
                  <h3 className="font-bold text-lg">{user?.name}</h3>
                  <p className="text-carelink-teal-pale text-sm">{user?.email}</p>
                </div>

                {/* Navigation */}
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
                              <div className="text-sm text-carelink-gray">סה"כ תורים</div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                              <FaHourglass className="text-yellow-600 text-xl" />
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-carelink-navy">{stats.pendingBookings}</div>
                              <div className="text-sm text-carelink-gray">ממתינים</div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                              <FaCheckCircle className="text-green-600 text-xl" />
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-carelink-navy">{stats.completedBookings}</div>
                              <div className="text-sm text-carelink-gray">הושלמו</div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                              <FaComments className="text-purple-600 text-xl" />
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-carelink-navy">{stats.unreadMessages}</div>
                              <div className="text-sm text-carelink-gray">הודעות חדשות</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-lg font-bold text-carelink-navy mb-4">פעולות מהירות</h3>
                        <div className="grid md:grid-cols-3 gap-4">
                          <Link
                            to="/providers"
                            className="flex items-center gap-3 p-4 bg-carelink-teal-pale/30 rounded-xl hover:bg-carelink-teal-pale transition"
                          >
                            <FaPlus className="text-carelink-teal" />
                            <span className="font-medium text-carelink-navy">חפש ספק חדש</span>
                          </Link>
                          <Link
                            to="/requests/new"
                            className="flex items-center gap-3 p-4 bg-carelink-teal-pale/30 rounded-xl hover:bg-carelink-teal-pale transition"
                          >
                            <FaFileAlt className="text-carelink-teal" />
                            <span className="font-medium text-carelink-navy">פרסם בקשה</span>
                          </Link>
                          <Link
                            to="/chats"
                            className="flex items-center gap-3 p-4 bg-carelink-teal-pale/30 rounded-xl hover:bg-carelink-teal-pale transition"
                          >
                            <FaComments className="text-carelink-teal" />
                            <span className="font-medium text-carelink-navy">הצ'אטים שלי</span>
                          </Link>
                        </div>
                      </div>

                      {/* Recent Bookings */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-carelink-navy">התורים האחרונים</h3>
                          <button
                            onClick={() => setActiveTab('bookings')}
                            className="text-carelink-teal font-medium flex items-center gap-1"
                          >
                            צפה בכל
                            <FaChevronLeft className="rtl:rotate-180" />
                          </button>
                        </div>
                        {bookings.length === 0 ? (
                          <div className="text-center py-8 text-carelink-gray">
                            <FaCalendarAlt className="text-4xl mx-auto mb-2 text-carelink-teal-pale" />
                            <p>עדיין אין לך תורים</p>
                            <Link to="/providers" className="text-carelink-teal font-medium mt-2 inline-block">
                              חפש ספק עכשיו
                            </Link>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {bookings.slice(0, 3).map((booking) => {
                              const StatusIcon = getStatusIcon(booking.status);
                              return (
                                <div key={booking.booking_id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(booking.status)}`}>
                                    <StatusIcon />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-carelink-navy">{booking.service_name || 'שירות'}</p>
                                    <p className="text-sm text-carelink-gray">
                                      {new Date(booking.booking_date).toLocaleDateString('he-IL')}
                                    </p>
                                  </div>
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                    {t(booking.status)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bookings Tab */}
                  {activeTab === 'bookings' && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-carelink-navy">התורים שלי</h3>
                        <Link
                          to="/providers"
                          className="bg-carelink-teal text-white px-4 py-2 rounded-xl font-medium hover:bg-carelink-teal-medium transition flex items-center gap-2"
                        >
                          <FaPlus />
                          הזמן תור חדש
                        </Link>
                      </div>
                      {bookings.length === 0 ? (
                        <div className="text-center py-12 text-carelink-gray">
                          <FaCalendarAlt className="text-5xl mx-auto mb-3 text-carelink-teal-pale" />
                          <p className="text-lg mb-2">אין לך תורים עדיין</p>
                          <Link to="/providers" className="text-carelink-teal font-medium">
                            חפש ספק והזמן תור ראשון
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {bookings.map((booking) => {
                            const StatusIcon = getStatusIcon(booking.status);
                            return (
                              <div key={booking.booking_id} className="border-2 border-carelink-teal-pale rounded-xl p-4 hover:border-carelink-teal transition">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                  <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusColor(booking.status)}`}>
                                      <StatusIcon className="text-xl" />
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-carelink-navy">{booking.service_name || 'שירות'}</h4>
                                      <p className="text-sm text-carelink-gray">{booking.provider_name || 'ספק'}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <p className="font-medium text-carelink-navy">
                                        {new Date(booking.booking_date).toLocaleDateString('he-IL')}
                                      </p>
                                      <p className="text-sm text-carelink-gray">
                                        {new Date(booking.booking_date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                    <span className={`px-4 py-2 rounded-xl text-sm font-medium ${getStatusColor(booking.status)}`}>
                                      {t(booking.status)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Requests Tab */}
                  {activeTab === 'requests' && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-carelink-navy">הבקשות שלי</h3>
                        <Link
                          to="/requests/new"
                          className="bg-carelink-teal text-white px-4 py-2 rounded-xl font-medium hover:bg-carelink-teal-medium transition flex items-center gap-2"
                        >
                          <FaPlus />
                          בקשה חדשה
                        </Link>
                      </div>
                      {requests.length === 0 ? (
                        <div className="text-center py-12 text-carelink-gray">
                          <FaFileAlt className="text-5xl mx-auto mb-3 text-carelink-teal-pale" />
                          <p className="text-lg mb-2">אין לך בקשות עדיין</p>
                          <Link to="/requests/new" className="text-carelink-teal font-medium">
                            פרסם בקשה ראשונה
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {requests.map((request) => (
                            <Link
                              key={request.request_id}
                              to={`/requests/${request.request_id}`}
                              className="block border-2 border-carelink-teal-pale rounded-xl p-4 hover:border-carelink-teal transition"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-bold text-carelink-navy mb-1">{request.title}</h4>
                                  <p className="text-sm text-carelink-gray line-clamp-2">{request.description}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  request.status === 'open' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {request.status === 'open' ? 'פתוח' : 'סגור'}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 mt-3 text-sm text-carelink-gray">
                                <span>{request.offers_count || 0} הצעות</span>
                                <span>{new Date(request.created_at).toLocaleDateString('he-IL')}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Messages Tab */}
                  {activeTab === 'messages' && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <h3 className="text-xl font-bold text-carelink-navy mb-6">הודעות</h3>
                      {chats.length === 0 ? (
                        <div className="text-center py-12 text-carelink-gray">
                          <FaComments className="text-5xl mx-auto mb-3 text-carelink-teal-pale" />
                          <p className="text-lg mb-2">אין לך שיחות עדיין</p>
                          <p className="text-sm">שיחות יופיעו כאן כשתיצור קשר עם ספקים</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {chats.map((chat) => (
                            <Link
                              key={chat.room_id}
                              to={`/chat/${chat.room_id}`}
                              className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-carelink-teal-pale/30 transition"
                            >
                              <div className="w-12 h-12 bg-carelink-navy rounded-full flex items-center justify-center text-white font-bold">
                                {(chat.other_user_name || 'U')[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-carelink-navy">{chat.other_user_name || 'משתמש'}</p>
                                <p className="text-sm text-carelink-gray truncate">{chat.last_message || 'אין הודעות'}</p>
                              </div>
                              {chat.unread_count > 0 && (
                                <span className="bg-carelink-teal text-white text-xs px-2 py-1 rounded-full">
                                  {chat.unread_count}
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Favorites Tab */}
                  {activeTab === 'favorites' && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <h3 className="text-xl font-bold text-carelink-navy mb-6">ספקים מועדפים</h3>
                      <div className="text-center py-12 text-carelink-gray">
                        <FaHeart className="text-5xl mx-auto mb-3 text-carelink-teal-pale" />
                        <p className="text-lg mb-2">אין לך מועדפים עדיין</p>
                        <Link to="/providers" className="text-carelink-teal font-medium">
                          חפש ספקים ושמור מועדפים
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Settings Tab */}
                  {activeTab === 'settings' && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <h3 className="text-xl font-bold text-carelink-navy mb-6">הגדרות חשבון</h3>
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-carelink-navy mb-2">שם מלא</label>
                          <input
                            type="text"
                            defaultValue={user?.name}
                            className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-carelink-navy mb-2">אימייל</label>
                          <input
                            type="email"
                            defaultValue={user?.email}
                            disabled
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-carelink-navy mb-2">טלפון</label>
                          <input
                            type="tel"
                            placeholder="050-0000000"
                            className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                          />
                        </div>
                        <button className="bg-carelink-teal text-white px-6 py-3 rounded-xl font-medium hover:bg-carelink-teal-medium transition">
                          שמור שינויים
                        </button>
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

export default Dashboard;
