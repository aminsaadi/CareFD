"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import Navbar // Navbar in layout;
import Footer // Footer in layout;
import VerificationDocuments from '@/components/VerificationDocuments' // TODO;
import NotificationSettings from '@/components/NotificationSettings' // TODO;
import ConfirmDialog from '@/components/ConfirmDialog' // TODO;
import ProviderSubscription from '@/components/provider-ProviderSubscription';
import ProviderClinics from '@/components/provider-ProviderClinics';
import ProviderTeam from '@/components/provider-ProviderTeam';
import BookingDetailsModal from '@/components/provider-BookingDetailsModal';
import CitySelect from '@/components/CitySelect' // TODO;
import api from '@/lib/api-client';
import { toast } from 'sonner';
import { 
  FaCalendarAlt, FaComments, FaFileAlt, FaStar, FaUser, FaCog,
  FaChevronLeft, FaPlus, FaMapMarkerAlt, FaClock, FaCheckCircle,
  FaHourglass, FaTimes, FaEdit, FaChartBar, FaMoneyBillWave,
  FaUsers, FaEye, FaEyeSlash, FaBriefcase, FaPhone, FaEnvelope, FaTrash,
  FaHome, FaVideo, FaClinicMedical, FaPhoneAlt, FaSave, FaAward,
  FaWhatsapp, FaBell, FaCrown, FaBuilding,
  FaSort, FaChevronDown, FaChevronUp
} from 'react-icons/fa';

// Service type config
const serviceTypeOptions = [
  { value: 'home_visit', label: 'ביקור בית', icon: FaHome },
  { value: 'clinic_visit', label: 'ביקור במרפאה', icon: FaClinicMedical },
  { value: 'video_call', label: 'טלרפואה', icon: FaVideo },
  { value: 'phone_call', label: 'שיחה טלפונית', icon: FaPhoneAlt }
];


