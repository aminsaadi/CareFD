import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BookingCalendar from '../components/BookingCalendar';
import TimeSlotPicker from '../components/TimeSlotPicker';
import api from '../utils/api';
import { format, addHours } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCalendarAlt,
  FaClock, FaCheckCircle, FaSpinner, FaArrowRight, FaUserPlus,
  FaSignInAlt, FaHome, FaVideo, FaPhoneAlt, FaTruck, FaBuilding,
  FaWhatsapp, FaExternalLinkAlt, FaFileContract, FaTimesCircle,
  FaInfoCircle, FaCalculator, FaUserFriends, FaStickyNote
} from 'react-icons/fa';

// Service type configurations
const SERVICE_TYPE_CONFIG = {
  home_visit: {
    label: 'ביקור בבית',
    icon: FaHome,
    requiresAddress: true,
    requiresContact: true,
    showTimeSlots: true
  },
  clinic_visit: {
    label: 'ביקור במרפאה',
    icon: FaBuilding,
    requiresAddress: false,
    requiresContact: false,
    showTimeSlots: true
  },
  video_call: {
    label: 'טלרפואה',
    icon: FaVideo,
    requiresAddress: false,
    requiresContact: false,
    showTimeSlots: true,
    showPlatformSelect: true
  },
  phone_call: {
    label: 'שיחה טלפונית',
    icon: FaPhoneAlt,
    requiresAddress: false,
    requiresContact: false,
    showTimeSlots: true
  },
  hourly: {
    label: 'שירות לפי שעות',
    icon: FaClock,
    requiresAddress: true,
    requiresContact: true,
    showShiftSelect: true
  },
  product: {
    label: 'מוצר',
    icon: FaTruck,
    requiresAddress: true,
    requiresShipping: true,
    showTimeSlots: false
  }
};

// Telemedicine platforms
const TELEMEDICINE_PLATFORMS = [
  { id: 'phone', label: 'שיחה טלפונית', icon: FaPhoneAlt },
  { id: 'whatsapp', label: 'WhatsApp', icon: FaWhatsapp },
  { id: 'zoom', label: 'Zoom', icon: FaVideo },
  { id: 'google_meet', label: 'Google Meet', icon: FaExternalLinkAlt }
];

// Shift options for hourly services
const SHIFT_OPTIONS = [
  { id: 'morning', label: 'משמרת בוקר', hours: '07:00-15:00', duration: 8 },
  { id: 'afternoon', label: 'משמרת צהריים', hours: '15:00-23:00', duration: 8 },
  { id: 'night', label: 'משמרת לילה', hours: '23:00-07:00', duration: 8 },
  { id: 'half_day', label: 'חצי יום', hours: '4 שעות', duration: 4 },
  { id: 'custom', label: 'מותאם אישית', hours: 'בחר שעות', duration: 0 }
];

