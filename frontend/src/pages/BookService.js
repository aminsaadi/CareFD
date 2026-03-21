import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BookingCalendar from '../components/BookingCalendar';
import TimeSlotPicker from '../components/TimeSlotPicker';
import api from '../utils/api';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  FaUser, FaPhone, FaMapMarkerAlt, FaCalendarAlt,
  FaClock, FaCheckCircle, FaSpinner, FaArrowRight,
  FaSignInAlt, FaHome, FaVideo, FaPhoneAlt, FaTruck, 
  FaWhatsapp, FaExternalLinkAlt, FaFileContract,
  FaInfoCircle, FaUserFriends, FaStickyNote,
  FaStethoscope, FaSyringe, FaRedoAlt, FaHospital, FaClinicMedical,
  FaLaptopMedical, FaBoxOpen, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';

// ==================== CONSTANTS ====================

const SERVICE_CATEGORIES = {
  consultation: { label: 'יעוץ', icon: FaStethoscope, pricingLabel: 'ליעוץ' },
  visit:        { label: 'ביקור', icon: FaHome, pricingLabel: 'לביקור' },
  product:      { label: 'מוצר', icon: FaBoxOpen, pricingLabel: 'ליחידה' },
  hourly:       { label: 'שעתי', icon: FaClock, pricingLabel: 'לשעה' },
  procedure:    { label: 'פעולה', icon: FaSyringe, pricingLabel: 'לפעולה' },
  series:       { label: 'סדרה', icon: FaRedoAlt, pricingLabel: 'לסדרה' },
};

const DELIVERY_TYPES = {
  home:     { label: 'בבית הלקוח', icon: FaHome },
  clinic:   { label: 'בקליניקה', icon: FaClinicMedical },
  hospital: { label: 'בבית חולים / מוסד', icon: FaHospital },
  virtual:  { label: 'וירטואלי', icon: FaLaptopMedical },
  delivery: { label: 'משלוח', icon: FaTruck },
};

const TELEMEDICINE_PLATFORMS = [
  { id: 'phone', label: 'שיחה טלפונית', icon: FaPhoneAlt },
  { id: 'whatsapp', label: 'WhatsApp', icon: FaWhatsapp },
  { id: 'zoom', label: 'Zoom', icon: FaVideo },
  { id: 'google_meet', label: 'Google Meet', icon: FaExternalLinkAlt }
];

const SHIFT_OPTIONS = [
  { id: 'morning', label: 'משמרת בוקר', hours: '07:00-15:00', duration: 8 },
  { id: 'afternoon', label: 'משמרת צהריים', hours: '15:00-23:00', duration: 8 },
  { id: 'night', label: 'משמרת לילה', hours: '23:00-07:00', duration: 8 },
  { id: 'custom', label: 'מותאם אישית', hours: 'בחר שעות', duration: 0 }
];

// Section wrapper component
const FormSection = ({ icon: Icon, title, children, testId }) => (
  <div className="bg-white rounded-2xl shadow-lg border-2 border-carefd-teal-pale overflow-hidden" data-testid={testId}>
    <div className="bg-carefd-teal-pale/30 px-4 sm:px-6 py-3 border-b border-carefd-teal-pale flex items-center gap-2">
      <Icon className="text-carefd-teal" />
      <h2 className="font-bold text-carefd-navy text-sm sm:text-base">{title}</h2>
    </div>
    <div className="p-4 sm:p-6">{children}</div>
  </div>
);

// ==================== COMPONENT ====================

