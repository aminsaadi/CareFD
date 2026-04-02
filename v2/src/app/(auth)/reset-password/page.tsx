"use client";

import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api-client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/reset-password", { email });
      setSent(true);
    } catch (err: any) { setError(err.message); }
  };

  if (sent) return (
    <div className="w-full max-w-md text-center" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-teal-600 mb-4">✓ נשלח!</h1>
        <p className="text-gray-600 mb-4">אם הכתובת רשומה במערכת, נשלח אליה קישור לאיפוס סיסמה.</p>
        <Link href="/login" className="text-teal-600 hover:underline">חזרה להתחברות</Link>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-md" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">איפוס סיסמה</h1>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none" />
          </div>
          <button type="submit" className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700">
            שלח קישור איפוס
          </button>
        </form>
        <div className="mt-4 text-center text-sm">
          <Link href="/login" className="text-teal-600 hover:underline">חזרה להתחברות</Link>
        </div>
      </div>
    </div>
  );
}
