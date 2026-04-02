"use client";

import { useState } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Bell, Send, CheckCircle } from "lucide-react";

export default function AdminPushPage() {
  const [form, setForm] = useState({ title: "", body: "", url: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const sendPush = async () => {
    if (!form.title || !form.body) return;
    setSending(true); setSent(false);
    try {
      await api.post("/push", { ...form, action: "broadcast" });
      setSent(true);
      setForm({ title: "", body: "", url: "" });
      setTimeout(() => setSent(false), 3000);
    } catch (err: any) { alert(err.message); }
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
          <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center"><Bell className="w-5 h-5 text-accent" /></div>
          <div>
            <h3 className="font-heading font-semibold text-primary">התראה חדשה</h3>
            <p className="text-xs text-slate-400">ישלח לכל המשתמשים הרשומים</p>
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
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">URL (אופציונלי)</label>
            <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." dir="ltr" />
          </div>
          <Button onClick={sendPush} disabled={sending || !form.title || !form.body}>
            {sending ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" /> : <><Send className="w-4 h-4 me-2" /> שלח התראה</>}
          </Button>
        </div>
      </Card>
    </div>
  );
}
