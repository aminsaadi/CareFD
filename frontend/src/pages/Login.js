import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { FaEnvelope, FaLock, FaArrowLeft, FaUserMd, FaUsers } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';

const Login = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await login(formData.email, formData.password);
      // Navigate based on user role
      if (userData?.role === 'admin') {
        navigate('/admin');
      } else if (userData?.role === 'provider') {
        navigate('/provider/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || t('errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Use custom domain if set, otherwise use current origin
    const baseUrl = process.env.REACT_APP_SITE_URL || window.location.origin;
    const redirectUrl = baseUrl + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-carelink-navy via-carelink-slate to-carelink-teal flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-carelink-teal rounded-full"></div>
        </div>
        
        <div className="relative z-10 text-center text-white">
          <div className="bg-white px-8 py-4 rounded-2xl shadow-2xl inline-block mb-8">
            <Logo size="large" />
          </div>
          <h1 className="text-4xl font-bold font-heading mb-4">ברוכים הבאים חזרה!</h1>
          <p className="text-xl text-carelink-teal-pale max-w-md">
            התחברו לחשבון שלכם וגשו לכל השירותים והספקים המובילים בישראל
          </p>
          
          <div className="mt-12 grid grid-cols-2 gap-6 max-w-sm mx-auto">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
              <FaUsers className="text-3xl text-carelink-teal mb-2 mx-auto" />
              <div className="text-2xl font-bold">5000+</div>
              <div className="text-sm text-carelink-teal-pale">לקוחות מרוצים</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
              <FaUserMd className="text-3xl text-carelink-teal mb-2 mx-auto" />
              <div className="text-2xl font-bold">250+</div>
              <div className="text-sm text-carelink-teal-pale">ספקים מאומתים</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-block bg-white px-6 py-3 rounded-xl shadow-lg">
              <Logo />
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8" data-testid="login-form">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-carelink-navy font-heading" data-testid="login-title">
                {t('login')}
              </h2>
              <p className="text-carelink-gray mt-2">התחברו לחשבון שלכם</p>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-center" data-testid="error-message">
                {error}
              </div>
            )}

            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-carelink-teal-pale text-carelink-navy px-4 py-4 rounded-xl hover:bg-carelink-teal-pale/20 font-semibold transition-all shadow-sm hover:shadow-md"
              data-testid="google-login-btn"
            >
              <FcGoogle className="text-2xl" />
              {t('loginWithGoogle')}
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-carelink-teal-pale"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-carelink-gray">{t('orContinueWith')}</span>
              </div>
            </div>

            {/* Email/Password Login */}
            <form onSubmit={handleSubmit} className="space-y-5">
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
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pr-12 rtl:pr-4 rtl:pl-12 border-2 border-carelink-teal-pale rounded-xl focus:outline-none focus:border-carelink-teal transition-colors"
                    placeholder="••••••••"
                    data-testid="password-input"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-carelink-teal rounded" />
                  <span className="text-carelink-gray">זכור אותי</span>
                </label>
                <a href="#" className="text-carelink-teal hover:text-carelink-teal-medium font-medium">
                  שכחת סיסמה?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-carelink-teal text-white py-4 rounded-xl hover:bg-carelink-teal-medium font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

            <div className="mt-8 text-center">
              <p className="text-carelink-gray">
                {t('dontHaveAccount')}{' '}
                <Link to="/register" className="text-carelink-teal hover:text-carelink-teal-medium font-semibold" data-testid="register-link">
                  {t('registerNow')}
                </Link>
              </p>
            </div>

            {/* Provider Registration Link */}
            <div className="mt-6 pt-6 border-t-2 border-carelink-teal-pale">
              <Link
                to="/register/provider"
                className="flex items-center justify-center gap-3 w-full bg-carelink-navy/5 text-carelink-navy py-3 rounded-xl hover:bg-carelink-navy/10 font-medium transition"
              >
                <FaUserMd className="text-carelink-teal" />
                הרשמה כספק שירותים
              </Link>
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

export default Login;
