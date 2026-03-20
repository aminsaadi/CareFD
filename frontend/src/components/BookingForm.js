import React, { useState, useEffect, useCallback } from 'react';
import { X, User, Phone, Mail, MapPin, MessageSquare, Calendar, Clock, CheckCircle, AlertCircle, Copy, Sparkles } from 'lucide-react';
import MapPicker from './MapPicker';
import CitySelect from './CitySelect';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const pricingLabels = {
  fixed: 'מחיר קבוע',
  per_hour: 'לשעה',
  per_visit: 'לביקור',
  per_session: 'לפגישה'
};

const SuccessDialog = ({ service, provider, onClose }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4" data-testid="booking-success-dialog">
    <div className="bg-white rounded-2xl w-full max-w-md p-8 text-center animate-in fade-in zoom-in-95 duration-300">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
        <CheckCircle className="w-9 h-9 text-green-600" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">ההזמנה נשלחה בהצלחה!</h3>
      <p className="text-gray-500 mb-2">ההזמנה שלך עבור <span className="font-semibold text-teal-700">{service?.name}</span> נשלחה.</p>
      <p className="text-gray-500 mb-6">הספק <span className="font-semibold">{provider?.business_name}</span> יאשר אותה בקרוב.</p>
      <div className="bg-teal-50 rounded-xl p-4 mb-6 text-sm text-teal-800">
        תקבל/י התראה ברגע שההזמנה תאושר. ניתן לעקוב בדשבורד שלך.
      </div>
      <button
        onClick={onClose}
        className="w-full py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition"
        data-testid="close-success-dialog"
      >
        סגור
      </button>
    </div>
  </div>
);

const ErrorDialog = ({ message, onClose, onRetry }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4" data-testid="booking-error-dialog">
    <div className="bg-white rounded-2xl w-full max-w-md p-8 text-center animate-in fade-in zoom-in-95 duration-300">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
        <AlertCircle className="w-9 h-9 text-red-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">שגיאה בשליחת ההזמנה</h3>
      <p className="text-gray-500 mb-6">{message || 'אירעה שגיאה לא צפויה. אנא נסו שוב.'}</p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
        >
          סגור
        </button>
        <button
          onClick={onRetry}
          className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition"
          data-testid="retry-booking-btn"
        >
          נסה שוב
        </button>
      </div>
    </div>
  </div>
);

