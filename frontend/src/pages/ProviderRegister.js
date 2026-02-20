import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { 
  FaEnvelope, FaLock, FaUser, FaArrowLeft, FaUserMd, FaBuilding, 
  FaPhone, FaMapMarkerAlt, FaCheckCircle, FaBriefcaseMedical,
  FaUsers, FaCalendarCheck, FaChartLine
} from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';

const ProviderRegister = () => {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'provider',
    language_preference: 'he',
    // Provider specific
    business_name: '',
    provider_type: 'individual',
    phone: '',
    city: '',
    specializations: []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const providerTypes = [
    { value: 'individual', label: 'עצמאי', icon: FaUserMd, desc: 'מטפל/ת עצמאי/ת' },
    { value: 'clinic', label: 'מרפאה', icon: FaBriefcaseMedical, desc: 'מרפאה או מרכז רפואי' },
    { value: 'company', label: 'חברה', icon: FaBuilding, desc: 'חברת שירותי בריאות' }
  ];

  const specializations = [
    'סיעוד', 'פיזיותרפיה', 'ריפוי בעיסוק', 'רפואת משפחה', 
    'גריאטריה', 'רפואה משלימה', 'פסיכולוגיה', 'דיאטה ותזונה'
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleSpecialization = (spec) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: 'provider',
        language_preference: formData.language_preference
      });
      navigate('/provider/setup');
    } catch (err) {
      setError(err.response?.data?.detail || t('errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    // Use custom domain if set, otherwise use current origin
    const baseUrl = process.env.REACT_APP_SITE_URL || window.location.origin;
    const redirectUrl = baseUrl + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const benefits = [
    { icon: FaUsers, title: 'הגיעו ללקוחות חדשים', desc: 'אלפי משתמשים מחפשים שירותים כל יום' },
    { icon: FaCalendarCheck, title: 'ניהול תורים חכם', desc: 'מערכת לניהול זמינות והזמנות' },
    { icon: FaChartLine, title: 'צמחו את העסק', desc: 'כלים לשיווק ובניית מוניטין' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-carelink-navy via-carelink-slate to-carelink-teal flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-carelink-teal rounded-full"></div>
        </div>
        
        <div className="relative z-10 text-white max-w-lg">
          <div className="bg-white px-8 py-4 rounded-2xl shadow-2xl inline-block mb-8">
            <Logo size="large" />
          </div>
          <h1 className="text-4xl font-bold font-heading mb-4">הצטרפו כספק שירותים</h1>
          <p className="text-xl text-carelink-teal-pale mb-8">
            הגדילו את העסק שלכם והגיעו לאלפי לקוחות פוטנציאליים
          </p>
          
          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-4 bg-white/10 backdrop-blur-sm px-5 py-4 rounded-xl">
                <div className="w-12 h-12 bg-carelink-teal rounded-xl flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="text-xl text-white" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">{benefit.title}</h3>
                  <p className="text-sm text-carelink-teal-pale">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 p-6 bg-white/10 backdrop-blur-sm rounded-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-carelink-teal rounded-full flex items-center justify-center text-white text-xl font-bold">
                ד
              </div>
              <div>
                <div className="font-bold">ד"ר יעל כהן</div>
                <div className="text-sm text-carelink-teal-pale">רופאת משפחה</div>
              </div>
            </div>
            <p className="text-white/80 italic">
              "הפלטפורמה עזרה לי להגיע ללקוחות חדשים ולנהל את התורים בצורה יעילה יותר"
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <Link to="/" className="inline-block bg-white px-6 py-3 rounded-xl shadow-lg">
              <Logo />
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8">
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-4 mb-8">
              {[1, 2].map((s) => (
                <React.Fragment key={s}>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      step >= s ? 'bg-carelink-teal text-white' : 'bg-carelink-teal-pale text-carelink-gray'
                    }`}
                  >
                    {step > s ? <FaCheckCircle /> : s}
                  </div>
                  {s < 2 && (
                    <div className={`w-16 h-1 rounded ${step > s ? 'bg-carelink-teal' : 'bg-carelink-teal-pale'}`}></div>
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-carelink-navy font-heading">
                {step === 1 ? 'פרטי חשבון' : 'פרטי העסק'}
              </h2>
              <p className="text-carelink-gray mt-1">
                {step === 1 ? 'יצירת חשבון ספק חדש' : 'ספרו לנו על העסק שלכם'}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-center">
                {error}
              </div>
            )}

            {step === 1 && (
              <>
                {/* Google Register */}
                <button
                  onClick={handleGoogleRegister}
                  className="w-full flex items-center justify-center gap-3 bg-white border-2 border-carelink-teal-pale text-carelink-navy px-4 py-4 rounded-xl hover:bg-carelink-teal-pale/20 font-semibold transition-all shadow-sm hover:shadow-md mb-6"
                  data-testid="google-register-btn"
                >
                  <FcGoogle className="text-2xl" />
                  הרשמה עם Google
                </button>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-carelink-teal-pale"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-carelink-gray">{t('orContinueWith')}</span>
                  </div>
                </div>

                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-carelink-navy mb-2">שם מלא</label>
                    <div className="relative">
                      <FaUser className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 text-carelink-gray" />
                      <input
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 pr-12 rtl:pr-4 rtl:pl-12 border-2 border-carelink-teal-pale rounded-xl focus:outline-none focus:border-carelink-teal"
                        placeholder="השם שלך"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-carelink-navy mb-2">אימייל</label>
                    <div className="relative">
                      <FaEnvelope className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 text-carelink-gray" />
                      <input
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 pr-12 rtl:pr-4 rtl:pl-12 border-2 border-carelink-teal-pale rounded-xl focus:outline-none focus:border-carelink-teal"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-carelink-navy mb-2">סיסמה</label>
                    <div className="relative">
                      <FaLock className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 text-carelink-gray" />
                      <input
                        name="password"
                        type="password"
                        required
                        minLength="6"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-3 pr-12 rtl:pr-4 rtl:pl-12 border-2 border-carelink-teal-pale rounded-xl focus:outline-none focus:border-carelink-teal"
                        placeholder="לפחות 6 תווים"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!formData.name || !formData.email || !formData.password}
                    className="w-full bg-carelink-teal text-white py-4 rounded-xl hover:bg-carelink-teal-medium font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    המשך
                    <FaArrowLeft className="rtl:rotate-180" />
                  </button>
                </form>
              </>
            )}

            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-carelink-navy mb-2">שם העסק</label>
                  <div className="relative">
                    <FaBuilding className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 text-carelink-gray" />
                    <input
                      name="business_name"
                      type="text"
                      value={formData.business_name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pr-12 rtl:pr-4 rtl:pl-12 border-2 border-carelink-teal-pale rounded-xl focus:outline-none focus:border-carelink-teal"
                      placeholder="שם המרפאה/העסק"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-carelink-navy mb-3">סוג ספק</label>
                  <div className="grid grid-cols-3 gap-3">
                    {providerTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, provider_type: type.value })}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.provider_type === type.value
                            ? 'border-carelink-teal bg-carelink-teal-pale/30'
                            : 'border-carelink-teal-pale hover:border-carelink-teal'
                        }`}
                      >
                        <type.icon className={`text-2xl mx-auto mb-2 ${
                          formData.provider_type === type.value ? 'text-carelink-teal' : 'text-carelink-gray'
                        }`} />
                        <div className="font-semibold text-carelink-navy text-sm">{type.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-carelink-navy mb-2">טלפון</label>
                    <div className="relative">
                      <FaPhone className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 text-carelink-gray" />
                      <input
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 pr-12 rtl:pr-4 rtl:pl-12 border-2 border-carelink-teal-pale rounded-xl focus:outline-none focus:border-carelink-teal"
                        placeholder="050-0000000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-carelink-navy mb-2">עיר</label>
                    <div className="relative">
                      <FaMapMarkerAlt className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 text-carelink-gray" />
                      <input
                        name="city"
                        type="text"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-4 py-3 pr-12 rtl:pr-4 rtl:pl-12 border-2 border-carelink-teal-pale rounded-xl focus:outline-none focus:border-carelink-teal"
                        placeholder="תל אביב"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-carelink-navy mb-3">התמחויות</label>
                  <div className="flex flex-wrap gap-2">
                    {specializations.map((spec) => (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => toggleSpecialization(spec)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          formData.specializations.includes(spec)
                            ? 'bg-carelink-teal text-white'
                            : 'bg-carelink-teal-pale/30 text-carelink-navy hover:bg-carelink-teal-pale'
                        }`}
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-carelink-teal-pale/30 text-carelink-navy py-4 rounded-xl hover:bg-carelink-teal-pale font-semibold transition-all"
                  >
                    חזור
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-carelink-teal text-white py-4 rounded-xl hover:bg-carelink-teal-medium font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        הרשמה
                        <FaArrowLeft className="rtl:rotate-180" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-carelink-gray text-sm">
                כבר יש לך חשבון?{' '}
                <Link to="/login" className="text-carelink-teal hover:text-carelink-teal-medium font-semibold">
                  התחבר עכשיו
                </Link>
              </p>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-6">
            <Link to="/" className="text-white/80 hover:text-white transition flex items-center justify-center gap-2">
              <FaArrowLeft className="rtl:rotate-180" />
              חזרה לדף הבית
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderRegister;
