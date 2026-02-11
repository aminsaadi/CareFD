import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import BookingCalendar from '../components/BookingCalendar';
import TimeSlotPicker from '../components/TimeSlotPicker';
import api from '../utils/api';
import { format } from 'date-fns';

const BookService = () => {
  const { t } = useTranslation();
  const { serviceId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [service, setService] = useState(null);
  const [provider, setProvider] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [notes, setNotes] = useState('');

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
      const bookingsResponse = await api.get(`/bookings?provider_id=${foundService.provider_id}`);
      const bookings = bookingsResponse.data.bookings || [];
      const booked = bookings
        .filter(b => b.status !== 'cancelled')
        .map(b => format(new Date(b.booking_date), 'yyyy-MM-dd HH:mm'));
      setBookedSlots(booked);
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

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) {
      alert('אנא בחר תאריך ושעה');
      return;
    }

    try {
      setBooking(true);
      const bookingDateTime = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}:00`);
      
      await api.post('/bookings', {
        service_id: serviceId,
        booking_date: bookingDateTime.toISOString(),
        notes
      });

      alert('ההזמנה בוצעה בהצלחה!');
      navigate('/bookings');
    } catch (error) {
      console.error('Booking failed:', error);
      alert(error.response?.data?.detail || t('errorOccurred'));
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-12">{t('loading')}</div>
      </div>
    );
  }

  if (!service || !provider) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-12">שירות לא נמצא</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-carelink-teal-pale">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6 text-carelink-navy font-heading" data-testid="book-service-title">
          {t('bookNow')} - {service.name}
        </h1>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Service Details */}
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-carelink-teal-pale">
            <h2 className="text-xl font-bold mb-4 text-carelink-navy">פרטי השירות</h2>
            
            <div className="space-y-3">
              <div>
                <span className="font-semibold text-carelink-navy">שירות:</span>
                <span className="mr-2 text-carelink-slate">{service.name}</span>
              </div>
              
              <div>
                <span className="font-semibold text-carelink-navy">תיאור:</span>
                <p className="text-carelink-slate mt-1">{service.description}</p>
              </div>
              
              <div>
                <span className="font-semibold text-carelink-navy">ספק:</span>
                <span className="mr-2 text-carelink-slate">{provider.business_name || 'ספק שירותים'}</span>
              </div>
              
              <div>
                <span className="font-semibold text-carelink-navy">מחיר:</span>
                <span className="text-2xl font-bold text-carelink-teal mr-2">₪{service.price}</span>
              </div>
              
              {service.duration_minutes && (
                <div>
                  <span className="font-semibold text-carelink-navy">משך:</span>
                  <span className="mr-2 text-carelink-slate">{service.duration_minutes} דקות</span>
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
                className="w-full px-3 py-2 border border-carelink-light-gray rounded-md focus:outline-none focus:ring-carelink-teal focus:border-carelink-teal"
                placeholder="ניתן להוסיף הערות להזמנה..."
                data-testid="booking-notes"
              />
            </div>
          </div>

          {/* Booking Calendar & Time */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-carelink-teal-pale">
              <h2 className="text-xl font-bold mb-4 text-carelink-navy">בחר תאריך</h2>
              <BookingCalendar
                onDateSelect={handleDateSelect}
                availability={provider.availability || []}
                bookedSlots={bookedSlots.map(slot => slot.split(' ')[0])}
              />
            </div>

            {selectedDate && (
              <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-carelink-teal-pale">
                <TimeSlotPicker
                  selectedDate={selectedDate}
                  availability={provider.availability || []}
                  onTimeSelect={handleTimeSelect}
                  bookedTimes={bookedSlots}
                />
              </div>
            )}

            {selectedDate && selectedTime && (
              <div className="bg-carelink-teal text-white p-6 rounded-xl shadow-lg">
                <h3 className="font-bold mb-2">סיכום הזמנה:</h3>
                <p>תאריך: {format(selectedDate, 'dd/MM/yyyy')}</p>
                <p>שעה: {selectedTime}</p>
                <p className="text-2xl font-bold mt-2">סה"כ: ₪{service.price}</p>
                
                <button
                  onClick={handleBooking}
                  disabled={booking}
                  className="w-full mt-4 bg-white text-carelink-teal py-3 rounded-lg font-bold hover:bg-carelink-teal-pale transition-colors disabled:opacity-50"
                  data-testid="confirm-booking-btn"
                >
                  {booking ? t('loading') : t('confirmBooking')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookService;