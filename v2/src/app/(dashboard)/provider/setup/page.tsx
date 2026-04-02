"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Building2, User, MapPin, Stethoscope } from "lucide-react";

const providerTypes = [
  { v: "individual", l: "עצמאי", icon: User },
  { v: "clinic", l: "מרפאה", icon: Stethoscope },
  { v: "company", l: "חברה", icon: Building2 },
];

export default function ProviderSetupPage() {
  const { refreshUser } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    business_name: "", description: "", provider_type: "individual",
    city: "", address: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.post("/providers", {
        provider_type: form.provider_type,
        business_name: form.business_name,
        description: form.description,
        location: { city: form.city, address: form.address },
      });
      await refreshUser();
      router.push("/provider/dashboard");
    } catch (err: any) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="mb-2">הקמת פרופיל ספק</h1>
      <p className="text-slate-500 mb-8">מלאו את הפרטים הבסיסיים להתחלה</p>

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4 border border-red-100">{error}</div>}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">סוג ספק</label>
            <div className="grid grid-cols-3 gap-3">
              {providerTypes.map((t) => (
                <button key={t.v} type="button" onClick={() => setForm({ ...form, provider_type: t.v })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    form.provider_type === t.v
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-slate-200 text-slate-400 hover:border-slate-300"
                  }`}
                  data-testid={`type-${t.v}`}
                >
                  <t.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{t.l}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">שם העסק / שם מלא</label>
            <Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} required data-testid="setup-name" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">תיאור קצר</label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="setup-desc" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                עיר
              </label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} data-testid="setup-city" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">כתובת</label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} data-testid="setup-address" />
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={submitting} data-testid="setup-submit">
            {submitting ? <span className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" /> : "צור פרופיל ספק"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
