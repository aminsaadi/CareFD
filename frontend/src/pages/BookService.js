import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BookingCalendar from '../components/BookingCalendar';
import TimeSlotPicker from '../components/TimeSlotPicker';
import api from '../utils/api';
import { format } from 'date-fns';
import { 
  FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCalendarAlt,
  FaClock, FaCheckCircle, FaSpinner, FaArrowRight, FaUserPlus,
  FaSignInAlt
} from 'react-icons/fa';

const BookService = () => {
  const { t } = useTranslation();
  const { serviceId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [service, setService] = useState(null);
  const [provider, setProvider] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState(1); // 1: Select date/time, 2: Guest details, 3: Confirmation
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  
  // Guest booking form
  const [guestMode, setGuestMode] = useState(false);
  const [guestDetails, setGuestDetails] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [guestErrors, setGuestErrors] = useState({});

  useEffect(() => {
    fetchServiceDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      
      // Fetch provider details
      const providerResponse = await api.get(`/providers/${foundService.provider_id}`);
      setProvider(providerResponse.data);
      
      // Fetch booked slots
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
      alert(t('errorOccurred'));
      navigate('/services');
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime('');
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  const validateGuestDetails = () => {
    const errors = {};
    
    if (!guestDetails.name.trim()) {
      errors.name = 'נא להזין שם מלא';
    }
    
    if (!guestDetails.email.trim()) {
      errors.email = 'נא להזין כתובת אימייל';
    } else if (!/\S+@\S+\.\S+/.test(guestDetails.email)) {
      errors.email = 'כתובת אימייל לא תקינה';
    }
    
    if (!guestDetails.phone.trim()) {
      errors.phone = 'נא להזין מספר טלפון';
    } else if (!/^0\d{8,9}$/.test(guestDetails.phone.replace(/[-\s]/g, ''))) {
      errors.phone = 'מספר טלפון לא תקין';
    }
    
    setGuestErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinueToDetails = () => {
    if (!selectedDate || !selectedTime) {
      alert('אנא בחר תאריך ושעה');
      return;
    }
    
    if (isAuthenticated) {
      // Logged in user - proceed to booking
      handleBooking();
    } else {
      // Not logged in - show options
      setStep(2);
    }
  };

  const handleGuestContinue = () => {
    if (validateGuestDetails()) {
      handleBooking();
    }
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) {
      alert('אנא בחר תאריך ושעה');
      return;
    }

    try {
      setBooking(true);
      const bookingDateTime = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}:00`);
      
      const bookingData = {
        service_id: serviceId,
        booking_date: bookingDateTime.toISOString(),
        notes
      };

      // Add guest details if not authenticated
      if (!isAuthenticated && guestMode) {
        bookingData.guest_booking = true;
        bookingData.guest_name = guestDetails.name;
        bookingData.guest_email = guestDetails.email;
        bookingData.guest_phone = guestDetails.phone;
        bookingData.guest_address = guestDetails.address;
      }

      const response = await api.post('/bookings', bookingData);
      
      setBookingId(response.data.booking_id);
      setBookingSuccess(true);
      setStep(3);
    } catch (error) {
      console.error('Booking failed:', error);
      alert(error.response?.data?.detail || t('errorOccurred'));
    } finally {
      setBooking(false);
    }
  };

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

  // Step 3: Booking Success
  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-carelink-teal-pale">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center border-2 border-carelink-teal">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaCheckCircle className="text-4xl text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-carelink-navy mb-4">ההזמנה נקלטה בהצלחה!</h2>
            <p className="text-carelink-gray mb-6">
              פרטי ההזמנה נשלחו {guestMode ? `לאימייל ${guestDetails.email}` : 'למערכת'}
            </p>
            
            <div className="bg-carelink-teal-pale/30 rounded-xl p-6 text-right mb-6">
              <h3 className="font-bold text-carelink-navy mb-3">פרטי ההזמנה:</h3>
              <div className="space-y-2 text-sm">
                <p><strong>שירות:</strong> {service.name}</p>
                <p><strong>ספק:</strong> {provider.business_name}</p>
                <p><strong>תאריך:</strong> {format(selectedDate, 'dd/MM/yyyy')}</p>
                <p><strong>שעה:</strong> {selectedTime}</p>
                <p><strong>מחיר:</strong> ₪{service.price}</p>
                {bookingId && <p><strong>מספר הזמנה:</strong> {bookingId}</p>}
              </div>
            </div>

            {!isAuthenticated && guestMode && (
              <div className="bg-blue-50 rounded-xl p-4 text-right mb-6">
                <p className="text-blue-700 text-sm">
                  <strong>טיפ:</strong> הירשם לאתר כדי לעקוב אחר ההזמנות שלך ולקבל עדכונים
                </p>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 text-blue-600 hover:underline mt-2 text-sm font-medium"
                >
                  <FaUserPlus />
                  הירשם עכשיו
                </Link>
              </div>
            )}

            <div className="flex gap-3">
              <Link
                to="/services"
                className="flex-1 bg-carelink-teal text-white py-3 rounded-xl font-semibold hover:bg-carelink-teal-medium transition"
              >
                חזור לשירותים
              </Link>
              {isAuthenticated && (
                <Link
                  to="/bookings"
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-carelink-teal-pale">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-carelink-teal' : 'text-carelink-gray'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-carelink-teal text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="hidden sm:inline font-medium">בחר תאריך</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-200"></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-carelink-teal' : 'text-carelink-gray'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-carelink-teal text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="hidden sm:inline font-medium">פרטים</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-200"></div>
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-carelink-teal' : 'text-carelink-gray'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-carelink-teal text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="hidden sm:inline font-medium">אישור</span>
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-6 text-carelink-navy font-heading" data-testid="book-service-title">
          {t('bookNow')} - {service.name}
        </h1>

        {/* Step 1: Date & Time Selection */}
        {step === 1 && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Service Details */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-carelink-teal-pale">
              <h2 className="text-xl font-bold mb-4 text-carelink-navy flex items-center gap-2">
                <FaCalendarAlt className="text-carelink-teal" />
                פרטי השירות
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-carelink-navy">שירות:</span>
                  <span className="text-carelink-slate text-left">{service.name}</span>
                </div>
                
                <div>
                  <span className="font-semibold text-carelink-navy">תיאור:</span>
                  <p className="text-carelink-slate mt-1 text-sm">{service.description}</p>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-semibold text-carelink-navy">ספק:</span>
                  <Link 
                    to={`/providers/${provider.provider_id}`}
                    className="text-carelink-teal hover:underline"
                  >
                    {provider.business_name || 'ספק שירותים'}
                  </Link>
                </div>
                
                <div className="flex justify-between items-center bg-carelink-teal-pale/30 p-4 rounded-xl">
                  <span className="font-semibold text-carelink-navy">מחיר:</span>
                  <span className="text-3xl font-bold text-carelink-teal">₪{service.price}</span>
                </div>
                
                {service.duration_minutes && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-carelink-navy">משך:</span>
                    <span className="text-carelink-slate flex items-center gap-1">
                      <FaClock className="text-carelink-teal" />
                      {service.duration_minutes} דקות
                    </span>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-carelink-navy mb-2">
                  הערות (אופציונלי)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:outline-none focus:border-carelink-teal resize-none"
                  placeholder="ניתן להוסיף הערות להזמנה..."
                  data-testid="booking-notes"
                />
              </div>
            </div>

            {/* Booking Calendar & Time */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-carelink-teal-pale">
                <h2 className="text-xl font-bold mb-4 text-carelink-navy">בחר תאריך</h2>
                <BookingCalendar
                  onDateSelect={handleDateSelect}
                  availability={provider.availability || []}
                  bookedSlots={bookedSlots.map(slot => slot.split(' ')[0])}
                />
              </div>

              {selectedDate && (
                <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-carelink-teal-pale">
                  <TimeSlotPicker
                    selectedDate={selectedDate}
                    availability={provider.availability || []}
                    onTimeSelect={handleTimeSelect}
                    bookedTimes={bookedSlots}
                  />
                </div>
              )}

              {selectedDate && selectedTime && (
                <div className="bg-carelink-teal text-white p-6 rounded-2xl shadow-lg">
                  <h3 className="font-bold mb-3 text-lg">סיכום הזמנה:</h3>
                  <div className="space-y-2">
                    <p className="flex justify-between">
                      <span>תאריך:</span>
                      <span className="font-medium">{format(selectedDate, 'dd/MM/yyyy')}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>שעה:</span>
                      <span className="font-medium">{selectedTime}</span>
                    </p>
                    <div className="border-t border-white/30 my-3"></div>
                    <p className="flex justify-between text-xl">
                      <span>סה"כ:</span>
                      <span className="font-bold">₪{service.price}</span>
                    </p>
                  </div>
                  
                  <button
                    onClick={handleContinueToDetails}
                    disabled={booking}
                    className="w-full mt-4 bg-white text-carelink-teal py-3 rounded-xl font-bold hover:bg-carelink-teal-pale transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    data-testid="continue-booking-btn"
                  >
                    {booking ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        מעבד...
                      </>
                    ) : (
                      <>
                        {isAuthenticated ? 'אשר הזמנה' : 'המשך'}
                        <FaArrowRight className="rotate-180" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Guest/Login Selection */}
        {step === 2 && !isAuthenticated && (
          <div className="max-w-2xl mx-auto">
            {!guestMode ? (
              <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-carelink-teal-pale">
                <h2 className="text-2xl font-bold text-carelink-navy mb-6 text-center">
                  איך תרצה להמשיך?
                </h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Login Option */}
                  <Link
                    to={`/login?redirect=/book/${serviceId}`}
                    className="bg-carelink-teal text-white p-6 rounded-xl hover:bg-carelink-teal-medium transition text-center group"
                  >
                    <FaSignInAlt className="text-4xl mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-lg mb-2">התחבר לחשבון</h3>
                    <p className="text-sm text-white/80">
                      יש לך חשבון? התחבר כדי לעקוב אחר ההזמנות שלך
                    </p>
                  </Link>

                  {/* Guest Option */}
                  <button
                    onClick={() => setGuestMode(true)}
                    className="bg-white border-2 border-carelink-teal text-carelink-teal p-6 rounded-xl hover:bg-carelink-teal-pale transition text-center group"
                  >
                    <FaUser className="text-4xl mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-lg mb-2">המשך כאורח</h3>
                    <p className="text-sm text-carelink-gray">
                      הזמן ללא רישום - רק פרטי קשר בסיסיים
                    </p>
                  </button>
                </div>

                <div className="text-center mt-6">
                  <Link
                    to="/register"
                    className="text-carelink-teal hover:underline text-sm"
                  >
                    אין לך חשבון? הירשם עכשיו
                  </Link>
                </div>

                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-carelink-gray hover:text-carelink-navy mt-6"
                >
                  <FaArrowRight />
                  חזור לבחירת תאריך
                </button>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-carelink-teal-pale">
                <h2 className="text-2xl font-bold text-carelink-navy mb-6">פרטי האורח</h2>
                
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-carelink-navy mb-2">
                      <FaUser className="inline ml-1 text-carelink-teal" />
                      שם מלא *
                    </label>
                    <input
                      type="text"
                      value={guestDetails.name}
                      onChange={(e) => setGuestDetails(prev => ({ ...prev, name: e.target.value }))}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none ${
                        guestErrors.name ? 'border-red-500' : 'border-carelink-teal-pale focus:border-carelink-teal'
                      }`}
                      placeholder="ישראל ישראלי"
                      data-testid="guest-name"
                    />
                    {guestErrors.name && (
                      <p className="text-red-500 text-sm mt-1">{guestErrors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-carelink-navy mb-2">
                      <FaEnvelope className="inline ml-1 text-carelink-teal" />
                      אימייל *
                    </label>
                    <input
                      type="email"
                      value={guestDetails.email}
                      onChange={(e) => setGuestDetails(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none ${
                        guestErrors.email ? 'border-red-500' : 'border-carelink-teal-pale focus:border-carelink-teal'
                      }`}
                      placeholder="example@email.com"
                      data-testid="guest-email"
                    />
                    {guestErrors.email && (
                      <p className="text-red-500 text-sm mt-1">{guestErrors.email}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-carelink-navy mb-2">
                      <FaPhone className="inline ml-1 text-carelink-teal" />
                      טלפון *
                    </label>
                    <input
                      type="tel"
                      value={guestDetails.phone}
                      onChange={(e) => setGuestDetails(prev => ({ ...prev, phone: e.target.value }))}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none ${
                        guestErrors.phone ? 'border-red-500' : 'border-carelink-teal-pale focus:border-carelink-teal'
                      }`}
                      placeholder="050-1234567"
                      data-testid="guest-phone"
                    />
                    {guestErrors.phone && (
                      <p className="text-red-500 text-sm mt-1">{guestErrors.phone}</p>
                    )}
                  </div>

                  {/* Address (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-carelink-navy mb-2">
                      <FaMapMarkerAlt className="inline ml-1 text-carelink-teal" />
                      כתובת (אופציונלי)
                    </label>
                    <input
                      type="text"
                      value={guestDetails.address}
                      onChange={(e) => setGuestDetails(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-carelink-teal-pale rounded-xl focus:outline-none focus:border-carelink-teal"
                      placeholder="רחוב, עיר"
                      data-testid="guest-address"
                    />
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-carelink-teal-pale/30 rounded-xl p-4 mt-6">
                  <h3 className="font-bold text-carelink-navy mb-2">סיכום הזמנה:</h3>
                  <div className="text-sm text-carelink-slate space-y-1">
                    <p>תאריך: {format(selectedDate, 'dd/MM/yyyy')} בשעה {selectedTime}</p>
                    <p>שירות: {service.name}</p>
                    <p className="text-lg font-bold text-carelink-teal mt-2">סה"כ: ₪{service.price}</p>
                  </div>
                </div>

                <button
                  onClick={handleGuestContinue}
                  disabled={booking}
                  className="w-full mt-6 bg-carelink-teal text-white py-3 rounded-xl font-bold hover:bg-carelink-teal-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  data-testid="confirm-guest-booking-btn"
                >
                  {booking ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      מעבד הזמנה...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle />
                      אשר הזמנה
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => setGuestMode(false)}
                    className="flex items-center gap-2 text-carelink-gray hover:text-carelink-navy"
                  >
                    <FaArrowRight />
                    חזור
                  </button>
                  <Link
                    to="/register"
                    className="text-carelink-teal hover:underline text-sm"
                  >
                    העדיף להירשם?
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default BookService;
