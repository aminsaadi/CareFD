"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Mail, Lock, User, UserPlus, Stethoscope, Heart } from "lucide-react";

export default function RegisterPage() {
  return <Suspense><RegisterContent /></Suspense>;
}

function RegisterContent() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") || "patient";

  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", role: defaultRole });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) { setError("הסיסמאות לא תואמות"); return; }
    if (form.password.length < 6) { setError("הסיסמה חייבת להכיל לפחות 6 תווים"); return; }
    setLoading(true);
    try {
      await register({ email: form.email, password: form.password, name: form.name, role: form.role });
      router.push(form.role === "provider" ? "/provider/setup" : "/dashboard");
    } catch (err: any) {
      setError(err.message || "שגיאה בהרשמה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-8 md:p-10 shadow-floating border-0">
      <div className="text-center mb-8">
        <h2 className="mb-2">יצירת חשבון</h2>
        <p className="text-slate-500">הצטרפו לקהילת CareFD</p>
      </div>

      {/* Role Selector */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <button
          type="button"
          onClick={() => setForm({ ...form, role: "patient" })}
          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
            form.role === "patient"
              ? "border-primary bg-carefd-navy/5 text-carefd-navy"
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
              ? "border-primary bg-carefd-navy/5 text-carefd-navy"
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
          <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4 border border-red-100" data-testid="register-error">
            {error}
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
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="לפחות 6 תווים"
              className="ps-11"
              required
              data-testid="register-password"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">אימות סיסמה</label>
          <div className="relative">
            <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="הזינו סיסמה שוב"
              className="ps-11"
              required
              data-testid="register-confirm-password"
            />
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={loading} data-testid="register-submit">
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

      <p className="text-center text-sm text-slate-500 mt-6">
        יש לכם חשבון?{" "}
        <Link href="/login" className="text-carefd-navy font-semibold hover:underline">
          התחברו
        </Link>
      </p>
    </Card>
  );
}
