"use client";

import { useState } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { CheckCircle, Send, User, Mail, Phone, FileText } from "lucide-react";

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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) return (
    <div className="container-main py-20 max-w-2xl">
      <Card className="p-10 text-center shadow-floating border-0">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="mb-2">ההודעה נשלחה!</h2>
        <p className="text-slate-500">תודה שפניתם אלינו. נחזור אליכם בהקדם.</p>
      </Card>
    </div>
  );

  return (
    <div className="container-main py-10 md:py-16 max-w-2xl">
      <div className="text-center mb-10">
        <h1 className="mb-3">צור קשר</h1>
        <p className="text-lg text-slate-500">נשמח לשמוע מכם. מלאו את הטופס ונחזור אליכם בהקדם.</p>
      </div>

      <Card className="p-8 md:p-10">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4 border border-red-100 mb-6">{error}</div>
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
            <Input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="נושא הפנייה"
              data-testid="contact-subject"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">הודעה</label>
            <Textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="כתבו את הודעתכם..."
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
    </div>
  );
}
