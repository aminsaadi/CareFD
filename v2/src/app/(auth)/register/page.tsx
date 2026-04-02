"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

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
    <div className="w-full max-w-md" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">הרשמה</h1>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

        {/* Role selector */}
        <div className="flex gap-2 mb-6">
          {[{ value: "patient", label: "מטופל" }, { value: "provider", label: "ספק שירות" }].map((r) => (
            <button key={r.value} type="button" onClick={() => setForm({ ...form, role: r.value })}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${form.role === r.value ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {r.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none" placeholder="לפחות 8 תווים, אות וספרה" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">אימות סיסמה</label>
            <input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 disabled:opacity-50 transition-colors">
            {loading ? "נרשם..." : "הרשמה"}
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-gray-500">
          כבר רשום? <Link href="/login" className="text-teal-600 hover:underline">התחברות</Link>
        </div>
      </div>
    </div>
  );
}
