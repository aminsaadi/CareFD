import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CompletionConfirmDialog from '../components/CompletionConfirmDialog';
import NotificationSettings from '../components/NotificationSettings';
import api from '../utils/api';
import { toast } from 'sonner';
import { 
  FaCalendarAlt, FaComments, FaFileAlt, FaStar, FaUser, FaCog,
  FaChevronLeft, FaPlus, FaMapMarkerAlt, FaClock, FaCheckCircle,
  FaHourglass, FaTimes, FaEdit, FaBell, FaHeart, FaCamera, FaTrash,
  FaPhone, FaEnvelope, FaHome, FaLock, FaIdCard, FaShieldAlt,
  FaMoneyBillWave, FaUserCircle
} from 'react-icons/fa';

// Profile gradient colors
const PROFILE_COLORS = [
  'from-blue-500 to-purple-600',
  'from-pink-500 to-rose-500',
  'from-orange-400 to-red-500',
  'from-green-400 to-emerald-500',
  'from-indigo-500 to-purple-500',
  'from-teal-400 to-cyan-500'
];

const Dashboard = () => {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [bookings, setBookings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [chats, setChats] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompletionDialog, setShowCompletionDialog] = useState(null);
  const [showBookingDetails, setShowBookingDetails] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const fileInputRef = useRef(null);
  
  // User settings form
  const [userForm, setUserForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    profile_image: '',
    profile_color: PROFILE_COLORS[0]
  });
  
  // Password form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    awaitingConfirmation: 0,
    totalRequests: 0,
    unreadMessages: 0,
    totalReviews: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (user) {
      const nameParts = (user.name || '').split(' ');
      setUserForm({
        first_name: user.first_name || nameParts[0] || '',
        last_name: user.last_name || nameParts.slice(1).join(' ') || '',
        phone: user.phone || '',
        email: user.email || '',
        address: user.address || '',
        city: user.city || '',
        profile_image: user.profile_image || user.picture || '',
        profile_color: user.profile_color || PROFILE_COLORS[0]
      });
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [bookingsRes, requestsRes, chatsRes, reviewsRes, favoritesRes] = await Promise.all([
        api.get('/bookings/my').catch(() => ({ data: { bookings: [] } })),
        api.get('/requests/my').catch(() => ({ data: { requests: [] } })),
        api.get('/chat/rooms').catch(() => ({ data: { rooms: [] } })),
        api.get('/reviews/my').catch(() => ({ data: { reviews: [] } })),
        api.get('/favorites').catch(() => ({ data: { favorites: [] } }))
      ]);

      const userBookings = bookingsRes.data.bookings || [];
      setBookings(userBookings);
      setRequests(requestsRes.data.requests || []);
      setChats(chatsRes.data.rooms || []);
      setMyReviews(reviewsRes.data.reviews || []);
      setFavorites(favoritesRes.data.favorites || []);

      // Calculate stats
      setStats({
        totalBookings: userBookings.length,
        pendingBookings: userBookings.filter(b => b.status === 'pending').length,
        completedBookings: userBookings.filter(b => b.status === 'completed').length,
        awaitingConfirmation: userBookings.filter(b => b.status === 'provider_completed').length,
        totalRequests: (requestsRes.data.requests || []).length,
        unreadMessages: (chatsRes.data.rooms || []).reduce((acc, r) => acc + (r.unread_count || 0), 0),
        totalReviews: (reviewsRes.data.reviews || []).length
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('נא להעלות קובץ תמונה בלבד');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('גודל הקובץ חייב להיות עד 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setUserForm({ ...userForm, profile_image: response.data.url });
      toast.success('התמונה הועלתה בהצלחה!');
    } catch (err) {
      toast.error('שגיאה בהעלאת התמונה');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = () => {
    setUserForm({ ...userForm, profile_image: '' });
    toast.success('התמונה הוסרה');
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const response = await api.put('/users/me', {
        first_name: userForm.first_name,
        last_name: userForm.last_name,
        phone: userForm.phone,
        address: userForm.address,
        city: userForm.city,
        profile_image: userForm.profile_image,
        profile_color: userForm.profile_color
      });
      
      if (response.data.user && setUser) {
        setUser(response.data.user);
      }
      toast.success('הפרטים נשמרו בהצלחה!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'שגיאה בשמירת הפרטים');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.current_password || !passwordForm.new_password) {
      toast.error('נא למלא את כל השדות');
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('הסיסמאות החדשות אינן תואמות');
      return;
    }
    if (passwordForm.new_password.length < 6) {
      toast.error('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    setChangingPassword(true);
    try {
      await api.put('/users/me/password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      toast.success('הסיסמה שונתה בהצלחה!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'שגיאה בשינוי הסיסמה');
    } finally {
      setChangingPassword(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-600';
      case 'pending': return 'bg-yellow-100 text-yellow-600';
      case 'completed': return 'bg-blue-100 text-blue-600';
      case 'provider_completed': return 'bg-purple-100 text-purple-600';
      case 'in_progress': return 'bg-cyan-100 text-cyan-600';
      case 'cancelled': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'ממתין לאישור',
      confirmed: 'מאושר',
      completed: 'הושלם',
      provider_completed: 'ממתין לאישורך',
      in_progress: 'בתהליך',
      cancelled: 'בוטל'
    };
    return labels[status] || status;
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

  const getInitials = () => {
    const first = userForm.first_name || user?.name?.split(' ')[0] || '';
    const last = userForm.last_name || user?.name?.split(' ')[1] || '';
    return `${first[0] || ''}${last[0] || ''}`.toUpperCase() || 'U';
  };

  const tabs = [
    { id: 'overview', label: 'סקירה כללית', icon: FaUser },
    { id: 'bookings', label: 'ההזמנות שלי', icon: FaCalendarAlt },
    { id: 'notifications', label: 'התראות', icon: FaBell, link: '/notifications' },
    { id: 'reviews', label: 'הביקורות שלי', icon: FaStar },
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
                  <div className={`w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center overflow-hidden ${
                    userForm.profile_image ? '' : `bg-gradient-to-br ${userForm.profile_color}`
                  }`}>
                    {userForm.profile_image ? (
                      <img src={userForm.profile_image} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-2xl font-bold">{getInitials()}</span>
                    )}
                  </div>
                  <h3 className="font-bold text-lg">{user?.name}</h3>
                  <p className="text-carelink-teal-pale text-sm font-mono" data-testid="user-number">
                    {user?.user_number || `U${user?.user_id?.slice(-7) || '0000000'}`}
                  </p>
                </div>

                {/* Navigation */}
                <nav className="p-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      data-testid={`tab-${tab.id}`}
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
                              <div className="text-sm text-carelink-gray">סה"כ הזמנות</div>
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
                            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                              <FaStar className="text-amber-600 text-xl" />
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-carelink-navy">{stats.totalReviews}</div>
                              <div className="text-sm text-carelink-gray">ביקורות</div>
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
                          <h3 className="text-lg font-bold text-carelink-navy">ההזמנות האחרונות</h3>
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
                            <p>עדיין אין לך הזמנות</p>
                            <Link to="/providers" className="text-carelink-teal font-medium mt-2 inline-block">
                              חפש ספק עכשיו
                            </Link>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {bookings.slice(0, 3).map((booking) => {
                              const StatusIcon = getStatusIcon(booking.status);
                              return (
                                <div 
                                  key={booking.booking_id} 
                                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-carelink-teal-pale/20 transition"
                                  onClick={() => setShowBookingDetails(booking)}
                                >
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
                                    {getStatusLabel(booking.status)}
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
                        <h3 className="text-xl font-bold text-carelink-navy">ההזמנות שלי</h3>
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
                          <p className="text-lg mb-2">אין לך הזמנות עדיין</p>
                          <Link to="/providers" className="text-carelink-teal font-medium">
                            חפש ספק והזמן תור ראשון
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {bookings.map((booking) => {
                            const StatusIcon = getStatusIcon(booking.status);
                            return (
                              <div 
                                key={booking.booking_id} 
                                className="border-2 border-carelink-teal-pale rounded-xl p-4 hover:border-carelink-teal transition cursor-pointer"
                                onClick={() => setShowBookingDetails(booking)}
                                data-testid={`booking-card-${booking.booking_id}`}
                              >
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
                                        {booking.booking_time || new Date(booking.booking_date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                    {booking.price && (
                                      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-medium">
                                        ₪{booking.price}
                                      </div>
                                    )}
                                    <span className={`px-4 py-2 rounded-xl text-sm font-medium ${getStatusColor(booking.status)}`}>
                                      {getStatusLabel(booking.status)}
                                    </span>
                                    {booking.status === 'provider_completed' && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setShowCompletionDialog(booking);
                                        }}
                                        className="bg-carelink-teal text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-carelink-teal-medium transition"
                                        data-testid={`confirm-booking-${booking.booking_id}`}
                                      >
                                        אשר והעריך
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reviews Tab */}
                  {activeTab === 'reviews' && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <h3 className="text-xl font-bold text-carelink-navy mb-6">הביקורות שלי</h3>
                      {myReviews.length === 0 ? (
                        <div className="text-center py-12 text-carelink-gray">
                          <FaStar className="text-5xl mx-auto mb-3 text-carelink-teal-pale" />
                          <p className="text-lg mb-2">עדיין לא כתבת ביקורות</p>
                          <p className="text-sm">לאחר השלמת הזמנה תוכל לכתוב ביקורת על הספק</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {myReviews.map((review) => (
                            <div key={review.review_id} className="border-2 border-carelink-teal-pale rounded-xl p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  {review.provider?.profile_image ? (
                                    <img 
                                      src={review.provider.profile_image} 
                                      alt={review.provider.business_name}
                                      className="w-12 h-12 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 bg-carelink-teal rounded-full flex items-center justify-center text-white font-bold">
                                      {review.provider?.business_name?.[0] || 'S'}
                                    </div>
                                  )}
                                  <div>
                                    <Link 
                                      to={`/providers/${review.provider_id}`}
                                      className="font-bold text-carelink-navy hover:text-carelink-teal transition"
                                    >
                                      {review.provider?.business_name || 'ספק'}
                                    </Link>
                                    <p className="text-sm text-carelink-gray">
                                      {review.provider?.profession_title}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <FaStar
                                      key={star}
                                      className={star <= review.rating ? 'text-amber-400' : 'text-gray-300'}
                                    />
                                  ))}
                                </div>
                              </div>
                              {review.comment && (
                                <p className="text-carelink-slate">{review.comment}</p>
                              )}
                              <p className="text-xs text-carelink-gray mt-3">
                                {new Date(review.created_at).toLocaleDateString('he-IL')}
                              </p>
                            </div>
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
                      {favorites.length === 0 ? (
                        <div className="text-center py-12 text-carelink-gray">
                          <FaHeart className="text-5xl mx-auto mb-3 text-carelink-teal-pale" />
                          <p className="text-lg mb-2">אין לך מועדפים עדיין</p>
                          <Link to="/providers" className="text-carelink-teal font-medium">
                            חפש ספקים ושמור מועדפים
                          </Link>
                        </div>
                      ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                          {favorites.map((fav) => (
                            <Link
                              key={fav.favorite_id}
                              to={`/providers/${fav.provider_id}`}
                              className="border-2 border-carelink-teal-pale rounded-xl p-4 hover:border-carelink-teal transition flex items-center gap-4"
                            >
                              <div className="w-16 h-16 bg-carelink-teal rounded-xl flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                                {fav.provider?.profile_image ? (
                                  <img src={fav.provider.profile_image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  fav.provider?.business_name?.[0] || 'S'
                                )}
                              </div>
                              <div>
                                <h4 className="font-bold text-carelink-navy">{fav.provider?.business_name || 'ספק'}</h4>
                                <p className="text-sm text-carelink-gray">{fav.provider?.profession_title}</p>
                                {fav.provider?.rating && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <FaStar className="text-amber-400 text-sm" />
                                    <span className="text-sm text-carelink-gray">{fav.provider.rating}</span>
                                  </div>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Settings Tab */}
                  {activeTab === 'settings' && (
                    <div className="space-y-6">
                      {/* Profile Image & Basic Info */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-bold text-carelink-navy mb-6 flex items-center gap-2">
                          <FaUserCircle className="text-carelink-teal" />
                          תמונת פרופיל
                        </h3>
                        
                        <div className="flex items-center gap-6 mb-6">
                          {/* Profile Image */}
                          <div className="relative">
                            <div className={`w-24 h-24 rounded-full overflow-hidden flex items-center justify-center ${
                              userForm.profile_image ? '' : `bg-gradient-to-br ${userForm.profile_color}`
                            }`}>
                              {userForm.profile_image ? (
                                <img src={userForm.profile_image} alt="Profile" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-white text-3xl font-bold">{getInitials()}</span>
                              )}
                            </div>
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploadingImage}
                              className="absolute bottom-0 right-0 w-8 h-8 bg-carelink-teal text-white rounded-full flex items-center justify-center shadow-lg hover:bg-carelink-teal/90 transition"
                              title="העלה תמונה"
                              data-testid="upload-profile-image-btn"
                            >
                              {uploadingImage ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <FaCamera size={14} />
                              )}
                            </button>
                            {userForm.profile_image && (
                              <button
                                onClick={handleDeleteImage}
                                className="absolute bottom-0 left-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition"
                                title="מחק תמונה"
                                data-testid="delete-profile-image-btn"
                              >
                                <FaTrash size={12} />
                              </button>
                            )}
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </div>
                          
                          <div className="flex-1">
                            <p className="text-sm text-carelink-gray mb-3">בחר צבע רקע (יוצג כאשר אין תמונה)</p>
                            <div className="flex gap-2">
                              {PROFILE_COLORS.map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => setUserForm({ ...userForm, profile_color: color })}
                                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${color} ${
                                    userForm.profile_color === color ? 'ring-2 ring-offset-2 ring-carelink-teal' : ''
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Personal Details */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-bold text-carelink-navy mb-6 flex items-center gap-2">
                          <FaIdCard className="text-carelink-teal" />
                          פרטים אישיים
                        </h3>
                        
                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                          <div>
                            <label className="block text-sm font-medium text-carelink-navy mb-2">שם פרטי</label>
                            <input
                              type="text"
                              value={userForm.first_name}
                              onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
                              className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                              data-testid="first-name-input"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-carelink-navy mb-2">שם משפחה</label>
                            <input
                              type="text"
                              value={userForm.last_name}
                              onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
                              className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                              data-testid="last-name-input"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Contact Details */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-bold text-carelink-navy mb-6 flex items-center gap-2">
                          <FaPhone className="text-carelink-teal" />
                          פרטי התקשרות
                        </h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-carelink-navy mb-2">אימייל</label>
                            <input
                              type="email"
                              value={userForm.email}
                              disabled
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-carelink-navy mb-2">טלפון</label>
                            <input
                              type="tel"
                              value={userForm.phone}
                              onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                              placeholder="050-0000000"
                              className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                              data-testid="phone-input"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-bold text-carelink-navy mb-6 flex items-center gap-2">
                          <FaHome className="text-carelink-teal" />
                          כתובת
                        </h3>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-carelink-navy mb-2">עיר</label>
                            <input
                              type="text"
                              value={userForm.city}
                              onChange={(e) => setUserForm({ ...userForm, city: e.target.value })}
                              placeholder="הכנס עיר"
                              className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                              data-testid="city-input"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-carelink-navy mb-2">כתובת מלאה</label>
                            <input
                              type="text"
                              value={userForm.address}
                              onChange={(e) => setUserForm({ ...userForm, address: e.target.value })}
                              placeholder="רחוב, מספר בית, דירה"
                              className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                              data-testid="address-input"
                            />
                          </div>
                        </div>
                        
                        <button 
                          onClick={handleSaveSettings}
                          disabled={savingSettings}
                          className="mt-6 bg-carelink-teal text-white px-6 py-3 rounded-xl font-medium hover:bg-carelink-teal-medium transition disabled:opacity-50 flex items-center gap-2"
                          data-testid="save-settings-btn"
                        >
                          {savingSettings ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              שומר...
                            </>
                          ) : (
                            <>
                              <FaCheckCircle />
                              שמור שינויים
                            </>
                          )}
                        </button>
                      </div>

                      {/* Password */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-bold text-carelink-navy mb-6 flex items-center gap-2">
                          <FaLock className="text-carelink-teal" />
                          שינוי סיסמה
                        </h3>
                        
                        <div className="space-y-4 max-w-md">
                          <div>
                            <label className="block text-sm font-medium text-carelink-navy mb-2">סיסמה נוכחית</label>
                            <input
                              type="password"
                              value={passwordForm.current_password}
                              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                              className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                              data-testid="current-password-input"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-carelink-navy mb-2">סיסמה חדשה</label>
                            <input
                              type="password"
                              value={passwordForm.new_password}
                              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                              className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                              data-testid="new-password-input"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-carelink-navy mb-2">אישור סיסמה חדשה</label>
                            <input
                              type="password"
                              value={passwordForm.confirm_password}
                              onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                              className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                              data-testid="confirm-password-input"
                            />
                          </div>
                          <button 
                            onClick={handleChangePassword}
                            disabled={changingPassword}
                            className="bg-carelink-navy text-white px-6 py-3 rounded-xl font-medium hover:bg-carelink-slate transition disabled:opacity-50 flex items-center gap-2"
                            data-testid="change-password-btn"
                          >
                            {changingPassword ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                משנה...
                              </>
                            ) : (
                              <>
                                <FaShieldAlt />
                                שנה סיסמה
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Notification Settings */}
                      <NotificationSettings />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Completion Confirmation Dialog */}
      {showCompletionDialog && (
        <CompletionConfirmDialog
          booking={showCompletionDialog}
          onClose={() => setShowCompletionDialog(null)}
          onSuccess={() => {
            setShowCompletionDialog(null);
            fetchDashboardData();
          }}
        />
      )}

      {/* Booking Details Modal */}
      {showBookingDetails && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowBookingDetails(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-carelink-navy">פרטי ההזמנה</h3>
              <button
                onClick={() => setShowBookingDetails(null)}
                className="text-carelink-gray hover:text-carelink-navy transition"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Service Info */}
              <div className="bg-carelink-teal-pale/30 rounded-xl p-4">
                <h4 className="font-bold text-carelink-navy mb-2">{showBookingDetails.service_name || 'שירות'}</h4>
                <p className="text-sm text-carelink-gray">{showBookingDetails.provider_name || 'ספק'}</p>
              </div>

              {/* Booking Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-carelink-gray mb-1">תאריך</p>
                  <p className="font-medium text-carelink-navy">
                    {new Date(showBookingDetails.booking_date).toLocaleDateString('he-IL')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-carelink-gray mb-1">שעה</p>
                  <p className="font-medium text-carelink-navy">
                    {showBookingDetails.booking_time || new Date(showBookingDetails.booking_date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div>
                <p className="text-sm text-carelink-gray mb-1">סטטוס</p>
                <span className={`inline-block px-4 py-2 rounded-xl text-sm font-medium ${getStatusColor(showBookingDetails.status)}`}>
                  {getStatusLabel(showBookingDetails.status)}
                </span>
              </div>

              {/* Price & Payment */}
              {(showBookingDetails.price || showBookingDetails.total_price) && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FaMoneyBillWave className="text-green-600" />
                    <p className="font-bold text-green-700">פרטי תשלום</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-carelink-gray">מחיר</p>
                      <p className="font-bold text-green-700">₪{showBookingDetails.price || showBookingDetails.total_price}</p>
                    </div>
                    {showBookingDetails.payment_method && (
                      <div>
                        <p className="text-carelink-gray">אמצעי תשלום</p>
                        <p className="font-medium text-carelink-navy">
                          {showBookingDetails.payment_method === 'cash' ? 'מזומן' : 
                           showBookingDetails.payment_method === 'credit_card' ? 'כרטיס אשראי' :
                           showBookingDetails.payment_method}
                        </p>
                      </div>
                    )}
                    {showBookingDetails.paid_by && (
                      <div>
                        <p className="text-carelink-gray">שולם ע"י</p>
                        <p className="font-medium text-carelink-navy">{showBookingDetails.paid_by}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {showBookingDetails.notes && (
                <div>
                  <p className="text-sm text-carelink-gray mb-1">הערות</p>
                  <p className="text-carelink-slate bg-gray-50 p-3 rounded-xl">{showBookingDetails.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                {showBookingDetails.status === 'provider_completed' && (
                  <button
                    onClick={() => {
                      setShowBookingDetails(null);
                      setShowCompletionDialog(showBookingDetails);
                    }}
                    className="flex-1 bg-carelink-teal text-white py-3 rounded-xl font-medium hover:bg-carelink-teal-medium transition"
                  >
                    אשר השלמה והעריך
                  </button>
                )}
                {showBookingDetails.status === 'completed' && !showBookingDetails.has_review && (
                  <button
                    onClick={() => {
                      setShowBookingDetails(null);
                      setShowCompletionDialog(showBookingDetails);
                    }}
                    className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-medium hover:bg-amber-600 transition flex items-center justify-center gap-2"
                  >
                    <FaStar />
                    כתוב ביקורת
                  </button>
                )}
                <Link
                  to={`/providers/${showBookingDetails.provider_id}`}
                  className="flex-1 bg-carelink-navy text-white py-3 rounded-xl font-medium hover:bg-carelink-slate transition text-center"
                >
                  צפה בספק
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
