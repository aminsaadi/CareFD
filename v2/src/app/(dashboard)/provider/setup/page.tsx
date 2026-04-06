"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2, User, MapPin, Stethoscope, Phone, Globe,
  ChevronLeft, ChevronRight, Check, Loader2, Briefcase,
} from "lucide-react";
import { toast } from "sonner";

const providerTypes = [
  { v: "individual", l: "עצמאי", desc: "ספק שירות פרטי", icon: User },
  { v: "clinic", l: "מרפאה", desc: "מרפאה או קליניקה", icon: Stethoscope },
  { v: "company", l: "חברה", desc: "חברה או ארגון", icon: Building2 },
];

const steps = [
  { id: 1, title: "סוג ספק", icon: User },
  { id: 2, title: "פרטי העסק", icon: Briefcase },
  { id: 3, title: "מקצוע ומיקום", icon: MapPin },
];

export default function ProviderSetupPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [professions, setProfessions] = useState<any[]>([]);
  const [form, setForm] = useState({
    business_name: user?.name || "",
    description: "",
    provider_type: "individual",
    city: "",
    address: "",
    phone: "",
    profession_id: "",
    experience_years: "",
    languages: ["עברית"],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<{ professions: any[] }>("/professions")
      .then((d) => setProfessions(d.professions || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!form.business_name) { toast.error("נא להזין שם עסק"); return; }
    setSubmitting(true);
    setError("");
    try {
      await api.post("/providers", {
        provider_type: form.provider_type,
        business_name: form.business_name,
        description: form.description,
        phone: form.phone,
        profession_id: form.profession_id || undefined,
        experience_years: form.experience_years ? parseInt(form.experience_years) : undefined,
        languages: form.languages.length > 0 ? form.languages : undefined,
        location: { city: form.city, address: form.address },
      });
      await refreshUser();
      toast.success("הפרופיל נוצר בהצלחה!");
      router.push("/provider/dashboard");
    } catch (err: any) {
      setError(err.message || "שגיאה ביצירת הפרופיל");
      toast.error(err.message || "שגיאה ביצירת הפרופיל");
    }
    finally { setSubmitting(false); }
  };

  const canProceed = () => {
    if (step === 1) return !!form.provider_type;
    if (step === 2) return !!form.business_name;
    return true;
  };

  const toggleLanguage = (lang: string) => {
    setForm({
      ...form,
      languages: form.languages.includes(lang)
        ? form.languages.filter((l) => l !== lang)
        : [...form.languages, lang],
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="mb-2">הקמת פרופיל ספק</h1>
      <p className="text-slate-500 mb-8">מלאו את הפרטים הבסיסיים כדי להתחיל לקבל לקוחות</p>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 flex-1">
            <button
              onClick={() => s.id < step && setStep(s.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition w-full ${
                step === s.id ? "bg-carefd-teal text-white" :
                step > s.id ? "bg-green-100 text-green-700" :
                "bg-slate-100 text-slate-400"
              }`}
            >
              {step > s.id ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
              <span className="hidden sm:inline">{s.title}</span>
              <span className="sm:hidden">{s.id}</span>
            </button>
            {i < steps.length - 1 && <div className={`w-8 h-0.5 flex-shrink-0 ${step > s.id ? "bg-green-300" : "bg-slate-200"}`} />}
          </div>
        ))}
      </div>

      <Card className="p-8">
        {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4 border border-red-100 mb-6">{error}</div>}

        {/* Step 1: Provider Type */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-carefd-navy mb-4">בחרו את סוג הספק</h2>
            <div className="grid gap-3">
              {providerTypes.map((t) => (
                <button key={t.v} type="button" onClick={() => setForm({ ...form, provider_type: t.v })}
                  className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-right ${
                    form.provider_type === t.v
                      ? "border-carefd-teal bg-carefd-teal/5 shadow-sm"
                      : "border-slate-200 hover:border-slate-300"
                  }`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${form.provider_type === t.v ? "bg-carefd-teal text-white" : "bg-slate-100 text-slate-400"}`}>
                    <t.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-carefd-navy">{t.l}</p>
                    <p className="text-sm text-slate-400">{t.desc}</p>
                  </div>
                  {form.provider_type === t.v && <Check className="w-5 h-5 text-carefd-teal ms-auto" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Business Details */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-carefd-navy mb-4">פרטי העסק</h2>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">שם העסק / שם מלא *</label>
              <Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} required placeholder="לדוגמה: קליניקת שיקום פיזיותרפיה" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">תיאור קצר על העסק</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="תארו את העסק שלכם, ניסיון, התמחויות..." className="min-h-[100px]" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" />טלפון</label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="050-0000000" dir="ltr" />
            </div>
          </div>
        )}

        {/* Step 3: Profession & Location */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-carefd-navy mb-4">מקצוע ומיקום</h2>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">מקצוע</label>
              <select value={form.profession_id} onChange={(e) => setForm({ ...form, profession_id: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm">
                <option value="">בחרו מקצוע...</option>
                {professions.map((p) => <option key={p.profession_id || p.id} value={p.profession_id || p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">שנות ניסיון</label>
              <Input type="number" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: e.target.value })} placeholder="0" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" />עיר</label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">כתובת</label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-slate-400" />שפות</label>
              <div className="flex flex-wrap gap-2">
                {["עברית", "אנגלית", "ערבית", "רוסית", "אמהרית", "צרפתית", "ספרדית"].map((lang) => (
                  <button key={lang} type="button" onClick={() => toggleLanguage(lang)}
                    className={`px-3 py-1.5 rounded-full text-sm transition ${form.languages.includes(lang) ? "bg-carefd-teal text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}><ChevronRight className="w-4 h-4 me-1" />הקודם</Button>
          ) : <div />}
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>{steps[step]?.title || "הבא"}<ChevronLeft className="w-4 h-4 ms-1" /></Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting} size="lg">
              {submitting ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <Check className="w-5 h-5 me-2" />}
              {submitting ? "יוצר פרופיל..." : "צור פרופיל ספק"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
