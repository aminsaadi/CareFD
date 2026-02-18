import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import {
  FiSearch, FiFilter, FiCalendar, FiUser, FiClock,
  FiCheck, FiX, FiEye, FiDollarSign
} from 'react-icons/fi';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  useEffect(() => {
    fetchBookings();
  }, [searchQuery, filterStatus, pagination.page]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterStatus) params.append('status', filterStatus);
      params.append('limit', pagination.limit);
      params.append('skip', (pagination.page - 1) * pagination.limit);
      
      const response = await api.get(`/admin/bookings?${params.toString()}`);
      setBookings(response.data.bookings || []);
      setPagination(prev => ({ ...prev, total: response.data.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      await api.put(`/admin/bookings/${bookingId}/status`, { status });
      fetchBookings();
    } catch (error) {
      console.error('Failed to update booking status:', error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'pending':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed': return 'מאושר';
      case 'pending': return 'ממתין';
      case 'cancelled': return 'בוטל';
      case 'completed': return 'הושלם';
      default: return status;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">ניהול הזמנות</h1>
            <p className="text-slate-400 mt-1">{pagination.total} הזמנות במערכת</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">סה"כ</p>
            <p className="text-2xl font-bold text-white mt-1">{bookings.length}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">ממתינות</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{bookings.filter(b => b.status === 'pending').length}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">מאושרות</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{bookings.filter(b => b.status === 'confirmed').length}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">הושלמו</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{bookings.filter(b => b.status === 'completed').length}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">בוטלו</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{bookings.filter(b => b.status === 'cancelled').length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="חפש לפי שם לקוח, ספק..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg pr-10 pl-4 py-2.5 text-white placeholder-slate-400 focus:border-indigo-500 outline-none"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:border-indigo-500 outline-none min-w-[150px]"
            >
              <option value="">כל הסטטוסים</option>
              <option value="pending">ממתינות</option>
              <option value="confirmed">מאושרות</option>
              <option value="completed">הושלמו</option>
              <option value="cancelled">בוטלו</option>
            </select>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-right py-4 px-6 text-slate-400 font-medium text-sm">מזהה</th>
                  <th className="text-right py-4 px-6 text-slate-400 font-medium text-sm">לקוח</th>
                  <th className="text-right py-4 px-6 text-slate-400 font-medium text-sm">שירות</th>
                  <th className="text-right py-4 px-6 text-slate-400 font-medium text-sm">תאריך</th>
                  <th className="text-right py-4 px-6 text-slate-400 font-medium text-sm">סטטוס</th>
                  <th className="text-right py-4 px-6 text-slate-400 font-medium text-sm">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <FiCalendar className="mx-auto mb-3" size={32} />
                      לא נמצאו הזמנות
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking.booking_id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition">
                      <td className="py-4 px-6">
                        <span className="text-slate-400 text-sm font-mono">{booking.booking_id?.slice(-8)}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-white text-sm">
                            {booking.client_name?.[0] || booking.user_name?.[0] || 'U'}
                          </div>
                          <div>
                            <p className="text-white text-sm">{booking.client_name || booking.user_name || 'לקוח'}</p>
                            {booking.is_guest_booking && (
                              <span className="text-xs text-amber-400">אורח</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-white text-sm">{booking.service_name || '-'}</p>
                        <p className="text-slate-500 text-xs">{booking.provider_name || '-'}</p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <FiCalendar size={14} />
                          {booking.booking_date ? new Date(booking.booking_date).toLocaleDateString('he-IL') : '-'}
                        </div>
                        {booking.booking_time && (
                          <div className="flex items-center gap-2 text-slate-500 text-xs mt-1">
                            <FiClock size={12} />
                            {booking.booking_time}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <select
                          value={booking.status}
                          onChange={(e) => updateBookingStatus(booking.booking_id, e.target.value)}
                          className={`px-3 py-1.5 rounded-lg text-sm border ${getStatusBadge(booking.status)} bg-transparent focus:outline-none cursor-pointer`}
                        >
                          <option value="pending" className="bg-slate-800">ממתין</option>
                          <option value="confirmed" className="bg-slate-800">מאושר</option>
                          <option value="completed" className="bg-slate-800">הושלם</option>
                          <option value="cancelled" className="bg-slate-800">בוטל</option>
                        </select>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition">
                            <FiEye size={16} />
                          </button>
                          {booking.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateBookingStatus(booking.booking_id, 'confirmed')}
                                className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition"
                                title="אשר"
                              >
                                <FiCheck size={16} />
                              </button>
                              <button
                                onClick={() => updateBookingStatus(booking.booking_id, 'cancelled')}
                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                                title="בטל"
                              >
                                <FiX size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBookings;
