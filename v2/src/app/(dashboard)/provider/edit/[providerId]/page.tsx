"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";

export default function ProviderEditPage() {
  const { providerId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/providers/${providerId}`).then((p: any) => {
      setForm({
        business_name: p.business_name || "",
        description: p.description || "",
        about: p.about || "",
        phone: p.phone || "",
        email: p.email || "",
        website: p.website || "",
        whatsapp_number: p.whatsapp_number || "",
        city: p.location?.city || "",
        address: p.location?.address || "",
        years_experience: p.years_experience || "",
        languages: p.languages || [],
        health_funds: p.health_funds || [],
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [providerId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/providers/${providerId}`, {
        ...form,
        location: { city: form.city, address: form.address },
        years_experience: form.years_experience ? parseInt(form.years_experience) : null,
      });
      alert("הפרופיל עודכן!");
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  if (loading || !form) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full" /></div>;

  const Field = ({ label, name, type = "text", rows }: { label: string; name: string; type?: string; rows?: number }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {rows ? (
        <textarea value={form[name] || ""} onChange={(e) => setForm({ ...form, [name]: e.target.value })} rows={rows}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none" />
      ) : (
        <input type={type} value={form[name] || ""} onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none" />
      )}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto" dir="rtl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">עריכת פרופיל</h1>

      <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <h2 className="text-lg font-bold text-gray-800 border-b pb-2">פרטים בסיסיים</h2>
        <Field label="שם העסק" name="business_name" />
        <Field label="תיאור קצר" name="description" rows={3} />
        <Field label="אודות" name="about" rows={4} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="שנות ניסיון" name="years_experience" type="number" />
          <Field label="עיר" name="city" />
        </div>
        <Field label="כתובת" name="address" />

        <h2 className="text-lg font-bold text-gray-800 border-b pb-2 pt-4">פרטי קשר</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="טלפון" name="phone" />
          <Field label="WhatsApp" name="whatsapp_number" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="אימייל" name="email" type="email" />
          <Field label="אתר אינטרנט" name="website" />
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 disabled:opacity-50 text-lg">
          {saving ? "שומר..." : "שמור שינויים"}
        </button>
      </div>
    </div>
  );
}
