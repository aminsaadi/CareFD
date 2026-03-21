import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { FaLock, FaArrowLeft, FaCheckCircle, FaTimesCircle, FaEye, FaEyeSlash } from 'react-icons/fa';
import api from '../utils/api';
import { toast } from 'sonner';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      setValidating(false);
      setTokenValid(false);
      return;
    }
    
    try {
      await api.get(`/auth/reset-password/validate?token=${token}`);
      setTokenValid(true);
    } catch (err) {
      setTokenValid(false);
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('הסיסמאות אינן תואמות');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        new_password: password
      });
      setResetSuccess(true);
      toast.success('הסיסמה שונתה בהצלחה!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'שגיאה באיפוס הסיסמה');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-carefd-navy via-carefd-slate to-carefd-navy flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-carefd-navy via-carefd-slate to-carefd-navy flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo variant="white" className="h-12 mx-auto" />
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {!tokenValid ? (
            // Invalid or expired token
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTimesCircle className="text-red-500 text-3xl" />
              </div>
              <h2 className="text-xl font-bold text-carefd-navy mb-2">קישור לא תקף</h2>
              <p className="text-carefd-gray mb-6">
                הקישור לאיפוס הסיסמה פג תוקף או אינו תקף.
                <br />
                אנא בקש קישור חדש.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-carefd-teal font-medium hover:underline"
              >
                <FaArrowLeft className="rtl:rotate-180" />
                חזור להתחברות
              </Link>
            </div>
          ) : resetSuccess ? (
            // Success state
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheckCircle className="text-green-500 text-3xl" />
              </div>
              <h2 className="text-xl font-bold text-carefd-navy mb-2">הסיסמה שונתה בהצלחה!</h2>
              <p className="text-carefd-gray mb-6">
                כעת תוכל להתחבר עם הסיסמה החדשה שלך.
              </p>
              <Link
                to="/login"
                className="inline-block w-full bg-carefd-teal text-white py-3 rounded-xl hover:bg-carefd-teal-medium font-semibold transition text-center"
              >
                התחבר עכשיו
              </Link>
            </div>
          ) : (
            // Reset password form
            <>
              <h2 className="text-2xl font-bold text-carefd-navy mb-2 text-center">הגדר סיסמה חדשה</h2>
              <p className="text-carefd-gray mb-6 text-center">
                בחר סיסמה חדשה לחשבון שלך
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-carefd-navy mb-2">סיסמה חדשה</label>
                  <div className="relative">
                    <FaLock className="absolute top-1/2 -translate-y-1/2 right-4 text-carefd-gray" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-12 py-3 border-2 border-carefd-teal-pale rounded-xl focus:outline-none focus:border-carefd-teal transition-colors"
                      placeholder="לפחות 6 תווים"
                      required
                      minLength={6}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-12 top-1/2 -translate-y-1/2 text-carefd-gray hover:text-carefd-teal transition" tabIndex={-1}>
                      {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-carefd-navy mb-2">אימות סיסמה</label>
                  <div className="relative">
                    <FaLock className="absolute top-1/2 -translate-y-1/2 right-4 text-carefd-gray" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-12 py-3 border-2 border-carefd-teal-pale rounded-xl focus:outline-none focus:border-carefd-teal transition-colors"
                      placeholder="הזן שוב את הסיסמה"
                      required
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-12 top-1/2 -translate-y-1/2 text-carefd-gray hover:text-carefd-teal transition" tabIndex={-1}>
                      {showConfirm ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-carefd-teal text-white py-3 rounded-xl hover:bg-carefd-teal-medium font-semibold transition disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : (
                    'עדכן סיסמה'
                  )}
                </button>
              </form>
            </>
          )}
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
  );
};

export default ResetPassword;
