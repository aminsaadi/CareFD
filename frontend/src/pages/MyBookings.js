import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { format } from 'date-fns';
import { toast } from 'sonner';
import ConfirmDialog from '../components/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';

const MyBookings = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { confirmState, confirm, closeConfirm } = useConfirm();

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bookings');
      const bookingsData = response.data.bookings || [];
      
      // Fetch service and provider details for each booking
      const enrichedBookings = await Promise.all(
        bookingsData.map(async (booking) => {
          try {
            const serviceResponse = await api.get(`/services?service_id=${booking.service_id}`);
            const services = serviceResponse.data.services || [];
            const service = services.find(s => s.service_id === booking.service_id);
            
            if (service) {
              const providerResponse = await api.get(`/providers/${service.provider_id}`);
              return {
                ...booking,
                service,
                provider: providerResponse.data
              };
            }
            return booking;
          } catch (error) {
            return booking;
          }
        })
      );
      
      setBookings(enrichedBookings);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    await confirm({
      title: 'ביטול הזמנה',
      message: 'האם אתה בטוח שברצונך לבטל הזמנה זו?',
      type: 'danger',
      confirmText: 'בטל הזמנה',
      cancelText: 'השאר'
    });

    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      toast.success('ההזמנה בוטלה בהצלחה');
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'שגיאה בביטול ההזמנה');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-carelink-teal-pale text-carelink-teal border-carelink-teal',
      completed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-12">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-carelink-teal-pale">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-carelink-navy font-heading" data-testid="my-bookings-title">
            {t('myBookings')}
          </h1>
          <Link
            to="/services"
            className="bg-carelink-teal text-white px-6 py-2 rounded-lg hover:bg-carelink-teal-medium transition-colors"
          >
            הזמן שירות חדש
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6 p-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-carelink-teal text-white'
                  : 'bg-carelink-light-gray text-carelink-navy hover:bg-carelink-teal-pale'
              }`}
            >
              הכל ({bookings.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-carelink-teal text-white'
                  : 'bg-carelink-light-gray text-carelink-navy hover:bg-carelink-teal-pale'
              }`}
            >
              ממתינות ({bookings.filter(b => b.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('confirmed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'confirmed'
                  ? 'bg-carelink-teal text-white'
                  : 'bg-carelink-light-gray text-carelink-navy hover:bg-carelink-teal-pale'
              }`}
            >
              מאושרות ({bookings.filter(b => b.status === 'confirmed').length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-carelink-teal text-white'
                  : 'bg-carelink-light-gray text-carelink-navy hover:bg-carelink-teal-pale'
              }`}
            >
              הושלמו ({bookings.filter(b => b.status === 'completed').length})
            </button>
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-carelink-gray text-lg">אין הזמנות</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.booking_id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-carelink-teal-pale"
                data-testid={`booking-${booking.booking_id}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-carelink-navy">
                      {booking.service?.name || 'שירות'}
                    </h3>
                    <p className="text-carelink-gray">
                      {booking.provider?.business_name || 'ספק שירותים'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border-2 ${getStatusColor(booking.status)}`}>
                    {booking.status === 'pending' && 'ממתין לאישור'}
                    {booking.status === 'confirmed' && 'מאושר'}
                    {booking.status === 'completed' && 'הושלם'}
                    {booking.status === 'cancelled' && 'בוטל'}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="font-semibold text-carelink-navy">תאריך:</span>
                    <span className="mr-2 text-carelink-slate">
                      {format(new Date(booking.booking_date), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </div>
                  {booking.service?.price && (
                    <div>
                      <span className="font-semibold text-carelink-navy">מחיר:</span>
                      <span className="text-carelink-teal font-bold mr-2">₪{booking.service.price}</span>
                    </div>
                  )}
                </div>

                {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCancelBooking(booking.booking_id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                      data-testid={`cancel-booking-${booking.booking_id}`}
                    >
                      בטל הזמנה
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
      />
    </div>
  );
};

export default MyBookings;