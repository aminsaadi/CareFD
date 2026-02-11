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
  FaUsers, FaEye, FaBriefcase, FaPhone, FaEnvelope, FaTrash,
  FaHome, FaVideo, FaClinicMedical, FaPhoneAlt, FaSave, FaAward,
  FaWhatsapp, FaGlobe, FaUserTie
} from 'react-icons/fa';

// Service type config
const serviceTypeOptions = [
  { value: 'home_visit', label: 'ביקור בית', icon: FaHome },
  { value: 'clinic_visit', label: 'ביקור במרפאה', icon: FaClinicMedical },
  { value: 'video_call', label: 'טלרפואה', icon: FaVideo },
  { value: 'phone_call', label: 'שיחה טלפונית', icon: FaPhoneAlt }
];

const pricingTypeOptions = [
  { value: 'per_hour', label: 'לפי שעה' },
  { value: 'per_session', label: 'לפי טיפול' },
  { value: 'consultation', label: 'ייעוץ' },
  { value: 'package', label: 'חבילה' }
];

const providerTypeOptions = [
  { value: 'individual', label: 'עצמאי' },
  { value: 'clinic', label: 'מרפאה' },
  { value: 'company', label: 'חברה' }
];

const availableSpecializations = [
  'סיעוד', 'פיזיותרפיה', 'ריפוי בעיסוק', 'רפואת משפחה', 
  'גריאטריה', 'רפואה משלימה', 'פסיכולוגיה', 'דיאטה ותזונה',
  'שיקום', 'דיקור', 'עיסוי רפואי', 'ריפוי בדיבור'
];

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
  const [saving, setSaving] = useState(false);
  
  // Service form states
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    price: '',
    duration_minutes: '',
    service_type: 'home_visit',
    pricing_type: 'per_session'
  });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    business_name: '',
    description: '',
    provider_type: 'individual',
    phone: '',
    email: '',
    website: '',
    city: '',
    address: '',
    specializations: [],
    service_types: [],
    years_experience: ''
  });

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

  useEffect(() => {
    if (provider) {
      setProfileForm({
        business_name: provider.business_name || '',
        description: provider.description || '',
        provider_type: provider.provider_type || 'individual',
        phone: provider.phone || '',
        email: provider.email || user?.email || '',
        website: provider.website || '',
        city: provider.location?.city || '',
        address: provider.location?.address || '',
        specializations: provider.specializations || [],
        service_types: provider.service_types || [],
        years_experience: provider.years_experience || ''
      });
    }
  }, [provider, user]);

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

  // Service Management Functions
  const resetServiceForm = () => {
    setServiceForm({
      name: '',
      description: '',
      price: '',
      duration_minutes: '',
      service_type: 'home_visit',
      pricing_type: 'per_session'
    });
    setEditingService(null);
    setShowServiceForm(false);
  };

  const handleEditService = (service) => {
    setServiceForm({
      name: service.name || '',
      description: service.description || '',
      price: service.price || '',
      duration_minutes: service.duration_minutes || '',
      service_type: service.service_type || 'home_visit',
      pricing_type: service.pricing_type || 'per_session'
    });
    setEditingService(service);
    setShowServiceForm(true);
  };

  const handleSaveService = async () => {
    if (!serviceForm.name || !serviceForm.price) {
      alert('נא למלא שם שירות ומחיר');
      return;
    }

    setSaving(true);
    try {
      const serviceData = {
        ...serviceForm,
        price: parseFloat(serviceForm.price),
        duration_minutes: serviceForm.duration_minutes ? parseInt(serviceForm.duration_minutes) : null,
        provider_id: provider.provider_id
      };

      if (editingService) {
        await api.put(`/services/${editingService.service_id}`, serviceData);
      } else {
        await api.post('/services', serviceData);
      }
      
      await fetchDashboardData();
      resetServiceForm();
    } catch (error) {
      console.error('Failed to save service:', error);
      alert('שגיאה בשמירת השירות');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק שירות זה?')) return;
    
    try {
      await api.delete(`/services/${serviceId}`);
      await fetchDashboardData();
    } catch (error) {
      console.error('Failed to delete service:', error);
      alert('שגיאה במחיקת השירות');
    }
  };

  // Profile Management Functions
  const toggleSpecialization = (spec) => {
    setProfileForm(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }));
  };

  const toggleServiceType = (type) => {
    setProfileForm(prev => ({
      ...prev,
      service_types: prev.service_types.includes(type)
        ? prev.service_types.filter(t => t !== type)
        : [...prev.service_types, type]
    }));
  };

  const handleSaveProfile = async () => {
    if (!profileForm.business_name) {
      alert('נא למלא שם עסק');
      return;
    }

    setSaving(true);
    try {
      const profileData = {
        business_name: profileForm.business_name,
        description: profileForm.description,
        provider_type: profileForm.provider_type,
        phone: profileForm.phone,
        email: profileForm.email,
        website: profileForm.website,
        specializations: profileForm.specializations,
        service_types: profileForm.service_types,
        years_experience: profileForm.years_experience ? parseInt(profileForm.years_experience) : null,
        location: {
          city: profileForm.city,
          address: profileForm.address
        }
      };

      await api.put(`/providers/${provider.provider_id}`, profileData);
      await fetchDashboardData();
      alert('הפרופיל נשמר בהצלחה!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('שגיאה בשמירת הפרופיל');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'סקירה כללית', icon: FaChartBar },
    { id: 'bookings', label: 'תורים', icon: FaCalendarAlt },
    { id: 'services', label: 'שירותים', icon: FaBriefcase },
    { id: 'requests', label: 'בקשות פתוחות', icon: FaFileAlt },
    { id: 'reviews', label: 'ביקורות', icon: FaStar },
    { id: 'profile', label: 'פרופיל', icon: FaUser },
    { id: 'verification', label: 'אימות', icon: FaAward },
    { id: 'settings', label: 'הגדרות', icon: FaCog }
  ];

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
                {provider.is_recommended && (
                  <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm">
                    <FaAward /> מומלץ
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

                      {/* Quick Stats Row */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                          <h3 className="text-lg font-bold text-carelink-navy mb-4">שירותים פעילים</h3>
                          <div className="text-4xl font-bold text-carelink-teal mb-2">{services.length}</div>
                          <button
                            onClick={() => setActiveTab('services')}
                            className="text-carelink-teal font-medium text-sm"
                          >
                            נהל שירותים →
                          </button>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                          <h3 className="text-lg font-bold text-carelink-navy mb-4">בקשות פתוחות</h3>
                          <div className="text-4xl font-bold text-carelink-teal mb-2">{requests.length}</div>
                          <button
                            onClick={() => setActiveTab('requests')}
                            className="text-carelink-teal font-medium text-sm"
                          >
                            צפה בבקשות →
                          </button>
                        </div>
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
                                <tr key={booking.booking_id} className="border-b border-carelink-teal-pale/50 hover:bg-gray-50">
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

                  {/* Services Tab - Enhanced */}
                  {activeTab === 'services' && (
                    <div className="space-y-6">
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-bold text-carelink-navy">ניהול שירותים</h3>
                          <button
                            onClick={() => {
                              resetServiceForm();
                              setShowServiceForm(true);
                            }}
                            className="bg-carelink-teal text-white px-4 py-2 rounded-xl font-medium hover:bg-carelink-teal-medium transition flex items-center gap-2"
                          >
                            <FaPlus />
                            הוסף שירות חדש
                          </button>
                        </div>

                        {/* Service Form */}
                        {showServiceForm && (
                          <div className="mb-6 p-6 bg-carelink-teal-pale/20 rounded-xl border-2 border-carelink-teal">
                            <h4 className="font-bold text-carelink-navy mb-4">
                              {editingService ? 'עריכת שירות' : 'שירות חדש'}
                            </h4>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-carelink-navy mb-2">שם השירות *</label>
                                <input
                                  type="text"
                                  value={serviceForm.name}
                                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                                  className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                                  placeholder="לדוגמה: טיפול פיזיותרפיה"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-carelink-navy mb-2">תיאור השירות</label>
                                <textarea
                                  value={serviceForm.description}
                                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                                  className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none h-24 resize-none"
                                  placeholder="תאר את השירות..."
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-carelink-navy mb-2">מחיר (₪) *</label>
                                <input
                                  type="number"
                                  value={serviceForm.price}
                                  onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                                  className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-carelink-navy mb-2">משך (דקות)</label>
                                <input
                                  type="number"
                                  value={serviceForm.duration_minutes}
                                  onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: e.target.value })}
                                  className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                                  placeholder="45"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-carelink-navy mb-2">סוג שירות</label>
                                <select
                                  value={serviceForm.service_type}
                                  onChange={(e) => setServiceForm({ ...serviceForm, service_type: e.target.value })}
                                  className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                                >
                                  {serviceTypeOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-carelink-navy mb-2">סוג תמחור</label>
                                <select
                                  value={serviceForm.pricing_type}
                                  onChange={(e) => setServiceForm({ ...serviceForm, pricing_type: e.target.value })}
                                  className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                                >
                                  {pricingTypeOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="flex gap-3 mt-4">
                              <button
                                onClick={handleSaveService}
                                disabled={saving}
                                className="bg-carelink-teal text-white px-6 py-2 rounded-xl font-medium hover:bg-carelink-teal-medium transition flex items-center gap-2 disabled:opacity-50"
                              >
                                <FaSave />
                                {saving ? 'שומר...' : 'שמור'}
                              </button>
                              <button
                                onClick={resetServiceForm}
                                className="bg-gray-200 text-carelink-navy px-6 py-2 rounded-xl font-medium hover:bg-gray-300 transition"
                              >
                                ביטול
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Services List */}
                        {services.length === 0 ? (
                          <div className="text-center py-12 text-carelink-gray">
                            <FaBriefcase className="text-5xl mx-auto mb-3 text-carelink-teal-pale" />
                            <p className="text-lg mb-2">אין שירותים עדיין</p>
                            <p className="text-sm">הוסף שירות ראשון כדי שלקוחות יוכלו להזמין</p>
                          </div>
                        ) : (
                          <div className="grid md:grid-cols-2 gap-4">
                            {services.map((service) => {
                              const typeConfig = serviceTypeOptions.find(t => t.value === service.service_type);
                              const TypeIcon = typeConfig?.icon || FaBriefcase;
                              return (
                                <div key={service.service_id} className="border-2 border-carelink-teal-pale rounded-xl p-5 hover:border-carelink-teal transition">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-carelink-teal-pale rounded-lg flex items-center justify-center">
                                        <TypeIcon className="text-carelink-teal" />
                                      </div>
                                      <div>
                                        <h4 className="font-bold text-carelink-navy">{service.name}</h4>
                                        <span className="text-xs bg-carelink-navy text-white px-2 py-0.5 rounded-full">
                                          {typeConfig?.label || service.service_type}
                                        </span>
                                      </div>
                                    </div>
                                    <span className="text-2xl font-bold text-carelink-teal">₪{service.price}</span>
                                  </div>
                                  <p className="text-sm text-carelink-gray mb-3 line-clamp-2">{service.description || 'ללא תיאור'}</p>
                                  <div className="flex items-center justify-between">
                                    {service.duration_minutes && (
                                      <span className="text-xs text-carelink-gray flex items-center gap-1">
                                        <FaClock />
                                        {service.duration_minutes} דקות
                                      </span>
                                    )}
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleEditService(service)}
                                        className="text-carelink-teal hover:text-carelink-teal-medium p-2"
                                      >
                                        <FaEdit />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteService(service.service_id)}
                                        className="text-red-500 hover:text-red-600 p-2"
                                      >
                                        <FaTrash />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Requests Tab */}
                  {activeTab === 'requests' && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <h3 className="text-xl font-bold text-carelink-navy mb-6">בקשות פתוחות</h3>
                      {requests.length === 0 ? (
                        <div className="text-center py-12 text-carelink-gray">
                          <FaFileAlt className="text-5xl mx-auto mb-3 text-carelink-teal-pale" />
                          <p className="text-lg">אין בקשות פתוחות כרגע</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {requests.map((request) => (
                            <Link
                              key={request.request_id}
                              to={`/requests/${request.request_id}`}
                              className="block p-4 border-2 border-carelink-teal-pale rounded-xl hover:border-carelink-teal transition"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-bold text-carelink-navy mb-1">{request.title}</h4>
                                  <p className="text-sm text-carelink-gray line-clamp-2">{request.description}</p>
                                  <div className="flex items-center gap-4 mt-2 text-xs text-carelink-gray">
                                    <span>{request.location?.city || 'לא צוין מיקום'}</span>
                                    <span>{new Date(request.created_at).toLocaleDateString('he-IL')}</span>
                                  </div>
                                </div>
                                {request.budget && (
                                  <div className="text-right">
                                    <span className="text-xl font-bold text-carelink-teal">₪{request.budget}</span>
                                    <p className="text-xs text-carelink-gray">תקציב</p>
                                  </div>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reviews Tab */}
                  {activeTab === 'reviews' && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <div className="flex items-center gap-6 mb-6">
                        <div className="text-center">
                          <div className="text-5xl font-bold text-carelink-teal">{stats.averageRating.toFixed(1)}</div>
                          <div className="flex justify-center my-2">
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

                  {/* Profile Tab - Enhanced */}
                  {activeTab === 'profile' && (
                    <div className="space-y-6">
                      {/* Basic Info */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-bold text-carelink-navy mb-6 flex items-center gap-2">
                          <FaUser className="text-carelink-teal" />
                          פרטי העסק
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-carelink-navy mb-2">שם העסק *</label>
                            <input
                              type="text"
                              value={profileForm.business_name}
                              onChange={(e) => setProfileForm({ ...profileForm, business_name: e.target.value })}
                              className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                              placeholder="שם המרפאה/העסק"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-carelink-navy mb-2">תיאור העסק</label>
                            <textarea
                              value={profileForm.description}
                              onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                              className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none h-32 resize-none"
                              placeholder="ספר על העסק שלך, הניסיון וההתמחויות..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-carelink-navy mb-2">סוג ספק</label>
                            <select
                              value={profileForm.provider_type}
                              onChange={(e) => setProfileForm({ ...profileForm, provider_type: e.target.value })}
                              className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                            >
                              {providerTypeOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-carelink-navy mb-2">שנות ניסיון</label>
                            <input
                              type="number"
                              value={profileForm.years_experience}
                              onChange={(e) => setProfileForm({ ...profileForm, years_experience: e.target.value })}
                              className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-bold text-carelink-navy mb-6 flex items-center gap-2">
                          <FaPhone className="text-carelink-teal" />
                          פרטי התקשרות
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-carelink-navy mb-2">טלפון</label>
                            <div className="relative">
                              <FaPhone className="absolute right-4 top-1/2 -translate-y-1/2 text-carelink-gray" />
                              <input
                                type="tel"
                                value={profileForm.phone}
                                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                className="w-full px-4 py-3 pr-12 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                                placeholder="050-0000000"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-carelink-navy mb-2">אימייל</label>
                            <div className="relative">
                              <FaEnvelope className="absolute right-4 top-1/2 -translate-y-1/2 text-carelink-gray" />
                              <input
                                type="email"
                                value={profileForm.email}
                                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                className="w-full px-4 py-3 pr-12 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                                placeholder="your@email.com"
                              />
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-carelink-navy mb-2">אתר אינטרנט</label>
                            <div className="relative">
                              <FaGlobe className="absolute right-4 top-1/2 -translate-y-1/2 text-carelink-gray" />
                              <input
                                type="url"
                                value={profileForm.website}
                                onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                                className="w-full px-4 py-3 pr-12 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                                placeholder="https://www.example.com"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-bold text-carelink-navy mb-6 flex items-center gap-2">
                          <FaMapMarkerAlt className="text-carelink-teal" />
                          מיקום
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-carelink-navy mb-2">עיר</label>
                            <input
                              type="text"
                              value={profileForm.city}
                              onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                              className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                              placeholder="תל אביב"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-carelink-navy mb-2">כתובת</label>
                            <input
                              type="text"
                              value={profileForm.address}
                              onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                              className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                              placeholder="רחוב, מספר בית"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Specializations */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-bold text-carelink-navy mb-6 flex items-center gap-2">
                          <FaAward className="text-carelink-teal" />
                          התמחויות
                        </h3>
                        <p className="text-sm text-carelink-gray mb-4">בחר את ההתמחויות שלך (ניתן לבחור כמה)</p>
                        <div className="flex flex-wrap gap-2">
                          {availableSpecializations.map((spec) => (
                            <button
                              key={spec}
                              type="button"
                              onClick={() => toggleSpecialization(spec)}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                                profileForm.specializations.includes(spec)
                                  ? 'bg-carelink-teal text-white'
                                  : 'bg-carelink-teal-pale/30 text-carelink-navy hover:bg-carelink-teal-pale'
                              }`}
                            >
                              {spec}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Service Types */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-bold text-carelink-navy mb-6 flex items-center gap-2">
                          <FaBriefcase className="text-carelink-teal" />
                          סוגי שירות
                        </h3>
                        <p className="text-sm text-carelink-gray mb-4">באילו דרכים אתה מציע שירות?</p>
                        <div className="grid md:grid-cols-2 gap-3">
                          {serviceTypeOptions.map((type) => {
                            const Icon = type.icon;
                            return (
                              <button
                                key={type.value}
                                type="button"
                                onClick={() => toggleServiceType(type.value)}
                                className={`flex items-center gap-3 p-4 rounded-xl text-right font-medium transition border-2 ${
                                  profileForm.service_types.includes(type.value)
                                    ? 'border-carelink-teal bg-carelink-teal-pale/30'
                                    : 'border-carelink-teal-pale hover:border-carelink-teal'
                                }`}
                              >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  profileForm.service_types.includes(type.value)
                                    ? 'bg-carelink-teal text-white'
                                    : 'bg-carelink-teal-pale text-carelink-teal'
                                }`}>
                                  <Icon />
                                </div>
                                <span className="text-carelink-navy">{type.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end">
                        <button
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className="bg-carelink-teal text-white px-8 py-3 rounded-xl font-semibold hover:bg-carelink-teal-medium transition flex items-center gap-2 disabled:opacity-50"
                        >
                          <FaSave />
                          {saving ? 'שומר...' : 'שמור פרופיל'}
                        </button>
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
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <p className="font-medium text-carelink-navy">פרופיל פעיל</p>
                            <p className="text-sm text-carelink-gray">הצג את הפרופיל שלי בחיפוש</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
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
