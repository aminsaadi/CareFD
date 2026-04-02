"use client";

import { useState } from "react";
import api from "@/lib/api-client";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/contact", form);
      setSubmitted(true);
    } catch (err: any) { setError(err.message); }
  };

  if (submitted) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center" dir="rtl">
      <h1 className="text-3xl font-bold text-teal-600 mb-4">ההודעה נשלחה!</h1>
      <p className="text-gray-600">תודה שפניתם אלינו. נחזור אליכם בהקדם.</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-16" dir="rtl">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">צור קשר</h1>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="שם מלא" required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none" />
        <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="אימייל" required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none" />
        <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="טלפון (אופציונלי)" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none" />
        <input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="נושא" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none" />
        <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="הודעה" required rows={5} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none" />
        <button type="submit" className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700">שליחה</button>
      </form>
    </div>
  );
}
