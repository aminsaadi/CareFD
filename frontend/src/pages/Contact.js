import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock, FaPaperPlane, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'sonner';

const Contact = () => {
  const [settings, setSettings] = useState({
    contact_phone: '03-1234567',
    contact_email: 'info@carelink.co.il',
    contact_address: 'תל אביב, ישראל'
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings/public');
      if (response.data) {
        setSettings(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      // Use defaults
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.post('/contact', formData);
      setIsSubmitted(true);
      toast.success('ההודעה נשלחה בהצלחה!');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error) {
      toast.error('שגיאה בשליחת ההודעה. אנא נסו שוב.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Navbar />
      
      {/* Hero */}
      <section className="bg-gradient-to-br from-carelink-navy to-carelink-teal py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">צור קשר</h1>
          <p className="text-xl text-carelink-teal-pale">
            נשמח לשמוע מכם! צוות CareLink כאן לכל שאלה
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            
            {/* Contact Info */}
            <div>
              <h2 className="text-2xl font-bold text-carelink-navy mb-8">פרטי התקשרות</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 bg-carelink-teal-pale/20 rounded-xl">
                  <div className="w-12 h-12 bg-carelink-teal rounded-full flex items-center justify-center flex-shrink-0">
                    <FaPhone className="text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="font-bold text-carelink-navy">טלפון</h3>
                    <p className="text-carelink-slate" dir="ltr">{settings.contact_phone}</p>
                    <p className="text-sm text-carelink-gray">זמינים בימים א'-ה' 9:00-18:00</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-carelink-teal-pale/20 rounded-xl">
                  <div className="w-12 h-12 bg-carelink-teal rounded-full flex items-center justify-center flex-shrink-0">
                    <FaEnvelope className="text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="font-bold text-carelink-navy">אימייל</h3>
                    <p className="text-carelink-slate">{settings.contact_email}</p>
                    <p className="text-sm text-carelink-gray">נענה תוך 24 שעות</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-carelink-teal-pale/20 rounded-xl">
                  <div className="w-12 h-12 bg-carelink-teal rounded-full flex items-center justify-center flex-shrink-0">
                    <FaMapMarkerAlt className="text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="font-bold text-carelink-navy">כתובת</h3>
                    <p className="text-carelink-slate">{settings.contact_address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-carelink-teal-pale/20 rounded-xl">
                  <div className="w-12 h-12 bg-carelink-teal rounded-full flex items-center justify-center flex-shrink-0">
                    <FaClock className="text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="font-bold text-carelink-navy">שעות פעילות</h3>
                    <p className="text-carelink-slate">ימים א'-ה': 09:00 - 18:00</p>
                    <p className="text-carelink-slate">יום ו': 09:00 - 13:00</p>
                    <p className="text-sm text-carelink-gray">שבת וחגים - סגור</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-bold text-carelink-navy mb-8">שלחו לנו הודעה</h2>
              
              {isSubmitted ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
                  <FaCheckCircle className="text-5xl text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-emerald-700 mb-2">ההודעה נשלחה בהצלחה!</h3>
                  <p className="text-emerald-600">נחזור אליכם בהקדם האפשרי.</p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="mt-4 text-carelink-teal font-semibold hover:underline"
                  >
                    שלח הודעה נוספת
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-carelink-navy mb-2">שם מלא *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-carelink-teal focus:outline-none"
                        placeholder="השם שלך"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-carelink-navy mb-2">אימייל *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-carelink-teal focus:outline-none"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-carelink-navy mb-2">טלפון</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-carelink-teal focus:outline-none"
                        placeholder="050-0000000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-carelink-navy mb-2">נושא *</label>
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-carelink-teal focus:outline-none"
                      >
                        <option value="">בחר נושא</option>
                        <option value="general">שאלה כללית</option>
                        <option value="support">תמיכה טכנית</option>
                        <option value="provider">הצטרפות כספק</option>
                        <option value="complaint">תלונה</option>
                        <option value="partnership">שיתוף פעולה</option>
                        <option value="other">אחר</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-carelink-navy mb-2">הודעה *</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-carelink-teal focus:outline-none resize-none"
                      placeholder="כתבו את ההודעה שלכם..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-carelink-teal text-white py-3 px-6 rounded-xl font-semibold hover:bg-carelink-teal-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        שולח...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane />
                        שלח הודעה
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
