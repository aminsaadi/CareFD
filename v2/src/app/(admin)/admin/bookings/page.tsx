"use client";

import {  useState, useEffect  } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import { toast } from "sonner";
import {
  FiSearch, FiFilter, FiCalendar, FiUser, FiClock,
  FiCheck, FiX, FiEye, FiDollarSign
} from 'react-icons/fi';

export default function AdminBookings() {
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
      
      const data = await api.get(`/admin/bookings?${params.toString()}`);
      setBookings(data.bookings || []);
      setPagination(prev => ({ ...prev, total: data.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      toast.error('שגיאה בטעינת ההזמנות');
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      await api.put(`/admin/bookings/${bookingId}/status`, { status });
      toast.success('סטטוס ההזמנה עודכן בהצלחה');
      fetchBookings();
    } catch (error) {
      console.error('Failed to update booking status:', error);
      toast.error(error?.data?.detail || error?.message || 'שגיאה בעדכון סטטוס ההזמנה');
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
      case 'cancellation_requested':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/20 text-carefd-slate border-slate-500/30';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed': return 'מאושר';
      case 'pending': return 'ממתין';
      case 'cancelled': return 'בוטל';
      case 'cancellation_requested': return 'ממתין לאישור ביטול';
      case 'completed': return 'הושלם';
      default: return status;
    }
  };

  return (
    <>
    
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-carefd-navy">ניהול הזמנות</h1>
            <p className="text-carefd-slate mt-1">{pagination.total} הזמנות במערכת</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-carefd-slate text-sm">סה"כ</p>
            <p className="text-2xl font-bold text-carefd-navy mt-1">{bookings.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-carefd-slate text-sm">ממתינות</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{bookings.filter(b => b.status === 'pending').length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-carefd-slate text-sm">מאושרות</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{bookings.filter(b => b.status === 'confirmed').length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-carefd-slate text-sm">הושלמו</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{bookings.filter(b => b.status === 'completed').length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-carefd-slate text-sm">בוטלו</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{bookings.filter(b => b.status === 'cancelled').length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-carefd-slate" size={18} />
              <input
                type="text"
                placeholder="חפש לפי שם לקוח, ספק..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pr-10 pl-4 py-2.5 text-carefd-navy placeholder-carefd-gray focus:border-carefd-teal outline-none"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-carefd-navy focus:border-carefd-teal outline-none min-w-[150px]"
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
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-right py-4 px-6 text-carefd-slate font-medium text-sm">מזהה</th>
                  <th className="text-right py-4 px-6 text-carefd-slate font-medium text-sm">לקוח</th>
                  <th className="text-right py-4 px-6 text-carefd-slate font-medium text-sm">שירות</th>
                  <th className="text-right py-4 px-6 text-carefd-slate font-medium text-sm">תאריך</th>
                  <th className="text-right py-4 px-6 text-carefd-slate font-medium text-sm">סטטוס</th>
                  <th className="text-right py-4 px-6 text-carefd-slate font-medium text-sm">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="w-8 h-8 border-4 border-carefd-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-carefd-slate">
                      <FiCalendar className="mx-auto mb-3" size={32} />
                      לא נמצאו הזמנות
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking.booking_id} className="border-b border-gray-100/50 hover:bg-gray-50/30 transition">
                      <td className="py-4 px-6">
                        <span className="text-carefd-slate text-sm font-mono">{booking.booking_id?.slice(-8)}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-carefd-navy text-sm">
                            {booking.client_name?.[0] || booking.user_name?.[0] || 'U'}
                          </div>
                          <div>
                            <p className="text-carefd-navy text-sm">{booking.client_name || booking.user_name || 'לקוח'}</p>
                            {booking.is_guest_booking && (
                              <span className="text-xs text-amber-400">אורח</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-carefd-navy text-sm">{booking.service_name || '-'}</p>
                        <p className="text-carefd-gray text-xs">{booking.provider_name || '-'}</p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-carefd-slate text-sm">
                          <FiCalendar size={14} />
                          {booking.booking_date ? new Date(booking.booking_date).toLocaleDateString('he-IL') : '-'}
                        </div>
                        {booking.booking_time && (
                          <div className="flex items-center gap-2 text-carefd-gray text-xs mt-1">
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
                          <option value="pending" className="bg-white">ממתין</option>
                          <option value="confirmed" className="bg-white">מאושר</option>
                          <option value="completed" className="bg-white">הושלם</option>
                          <option value="cancelled" className="bg-white">בוטל</option>
                        </select>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button className="p-2 text-carefd-slate hover:text-carefd-navy hover:bg-gray-50 rounded-lg transition">
                            <FiEye size={16} />
                          </button>
                          {booking.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateBookingStatus(booking.booking_id, 'confirmed')}
                                className="p-2 text-carefd-slate hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition"
                                title="אשר"
                              >
                                <FiCheck size={16} />
                              </button>
                              <button
                                onClick={() => updateBookingStatus(booking.booking_id, 'cancelled')}
                                className="p-2 text-carefd-slate hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
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
    
    </>
  );
};


