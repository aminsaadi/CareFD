import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'sonner';
import {
  FaTimes, FaCalendarAlt, FaClock, FaUser, FaPhone, FaEnvelope,
  FaMapMarkerAlt, FaMoneyBillWave, FaStickyNote, FaExchangeAlt,
  FaComments, FaCheckCircle, FaHourglass, FaHome, FaVideo,
  FaClinicMedical, FaShippingFast, FaInfoCircle
} from 'react-icons/fa';

const deliveryLabels = {
  home_visit: { label: 'ביקור בבית', icon: FaHome },
  clinic: { label: 'בקליניקה', icon: FaClinicMedical },
  hospital: { label: 'בי"ח/מוסד', icon: FaClinicMedical },
  virtual: { label: 'וירטואלי', icon: FaVideo },
  delivery: { label: 'משלוח', icon: FaShippingFast }
};

const shiftLabels = {
  morning: 'בוקר (07:00-14:00)',
  afternoon: 'צהריים (14:00-20:00)',
  night: 'לילה (20:00-07:00)',
  custom: 'מותאם אישית'
};

const categoryLabels = {
  consultation: 'ייעוץ',
  visit: 'ביקור',
  product: 'מוצר',
  hourly: 'שעתי',
  procedure: 'פעולה',
  series: 'סדרה'
};

const statusConfig = {
  pending: { label: 'ממתין לאישור', color: 'bg-yellow-100 text-yellow-700', icon: FaHourglass },
  confirmed: { label: 'מאושר', color: 'bg-green-100 text-green-700', icon: FaCheckCircle },
  in_progress: { label: 'בביצוע', color: 'bg-blue-100 text-blue-700', icon: FaClock },
  provider_completed: { label: 'סומן כהושלם', color: 'bg-purple-100 text-purple-700', icon: FaCheckCircle },
  completed: { label: 'הושלם', color: 'bg-green-100 text-green-700', icon: FaCheckCircle },
  cancelled: { label: 'בוטל', color: 'bg-red-100 text-red-700', icon: FaTimes },
  rejected: { label: 'נדחה', color: 'bg-red-100 text-red-700', icon: FaTimes },
  on_hold: { label: 'בהשהיה', color: 'bg-gray-100 text-gray-700', icon: FaHourglass }
};

