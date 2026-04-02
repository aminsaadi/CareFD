"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api-client";
import api from "@/lib/api-client";
import Logo from "@/components/Logo";
import {
  FaEnvelope,
  FaLock,
  FaUser,
  FaArrowLeft,
  FaUserMd,
  FaCheckCircle,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "patient",
    language_preference: "he",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [resending, setResending] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password.length < 8) {
      setError("הסיסמה חייבת להכיל לפחות 8 תווים");
      return;
    }
    if (!/\d/.test(formData.password)) {
      setError("הסיסמה חייבת להכיל לפחות ספרה אחת");
      return;
    }
    if (!/[a-zA-Z]/.test(formData.password)) {
      setError("הסיסמה חייבת להכיל לפחות אות אחת");
      return;
    }

    setLoading(true);

    try {
      const result = await register(formData);
      if (result?.email_verification_required) {
        setVerificationSent(true);
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.data?.detail) {
          const detail = err.data.detail;
          if (detail === "Email already registered") {
            setError("כתובת המייל כבר רשומה במערכת");
          } else {
            setError(detail);
          }
        } else if (err.status) {
          setError(`שגיאת שרת (${err.status}). נסה שוב מאוחר יותר.`);
        } else {
          setError("אירעה שגיאה לא צפויה. נסה שוב.");
        }
      } else if (err instanceof TypeError && err.message === "Failed to fetch") {
        setError("שגיאת תקשורת - לא ניתן להתחבר לשרת. בדוק את חיבור האינטרנט.");
      } else {
        setError("אירעה שגיאה לא צפויה. נסה שוב.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    try {
      await api.post("/auth/resend-verification", { email: formData.email });
      setError("");
    } catch {
      console.error("Failed to resend verification");
    }
    setResending(false);
  };

  const benefits = [
    "גישה לספקי השירותים המובילים",
    "השוואת מחירים וביקורות",
    "הזמנת תורים בקלות",
    "צ'אט ישיר עם ספקים",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-carefd-teal via-carefd-teal-medium to-carefd-navy flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-block bg-white px-6 py-3 rounded-xl shadow-lg">
              <Logo />
            </Link>
          </div>

          {verificationSent ? (
            <div
              className="bg-white rounded-3xl shadow-2xl p-8 text-center"
              data-testid="verification-sent"
            >
              <div className="w-20 h-20 bg-carefd-teal/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaEnvelope className="text-4xl text-carefd-teal" />
              </div>
              <h2 className="text-2xl font-bold text-carefd-navy mb-3">
                בדוק את תיבת הדואר שלך
              </h2>
              <p className="text-carefd-gray mb-2">שלחנו לינק אימות לכתובת:</p>
              <p className="font-bold text-carefd-navy text-lg mb-6" dir="ltr">
                {formData.email}
              </p>
              <p className="text-sm text-carefd-gray mb-6">
                לחץ על הלינק במייל כדי לאמת את החשבון שלך ולהתחיל להשתמש בפלטפורמה.
                <br />
                הלינק תקף ל-24 שעות.
              </p>
              <button
                onClick={handleResendVerification}
                disabled={resending}
                className="text-carefd-teal font-medium hover:underline disabled:opacity-50 text-sm"
                data-testid="resend-verification-btn"
              >
                {resending ? "שולח..." : "לא קיבלת? שלח שוב"}
              </button>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <Link href="/login" className="text-carefd-teal font-medium hover:underline">
                  חזור להתחברות
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-2xl p-8" data-testid="register-form">
              <div className="text-center mb-8">
                <h2
                  className="text-3xl font-bold text-carefd-navy font-heading"
                  data-testid="register-title"
                >
                  הרשמה
                </h2>
                <p className="text-carefd-gray mt-2">צרו חשבון חדש בחינם</p>
              </div>

              {error && (
                <div
                  className="bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-center"
                  data-testid="error-message"
                >
                  {error}
                </div>
              )}

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold text-carefd-navy mb-2"
                  >
                    שם
                  </label>
                  <div className="relative">
                    <FaUser className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 text-carefd-gray" />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pr-12 rtl:pr-4 rtl:pl-12 border-2 border-carefd-teal-pale rounded-xl focus:outline-none focus:border-carefd-teal transition-colors"
                      placeholder="השם המלא שלך"
                      data-testid="name-input"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-carefd-navy mb-2"
                  >
                    אימייל
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 text-carefd-gray" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pr-12 rtl:pr-4 rtl:pl-12 border-2 border-carefd-teal-pale rounded-xl focus:outline-none focus:border-carefd-teal transition-colors"
                      placeholder="your@email.com"
                      data-testid="email-input"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-carefd-navy mb-2"
                  >
                    סיסמה
                  </label>
                  <div className="relative">
                    <FaLock className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 text-carefd-gray" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-12 py-3 border-2 border-carefd-teal-pale rounded-xl focus:outline-none focus:border-carefd-teal transition-colors"
                      placeholder="לפחות 8 תווים"
                      data-testid="password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-12 top-1/2 -translate-y-1/2 text-carefd-gray hover:text-carefd-teal transition"
                      aria-label={showPassword ? "הסתר סיסמה" : "הצג סיסמה"}
                      data-testid="toggle-password-visibility"
                    >
                      {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-carefd-teal text-white py-4 rounded-xl hover:bg-carefd-teal-medium font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                <p className="text-carefd-gray">
                  {"כבר יש לך חשבון? "}
                  <Link
                    href="/login"
                    className="text-carefd-teal hover:text-carefd-teal-medium font-semibold"
                    data-testid="login-link"
                  >
                    התחבר עכשיו
                  </Link>
                </p>
              </div>

              {/* Provider Registration Link */}
              <div className="mt-6 pt-6 border-t-2 border-carefd-teal-pale">
                <Link
                  href="/register/provider"
                  className="flex items-center justify-center gap-3 w-full bg-carefd-navy text-white py-3 rounded-xl hover:bg-carefd-slate font-medium transition"
                >
                  <FaUserMd />
                  הרשמה כספק שירותים
                </Link>
              </div>
            </div>
          )}

          {/* Back to Home */}
          <div className="text-center mt-6">
            <Link
              href="/"
              className="text-white/80 hover:text-white transition flex items-center justify-center gap-2"
            >
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
          <div className="absolute bottom-20 left-20 w-48 h-48 bg-carefd-navy rounded-full"></div>
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
              <div
                key={index}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl"
              >
                <FaCheckCircle className="text-carefd-teal-pale flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center gap-4">
            <div className="flex -space-x-3 rtl:space-x-reverse">
              {["א", "ב", "ג", "ד"].map((letter, i) => (
                <div
                  key={i}
                  className="w-10 h-10 bg-carefd-teal rounded-full border-2 border-white flex items-center justify-center text-white font-bold"
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
}
