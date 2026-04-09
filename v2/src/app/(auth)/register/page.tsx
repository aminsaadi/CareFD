"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Mail, Lock, User, UserPlus, Stethoscope, Heart,
  Eye, EyeOff, AlertCircle, CheckCircle, MailOpen, ArrowRight
} from "lucide-react";
import api from "@/lib/api-client";

export default function RegisterPage() {
  return <Suspense><RegisterContent /></Suspense>;
}

function RegisterContent() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") || "patient";

  const [form, setForm] = useState({ name: "", email: "", password: "", role: defaultRole });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [resending, setResending] = useState(false);

  const validatePassword = (pw: string): string | null => {
    if (pw.length < 8) return "הסיסמה חייבת להכיל לפחות 8 תווים";
    if (!/\d/.test(pw)) return "הסיסמה חייבת להכיל לפחות ספרה אחת";
    if (!/[a-zA-Zא-ת]/.test(pw)) return "הסיסמה חייבת להכיל לפחות אות אחת";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const pwError = validatePassword(form.password);
    if (pwError) {
      setError(pwError);
      return;
    }

    setLoading(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        name: form.name,
        role: form.role,
      });
      setVerificationSent(true);
    } catch (err: any) {
      const msg = err.message || "שגיאה בהרשמה";
      // If email verification is required, show verification screen
      if (msg.includes("אימות") || msg.includes("verify") || msg.includes("verification")) {
        setVerificationSent(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    try {
      await api.post("/auth/resend-verification", { email: form.email });
    } catch {
      // Silent fail - user will see the message regardless
    } finally {
      setResending(false);
    }
  };

  // Verification sent screen
  if (verificationSent) {
    return (
      <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
        <div className="w-20 h-20 bg-carefd-teal-pale/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <MailOpen className="w-10 h-10 text-carefd-teal" />
        </div>
        <h2 className="text-2xl font-bold text-carefd-navy mb-3">בדקו את תיבת הדואר שלכם</h2>
        <p className="text-carefd-gray mb-2">שלחנו אימייל אימות לכתובת</p>
        <p className="font-medium text-carefd-navy mb-6" dir="ltr">{form.email}</p>
        <p className="text-sm text-carefd-gray mb-6">
          הקישור תקף ל-24 שעות. בדקו גם בתיקיית הספאם.
        </p>
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleResendVerification}
            disabled={resending}
          >
            {resending ? "שולח..." : "שלח אימייל אימות מחדש"}
          </Button>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-carefd-teal hover:underline font-medium"
          >
            <ArrowRight className="w-4 h-4" />
            חזרה להתחברות
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-carefd-navy mb-2">יצירת חשבון</h2>
        <p className="text-slate-500">הצטרפו לקהילת CareFD</p>
      </div>

      {/* Role Selector */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <button
          type="button"
          onClick={() => setForm({ ...form, role: "patient" })}
          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
            form.role === "patient"
              ? "border-carefd-teal bg-carefd-teal-pale/20 text-carefd-navy"
              : "border-slate-200 text-slate-400 hover:border-slate-300"
          }`}
          data-testid="register-role-patient"
        >
          <Heart className="w-6 h-6" />
          <span className="text-sm font-medium">מטופל</span>
        </button>
        <button
          type="button"
          onClick={() => setForm({ ...form, role: "provider" })}
          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
            form.role === "provider"
              ? "border-carefd-teal bg-carefd-teal-pale/20 text-carefd-navy"
              : "border-slate-200 text-slate-400 hover:border-slate-300"
          }`}
          data-testid="register-role-provider"
        >
          <Stethoscope className="w-6 h-6" />
          <span className="text-sm font-medium">ספק שירות</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4 border border-red-100 flex items-start gap-2" data-testid="register-error">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">שם מלא</label>
          <div className="relative">
            <User className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="הזינו שם מלא"
              className="ps-11"
              required
              data-testid="register-name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">אימייל</label>
          <div className="relative">
            <Mail className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@example.com"
              className="ps-11"
              dir="ltr"
              required
              data-testid="register-email"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">סיסמה</label>
          <div className="relative">
            <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="לפחות 8 תווים, אות וספרה"
              className="ps-11 pe-11"
              required
              data-testid="register-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute end-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-slate-400">8 תווים לפחות, כולל ספרה ואות</p>
        </div>

        <Button type="submit" className="w-full bg-carefd-teal text-white py-4 rounded-xl hover:bg-carefd-teal-medium font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50" size="lg" disabled={loading} data-testid="register-submit">
          {loading ? (
            <span className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
          ) : (
            <>
              <UserPlus className="w-4 h-4 me-2" />
              הרשמה
            </>
          )}
        </Button>
      </form>

      {/* Benefits */}
      <div className="mt-6 pt-6 border-t border-slate-100">
        <div className="grid grid-cols-2 gap-3">
          {[
            "גישה לספקים מובילים",
            "השוואת מחירים וביקורות",
            "הזמנת תורים בקלות",
            "צ׳אט ישיר עם ספקים",
          ].map((benefit) => (
            <div key={benefit} className="flex items-center gap-2 text-xs text-carefd-gray">
              <CheckCircle className="w-3.5 h-3.5 text-carefd-teal flex-shrink-0" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-sm text-slate-500 mt-6">
        יש לכם חשבון?{" "}
        <Link href="/login" className="text-carefd-navy font-semibold hover:underline">
          התחברו
        </Link>
      </p>
    </div>
  );
}