const BookingForm = ({ service, provider, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  
  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    use_different_contact: false,
    contact_person_name: '',
    contact_person_phone: '',
    contact_person_relationship: '',
    service_address: '',
    service_city: '',
    service_floor: '',
    service_apartment: '',
    service_entry_code: '',
    service_notes: '',
    service_latitude: null,
    service_longitude: null,
    booking_date: '',
    booking_time: '',
    notes: '',
    special_requirements: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      service_latitude: location.lat,
      service_longitude: location.lng
    }));
    setShowMap(false);
  };

  const fillMyDetails = useCallback(() => {
    if (!user) return;
    setFormData(prev => ({
      ...prev,
      client_name: user.name || prev.client_name,
      client_phone: user.phone || prev.client_phone,
      client_email: user.email || prev.client_email
    }));
  }, [user]);

  const fillMyAddress = useCallback(() => {
    if (!user) return;
    setFormData(prev => ({
      ...prev,
      service_address: user.address || prev.service_address,
      service_city: user.city || prev.service_city
    }));
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const bookingData = {
        service_id: service.service_id,
        booking_date: new Date(formData.booking_date).toISOString(),
        booking_time: formData.booking_time,
        client_name: formData.client_name,
        client_phone: formData.client_phone,
        client_email: formData.client_email || undefined,
        service_address: formData.service_address,
        service_city: formData.service_city,
        service_floor: formData.service_floor || undefined,
        service_apartment: formData.service_apartment || undefined,
        service_entry_code: formData.service_entry_code || undefined,
        service_notes: formData.service_notes || undefined,
        service_latitude: formData.service_latitude,
        service_longitude: formData.service_longitude,
        notes: formData.notes || undefined,
        special_requirements: formData.special_requirements || undefined
      };

      if (formData.use_different_contact && formData.contact_person_name) {
        bookingData.contact_person_name = formData.contact_person_name;
        bookingData.contact_person_phone = formData.contact_person_phone;
        bookingData.contact_person_relationship = formData.contact_person_relationship;
      }

      await api.post('/bookings', bookingData);
      setShowSuccess(true);
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'שגיאה בשליחת ההזמנה. אנא בדקו את הפרטים ונסו שוב.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    onSuccess?.();
    onClose();
  };

  const timeSlots = [];
  for (let h = 8; h <= 20; h++) {
    timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
  }

  const priceLabel = pricingLabels[service?.pricing_type] || '';

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between rounded-t-2xl z-10">
            <div>
              <h2 className="text-xl font-bold text-gray-900">הזמנת שירות</h2>
              <p className="text-sm text-gray-500">
                {service?.name} - {provider?.business_name}
                {service?.price && (
                  <span className="text-teal-600 font-semibold mr-2">
                    ₪{service.price}{priceLabel ? ` / ${priceLabel}` : ''}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              data-testid="close-booking-form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Client Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-teal-600" />
                  פרטי המזמין
                </h3>
                <button
                  type="button"
                  onClick={fillMyDetails}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-full transition"
                  data-testid="fill-my-details-btn"
                >
                  <Copy className="w-3.5 h-3.5" />
                  הפרטים שלי
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא *</label>
                  <input
                    type="text"
                    name="client_name"
                    value={formData.client_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    data-testid="client-name-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">טלפון *</label>
                  <input
                    type="tel"
                    name="client_phone"
                    value={formData.client_phone}
                    onChange={handleChange}
                    required
                    dir="ltr"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    data-testid="client-phone-input"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
                  <input
                    type="email"
                    name="client_email"
                    value={formData.client_email}
                    onChange={handleChange}
                    dir="ltr"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    data-testid="client-email-input"
                  />
                </div>
              </div>
            </div>

            {/* Contact Person */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="use_different_contact"
                  checked={formData.use_different_contact}
                  onChange={handleChange}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">איש קשר נוסף (אם שונה מהמזמין)</span>
              </label>
              
              {formData.use_different_contact && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">שם איש קשר</label>
                    <input
                      type="text"
                      name="contact_person_name"
                      value={formData.contact_person_name}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
                    <input
                      type="tel"
                      name="contact_person_phone"
                      value={formData.contact_person_phone}
                      onChange={handleChange}
                      dir="ltr"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">קשר למזמין</label>
                    <select
                      name="contact_person_relationship"
                      value={formData.contact_person_relationship}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="">בחר...</option>
                      <option value="self">עצמי</option>
                      <option value="family">בן משפחה</option>
                      <option value="caregiver">מטפל</option>
                      <option value="friend">חבר</option>
                      <option value="other">אחר</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Service Location */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-teal-600" />
                  מיקום השירות
                </h3>
                <button
                  type="button"
                  onClick={fillMyAddress}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-full transition"
                  data-testid="fill-my-address-btn"
                >
                  <Copy className="w-3.5 h-3.5" />
                  הכתובת שלי
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">כתובת *</label>
                  <input
                    type="text"
                    name="service_address"
                    value={formData.service_address}
                    onChange={handleChange}
                    required
                    placeholder="רחוב ומספר בית"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    data-testid="service-address-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">עיר *</label>
                  <CitySelect
                    name="service_city"
                    value={formData.service_city}
                    onChange={handleChange}
                    required
                    data-testid="service-city-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">קומה</label>
                    <input
                      type="text"
                      name="service_floor"
                      value={formData.service_floor}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">דירה</label>
                    <input
                      type="text"
                      name="service_apartment"
                      value={formData.service_apartment}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">קוד כניסה</label>
                  <input
                    type="text"
                    name="service_entry_code"
                    value={formData.service_entry_code}
                    onChange={handleChange}
                    dir="ltr"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">הערות למיקום</label>
                  <input
                    type="text"
                    name="service_notes"
                    value={formData.service_notes}
                    onChange={handleChange}
                    placeholder="למשל: יש מעלית, חניה בחצר"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setShowMap(true)}
                className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                <MapPin className="w-4 h-4" />
                סמן מיקום על המפה
              </button>
              
              {formData.service_latitude && (
                <p className="text-xs text-gray-500">
                  מיקום נבחר: {formData.service_latitude.toFixed(4)}, {formData.service_longitude.toFixed(4)}
                </p>
              )}
            </div>

            {/* Date and Time */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                תאריך ושעה
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תאריך *</label>
                  <input
                    type="date"
                    name="booking_date"
                    value={formData.booking_date}
                    onChange={handleChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    data-testid="booking-date-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">שעה מועדפת *</label>
                  <select
                    name="booking_time"
                    value={formData.booking_time}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    data-testid="booking-time-select"
                  >
                    <option value="">בחר שעה...</option>
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-teal-600" />
                פרטים נוספים
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">הערות להזמנה</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="מידע נוסף שחשוב לספק לדעת..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">דרישות מיוחדות</label>
                <textarea
                  name="special_requirements"
                  value={formData.special_requirements}
                  onChange={handleChange}
                  rows={2}
                  placeholder="למשל: אלרגיות, מגבלות תנועה, ציוד מיוחד..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                ביטול
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="submit-booking-btn"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    שולח...
                  </>
                ) : 'שלח הזמנה'}
              </button>
            </div>
          </form>
        </div>

        {/* Map Modal */}
        {showMap && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl w-full max-w-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">בחר מיקום על המפה</h3>
                <button onClick={() => setShowMap(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <MapPicker onLocationSelect={handleLocationSelect} />
            </div>
          </div>
        )}
      </div>

      {/* Success Dialog */}
      {showSuccess && (
        <SuccessDialog service={service} provider={provider} onClose={handleSuccessClose} />
      )}

      {/* Error Dialog */}
      {showError && (
        <ErrorDialog
          message={errorMessage}
          onClose={() => setShowError(false)}
          onRetry={() => {
            setShowError(false);
            handleSubmit({ preventDefault: () => {} });
          }}
        />
      )}
    </>
  );
};

export default BookingForm;
