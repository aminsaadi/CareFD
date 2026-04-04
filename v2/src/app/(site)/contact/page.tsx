"use client";

import { useState } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  CheckCircle, Send, User, Mail, Phone, FileText,
  MapPin, Clock, ArrowRight
} from "lucide-react";

const subjectOptions = [
  { value: "general", label: "שאלה כללית" },
  { value: "support", label: "תמיכה טכנית" },
  { value: "provider", label: "הצטרפות כספק" },
  { value: "complaint", label: "תלונה" },
  { value: "partnership", label: "שיתוף פעולה" },
  { value: "other", label: "אחר" },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/contact", form);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "שגיאה בשליחת ההודעה");
    } finally {
      setLoading(false);
    }
  };

  if (submitted)
    return (
      <div className="container-main py-20 max-w-2xl">
        <Card className="p-10 text-center shadow-floating border-0">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-carefd-navy mb-3">ההודעה נשלחה בהצלחה!</h2>
          <p className="text-carefd-gray mb-6">תודה שפניתם אלינו. נחזור אליכם בהקדם האפשרי.</p>
          <button
            onClick={() => {
              setSubmitted(false);
              setForm({ name: "", email: "", phone: "", subject: "", message: "" });
            }}
            className="inline-flex items-center gap-2 text-carefd-teal hover:underline font-medium"
          >
            <ArrowRight className="w-4 h-4" />
            שלח הודעה נוספת
          </button>
        </Card>
      </div>
    );

  return (
    <div className="container-main py-10 md:py-16">
      <div className="text-center mb-10">
        <h1 className="mb-3">צור קשר</h1>
        <p className="text-lg text-slate-500">נשמח לשמוע מכם. מלאו את הטופס ונחזור אליכם בהקדם.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
        {/* Contact Form */}
        <Card className="p-8 md:p-10">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4 border border-red-100 mb-6">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                שם מלא
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="שם מלא"
                required
                data-testid="contact-name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  אימייל
                </label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@example.com"
                  dir="ltr"
                  required
                  data-testid="contact-email"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  טלפון
                </label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="אופציונלי"
                  dir="ltr"
                  data-testid="contact-phone"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                נושא
              </label>
              <select
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full px-4 py-3 border-2 border-carefd-teal-pale rounded-xl bg-white text-sm focus:border-carefd-teal focus:outline-none transition-colors"
                data-testid="contact-subject"
              >
                <option value="">בחרו נושא</option>
                {subjectOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">הודעה</label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="כתבו את הודעתכם..."
                rows={5}
                required
                data-testid="contact-message"
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading} data-testid="contact-submit">
              {loading ? (
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <Send className="w-4 h-4 me-2" />
                  שליחה
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Contact Info */}
        <div className="space-y-6">
          <div className="bg-carefd-teal-pale/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-carefd-teal rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-carefd-navy">טלפון</h3>
                <p className="text-sm text-carefd-gray">ימים א-ה, 9:00-18:00 | יום ו, 9:00-13:00</p>
              </div>
            </div>
            <p className="text-lg font-bold text-carefd-navy direction-ltr text-right">03-1234567</p>
          </div>

          <div className="bg-carefd-teal-pale/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-carefd-teal rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-carefd-navy">אימייל</h3>
                <p className="text-sm text-carefd-gray">נחזור אליכם תוך 24 שעות</p>
              </div>
            </div>
            <p className="text-lg font-bold text-carefd-navy" dir="ltr">support@carefd.com</p>
          </div>

          <div className="bg-carefd-teal-pale/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-carefd-teal rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-carefd-navy">כתובת</h3>
                <p className="text-sm text-carefd-gray">ישראל</p>
              </div>
            </div>
          </div>

          <div className="bg-carefd-teal-pale/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-carefd-teal rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-carefd-navy">שעות פעילות</h3>
                <p className="text-sm text-carefd-gray">ימים א-ה: 9:00-18:00</p>
                <p className="text-sm text-carefd-gray">יום ו: 9:00-13:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
