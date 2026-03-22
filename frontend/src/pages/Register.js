import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Logo from '../components/Logo';
import { FaEnvelope, FaLock, FaUser, FaArrowLeft, FaUserMd, FaUsers, FaCheckCircle, FaEye, FaEyeSlash } from 'react-icons/fa';
const Register = () => {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'patient',
    language_preference: 'he'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [resending, setResending] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await register(formData);
      if (result?.email_verification_required) {
        setVerificationSent(true);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (detail === 'Email already registered') {
          setError('כתובת המייל כבר רשומה במערכת');
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
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email: formData.email });
      setError('');
    } catch (e) {
      console.error('Failed to resend verification:', e);
    }
    setResending(false);
  };

  const benefits = [
    'גישה לספקי השירותים המובילים',
    'השוואת מחירים וביקורות',
    'הזמנת תורים בקלות',
    'צ\'אט ישיר עם ספקים'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-carelink-teal via-carelink-teal-medium to-carelink-navy flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-block bg-white px-6 py-3 rounded-xl shadow-lg">
              <Logo />
            </Link>
          </div>

          {verificationSent ? (
            <div className="bg-white rounded-3xl shadow-2xl p-8 text-center" data-testid="verification-sent">
              <div className="w-20 h-20 bg-carelink-teal/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaEnvelope className="text-4xl text-carelink-teal" />
              </div>
              <h2 className="text-2xl font-bold text-carelink-navy mb-3">בדוק את תיבת הדואר שלך</h2>
              <p className="text-carelink-gray mb-2">
                שלחנו לינק אימות לכתובת:
              </p>
              <p className="font-bold text-carelink-navy text-lg mb-6" dir="ltr">{formData.email}</p>
              <p className="text-sm text-carelink-gray mb-6">
                לחץ על הלינק במייל כדי לאמת את החשבון שלך ולהתחיל להשתמש בפלטפורמה.
                <br />הלינק תקף ל-24 שעות.
              </p>
              <button
                onClick={handleResendVerification}
                disabled={resending}
                className="text-carelink-teal font-medium hover:underline disabled:opacity-50 text-sm"
                data-testid="resend-verification-btn"
              >
                {resending ? 'שולח...' : 'לא קיבלת? שלח שוב'}
              </button>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <Link to="/login" className="text-carelink-teal font-medium hover:underline">
                  חזור להתחברות
                </Link>
              </div>
            </div>
          ) : (

          <div className="bg-white rounded-3xl shadow-2xl p-8" data-testid="register-form">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-carelink-navy font-heading" data-testid="register-title">
                {t('register')}
              </h2>
              <p className="text-carelink-gray mt-2">צרו חשבון חדש בחינם</p>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-center" data-testid="error-message">
                {error}
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-carelink-navy mb-2">
                  {t('name')}
                </label>
                <div className="relative">
                  <FaUser className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 text-carelink-gray" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pr-12 rtl:pr-4 rtl:pl-12 border-2 border-carelink-teal-pale rounded-xl focus:outline-none focus:border-carelink-teal transition-colors"
                    placeholder="השם המלא שלך"
                    data-testid="name-input"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-carelink-navy mb-2">
                  {t('email')}
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 text-carelink-gray" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pr-12 rtl:pr-4 rtl:pl-12 border-2 border-carelink-teal-pale rounded-xl focus:outline-none focus:border-carelink-teal transition-colors"
                    placeholder="your@email.com"
                    data-testid="email-input"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-carelink-navy mb-2">
                  {t('password')}
                </label>
                <div className="relative">
                  <FaLock className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 text-carelink-gray" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength="6"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-12 py-3 border-2 border-carelink-teal-pale rounded-xl focus:outline-none focus:border-carelink-teal transition-colors"
                    placeholder="לפחות 6 תווים"
                    data-testid="password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-12 top-1/2 -translate-y-1/2 text-carelink-gray hover:text-carelink-teal transition"
                    tabIndex={-1}
                    data-testid="toggle-password-visibility"
                  >
                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-carelink-teal text-white py-4 rounded-xl hover:bg-carelink-teal-medium font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                data-testid="submit-register-btn"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    צור חשבון
                    <FaArrowLeft className="rtl:rotate-180" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-carelink-gray">
                {t('alreadyHaveAccount')}{' '}
                <Link to="/login" className="text-carelink-teal hover:text-carelink-teal-medium font-semibold" data-testid="login-link">
                  {t('loginNow')}
                </Link>
              </p>
            </div>

            {/* Provider Registration Link */}
            <div className="mt-6 pt-6 border-t-2 border-carelink-teal-pale">
              <Link
                to="/register/provider"
                className="flex items-center justify-center gap-3 w-full bg-carelink-navy text-white py-3 rounded-xl hover:bg-carelink-slate font-medium transition"
              >
                <FaUserMd />
                הרשמה כספק שירותים
              </Link>
            </div>
          </div>
          )}

          {/* Back to Home */}
          <div className="text-center mt-6">
            <Link to="/" className="text-white/80 hover:text-white transition flex items-center justify-center gap-2">
              <FaArrowLeft className="rtl:rotate-180" />
              חזרה לדף הבית
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-64 h-64 bg-white rounded-full"></div>
          <div className="absolute bottom-20 left-20 w-48 h-48 bg-carelink-navy rounded-full"></div>
        </div>
        
        <div className="relative z-10 text-white max-w-lg">
          <div className="bg-white px-8 py-4 rounded-2xl shadow-2xl inline-block mb-8">
            <Logo size="large" />
          </div>
          <h1 className="text-4xl font-bold font-heading mb-4">הצטרפו אלינו!</h1>
          <p className="text-xl text-white/80 mb-8">
            אלפי משתמשים כבר נהנים מהפלטפורמה המובילה לשירותי בריאות בישראל
          </p>
          
          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl">
                <FaCheckCircle className="text-carelink-teal-pale flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center gap-4">
            <div className="flex -space-x-3 rtl:space-x-reverse">
              {['א', 'ב', 'ג', 'ד'].map((letter, i) => (
                <div
                  key={i}
                  className="w-10 h-10 bg-carelink-teal rounded-full border-2 border-white flex items-center justify-center text-white font-bold"
                >
                  {letter}
                </div>
              ))}
            </div>
            <div className="text-white/80">
              <span className="font-bold text-white">+5,000</span> משתמשים הצטרפו החודש
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