const BookService = () => {
  const { t } = useTranslation();
  const { serviceId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Basic states
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [service, setService] = useState(null);
  const [provider, setProvider] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [step, setStep] = useState(1);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  
  // Booking form states
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [skipTimeSelection, setSkipTimeSelection] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [customHours, setCustomHours] = useState(4);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [notes, setNotes] = useState('');
  
  // Address & Contact states
  const [serviceAddress, setServiceAddress] = useState({
    street: '',
    city: '',
    apartment: '',
    floor: '',
    entrance: '',
    specialInstructions: ''
  });
  
  const [contactPerson, setContactPerson] = useState({
    name: '',
    phone: '',
    relationship: ''
  });
  
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    apartment: '',
    postalCode: ''
  });
  
  // Terms acceptance
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptCancellation, setAcceptCancellation] = useState(false);
  
  // Guest mode
  const [guestMode, setGuestMode] = useState(false);
  const [guestDetails, setGuestDetails] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [guestErrors, setGuestErrors] = useState({});

  useEffect(() => {
    fetchServiceDetails();
  }, [serviceId]);

  const fetchServiceDetails = async () => {
    try {
      setLoading(true);
      const serviceResponse = await api.get(`/services?service_id=${serviceId}`);
      const services = serviceResponse.data.services || [];
      const foundService = services.find(s => s.service_id === serviceId);
      
      if (!foundService) {
        throw new Error('Service not found');
      }
      
      setService(foundService);
      
      const providerResponse = await api.get(`/providers/${foundService.provider_id}`);
      setProvider(providerResponse.data);
      
      try {
        const bookingsResponse = await api.get(`/bookings?provider_id=${foundService.provider_id}`);
        const bookings = bookingsResponse.data.bookings || [];
        const booked = bookings
          .filter(b => b.status !== 'cancelled')
          .map(b => format(new Date(b.booking_date), 'yyyy-MM-dd HH:mm'));
        setBookedSlots(booked);
      } catch {
        setBookedSlots([]);
      }
    } catch (error) {
      console.error('Failed to fetch service:', error);
      toast.error('אירעה שגיאה, אנא נסו שוב');
      navigate('/services');
    } finally {
      setLoading(false);
    }
  };

  // Get service type config
  const serviceTypeConfig = SERVICE_TYPE_CONFIG[service?.service_type] || SERVICE_TYPE_CONFIG.home_visit;

  // Calculate total price
  const calculateTotalPrice = () => {
    if (!service) return 0;
    
    let total = 0;
    const basePrice = service.price || 0;
    
    if (service.service_type === 'hourly' && service.pricing_type === 'hourly') {
      const hours = selectedShift?.duration || customHours;
      total = basePrice * hours;
    } else {
      total = basePrice;
    }
    
    // Add travel fee if applicable
    if (service.travel_fee && (service.service_type === 'home_visit' || service.service_type === 'hourly')) {
      total += service.travel_fee;
    }
    
    // Add shipping fee for products
    if (service.service_type === 'product' && service.shipping_fee) {
      total += service.shipping_fee;
    }
    
    // Weekend surcharge
    if (selectedDate) {
      const dayOfWeek = selectedDate.getDay();
      if ((dayOfWeek === 5 || dayOfWeek === 6) && service.weekend_surcharge) {
        total += service.weekend_surcharge;
      }
    }
    
    return total;
  };

  const validateStep1 = () => {
    if (skipTimeSelection) return true;
    
    if (serviceTypeConfig.showShiftSelect) {
      if (!selectedShift && !customHours) {
        toast.error('אנא בחר משמרת או מספר שעות');
        return false;
      }
      if (!selectedDate) {
        toast.error('אנא בחר תאריך');
        return false;
      }
      return true;
    }
    
    if (serviceTypeConfig.showTimeSlots) {
      if (!selectedDate || !selectedTime) {
        toast.error('אנא בחר תאריך ושעה');
        return false;
      }
    }
    
    return true;
  };

  const validateStep2 = () => {
    if (serviceTypeConfig.requiresAddress) {
      if (!serviceAddress.street || !serviceAddress.city) {
        toast.error('אנא מלא כתובת מלאה');
        return false;
      }
    }
    
    if (serviceTypeConfig.requiresShipping) {
      if (!shippingAddress.street || !shippingAddress.city) {
        toast.error('אנא מלא כתובת למשלוח');
        return false;
      }
    }
    
    if (serviceTypeConfig.showPlatformSelect && !selectedPlatform) {
      toast.error('אנא בחר פלטפורמה לשיחה');
      return false;
    }
    
    return true;
  };

  const validateStep3 = () => {
    if (!acceptTerms) {
      toast.error('יש לאשר את תנאי השימוש');
      return false;
    }
    if (!acceptCancellation) {
      toast.error('יש לאשר את מדיניות הביטולים');
      return false;
    }
    return true;
  };

  const validateGuestDetails = () => {
    const errors = {};
    if (!guestDetails.name.trim()) errors.name = 'נא להזין שם מלא';
    if (!guestDetails.email.trim()) errors.email = 'נא להזין אימייל';
    else if (!/\S+@\S+\.\S+/.test(guestDetails.email)) errors.email = 'אימייל לא תקין';
    if (!guestDetails.phone.trim()) errors.phone = 'נא להזין טלפון';
    setGuestErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      if (isAuthenticated) {
        setStep(3);
      } else {
        setStep('auth');
      }
    } else if (step === 3 && validateStep3()) {
      handleBooking();
    }
  };

  const handleBooking = async () => {
    try {
      setBooking(true);
      
      let bookingDate;
      let bookingTime = null;
      
      if (skipTimeSelection) {
        // Send today's date as fallback when skipping time selection
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
      
      const bookingData = {
        service_id: serviceId,
        booking_date: bookingDate,
        booking_time: bookingTime,
        notes,
        delivery_type: service.service_type,
        hours_booked: selectedShift?.duration || customHours || null,
      };

      // Flatten address fields for backend
      if (serviceTypeConfig.requiresAddress && serviceAddress) {
        bookingData.service_address = serviceAddress.street || '';
        bookingData.service_city = serviceAddress.city || '';
        bookingData.service_apartment = serviceAddress.apartment || '';
        bookingData.service_floor = serviceAddress.floor || '';
        bookingData.service_entry_code = serviceAddress.entrance || '';
        bookingData.service_notes = serviceAddress.specialInstructions || '';
      }

      // Flatten shipping address for products
      if (serviceTypeConfig.requiresShipping && shippingAddress) {
        bookingData.shipping_address = shippingAddress.street || '';
        bookingData.shipping_city = shippingAddress.city || '';
        bookingData.shipping_postal_code = shippingAddress.postalCode || '';
      }

      // Flatten contact person fields
      if (serviceTypeConfig.requiresContact && contactPerson) {
        bookingData.is_contact_same_as_requester = contactPerson.relationship === 'self';
        bookingData.contact_person_name = contactPerson.name || '';
        bookingData.contact_person_phone = contactPerson.phone || '';
        bookingData.contact_person_relationship = contactPerson.relationship || '';
      }

      if (!isAuthenticated && guestMode) {
        bookingData.guest_booking = true;
        bookingData.guest_name = guestDetails.name;
        bookingData.guest_email = guestDetails.email;
        bookingData.guest_phone = guestDetails.phone;
      }

      const response = await api.post('/bookings', bookingData);
      
      setBookingId(response.data.booking_id);
      setBookingSuccess(true);
      setStep('success');
    } catch (error) {
      console.error('Booking failed:', error);
      const detail = error.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : 'שגיאה בשליחת ההזמנה, אנא נסו שוב';
      toast.error(msg);
    } finally {
      setBooking(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-carelink-teal-pale">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <FaSpinner className="animate-spin text-4xl text-carelink-teal" />
        </div>
      </div>
    );
  }

  if (!service || !provider) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-carelink-teal-pale">
        <Navbar />
        <div className="text-center py-12">
          <p className="text-carelink-gray text-lg">שירות לא נמצא</p>
          <Link to="/services" className="text-carelink-teal hover:underline mt-4 inline-block">
            חזור לשירותים
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-carelink-teal-pale">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center border-2 border-green-500">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaCheckCircle className="text-4xl text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-carelink-navy mb-4">ההזמנה נקלטה בהצלחה!</h2>
            
            <div className="bg-carelink-teal-pale/30 rounded-xl p-6 text-right mb-6">
              <h3 className="font-bold text-carelink-navy mb-3">סיכום ההזמנה:</h3>
              <div className="space-y-2 text-sm">
                <p><strong>שירות:</strong> {service.name}</p>
                <p><strong>סוג:</strong> {serviceTypeConfig.label}</p>
                <p><strong>ספק:</strong> {provider.business_name}</p>
                {!skipTimeSelection && selectedDate && (
                  <p><strong>תאריך:</strong> {format(selectedDate, 'dd/MM/yyyy', { locale: he })}</p>
                )}
                {selectedTime && <p><strong>שעה:</strong> {selectedTime}</p>}
                {selectedShift && <p><strong>משמרת:</strong> {selectedShift.label}</p>}
                {skipTimeSelection && <p><strong>תיאום:</strong> יתואם טלפונית</p>}
                {selectedPlatform && (
                  <p><strong>פלטפורמה:</strong> {TELEMEDICINE_PLATFORMS.find(p => p.id === selectedPlatform)?.label}</p>
                )}
                <div className="border-t border-carelink-teal-pale my-3"></div>
                <p className="text-xl font-bold text-carelink-teal">סה"כ לתשלום: ₪{calculateTotalPrice()}</p>
                {bookingId && <p className="text-xs text-carelink-gray">מספר הזמנה: {bookingId}</p>}
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                to="/services"
                className="flex-1 bg-carelink-teal text-white py-3 rounded-xl font-semibold hover:bg-carelink-teal-medium transition"
              >
                חזור לשירותים
              </Link>
              {isAuthenticated && (
                <Link
                  to="/dashboard"
                  className="flex-1 bg-white border-2 border-carelink-teal text-carelink-teal py-3 rounded-xl font-semibold hover:bg-carelink-teal-pale transition"
                >
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

  const ServiceTypeIcon = serviceTypeConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-carelink-teal-pale">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2 sm:gap-4">
            {[
              { num: 1, label: 'בחירת מועד' },
              { num: 2, label: 'פרטים נוספים' },
              { num: 3, label: 'אישור וסיכום' }
            ].map((s, i) => (
              <React.Fragment key={s.num}>
                <div 
                  className={`flex items-center gap-2 cursor-pointer ${step >= s.num ? 'text-carelink-teal' : 'text-carelink-gray'}`}
                  onClick={() => step > s.num && setStep(s.num)}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    step >= s.num ? 'bg-carelink-teal text-white' : 'bg-gray-200'
                  }`}>
                    {step > s.num ? <FaCheckCircle /> : s.num}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">{s.label}</span>
                </div>
                {i < 2 && <div className="w-8 sm:w-16 h-0.5 bg-gray-200"></div>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Service Header */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6 border-2 border-carelink-teal-pale">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-carelink-teal-pale rounded-xl flex items-center justify-center">
              <ServiceTypeIcon className="text-2xl text-carelink-teal" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-carelink-navy">{service.name}</h1>
              <p className="text-carelink-gray text-sm">{provider.business_name} • {serviceTypeConfig.label}</p>
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold text-carelink-teal">₪{service.price}</div>
              {service.pricing_type === 'hourly' && <span className="text-xs text-carelink-gray">לשעה</span>}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Step 1: Date & Time Selection */}
            {step === 1 && (
              <>
                {/* Skip Time Option */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-carelink-teal-pale">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={skipTimeSelection}
                      onChange={(e) => setSkipTimeSelection(e.target.checked)}
                      className="w-5 h-5 text-carelink-teal rounded border-gray-300 focus:ring-carelink-teal"
                    />
                    <div>
                      <span className="font-semibold text-carelink-navy">תאם מועד טלפוני</span>
                      <p className="text-sm text-carelink-gray">הספק יתקשר אליך לתיאום מועד נוח</p>
                    </div>
                  </label>
                </div>

                {!skipTimeSelection && (
                  <>
                    {/* Shift Selection for Hourly Services */}
                    {serviceTypeConfig.showShiftSelect && (
                      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-carelink-teal-pale">
                        <h2 className="text-lg font-bold mb-4 text-carelink-navy flex items-center gap-2">
                          <FaClock className="text-carelink-teal" />
                          בחר משמרת / שעות
                        </h2>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                          {SHIFT_OPTIONS.map(shift => (
                            <button
                              key={shift.id}
                              onClick={() => setSelectedShift(shift)}
                              className={`p-4 rounded-xl border-2 text-center transition ${
                                selectedShift?.id === shift.id
                                  ? 'border-carelink-teal bg-carelink-teal-pale'
                                  : 'border-gray-200 hover:border-carelink-teal-pale'
                              }`}
                            >
                              <div className="font-semibold text-carelink-navy">{shift.label}</div>
                              <div className="text-sm text-carelink-gray">{shift.hours}</div>
                            </button>
                          ))}
                        </div>

                        {selectedShift?.id === 'custom' && (
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-carelink-navy mb-2">
                              מספר שעות (מינימום {service.minimum_hours || 4})
                            </label>
                            <input
                              type="number"
                              min={service.minimum_hours || 4}
                              value={customHours}
                              onChange={(e) => setCustomHours(parseInt(e.target.value) || 4)}
                              className="w-32 px-4 py-2 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal outline-none"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Calendar for Time Slot Services */}
                    {serviceTypeConfig.showTimeSlots && (
                      <>
                        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-carelink-teal-pale">
                          <h2 className="text-lg font-bold mb-4 text-carelink-navy flex items-center gap-2">
                            <FaCalendarAlt className="text-carelink-teal" />
                            בחר תאריך
                          </h2>
                          <BookingCalendar
                            onDateSelect={(date) => { setSelectedDate(date); setSelectedTime(''); }}
                            availability={provider.availability || []}
                            bookedSlots={bookedSlots.map(slot => slot.split(' ')[0])}
                          />
                        </div>

                        {selectedDate && (
                          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-carelink-teal-pale">
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

                    {/* Date only for Shift Services */}
                    {serviceTypeConfig.showShiftSelect && (
                      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-carelink-teal-pale">
                        <h2 className="text-lg font-bold mb-4 text-carelink-navy flex items-center gap-2">
                          <FaCalendarAlt className="text-carelink-teal" />
                          בחר תאריך התחלה
                        </h2>
                        <BookingCalendar
                          onDateSelect={(date) => setSelectedDate(date)}
                          availability={provider.availability || []}
                          bookedSlots={[]}
                        />
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* Step 2: Additional Details */}
            {step === 2 && (
              <>
                {/* Address for Home Visit / Hourly */}
                {serviceTypeConfig.requiresAddress && (
                  <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-carelink-teal-pale">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-carelink-navy flex items-center gap-2">
                        <FaHome className="text-carelink-teal" />
                        כתובת לביקור
                      </h2>
                      {user && (
                        <button
                          type="button"
                          onClick={() => setServiceAddress(prev => ({
                            ...prev,
                            street: user.address || prev.street,
                            city: user.city || prev.city
                          }))}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-carelink-teal bg-carelink-teal-pale/40 hover:bg-carelink-teal-pale px-3 py-1.5 rounded-full transition"
                          data-testid="fill-my-address-btn"
                        >
                          <FaMapMarkerAlt className="text-[10px]" />
                          הכתובת שלי
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-carelink-navy mb-1">רחוב ומספר *</label>
                        <input
                          type="text"
                          value={serviceAddress.street}
                          onChange={(e) => setServiceAddress({...serviceAddress, street: e.target.value})}
                          className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal outline-none"
                          placeholder="לדוגמה: הרצל 15"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-carelink-navy mb-1">עיר *</label>
                        <input
                          type="text"
                          value={serviceAddress.city}
                          onChange={(e) => setServiceAddress({...serviceAddress, city: e.target.value})}
                          className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal outline-none"
                          placeholder="תל אביב"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-sm font-medium text-carelink-navy mb-1">דירה</label>
                          <input
                            type="text"
                            value={serviceAddress.apartment}
                            onChange={(e) => setServiceAddress({...serviceAddress, apartment: e.target.value})}
                            className="w-full px-3 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-carelink-navy mb-1">קומה</label>
                          <input
                            type="text"
                            value={serviceAddress.floor}
                            onChange={(e) => setServiceAddress({...serviceAddress, floor: e.target.value})}
                            className="w-full px-3 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-carelink-navy mb-1">כניסה</label>
                          <input
                            type="text"
                            value={serviceAddress.entrance}
                            onChange={(e) => setServiceAddress({...serviceAddress, entrance: e.target.value})}
                            className="w-full px-3 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal outline-none"
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-carelink-navy mb-1">הנחיות הגעה</label>
                        <textarea
                          value={serviceAddress.specialInstructions}
                          onChange={(e) => setServiceAddress({...serviceAddress, specialInstructions: e.target.value})}
                          className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal outline-none resize-none"
                          rows="2"
                          placeholder="קוד כניסה, מקום חניה..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact Person */}
                {serviceTypeConfig.requiresContact && (
                  <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-carelink-teal-pale">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-carelink-navy flex items-center gap-2">
                        <FaUserFriends className="text-carelink-teal" />
                        איש קשר לתיאום
                      </h2>
                      {user && (
                        <button
                          type="button"
                          onClick={() => setContactPerson(prev => ({
                            ...prev,
                            name: user.name || prev.name,
                            phone: user.phone || prev.phone,
                            relationship: 'self'
                          }))}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-carelink-teal bg-carelink-teal-pale/40 hover:bg-carelink-teal-pale px-3 py-1.5 rounded-full transition"
                          data-testid="fill-my-contact-btn"
                        >
                          <FaUser className="text-[10px]" />
                          הפרטים שלי
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-carelink-navy mb-1">שם</label>
                        <input
                          type="text"
                          value={contactPerson.name}
                          onChange={(e) => setContactPerson({...contactPerson, name: e.target.value})}
                          className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-carelink-navy mb-1">טלפון</label>
                        <input
                          type="tel"
                          value={contactPerson.phone}
                          onChange={(e) => setContactPerson({...contactPerson, phone: e.target.value})}
                          className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-carelink-navy mb-1">קרבה</label>
                        <select
                          value={contactPerson.relationship}
                          onChange={(e) => setContactPerson({...contactPerson, relationship: e.target.value})}
                          className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal outline-none"
                        >
                          <option value="">בחר</option>
                          <option value="self">בעצמי</option>
                          <option value="spouse">בן/בת זוג</option>
                          <option value="child">ילד/ה</option>
                          <option value="parent">הורה</option>
                          <option value="other">אחר</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Shipping Address for Products */}
                {serviceTypeConfig.requiresShipping && (
                  <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-carelink-teal-pale">
                    <h2 className="text-lg font-bold mb-4 text-carelink-navy flex items-center gap-2">
                      <FaTruck className="text-carelink-teal" />
                      כתובת למשלוח
                    </h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-carelink-navy mb-1">רחוב ומספר *</label>
                        <input
                          type="text"
                          value={shippingAddress.street}
                          onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                          className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-carelink-navy mb-1">עיר *</label>
                        <input
                          type="text"
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                          className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-carelink-navy mb-1">דירה</label>
                        <input
                          type="text"
                          value={shippingAddress.apartment}
                          onChange={(e) => setShippingAddress({...shippingAddress, apartment: e.target.value})}
                          className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Platform Selection for Telemedicine */}
                {serviceTypeConfig.showPlatformSelect && (
                  <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-carelink-teal-pale">
                    <h2 className="text-lg font-bold mb-4 text-carelink-navy flex items-center gap-2">
                      <FaVideo className="text-carelink-teal" />
                      בחר פלטפורמה לשיחה
                    </h2>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {TELEMEDICINE_PLATFORMS.map(platform => {
                        const PlatformIcon = platform.icon;
                        return (
                          <button
                            key={platform.id}
                            onClick={() => setSelectedPlatform(platform.id)}
                            className={`p-4 rounded-xl border-2 flex items-center gap-3 transition ${
                              selectedPlatform === platform.id
                                ? 'border-carelink-teal bg-carelink-teal-pale'
                                : 'border-gray-200 hover:border-carelink-teal-pale'
                            }`}
                          >
                            <PlatformIcon className="text-xl text-carelink-teal" />
                            <span className="font-medium text-carelink-navy">{platform.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-carelink-teal-pale">
                  <h2 className="text-lg font-bold mb-4 text-carelink-navy flex items-center gap-2">
                    <FaStickyNote className="text-carelink-teal" />
                    הערות להזמנה
                  </h2>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="3"
                    className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:border-carelink-teal outline-none resize-none"
                    placeholder="הערות מיוחדות, בקשות, מידע רפואי רלוונטי..."
                  />
                </div>
              </>
            )}

            {/* Step Auth: Login/Guest Selection */}
            {step === 'auth' && !isAuthenticated && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-carelink-teal-pale">
                {!guestMode ? (
                  <>
                    <h2 className="text-xl font-bold text-carelink-navy mb-6 text-center">איך תרצה להמשיך?</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Link
                        to={`/login?redirect=/book/${serviceId}`}
                        className="bg-carelink-teal text-white p-6 rounded-xl hover:bg-carelink-teal-medium transition text-center"
                      >
                        <FaSignInAlt className="text-3xl mx-auto mb-3" />
                        <h3 className="font-bold mb-1">התחבר לחשבון</h3>
                        <p className="text-sm text-white/80">עקוב אחר ההזמנות שלך</p>
                      </Link>
                      <button
                        onClick={() => setGuestMode(true)}
                        className="bg-white border-2 border-carelink-teal text-carelink-teal p-6 rounded-xl hover:bg-carelink-teal-pale transition text-center"
                      >
                        <FaUser className="text-3xl mx-auto mb-3" />
                        <h3 className="font-bold mb-1">המשך כאורח</h3>
                        <p className="text-sm text-carelink-gray">הזמן ללא רישום</p>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-carelink-navy mb-6">פרטי האורח</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-carelink-navy mb-1">שם מלא *</label>
                        <input
                          type="text"
                          value={guestDetails.name}
                          onChange={(e) => setGuestDetails({...guestDetails, name: e.target.value})}
                          className={`w-full px-4 py-3 border-2 rounded-xl ${guestErrors.name ? 'border-red-500' : 'border-carelink-teal-pale'}`}
                        />
                        {guestErrors.name && <p className="text-red-500 text-sm mt-1">{guestErrors.name}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-carelink-navy mb-1">אימייל *</label>
                        <input
                          type="email"
                          value={guestDetails.email}
                          onChange={(e) => setGuestDetails({...guestDetails, email: e.target.value})}
                          className={`w-full px-4 py-3 border-2 rounded-xl ${guestErrors.email ? 'border-red-500' : 'border-carelink-teal-pale'}`}
                        />
                        {guestErrors.email && <p className="text-red-500 text-sm mt-1">{guestErrors.email}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-carelink-navy mb-1">טלפון *</label>
                        <input
                          type="tel"
                          value={guestDetails.phone}
                          onChange={(e) => setGuestDetails({...guestDetails, phone: e.target.value})}
                          className={`w-full px-4 py-3 border-2 rounded-xl ${guestErrors.phone ? 'border-red-500' : 'border-carelink-teal-pale'}`}
                        />
                        {guestErrors.phone && <p className="text-red-500 text-sm mt-1">{guestErrors.phone}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (validateGuestDetails()) setStep(3);
                      }}
                      className="w-full mt-6 bg-carelink-teal text-white py-3 rounded-xl font-bold hover:bg-carelink-teal-medium transition"
                    >
                      המשך לאישור
                    </button>
                    <button
                      onClick={() => setGuestMode(false)}
                      className="w-full mt-2 text-carelink-gray hover:text-carelink-navy"
                    >
                      חזור
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Step 3: Confirmation & Terms */}
            {step === 3 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-carelink-teal-pale">
                <h2 className="text-xl font-bold text-carelink-navy mb-6 flex items-center gap-2">
                  <FaFileContract className="text-carelink-teal" />
                  אישור תנאים
                </h2>

                {/* Terms Checkbox */}
                <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl mb-4 cursor-pointer hover:bg-carelink-teal-pale/20 transition">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="w-5 h-5 mt-0.5 text-carelink-teal rounded border-gray-300 focus:ring-carelink-teal"
                  />
                  <div>
                    <span className="font-medium text-carelink-navy">אני מאשר/ת את </span>
                    <Link to="/terms" target="_blank" className="text-carelink-teal hover:underline">
                      תנאי השימוש
                    </Link>
                    <span className="font-medium text-carelink-navy"> של האתר *</span>
                  </div>
                </label>

                {/* Cancellation Policy Checkbox */}
                <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-carelink-teal-pale/20 transition">
                  <input
                    type="checkbox"
                    checked={acceptCancellation}
                    onChange={(e) => setAcceptCancellation(e.target.checked)}
                    className="w-5 h-5 mt-0.5 text-carelink-teal rounded border-gray-300 focus:ring-carelink-teal"
                  />
                  <div>
                    <span className="font-medium text-carelink-navy">אני מאשר/ת את </span>
                    <Link to="/terms#cancellation" target="_blank" className="text-carelink-teal hover:underline">
                      מדיניות הביטולים
                    </Link>
                    <span className="font-medium text-carelink-navy"> *</span>
                    <p className="text-sm text-carelink-gray mt-1">
                      ביטול עד 24 שעות לפני המועד - ללא עלות. ביטול מאוחר יותר - 50% מהעלות.
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Sidebar - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-carelink-teal sticky top-4">
              <h3 className="font-bold text-lg text-carelink-navy mb-4 flex items-center gap-2">
                <FaCalculator className="text-carelink-teal" />
                סיכום הזמנה
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-carelink-gray">שירות:</span>
                  <span className="font-medium text-carelink-navy">{service.name}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-carelink-gray">סוג:</span>
                  <span className="font-medium text-carelink-navy">{serviceTypeConfig.label}</span>
                </div>
                
                {!skipTimeSelection && selectedDate && (
                  <div className="flex justify-between">
                    <span className="text-carelink-gray">תאריך:</span>
                    <span className="font-medium text-carelink-navy">
                      {format(selectedDate, 'dd/MM/yyyy', { locale: he })}
                    </span>
                  </div>
                )}
                
                {selectedTime && (
                  <div className="flex justify-between">
                    <span className="text-carelink-gray">שעה:</span>
                    <span className="font-medium text-carelink-navy">{selectedTime}</span>
                  </div>
                )}
                
                {selectedShift && (
                  <div className="flex justify-between">
                    <span className="text-carelink-gray">משמרת:</span>
                    <span className="font-medium text-carelink-navy">{selectedShift.label}</span>
                  </div>
                )}
                
                {skipTimeSelection && (
                  <div className="flex justify-between">
                    <span className="text-carelink-gray">תיאום:</span>
                    <span className="font-medium text-amber-600">יתואם טלפונית</span>
                  </div>
                )}
                
                {selectedPlatform && (
                  <div className="flex justify-between">
                    <span className="text-carelink-gray">פלטפורמה:</span>
                    <span className="font-medium text-carelink-navy">
                      {TELEMEDICINE_PLATFORMS.find(p => p.id === selectedPlatform)?.label}
                    </span>
                  </div>
                )}

                <div className="border-t border-carelink-teal-pale my-4"></div>

                {/* Price Breakdown */}
                <div className="space-y-2">
                  {service.pricing_type === 'hourly' ? (
                    <div className="flex justify-between">
                      <span className="text-carelink-gray">
                        ₪{service.price} × {selectedShift?.duration || customHours} שעות
                      </span>
                      <span className="font-medium">₪{service.price * (selectedShift?.duration || customHours)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-carelink-gray">מחיר בסיס:</span>
                      <span className="font-medium">₪{service.price}</span>
                    </div>
                  )}
                  
                  {service.travel_fee && (service.service_type === 'home_visit' || service.service_type === 'hourly') && (
                    <div className="flex justify-between text-carelink-gray">
                      <span>תוספת נסיעות:</span>
                      <span>₪{service.travel_fee}</span>
                    </div>
                  )}
                  
                  {service.shipping_fee && service.service_type === 'product' && (
                    <div className="flex justify-between text-carelink-gray">
                      <span>דמי משלוח:</span>
                      <span>₪{service.shipping_fee}</span>
                    </div>
                  )}
                  
                  {selectedDate && (selectedDate.getDay() === 5 || selectedDate.getDay() === 6) && service.weekend_surcharge && (
                    <div className="flex justify-between text-carelink-gray">
                      <span>תוספת סופ"ש:</span>
                      <span>₪{service.weekend_surcharge}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-carelink-teal-pale my-4"></div>

                <div className="flex justify-between text-lg">
                  <span className="font-bold text-carelink-navy">סה"כ לתשלום:</span>
                  <span className="font-bold text-carelink-teal">₪{calculateTotalPrice()}</span>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="mt-6 space-y-3">
                {step !== 'success' && step !== 'auth' && (
                  <button
                    onClick={handleNextStep}
                    disabled={booking}
                    className="w-full bg-carelink-teal text-white py-3 rounded-xl font-bold hover:bg-carelink-teal-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {booking ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        מעבד...
                      </>
                    ) : step === 3 ? (
                      <>
                        <FaCheckCircle />
                        אשר והזמן
                      </>
                    ) : (
                      <>
                        המשך
                        <FaArrowRight className="rotate-180" />
                      </>
                    )}
                  </button>
                )}
                
                {step > 1 && step !== 'success' && step !== 'auth' && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="w-full bg-gray-100 text-carelink-navy py-3 rounded-xl font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
                  >
                    <FaArrowRight />
                    חזור
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default BookService;
