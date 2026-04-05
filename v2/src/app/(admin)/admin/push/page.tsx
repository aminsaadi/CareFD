"use client";

import { useState } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Bell, Send, CheckCircle, ChevronDown } from "lucide-react";
import { toast } from "sonner";

export default function AdminPushPage() {
  const [form, setForm] = useState({ title: "", body: "", url: "", role: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const sendPush = async () => {
    if (!form.title || !form.body) { toast.error("נא למלא כותרת ותוכן"); return; }
    setSending(true); setSent(false);
    try {
      await api.post("/admin/notifications/broadcast", {
        title: form.title,
        message: form.body,
        url: form.url || undefined,
        role: form.role || undefined,
      });
      setSent(true);
      toast.success("ההתראה נשלחה בהצלחה!");
      setForm({ title: "", body: "", url: "", role: "" });
      setTimeout(() => setSent(false), 3000);
    } catch { toast.error("שגיאה בשליחת ההתראה"); }
    finally { setSending(false); }
  };

  return (
    <div>
      <h2 className="font-heading font-semibold text-2xl mb-6">שליחת התראות Push</h2>

      {sent && (
        <div className="bg-emerald-50 text-emerald-600 text-sm rounded-xl p-4 border border-emerald-100 flex items-center gap-2 mb-6">
          <CheckCircle className="w-4 h-4" /> ההתראה נשלחה בהצלחה
        </div>
      )}

      <Card className="p-6 md:p-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-carefd-teal/10 rounded-xl flex items-center justify-center"><Bell className="w-5 h-5 text-carefd-teal" /></div>
          <div>
            <h3 className="font-heading font-semibold text-carefd-navy">התראה חדשה</h3>
            <p className="text-xs text-slate-400">שליחת הודעות לקבוצות משתמשים</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">כותרת</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="כותרת ההתראה" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">תוכן</label>
            <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="תוכן ההתראה..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">URL (אופציונלי)</label>
              <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." dir="ltr" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">קהל יעד</label>
              <div className="relative">
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2 pe-10 text-sm cursor-pointer hover:border-carefd-teal transition focus:outline-none focus:ring-2 focus:ring-carefd-teal/30"
                >
                  <option value="">כל המשתמשים</option>
                  <option value="patient">משתמשים בלבד</option>
                  <option value="provider">ספקים בלבד</option>
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <Button onClick={sendPush} disabled={sending || !form.title || !form.body}>
            {sending ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" /> : <><Send className="w-4 h-4 me-2" /> שלח התראה</>}
          </Button>
        </div>
      </Card>
    </div>
  );
}