const ProviderDashboard = () => {

  const { user } = useAuth();
  const router = useRouter();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [provider, setProvider] = useState(null);
  const [professions, setProfessions] = useState([]); // Admin hierarchy for service categories
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [requests, setRequests] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [expandedBookings, setExpandedBookings] = useState({});
  const [bookingSortBy, setBookingSortBy] = useState('date_desc');
  const [showPw, setShowPw] = useState({ current: false, new_pw: false, confirm: false });
  
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
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    price: '',
    duration_minutes: '',
    // New fields
    service_category: 'visit',
    categories: [], // [{category_id, name, profession_id, profession_name}] - max 3
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
    fetchProfessions();
  }, []);

  const fetchProfessions = async () => {
    try {
      const response = await api.get('/professions');
      setProfessions(data.professions || []);
    } catch (err) {
      console.error('Failed to fetch professions:', err);
    }
  };

  useEffect(() => {
    if (provider) {
      // Profile editing is handled in /provider/edit
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

      // Fetch my offers
      try {
        const myOffersRes = await api.get('/offers/my');
        setMyOffers(myOffersRes.data.offers || []);
      } catch (e) {
        console.error('Failed to fetch offers:', e);
        toast.error('שגיאה בטעינת ההצעות');
      }

      // Fetch reviews
      if (providerRes.data?.provider_id) {
        try {
          const reviewsRes = await api.get(`/providers/${providerRes.data.provider_id}/reviews`);
          setReviews(reviewsRes.data.reviews || []);
        } catch (reviewErr) {
          console.error('Failed to fetch reviews:', reviewErr);
        }
      }

      // Fetch chats
      try {
        const chatsRes = await api.get('/chat/rooms');
        setChats(chatsRes.data.rooms || []);
      } catch (chatError) {
        console.error('Failed to fetch chats:', chatError);
        toast.error('שגיאה בטעינת הודעות');
      }

      // Calculate stats
      const completed = providerBookings.filter(b => b.status === 'completed');
      setStats({
        totalBookings: providerBookings.length,
        pendingBookings: providerBookings.filter(b => b.status === 'pending').length,
        completedBookings: completed.length,
        totalEarnings: completed.reduce((acc, b) => acc + (parseFloat(b.final_price || b.base_price) || 0), 0),
        averageRating: providerRes.data?.rating || 0,
        totalReviews: providerRes.data?.total_reviews || 0,
        profileViews: providerRes.data?.views_count || 0
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('שגיאה בטעינת נתוני הדשבורד');
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
        'cancelled': `/bookings/${bookingId}/cancel`
      };

      const endpoint = endpointMap[status] || `/bookings/${bookingId}/status`;
      await api.put(endpoint, status === 'cancelled' ? { reason: 'ביטול על ידי הספק' } : {});
      
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

  const handleCancellationResponse = async (bookingId, action) => {
    try {
      await api.put(`/bookings/${bookingId}/${action}-cancellation`);
      toast.success(action === 'approve' ? 'בקשת הביטול אושרה' : 'בקשת הביטול נדחתה');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'שגיאה בעדכון');
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
      categories: [],
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
      categories: service.categories || [],
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

    if (!serviceForm.service_category) {
      toast.error('נא לבחור סוג שירות');
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
        categories: serviceForm.categories || [],
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
    { id: 'my_offers', label: 'ההצעות שלי', icon: FaMoneyBillWave },
    { id: 'notifications', label: 'התראות', icon: FaBell, link: '/notifications' },
    { id: 'messages', label: 'הודעות', icon: FaComments },
    { id: 'reviews', label: 'ביקורות', icon: FaStar },
    { id: 'user_info', label: 'פרטי משתמש', icon: FaUser },
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
      case 'cancellation_requested': return 'bg-orange-100 text-orange-600';
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
      cancellation_requested: 'בקשת ביטול מלקוח',
      rejected: 'נדחה',
      on_hold: 'בהשהיה'
    };
    return labels[status] || status;
  };

  const toggleBookingExpand = (bookingId) => {
    setExpandedBookings(prev => ({ ...prev, [bookingId]: !prev[bookingId] }));
  };

  const getSortedBookings = () => {
    const sorted = [...bookings];
    switch (bookingSortBy) {
      case 'date_desc': return sorted.sort((a, b) => new Date(b.created_at || b.booking_date) - new Date(a.created_at || a.booking_date));
      case 'date_asc': return sorted.sort((a, b) => new Date(a.created_at || a.booking_date) - new Date(b.created_at || b.booking_date));
      case 'status': {
        const order = { cancellation_requested: 0, pending: 1, confirmed: 2, in_progress: 3, provider_completed: 4, on_hold: 5, completed: 6, cancelled: 7, rejected: 8 };
        return sorted.sort((a, b) => (order[a.status] ?? 99) - (order[b.status] ?? 99));
      }
      case 'price_desc': return sorted.sort((a, b) => (b.final_price || b.price || 0) - (a.final_price || a.price || 0));
      default: return sorted;
    }
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
    <div className="min-h-screen bg-gradient-to-b from-white to-carefd-teal-pale/30 flex flex-col">
      
      
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-carefd-navy font-heading mb-2">
                שלום, {provider?.business_name || user?.name}! 👋
              </h1>
              <p className="text-carefd-gray">ניהול העסק שלך</p>
            </div>
            {provider && (
              <div className="flex items-center gap-3 flex-wrap">
                {provider.is_verified ? (
                  <span className="inline-flex items-center gap-1 bg-carefd-teal text-white px-3 py-1 rounded-full text-sm">
                    <FaCheckCircle /> מאומת
                  </span>
                ) : (
                  <Link
                    href="/verify-account"
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
                  href={`/provider/edit/${provider.provider_id}`}
                  className="bg-carefd-teal text-white px-4 py-2 rounded-xl font-medium hover:bg-carefd-teal-medium transition flex items-center gap-2"
                  data-testid="edit-profile-btn"
                >
                  <FaEdit />
                  ערוך פרופיל
                </Link>
                <Link
                  href={`/providers/${provider.provider_id}`}
                  className="bg-carefd-navy text-white px-4 py-2 rounded-xl font-medium hover:bg-carefd-slate transition flex items-center gap-2"
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
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition text-carefd-gray hover:bg-carefd-teal-pale/30"
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
                            ? 'bg-carefd-teal text-white'
                            : 'text-carefd-gray hover:bg-carefd-teal-pale/30'
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
                  <div className="w-12 h-12 border-4 border-carefd-teal border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <>
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Free tier upgrade banner */}
                      {(!provider?.subscription_tier || provider?.subscription_tier === 'free') && (
                        <div className="bg-gradient-to-l from-blue-500 to-blue-600 rounded-2xl p-5 text-white flex flex-col md:flex-row items-center justify-between gap-4" data-testid="overview-upgrade-banner">
                          <div className="flex items-center gap-4">
                            <FaCrown className="text-3xl text-yellow-300" />
                            <div>
                              <h3 className="text-lg font-bold">שדרג את הפרופיל שלך לפרו!</h3>
                              <p className="text-blue-100 text-sm">30 יום ניסיון חינם - פרופיל מקודם, שירותים ללא הגבלה, תווית מומלץ</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setActiveTab('subscription')}
                            className="bg-white text-blue-600 px-6 py-2.5 rounded-xl font-bold hover:bg-blue-50 transition whitespace-nowrap"
                            data-testid="overview-upgrade-btn"
                          >
                            נסה חינם 30 יום
                          </button>
                        </div>
                      )}
                      
                      {/* Stats Cards */}
                      <div className="grid md:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                              <FaCalendarAlt className="text-blue-600 text-xl" />
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-carefd-navy">{stats.totalBookings}</div>
                              <div className="text-sm text-carefd-gray">תורים</div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                              <FaMoneyBillWave className="text-green-600 text-xl" />
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-carefd-navy">₪{stats.totalEarnings}</div>
                              <div className="text-sm text-carefd-gray">הכנסות</div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                              <FaStar className="text-yellow-600 text-xl" />
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-carefd-navy">{(stats.averageRating || 0).toFixed(1)}</div>
                              <div className="text-sm text-carefd-gray">{stats.totalReviews} ביקורות</div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                              <FaEye className="text-purple-600 text-xl" />
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-carefd-navy">{stats.profileViews}</div>
                              <div className="text-sm text-carefd-gray">צפיות בפרופיל</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Pending Bookings */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-carefd-navy">
                            תורים ממתינים לאישור ({stats.pendingBookings})
                          </h3>
                          <button
                            onClick={() => setActiveTab('bookings')}
                            className="text-carefd-teal font-medium flex items-center gap-1"
                          >
                            צפה בכל
                            <FaChevronLeft className="rtl:rotate-180" />
                          </button>
                        </div>
                        {bookings.filter(b => b.status === 'pending').length === 0 ? (
                          <div className="text-center py-6 text-carefd-gray">
                            <FaCheckCircle className="text-3xl mx-auto mb-2 text-green-500" />
                            <p>אין תורים ממתינים</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {bookings.filter(b => b.status === 'pending').sort((a, b) => new Date(b.created_at || b.booking_date) - new Date(a.created_at || a.booking_date)).slice(0, 3).map((booking) => (
                              <div key={booking.booking_id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                                <div>
                                  <p className="font-medium text-carefd-navy">{booking.user_name || 'לקוח'}</p>
                                  <p className="text-sm text-carefd-gray">
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
                          <h3 className="text-lg font-bold text-carefd-navy mb-4">שירותים פעילים</h3>
                          <div className="text-4xl font-bold text-carefd-teal mb-2">{services.length}</div>
                          <button
                            onClick={() => setActiveTab('services')}
                            className="text-carefd-teal font-medium text-sm"
                          >
                            נהל שירותים →
                          </button>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                          <h3 className="text-lg font-bold text-carefd-navy mb-4">בקשות פתוחות</h3>
                          <div className="text-4xl font-bold text-carefd-teal mb-2">{requests.length}</div>
                          <button
                            onClick={() => setActiveTab('requests')}
                            className="text-carefd-teal font-medium text-sm"
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
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <h3 className="text-xl font-bold text-carefd-navy">ניהול תורים</h3>
                        <div className="relative">
                          <select
                            value={bookingSortBy}
                            onChange={(e) => setBookingSortBy(e.target.value)}
                            className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 pr-10 text-sm font-medium text-carefd-navy cursor-pointer hover:border-carefd-teal transition focus:outline-none focus:ring-2 focus:ring-carefd-teal/30"
                            data-testid="provider-booking-sort-select"
                          >
                            <option value="date_desc">חדש ← ישן</option>
                            <option value="date_asc">ישן ← חדש</option>
                            <option value="status">לפי סטטוס</option>
                            <option value="price_desc">לפי מחיר</option>
                          </select>
                          <FaSort className="absolute left-3 top-1/2 -translate-y-1/2 text-carefd-gray pointer-events-none text-xs" />
                        </div>
                      </div>
                      {bookings.length === 0 ? (
                        <div className="text-center py-12 text-carefd-gray">
                          <FaCalendarAlt className="text-5xl mx-auto mb-3 text-carefd-teal-pale" />
                          <p className="text-lg">אין תורים עדיין</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {getSortedBookings().map((booking) => {
                            const isExpanded = expandedBookings[booking.booking_id];
                            return (
                            <div
                              key={booking.booking_id}
                              className={`border-2 rounded-xl transition-all duration-200 overflow-hidden ${isExpanded ? 'border-carefd-teal shadow-md' : 'border-carefd-teal-pale hover:border-carefd-teal/40'}`}
                              data-testid={`provider-booking-card-${booking.booking_id}`}
                            >
                              {/* Collapsed Header */}
                              <div
                                className="flex items-center justify-between gap-3 p-4 cursor-pointer select-none"
                                onClick={() => toggleBookingExpand(booking.booking_id)}
                                data-testid={`provider-booking-toggle-${booking.booking_id}`}
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="w-10 h-10 bg-carefd-navy/10 rounded-xl flex items-center justify-center text-carefd-navy font-bold text-sm flex-shrink-0">
                                    {(booking.user_name || 'ל')[0]}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-bold text-carefd-navy text-sm">{booking.user_name || 'לקוח'}</h4>
                                      <span className="text-xs text-carefd-gray">•</span>
                                      <span className="text-xs text-carefd-gray">{booking.service_name || 'שירות'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-0.5 text-xs text-carefd-gray">
                                      <span className="flex items-center gap-1">
                                        <FaCalendarAlt className="text-carefd-teal" />
                                        {booking.booking_date ? new Date(booking.booking_date).toLocaleDateString('he-IL') : 'יתואם'}
                                      </span>
                                      {booking.booking_time && (
                                        <span className="flex items-center gap-1">
                                          <FaClock className="text-carefd-teal" />
                                          {booking.booking_time}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                    {getStatusLabel(booking.status)}
                                  </span>
                                  {isExpanded ? <FaChevronUp className="text-carefd-gray text-xs" /> : <FaChevronDown className="text-carefd-gray text-xs" />}
                                </div>
                              </div>

                              {/* Expanded Content */}
                              {isExpanded && (
                                <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                                      <p className="text-xs text-carefd-gray">תאריך</p>
                                      <p className="font-medium text-sm text-carefd-navy">{booking.booking_date ? new Date(booking.booking_date).toLocaleDateString('he-IL') : 'יתואם'}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                                      <p className="text-xs text-carefd-gray">שעה</p>
                                      <p className="font-medium text-sm text-carefd-navy">{booking.booking_time || 'יתואם'}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                                      <p className="text-xs text-carefd-gray">מחיר</p>
                                      <p className="font-medium text-sm text-green-600">{booking.final_price ? `₪${booking.final_price}` : 'יתואם'}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                                      <p className="text-xs text-carefd-gray">סוג</p>
                                      <p className="font-medium text-sm text-carefd-navy">{booking.delivery_type || booking.service_type || '-'}</p>
                                    </div>
                                  </div>
                                  {booking.notes && (
                                    <div className="bg-blue-50 rounded-lg p-3 mb-4 text-sm text-carefd-navy">
                                      <span className="font-medium">הערות: </span>{booking.notes}
                                    </div>
                                  )}
                                  <div className="flex flex-wrap items-center gap-2">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setSelectedBooking(booking); }}
                                      className="bg-carefd-navy/10 text-carefd-navy px-3 py-1.5 rounded-lg text-xs hover:bg-carefd-navy/20 transition font-medium flex items-center gap-1"
                                      data-testid={`view-booking-${booking.booking_id}`}
                                    >
                                      <FaEye className="text-xs" />
                                      פרטים מלאים
                                    </button>
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          const res = await api.post('/chat/rooms', {
                                            user_id: booking.user_id,
                                            provider_id: provider.provider_id,
                                            booking_id: booking.booking_id
                                          });
                                          if (res.data?.room_id) {
                                            router.push(`/chat/${res.data.room_id}`);
                                          } else {
                                            toast.error('שגיאה בקבלת מזהה הצ\'אט');
                                          }
                                        } catch { toast.error('שגיאה ביצירת צ\'אט'); }
                                      }}
                                      className="bg-carefd-teal/10 text-carefd-teal px-3 py-1.5 rounded-lg text-xs hover:bg-carefd-teal/20 transition font-medium flex items-center gap-1"
                                      data-testid={`contact-user-${booking.booking_id}`}
                                    >
                                      <FaComments className="text-xs" />
                                      צור קשר
                                    </button>

                                    {booking.status === 'pending' && (
                                      <>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
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
                                          <FaCheckCircle className="inline ms-1" />
                                          אשר
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
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
                                          <FaTimes className="inline ms-1" />
                                          דחה
                                        </button>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); updateBookingStatus(booking.booking_id, 'on_hold'); }}
                                          className="bg-gray-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-gray-600 transition font-medium"
                                          data-testid={`hold-booking-${booking.booking_id}`}
                                        >
                                          <FaHourglass className="inline ms-1" />
                                          השהה
                                        </button>
                                      </>
                                    )}
                                    {booking.status === 'confirmed' && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
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
                                        <FaCheckCircle className="inline ms-1" />
                                        סמן כהושלם
                                      </button>
                                    )}
                                    {booking.status === 'on_hold' && (
                                      <>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); updateBookingStatus(booking.booking_id, 'confirmed'); }}
                                          className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-green-600 transition font-medium"
                                        >
                                          אשר
                                        </button>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); updateBookingStatus(booking.booking_id, 'rejected'); }}
                                          className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-red-600 transition font-medium"
                                        >
                                          דחה
                                        </button>
                                      </>
                                    )}
                                    {booking.status === 'cancellation_requested' && (
                                      <>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setConfirmDialog({
                                              isOpen: true,
                                              title: 'אישור ביטול הזמנה',
                                              message: `הלקוח ${booking.user_name || ''} מבקש לבטל את ההזמנה ל-${booking.service_name || 'שירות'}. האם לאשר?`,
                                              type: 'warning',
                                              onConfirm: () => handleCancellationResponse(booking.booking_id, 'approve')
                                            });
                                          }}
                                          className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-orange-600 transition font-medium"
                                        >
                                          <FaCheckCircle className="inline ms-1" />
                                          אשר ביטול
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setConfirmDialog({
                                              isOpen: true,
                                              title: 'דחיית בקשת ביטול',
                                              message: `האם לדחות את בקשת הביטול של ${booking.user_name || 'הלקוח'}?`,
                                              type: 'danger',
                                              onConfirm: () => handleCancellationResponse(booking.booking_id, 'reject')
                                            });
                                          }}
                                          className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-red-600 transition font-medium"
                                        >
                                          <FaTimes className="inline ms-1" />
                                          דחה ביטול
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Calendar Tab */}
                  {activeTab === 'calendar' && (
                    <div className="space-y-6">
                    {/* Availability Section */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <h3 className="text-xl font-bold text-carefd-navy mb-4 flex items-center gap-2">
                        <FaCalendarAlt className="text-carefd-teal" />
                        שעות פעילות
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'].map((day, idx) => {
                          const avail = provider?.availability?.[idx] || {};
                          return (
                            <div key={day} className={`flex items-center justify-between p-3 rounded-xl border ${avail.is_active !== false ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                              <span className="font-medium text-carefd-navy w-16">{day}</span>
                              {avail.is_active !== false ? (
                                <span className="text-sm text-green-700 font-medium" dir="ltr">
                                  {avail.start || '09:00'} - {avail.end || '17:00'}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">סגור</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-carefd-gray mt-3">
                        לעריכת שעות פעילות, עבור ל<Link href={`/provider/edit/${provider?.provider_id}`} className="text-carefd-teal hover:underline">עריכת פרופיל</Link> &gt; זמינות
                      </p>
                    </div>

                    {/* Bookings Calendar */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg" data-testid="provider-calendar">
                      <h3 className="text-xl font-bold text-carefd-navy mb-6 flex items-center gap-2">
                        <FaClock className="text-carefd-teal" />
                        הזמנות מאושרות
                      </h3>
                      {getCalendarBookings().length === 0 ? (
                        <div className="text-center py-12 text-carefd-gray">
                          <FaCalendarAlt className="text-5xl mx-auto mb-3 text-carefd-teal-pale" />
                          <p className="text-lg">אין הזמנות מאושרות</p>
                          <p className="text-sm mt-2">כאשר תאשר הזמנות, הן יופיעו כאן בלוח השנה</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {groupBookingsByDate().map(([date, dayBookings]) => (
                            <div key={date} className="border-s-4 border-carefd-teal ps-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="bg-carefd-teal text-white px-4 py-2 rounded-xl text-sm font-bold">
                                  {new Date(date).toLocaleDateString('he-IL', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </div>
                                <span className="text-sm text-carefd-gray">
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
                                        <div className="text-lg font-bold text-carefd-navy">
                                          {booking.booking_time || '--:--'}
                                        </div>
                                      </div>
                                      <div className="border-r border-green-200 pr-4">
                                        <p className="font-medium text-carefd-navy">{booking.user_name || 'לקוח'}</p>
                                        <p className="text-sm text-carefd-gray">{booking.service_name}</p>
                                        {(booking.service_location?.city || booking.service_city) && (
                                          <p className="text-xs text-carefd-gray flex items-center gap-1 mt-0.5">
                                            <FaMapMarkerAlt className="text-carefd-teal" />
                                            {booking.service_location?.city || booking.service_city}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      {(booking.final_price || booking.base_price) && (
                                        <span className="text-sm font-bold text-carefd-teal">₪{booking.final_price || booking.base_price}</span>
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
                    </div>
                  )}

                  {/* Subscription Tab */}
                  {activeTab === 'subscription' && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <ProviderSubscription provider={provider} onRefresh={fetchDashboardData} />
                    </div>
                  )}

                  {/* Clinics Tab */}
                  {activeTab === 'clinics' && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <ProviderClinics provider={provider} />
                    </div>
                  )}

                  {/* Team Tab */}
                  {activeTab === 'team' && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <ProviderTeam provider={provider} />
                    </div>
                  )}

                  {/* Services Tab - Enhanced */}
                  {activeTab === 'services' && (
                    <div className="space-y-6">
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-bold text-carefd-navy">ניהול שירותים</h3>
                          <button
                            onClick={() => {
                              resetServiceForm();
                              setShowServiceForm(true);
                            }}
                            className="bg-carefd-teal text-white px-4 py-2 rounded-xl font-medium hover:bg-carefd-teal-medium transition flex items-center gap-2"
                          >
                            <FaPlus />
                            הוסף שירות חדש
                          </button>
                        </div>

                        {/* Service Form */}
                        {showServiceForm && (
                          <div className="mb-6 p-6 bg-carefd-teal-pale/20 rounded-xl border-2 border-carefd-teal">
                            <h4 className="font-bold text-carefd-navy mb-4 text-lg">
                              {editingService ? 'עריכת שירות' : 'שירות חדש'}
                            </h4>
                            <div className="space-y-6">
                              {/* Basic Info */}
                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                  <label className="block text-sm font-medium text-carefd-navy mb-2">שם השירות *</label>
                                  <input
                                    type="text"
                                    value={serviceForm.name}
                                    onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal focus:outline-none"
                                    placeholder="לדוגמה: טיפול פיזיותרפיה / שמירה פרטית"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-sm font-medium text-carefd-navy mb-2">תיאור השירות</label>
                                  <textarea
                                    value={serviceForm.description}
                                    onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal focus:outline-none h-24 resize-none"
                                    placeholder="תאר את השירות..."
                                  />
                                </div>
                              </div>

                              {/* Categories from admin hierarchy (1-3) */}
                              {professions.length > 0 && (() => {
                                const allCategories = [];
                                professions.forEach(prof => {
                                  (prof.sub_professions || []).forEach(sub => {
                                    (sub.categories || []).forEach(cat => {
                                      allCategories.push({
                                        ...cat,
                                        profession_id: prof.profession_id,
                                        profession_name: prof.name,
                                        sub_name: sub.name,
                                      });
                                    });
                                  });
                                });

                                if (allCategories.length === 0) return null;

                                const selectedCats = serviceForm.categories || [];
                                const isCatSelected = (catId) => selectedCats.some(c => c.category_id === catId);
                                const toggleCat = (cat) => {
                                  if (isCatSelected(cat.category_id)) {
                                    setServiceForm({
                                      ...serviceForm,
                                      categories: selectedCats.filter(c => c.category_id !== cat.category_id)
                                    });
                                  } else if (selectedCats.length < 3) {
                                    setServiceForm({
                                      ...serviceForm,
                                      categories: [...selectedCats, {
                                        category_id: cat.category_id,
                                        name: cat.name,
                                        profession_id: cat.profession_id,
                                        profession_name: cat.profession_name,
                                      }]
                                    });
                                  }
                                };

                                // Group by profession
                                const grouped = {};
                                allCategories.forEach(cat => {
                                  if (!grouped[cat.profession_name]) grouped[cat.profession_name] = [];
                                  grouped[cat.profession_name].push(cat);
                                });

                                return (
                                  <div className="bg-white p-4 rounded-xl">
                                    <label className="block text-sm font-bold text-carefd-navy mb-2">
                                      קטגוריות מקצועיות ({selectedCats.length}/3)
                                    </label>
                                    <p className="text-xs text-carefd-gray mb-3">בחר 1-3 קטגוריות שהשירות שייך אליהן</p>
                                    {selectedCats.length > 0 && (
                                      <div className="flex flex-wrap gap-2 mb-3">
                                        {selectedCats.map(cat => (
                                          <span key={cat.category_id} className="inline-flex items-center gap-1 px-3 py-1 bg-carefd-teal/10 text-carefd-teal border border-carefd-teal/30 rounded-full text-sm">
                                            {cat.name}
                                            <button onClick={() => toggleCat(cat)} className="me-1 hover:text-red-500">×</button>
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    <div className="space-y-2">
                                      {Object.entries(grouped).map(([profName, cats]) => (
                                        <div key={profName}>
                                          <p className="text-xs font-medium text-carefd-gray mb-1">{profName}</p>
                                          <div className="flex flex-wrap gap-1.5">
                                            {cats.map(cat => (
                                              <button
                                                key={cat.category_id}
                                                type="button"
                                                onClick={() => toggleCat(cat)}
                                                disabled={!isCatSelected(cat.category_id) && selectedCats.length >= 3}
                                                className={`px-3 py-1 rounded-full border text-xs transition ${
                                                  isCatSelected(cat.category_id)
                                                    ? 'bg-carefd-teal text-white border-carefd-teal'
                                                    : selectedCats.length >= 3
                                                      ? 'bg-gray-50 text-gray-400 border-gray-200'
                                                      : 'bg-white text-carefd-navy border-gray-200 hover:border-carefd-teal'
                                                }`}
                                              >
                                                {cat.name}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Service Category */}
                              <div className="bg-white p-4 rounded-xl">
                                <label className="block text-sm font-bold text-carefd-navy mb-3">סוג שירות *</label>
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
                                          ? 'border-carefd-teal bg-carefd-teal/10'
                                          : 'border-gray-200 hover:border-carefd-teal/50'
                                      }`}
                                    >
                                      <span className="text-2xl">{cat.icon}</span>
                                      <p className="font-medium text-carefd-navy mt-1">{cat.name}</p>
                                      <p className="text-xs text-carefd-gray">{cat.desc}</p>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Delivery Types */}
                              <div className="bg-white p-4 rounded-xl">
                                <label className="block text-sm font-bold text-carefd-navy mb-3">היכן יינתן השירות?</label>
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
                                          ? 'border-carefd-teal bg-carefd-teal/10'
                                          : 'border-gray-200 hover:border-carefd-teal/50'
                                      }`}
                                    >
                                      <span className="text-xl">{dt.icon}</span>
                                      <p className="font-medium text-carefd-navy text-sm mt-1">{dt.name}</p>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Pricing */}
                              <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-carefd-navy mb-2">
                                    מחיר (₪) * {serviceForm.service_category === 'hourly' && '(לשעה)'}
                                  </label>
                                  <input
                                    type="number"
                                    value={serviceForm.price}
                                    onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal focus:outline-none"
                                    placeholder="0"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-carefd-navy mb-2">משך (דקות)</label>
                                  <input
                                    type="number"
                                    value={serviceForm.duration_minutes}
                                    onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal focus:outline-none"
                                    placeholder="45"
                                  />
                                </div>
                                {serviceForm.service_category === 'hourly' && (
                                  <div>
                                    <label className="block text-sm font-medium text-carefd-navy mb-2">מינימום שעות *</label>
                                    <input
                                      type="number"
                                      step="0.5"
                                      value={serviceForm.minimum_hours}
                                      onChange={(e) => setServiceForm({ ...serviceForm, minimum_hours: e.target.value })}
                                      className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal focus:outline-none"
                                      placeholder="לדוגמה: 8"
                                    />
                                    <p className="text-xs text-carefd-gray mt-1">למשל: שמירה פרטית - מינימום 8 שעות</p>
                                  </div>
                                )}
                              </div>

                              {/* Weekend Pricing */}
                              <div className="bg-amber-50 p-4 rounded-xl">
                                <div className="flex items-center justify-between mb-3">
                                  <label className="text-sm font-bold text-carefd-navy">תעריף שישי/שבת</label>
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
                                    <span className="text-sm font-bold text-carefd-navy">עלות נסיעה</span>
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
                                    <span className="text-sm font-bold text-carefd-navy">אפשרות משלוח</span>
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
                                  className="bg-carefd-teal text-white px-6 py-3 rounded-xl font-medium hover:bg-carefd-teal-medium transition flex items-center gap-2 disabled:opacity-50"
                                >
                                  <FaSave />
                                  {saving ? 'שומר...' : 'שמור שירות'}
                                </button>
                                <button
                                  onClick={resetServiceForm}
                                  className="bg-gray-200 text-carefd-navy px-6 py-3 rounded-xl font-medium hover:bg-gray-300 transition"
                                >
                                  ביטול
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Services List */}
                        {services.length === 0 ? (
                          <div className="text-center py-12 text-carefd-gray">
                            <FaBriefcase className="text-5xl mx-auto mb-3 text-carefd-teal-pale" />
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
                                <div key={service.service_id} className="border-2 border-carefd-teal-pale rounded-xl p-5 hover:border-carefd-teal transition">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 bg-carefd-teal-pale rounded-xl flex items-center justify-center text-2xl">
                                        {categoryIcons[service.service_category] || '📋'}
                                      </div>
                                      <div>
                                        <h4 className="font-bold text-carefd-navy">{service.name}</h4>
                                        <span className="text-xs bg-carefd-navy text-white px-2 py-0.5 rounded-full">
                                          {categoryNames[service.service_category] || service.service_category}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-left">
                                      <span className="text-2xl font-bold text-carefd-teal">₪{service.price}</span>
                                      {service.service_category === 'hourly' && (
                                        <span className="block text-xs text-carefd-gray">/שעה</span>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-sm text-carefd-gray mb-3 line-clamp-2">{service.description || 'ללא תיאור'}</p>
                                  
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
                                      <span className="text-xs text-carefd-gray flex items-center gap-1">
                                        <FaClock />
                                        {service.duration_minutes} דקות
                                      </span>
                                    ) : <span></span>}
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleEditService(service)}
                                        className="text-carefd-teal hover:text-carefd-teal-medium p-2 hover:bg-carefd-teal/10 rounded-lg transition"
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
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-carefd-navy flex items-center gap-2">
                          <FaFileAlt className="text-carefd-teal" />
                          בקשות פתוחות
                        </h3>
                        <Link href="/requests" className="text-carefd-teal font-medium text-sm hover:underline">
                          צפה בכל הבקשות
                        </Link>
                      </div>
                      {requests.length === 0 ? (
                        <div className="text-center py-12 text-carefd-gray">
                          <FaFileAlt className="text-5xl mx-auto mb-3 text-carefd-teal-pale" />
                          <p className="text-lg mb-2">אין בקשות פתוחות כרגע</p>
                          <Link href="/requests" className="text-carefd-teal font-medium hover:underline">
                            עבור לדף הבקשות
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {requests.map((request) => (
                            <div
                              key={request.request_id}
                              className="p-4 border-2 border-carefd-teal-pale rounded-xl hover:border-carefd-teal transition"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <Link
                                    href={`/requests/${request.request_id}`}
                                    className="font-bold text-carefd-navy hover:text-carefd-teal transition text-lg"
                                  >
                                    {request.title}
                                  </Link>
                                  <p className="text-sm text-carefd-gray line-clamp-2 mt-1">{request.description}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1 me-4">
                                  {request.budget && (
                                    <span className="text-xl font-bold text-carefd-teal">₪{request.budget}</span>
                                  )}
                                  {request.urgency && request.urgency !== 'medium' && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                      request.urgency === 'urgent' ? 'bg-red-100 text-red-700' :
                                      request.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                                      'bg-gray-100 text-gray-600'
                                    }`}>
                                      {request.urgency === 'urgent' ? 'דחוף' : request.urgency === 'high' ? 'גבוה' : 'נמוך'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-carefd-gray mb-3">
                                {request.specialization && (
                                  <span className="bg-carefd-teal-pale text-carefd-teal px-2 py-1 rounded-full text-xs">
                                    {request.specialization}
                                  </span>
                                )}
                                <span>{request.location?.city || 'לא צוין מיקום'}</span>
                                <span>{new Date(request.created_at).toLocaleDateString('he-IL')}</span>
                                {request.offer_count > 0 && (
                                  <span className="text-carefd-teal font-medium">{request.offer_count} הצעות</span>
                                )}
                              </div>
                              <Link
                                href={`/requests/${request.request_id}`}
                                className="inline-flex items-center gap-2 text-sm bg-carefd-teal text-white px-4 py-2 rounded-lg hover:bg-carefd-teal-medium transition font-medium"
                              >
                                <FaMoneyBillWave /> הגש הצעה
                              </Link>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* My Offers Tab */}
                  {activeTab === 'my_offers' && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <h3 className="text-xl font-bold text-carefd-navy mb-6 flex items-center gap-2">
                        <FaMoneyBillWave className="text-carefd-teal" />
                        ההצעות שלי
                      </h3>
                      {myOffers.length === 0 ? (
                        <div className="text-center py-12 text-carefd-gray">
                          <FaMoneyBillWave className="text-5xl mx-auto mb-3 text-carefd-teal-pale" />
                          <p className="text-lg">עדיין לא הגשת הצעות</p>
                          <Link href="/requests" className="text-carefd-teal hover:underline mt-2 inline-block">
                            צפה בבקשות פתוחות
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {myOffers.map((offer) => {
                            const statusConfig = {
                              pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', text: 'ממתין', icon: FaHourglass },
                              accepted: { color: 'bg-green-100 text-green-800 border-green-300', text: 'התקבלה', icon: FaCheckCircle },
                              rejected: { color: 'bg-red-100 text-red-800 border-red-300', text: 'נדחתה', icon: FaTimes },
                              withdrawn: { color: 'bg-gray-100 text-gray-600 border-gray-300', text: 'נמשכה', icon: FaTimes }
                            };
                            const sc = statusConfig[offer.status] || statusConfig.pending;
                            const StatusIcon = sc.icon;

                            return (
                              <div
                                key={offer.offer_id}
                                className={`p-4 border-2 rounded-xl transition ${
                                  offer.status === 'accepted' ? 'border-green-300 bg-green-50' :
                                  offer.status === 'rejected' ? 'border-red-200 bg-red-50 opacity-70' :
                                  offer.status === 'withdrawn' ? 'border-gray-200 bg-gray-50 opacity-70' :
                                  'border-carefd-teal-pale hover:border-carefd-teal'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <Link
                                      href={`/requests/${offer.request_id}`}
                                      className="font-bold text-carefd-navy hover:text-carefd-teal transition"
                                    >
                                      {offer.request?.title || 'בקשה'}
                                    </Link>
                                    <p className="text-sm text-carefd-gray mt-1">
                                      {new Date(offer.created_at).toLocaleDateString('he-IL')}
                                    </p>
                                    <p className="text-carefd-slate text-sm mt-2 line-clamp-2">{offer.message}</p>
                                  </div>
                                  <div className="text-left ms-4">
                                    <div className="text-xl font-bold text-carefd-teal">₪{offer.price}</div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 mt-1 ${sc.color}`}>
                                      <StatusIcon className="text-xs" /> {sc.text}
                                    </span>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-3 flex gap-2">
                                  {offer.status === 'pending' && (
                                    <button
                                      onClick={async (e) => {
                                        const btn = e.currentTarget;
                                        if (btn.disabled) return;
                                        btn.disabled = true;
                                        try {
                                          await api.post(`/offers/${offer.offer_id}/withdraw`);
                                          toast.success('ההצעה נמשכה');
                                          const res = await api.get('/offers/my');
                                          setMyOffers(res.data.offers || []);
                                        } catch (err) {
                                          toast.error(err.response?.data?.detail || 'שגיאה');
                                          btn.disabled = false;
                                        }
                                      }}
                                      className="text-sm text-red-600 hover:text-red-800 transition px-3 py-1 rounded border border-red-200 hover:bg-red-50 disabled:opacity-50"
                                    >
                                      משוך הצעה
                                    </button>
                                  )}
                                  {offer.status === 'accepted' && (
                                    <Link
                                      href="/chats"
                                      className="text-sm text-carefd-teal hover:text-carefd-teal-medium transition px-3 py-1 rounded border border-carefd-teal hover:bg-carefd-teal-pale flex items-center gap-1"
                                    >
                                      <FaComments /> פתח צ'אט
                                    </Link>
                                  )}
                                  <Link
                                    href={`/requests/${offer.request_id}`}
                                    className="text-sm text-carefd-navy hover:text-carefd-teal transition px-3 py-1 rounded border border-carefd-light-gray hover:bg-gray-50"
                                  >
                                    צפה בבקשה
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Messages Tab */}
                  {activeTab === 'messages' && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <h3 className="text-xl font-bold text-carefd-navy mb-6 flex items-center gap-2">
                        <FaComments className="text-carefd-teal" />
                        שיחות צ'אט
                      </h3>
                      {chats.length === 0 ? (
                        <div className="text-center py-12">
                          <FaComments className="text-5xl text-carefd-teal-pale mx-auto mb-4" />
                          <p className="text-carefd-gray">אין שיחות עדיין</p>
                          <p className="text-sm text-carefd-gray mt-2">כאשר לקוחות יפנו אליכם, השיחות יופיעו כאן</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {chats.map((chat) => (
                            <Link
                              key={chat.room_id}
                              href={`/chat/${chat.room_id}`}
                              className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-carefd-teal-pale/30 rounded-xl transition group"
                            >
                              <div className="w-12 h-12 bg-carefd-navy rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {(chat.other_user?.name || chat.provider?.business_name || 'M')[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="font-semibold text-carefd-navy group-hover:text-carefd-teal transition">
                                    {chat.other_user?.name || chat.provider?.business_name || 'משתמש'}
                                  </p>
                                  <span className="text-xs text-carefd-gray">
                                    {chat.last_message?.created_at 
                                      ? new Date(chat.last_message.created_at).toLocaleDateString('he-IL')
                                      : ''}
                                  </span>
                                </div>
                                <p className="text-sm text-carefd-gray truncate">
                                  {chat.last_message?.content || 'לחצו כדי להתחיל שיחה'}
                                </p>
                              </div>
                              {chat.unread_count > 0 && (
                                <span className="bg-carefd-teal text-white text-xs font-bold px-2 py-1 rounded-full">
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
                          <div className="text-5xl font-bold text-carefd-teal">{(stats.averageRating || 0).toFixed(1)}</div>
                          <div className="flex justify-center my-2">
                            {[...Array(5)].map((_, i) => (
                              <FaStar
                                key={i}
                                className={i < Math.round(stats.averageRating || 0) ? 'text-yellow-500' : 'text-gray-300'}
                              />
                            ))}
                          </div>
                          <div className="text-sm text-carefd-gray">{stats.totalReviews} ביקורות</div>
                        </div>
                      </div>
                      {reviews.length === 0 ? (
                        <div className="text-center py-8 text-carefd-gray">
                          <FaStar className="text-4xl mx-auto mb-2 text-carefd-teal-pale" />
                          <p>עדיין אין ביקורות</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {reviews.map((review) => (
                            <div key={review.review_id} className="border-b border-carefd-teal-pale pb-4 last:border-0">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-carefd-navy rounded-full flex items-center justify-center text-white font-bold">
                                  {(review.user?.name || 'M')[0]}
                                </div>
                                <div>
                                  <p className="font-medium text-carefd-navy">{review.user?.name || 'משתמש'}</p>
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
                              <p className="text-carefd-slate">{review.comment}</p>
                              <p className="text-xs text-carefd-gray mt-2">
                                {new Date(review.created_at).toLocaleDateString('he-IL')}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Settings Tab */}
                  {activeTab === 'settings' && (
                    <div className="space-y-6">
                      {/* Push Notification Settings */}
                      <NotificationSettings />
                      
                      {/* Provider-specific settings managed in /provider/edit */}

                      {/* Account Settings */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-bold text-carefd-navy mb-6">הגדרות חשבון</h3>
                        <div className="space-y-4">
                          <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-sm text-carefd-gray">שם העסק</p>
                            <p className="font-medium text-carefd-navy">{provider?.business_name || '-'}</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-sm text-carefd-gray">אימייל</p>
                            <p className="font-medium text-carefd-navy">{user?.email || '-'}</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-sm text-carefd-gray">טלפון</p>
                            <p className="font-medium text-carefd-navy">{provider?.phone || '-'}</p>
                          </div>
                          <Link
                            href="/provider/edit"
                            className="inline-flex items-center gap-2 bg-carefd-teal text-white px-6 py-3 rounded-xl font-medium hover:bg-carefd-teal-medium transition"
                          >
                            <FaCog /> ערוך פרופיל מלא
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* User Info Tab - Personal Details */}
                  {activeTab === 'user_info' && (
                    <div className="space-y-6">
                      {/* Personal Info */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-bold text-carefd-navy mb-6 flex items-center gap-2">
                          <FaUser className="text-carefd-teal" />
                          פרטים אישיים
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-carefd-navy mb-2">שם פרטי</label>
                            <input
                              type="text"
                              value={userInfoForm.first_name}
                              onChange={(e) => setUserInfoForm({ ...userInfoForm, first_name: e.target.value })}
                              className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal focus:outline-none"
                              placeholder="שם פרטי"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-carefd-navy mb-2">שם משפחה</label>
                            <input
                              type="text"
                              value={userInfoForm.last_name}
                              onChange={(e) => setUserInfoForm({ ...userInfoForm, last_name: e.target.value })}
                              className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal focus:outline-none"
                              placeholder="שם משפחה"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-bold text-carefd-navy mb-6 flex items-center gap-2">
                          <FaPhone className="text-carefd-teal" />
                          פרטי התקשרות
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-carefd-navy mb-2">טלפון אישי</label>
                            <input
                              type="tel"
                              value={userInfoForm.personal_phone}
                              onChange={(e) => setUserInfoForm({ ...userInfoForm, personal_phone: e.target.value })}
                              className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal focus:outline-none"
                              placeholder="050-0000000"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-carefd-navy mb-2">אימייל</label>
                            <input
                              type="email"
                              value={userInfoForm.personal_email}
                              disabled
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                            />
                            <p className="text-xs text-carefd-gray mt-1">לא ניתן לשנות את כתובת האימייל</p>
                          </div>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-bold text-carefd-navy mb-6 flex items-center gap-2">
                          <FaHome className="text-carefd-teal" />
                          כתובת מגורים
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-carefd-navy mb-2">עיר</label>
                            <CitySelect
                              name="personal_city"
                              value={userInfoForm.personal_city}
                              onChange={(e) => setUserInfoForm({ ...userInfoForm, personal_city: e.target.value })}
                              placeholder="בחר עיר..."
                              inputClassName="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-carefd-navy mb-2">כתובת</label>
                            <input
                              type="text"
                              value={userInfoForm.personal_address}
                              onChange={(e) => setUserInfoForm({ ...userInfoForm, personal_address: e.target.value })}
                              className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal focus:outline-none"
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
                          className="bg-carefd-teal text-white px-8 py-3 rounded-xl font-semibold hover:bg-carefd-teal-medium transition flex items-center gap-2 disabled:opacity-50"
                        >
                          <FaSave />
                          {saving ? 'שומר...' : 'שמור פרטים אישיים'}
                        </button>
                      </div>

                      {/* Password Change */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-bold text-carefd-navy mb-6 flex items-center gap-2">
                          <FaCog className="text-carefd-teal" />
                          שינוי סיסמה
                        </h3>
                        <div className="space-y-4 max-w-md">
                          <div>
                            <label className="block text-sm font-medium text-carefd-navy mb-2">סיסמה נוכחית</label>
                            <div className="relative">
                              <input
                                type={showPw.current ? 'text' : 'password'}
                                value={userInfoForm.current_password}
                                onChange={(e) => setUserInfoForm({ ...userInfoForm, current_password: e.target.value })}
                                className="w-full px-4 py-3 pl-12 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal focus:outline-none"
                                placeholder="הזן סיסמה נוכחית"
                              />
                              <button type="button" onClick={() => setShowPw(p => ({...p, current: !p.current}))} className="absolute left-4 top-1/2 -translate-y-1/2 text-carefd-gray hover:text-carefd-teal transition" aria-label="הצג/הסתר סיסמה">
                                {showPw.current ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-carefd-navy mb-2">סיסמה חדשה</label>
                            <div className="relative">
                              <input
                                type={showPw.new_pw ? 'text' : 'password'}
                                value={userInfoForm.new_password}
                                onChange={(e) => setUserInfoForm({ ...userInfoForm, new_password: e.target.value })}
                                className="w-full px-4 py-3 pl-12 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal focus:outline-none"
                                placeholder="הזן סיסמה חדשה (לפחות 6 תווים)"
                              />
                              <button type="button" onClick={() => setShowPw(p => ({...p, new_pw: !p.new_pw}))} className="absolute left-4 top-1/2 -translate-y-1/2 text-carefd-gray hover:text-carefd-teal transition" aria-label="הצג/הסתר סיסמה">
                                {showPw.new_pw ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-carefd-navy mb-2">אימות סיסמה חדשה</label>
                            <div className="relative">
                              <input
                                type={showPw.confirm ? 'text' : 'password'}
                                value={userInfoForm.confirm_password}
                                onChange={(e) => setUserInfoForm({ ...userInfoForm, confirm_password: e.target.value })}
                                className="w-full px-4 py-3 pl-12 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal focus:outline-none"
                                placeholder="הזן שוב את הסיסמה החדשה"
                              />
                              <button type="button" onClick={() => setShowPw(p => ({...p, confirm: !p.confirm}))} className="absolute left-4 top-1/2 -translate-y-1/2 text-carefd-gray hover:text-carefd-teal transition" aria-label="הצג/הסתר סיסמה">
                                {showPw.confirm ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                              </button>
                            </div>
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

      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          provider={provider}
          onClose={() => setSelectedBooking(null)}
          onRefresh={fetchDashboardData}
        />
      )}
    </div>
  );
};

export default ProviderDashboard;