const BookService = () => {
  const { serviceId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [service, setService] = useState(null);
  const [provider, setProvider] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  
  // Form states
  const [selectedDeliveryType, setSelectedDeliveryType] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [skipTimeSelection, setSkipTimeSelection] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [customHours, setCustomHours] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [notes, setNotes] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptCancellation, setAcceptCancellation] = useState(false);
  
  const [serviceAddress, setServiceAddress] = useState({
    street: '', city: '', apartment: '', floor: '', entrance: '', specialInstructions: ''
  });
  const [shippingAddress, setShippingAddress] = useState({
    street: '', city: '', apartment: '', postalCode: ''
  });
  const [contactPerson, setContactPerson] = useState({ name: '', phone: '', relationship: '' });
  
  // Guest & Auth
  const [guestMode, setGuestMode] = useState(false);
  const [guestDetails, setGuestDetails] = useState({ name: '', email: '', phone: '' });
  const [authChecked, setAuthChecked] = useState(false);

  // UX: stepper & confirmation
  const [currentStep, setCurrentStep] = useState(1);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    fetchServiceDetails();
  }, [serviceId]);

  const fetchServiceDetails = async () => {
    try {
      setLoading(true);
      const serviceRes = await api.get(`/services?service_id=${serviceId}`);
      const found = (serviceRes.data.services || []).find(s => s.service_id === serviceId);
      if (!found) throw new Error('Service not found');
      setService(found);
      
      const dt = found.delivery_types || [];
      if (dt.length === 1) setSelectedDeliveryType(dt[0]);
      if (found.minimum_hours) setCustomHours(found.minimum_hours);
      else setCustomHours(4);
      
      const provRes = await api.get(`/providers/${found.provider_id}`);
      setProvider(provRes.data);
      
      try {
        const bookingsRes = await api.get(`/bookings?provider_id=${found.provider_id}`);
        const booked = (bookingsRes.data.bookings || [])
          .filter(b => b.status !== 'cancelled' && b.booking_date)
          .map(b => format(new Date(b.booking_date), 'yyyy-MM-dd HH:mm'));
        setBookedSlots(booked);
      } catch { setBookedSlots([]); }
    } catch (error) {
      console.error('Failed to fetch service:', error);
      toast.error('שירות לא נמצא');
      navigate('/services');
    } finally {
      setLoading(false);
    }
  };

  // Derived config
  const category = service?.service_category || 'visit';
  const categoryConfig = SERVICE_CATEGORIES[category] || SERVICE_CATEGORIES.visit;
  const isHourly = category === 'hourly';
  const isSeries = category === 'series';
  const deliveryTypes = service?.delivery_types || [];
  const isVirtual = selectedDeliveryType === 'virtual';
  const isHome = selectedDeliveryType === 'home';
  const isDelivery = selectedDeliveryType === 'delivery';
  const needsAddress = isHome;
  const needsShipping = isDelivery;

  // Calculate price
  const calculateTotalPrice = () => {
    if (!service) return 0;
    let total = service.price || 0;
    
    if (isHourly) {
      const hours = selectedShift?.duration || customHours || 0;
      total = (service.price || 0) * hours;
    } else if (isSeries && service.series_price) {
      total = service.series_price;
    } else if (isSeries && service.num_sessions) {
      total = (service.price || 0) * service.num_sessions;
    }
    
    if (isHome && service.has_travel_cost && service.travel_cost) total += service.travel_cost;
    if (isDelivery && service.has_shipping && service.shipping_cost) {
      if (!service.free_shipping_above || total < service.free_shipping_above) total += service.shipping_cost;
    }
    if (selectedDate) {
      const day = selectedDate.getDay();
      // Friday: only apply weekend pricing after 14:00; Saturday: always
      let isWeekendSlot = false;
      if (day === 6) {
        isWeekendSlot = true;
      } else if (day === 5) {
        const timeStr = selectedTime || (selectedShift ? selectedShift.hours.split('-')[0] : '');
        if (timeStr) {
          const hour = parseInt(timeStr.split(':')[0], 10);
          if (hour >= 14) isWeekendSlot = true;
        }
      }
      if (isWeekendSlot && service.weekend_pricing_type !== 'none' && service.weekend_price_addition) {
        if (service.weekend_pricing_type === 'percentage') total += total * (service.weekend_price_addition / 100);
        else total += service.weekend_price_addition;
      }
    }
    return Math.round(total);
  };

  // Validate entire form
  const validateForm = () => {
    if (deliveryTypes.length > 1 && !selectedDeliveryType) {
      toast.error('אנא בחר היכן תרצה לקבל את השירות');
      return false;
    }
    if (!skipTimeSelection) {
      if (!selectedDate) { toast.error('אנא בחר תאריך'); return false; }
      if (!selectedTime && !selectedShift) { toast.error('אנא בחר שעה או משמרת'); return false; }
    }
    if (isVirtual && !selectedPlatform) { toast.error('אנא בחר פלטפורמה'); return false; }
    if (needsAddress && (!serviceAddress.street || !serviceAddress.city)) {
      toast.error('אנא מלא כתובת מתן השירות'); return false;
    }
    if (needsShipping && (!shippingAddress.street || !shippingAddress.city)) {
      toast.error('אנא מלא כתובת למשלוח'); return false;
    }
    if (!contactPerson.name || !contactPerson.phone) {
      toast.error('אנא מלא שם וטלפון של המזמין'); return false;
    }
    if (!acceptTerms) { toast.error('יש לאשר את תנאי השימוש'); return false; }
    if (!acceptCancellation) { toast.error('יש לאשר את מדיניות הביטולים'); return false; }
    return true;
  };

  // Show confirmation summary instead of submitting immediately
  const handleSubmit = () => {
    if (!isAuthenticated && !guestMode) {
      toast.error('יש להתחבר או להמשיך כאורח לפני השלמת ההזמנה');
      return;
    }
    if (!validateForm()) return;
    setShowConfirmation(true);
  };

  // Actual API submission after user confirms
  const handleConfirmedSubmit = async () => {
    try {
      setBooking(true);
      setShowConfirmation(false);
      let bookingDate, bookingTime = null;

      if (skipTimeSelection) {
        bookingDate = new Date().toISOString();
      } else if (selectedDate && selectedTime) {
        bookingDate = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}:00`).toISOString();
        bookingTime = selectedTime;
      } else if (selectedDate && selectedShift) {
        const shiftStart = selectedShift.hours.split('-')[0];
        bookingDate = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${shiftStart}:00`).toISOString();
        bookingTime = shiftStart;
      } else if (selectedDate) {
        bookingDate = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T00:00:00`).toISOString();
      }

      const data = {
        service_id: serviceId,
        booking_date: bookingDate,
        booking_time: bookingTime,
        notes,
        delivery_type: selectedDeliveryType || deliveryTypes[0] || null,
        hours_booked: isHourly ? (selectedShift?.duration || customHours || null) : null,
        selected_shift: selectedShift?.id || null,
        platform: selectedPlatform || null,
        total_price: calculateTotalPrice(),
        num_sessions: isSeries ? (service.num_sessions || null) : null,
        contact_person_name: contactPerson.name,
        contact_person_phone: contactPerson.phone,
        contact_person_relationship: contactPerson.relationship,
        is_contact_same_as_requester: contactPerson.relationship === 'self',
      };

      if ((isHome || selectedDeliveryType === 'clinic' || selectedDeliveryType === 'hospital') && serviceAddress.street) {
        data.service_address = serviceAddress.street;
        data.service_city = serviceAddress.city;
        data.service_apartment = serviceAddress.apartment;
        data.service_floor = serviceAddress.floor;
        data.service_entry_code = serviceAddress.entrance;
        data.service_notes = serviceAddress.specialInstructions;
      }
      if (needsShipping && shippingAddress.street) {
        data.shipping_address = shippingAddress.street;
        data.shipping_city = shippingAddress.city;
        data.shipping_postal_code = shippingAddress.postalCode;
      }
      if (!isAuthenticated && guestMode) {
        data.guest_booking = true;
        data.guest_name = guestDetails.name;
        data.guest_email = guestDetails.email;
        data.guest_phone = guestDetails.phone;
      }

      const res = await api.post('/bookings', data);
      setBookingId(res.data.booking_id);
      setBookingSuccess(true);
    } catch (error) {
      console.error('Booking failed:', error);
      const detail = error.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'שגיאה בשליחת ההזמנה');
    } finally {
      setBooking(false);
    }
  };

  // ==================== LOADING / ERROR ====================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-carefd-teal-pale">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <FaSpinner className="animate-spin text-4xl text-carefd-teal" />
        </div>
      </div>
    );
  }

  if (!service || !provider) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-carefd-teal-pale">
        <Navbar />
        <div className="text-center py-12">
          <p className="text-carefd-gray text-lg">שירות לא נמצא</p>
          <Link to="/services" className="text-carefd-teal hover:underline mt-4 inline-block">חזור לשירותים</Link>
        </div>
      </div>
    );
  }

  const CategoryIcon = categoryConfig.icon;
  const totalPrice = calculateTotalPrice();

  // ==================== SUCCESS ====================

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-carefd-teal-pale">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center border-2 border-green-500">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaCheckCircle className="text-4xl text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-carefd-navy mb-4">ההזמנה נקלטה בהצלחה!</h2>
            <div className="bg-carefd-teal-pale/30 rounded-xl p-6 text-right mb-6 space-y-2 text-sm">
              <p><strong>שירות:</strong> {service.name}</p>
              <p><strong>ספק:</strong> {provider.business_name}</p>
              {selectedDeliveryType && <p><strong>מיקום:</strong> {DELIVERY_TYPES[selectedDeliveryType]?.label}</p>}
              {!skipTimeSelection && selectedDate && <p><strong>תאריך:</strong> {format(selectedDate, 'dd/MM/yyyy', { locale: he })}</p>}
              {selectedTime && <p><strong>שעה:</strong> {selectedTime}</p>}
              {selectedShift && <p><strong>משמרת:</strong> {selectedShift.label}</p>}
              {skipTimeSelection && <p><strong>תיאום:</strong> יתואם טלפונית</p>}
              {selectedPlatform && <p><strong>פלטפורמה:</strong> {TELEMEDICINE_PLATFORMS.find(p => p.id === selectedPlatform)?.label}</p>}
              <div className="border-t border-carefd-teal-pale my-3"></div>
              <p className="text-xl font-bold text-carefd-teal">סה"כ: ₪{totalPrice}</p>
              {bookingId && <p className="text-xs text-carefd-gray">מספר הזמנה: {bookingId}</p>}
            </div>
            <div className="flex gap-3">
              <Link to="/services" className="flex-1 bg-carefd-teal text-white py-3 rounded-xl font-semibold hover:bg-carefd-teal-medium transition">
                חזור לשירותים
              </Link>
              {isAuthenticated && (
                <Link to="/dashboard" className="flex-1 bg-white border-2 border-carefd-teal text-carefd-teal py-3 rounded-xl font-semibold hover:bg-carefd-teal-pale transition">
                  ההזמנות שלי
                </Link>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ==================== MAIN FORM ====================

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-carefd-teal-pale">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">

          {/* ===== LEFT: Form Sections ===== */}
          <div className="lg:col-span-2 space-y-5">

            {/* ===== STEP INDICATOR / STEPPER ===== */}
            {(() => {
              const steps = [
                { num: 1, label: 'סוג שירות', shortLabel: 'שירות' },
                { num: 2, label: 'מועד', shortLabel: 'מועד' },
                { num: 3, label: 'פרטים', shortLabel: 'פרטים' },
                { num: 4, label: 'פרטי מזמין', shortLabel: 'מזמין' },
                { num: 5, label: 'סיכום ואישור', shortLabel: 'אישור' },
              ];
              return (
                <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-5 border border-gray-200" data-testid="booking-stepper">
                  <div className="flex items-center justify-between">
                    {steps.map((step, idx) => (
                      <React.Fragment key={step.num}>
                        <div
                          className={`flex flex-col items-center min-w-0 ${step.num < currentStep ? 'cursor-pointer' : ''}`}
                          onClick={() => step.num < currentStep && setCurrentStep(step.num)}
                        >
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold transition-colors ${
                            step.num < currentStep
                              ? 'bg-green-500 text-white'
                              : step.num === currentStep
                              ? 'bg-carefd-teal text-white'
                              : 'bg-gray-200 text-gray-500'
                          }`}>
                            {step.num < currentStep ? <FaCheckCircle className="text-sm sm:text-base" /> : step.num}
                          </div>
                          <span className={`mt-1 text-center leading-tight ${
                            step.num === currentStep ? 'font-semibold text-carefd-teal' : 'text-carefd-gray'
                          } text-[10px] sm:text-xs`}>
                            <span className="hidden sm:inline">{step.label}</span>
                            <span className="sm:hidden">{step.shortLabel}</span>
                          </span>
                        </div>
                        {idx < steps.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-1 sm:mx-2 ${
                            step.num < currentStep ? 'bg-green-500' : 'bg-gray-200'
                          }`} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* ===== AUTH BANNER (for unauthenticated, non-guest users) ===== */}
            {!isAuthenticated && !guestMode && !authChecked && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5" data-testid="auth-banner">
                <p className="text-sm font-semibold text-carefd-navy mb-3 text-center">
                  <FaInfoCircle className="inline ml-1 text-amber-500" />
                  כדי להשלים הזמנה, התחבר או המשך כאורח
                </p>
                <div className="flex gap-3 justify-center">
                  <Link to={`/login?redirect=/book/${serviceId}`}
                    className="bg-carefd-teal text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-carefd-teal-medium transition flex items-center gap-1.5">
                    <FaSignInAlt /> התחבר
                  </Link>
                  <button onClick={() => { setGuestMode(true); setAuthChecked(true); }}
                    className="bg-white border-2 border-carefd-teal text-carefd-teal px-4 py-2 rounded-xl text-sm font-semibold hover:bg-carefd-teal-pale transition flex items-center gap-1.5">
                    <FaUser /> המשך כאורח
                  </button>
                </div>
              </div>
            )}

            {/* ===== GUEST DETAILS INLINE (shown when guest mode selected) ===== */}
            {!isAuthenticated && guestMode && (
              <div className="bg-white rounded-2xl shadow-lg border-2 border-carefd-teal-pale p-4 sm:p-5" data-testid="guest-details-inline">
                <h3 className="font-bold text-carefd-navy text-sm sm:text-base mb-3 flex items-center gap-2">
                  <FaUser className="text-carefd-teal" /> פרטי אורח
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input type="text" value={guestDetails.name} placeholder="שם מלא *"
                    onChange={(e) => setGuestDetails({...guestDetails, name: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal outline-none text-sm" />
                  <input type="email" value={guestDetails.email} placeholder="אימייל *"
                    onChange={(e) => setGuestDetails({...guestDetails, email: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal outline-none text-sm" />
                  <input type="tel" value={guestDetails.phone} placeholder="טלפון *"
                    onChange={(e) => setGuestDetails({...guestDetails, phone: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal outline-none text-sm" />
                </div>
              </div>
            )}

            {/* ===== STEP 1: SERVICE TYPE & DELIVERY ===== */}
            {currentStep === 1 && (<>
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-5 border-2 border-carefd-teal" data-testid="service-header">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-carefd-teal-pale rounded-xl flex items-center justify-center flex-shrink-0">
                  <CategoryIcon className="text-xl sm:text-2xl text-carefd-teal" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-base sm:text-xl font-bold text-carefd-navy leading-tight">{service.name}</h1>
                  <p className="text-carefd-gray text-sm mt-0.5">{provider.business_name} &bull; {categoryConfig.label}</p>
                  <div className="mt-2 sm:hidden">
                    <span className="text-xl font-bold text-carefd-teal">₪{isSeries && service.series_price ? service.series_price : service.price}</span>
                    <span className="text-xs text-carefd-gray mr-1">{isSeries && service.series_price ? 'לסדרה' : categoryConfig.pricingLabel}</span>
                  </div>
                </div>
                <div className="text-left flex-shrink-0 hidden sm:block">
                  <div className="text-2xl font-bold text-carefd-teal">₪{isSeries && service.series_price ? service.series_price : service.price}</div>
                  <span className="text-xs text-carefd-gray">{isSeries && service.series_price ? 'לסדרה' : categoryConfig.pricingLabel}</span>
                </div>
              </div>
              {isSeries && service.num_sessions && (
                <div className="mt-3 bg-carefd-teal-pale/40 rounded-lg px-4 py-2 text-sm flex items-center gap-2">
                  <FaRedoAlt className="text-carefd-teal" />
                  <span>סדרה של <strong>{service.num_sessions}</strong> מפגשים</span>
                  {service.session_duration_minutes && <span> &bull; {service.session_duration_minutes} דקות למפגש</span>}
                </div>
              )}
            </div>

            {/* 2. WHERE - DELIVERY TYPE */}
            <FormSection icon={FaMapMarkerAlt} title="איפה ניתן השירות?" testId="delivery-section">
              {deliveryTypes.length > 1 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {deliveryTypes.map(dt => {
                    const dtConfig = DELIVERY_TYPES[dt];
                    if (!dtConfig) return null;
                    const DtIcon = dtConfig.icon;
                    return (
                      <button key={dt} onClick={() => setSelectedDeliveryType(dt)}
                        data-testid={`delivery-type-${dt}`}
                        className={`p-3 sm:p-4 rounded-xl border-2 text-center transition ${
                          selectedDeliveryType === dt
                            ? 'border-carefd-teal bg-carefd-teal-pale'
                            : 'border-gray-200 hover:border-carefd-teal-pale'
                        }`}>
                        <DtIcon className="text-lg sm:text-xl text-carefd-teal mx-auto mb-1" />
                        <div className="font-semibold text-carefd-navy text-xs sm:text-sm">{dtConfig.label}</div>
                      </button>
                    );
                  })}
                </div>
              ) : deliveryTypes.length === 1 ? (
                <div className="flex items-center gap-3 text-carefd-navy">
                  {(() => { const DtIcon = DELIVERY_TYPES[deliveryTypes[0]]?.icon || FaMapMarkerAlt; return <DtIcon className="text-lg text-carefd-teal" />; })()}
                  <span className="font-medium">{DELIVERY_TYPES[deliveryTypes[0]]?.label}</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-carefd-navy">
                  <FaMapMarkerAlt className="text-lg text-carefd-teal" />
                  <span className="font-medium text-sm text-carefd-gray">יתואם עם הספק</span>
                </div>
              )}
            </FormSection>
            </>)}

            {/* ===== STEP 2: DATE & TIME ===== */}
            {currentStep === 2 && (<>
            {/* 3. WHEN - DATE & TIME */}
            <FormSection icon={FaCalendarAlt} title="בחר מועד" testId="datetime-section">
              {/* Shift for hourly */}
              {isHourly && (
                <div className="mb-5">
                  <p className="text-sm font-medium text-carefd-navy mb-3">בחר משמרת / שעות</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    {SHIFT_OPTIONS.map(shift => (
                      <button key={shift.id} onClick={() => setSelectedShift(shift)}
                        data-testid={`shift-${shift.id}`}
                        className={`p-3 rounded-xl border-2 text-center transition text-sm ${
                          selectedShift?.id === shift.id
                            ? 'border-carefd-teal bg-carefd-teal-pale'
                            : 'border-gray-200 hover:border-carefd-teal-pale'
                        }`}>
                        <div className="font-semibold text-carefd-navy">{shift.label}</div>
                        <div className="text-xs text-carefd-gray">{shift.hours}</div>
                      </button>
                    ))}
                  </div>
                  {selectedShift?.id === 'custom' && (
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-carefd-navy">מספר שעות (מינימום {service.minimum_hours || 4}):</label>
                      <input type="number" min={service.minimum_hours || 4}
                        value={customHours || service.minimum_hours || 4}
                        onChange={(e) => setCustomHours(Math.max(service.minimum_hours || 4, parseInt(e.target.value) || 0))}
                        className="w-24 px-3 py-2 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal outline-none text-center"
                        data-testid="custom-hours-input" />
                    </div>
                  )}
                </div>
              )}

              {/* Skip time option */}
              <label className="flex items-center gap-3 cursor-pointer mb-5 p-3 bg-amber-50 rounded-xl border border-amber-200" data-testid="skip-time-checkbox">
                <input type="checkbox" checked={skipTimeSelection}
                  onChange={(e) => setSkipTimeSelection(e.target.checked)}
                  className="w-5 h-5 text-carefd-teal rounded border-gray-300 focus:ring-carefd-teal" />
                <div>
                  <span className="font-semibold text-carefd-navy text-sm">תאם מועד מאוחר יותר</span>
                  <p className="text-xs text-carefd-gray">הספק יתקשר לתיאום מועד</p>
                </div>
              </label>

              {/* Calendar */}
              {!skipTimeSelection && (
                <>
                  <BookingCalendar
                    onDateSelect={(date) => { setSelectedDate(date); setSelectedTime(''); }}
                    availability={provider.availability || []}
                    bookedSlots={bookedSlots.map(slot => slot.split(' ')[0])}
                  />
                  {selectedDate && (
                    <div className="mt-5 pt-5 border-t border-carefd-teal-pale">
                      <p className="text-sm font-medium text-carefd-navy mb-3 flex items-center gap-2">
                        <FaClock className="text-carefd-teal" />
                        {isHourly ? 'בחר שעת התחלה' : 'בחר שעה'}
                      </p>
                      <TimeSlotPicker
                        selectedDate={selectedDate}
                        availability={provider.availability || []}
                        onTimeSelect={(time) => setSelectedTime(time)}
                        bookedTimes={bookedSlots}
                      />
                    </div>
                  )}
                </>
              )}
            </FormSection>
            </>)}

            {/* ===== STEP 3: DETAILS (Location + Notes) ===== */}
            {currentStep === 3 && (<>
            {/* 4. LOCATION - Address / Platform */}
            <FormSection 
              icon={isVirtual ? FaLaptopMedical : FaMapMarkerAlt} 
              title={isVirtual ? 'פלטפורמה לשיחה' : 'מיקום מתן השירות'}
              testId="location-section"
            >
              {/* Virtual → Platform selection */}
              {isVirtual && (
                <div className="grid grid-cols-2 gap-3">
                  {TELEMEDICINE_PLATFORMS.map(platform => {
                    const PlatformIcon = platform.icon;
                    return (
                      <button key={platform.id} onClick={() => setSelectedPlatform(platform.id)}
                        data-testid={`platform-${platform.id}`}
                        className={`p-4 rounded-xl border-2 flex items-center gap-3 transition ${
                          selectedPlatform === platform.id
                            ? 'border-carefd-teal bg-carefd-teal-pale'
                            : 'border-gray-200 hover:border-carefd-teal-pale'
                        }`}>
                        <PlatformIcon className="text-xl text-carefd-teal" />
                        <span className="font-medium text-carefd-navy text-sm">{platform.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Home → Full address form */}
              {isHome && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm font-medium text-carefd-navy">כתובת הלקוח</p>
                    {user && (
                      <button type="button"
                        onClick={() => setServiceAddress(prev => ({ ...prev, street: user.address || prev.street, city: user.city || prev.city }))}
                        className="text-xs text-carefd-teal bg-carefd-teal-pale/40 hover:bg-carefd-teal-pale px-3 py-1.5 rounded-full transition"
                        data-testid="fill-my-address-btn">
                        <FaMapMarkerAlt className="inline text-[10px] ml-1" />הכתובת שלי
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <input type="text" value={serviceAddress.street} placeholder="רחוב ומספר *"
                        onChange={(e) => setServiceAddress({...serviceAddress, street: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal outline-none text-sm"
                        data-testid="address-street" />
                    </div>
                    <input type="text" value={serviceAddress.city} placeholder="עיר *"
                      onChange={(e) => setServiceAddress({...serviceAddress, city: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal outline-none text-sm"
                      data-testid="address-city" />
                    <div className="grid grid-cols-3 gap-2">
                      <input type="text" value={serviceAddress.apartment} placeholder="דירה"
                        onChange={(e) => setServiceAddress({...serviceAddress, apartment: e.target.value})}
                        className="w-full px-3 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal outline-none text-sm" />
                      <input type="text" value={serviceAddress.floor} placeholder="קומה"
                        onChange={(e) => setServiceAddress({...serviceAddress, floor: e.target.value})}
                        className="w-full px-3 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal outline-none text-sm" />
                      <input type="text" value={serviceAddress.entrance} placeholder="כניסה"
                        onChange={(e) => setServiceAddress({...serviceAddress, entrance: e.target.value})}
                        className="w-full px-3 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal outline-none text-sm" />
                    </div>
                    <div className="sm:col-span-2">
                      <textarea value={serviceAddress.specialInstructions} placeholder="הנחיות הגעה (קוד כניסה, חניה...)"
                        onChange={(e) => setServiceAddress({...serviceAddress, specialInstructions: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal outline-none resize-none text-sm" rows="2" />
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery → Shipping address */}
              {isDelivery && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <input type="text" value={shippingAddress.street} placeholder="רחוב ומספר *"
                      onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal outline-none text-sm"
                      data-testid="shipping-street" />
                  </div>
                  <input type="text" value={shippingAddress.city} placeholder="עיר *"
                    onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal outline-none text-sm"
                    data-testid="shipping-city" />
                  <input type="text" value={shippingAddress.apartment} placeholder="דירה"
                    onChange={(e) => setShippingAddress({...shippingAddress, apartment: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal outline-none text-sm" />
                </div>
              )}

              {/* Clinic / Hospital → Address + notes */}
              {(selectedDeliveryType === 'clinic' || selectedDeliveryType === 'hospital') && (
                <div>
                  <p className="text-sm font-medium text-carefd-navy mb-3">
                    {selectedDeliveryType === 'hospital' ? 'כתובת בית החולים / מוסד' : 'כתובת הקליניקה'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <input type="text" value={serviceAddress.street} placeholder="רחוב ומספר"
                        onChange={(e) => setServiceAddress({...serviceAddress, street: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal outline-none text-sm"
                        data-testid="location-street" />
                    </div>
                    <input type="text" value={serviceAddress.city} placeholder="עיר"
                      onChange={(e) => setServiceAddress({...serviceAddress, city: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal outline-none text-sm"
                      data-testid="location-city" />
                    <input type="text" value={serviceAddress.floor} placeholder="קומה / מחלקה / חדר"
                      onChange={(e) => setServiceAddress({...serviceAddress, floor: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal outline-none text-sm" />
                    <div className="sm:col-span-2">
                      <textarea value={serviceAddress.specialInstructions} placeholder="הערות (כניסה, חניה, הנחיות מיוחדות...)"
                        onChange={(e) => setServiceAddress({...serviceAddress, specialInstructions: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal outline-none resize-none text-sm" rows="2" />
                    </div>
                  </div>
                </div>
              )}

              {/* No delivery type selected yet */}
              {!selectedDeliveryType && (
                <p className="text-sm text-carefd-gray">בחר תחילה היכן ניתן השירות</p>
              )}
            </FormSection>

            </>)}

            {/* ===== STEP 4: REQUESTER DETAILS ===== */}
            {currentStep === 4 && (<>
            <FormSection icon={FaUserFriends} title="למי - פרטי מזמין ואיש קשר" testId="contact-section">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-medium text-carefd-navy">פרטי המזמין</p>
                {user && (
                  <button type="button"
                    onClick={() => setContactPerson({ name: user.name || '', phone: user.phone || '', relationship: 'self' })}
                    className="text-xs text-carefd-teal bg-carefd-teal-pale/40 hover:bg-carefd-teal-pale px-3 py-1.5 rounded-full transition"
                    data-testid="fill-my-details-btn">
                    <FaUser className="inline text-[10px] ml-1" /> הפרטים שלי
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-carefd-navy mb-1">שם מלא *</label>
                  <input type="text" value={contactPerson.name}
                    onChange={(e) => setContactPerson({...contactPerson, name: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal outline-none text-sm"
                    placeholder="שם מלא" data-testid="requester-name" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-carefd-navy mb-1">טלפון *</label>
                  <input type="tel" value={contactPerson.phone}
                    onChange={(e) => setContactPerson({...contactPerson, phone: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal outline-none text-sm"
                    placeholder="050-0000000" data-testid="requester-phone" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-carefd-navy mb-1">קרבה למטופל</label>
                  <select value={contactPerson.relationship}
                    onChange={(e) => setContactPerson({...contactPerson, relationship: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal outline-none text-sm"
                    data-testid="requester-relationship">
                    <option value="">בחר</option>
                    <option value="self">בעצמי</option>
                    <option value="spouse">בן/בת זוג</option>
                    <option value="child">ילד/ה</option>
                    <option value="parent">הורה</option>
                    <option value="other">אחר</option>
                  </select>
                </div>
              </div>
            </FormSection>

            {/* 6. NOTES */}
            <FormSection icon={FaStickyNote} title="הערות" testId="notes-section">
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="3"
                className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl focus:border-carefd-teal outline-none resize-none text-sm"
                placeholder="הערות מיוחדות, בקשות, מידע רפואי רלוונטי..."
                data-testid="booking-notes" />
            </FormSection>
            </>)}

            {/* ===== STEP 5: SUMMARY & CONFIRMATION ===== */}
            {currentStep === 5 && (<>
            {/* 7. TERMS */}
            <FormSection icon={FaFileContract} title="תנאים ואישורים" testId="terms-section">
              <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl mb-3 cursor-pointer hover:bg-carefd-teal-pale/20 transition">
                <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="w-5 h-5 mt-0.5 text-carefd-teal rounded border-gray-300 focus:ring-carefd-teal"
                  data-testid="accept-terms" />
                <span className="text-sm">
                  <span className="text-carefd-navy">אני מאשר/ת את </span>
                  <Link to="/terms" target="_blank" className="text-carefd-teal hover:underline">תנאי השימוש</Link>
                  <span className="text-carefd-navy"> *</span>
                </span>
              </label>
              <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-carefd-teal-pale/20 transition">
                <input type="checkbox" checked={acceptCancellation} onChange={(e) => setAcceptCancellation(e.target.checked)}
                  className="w-5 h-5 mt-0.5 text-carefd-teal rounded border-gray-300 focus:ring-carefd-teal"
                  data-testid="accept-cancellation" />
                <div className="text-sm">
                  <span className="text-carefd-navy">אני מאשר/ת את </span>
                  <Link to="/terms#cancellation" target="_blank" className="text-carefd-teal hover:underline">מדיניות הביטולים</Link>
                  <span className="text-carefd-navy"> *</span>
                  <p className="text-xs text-carefd-gray mt-1">ביטול עד 24 שעות לפני - ללא עלות. ביטול מאוחר - 50%.</p>
                </div>
              </label>
            </FormSection>
            </>)}

            {/* ===== STEP NAVIGATION BUTTONS ===== */}
            <div className="flex justify-between items-center mt-2">
              {currentStep > 1 ? (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-gray-200 text-carefd-navy rounded-xl font-medium hover:border-carefd-teal hover:bg-carefd-teal-pale/20 transition"
                >
                  <FaChevronRight size={12} />
                  הקודם
                </button>
              ) : <div />}

              {currentStep < 5 ? (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="flex items-center gap-2 px-6 py-3 bg-carefd-teal text-white rounded-xl font-bold hover:bg-carefd-teal-medium transition shadow-md"
                >
                  הבא
                  <FaChevronLeft size={12} />
                </button>
              ) : null}
            </div>
          </div>

          {/* ===== RIGHT: Sticky Summary ===== */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border-2 border-carefd-teal sticky top-4" data-testid="order-summary">
              <h3 className="font-bold text-base sm:text-lg text-carefd-navy mb-4">סיכום הזמנה</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-carefd-gray">שירות:</span><span className="font-medium text-carefd-navy">{service.name}</span></div>
                <div className="flex justify-between"><span className="text-carefd-gray">סוג:</span><span className="font-medium text-carefd-navy">{categoryConfig.label}</span></div>
                
                {selectedDeliveryType && (
                  <div className="flex justify-between"><span className="text-carefd-gray">מיקום:</span><span className="font-medium text-carefd-navy">{DELIVERY_TYPES[selectedDeliveryType]?.label}</span></div>
                )}
                {!skipTimeSelection && selectedDate && (
                  <div className="flex justify-between"><span className="text-carefd-gray">תאריך:</span><span className="font-medium text-carefd-navy">{format(selectedDate, 'dd/MM/yyyy', { locale: he })}</span></div>
                )}
                {selectedTime && (
                  <div className="flex justify-between"><span className="text-carefd-gray">שעה:</span><span className="font-medium text-carefd-navy">{selectedTime}</span></div>
                )}
                {selectedShift && (
                  <div className="flex justify-between"><span className="text-carefd-gray">משמרת:</span><span className="font-medium text-carefd-navy">{selectedShift.label}</span></div>
                )}
                {skipTimeSelection && (
                  <div className="flex justify-between"><span className="text-carefd-gray">תיאום:</span><span className="font-medium text-amber-600">יתואם טלפונית</span></div>
                )}
                {selectedPlatform && (
                  <div className="flex justify-between"><span className="text-carefd-gray">פלטפורמה:</span><span className="font-medium text-carefd-navy">{TELEMEDICINE_PLATFORMS.find(p => p.id === selectedPlatform)?.label}</span></div>
                )}
                {isSeries && service.num_sessions && (
                  <div className="flex justify-between"><span className="text-carefd-gray">מפגשים:</span><span className="font-medium text-carefd-navy">{service.num_sessions}</span></div>
                )}

                <div className="border-t border-carefd-teal-pale my-3"></div>

                {isHourly ? (
                  <div className="flex justify-between"><span className="text-carefd-gray">₪{service.price} x {selectedShift?.duration || customHours} שעות</span><span className="font-medium">₪{service.price * (selectedShift?.duration || customHours)}</span></div>
                ) : isSeries && service.num_sessions ? (
                  <div className="flex justify-between"><span className="text-carefd-gray">{service.num_sessions} מפגשים</span><span className="font-medium">₪{service.series_price || service.price * service.num_sessions}</span></div>
                ) : (
                  <div className="flex justify-between"><span className="text-carefd-gray">מחיר בסיס:</span><span className="font-medium">₪{service.price}</span></div>
                )}
                
                {isHome && service.has_travel_cost && service.travel_cost > 0 && (
                  <div className="flex justify-between text-carefd-gray"><span>נסיעות:</span><span>₪{service.travel_cost}</span></div>
                )}
                {isDelivery && service.has_shipping && service.shipping_cost > 0 && (
                  <div className="flex justify-between text-carefd-gray"><span>משלוח:</span><span>₪{service.shipping_cost}</span></div>
                )}

                <div className="border-t border-carefd-teal-pale my-3"></div>
                <div className="flex justify-between text-lg">
                  <span className="font-bold text-carefd-navy">סה"כ:</span>
                  <span className="font-bold text-carefd-teal">₪{totalPrice}</span>
                </div>
              </div>

              <button onClick={handleSubmit} disabled={booking}
                className="w-full mt-6 bg-carefd-teal text-white py-4 rounded-xl font-bold text-lg hover:bg-carefd-teal-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="booking-submit-btn">
                {booking ? (
                  <><FaSpinner className="animate-spin" /> מעבד...</>
                ) : (
                  <><FaCheckCircle /> אשר והזמן</>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
      
      <Footer />

      {/* ===== CONFIRMATION MODAL OVERLAY ===== */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" data-testid="confirmation-overlay">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8">
            <h2 className="text-xl font-bold text-carefd-navy mb-5 text-center flex items-center justify-center gap-2">
              <FaCheckCircle className="text-carefd-teal" /> סיכום הזמנה - אישור סופי
            </h2>

            <div className="space-y-3 text-sm text-right">
              {/* Service & Provider */}
              <div className="bg-carefd-teal-pale/30 rounded-xl p-4 space-y-1.5">
                <div className="flex justify-between"><span className="text-carefd-gray">שירות:</span><span className="font-semibold text-carefd-navy">{service.name}</span></div>
                <div className="flex justify-between"><span className="text-carefd-gray">ספק:</span><span className="font-medium text-carefd-navy">{provider.business_name}</span></div>
                <div className="flex justify-between"><span className="text-carefd-gray">סוג:</span><span className="font-medium text-carefd-navy">{categoryConfig.label}</span></div>
              </div>

              {/* Delivery & Schedule */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
                {selectedDeliveryType && (
                  <div className="flex justify-between"><span className="text-carefd-gray">מיקום:</span><span className="font-medium text-carefd-navy">{DELIVERY_TYPES[selectedDeliveryType]?.label}</span></div>
                )}
                {!skipTimeSelection && selectedDate && (
                  <div className="flex justify-between"><span className="text-carefd-gray">תאריך:</span><span className="font-medium text-carefd-navy">{format(selectedDate, 'dd/MM/yyyy', { locale: he })}</span></div>
                )}
                {selectedTime && (
                  <div className="flex justify-between"><span className="text-carefd-gray">שעה:</span><span className="font-medium text-carefd-navy">{selectedTime}</span></div>
                )}
                {selectedShift && (
                  <div className="flex justify-between"><span className="text-carefd-gray">משמרת:</span><span className="font-medium text-carefd-navy">{selectedShift.label} ({selectedShift.hours})</span></div>
                )}
                {skipTimeSelection && (
                  <div className="flex justify-between"><span className="text-carefd-gray">תיאום:</span><span className="font-medium text-amber-600">יתואם טלפונית</span></div>
                )}
                {selectedPlatform && (
                  <div className="flex justify-between"><span className="text-carefd-gray">פלטפורמה:</span><span className="font-medium text-carefd-navy">{TELEMEDICINE_PLATFORMS.find(p => p.id === selectedPlatform)?.label}</span></div>
                )}
              </div>

              {/* Address (if applicable) */}
              {(isHome || selectedDeliveryType === 'clinic' || selectedDeliveryType === 'hospital') && serviceAddress.street && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
                  <div className="flex justify-between"><span className="text-carefd-gray">כתובת:</span><span className="font-medium text-carefd-navy">{serviceAddress.street}, {serviceAddress.city}</span></div>
                  {serviceAddress.floor && <div className="flex justify-between"><span className="text-carefd-gray">קומה:</span><span className="font-medium text-carefd-navy">{serviceAddress.floor}</span></div>}
                  {serviceAddress.apartment && <div className="flex justify-between"><span className="text-carefd-gray">דירה:</span><span className="font-medium text-carefd-navy">{serviceAddress.apartment}</span></div>}
                </div>
              )}
              {isDelivery && shippingAddress.street && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
                  <div className="flex justify-between"><span className="text-carefd-gray">משלוח ל:</span><span className="font-medium text-carefd-navy">{shippingAddress.street}, {shippingAddress.city}</span></div>
                </div>
              )}

              {/* Contact */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
                <div className="flex justify-between"><span className="text-carefd-gray">שם מזמין:</span><span className="font-medium text-carefd-navy">{contactPerson.name}</span></div>
                <div className="flex justify-between"><span className="text-carefd-gray">טלפון:</span><span className="font-medium text-carefd-navy">{contactPerson.phone}</span></div>
                {contactPerson.relationship && <div className="flex justify-between"><span className="text-carefd-gray">קרבה:</span><span className="font-medium text-carefd-navy">{contactPerson.relationship === 'self' ? 'בעצמי' : contactPerson.relationship}</span></div>}
              </div>

              {/* Price breakdown */}
              <div className="bg-carefd-teal-pale/30 rounded-xl p-4 space-y-1.5">
                {isHourly ? (
                  <div className="flex justify-between"><span className="text-carefd-gray">₪{service.price} x {selectedShift?.duration || customHours} שעות</span><span className="font-medium">₪{service.price * (selectedShift?.duration || customHours)}</span></div>
                ) : isSeries && service.num_sessions ? (
                  <div className="flex justify-between"><span className="text-carefd-gray">{service.num_sessions} מפגשים</span><span className="font-medium">₪{service.series_price || service.price * service.num_sessions}</span></div>
                ) : (
                  <div className="flex justify-between"><span className="text-carefd-gray">מחיר בסיס:</span><span className="font-medium">₪{service.price}</span></div>
                )}
                {isHome && service.has_travel_cost && service.travel_cost > 0 && (
                  <div className="flex justify-between text-carefd-gray"><span>נסיעות:</span><span>₪{service.travel_cost}</span></div>
                )}
                {isDelivery && service.has_shipping && service.shipping_cost > 0 && (
                  <div className="flex justify-between text-carefd-gray"><span>משלוח:</span><span>₪{service.shipping_cost}</span></div>
                )}
                <div className="border-t border-carefd-teal-pale my-2"></div>
                <div className="flex justify-between text-lg">
                  <span className="font-bold text-carefd-navy">סה"כ לתשלום:</span>
                  <span className="font-bold text-carefd-teal">₪{totalPrice}</span>
                </div>
              </div>

              {notes && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <span className="text-carefd-gray text-xs">הערות:</span>
                  <p className="text-carefd-navy text-sm mt-1">{notes}</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-6">
              <button onClick={handleConfirmedSubmit} disabled={booking}
                className="flex-1 bg-carefd-teal text-white py-3.5 rounded-xl font-bold text-base hover:bg-carefd-teal-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="confirm-booking-btn">
                {booking ? <><FaSpinner className="animate-spin" /> מעבד...</> : <><FaCheckCircle /> אשר הזמנה</>}
              </button>
              <button onClick={() => setShowConfirmation(false)}
                className="flex-1 bg-white border-2 border-gray-300 text-carefd-navy py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                data-testid="back-to-edit-btn">
                <FaArrowRight /> חזור לעריכה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookService;
