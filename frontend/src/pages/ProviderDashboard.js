import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import VerificationDocuments from '../components/VerificationDocuments';
import NotificationSettings from '../components/NotificationSettings';
import ConfirmDialog from '../components/ConfirmDialog';
import ProviderSubscription from '../components/provider/ProviderSubscription';
import ProviderClinics from '../components/provider/ProviderClinics';
import ProviderTeam from '../components/provider/ProviderTeam';
import api from '../utils/api';
import { toast } from 'sonner';
import { 
  FaCalendarAlt, FaComments, FaFileAlt, FaStar, FaUser, FaCog,
  FaChevronLeft, FaPlus, FaMapMarkerAlt, FaClock, FaCheckCircle,
  FaHourglass, FaTimes, FaEdit, FaChartBar, FaMoneyBillWave,
  FaUsers, FaEye, FaBriefcase, FaPhone, FaEnvelope, FaTrash,
  FaHome, FaVideo, FaClinicMedical, FaPhoneAlt, FaSave, FaAward,
  FaWhatsapp, FaGlobe, FaUserTie, FaBell, FaCrown, FaBuilding
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
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {}
  });
  
  // Service form states
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [deliveryTypes, setDeliveryTypes] = useState([]);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    price: '',
    duration_minutes: '',
    // New fields
    service_category: 'visit',
    delivery_types: [],
    pricing_type: 'fixed',
    minimum_hours: '',
    // Weekend pricing
    weekend_pricing_type: 'none',
    weekend_price_addition: '',
    // Travel cost
    has_travel_cost: false,
    travel_cost: '',
    // Shipping (for products)
    has_shipping: false,
    shipping_cost: '',
    free_shipping_above: '',
    // Stock
    stock_quantity: ''
  });

  // Profile form state - Provider business profile
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

  // User info form state - Personal user details
  const [userInfoForm, setUserInfoForm] = useState({
    first_name: '',
    last_name: '',
    personal_phone: '',
    personal_email: '',
    personal_address: '',
    personal_city: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
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
    fetchServiceAndDeliveryTypes();
  }, []);

  const fetchServiceAndDeliveryTypes = async () => {
    try {
      const [serviceRes, deliveryRes] = await Promise.all([
        api.get('/service-types'),
        api.get('/delivery-types')
      ]);
      setServiceTypes(serviceRes.data.service_types || []);
      setDeliveryTypes(deliveryRes.data.delivery_types || []);
    } catch (error) {
      console.error('Failed to fetch types:', error);
    }
  };

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
    
    // Load user info
    if (user) {
      setUserInfoForm(prev => ({
        ...prev,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        personal_phone: user.phone || '',
        personal_email: user.email || '',
        personal_address: user.address || '',
        personal_city: user.city || ''
      }));
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

      // Fetch chats
      try {
        const chatsRes = await api.get('/chat/rooms');
        setChats(chatsRes.data.rooms || []);
      } catch (chatError) {
        console.error('Failed to fetch chats:', chatError);
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
      // Use specific endpoints for each action
      const endpointMap = {
        'confirmed': `/bookings/${bookingId}/confirm`,
        'rejected': `/bookings/${bookingId}/reject`,
        'on_hold': `/bookings/${bookingId}/hold`,
        'provider_completed': `/bookings/${bookingId}/provider-complete`,
        'cancelled': `/bookings/${bookingId}/status`
      };
      
      const endpoint = endpointMap[status];
      if (!endpoint) {
        await api.put(`/bookings/${bookingId}/status`, { status });
      } else if (status === 'cancelled') {
        await api.put(endpoint, { status });
      } else {
        await api.put(endpoint, {});
      }
      
      const statusLabels = {
        confirmed: 'ההזמנה אושרה',
        rejected: 'ההזמנה נדחתה',
        on_hold: 'ההזמנה הושהתה',
        provider_completed: 'ההזמנה סומנה כהושלמה',
        cancelled: 'ההזמנה בוטלה'
      };
      toast.success(statusLabels[status] || 'הסטטוס עודכן');
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to update booking:', error);
      toast.error(error.response?.data?.detail || 'שגיאה בעדכון ההזמנה');
    }
  };

  // Service Management Functions
  const resetServiceForm = () => {
    setServiceForm({
      name: '',
      description: '',
      price: '',
      duration_minutes: '',
      service_category: 'visit',
      delivery_types: [],
      pricing_type: 'fixed',
      minimum_hours: '',
      weekend_pricing_type: 'none',
      weekend_price_addition: '',
      has_travel_cost: false,
      travel_cost: '',
      has_shipping: false,
      shipping_cost: '',
      free_shipping_above: '',
      stock_quantity: ''
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
      service_category: service.service_category || 'visit',
      delivery_types: service.delivery_types || [],
      pricing_type: service.pricing_type || 'fixed',
      minimum_hours: service.minimum_hours || '',
      weekend_pricing_type: service.weekend_pricing_type || 'none',
      weekend_price_addition: service.weekend_price_addition || '',
      has_travel_cost: service.has_travel_cost || false,
      travel_cost: service.travel_cost || '',
      has_shipping: service.has_shipping || false,
      shipping_cost: service.shipping_cost || '',
      free_shipping_above: service.free_shipping_above || '',
      stock_quantity: service.stock_quantity || ''
    });
    setEditingService(service);
    setShowServiceForm(true);
  };

  const handleSaveService = async () => {
    if (!serviceForm.name || !serviceForm.price) {
      toast.error('נא למלא שם שירות ומחיר');
      return;
    }

    // Validate minimum hours for hourly services
    if (serviceForm.service_category === 'hourly' && !serviceForm.minimum_hours) {
      toast.error('נא להגדיר מינימום שעות לשירות שעתי');
      return;
    }

    setSaving(true);
    try {
      const serviceData = {
        name: serviceForm.name,
        description: serviceForm.description,
        price: parseFloat(serviceForm.price),
        duration_minutes: serviceForm.duration_minutes ? parseInt(serviceForm.duration_minutes) : null,
        service_category: serviceForm.service_category,
        delivery_types: serviceForm.delivery_types,
        pricing_type: serviceForm.pricing_type,
        minimum_hours: serviceForm.minimum_hours ? parseFloat(serviceForm.minimum_hours) : null,
        weekend_pricing_type: serviceForm.weekend_pricing_type,
        weekend_price_addition: serviceForm.weekend_price_addition ? parseFloat(serviceForm.weekend_price_addition) : null,
        has_travel_cost: serviceForm.has_travel_cost,
        travel_cost: serviceForm.travel_cost ? parseFloat(serviceForm.travel_cost) : null,
        has_shipping: serviceForm.has_shipping,
        shipping_cost: serviceForm.shipping_cost ? parseFloat(serviceForm.shipping_cost) : null,
        free_shipping_above: serviceForm.free_shipping_above ? parseFloat(serviceForm.free_shipping_above) : null,
        stock_quantity: serviceForm.stock_quantity ? parseInt(serviceForm.stock_quantity) : null
      };

      if (editingService) {
        await api.put(`/services/${editingService.service_id}`, serviceData);
        toast.success('השירות עודכן בהצלחה!');
      } else {
        await api.post('/services', serviceData);
        toast.success('השירות נוסף בהצלחה!');
      }
      
      await fetchDashboardData();
      resetServiceForm();
    } catch (error) {
      console.error('Failed to save service:', error);
      toast.error('שגיאה בשמירת השירות');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'מחיקת שירות',
      message: 'האם אתה בטוח שברצונך למחוק שירות זה? פעולה זו לא ניתנת לביטול.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/services/${serviceId}`);
          await fetchDashboardData();
          toast.success('השירות נמחק בהצלחה');
        } catch (error) {
          console.error('Failed to delete service:', error);
          toast.error('שגיאה במחיקת השירות');
        }
      }
    });
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
      toast.error('נא למלא שם עסק');
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
      toast.success('הפרופיל נשמר בהצלחה!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('שגיאה בשמירת הפרופיל');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUserInfo = async () => {
    setSaving(true);
    try {
      const userData = {
        first_name: userInfoForm.first_name,
        last_name: userInfoForm.last_name,
        phone: userInfoForm.personal_phone,
        address: userInfoForm.personal_address,
        city: userInfoForm.personal_city
      };

      await api.put('/users/me', userData);
      toast.success('פרטי המשתמש נשמרו בהצלחה!');
    } catch (error) {
      console.error('Failed to save user info:', error);
      toast.error('שגיאה בשמירת פרטי המשתמש');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!userInfoForm.current_password || !userInfoForm.new_password) {
      toast.error('נא למלא את כל השדות');
      return;
    }
    if (userInfoForm.new_password !== userInfoForm.confirm_password) {
      toast.error('הסיסמאות אינן תואמות');
      return;
    }
    if (userInfoForm.new_password.length < 6) {
      toast.error('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    setSaving(true);
    try {
      await api.put('/users/me/password', {
        current_password: userInfoForm.current_password,
        new_password: userInfoForm.new_password
      });
      toast.success('הסיסמה עודכנה בהצלחה!');
      setUserInfoForm(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error(error.response?.data?.detail || 'שגיאה בשינוי הסיסמה');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'סקירה כללית', icon: FaChartBar },
    { id: 'subscription', label: 'מנוי', icon: FaCrown },
    { id: 'bookings', label: 'תורים', icon: FaCalendarAlt },
    { id: 'calendar', label: 'לוח שנה', icon: FaClock },
    { id: 'services', label: 'שירותים', icon: FaBriefcase },
    { id: 'clinics', label: 'קליניקות', icon: FaBuilding },
    { id: 'team', label: 'צוות', icon: FaUsers },
    { id: 'requests', label: 'בקשות פתוחות', icon: FaFileAlt },
    { id: 'notifications', label: 'התראות', icon: FaBell, link: '/notifications' },
    { id: 'messages', label: 'הודעות', icon: FaComments },
    { id: 'reviews', label: 'ביקורות', icon: FaStar },
    { id: 'user_info', label: 'פרטי משתמש', icon: FaUser },
    { id: 'provider_profile', label: 'פרופיל ספק', icon: FaUserTie },
    { id: 'verification', label: 'אימות חשבון', icon: FaAward, link: '/verify-account' },
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
      case 'rejected': return 'bg-red-100 text-red-600';
      case 'on_hold': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'ממתין לאישור',
      confirmed: 'מאושר',
      in_progress: 'בביצוע',
      provider_completed: 'סומן כהושלם',
      completed: 'הושלם',
      cancelled: 'בוטל',
      rejected: 'נדחה',
      on_hold: 'בהשהיה'
    };
    return labels[status] || status;
  };

  // Calendar helpers
  const getCalendarBookings = () => {
    return bookings.filter(b => ['confirmed', 'in_progress'].includes(b.status));
  };

  const groupBookingsByDate = () => {
    const grouped = {};
    getCalendarBookings().forEach(booking => {
      const date = booking.booking_date?.split('T')[0] || '';
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(booking);
    });
    // Sort by date
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
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
              <div className="flex items-center gap-3 flex-wrap">
                {provider.is_verified ? (
                  <span className="inline-flex items-center gap-1 bg-carelink-teal text-white px-3 py-1 rounded-full text-sm">
                    <FaCheckCircle /> מאומת
                  </span>
                ) : (
                  <Link
                    to="/verify-account"
                    className="inline-flex items-center gap-1 bg-amber-500 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-amber-600 transition"
                    data-testid="request-verification-btn"
                  >
                    <FaAward /> בקש אימות
                  </Link>
                )}
                {provider.is_recommended && (
                  <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm">
                    <FaAward /> מומלץ
                  </span>
                )}
                <Link
                  to={`/provider/edit/${provider.provider_id}`}
                  className="bg-carelink-teal text-white px-4 py-2 rounded-xl font-medium hover:bg-carelink-teal-medium transition flex items-center gap-2"
                  data-testid="edit-profile-btn"
                >
                  <FaEdit />
                  ערוך פרופיל
                </Link>
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
                    tab.link ? (
                      <Link
                        key={tab.id}
                        to={tab.link}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition text-carelink-gray hover:bg-carelink-teal-pale/30"
                      >
                        <tab.icon />
                        {tab.label}
                      </Link>
                    ) : (
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
                    )
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
                                      {getStatusLabel(booking.status)}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4">
                                    <div className="flex gap-2 flex-wrap">
                                      {booking.status === 'pending' && (
                                        <>
                                          <button
                                            onClick={() => {
                                              setConfirmDialog({
                                                isOpen: true,
                                                title: 'אישור הזמנה',
                                                message: `האם לאשר את ההזמנה של ${booking.user_name || 'הלקוח'} ל-${booking.service_name}?`,
                                                type: 'success',
                                                onConfirm: () => updateBookingStatus(booking.booking_id, 'confirmed')
                                              });
                                            }}
                                            className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-green-600 transition font-medium"
                                            data-testid={`confirm-booking-${booking.booking_id}`}
                                          >
                                            <FaCheckCircle className="inline ml-1" />
                                            אשר
                                          </button>
                                          <button
                                            onClick={() => {
                                              setConfirmDialog({
                                                isOpen: true,
                                                title: 'דחיית הזמנה',
                                                message: `האם לדחות את ההזמנה של ${booking.user_name || 'הלקוח'}?`,
                                                type: 'danger',
                                                onConfirm: () => updateBookingStatus(booking.booking_id, 'rejected')
                                              });
                                            }}
                                            className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-red-600 transition font-medium"
                                            data-testid={`reject-booking-${booking.booking_id}`}
                                          >
                                            <FaTimes className="inline ml-1" />
                                            דחה
                                          </button>
                                          <button
                                            onClick={() => updateBookingStatus(booking.booking_id, 'on_hold')}
                                            className="bg-gray-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-gray-600 transition font-medium"
                                            data-testid={`hold-booking-${booking.booking_id}`}
                                          >
                                            <FaHourglass className="inline ml-1" />
                                            השהה
                                          </button>
                                        </>
                                      )}
                                      {booking.status === 'confirmed' && (
                                        <button
                                          onClick={() => {
                                            setConfirmDialog({
                                              isOpen: true,
                                              title: 'סימון כהושלם',
                                              message: `האם לסמן את ההזמנה של ${booking.user_name || 'הלקוח'} כהושלמה? הלקוח יתבקש לאשר.`,
                                              type: 'warning',
                                              onConfirm: () => updateBookingStatus(booking.booking_id, 'provider_completed')
                                            });
                                          }}
                                          className="bg-purple-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-purple-600 transition font-medium"
                                          data-testid={`complete-booking-${booking.booking_id}`}
                                        >
                                          <FaCheckCircle className="inline ml-1" />
                                          סמן כהושלם
                                        </button>
                                      )}
                                      {booking.status === 'on_hold' && (
                                        <>
                                          <button
                                            onClick={() => updateBookingStatus(booking.booking_id, 'confirmed')}
                                            className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-green-600 transition font-medium"
                                          >
                                            אשר
                                          </button>
                                          <button
                                            onClick={() => updateBookingStatus(booking.booking_id, 'rejected')}
                                            className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-red-600 transition font-medium"
                                          >
                                            דחה
                                          </button>
                                        </>
                                      )}
                                      {(booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'rejected' || booking.status === 'provider_completed') && (
                                        <span className="text-xs text-gray-400">-</span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Calendar Tab */}
                  {activeTab === 'calendar' && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg" data-testid="provider-calendar">
                      <h3 className="text-xl font-bold text-carelink-navy mb-6 flex items-center gap-2">
                        <FaClock className="text-carelink-teal" />
                        לוח שנה - הזמנות מאושרות
                      </h3>
                      {getCalendarBookings().length === 0 ? (
                        <div className="text-center py-12 text-carelink-gray">
                          <FaCalendarAlt className="text-5xl mx-auto mb-3 text-carelink-teal-pale" />
                          <p className="text-lg">אין הזמנות מאושרות</p>
                          <p className="text-sm mt-2">כאשר תאשר הזמנות, הן יופיעו כאן בלוח השנה</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {groupBookingsByDate().map(([date, dayBookings]) => (
                            <div key={date} className="border-r-4 border-carelink-teal pr-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="bg-carelink-teal text-white px-4 py-2 rounded-xl text-sm font-bold">
                                  {new Date(date).toLocaleDateString('he-IL', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </div>
                                <span className="text-sm text-carelink-gray">
                                  {dayBookings.length} הזמנות
                                </span>
                              </div>
                              <div className="space-y-2">
                                {dayBookings.map(booking => (
                                  <div
                                    key={booking.booking_id}
                                    className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100 hover:bg-green-100/50 transition"
                                    data-testid={`calendar-booking-${booking.booking_id}`}
                                  >
                                    <div className="flex items-center gap-4">
                                      <div className="text-center min-w-[60px]">
                                        <div className="text-lg font-bold text-carelink-navy">
                                          {booking.booking_time || '--:--'}
                                        </div>
                                      </div>
                                      <div className="border-r border-green-200 pr-4">
                                        <p className="font-medium text-carelink-navy">{booking.user_name || 'לקוח'}</p>
                                        <p className="text-sm text-carelink-gray">{booking.service_name}</p>
                                        {booking.service_city && (
                                          <p className="text-xs text-carelink-gray flex items-center gap-1 mt-0.5">
                                            <FaMapMarkerAlt className="text-carelink-teal" />
                                            {booking.service_city}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      {booking.price && (
                                        <span className="text-sm font-bold text-carelink-teal">₪{booking.price}</span>
                                      )}
                                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                        {getStatusLabel(booking.status)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
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
                            <h4 className="font-bold text-carelink-navy mb-4 text-lg">
                              {editingService ? 'עריכת שירות' : 'שירות חדש'}
                            </h4>
                            <div className="space-y-6">
                              {/* Basic Info */}
                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                  <label className="block text-sm font-medium text-carelink-navy mb-2">שם השירות *</label>
                                  <input
                                    type="text"
                                    value={serviceForm.name}
                                    onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                                    placeholder="לדוגמה: טיפול פיזיותרפיה / שמירה פרטית"
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
                              </div>

                              {/* Service Category */}
                              <div className="bg-white p-4 rounded-xl">
                                <label className="block text-sm font-bold text-carelink-navy mb-3">קטגוריית שירות *</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {[
                                    { id: 'visit', name: 'שירות ביקור', icon: '🏠', desc: 'ביקור חד פעמי' },
                                    { id: 'hourly', name: 'שירות שעתי', icon: '⏰', desc: 'חיוב לפי שעות' },
                                    { id: 'consultation', name: 'ייעוץ', icon: '💬', desc: 'ייעוץ מקצועי' },
                                    { id: 'product', name: 'מוצר', icon: '📦', desc: 'מוצר למכירה' }
                                  ].map((cat) => (
                                    <button
                                      key={cat.id}
                                      type="button"
                                      onClick={() => setServiceForm({ 
                                        ...serviceForm, 
                                        service_category: cat.id,
                                        pricing_type: cat.id === 'hourly' ? 'per_hour' : cat.id === 'product' ? 'per_unit' : 'fixed'
                                      })}
                                      className={`p-4 rounded-xl border-2 text-center transition ${
                                        serviceForm.service_category === cat.id
                                          ? 'border-carelink-teal bg-carelink-teal/10'
                                          : 'border-gray-200 hover:border-carelink-teal/50'
                                      }`}
                                    >
                                      <span className="text-2xl">{cat.icon}</span>
                                      <p className="font-medium text-carelink-navy mt-1">{cat.name}</p>
                                      <p className="text-xs text-carelink-gray">{cat.desc}</p>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Delivery Types */}
                              <div className="bg-white p-4 rounded-xl">
                                <label className="block text-sm font-bold text-carelink-navy mb-3">היכן יינתן השירות?</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {[
                                    { id: 'home_visit', name: 'בבית', icon: '🏠' },
                                    { id: 'hospital', name: 'בי"ח/מוסד', icon: '🏥' },
                                    { id: 'clinic', name: 'בקליניקה', icon: '🏢' },
                                    { id: 'virtual', name: 'וירטואלי', icon: '💻' }
                                  ].map((dt) => (
                                    <button
                                      key={dt.id}
                                      type="button"
                                      onClick={() => {
                                        const current = serviceForm.delivery_types || [];
                                        const updated = current.includes(dt.id)
                                          ? current.filter(x => x !== dt.id)
                                          : [...current, dt.id];
                                        setServiceForm({ ...serviceForm, delivery_types: updated });
                                      }}
                                      className={`p-3 rounded-xl border-2 text-center transition ${
                                        (serviceForm.delivery_types || []).includes(dt.id)
                                          ? 'border-carelink-teal bg-carelink-teal/10'
                                          : 'border-gray-200 hover:border-carelink-teal/50'
                                      }`}
                                    >
                                      <span className="text-xl">{dt.icon}</span>
                                      <p className="font-medium text-carelink-navy text-sm mt-1">{dt.name}</p>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Pricing */}
                              <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-carelink-navy mb-2">
                                    מחיר (₪) * {serviceForm.service_category === 'hourly' && '(לשעה)'}
                                  </label>
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
                                {serviceForm.service_category === 'hourly' && (
                                  <div>
                                    <label className="block text-sm font-medium text-carelink-navy mb-2">מינימום שעות *</label>
                                    <input
                                      type="number"
                                      step="0.5"
                                      value={serviceForm.minimum_hours}
                                      onChange={(e) => setServiceForm({ ...serviceForm, minimum_hours: e.target.value })}
                                      className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                                      placeholder="לדוגמה: 8"
                                    />
                                    <p className="text-xs text-carelink-gray mt-1">למשל: שמירה פרטית - מינימום 8 שעות</p>
                                  </div>
                                )}
                              </div>

                              {/* Weekend Pricing */}
                              <div className="bg-amber-50 p-4 rounded-xl">
                                <div className="flex items-center justify-between mb-3">
                                  <label className="text-sm font-bold text-carelink-navy">תעריף שישי/שבת</label>
                                  <select
                                    value={serviceForm.weekend_pricing_type}
                                    onChange={(e) => setServiceForm({ ...serviceForm, weekend_pricing_type: e.target.value })}
                                    className="px-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white"
                                  >
                                    <option value="none">ללא תוספת</option>
                                    <option value="percentage">תוספת באחוזים</option>
                                    <option value="fixed">תוספת קבועה</option>
                                  </select>
                                </div>
                                {serviceForm.weekend_pricing_type !== 'none' && (
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="number"
                                      value={serviceForm.weekend_price_addition}
                                      onChange={(e) => setServiceForm({ ...serviceForm, weekend_price_addition: e.target.value })}
                                      className="flex-1 px-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:border-amber-400"
                                      placeholder={serviceForm.weekend_pricing_type === 'percentage' ? '25' : '50'}
                                    />
                                    <span className="text-amber-700 font-medium">
                                      {serviceForm.weekend_pricing_type === 'percentage' ? '%' : '₪'}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Travel Cost */}
                              {serviceForm.service_category !== 'product' && (
                                <div className="bg-blue-50 p-4 rounded-xl">
                                  <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={serviceForm.has_travel_cost}
                                      onChange={(e) => setServiceForm({ ...serviceForm, has_travel_cost: e.target.checked })}
                                      className="w-5 h-5 text-blue-500 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-bold text-carelink-navy">עלות נסיעה</span>
                                  </label>
                                  {serviceForm.has_travel_cost && (
                                    <div className="mt-3 flex items-center gap-3">
                                      <input
                                        type="number"
                                        value={serviceForm.travel_cost}
                                        onChange={(e) => setServiceForm({ ...serviceForm, travel_cost: e.target.value })}
                                        className="flex-1 px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:border-blue-400"
                                        placeholder="עלות נסיעה"
                                      />
                                      <span className="text-blue-700 font-medium">₪</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Shipping (for products) */}
                              {serviceForm.service_category === 'product' && (
                                <div className="bg-purple-50 p-4 rounded-xl space-y-3">
                                  <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={serviceForm.has_shipping}
                                      onChange={(e) => setServiceForm({ ...serviceForm, has_shipping: e.target.checked })}
                                      className="w-5 h-5 text-purple-500 rounded border-gray-300 focus:ring-purple-500"
                                    />
                                    <span className="text-sm font-bold text-carelink-navy">אפשרות משלוח</span>
                                  </label>
                                  {serviceForm.has_shipping && (
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs text-purple-700 mb-1">עלות משלוח (₪)</label>
                                        <input
                                          type="number"
                                          value={serviceForm.shipping_cost}
                                          onChange={(e) => setServiceForm({ ...serviceForm, shipping_cost: e.target.value })}
                                          className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:border-purple-400"
                                          placeholder="30"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-purple-700 mb-1">משלוח חינם מעל (₪)</label>
                                        <input
                                          type="number"
                                          value={serviceForm.free_shipping_above}
                                          onChange={(e) => setServiceForm({ ...serviceForm, free_shipping_above: e.target.value })}
                                          className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:border-purple-400"
                                          placeholder="200"
                                        />
                                      </div>
                                    </div>
                                  )}
                                  <div>
                                    <label className="block text-xs text-purple-700 mb-1">כמות במלאי</label>
                                    <input
                                      type="number"
                                      value={serviceForm.stock_quantity}
                                      onChange={(e) => setServiceForm({ ...serviceForm, stock_quantity: e.target.value })}
                                      className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:border-purple-400"
                                      placeholder="100"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex gap-3 pt-2">
                                <button
                                  onClick={handleSaveService}
                                  disabled={saving}
                                  className="bg-carelink-teal text-white px-6 py-3 rounded-xl font-medium hover:bg-carelink-teal-medium transition flex items-center gap-2 disabled:opacity-50"
                                >
                                  <FaSave />
                                  {saving ? 'שומר...' : 'שמור שירות'}
                                </button>
                                <button
                                  onClick={resetServiceForm}
                                  className="bg-gray-200 text-carelink-navy px-6 py-3 rounded-xl font-medium hover:bg-gray-300 transition"
                                >
                                  ביטול
                                </button>
                              </div>
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
                              const categoryIcons = {
                                visit: '🏠',
                                hourly: '⏰',
                                consultation: '💬',
                                product: '📦'
                              };
                              const categoryNames = {
                                visit: 'שירות ביקור',
                                hourly: 'שירות שעתי',
                                consultation: 'ייעוץ',
                                product: 'מוצר'
                              };
                              const deliveryNames = {
                                home_visit: 'בבית',
                                hospital: 'בי"ח',
                                clinic: 'קליניקה',
                                virtual: 'וירטואלי'
                              };
                              return (
                                <div key={service.service_id} className="border-2 border-carelink-teal-pale rounded-xl p-5 hover:border-carelink-teal transition">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 bg-carelink-teal-pale rounded-xl flex items-center justify-center text-2xl">
                                        {categoryIcons[service.service_category] || '📋'}
                                      </div>
                                      <div>
                                        <h4 className="font-bold text-carelink-navy">{service.name}</h4>
                                        <span className="text-xs bg-carelink-navy text-white px-2 py-0.5 rounded-full">
                                          {categoryNames[service.service_category] || service.service_category}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-left">
                                      <span className="text-2xl font-bold text-carelink-teal">₪{service.price}</span>
                                      {service.service_category === 'hourly' && (
                                        <span className="block text-xs text-carelink-gray">/שעה</span>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-sm text-carelink-gray mb-3 line-clamp-2">{service.description || 'ללא תיאור'}</p>
                                  
                                  {/* Service details badges */}
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {service.delivery_types?.length > 0 && service.delivery_types.map((dt) => (
                                      <span key={dt} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                                        {deliveryNames[dt] || dt}
                                      </span>
                                    ))}
                                    {service.minimum_hours && (
                                      <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">
                                        מינ׳ {service.minimum_hours} שעות
                                      </span>
                                    )}
                                    {service.weekend_pricing_type !== 'none' && service.weekend_price_addition && (
                                      <span className="text-xs bg-amber-100 text-amber-600 px-2 py-1 rounded">
                                        שבת: +{service.weekend_price_addition}{service.weekend_pricing_type === 'percentage' ? '%' : '₪'}
                                      </span>
                                    )}
                                    {service.has_travel_cost && (
                                      <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                                        נסיעה: ₪{service.travel_cost}
                                      </span>
                                    )}
                                    {service.has_shipping && (
                                      <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
                                        משלוח: ₪{service.shipping_cost}
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                    {service.duration_minutes ? (
                                      <span className="text-xs text-carelink-gray flex items-center gap-1">
                                        <FaClock />
                                        {service.duration_minutes} דקות
                                      </span>
                                    ) : <span></span>}
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleEditService(service)}
                                        className="text-carelink-teal hover:text-carelink-teal-medium p-2 hover:bg-carelink-teal/10 rounded-lg transition"
                                      >
                                        <FaEdit />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteService(service.service_id)}
                                        className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition"
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

                  {/* Messages Tab */}
                  {activeTab === 'messages' && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <h3 className="text-xl font-bold text-carelink-navy mb-6 flex items-center gap-2">
                        <FaComments className="text-carelink-teal" />
                        שיחות צ'אט
                      </h3>
                      {chats.length === 0 ? (
                        <div className="text-center py-12">
                          <FaComments className="text-5xl text-carelink-teal-pale mx-auto mb-4" />
                          <p className="text-carelink-gray">אין שיחות עדיין</p>
                          <p className="text-sm text-carelink-gray mt-2">כאשר לקוחות יפנו אליכם, השיחות יופיעו כאן</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {chats.map((chat) => (
                            <Link
                              key={chat.room_id}
                              to={`/chat/${chat.room_id}`}
                              className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-carelink-teal-pale/30 rounded-xl transition group"
                            >
                              <div className="w-12 h-12 bg-carelink-navy rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {(chat.other_user?.name || chat.provider?.business_name || 'M')[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="font-semibold text-carelink-navy group-hover:text-carelink-teal transition">
                                    {chat.other_user?.name || chat.provider?.business_name || 'משתמש'}
                                  </p>
                                  <span className="text-xs text-carelink-gray">
                                    {chat.last_message?.created_at 
                                      ? new Date(chat.last_message.created_at).toLocaleDateString('he-IL')
                                      : ''}
                                  </span>
                                </div>
                                <p className="text-sm text-carelink-gray truncate">
                                  {chat.last_message?.content || 'לחצו כדי להתחיל שיחה'}
                                </p>
                              </div>
                              {chat.unread_count > 0 && (
                                <span className="bg-carelink-teal text-white text-xs font-bold px-2 py-1 rounded-full">
                                  {chat.unread_count}
                                </span>
                              )}
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
                  {activeTab === 'provider_profile' && (
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

                      {/* Advanced Profile Link */}
                      <div className="bg-gradient-to-r from-carelink-teal-pale/50 to-blue-50 p-6 rounded-2xl border border-carelink-teal/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-carelink-navy mb-1">עריכת פרופיל מתקדמת</h3>
                            <p className="text-sm text-carelink-gray">
                              עדכן השכלה, תעודות, קופות חולים, אמצעי תשלום, מדיניות ביטולים והגדרות פרטיות
                            </p>
                          </div>
                          <Link
                            to={`/provider/edit/${provider?.provider_id}`}
                            className="bg-carelink-teal text-white px-6 py-3 rounded-xl font-medium hover:bg-carelink-teal-medium transition flex items-center gap-2"
                          >
                            <FaEdit />
                            עריכה מתקדמת
                          </Link>
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
                    <div className="space-y-6">
                      {/* Push Notification Settings */}
                      <NotificationSettings />
                      
                      {/* Provider-specific Settings */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-bold text-carelink-navy mb-6">הגדרות ספק</h3>
                        <div className="space-y-4">
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
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div>
                              <p className="font-medium text-carelink-navy">קבלת הזמנות אורחים</p>
                              <p className="text-sm text-carelink-gray">אפשר הזמנות ממשתמשים לא רשומים</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" defaultChecked />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-carelink-teal"></div>
                            </label>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div>
                              <p className="font-medium text-carelink-navy">אישור אוטומטי</p>
                              <p className="text-sm text-carelink-gray">אשר הזמנות אוטומטית (ללא אישור ידני)</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-carelink-teal"></div>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Account Settings */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-bold text-carelink-navy mb-6">הגדרות חשבון</h3>
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-medium text-carelink-navy mb-2">שם העסק</label>
                            <input
                              type="text"
                              defaultValue={provider?.business_name}
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
                              defaultValue={provider?.phone}
                              placeholder="050-0000000"
                              className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                            />
                          </div>
                          <button className="bg-carelink-teal text-white px-6 py-3 rounded-xl font-medium hover:bg-carelink-teal-medium transition">
                            שמור שינויים
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* User Info Tab - Personal Details */}
                  {activeTab === 'user_info' && (
                    <div className="space-y-6">
                      {/* Personal Info */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-bold text-carelink-navy mb-6 flex items-center gap-2">
                          <FaUser className="text-carelink-teal" />
                          פרטים אישיים
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-carelink-navy mb-2">שם פרטי</label>
                            <input
                              type="text"
                              value={userInfoForm.first_name}
                              onChange={(e) => setUserInfoForm({ ...userInfoForm, first_name: e.target.value })}
                              className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                              placeholder="שם פרטי"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-carelink-navy mb-2">שם משפחה</label>
                            <input
                              type="text"
                              value={userInfoForm.last_name}
                              onChange={(e) => setUserInfoForm({ ...userInfoForm, last_name: e.target.value })}
                              className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                              placeholder="שם משפחה"
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
                            <label className="block text-sm font-medium text-carelink-navy mb-2">טלפון אישי</label>
                            <input
                              type="tel"
                              value={userInfoForm.personal_phone}
                              onChange={(e) => setUserInfoForm({ ...userInfoForm, personal_phone: e.target.value })}
                              className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                              placeholder="050-0000000"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-carelink-navy mb-2">אימייל</label>
                            <input
                              type="email"
                              value={userInfoForm.personal_email}
                              disabled
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                            />
                            <p className="text-xs text-carelink-gray mt-1">לא ניתן לשנות את כתובת האימייל</p>
                          </div>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-bold text-carelink-navy mb-6 flex items-center gap-2">
                          <FaHome className="text-carelink-teal" />
                          כתובת מגורים
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-carelink-navy mb-2">עיר</label>
                            <input
                              type="text"
                              value={userInfoForm.personal_city}
                              onChange={(e) => setUserInfoForm({ ...userInfoForm, personal_city: e.target.value })}
                              className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                              placeholder="תל אביב"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-carelink-navy mb-2">כתובת</label>
                            <input
                              type="text"
                              value={userInfoForm.personal_address}
                              onChange={(e) => setUserInfoForm({ ...userInfoForm, personal_address: e.target.value })}
                              className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                              placeholder="רחוב, מספר בית"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Save Personal Info Button */}
                      <div className="flex justify-end">
                        <button
                          onClick={handleSaveUserInfo}
                          disabled={saving}
                          className="bg-carelink-teal text-white px-8 py-3 rounded-xl font-semibold hover:bg-carelink-teal-medium transition flex items-center gap-2 disabled:opacity-50"
                        >
                          <FaSave />
                          {saving ? 'שומר...' : 'שמור פרטים אישיים'}
                        </button>
                      </div>

                      {/* Password Change */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-bold text-carelink-navy mb-6 flex items-center gap-2">
                          <FaCog className="text-carelink-teal" />
                          שינוי סיסמה
                        </h3>
                        <div className="space-y-4 max-w-md">
                          <div>
                            <label className="block text-sm font-medium text-carelink-navy mb-2">סיסמה נוכחית</label>
                            <input
                              type="password"
                              value={userInfoForm.current_password}
                              onChange={(e) => setUserInfoForm({ ...userInfoForm, current_password: e.target.value })}
                              className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                              placeholder="הזן סיסמה נוכחית"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-carelink-navy mb-2">סיסמה חדשה</label>
                            <input
                              type="password"
                              value={userInfoForm.new_password}
                              onChange={(e) => setUserInfoForm({ ...userInfoForm, new_password: e.target.value })}
                              className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                              placeholder="הזן סיסמה חדשה (לפחות 6 תווים)"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-carelink-navy mb-2">אימות סיסמה חדשה</label>
                            <input
                              type="password"
                              value={userInfoForm.confirm_password}
                              onChange={(e) => setUserInfoForm({ ...userInfoForm, confirm_password: e.target.value })}
                              className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal focus:outline-none"
                              placeholder="הזן שוב את הסיסמה החדשה"
                            />
                          </div>
                          <button
                            onClick={handleChangePassword}
                            disabled={saving}
                            className="bg-amber-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-amber-600 transition flex items-center gap-2 disabled:opacity-50"
                          >
                            {saving ? 'מעדכן...' : 'עדכן סיסמה'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Verification Tab */}
                  {activeTab === 'verification' && (
                    <VerificationDocuments />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
      
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText="אישור"
        cancelText="ביטול"
      />
    </div>
  );
};

export default ProviderDashboard;
