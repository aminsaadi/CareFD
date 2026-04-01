"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import CompletionConfirmDialog from '@/components/CompletionConfirmDialog' // TODO;
import NotificationSettings from '@/components/NotificationSettings' // TODO;
import CitySelect from '@/components/CitySelect' // TODO;
import api from '@/lib/api-client';
import { toast } from 'sonner';
import { 
  FaCalendarAlt, FaComments, FaFileAlt, FaStar, FaUser, FaCog,
  FaChevronLeft, FaPlus, FaMapMarkerAlt, FaClock, FaCheckCircle,
  FaHourglass, FaTimes, FaEdit, FaBell, FaHeart, FaCamera, FaTrash,
  FaPhone, FaEnvelope, FaHome, FaLock, FaIdCard, FaShieldAlt,
  FaMoneyBillWave, FaUserCircle, FaExchangeAlt, FaEye, FaEyeSlash,
  FaSort, FaSortAmountDown, FaSortAmountUp, FaChevronDown, FaChevronUp
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
  
  const { user, setUser } = useAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

  // Sync active tab when URL search params change (e.g. navigating from Navbar)
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [myReviews, setMyReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompletionDialog, setShowCompletionDialog] = useState<any>(null);
  const [showBookingDetails, setShowBookingDetails] = useState<any>(null);
  const [cancelRequestId, setCancelRequestId] = useState<any>(null);
  const [expandedBookings, setExpandedBookings] = useState({});
  const [bookingSortBy, setBookingSortBy] = useState('date_desc');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, new_pw: false, confirm: false });
  const fileInputRef = useRef<any>(null);

  // Request management state
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [requestFilter, setRequestFilter] = useState('all');
  const [professionOptions, setProfessionOptions] = useState<any[]>([]);
  const [serviceTypeOptions, setServiceTypeOptions] = useState<any[]>([]);
  const [deliveryTypeOptions, setDeliveryTypeOptions] = useState<any[]>([]);
  const [regionOptions, setRegionOptions] = useState<any[]>([]);
  const [requestFormData, setRequestFormData] = useState<any>({
    title: '', description: '', professions: [], specialization: '',
    service_type: '', delivery_type: '', budget: '', budget_type: '',
    hours_needed: '', request_type: 'one_time', urgency: 'medium',
    preferred_date: '', preferred_time: '', gender_preference: '',
    language_preferences: [], preferences: '', city: '', address: '',
    address_notes: '', region: '', provider_type: ''
  });
  
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
    fetchRequestFormOptions();
  }, []);

  const fetchRequestFormOptions = async () => {
    try {
      const [professionsRes, serviceTypesRes, deliveryTypesRes, regionsRes] = await Promise.all([
        api.get('/professions').catch(() => ({ professions: [] })),
        api.get('/service-types').catch(() => ({ service_types: [] })),
        api.get('/delivery-types').catch(() => ({ delivery_types: [] })),
        api.get('/regions').catch(() => ({ regions: [] })),
      ]);
      const profs = professionsRes?.professions || professionsRes || [];
      setProfessionOptions(Array.isArray(profs) ? profs : []);
      const sTypes = serviceTypesRes?.service_types || serviceTypesRes || [];
      setServiceTypeOptions(Array.isArray(sTypes) ? sTypes : []);
      const dTypes = deliveryTypesRes?.delivery_types || deliveryTypesRes || [];
      setDeliveryTypeOptions(Array.isArray(dTypes) ? dTypes : []);
      const regions = regionsRes?.regions || regionsRes || [];
      setRegionOptions(Array.isArray(regions) ? regions : []);
    } catch (error: any) {
      console.error('Failed to fetch form options:', error);
    }
  };

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
        api.get('/bookings/my').catch(() => ({ bookings: [] })),
        api.get('/requests/my').catch(() => ({ requests: [] })),
        api.get('/chat/rooms').catch(() => ({ rooms: [] })),
        api.get('/reviews/my').catch(() => ({ reviews: [] })),
        api.get('/favorites').catch(() => ({ favorites: [] }))
      ]);

      const userBookings = bookingsRes.bookings || [];
      setBookings(userBookings);
      setRequests(requestsRes.requests || []);
      setChats(chatsRes.rooms || []);
      setMyReviews(reviewsRes.reviews || []);
      setFavorites(favoritesRes.favorites || []);

      // Calculate stats
      setStats({
        totalBookings: userBookings.length,
        pendingBookings: userBookings.filter(b => b.status === 'pending').length,
        completedBookings: userBookings.filter(b => b.status === 'completed').length,
        awaitingConfirmation: userBookings.filter(b => b.status === 'provider_completed').length,
        totalRequests: (requestsRes.requests || []).length,
        unreadMessages: (chatsRes.rooms || []).reduce((acc, r) => acc + (r.unread_count || 0), 0),
        totalReviews: (reviewsRes.reviews || []).length
      });
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('שגיאה בטעינת נתוני הדשבורד');
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
      
      const data = await api.post('/upload/image', formData);

      setUserForm({ ...userForm, profile_image: data?.url });
      toast.success('התמונה הועלתה בהצלחה!');
    } catch (err: any) {
      toast.error('שגיאה בהעלאת התמונה');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = () => {
    setUserForm({ ...userForm, profile_image: '' });
    toast.success('התמונה הוסרה');
  };

  // Booking status configuration
  const bookingStatusConfig = {
    pending: { label: 'ממתין לאישור', color: 'bg-yellow-100 text-yellow-700', icon: FaHourglass },
    confirmed: { label: 'מאושר', color: 'bg-green-100 text-green-700', icon: FaCheckCircle },
    in_progress: { label: 'בביצוע', color: 'bg-blue-100 text-blue-700', icon: FaClock },
    provider_completed: { label: 'הספק סיים - אשר השלמה', color: 'bg-purple-100 text-purple-700', icon: FaCheckCircle },
    completed: { label: 'הושלם', color: 'bg-green-100 text-green-700', icon: FaCheckCircle },
    cancelled: { label: 'בוטל', color: 'bg-red-100 text-red-700', icon: FaTimes },
    rejected: { label: 'נדחה', color: 'bg-red-100 text-red-700', icon: FaTimes },
    on_hold: { label: 'בהשהיה', color: 'bg-gray-100 text-gray-700', icon: FaHourglass }
  };

  const getBookingStatusConfig = (status) => {
    return bookingStatusConfig[status] || bookingStatusConfig.pending;
  };

  const toggleBookingExpand = (bookingId) => {
    setExpandedBookings(prev => ({ ...prev, [bookingId]: !prev[bookingId] }));
  };

  const getSortedBookings = () => {
    const sorted = [...bookings];
    switch (bookingSortBy) {
      case 'date_desc': return sorted.sort((a, b) => new Date(b.created_at || b.booking_date).getTime() - new Date(a.created_at || a.booking_date).getTime());
      case 'date_asc': return sorted.sort((a, b) => new Date(a.created_at || a.booking_date).getTime() - new Date(b.created_at || b.booking_date).getTime());
      case 'status': {
        const order = { pending: 0, confirmed: 1, in_progress: 2, provider_completed: 3, on_hold: 4, completed: 5, cancelled: 6, rejected: 7 };
        return sorted.sort((a, b) => (order[a.status] ?? 99) - (order[b.status] ?? 99));
      }
      case 'price_desc': return sorted.sort((a, b) => (b.final_price || b.base_price || 0) - (a.final_price || a.base_price || 0));
      default: return sorted;
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const data = await api.put('/users/me', {
        first_name: userForm.first_name,
        last_name: userForm.last_name,
        phone: userForm.phone,
        address: userForm.address,
        city: userForm.city,
        profile_image: userForm.profile_image,
        profile_color: userForm.profile_color
      });

      if (data.user && setUser) {
        setUser(data.user);
      }
      toast.success('הפרטים נשמרו בהצלחה!');
    } catch (err: any) {
      toast.error(err.response?.detail || 'שגיאה בשמירת הפרטים');
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
    } catch (err: any) {
      toast.error(err.response?.detail || 'שגיאה בשינוי הסיסמה');
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
      case 'rejected': return 'bg-red-100 text-red-600';
      case 'on_hold': return 'bg-gray-100 text-gray-600';
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
      cancelled: 'בוטל',
      rejected: 'נדחה',
      on_hold: 'בהשהיה'
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
    const first = userForm.first_name || user?.name?.split(' ')?.[0] || '';
    const last = userForm.last_name || user?.name?.split(' ')?.[1] || '';
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase() || 'U';
  };

  // === Request CRUD functions ===
  const resetRequestForm = () => {
    setRequestFormData({
      title: '', description: '', professions: [], specialization: '',
      service_type: '', delivery_type: '', budget: '', budget_type: '',
      hours_needed: '', request_type: 'one_time', urgency: 'medium',
      preferred_date: '', preferred_time: '', gender_preference: '',
      language_preferences: [], preferences: '', city: '', address: '',
      address_notes: '', region: '', provider_type: ''
    });
    setEditingRequest(null);
    setShowRequestForm(false);
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: requestFormData.title,
        description: requestFormData.description,
        professions: requestFormData.professions?.length > 0 ? requestFormData.professions : [],
        service_type: requestFormData.service_type || null,
        delivery_type: requestFormData.delivery_type || null,
        budget: requestFormData.budget ? parseFloat(requestFormData.budget) : null,
        budget_type: requestFormData.budget_type || null,
        hours_needed: requestFormData.hours_needed ? parseInt(requestFormData.hours_needed) : null,
        request_type: requestFormData.request_type,
        urgency: requestFormData.urgency,
        preferred_date: requestFormData.preferred_date || null,
        preferred_time: requestFormData.preferred_time || null,
        gender_preference: requestFormData.gender_preference || null,
        language_preferences: requestFormData.language_preferences?.length > 0 ? requestFormData.language_preferences : [],
        preferences: requestFormData.preferences || null,
        address_notes: requestFormData.address_notes || null,
        region: requestFormData.region || null,
        provider_type: requestFormData.provider_type || null,
        specialization: requestFormData.specialization || null,
        location: (requestFormData.city || requestFormData.address) ? {
          city: requestFormData.city || '',
          address: requestFormData.address || '',
        } : null,
      };
      await api.post('/requests', payload);
      toast.success('הבקשה נוצרה בהצלחה!');
      resetRequestForm();
      fetchDashboardData();
    } catch (error: any) {
      toast.error(error.data?.detail || 'שגיאה ביצירת הבקשה');
    }
  };

  const handleUpdateRequest = async (e) => {
    e.preventDefault();
    if (!editingRequest) return;
    try {
      const payload: any = {};
      if (requestFormData.title) payload.title = requestFormData.title;
      if (requestFormData.description) payload.description = requestFormData.description;
      if (requestFormData.professions?.length > 0) payload.professions = requestFormData.professions;
      payload.specialization = requestFormData.specialization || null;
      payload.service_type = requestFormData.service_type || null;
      payload.delivery_type = requestFormData.delivery_type || null;
      payload.budget = requestFormData.budget ? parseFloat(requestFormData.budget) : null;
      payload.budget_type = requestFormData.budget_type || null;
      payload.hours_needed = requestFormData.hours_needed ? parseInt(requestFormData.hours_needed) : null;
      payload.request_type = requestFormData.request_type;
      payload.urgency = requestFormData.urgency;
      payload.preferred_date = requestFormData.preferred_date || null;
      payload.preferred_time = requestFormData.preferred_time || null;
      payload.gender_preference = requestFormData.gender_preference || null;
      if (requestFormData.language_preferences?.length > 0) payload.language_preferences = requestFormData.language_preferences;
      payload.provider_type = requestFormData.provider_type || null;
      payload.preferences = requestFormData.preferences || null;
      payload.address_notes = requestFormData.address_notes || null;
      payload.region = requestFormData.region || null;
      if (requestFormData.city || requestFormData.address) {
        payload.location = { city: requestFormData.city || '', address: requestFormData.address || '' };
      }

      await api.put(`/requests/${editingRequest}`, payload);
      toast.success('הבקשה עודכנה בהצלחה!');
      resetRequestForm();
      fetchDashboardData();
    } catch (error: any) {
      toast.error(error.data?.detail || 'שגיאה בעדכון הבקשה');
    }
  };

  const handleCancelRequest = async (requestId) => {
    setCancelRequestId(requestId);
  };

  const confirmCancelRequest = async () => {
    if (!cancelRequestId) return;
    try {
      await api.put(`/requests/${cancelRequestId}/cancel`, { reason: '' });
      toast.success('הבקשה בוטלה');
      fetchDashboardData();
    } catch (error: any) {
      toast.error(error.data?.detail || 'שגיאה בביטול הבקשה');
    } finally {
      setCancelRequestId(null);
    }
  };

  const startEditRequest = (request) => {
    setEditingRequest(request.request_id);
    setRequestFormData({
      title: request.title || '',
      description: request.description || '',
      professions: request.professions || [],
      specialization: request.specialization || '',
      service_type: request.service_type || '',
      delivery_type: request.delivery_type || '',
      budget: request.budget?.toString() || '',
      budget_type: request.budget_type || '',
      hours_needed: request.hours_needed?.toString() || '',
      request_type: request.request_type || 'one_time',
      urgency: request.urgency || 'medium',
      preferred_date: request.preferred_date ? request.preferred_date.split('T')[0] : '',
      preferred_time: request.preferred_time || '',
      gender_preference: request.gender_preference || '',
      language_preferences: request.language_preferences || [],
      preferences: request.preferences || '',
      city: request.location?.city || '',
      address: request.location?.address || '',
      address_notes: request.address_notes || '',
      region: request.region || '',
      provider_type: request.provider_type || ''
    });
    setShowRequestForm(true);
  };

  const getRequestStatusColor = (status) => {
    const colors = {
      open: 'bg-green-100 text-green-800 border-green-300',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-gray-100 text-gray-800 border-gray-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getRequestStatusText = (status) => {
    const texts = { open: 'פתוח', in_progress: 'בתהליך', completed: 'הושלם', cancelled: 'בוטל' };
    return texts[status] || status;
  };

  const filteredRequests = requestFilter === 'all'
    ? requests
    : requests.filter(r => r.status === requestFilter);

  const tabs = [
    { id: 'overview', label: 'סקירה כללית', icon: FaUser },
    { id: 'bookings', label: 'ההזמנות שלי', icon: FaCalendarAlt },
    { id: 'requests', label: 'הבקשות שלי', icon: FaFileAlt },
    { id: 'notifications', label: 'התראות', icon: FaBell, link: '/notifications' },
    { id: 'reviews', label: 'הביקורות שלי', icon: FaStar },
    { id: 'messages', label: 'הודעות', icon: FaComments },
    { id: 'favorites', label: 'מועדפים', icon: FaHeart },
    { id: 'verification', label: 'אימות חשבון', icon: FaShieldAlt, link: '/verify-account' },
    { id: 'settings', label: 'הגדרות', icon: FaCog }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-carefd-teal-pale/30 flex flex-col">
      
      
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-carefd-navy font-heading mb-2">
              שלום, {user?.name || 'משתמש'}! 👋
            </h1>
            <p className="text-carefd-gray">ברוכים הבאים לאזור האישי שלך</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden sticky top-24">
                {/* User Info */}
                <div className="bg-gradient-to-r from-carefd-navy to-carefd-slate p-6 text-white text-center">
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
                  <p className="text-carefd-teal-pale text-sm font-mono" data-testid="user-number">
                    {user?.user_number || `U${user?.user_id?.slice(-7) || '0000000'}`}
                  </p>
                  {/* Verification Badge */}
                  {user?.is_verified ? (
                    <span className="inline-flex items-center gap-1 mt-2 bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs">
                      <FaCheckCircle /> מאומת
                    </span>
                  ) : (
                    <Link 
                      href="/verify-account" 
                      className="inline-flex items-center gap-1 mt-2 bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-xs hover:bg-amber-500/30 transition"
                      data-testid="request-verification-btn"
                    >
                      <FaShieldAlt /> בקש אימות
                    </Link>
                  )}
                </div>

                {/* Navigation */}
                <nav className="p-2">
                  {tabs.map((tab) => (
                    tab.link ? (
                      <Link
                        key={tab.id}
                        href={tab.link}
                        data-testid={`tab-${tab.id}`}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition text-carefd-gray hover:bg-carefd-teal-pale/30"
                      >
                        <tab.icon />
                        {tab.label}
                      </Link>
                    ) : (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        data-testid={`tab-${tab.id}`}
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
                      {/* Stats Cards */}
                      <div className="grid md:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                              <FaCalendarAlt className="text-blue-600 text-xl" />
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-carefd-navy">{stats.totalBookings}</div>
                              <div className="text-sm text-carefd-gray">סה"כ הזמנות</div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                              <FaHourglass className="text-yellow-600 text-xl" />
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-carefd-navy">{stats.pendingBookings}</div>
                              <div className="text-sm text-carefd-gray">ממתינים</div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                              <FaCheckCircle className="text-green-600 text-xl" />
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-carefd-navy">{stats.completedBookings}</div>
                              <div className="text-sm text-carefd-gray">הושלמו</div>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => setActiveTab('requests')} className="bg-white p-6 rounded-2xl shadow-lg text-right hover:shadow-xl transition w-full">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                              <FaFileAlt className="text-purple-600 text-xl" />
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-carefd-navy">{stats.totalRequests}</div>
                              <div className="text-sm text-carefd-gray">בקשות</div>
                            </div>
                          </div>
                        </button>
                      </div>

                      {/* Quick Actions */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-lg font-bold text-carefd-navy mb-4">פעולות מהירות</h3>
                        <div className="grid md:grid-cols-3 gap-4">
                          <Link
                            href="/providers"
                            className="flex items-center gap-3 p-4 bg-carefd-teal-pale/30 rounded-xl hover:bg-carefd-teal-pale transition"
                          >
                            <FaPlus className="text-carefd-teal" />
                            <span className="font-medium text-carefd-navy">חפש ספק חדש</span>
                          </Link>
                          <button
                            onClick={() => { setActiveTab('requests'); setShowRequestForm(true); }}
                            className="flex items-center gap-3 p-4 bg-carefd-teal-pale/30 rounded-xl hover:bg-carefd-teal-pale transition w-full"
                          >
                            <FaFileAlt className="text-carefd-teal" />
                            <span className="font-medium text-carefd-navy">פרסם בקשה</span>
                          </button>
                          <Link
                            href="/chats"
                            className="flex items-center gap-3 p-4 bg-carefd-teal-pale/30 rounded-xl hover:bg-carefd-teal-pale transition"
                          >
                            <FaComments className="text-carefd-teal" />
                            <span className="font-medium text-carefd-navy">הצ'אטים שלי</span>
                          </Link>
                        </div>
                      </div>

                      {/* Recent Bookings */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-carefd-navy">ההזמנות האחרונות</h3>
                          <button
                            onClick={() => setActiveTab('bookings')}
                            className="text-carefd-teal font-medium flex items-center gap-1"
                          >
                            צפה בכל
                            <FaChevronLeft className="rtl:rotate-180" />
                          </button>
                        </div>
                        {bookings.length === 0 ? (
                          <div className="text-center py-8 text-carefd-gray">
                            <FaCalendarAlt className="text-4xl mx-auto mb-2 text-carefd-teal-pale" />
                            <p>עדיין אין לך הזמנות</p>
                            <Link href="/providers" className="text-carefd-teal font-medium mt-2 inline-block">
                              חפש ספק עכשיו
                            </Link>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {[...bookings].sort((a, b) => new Date(b.created_at || b.booking_date).getTime() - new Date(a.created_at || a.booking_date).getTime()).slice(0, 3).map((booking) => {
                              const StatusIcon = getStatusIcon(booking.status);
                              return (
                                <div 
                                  key={booking.booking_id} 
                                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-carefd-teal-pale/20 transition"
                                  onClick={() => setShowBookingDetails(booking)}
                                >
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(booking.status)}`}>
                                    <StatusIcon />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-carefd-navy">{booking.service_name || 'שירות'}</p>
                                    <p className="text-sm text-carefd-gray">
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
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <h3 className="text-xl font-bold text-carefd-navy">ההזמנות שלי</h3>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <select
                              value={bookingSortBy}
                              onChange={(e) => setBookingSortBy(e.target.value)}
                              className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 pr-10 text-sm font-medium text-carefd-navy cursor-pointer hover:border-carefd-teal transition focus:outline-none focus:ring-2 focus:ring-carefd-teal/30"
                              data-testid="booking-sort-select"
                            >
                              <option value="date_desc">חדש ← ישן</option>
                              <option value="date_asc">ישן ← חדש</option>
                              <option value="status">לפי סטטוס</option>
                              <option value="price_desc">לפי מחיר</option>
                            </select>
                            <FaSort className="absolute left-3 top-1/2 -translate-y-1/2 text-carefd-gray pointer-events-none text-xs" />
                          </div>
                          <Link
                            href="/providers"
                            className="bg-carefd-teal text-white px-4 py-2 rounded-xl font-medium hover:bg-carefd-teal-medium transition flex items-center gap-2 text-sm"
                          >
                            <FaPlus />
                            הזמן תור חדש
                          </Link>
                        </div>
                      </div>
                      {bookings.length === 0 ? (
                        <div className="text-center py-12 text-carefd-gray">
                          <FaCalendarAlt className="text-5xl mx-auto mb-3 text-carefd-teal-pale" />
                          <p className="text-lg mb-2">אין לך הזמנות עדיין</p>
                          <Link href="/providers" className="text-carefd-teal font-medium">
                            חפש ספק והזמן תור ראשון
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {getSortedBookings().map((booking) => {
                            const statusConfig = getBookingStatusConfig(booking.status);
                            const StatusIcon = statusConfig.icon;
                            const isExpanded = expandedBookings[booking.booking_id];
                            return (
                              <div 
                                key={booking.booking_id} 
                                className={`border-2 rounded-xl transition-all duration-200 overflow-hidden ${isExpanded ? 'border-carefd-teal shadow-md' : 'border-carefd-teal-pale hover:border-carefd-teal/40'}`}
                                data-testid={`booking-card-${booking.booking_id}`}
                              >
                                {/* Collapsed Header - Always Visible */}
                                <div
                                  className="flex items-center justify-between gap-3 p-4 cursor-pointer select-none"
                                  onClick={() => toggleBookingExpand(booking.booking_id)}
                                  data-testid={`booking-toggle-${booking.booking_id}`}
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${statusConfig.color}`}>
                                      <StatusIcon className="text-base" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="font-bold text-carefd-navy text-sm">{booking.service_name || 'שירות'}</h4>
                                        <span className="text-xs text-carefd-gray">•</span>
                                        <span className="text-xs text-carefd-gray">{booking.provider_name || 'ספק'}</span>
                                      </div>
                                      <div className="flex items-center gap-3 mt-0.5 text-xs text-carefd-gray">
                                        <span>{new Date(booking.booking_date).toLocaleDateString('he-IL')}</span>
                                        {booking.booking_time && <span>{booking.booking_time}</span>}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                      {statusConfig.label}
                                    </span>
                                    {isExpanded ? <FaChevronUp className="text-carefd-gray text-xs" /> : <FaChevronDown className="text-carefd-gray text-xs" />}
                                  </div>
                                </div>

                                {/* Expanded Content */}
                                {isExpanded && (
                                  <div className="px-4 pb-4 border-t border-gray-100 pt-3 animate-in slide-in-from-top-1 duration-200">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-carefd-gray">תאריך</p>
                                        <p className="font-medium text-sm text-carefd-navy">{new Date(booking.booking_date).toLocaleDateString('he-IL')}</p>
                                      </div>
                                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-carefd-gray">שעה</p>
                                        <p className="font-medium text-sm text-carefd-navy">{booking.booking_time || 'יתואם'}</p>
                                      </div>
                                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-carefd-gray">מחיר</p>
                                        <p className="font-medium text-sm text-green-600">{booking.final_price || booking.base_price ? `₪${booking.final_price || booking.base_price}` : 'יתואם'}</p>
                                      </div>
                                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-carefd-gray">סוג שירות</p>
                                        <p className="font-medium text-sm text-carefd-navy">{booking.delivery_method || booking.service_type || '-'}</p>
                                      </div>
                                    </div>
                                    {booking.notes && (
                                      <div className="bg-blue-50 rounded-lg p-3 mb-4 text-sm text-carefd-navy">
                                        <span className="font-medium">הערות: </span>{booking.notes}
                                      </div>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setShowBookingDetails(booking); }}
                                        className="bg-carefd-navy/10 text-carefd-navy px-4 py-2 rounded-xl text-xs font-medium hover:bg-carefd-navy/20 transition flex items-center gap-1.5"
                                        data-testid={`view-details-${booking.booking_id}`}
                                      >
                                        <FaEye />
                                        פרטים מלאים
                                      </button>
                                      {booking.status === 'provider_completed' && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setShowCompletionDialog(booking); }}
                                          className="bg-carefd-teal text-white px-4 py-2 rounded-xl text-xs font-medium hover:bg-carefd-teal-medium transition"
                                          data-testid={`confirm-booking-${booking.booking_id}`}
                                        >
                                          אשר השלמה
                                        </button>
                                      )}
                                      {booking.status === 'completed' && !booking.has_review && (
                                        <Link
                                          href={`/review/${booking.booking_id}`}
                                          onClick={(e) => e.stopPropagation()}
                                          className="bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-medium hover:bg-amber-600 transition flex items-center gap-1.5"
                                          data-testid={`write-review-${booking.booking_id}`}
                                        >
                                          <FaStar />
                                          כתוב חוות דעת
                                        </Link>
                                      )}
                                      {booking.has_review && (
                                        <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1">
                                          <FaCheckCircle />
                                          חוות דעת נכתבה
                                        </span>
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

                  {/* Reviews Tab */}
                  {activeTab === 'reviews' && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <h3 className="text-xl font-bold text-carefd-navy mb-6">הביקורות שלי</h3>
                      {myReviews.length === 0 ? (
                        <div className="text-center py-12 text-carefd-gray">
                          <FaStar className="text-5xl mx-auto mb-3 text-carefd-teal-pale" />
                          <p className="text-lg mb-2">עדיין לא כתבת ביקורות</p>
                          <p className="text-sm">לאחר השלמת הזמנה תוכל לכתוב ביקורת על הספק</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {myReviews.map((review) => (
                            <div key={review.review_id} className="border-2 border-carefd-teal-pale rounded-xl p-4">
                              {/* Review status badge */}
                              {review.status && review.status !== 'approved' && (
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium mb-3 ${
                                  review.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {review.status === 'pending' ? (
                                    <>
                                      <FaHourglass />
                                      ממתין לאישור מנהל
                                    </>
                                  ) : (
                                    <>
                                      <FaTimes />
                                      נדחה: {review.rejection_reason || 'לא עומד בקריטריונים'}
                                    </>
                                  )}
                                </div>
                              )}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  {review.provider?.profile_image ? (
                                    <img 
                                      src={review.provider.profile_image} 
                                      alt={review.provider.business_name}
                                      className="w-12 h-12 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 bg-carefd-teal rounded-full flex items-center justify-center text-white font-bold">
                                      {review.provider?.business_name?.[0] || 'S'}
                                    </div>
                                  )}
                                  <div>
                                    <Link 
                                      href={`/providers/${review.provider_id}`}
                                      className="font-bold text-carefd-navy hover:text-carefd-teal transition"
                                    >
                                      {review.provider?.business_name || 'ספק'}
                                    </Link>
                                    <p className="text-sm text-carefd-gray">
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
                                <p className="text-carefd-slate">{review.comment}</p>
                              )}
                              <p className="text-xs text-carefd-gray mt-3">
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
                      <h3 className="text-xl font-bold text-carefd-navy mb-6">הודעות</h3>
                      {chats.length === 0 ? (
                        <div className="text-center py-12 text-carefd-gray">
                          <FaComments className="text-5xl mx-auto mb-3 text-carefd-teal-pale" />
                          <p className="text-lg mb-2">אין לך שיחות עדיין</p>
                          <p className="text-sm">שיחות יופיעו כאן כשתיצור קשר עם ספקים</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {chats.map((chat) => (
                            <Link
                              key={chat.room_id}
                              href={`/chat/${chat.room_id}`}
                              className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-carefd-teal-pale/30 transition"
                            >
                              <div className="w-12 h-12 bg-carefd-navy rounded-full flex items-center justify-center text-white font-bold">
                                {(chat.other_user_name || 'U')[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-carefd-navy">{chat.other_user_name || 'משתמש'}</p>
                                <p className="text-sm text-carefd-gray truncate">{chat.last_message || 'אין הודעות'}</p>
                              </div>
                              {chat.unread_count > 0 && (
                                <span className="bg-carefd-teal text-white text-xs px-2 py-1 rounded-full">
                                  {chat.unread_count}
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Requests Tab */}
                  {activeTab === 'requests' && (
                    <div className="space-y-6">
                      {/* Header with create button */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-carefd-navy flex items-center gap-2">
                            <FaFileAlt className="text-carefd-teal" />
                            הבקשות שלי
                          </h3>
                          <button
                            onClick={() => { resetRequestForm(); setShowRequestForm(true); }}
                            className="bg-carefd-teal text-white px-5 py-2 rounded-lg hover:bg-carefd-teal-medium transition font-medium flex items-center gap-2"
                          >
                            <FaPlus /> בקשה חדשה
                          </button>
                        </div>

                        {/* Filter buttons */}
                        <div className="flex gap-2 flex-wrap">
                          {[
                            { id: 'all', label: 'הכל' },
                            { id: 'open', label: 'פתוחות' },
                            { id: 'in_progress', label: 'בתהליך' },
                            { id: 'completed', label: 'הושלמו' },
                            { id: 'cancelled', label: 'בוטלו' }
                          ].map(f => (
                            <button
                              key={f.id}
                              onClick={() => setRequestFilter(f.id)}
                              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                                requestFilter === f.id
                                  ? 'bg-carefd-teal text-white'
                                  : 'bg-gray-100 text-carefd-gray hover:bg-gray-200'
                              }`}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Create / Edit Request Form */}
                      {showRequestForm && (
                        <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-carefd-teal">
                          <h3 className="text-lg font-bold text-carefd-navy mb-4">
                            {editingRequest ? 'עריכת בקשה' : 'בקשה חדשה'}
                          </h3>
                          <form onSubmit={editingRequest ? handleUpdateRequest : handleCreateRequest} className="space-y-4">
                            {/* Title */}
                            <div>
                              <label className="block text-sm font-medium text-carefd-navy mb-1">כותרת *</label>
                              <input
                                type="text"
                                required
                                value={requestFormData.title}
                                onChange={(e) => setRequestFormData({ ...requestFormData, title: e.target.value })}
                                className="w-full px-3 py-2 border border-carefd-light-gray rounded-lg focus:ring-carefd-teal focus:border-carefd-teal"
                                placeholder="תארו בקצרה את השירות שאתם מחפשים"
                              />
                            </div>

                            {/* Description */}
                            <div>
                              <label className="block text-sm font-medium text-carefd-navy mb-1">פרטים נוספים *</label>
                              <textarea
                                required
                                value={requestFormData.description}
                                onChange={(e) => setRequestFormData({ ...requestFormData, description: e.target.value })}
                                className="w-full px-3 py-2 border border-carefd-light-gray rounded-lg focus:ring-carefd-teal focus:border-carefd-teal"
                                rows={3}
                                placeholder="פרטו על הצורך, מצב רפואי רלוונטי, דרישות מיוחדות..."
                              />
                            </div>

                            {/* Professions - multi-select chips */}
                            <div>
                              <label className="block text-sm font-medium text-carefd-navy mb-2">מקצוע (עד 3)</label>
                              <div className="flex flex-wrap gap-2">
                                {professionOptions.map((prof) => {
                                  const profId = prof.profession_id || prof.id || prof.value;
                                  const profName = prof.name || prof.name_he || prof.label;
                                  const isSelected = (requestFormData.professions || []).includes(profId);
                                  return (
                                    <button
                                      key={profId}
                                      type="button"
                                      onClick={() => {
                                        const current = requestFormData.professions || [];
                                        if (isSelected) {
                                          setRequestFormData({ ...requestFormData, professions: current.filter(id => id !== profId) });
                                        } else if (current.length < 3) {
                                          setRequestFormData({ ...requestFormData, professions: [...current, profId] });
                                        } else {
                                          toast.error('ניתן לבחור עד 3 מקצועות');
                                        }
                                      }}
                                      className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition ${
                                        isSelected
                                          ? 'bg-carefd-teal text-white border-carefd-teal'
                                          : 'bg-white text-carefd-navy border-carefd-light-gray hover:border-carefd-teal'
                                      }`}
                                    >
                                      {profName}
                                    </button>
                                  );
                                })}
                                {professionOptions.length === 0 && (
                                  <span className="text-sm text-gray-400">טוען מקצועות...</span>
                                )}
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                              {/* Service Type - synced with backend */}
                              <div>
                                <label className="block text-sm font-medium text-carefd-navy mb-1">סוג שירות</label>
                                <select
                                  value={requestFormData.service_type}
                                  onChange={(e) => setRequestFormData({ ...requestFormData, service_type: e.target.value })}
                                  className="w-full px-3 py-2 border border-carefd-light-gray rounded-lg focus:ring-carefd-teal focus:border-carefd-teal"
                                >
                                  <option value="">-- בחר סוג שירות --</option>
                                  {serviceTypeOptions.map((st) => (
                                    <option key={st.type_id || st.id || st.value} value={st.value || st.type_id || st.id}>
                                      {st.name_he || st.name || st.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Delivery Type - synced with backend */}
                              <div>
                                <label className="block text-sm font-medium text-carefd-navy mb-1">דרך מתן השירות</label>
                                <select
                                  value={requestFormData.delivery_type}
                                  onChange={(e) => setRequestFormData({ ...requestFormData, delivery_type: e.target.value })}
                                  className="w-full px-3 py-2 border border-carefd-light-gray rounded-lg focus:ring-carefd-teal focus:border-carefd-teal"
                                >
                                  <option value="">-- בחר דרך מתן שירות --</option>
                                  {deliveryTypeOptions.map((dt) => (
                                    <option key={dt.type_id || dt.id || dt.value} value={dt.value || dt.type_id || dt.id}>
                                      {dt.name_he || dt.name || dt.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Budget + Budget Type */}
                              <div>
                                <label className="block text-sm font-medium text-carefd-navy mb-1">תקציב</label>
                                <div className="flex gap-2">
                                  <input
                                    type="number"
                                    value={requestFormData.budget}
                                    onChange={(e) => setRequestFormData({ ...requestFormData, budget: e.target.value })}
                                    className="flex-1 px-3 py-2 border border-carefd-light-gray rounded-lg focus:ring-carefd-teal focus:border-carefd-teal"
                                    placeholder="₪"
                                  />
                                  <select
                                    value={requestFormData.budget_type}
                                    onChange={(e) => setRequestFormData({ ...requestFormData, budget_type: e.target.value })}
                                    className="w-28 px-2 py-2 border border-carefd-light-gray rounded-lg focus:ring-carefd-teal focus:border-carefd-teal text-sm"
                                  >
                                    <option value="">סוג</option>
                                    <option value="per_hour">לשעה</option>
                                    <option value="per_treatment">לטיפול</option>
                                    <option value="per_visit">לביקור</option>
                                  </select>
                                </div>
                              </div>

                              {/* Hours Needed - shown when budget_type is per_hour */}
                              {requestFormData.budget_type === 'per_hour' && (
                                <div>
                                  <label className="block text-sm font-medium text-carefd-navy mb-1">מספר שעות דרושות</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={requestFormData.hours_needed}
                                    onChange={(e) => setRequestFormData({ ...requestFormData, hours_needed: e.target.value })}
                                    className="w-full px-3 py-2 border border-carefd-light-gray rounded-lg focus:ring-carefd-teal focus:border-carefd-teal"
                                    placeholder="מספר שעות"
                                  />
                                </div>
                              )}

                              {/* Urgency */}
                              <div>
                                <label className="block text-sm font-medium text-carefd-navy mb-1">דחיפות</label>
                                <select
                                  value={requestFormData.urgency}
                                  onChange={(e) => setRequestFormData({ ...requestFormData, urgency: e.target.value })}
                                  className="w-full px-3 py-2 border border-carefd-light-gray rounded-lg focus:ring-carefd-teal focus:border-carefd-teal"
                                >
                                  <option value="low">נמוכה</option>
                                  <option value="medium">בינונית</option>
                                  <option value="high">גבוהה</option>
                                  <option value="urgent">דחוף</option>
                                </select>
                              </div>

                              {/* Request Type */}
                              <div>
                                <label className="block text-sm font-medium text-carefd-navy mb-1">סוג בקשה</label>
                                <select
                                  value={requestFormData.request_type}
                                  onChange={(e) => setRequestFormData({ ...requestFormData, request_type: e.target.value })}
                                  className="w-full px-3 py-2 border border-carefd-light-gray rounded-lg focus:ring-carefd-teal focus:border-carefd-teal"
                                >
                                  <option value="one_time">חד פעמי</option>
                                  <option value="immediate">מיידי</option>
                                  <option value="scheduled">מתוזמן</option>
                                  <option value="follow_up">המשך טיפול</option>
                                </select>
                              </div>

                              {/* Preferred Date */}
                              <div>
                                <label className="block text-sm font-medium text-carefd-navy mb-1">תאריך רצוי</label>
                                <input
                                  type="date"
                                  value={requestFormData.preferred_date}
                                  onChange={(e) => setRequestFormData({ ...requestFormData, preferred_date: e.target.value })}
                                  className="w-full px-3 py-2 border border-carefd-light-gray rounded-lg focus:ring-carefd-teal focus:border-carefd-teal"
                                />
                              </div>

                              {/* Preferred Time */}
                              <div>
                                <label className="block text-sm font-medium text-carefd-navy mb-1">שעה רצויה</label>
                                <input
                                  type="time"
                                  value={requestFormData.preferred_time}
                                  onChange={(e) => setRequestFormData({ ...requestFormData, preferred_time: e.target.value })}
                                  className="w-full px-3 py-2 border border-carefd-light-gray rounded-lg focus:ring-carefd-teal focus:border-carefd-teal"
                                />
                              </div>

                              {/* Gender Preference */}
                              <div>
                                <label className="block text-sm font-medium text-carefd-navy mb-1">העדפת מגדר</label>
                                <select
                                  value={requestFormData.gender_preference}
                                  onChange={(e) => setRequestFormData({ ...requestFormData, gender_preference: e.target.value })}
                                  className="w-full px-3 py-2 border border-carefd-light-gray rounded-lg focus:ring-carefd-teal focus:border-carefd-teal"
                                >
                                  <option value="">-- ללא העדפה --</option>
                                  <option value="no_preference">ללא העדפה</option>
                                  <option value="male">זכר</option>
                                  <option value="female">נקבה</option>
                                </select>
                              </div>
                            </div>

                            {/* Location - Region, City, Address, Address Notes */}
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-carefd-navy mb-1">אזור</label>
                                <select
                                  value={requestFormData.region}
                                  onChange={(e) => setRequestFormData({ ...requestFormData, region: e.target.value })}
                                  className="w-full px-3 py-2 border border-carefd-light-gray rounded-lg focus:ring-carefd-teal focus:border-carefd-teal"
                                >
                                  <option value="">-- בחר אזור --</option>
                                  {regionOptions.map((r) => (
                                    <option key={r.region_id || r.name} value={r.name}>
                                      {r.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-carefd-navy mb-1">עיר</label>
                                <CitySelect
                                  name="city"
                                  value={requestFormData.city}
                                  onChange={(e) => setRequestFormData({ ...requestFormData, city: e.target.value })}
                                  placeholder="בחר עיר..."
                                  inputClassName="w-full px-3 py-2 border border-carefd-light-gray rounded-lg focus:ring-carefd-teal focus:border-carefd-teal"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-carefd-navy mb-1">כתובת</label>
                                <input
                                  type="text"
                                  value={requestFormData.address}
                                  onChange={(e) => setRequestFormData({ ...requestFormData, address: e.target.value })}
                                  className="w-full px-3 py-2 border border-carefd-light-gray rounded-lg focus:ring-carefd-teal focus:border-carefd-teal"
                                  placeholder="רחוב, מספר בית"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-carefd-navy mb-1">הערות לכתובת</label>
                                <input
                                  type="text"
                                  value={requestFormData.address_notes}
                                  onChange={(e) => setRequestFormData({ ...requestFormData, address_notes: e.target.value })}
                                  className="w-full px-3 py-2 border border-carefd-light-gray rounded-lg focus:ring-carefd-teal focus:border-carefd-teal"
                                  placeholder="קומה, דירה, קוד כניסה..."
                                />
                              </div>
                            </div>

                            {/* Language Preferences */}
                            <div>
                              <label className="block text-sm font-medium text-carefd-navy mb-2">העדפות שפה</label>
                              <div className="flex flex-wrap gap-2">
                                {[
                                  { value: 'hebrew', label: 'עברית' },
                                  { value: 'arabic', label: 'ערבית' },
                                  { value: 'english', label: 'אנגלית' },
                                  { value: 'russian', label: 'רוסית' },
                                  { value: 'french', label: 'צרפתית' },
                                  { value: 'amharic', label: 'אמהרית' },
                                ].map((lang) => {
                                  const isSelected = (requestFormData.language_preferences || []).includes(lang.value);
                                  return (
                                    <button
                                      key={lang.value}
                                      type="button"
                                      onClick={() => {
                                        const current = requestFormData.language_preferences || [];
                                        if (isSelected) {
                                          setRequestFormData({ ...requestFormData, language_preferences: current.filter(l => l !== lang.value) });
                                        } else {
                                          setRequestFormData({ ...requestFormData, language_preferences: [...current, lang.value] });
                                        }
                                      }}
                                      className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition ${
                                        isSelected
                                          ? 'bg-carefd-teal text-white border-carefd-teal'
                                          : 'bg-white text-carefd-navy border-carefd-light-gray hover:border-carefd-teal'
                                      }`}
                                    >
                                      {lang.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Preferences */}
                            <div>
                              <label className="block text-sm font-medium text-carefd-navy mb-1">העדפות נוספות</label>
                              <textarea
                                value={requestFormData.preferences}
                                onChange={(e) => setRequestFormData({ ...requestFormData, preferences: e.target.value })}
                                className="w-full px-3 py-2 border border-carefd-light-gray rounded-lg focus:ring-carefd-teal focus:border-carefd-teal"
                                rows={2}
                                placeholder="העדפות נוספות..."
                              />
                            </div>

                            <div className="flex gap-3">
                              <button
                                type="submit"
                                className="bg-carefd-teal text-white px-6 py-2 rounded-lg hover:bg-carefd-teal-medium transition font-medium"
                              >
                                {editingRequest ? 'עדכן בקשה' : 'פרסם בקשה'}
                              </button>
                              <button
                                type="button"
                                onClick={resetRequestForm}
                                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
                              >
                                ביטול
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Requests List */}
                      {filteredRequests.length === 0 ? (
                        <div className="bg-white p-6 rounded-2xl shadow-lg text-center py-12 text-carefd-gray">
                          <FaFileAlt className="text-5xl mx-auto mb-3 text-carefd-teal-pale" />
                          <p className="text-lg mb-2">
                            {requestFilter === 'all' ? 'עדיין לא פרסמת בקשות' : 'אין בקשות בסטטוס זה'}
                          </p>
                          {requestFilter === 'all' && (
                            <button
                              onClick={() => { resetRequestForm(); setShowRequestForm(true); }}
                              className="text-carefd-teal font-medium hover:underline"
                            >
                              פרסם בקשה ראשונה
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredRequests.map((request) => (
                            <div
                              key={request.request_id}
                              className="bg-white p-5 rounded-2xl shadow-lg border-2 border-carefd-teal-pale hover:border-carefd-teal transition"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <Link
                                    href={`/requests/${request.request_id}`}
                                    className="text-lg font-bold text-carefd-navy hover:text-carefd-teal transition"
                                  >
                                    {request.title}
                                  </Link>
                                  <p className="text-sm text-carefd-gray mt-1 line-clamp-2">{request.description}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRequestStatusColor(request.status)}`}>
                                  {getRequestStatusText(request.status)}
                                </span>
                              </div>

                              {/* Details row */}
                              <div className="flex flex-wrap gap-3 mb-3 text-sm">
                                {request.specialization && (
                                  <span className="bg-carefd-teal-pale text-carefd-teal px-3 py-1 rounded-full">
                                    {request.specialization}
                                  </span>
                                )}
                                {request.budget && (
                                  <span className="flex items-center gap-1 text-carefd-navy font-medium">
                                    <FaMoneyBillWave className="text-carefd-teal" /> ₪{request.budget}
                                  </span>
                                )}
                                {request.urgency && request.urgency !== 'medium' && (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    request.urgency === 'urgent' ? 'bg-red-100 text-red-700' :
                                    request.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {request.urgency === 'urgent' ? 'דחוף' : request.urgency === 'high' ? 'גבוה' : 'נמוך'}
                                  </span>
                                )}
                                {request.offer_count > 0 && (
                                  <span className="flex items-center gap-1 text-carefd-gray">
                                    <FaComments className="text-carefd-teal" /> {request.offer_count} הצעות
                                  </span>
                                )}
                                <span className="text-carefd-gray">
                                  {new Date(request.created_at).toLocaleDateString('he-IL')}
                                </span>
                              </div>

                              {/* Action buttons */}
                              <div className="flex gap-2">
                                <Link
                                  href={`/requests/${request.request_id}`}
                                  className="text-sm bg-carefd-navy text-white px-4 py-1.5 rounded-lg hover:bg-carefd-slate transition"
                                >
                                  {request.offer_count > 0 ? `צפה בהצעות (${request.offer_count})` : 'פרטים'}
                                </Link>
                                {request.status === 'open' && (
                                  <>
                                    <button
                                      onClick={() => startEditRequest(request)}
                                      className="text-sm bg-blue-50 text-blue-600 px-4 py-1.5 rounded-lg hover:bg-blue-100 transition flex items-center gap-1"
                                    >
                                      <FaEdit /> ערוך
                                    </button>
                                    <button
                                      onClick={() => handleCancelRequest(request.request_id)}
                                      className="text-sm bg-red-50 text-red-600 px-4 py-1.5 rounded-lg hover:bg-red-100 transition flex items-center gap-1"
                                    >
                                      <FaTimes /> בטל
                                    </button>
                                  </>
                                )}
                                {request.status === 'in_progress' && request.booking_id && (
                                  <Link
                                    href={`/bookings/${request.booking_id}`}
                                    className="text-sm bg-carefd-teal text-white px-4 py-1.5 rounded-lg hover:bg-carefd-teal-medium transition"
                                  >
                                    צפה בהזמנה
                                  </Link>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Favorites Tab */}
                  {activeTab === 'favorites' && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <h3 className="text-xl font-bold text-carefd-navy mb-6">ספקים מועדפים</h3>
                      {favorites.length === 0 ? (
                        <div className="text-center py-12 text-carefd-gray">
                          <FaHeart className="text-5xl mx-auto mb-3 text-carefd-teal-pale" />
                          <p className="text-lg mb-2">אין לך מועדפים עדיין</p>
                          <Link href="/providers" className="text-carefd-teal font-medium">
                            חפש ספקים ושמור מועדפים
                          </Link>
                        </div>
                      ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                          {favorites.map((fav) => (
                            <Link
                              key={fav.favorite_id}
                              href={`/providers/${fav.provider_id}`}
                              className="border-2 border-carefd-teal-pale rounded-xl p-4 hover:border-carefd-teal transition flex items-center gap-4"
                            >
                              <div className="w-16 h-16 bg-carefd-teal rounded-xl flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                                {fav.provider?.profile_image ? (
                                  <img src={fav.provider.profile_image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  fav.provider?.business_name?.[0] || 'S'
                                )}
                              </div>
                              <div>
                                <h4 className="font-bold text-carefd-navy">{fav.provider?.business_name || 'ספק'}</h4>
                                <p className="text-sm text-carefd-gray">{fav.provider?.profession_title}</p>
                                {fav.provider?.rating && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <FaStar className="text-amber-400 text-sm" />
                                    <span className="text-sm text-carefd-gray">{fav.provider.rating}</span>
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
                        <h3 className="text-xl font-bold text-carefd-navy mb-6 flex items-center gap-2">
                          <FaUserCircle className="text-carefd-teal" />
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
                              className="absolute bottom-0 right-0 w-8 h-8 bg-carefd-teal text-white rounded-full flex items-center justify-center shadow-lg hover:bg-carefd-teal/90 transition"
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
                            <p className="text-sm text-carefd-gray mb-3">בחר צבע רקע (יוצג כאשר אין תמונה)</p>
                            <div className="flex gap-2">
                              {PROFILE_COLORS.map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => setUserForm({ ...userForm, profile_color: color })}
                                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${color} ${
                                    userForm.profile_color === color ? 'ring-2 ring-offset-2 ring-carefd-teal' : ''
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Personal Details */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-bold text-carefd-navy mb-6 flex items-center gap-2">
                          <FaIdCard className="text-carefd-teal" />
                          פרטים אישיים
                        </h3>
                        
                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                          <div>
                            <label className="block text-sm font-medium text-carefd-navy mb-2">שם פרטי</label>
                            <input
                              type="text"
                              value={userForm.first_name}
                              onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
                              className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal focus:outline-none"
                              data-testid="first-name-input"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-carefd-navy mb-2">שם משפחה</label>
                            <input
                              type="text"
                              value={userForm.last_name}
                              onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
                              className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal focus:outline-none"
                              data-testid="last-name-input"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Contact Details */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-bold text-carefd-navy mb-6 flex items-center gap-2">
                          <FaPhone className="text-carefd-teal" />
                          פרטי התקשרות
                        </h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-carefd-navy mb-2">אימייל</label>
                            <input
                              type="email"
                              value={userForm.email}
                              disabled
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-carefd-navy mb-2">טלפון</label>
                            <input
                              type="tel"
                              value={userForm.phone}
                              onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                              placeholder="050-0000000"
                              className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal focus:outline-none"
                              data-testid="phone-input"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-bold text-carefd-navy mb-6 flex items-center gap-2">
                          <FaHome className="text-carefd-teal" />
                          כתובת
                        </h3>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-carefd-navy mb-2">עיר</label>
                            <CitySelect
                              name="city"
                              value={userForm.city}
                              onChange={(e) => setUserForm({ ...userForm, city: e.target.value })}
                              placeholder="בחר עיר..."
                              inputClassName="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal focus:outline-none"
                              data-testid="city-input"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-carefd-navy mb-2">כתובת מלאה</label>
                            <input
                              type="text"
                              value={userForm.address}
                              onChange={(e) => setUserForm({ ...userForm, address: e.target.value })}
                              placeholder="רחוב, מספר בית, דירה"
                              className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal focus:outline-none"
                              data-testid="address-input"
                            />
                          </div>
                        </div>
                        
                        <button 
                          onClick={handleSaveSettings}
                          disabled={savingSettings}
                          className="mt-6 bg-carefd-teal text-white px-6 py-3 rounded-xl font-medium hover:bg-carefd-teal-medium transition disabled:opacity-50 flex items-center gap-2"
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
                        <h3 className="text-xl font-bold text-carefd-navy mb-6 flex items-center gap-2">
                          <FaLock className="text-carefd-teal" />
                          שינוי סיסמה
                        </h3>
                        
                        <div className="space-y-4 max-w-md">
                          <div>
                            <label className="block text-sm font-medium text-carefd-navy mb-2">סיסמה נוכחית</label>
                            <div className="relative">
                              <input
                                type={showPw.current ? 'text' : 'password'}
                                value={passwordForm.current_password}
                                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                                className="w-full px-4 py-3 pl-12 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal focus:outline-none"
                                data-testid="current-password-input"
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
                                value={passwordForm.new_password}
                                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                                className="w-full px-4 py-3 pl-12 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal focus:outline-none"
                                data-testid="new-password-input"
                              />
                              <button type="button" onClick={() => setShowPw(p => ({...p, new_pw: !p.new_pw}))} className="absolute left-4 top-1/2 -translate-y-1/2 text-carefd-gray hover:text-carefd-teal transition" aria-label="הצג/הסתר סיסמה">
                                {showPw.new_pw ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-carefd-navy mb-2">אישור סיסמה חדשה</label>
                            <div className="relative">
                              <input
                                type={showPw.confirm ? 'text' : 'password'}
                                value={passwordForm.confirm_password}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                                className="w-full px-4 py-3 pl-12 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal focus:outline-none"
                                data-testid="confirm-password-input"
                              />
                              <button type="button" onClick={() => setShowPw(p => ({...p, confirm: !p.confirm}))} className="absolute left-4 top-1/2 -translate-y-1/2 text-carefd-gray hover:text-carefd-teal transition" aria-label="הצג/הסתר סיסמה">
                                {showPw.confirm ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                              </button>
                            </div>
                          </div>
                          <button 
                            onClick={handleChangePassword}
                            disabled={changingPassword}
                            className="bg-carefd-navy text-white px-6 py-3 rounded-xl font-medium hover:bg-carefd-slate transition disabled:opacity-50 flex items-center gap-2"
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

      

      {/* Cancel Request Confirmation Dialog */}
      {cancelRequestId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label="אישור ביטול בקשה">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-carefd-navy mb-2">ביטול בקשה</h3>
            <p className="text-carefd-gray mb-6">האם אתה בטוח שברצונך לבטל את הבקשה?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setCancelRequestId(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-carefd-gray hover:bg-gray-50 transition">
                ביטול
              </button>
              <button onClick={confirmCancelRequest} className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition">
                כן, בטל
              </button>
            </div>
          </div>
        </div>
      )}

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
            data-testid="user-booking-details-modal"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-carefd-navy">פרטי ההזמנה</h3>
              <button
                onClick={() => setShowBookingDetails(null)}
                className="text-carefd-gray hover:text-carefd-navy transition"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Service Info */}
              <div className="bg-carefd-teal-pale/30 rounded-xl p-4">
                <h4 className="font-bold text-carefd-navy mb-2">{showBookingDetails.service_name || 'שירות'}</h4>
                <p className="text-sm text-carefd-gray">{showBookingDetails.provider_name || 'ספק'}</p>
                {showBookingDetails.booking_number && (
                  <p className="text-xs text-carefd-gray mt-1">מספר הזמנה: {showBookingDetails.booking_number}</p>
                )}
              </div>

              {/* Booking Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-carefd-gray mb-1">תאריך</p>
                  <p className="font-medium text-carefd-navy">
                    {showBookingDetails.booking_date ? new Date(showBookingDetails.booking_date).toLocaleDateString('he-IL') : 'יתואם'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-carefd-gray mb-1">שעה</p>
                  <p className="font-medium text-carefd-navy">
                    {showBookingDetails.booking_time || 'לא צוין'}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div>
                <p className="text-sm text-carefd-gray mb-1">סטטוס</p>
                <span className={`inline-block px-4 py-2 rounded-xl text-sm font-medium ${getStatusColor(showBookingDetails.status)}`}>
                  {getStatusLabel(showBookingDetails.status)}
                </span>
              </div>

              {/* Price & Payment */}
              {(showBookingDetails.final_price || showBookingDetails.base_price || showBookingDetails.price) && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FaMoneyBillWave className="text-green-600" />
                    <p className="font-bold text-green-700">פרטי תשלום</p>
                  </div>
                  <div className="space-y-1 text-sm">
                    {showBookingDetails.base_price && (
                      <div className="flex justify-between">
                        <span className="text-carefd-gray">מחיר בסיס:</span>
                        <span className="font-medium">&#8362;{showBookingDetails.base_price}</span>
                      </div>
                    )}
                    {showBookingDetails.travel_cost > 0 && (
                      <div className="flex justify-between">
                        <span className="text-carefd-gray">עלות נסיעה:</span>
                        <span className="font-medium">&#8362;{showBookingDetails.travel_cost}</span>
                      </div>
                    )}
                    {showBookingDetails.weekend_addition > 0 && (
                      <div className="flex justify-between">
                        <span className="text-carefd-gray">תוספת סופ"ש:</span>
                        <span className="font-medium">&#8362;{showBookingDetails.weekend_addition}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-green-300">
                      <span className="font-bold text-green-700">סה"כ:</span>
                      <span className="font-bold text-green-700">&#8362;{showBookingDetails.final_price || showBookingDetails.base_price || showBookingDetails.price}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Location */}
              {showBookingDetails.service_location && (
                <div className="bg-orange-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-orange-700 flex items-center gap-1 mb-1">
                    <FaMapMarkerAlt /> כתובת
                  </p>
                  <p className="text-sm text-carefd-navy">
                    {showBookingDetails.service_location?.address}
                    {showBookingDetails.service_location?.city && `, ${showBookingDetails.service_location.city}`}
                  </p>
                </div>
              )}

              {/* Notes */}
              {showBookingDetails.notes && (
                <div>
                  <p className="text-sm text-carefd-gray mb-1">הערות</p>
                  <p className="text-carefd-slate bg-gray-50 p-3 rounded-xl">{showBookingDetails.notes}</p>
                </div>
              )}

              {/* Change Requests */}
              {showBookingDetails.change_requests && showBookingDetails.change_requests.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h4 className="font-bold text-amber-700 mb-3 flex items-center gap-2">
                    <FaExchangeAlt />
                    בקשות שינוי מועד
                  </h4>
                  <div className="space-y-2">
                    {showBookingDetails.change_requests.map((cr, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-3 border border-amber-200">
                        <div className="text-sm">
                          <p className="font-medium text-carefd-navy mb-1">
                            {cr.new_date && `תאריך חדש: ${cr.new_date}`}
                            {cr.new_date && cr.new_time && ' | '}
                            {cr.new_time && `שעה חדשה: ${cr.new_time}`}
                          </p>
                          {cr.reason && <p className="text-xs text-carefd-gray mb-2">{cr.reason}</p>}
                          {cr.status === 'pending' && (
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={async () => {
                                  try {
                                    await api.put(`/bookings/${showBookingDetails.booking_id}/respond-change`, {
                                      request_id: cr.request_id,
                                      action: 'approve'
                                    });
                                    toast.success('שינוי המועד אושר!');
                                    setShowBookingDetails(null);
                                    fetchDashboardData();
                                  } catch { toast.error('שגיאה באישור השינוי'); }
                                }}
                                className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-600 transition"
                                data-testid={`approve-change-${cr.request_id}`}
                              >
                                <FaCheckCircle className="inline ms-1" />
                                אשר שינוי
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    await api.put(`/bookings/${showBookingDetails.booking_id}/respond-change`, {
                                      request_id: cr.request_id,
                                      action: 'reject'
                                    });
                                    toast.success('בקשת השינוי נדחתה');
                                    setShowBookingDetails(null);
                                    fetchDashboardData();
                                  } catch { toast.error('שגיאה בדחיית השינוי'); }
                                }}
                                className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-600 transition"
                                data-testid={`reject-change-${cr.request_id}`}
                              >
                                <FaTimes className="inline ms-1" />
                                דחה שינוי
                              </button>
                            </div>
                          )}
                          {cr.status !== 'pending' && (
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              cr.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {cr.status === 'approved' ? 'אושר' : 'נדחה'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
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
                    className="flex-1 bg-carefd-teal text-white py-3 rounded-xl font-medium hover:bg-carefd-teal-medium transition"
                  >
                    אשר השלמה והעריך
                  </button>
                )}
                {showBookingDetails.status === 'completed' && !showBookingDetails.has_review && (
                  <Link
                    href={`/review/${showBookingDetails.booking_id}`}
                    onClick={() => setShowBookingDetails(null)}
                    className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-medium hover:bg-amber-600 transition flex items-center justify-center gap-2"
                    data-testid="modal-write-review-btn"
                  >
                    <FaStar />
                    כתוב ביקורת
                  </Link>
                )}
                <Link
                  href={`/providers/${showBookingDetails.provider_id}`}
                  className="flex-1 bg-carefd-navy text-white py-3 rounded-xl font-medium hover:bg-carefd-slate transition text-center"
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
