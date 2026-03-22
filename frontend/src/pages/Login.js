import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import Logo from '../components/Logo';
import { FaEnvelope, FaLock, FaArrowLeft, FaUserMd, FaTimes, FaEye, FaEyeSlash, FaMapMarkerAlt, FaHeartbeat, FaShieldAlt } from 'react-icons/fa';
import api from '../utils/api';
import { toast } from 'sonner';

const Login = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const { settings: siteSettings } = useSiteSettings();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setEmailNotVerified(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEmailNotVerified(false);
    setLoading(true);

    try {
      const userData = await login(formData.email, formData.password);
      if (userData?.role === 'admin') {
        navigate('/admin');
      } else if (userData?.role === 'provider') {
        navigate('/provider/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.response?.data?.detail === 'email_not_verified') {
        setEmailNotVerified(true);
        setError('');
      } else if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (detail === 'Invalid credentials') {
          setError('אימייל או סיסמה לא נכונים');
        } else {
          setError(detail);
        }
      } else if (err.response?.status) {
        setError(`שגיאת שרת (${err.response.status}). נסה שוב מאוחר יותר.`);
      } else if (err.code === 'ERR_NETWORK') {
        setError('שגיאת תקשורת - לא ניתן להתחבר לשרת. בדוק את חיבור האינטרנט.');
      } else {
        setError('אירעה שגיאה לא צפויה. נסה שוב.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendingVerification(true);
    try {
      await api.post('/auth/resend-verification', { email: formData.email });
      toast.success('קישור אימות חדש נשלח למייל שלך');
    } catch (e) {
      toast.error('שגיאה בשליחת קישור אימות');
    }
    setResendingVerification(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error('נא להזין כתובת אימייל');
      return;
    }

    setSendingReset(true);
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail });
      setResetSent(true);
      toast.success('קישור לאיפוס סיסמה נשלח לאימייל שלך');
    } catch (err) {
      // Don't reveal if email exists or not for security
      setResetSent(true);
      toast.success('אם האימייל קיים במערכת, קישור לאיפוס סיסמה נשלח אליו');
    } finally {
      setSendingReset(false);
    }
  };

  const siteName = siteSettings.site_name || 'CareZone';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Visual Branding Panel */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-carefd-navy via-[#1a3a4f] to-carefd-teal">
        {/* Animated background shapes */}
        <div className="absolute inset-0">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-carefd-teal/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-carefd-teal/15 rounded-full blur-3xl"></div>
          <div className="absolute top-[40%] left-[30%] w-[200px] h-[200px] bg-white/5 rounded-full blur-2xl"></div>
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>

        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12">
          {/* Logo */}
          <div className="mb-10">
            <div className="bg-white/10 backdrop-blur-md px-10 py-5 rounded-2xl border border-white/10">
              <Logo size="large" />
            </div>
          </div>

          {/* Hero Text */}
          <h1 className="text-4xl xl:text-5xl font-bold text-white text-center mb-4 font-heading leading-tight">
            {siteSettings.site_tagline || 'HealthCare Providers Zone'}
          </h1>
          <p className="text-lg text-carefd-teal-pale text-center max-w-md mb-12">
            התחברו לחשבון שלכם וגשו לכל השירותים והספקים המובילים
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-3 gap-4 max-w-lg w-full">
            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-2xl border border-white/10 text-center group hover:bg-white/15 transition-all">
              <div className="w-12 h-12 mx-auto mb-3 bg-carefd-teal/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FaMapMarkerAlt className="text-xl text-carefd-teal-light" />
              </div>
              <div className="text-sm font-semibold text-white">חיפוש לפי אזור</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-2xl border border-white/10 text-center group hover:bg-white/15 transition-all">
              <div className="w-12 h-12 mx-auto mb-3 bg-carefd-teal/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FaHeartbeat className="text-xl text-carefd-teal-light" />
              </div>
              <div className="text-sm font-semibold text-white">ספקים מאומתים</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-2xl border border-white/10 text-center group hover:bg-white/15 transition-all">
              <div className="w-12 h-12 mx-auto mb-3 bg-carefd-teal/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FaShieldAlt className="text-xl text-carefd-teal-light" />
              </div>
              <div className="text-sm font-semibold text-white">מאובטח ובטוח</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-block">
              <Logo />
            </Link>
            <p className="text-carefd-gray mt-2 text-sm">
              {siteSettings.site_tagline || 'HealthCare Providers Zone'}
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 lg:p-10" data-testid="login-form">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-carefd-navy font-heading" data-testid="login-title">
                {t('login')}
              </h2>
              <p className="text-carefd-gray mt-2">
                התחברו לחשבון שלכם ב-{siteName}
              </p>
            </div>

            {/* Error Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-center text-sm" data-testid="error-message">
                {error}
              </div>
            )}

            {emailNotVerified && (
              <div className="bg-amber-50 border border-amber-200 px-4 py-4 rounded-xl mb-6 text-center" data-testid="email-not-verified-message">
                <p className="text-amber-800 font-medium mb-2 text-sm">כתובת הדואר שלך עדיין לא אומתה</p>
                <p className="text-amber-600 text-xs mb-3">בדוק את תיבת הדואר שלך (גם בספאם) ולחץ על קישור האימות.</p>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendingVerification}
                  className="text-carefd-teal font-medium hover:underline text-sm disabled:opacity-50"
                  data-testid="resend-verification-login-btn"
                >
                  {resendingVerification ? 'שולח...' : 'שלח קישור אימות מחדש'}
                </button>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-carefd-navy mb-2">
                  {t('email')}
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 text-carefd-gray/50" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 pr-12 rtl:pr-4 rtl:pl-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-carefd-teal focus:bg-white focus:ring-2 focus:ring-carefd-teal/10 transition-all"
                    placeholder="your@email.com"
                    data-testid="email-input"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-carefd-navy mb-2">
                  {t('password')}
                </label>
                <div className="relative">
                  <FaLock className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 text-carefd-gray/50" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-carefd-teal focus:bg-white focus:ring-2 focus:ring-carefd-teal/10 transition-all"
                    placeholder="••••••••"
                    data-testid="password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-12 top-1/2 -translate-y-1/2 text-carefd-gray/50 hover:text-carefd-teal transition"
                    tabIndex={-1}
                    data-testid="toggle-password-visibility"
                  >
                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-carefd-teal rounded border-gray-300" />
                  <span className="text-carefd-gray">זכור אותי</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setForgotEmail('');
                    setResetSent(false);
                  }}
                  className="text-carefd-teal hover:text-carefd-teal-medium font-medium"
                >
                  שכחת סיסמה?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-l from-carefd-teal to-carefd-teal-medium text-white py-4 rounded-xl hover:shadow-lg hover:shadow-carefd-teal/25 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                data-testid="submit-login-btn"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    {t('login')}
                    <FaArrowLeft className="rtl:rotate-180" />
                  </>
                )}
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-8 text-center">
              <p className="text-carefd-gray text-sm">
                {t('dontHaveAccount')}{' '}
                <Link to="/register" className="text-carefd-teal hover:text-carefd-teal-medium font-semibold" data-testid="register-link">
                  {t('registerNow')}
                </Link>
              </p>
            </div>

            {/* Provider Registration */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <Link
                to="/register/provider"
                className="flex items-center justify-center gap-3 w-full bg-carefd-navy/5 text-carefd-navy py-3.5 rounded-xl hover:bg-carefd-navy/10 font-medium transition group"
              >
                <FaUserMd className="text-carefd-teal group-hover:scale-110 transition-transform" />
                הרשמה כספק שירותים
              </Link>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-6">
            <Link to="/" className="text-carefd-gray hover:text-carefd-teal transition flex items-center justify-center gap-2 text-sm">
              <FaArrowLeft className="rtl:rotate-180" />
              חזרה לדף הבית
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <button
              onClick={() => setShowForgotPassword(false)}
              className="absolute top-4 left-4 text-carefd-gray hover:text-carefd-navy transition"
            >
              <FaTimes size={20} />
            </button>

            <h2 className="text-xl font-bold text-carefd-navy mb-2">איפוס סיסמה</h2>

            {!resetSent ? (
              <>
                <p className="text-carefd-gray mb-6 text-sm">
                  הזן את כתובת האימייל שלך ונשלח לך קישור לאיפוס הסיסמה
                </p>

                <form onSubmit={handleForgotPassword}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-carefd-navy mb-2">אימייל</label>
                    <div className="relative">
                      <FaEnvelope className="absolute top-1/2 -translate-y-1/2 right-4 text-carefd-gray/50" />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-carefd-teal focus:bg-white transition-all"
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={sendingReset}
                    className="w-full bg-carefd-teal text-white py-3 rounded-xl hover:bg-carefd-teal-medium font-semibold transition disabled:opacity-50"
                  >
                    {sendingReset ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                    ) : (
                      'שלח קישור איפוס'
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaEnvelope className="text-green-600 text-2xl" />
                </div>
                <h3 className="text-lg font-bold text-carefd-navy mb-2">בדוק את האימייל שלך</h3>
                <p className="text-carefd-gray mb-6 text-sm">
                  אם האימייל קיים במערכת, שלחנו לך קישור לאיפוס הסיסמה.
                  <br />
                  <span className="text-xs">הקישור תקף ל-1 שעה</span>
                </p>
                <button
                  onClick={() => setShowForgotPassword(false)}
                  className="text-carefd-teal font-medium hover:underline"
                >
                  חזור להתחברות
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
