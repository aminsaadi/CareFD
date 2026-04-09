"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell, Send, CheckCircle, ChevronDown, Loader2,
  Users, Stethoscope, Globe, Clock, Trash2,
} from "lucide-react";
import { toast } from "sonner";

const roleOptions = [
  { v: "", l: "כל המשתמשים", icon: Globe, desc: "שליחה לכולם" },
  { v: "patient", l: "משתמשים בלבד", icon: Users, desc: "רק מטופלים רשומים" },
  { v: "provider", l: "ספקים בלבד", icon: Stethoscope, desc: "רק ספקי שירות" },
];

export default function AdminPushPage() {
  const [form, setForm] = useState({ title: "", body: "", url: "", role: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    api.get<{ notifications: any[] }>("/admin/notifications/history", { limit: "20" })
      .then((d) => setHistory(d.notifications || []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [sent]);

  const sendPush = async () => {
    if (!form.title || !form.body) { toast.error("נא למלא כותרת ותוכן"); return; }
    setSending(true); setSent(false);
    try {
      await api.post("/admin/notifications/broadcast", {
        title: form.title, message: form.body,
        url: form.url || undefined, role: form.role || undefined,
      });
      setSent(true);
      toast.success("ההתראה נשלחה בהצלחה!");
      setForm({ title: "", body: "", url: "", role: "" });
      setTimeout(() => setSent(false), 3000);
    } catch { toast.error("שגיאה בשליחת ההתראה"); }
    finally { setSending(false); }
  };

  const deleteNotification = async (id: string) => {
    try { await api.delete(`/notifications/${id}`); setHistory((h) => h.filter((n) => n.id !== id)); toast.success("נמחקה"); }
    catch { toast.error("שגיאה"); }
  };

  return (
    <div>
      <h2 className="font-heading font-semibold text-2xl mb-6">שליחת התראות</h2>

      {sent && (
        <div className="bg-carefd-teal/10 text-carefd-teal text-sm rounded-xl p-4 border border-carefd-teal-pale flex items-center gap-2 mb-6 animate-fade-in">
          <CheckCircle className="w-4 h-4" /> ההתראה נשלחה בהצלחה
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Send Form */}
        <div className="lg:col-span-2">
          <Card className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-carefd-teal/10 rounded-xl flex items-center justify-center"><Bell className="w-5 h-5 text-carefd-teal" /></div>
              <div>
                <h3 className="font-heading font-semibold text-carefd-navy">התראה חדשה</h3>
                <p className="text-xs text-slate-400">שליחת הודעות לקבוצות משתמשים</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">כותרת *</label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="כותרת ההתראה" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">תוכן *</label>
                <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="תוכן ההתראה..." className="min-h-[100px]" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">URL (אופציונלי)</label>
                <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="/providers או https://..." dir="ltr" />
              </div>

              {/* Role Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">קהל יעד</label>
                <div className="grid grid-cols-3 gap-3">
                  {roleOptions.map((r) => (
                    <button key={r.v} type="button" onClick={() => setForm({ ...form, role: r.v })}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${form.role === r.v ? "border-carefd-teal bg-carefd-teal/5" : "border-slate-200 hover:border-carefd-teal/40"}`}>
                      <r.icon className={`w-5 h-5 mx-auto mb-1 ${form.role === r.v ? "text-carefd-teal" : "text-slate-400"}`} />
                      <p className="text-xs font-medium">{r.l}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {form.title && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-xs text-slate-400 mb-2">תצוגה מקדימה</p>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-carefd-teal rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bell className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-carefd-navy text-sm">{form.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{form.body}</p>
                    </div>
                  </div>
                </div>
              )}

              <Button onClick={sendPush} disabled={sending || !form.title || !form.body} className="w-full h-12 bg-gradient-to-l from-carefd-teal to-carefd-teal-medium shadow-glow">
                {sending ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <Send className="w-5 h-5 me-2" />}
                {sending ? "שולח..." : "שלח התראה"}
              </Button>
            </div>
          </Card>
        </div>

        {/* History Sidebar */}
        <div>
          <Card className="p-5">
            <h3 className="font-bold text-carefd-navy mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-carefd-teal" />היסטוריה</h3>
            {loadingHistory ? (
              <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : history.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">אין היסטוריה</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {history.map((n) => (
                  <div key={n.id} className="bg-slate-50 rounded-xl p-3 group relative">
                    <p className="font-medium text-carefd-navy text-sm line-clamp-1">{n.title}</p>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{n.message || n.body}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-slate-400">{n.created_at ? new Date(n.created_at).toLocaleDateString("he-IL") : ""}</span>
                      {n.role && <Badge variant="outline" className="text-[10px]">{n.role === "provider" ? "ספקים" : n.role === "patient" ? "משתמשים" : "כולם"}</Badge>}
                    </div>
                    <button onClick={() => deleteNotification(n.id)} className="absolute top-2 end-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
