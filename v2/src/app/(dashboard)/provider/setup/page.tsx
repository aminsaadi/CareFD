"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";

export default function ProviderSetupPage() {
  const { refreshUser } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    business_name: "", description: "", provider_type: "individual",
    city: "", address: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/providers", {
        provider_type: form.provider_type,
        business_name: form.business_name,
        description: form.description,
        location: { city: form.city, address: form.address },
      });
      await refreshUser();
      router.push("/provider/dashboard");
    } catch (err: any) { alert(err.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">הקמת פרופיל ספק</h1>
      <p className="text-gray-500 mb-8">מלאו את הפרטים הבסיסיים להתחלה</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">סוג ספק</label>
          <div className="flex gap-2">
            {[{ v: "individual", l: "עצמאי" }, { v: "clinic", l: "מרפאה" }, { v: "company", l: "חברה" }].map((t) => (
              <button key={t.v} type="button" onClick={() => setForm({ ...form, provider_type: t.v })}
                className={`flex-1 py-2 rounded-xl font-medium ${form.provider_type === t.v ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600"}`}>{t.l}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שם העסק / שם מלא</label>
          <input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} required
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">תיאור קצר</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">עיר</label>
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">כתובת</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none" />
          </div>
        </div>
        <button type="submit" disabled={submitting}
          className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 disabled:opacity-50 text-lg">
          {submitting ? "שומר..." : "צור פרופיל ספק"}
        </button>
      </form>
    </div>
  );
}
