"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText, Search, Plus, MapPin, DollarSign, Clock,
  AlertTriangle, ChevronDown, Save, X, Loader2, Send,
} from "lucide-react";
import { toast } from "sonner";

const urgencyLabels: Record<string, string> = { low: "נמוכה", medium: "בינונית", high: "גבוהה", urgent: "דחופה" };
const urgencyColors: Record<string, string> = { low: "bg-gray-100 text-gray-600", medium: "bg-yellow-100 text-yellow-700", high: "bg-orange-100 text-orange-700", urgent: "bg-red-100 text-red-700" };

export default function PublicRequestsPage() {
  return <Suspense><RequestsContent /></Suspense>;
}

function RequestsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(searchParams.get("create") === "true");
  const [saving, setSaving] = useState(false);
  const [professions, setProfessions] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: "", description: "", budget: "", budget_type: "per_treatment",
    urgency: "medium", city: "", address: "", preferred_date: "", preferred_time: "",
    gender_preference: "", request_type: "one_time", hours_needed: "",
    language_preferences: [] as string[], professions: [] as string[],
  });

  const fetchData = () => {
    setLoading(true);
    api.get<{ requests: any[] }>("/requests", { status: "open", limit: "50" })
      .then((d) => setRequests(d.requests || []))
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    api.get<{ professions: any[] }>("/professions").then((d) => setProfessions(d.professions || [])).catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!form.title || !form.description) { toast.error("נא למלא כותרת ותיאור"); return; }
    setSaving(true);
    try {
      await api.post("/requests", {
        title: form.title, description: form.description,
        budget: form.budget ? parseFloat(form.budget) : undefined,
        budget_type: form.budget_type || undefined,
        urgency: form.urgency, city: form.city || undefined,
        address: form.address || undefined,
        preferred_date: form.preferred_date || undefined,
        preferred_time: form.preferred_time || undefined,
        gender_preference: form.gender_preference || undefined,
        request_type: form.request_type,
        hours_needed: form.hours_needed ? parseFloat(form.hours_needed) : undefined,
        language_preferences: form.language_preferences.length > 0 ? form.language_preferences : undefined,
        professions: form.professions.length > 0 ? form.professions : undefined,
      });
      toast.success("הבקשה פורסמה!"); setShowCreateForm(false);
      setForm({ title: "", description: "", budget: "", budget_type: "per_treatment", urgency: "medium", city: "", address: "", preferred_date: "", preferred_time: "", gender_preference: "", request_type: "one_time", hours_needed: "", language_preferences: [], professions: [] });
      fetchData();
    } catch { toast.error("שגיאה ביצירת בקשה"); }
    finally { setSaving(false); }
  };

  const filtered = requests.filter((r) => !search || (r.title || "").toLowerCase().includes(search.toLowerCase()) || (r.description || "").toLowerCase().includes(search.toLowerCase()));
  const isPatient = user?.role === "patient" || (user?.role as string) === "user";

  return (
    <div className="container-main py-10 md:py-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="mb-2">בקשות שירות</h1>
          <p className="text-slate-500 text-lg">צפו בבקשות שירות פתוחות או פרסמו בקשה חדשה</p>
        </div>
        {isPatient && (
          <Button onClick={() => setShowCreateForm(!showCreateForm)} size="lg" className="bg-gradient-to-l from-carefd-teal to-carefd-teal-medium shadow-glow">
            <Plus className="w-5 h-5 me-2" />פרסם בקשה
          </Button>
        )}
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="p-6 md:p-8 mb-8 border-2 border-carefd-teal animate-fade-in">
          <h2 className="text-xl font-bold text-carefd-navy mb-6">בקשת שירות חדשה</h2>
          <div className="space-y-4">
            <div className="space-y-1"><label className="text-sm font-medium text-slate-700">כותרת *</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="לדוגמה: מחפש/ת מטפל/ת בעיסוי לביקורי בית" /></div>
            <div className="space-y-1"><label className="text-sm font-medium text-slate-700">תיאור מפורט *</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="תארו את השירות, תדירות, דרישות מיוחדות..." className="min-h-[120px]" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1"><label className="text-sm font-medium text-slate-700">תקציב (₪)</label>
                <Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="אופציונלי" /></div>
              <div className="space-y-1"><label className="text-sm font-medium text-slate-700">דחיפות</label>
                <select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                  className="w-full border-2 border-carefd-teal-pale/50 rounded-xl px-3 py-2 text-sm focus:border-carefd-teal focus:outline-none transition-all">
                  <option value="low">נמוכה</option><option value="medium">בינונית</option><option value="high">גבוהה</option><option value="urgent">דחופה</option>
                </select></div>
              <div className="space-y-1"><label className="text-sm font-medium text-slate-700">עיר</label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="תל אביב" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1"><label className="text-sm font-medium text-slate-700">תאריך מועדף</label>
                <Input type="date" value={form.preferred_date} onChange={(e) => setForm({ ...form, preferred_date: e.target.value })} /></div>
              <div className="space-y-1"><label className="text-sm font-medium text-slate-700">העדפת מגדר</label>
                <select value={form.gender_preference} onChange={(e) => setForm({ ...form, gender_preference: e.target.value })}
                  className="w-full border-2 border-carefd-teal-pale/50 rounded-xl px-3 py-2 text-sm focus:border-carefd-teal focus:outline-none transition-all">
                  <option value="">ללא העדפה</option><option value="male">גבר</option><option value="female">אישה</option>
                </select></div>
            </div>
            {/* Additional fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1"><label className="text-sm font-medium text-slate-700">שעה מועדפת</label>
                <Input type="time" value={form.preferred_time} onChange={(e) => setForm({ ...form, preferred_time: e.target.value })} /></div>
              <div className="space-y-1"><label className="text-sm font-medium text-slate-700">סוג בקשה</label>
                <select value={form.request_type} onChange={(e) => setForm({ ...form, request_type: e.target.value })}
                  className="w-full border-2 border-carefd-teal-pale/50 rounded-xl px-3 py-2 text-sm focus:border-carefd-teal focus:outline-none transition-all">
                  <option value="one_time">חד פעמי</option><option value="recurring">חוזר</option>
                </select></div>
              <div className="space-y-1"><label className="text-sm font-medium text-slate-700">שעות נדרשות</label>
                <Input type="number" value={form.hours_needed} onChange={(e) => setForm({ ...form, hours_needed: e.target.value })} placeholder="אופציונלי" /></div>
            </div>
            <div className="space-y-1"><label className="text-sm font-medium text-slate-700">כתובת</label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="רחוב, מספר בית" /></div>
            {/* Language preferences */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">שפה מועדפת</label>
              <div className="flex flex-wrap gap-2">
                {["עברית","ערבית","אנגלית","רוסית","צרפתית","אמהרית"].map((lang) => (
                  <button key={lang} type="button" onClick={() => setForm({ ...form, language_preferences: form.language_preferences.includes(lang) ? form.language_preferences.filter((l) => l !== lang) : [...form.language_preferences, lang] })}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${form.language_preferences.includes(lang) ? "bg-carefd-navy text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    {lang}
                  </button>
                ))}
              </div>
            </div>
            {/* Professions */}
            {professions.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">מקצוע (אופציונלי)</label>
                <div className="flex flex-wrap gap-2">
                  {professions.slice(0, 12).map((p) => (
                    <button key={p.profession_id || p.id} type="button"
                      onClick={() => { const id = p.profession_id || p.id; setForm({ ...form, professions: form.professions.includes(id) ? form.professions.filter((x) => x !== id) : [...form.professions, id] }); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${form.professions.includes(p.profession_id || p.id) ? "bg-carefd-teal text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleCreate} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : <Send className="w-4 h-4 me-1" />}פרסם בקשה</Button>
              <Button variant="ghost" onClick={() => setShowCreateForm(false)}><X className="w-4 h-4 me-1" />ביטול</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חפש בקשות..." className="ps-12 h-12 rounded-2xl text-base" />
      </div>

      <p className="text-sm text-slate-400 mb-4">{filtered.length} בקשות פתוחות</p>

      {/* Results */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-40 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center"><FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-lg">אין בקשות פתוחות</p></Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((r) => (
            <Link key={r.request_id || r.id} href={`/requests/${r.request_id || r.id}`}>
              <Card className="p-5 hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 h-full">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-carefd-navy text-lg line-clamp-1">{r.title}</h3>
                  {r.urgency && r.urgency !== "medium" && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ms-2 ${urgencyColors[r.urgency] || ""}`}>
                      <AlertTriangle className="w-3 h-3 inline me-1" />{urgencyLabels[r.urgency]}
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-sm line-clamp-2 mb-4">{r.description}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  {r.budget && <span className="flex items-center gap-1 text-carefd-teal font-medium"><DollarSign className="w-3 h-3" />₪{r.budget}</span>}
                  {(r.city || r.location?.city) && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.city || r.location?.city}</span>}
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.created_at || r.createdAt ? new Date(r.created_at || r.createdAt).toLocaleDateString("he-IL") : ""}</span>
                  {r.offer_count > 0 && <Badge variant="outline" className="text-xs">{r.offer_count} הצעות</Badge>}
                </div>
                {r.professions?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {(r.professions as string[]).slice(0, 3).map((p, i) => <Badge key={i} className="bg-carefd-teal-pale text-carefd-teal border-0 text-[10px]">{p}</Badge>)}
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