const BookingDetailsModal = ({ booking, provider, onClose, onRefresh }) => {
  const navigate = useNavigate();
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [changeForm, setChangeForm] = useState({ new_date: '', new_time: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [fullBooking, setFullBooking] = useState(booking);

  useEffect(() => {
    fetchFullBooking();
  }, [booking.booking_id]);

  const fetchFullBooking = async () => {
    try {
      const res = await api.get(`/bookings/${booking.booking_id}`);
      setFullBooking(res.data);
    } catch {
      // Use the booking data we already have
    }
  };

  const handleRequestChange = async () => {
    if (!changeForm.new_date && !changeForm.new_time) {
      toast.error('נא למלא תאריך או שעה חדשים');
      return;
    }
    setSubmitting(true);
    try {
      await api.put(`/bookings/${booking.booking_id}/request-change`, changeForm);
      toast.success('בקשת השינוי נשלחה ללקוח');
      setShowChangeForm(false);
      setChangeForm({ new_date: '', new_time: '', reason: '' });
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'שגיאה בשליחת הבקשה');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContactUser = async () => {
    try {
      const res = await api.post('/chat/rooms', {
        user_id: fullBooking.user_id,
        provider_id: provider.provider_id,
        booking_id: fullBooking.booking_id
      });
      const roomId = res.data.room_id;
      onClose();
      navigate(`/chat/${roomId}`);
    } catch (error) {
      toast.error('שגיאה ביצירת צ\'אט');
    }
  };

  const status = statusConfig[fullBooking.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const delivery = deliveryLabels[fullBooking.delivery_type] || {};
  const DeliveryIcon = delivery.icon || FaInfoCircle;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      data-testid="booking-details-modal-overlay"
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        data-testid="booking-details-modal"
      >
        {/* Header */}
        <div className="bg-gradient-to-l from-carelink-navy to-carelink-slate p-6 rounded-t-2xl text-white flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">פרטי הזמנה</h3>
            <p className="text-carelink-teal-pale text-sm mt-1">#{fullBooking.booking_number}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition p-2"
            data-testid="close-booking-details-btn"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${status.color}`}>
              <StatusIcon />
              {status.label}
            </span>
            <span className="text-sm text-carelink-gray">
              {fullBooking.created_at && new Date(fullBooking.created_at).toLocaleDateString('he-IL')}
            </span>
          </div>

          {/* Service Info */}
          <div className="bg-carelink-teal-pale/20 rounded-xl p-4">
            <h4 className="font-bold text-carelink-navy text-lg mb-1">{fullBooking.service_name || 'שירות'}</h4>
            <div className="flex flex-wrap gap-3 mt-2">
              {fullBooking.service_category && (
                <span className="bg-white px-3 py-1 rounded-lg text-xs font-medium text-carelink-navy">
                  {categoryLabels[fullBooking.service_category] || fullBooking.service_category}
                </span>
              )}
              {fullBooking.delivery_type && (
                <span className="bg-white px-3 py-1 rounded-lg text-xs font-medium text-carelink-navy flex items-center gap-1">
                  <DeliveryIcon className="text-carelink-teal" />
                  {delivery.label || fullBooking.delivery_type}
                </span>
              )}
            </div>
          </div>

          {/* Client Info */}
          <div className="bg-blue-50 rounded-xl p-4" data-testid="booking-client-info">
            <h4 className="font-bold text-carelink-navy mb-3 flex items-center gap-2">
              <FaUser className="text-blue-500" />
              פרטי לקוח
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <FaUser className="text-carelink-gray" />
                <span className="text-carelink-navy font-medium">{fullBooking.client_name || fullBooking.user_name || 'לקוח'}</span>
              </div>
              {(fullBooking.client_phone || fullBooking.user_info?.phone) && (
                <div className="flex items-center gap-2">
                  <FaPhone className="text-carelink-gray" />
                  <a href={`tel:${fullBooking.client_phone || fullBooking.user_info?.phone}`} className="text-carelink-teal hover:underline">
                    {fullBooking.client_phone || fullBooking.user_info?.phone}
                  </a>
                </div>
              )}
              {(fullBooking.client_email || fullBooking.user_info?.email) && (
                <div className="flex items-center gap-2 md:col-span-2">
                  <FaEnvelope className="text-carelink-gray" />
                  <a href={`mailto:${fullBooking.client_email || fullBooking.user_info?.email}`} className="text-carelink-teal hover:underline">
                    {fullBooking.client_email || fullBooking.user_info?.email}
                  </a>
                </div>
              )}
            </div>
            {/* Contact Person */}
            {fullBooking.contact_person && !fullBooking.is_contact_same_as_requester && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-blue-600 font-medium mb-1">איש קשר:</p>
                <p className="text-sm text-carelink-navy">
                  {fullBooking.contact_person.name}
                  {fullBooking.contact_person.phone && ` | ${fullBooking.contact_person.phone}`}
                  {fullBooking.contact_person.relationship && ` (${fullBooking.contact_person.relationship})`}
                </p>
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-carelink-gray mb-1 flex items-center gap-1"><FaCalendarAlt className="text-carelink-teal" /> תאריך</p>
              <p className="font-bold text-carelink-navy">
                {fullBooking.booking_date
                  ? new Date(fullBooking.booking_date).toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                  : 'יתואם טלפונית'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-carelink-gray mb-1 flex items-center gap-1"><FaClock className="text-carelink-teal" /> שעה</p>
              <p className="font-bold text-carelink-navy">
                {fullBooking.booking_time || 'לא צוין'}
              </p>
            </div>
          </div>

          {/* Shift / Platform / Sessions */}
          {(fullBooking.selected_shift || fullBooking.platform || fullBooking.num_sessions || fullBooking.hours_booked) && (
            <div className="grid grid-cols-2 gap-4">
              {fullBooking.selected_shift && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-carelink-gray mb-1">משמרת</p>
                  <p className="font-medium text-carelink-navy">{shiftLabels[fullBooking.selected_shift] || fullBooking.selected_shift}</p>
                </div>
              )}
              {fullBooking.platform && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-carelink-gray mb-1">פלטפורמה</p>
                  <p className="font-medium text-carelink-navy">{fullBooking.platform}</p>
                </div>
              )}
              {fullBooking.hours_booked && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-carelink-gray mb-1">שעות</p>
                  <p className="font-medium text-carelink-navy">{fullBooking.hours_booked} שעות</p>
                </div>
              )}
              {fullBooking.num_sessions && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-carelink-gray mb-1">מספר מפגשים</p>
                  <p className="font-medium text-carelink-navy">{fullBooking.num_sessions}</p>
                </div>
              )}
            </div>
          )}

          {/* Location */}
          {fullBooking.service_location && (
            <div className="bg-orange-50 rounded-xl p-4" data-testid="booking-location-info">
              <h4 className="font-bold text-carelink-navy mb-2 flex items-center gap-2">
                <FaMapMarkerAlt className="text-orange-500" />
                כתובת השירות
              </h4>
              <p className="text-sm text-carelink-navy">
                {fullBooking.service_location.address}
                {fullBooking.service_location.city && `, ${fullBooking.service_location.city}`}
              </p>
              {(fullBooking.service_location.floor || fullBooking.service_location.apartment) && (
                <p className="text-sm text-carelink-gray mt-1">
                  {fullBooking.service_location.floor && `קומה ${fullBooking.service_location.floor}`}
                  {fullBooking.service_location.apartment && `, דירה ${fullBooking.service_location.apartment}`}
                </p>
              )}
              {fullBooking.service_location.entry_code && (
                <p className="text-sm text-carelink-gray mt-1">קוד כניסה: {fullBooking.service_location.entry_code}</p>
              )}
              {fullBooking.service_location.notes && (
                <p className="text-sm text-carelink-gray mt-1">{fullBooking.service_location.notes}</p>
              )}
            </div>
          )}

          {/* Pricing */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4" data-testid="booking-pricing-info">
            <h4 className="font-bold text-green-700 mb-3 flex items-center gap-2">
              <FaMoneyBillWave />
              פירוט מחירים
            </h4>
            <div className="space-y-2 text-sm">
              {fullBooking.base_price != null && (
                <div className="flex justify-between">
                  <span className="text-carelink-gray">מחיר בסיס:</span>
                  <span className="font-medium">&#8362;{fullBooking.base_price}</span>
                </div>
              )}
              {fullBooking.travel_cost > 0 && (
                <div className="flex justify-between">
                  <span className="text-carelink-gray">עלות נסיעה:</span>
                  <span className="font-medium">&#8362;{fullBooking.travel_cost}</span>
                </div>
              )}
              {fullBooking.weekend_addition > 0 && (
                <div className="flex justify-between">
                  <span className="text-carelink-gray">תוספת סופ"ש:</span>
                  <span className="font-medium">&#8362;{fullBooking.weekend_addition}</span>
                </div>
              )}
              {fullBooking.shipping_cost > 0 && (
                <div className="flex justify-between">
                  <span className="text-carelink-gray">דמי משלוח:</span>
                  <span className="font-medium">&#8362;{fullBooking.shipping_cost}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-green-300">
                <span className="font-bold text-green-700">סה"כ:</span>
                <span className="font-bold text-green-700 text-lg">&#8362;{fullBooking.final_price || fullBooking.base_price || 0}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(fullBooking.notes || fullBooking.special_requirements) && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-bold text-carelink-navy mb-2 flex items-center gap-2">
                <FaStickyNote className="text-carelink-teal" />
                הערות
              </h4>
              {fullBooking.notes && <p className="text-sm text-carelink-slate">{fullBooking.notes}</p>}
              {fullBooking.special_requirements && (
                <p className="text-sm text-carelink-slate mt-2">
                  <strong>דרישות מיוחדות:</strong> {fullBooking.special_requirements}
                </p>
              )}
            </div>
          )}

          {/* Change Requests History */}
          {fullBooking.change_requests && fullBooking.change_requests.length > 0 && (
            <div className="bg-amber-50 rounded-xl p-4">
              <h4 className="font-bold text-amber-700 mb-2 flex items-center gap-2">
                <FaExchangeAlt />
                בקשות שינוי
              </h4>
              <div className="space-y-2">
                {fullBooking.change_requests.map((cr, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-3 text-sm border border-amber-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-carelink-navy">
                        {cr.new_date && `תאריך: ${cr.new_date}`}
                        {cr.new_date && cr.new_time && ' | '}
                        {cr.new_time && `שעה: ${cr.new_time}`}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        cr.status === 'approved' ? 'bg-green-100 text-green-700' :
                        cr.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {cr.status === 'approved' ? 'אושר' : cr.status === 'rejected' ? 'נדחה' : 'ממתין'}
                      </span>
                    </div>
                    {cr.reason && <p className="text-carelink-gray text-xs">{cr.reason}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Request Change Form */}
          {showChangeForm && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4" data-testid="change-request-form">
              <h4 className="font-bold text-amber-700 mb-3 flex items-center gap-2">
                <FaExchangeAlt />
                בקשת שינוי מועד
              </h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-carelink-navy mb-1">תאריך חדש</label>
                    <input
                      type="date"
                      value={changeForm.new_date}
                      onChange={(e) => setChangeForm({ ...changeForm, new_date: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none"
                      data-testid="change-request-date"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-carelink-navy mb-1">שעה חדשה</label>
                    <input
                      type="time"
                      value={changeForm.new_time}
                      onChange={(e) => setChangeForm({ ...changeForm, new_time: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none"
                      data-testid="change-request-time"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-carelink-navy mb-1">סיבה (אופציונלי)</label>
                  <textarea
                    value={changeForm.reason}
                    onChange={(e) => setChangeForm({ ...changeForm, reason: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none h-20 resize-none"
                    placeholder="הסבר ללקוח מדוע נדרש שינוי..."
                    data-testid="change-request-reason"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleRequestChange}
                    disabled={submitting}
                    className="bg-amber-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-600 transition disabled:opacity-50"
                    data-testid="submit-change-request-btn"
                  >
                    {submitting ? 'שולח...' : 'שלח בקשה'}
                  </button>
                  <button
                    onClick={() => setShowChangeForm(false)}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
            {['pending', 'confirmed', 'in_progress'].includes(fullBooking.status) && !showChangeForm && (
              <button
                onClick={() => setShowChangeForm(true)}
                className="flex-1 min-w-[140px] bg-amber-500 text-white py-3 rounded-xl font-medium hover:bg-amber-600 transition flex items-center justify-center gap-2"
                data-testid="request-change-btn"
              >
                <FaExchangeAlt />
                בקש שינוי מועד
              </button>
            )}
            <button
              onClick={handleContactUser}
              className="flex-1 min-w-[140px] bg-carelink-teal text-white py-3 rounded-xl font-medium hover:bg-carelink-teal-medium transition flex items-center justify-center gap-2"
              data-testid="contact-user-btn"
            >
              <FaComments />
              צור קשר עם לקוח
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsModal;
