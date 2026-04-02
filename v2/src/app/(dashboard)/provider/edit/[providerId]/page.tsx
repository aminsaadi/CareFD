"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, CheckCircle } from "lucide-react";

export default function ProviderEditPage() {
  const { providerId } = useParams();
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/providers/${providerId}`).then((p: any) => {
      setForm({
        business_name: p.business_name || "", description: p.description || "",
        about: p.about || "", phone: p.phone || "", email: p.email || "",
        website: p.website || "", whatsapp_number: p.whatsapp_number || "",
        city: p.location?.city || "", address: p.location?.address || "",
        years_experience: p.years_experience || "",
        languages: p.languages || [], health_funds: p.health_funds || [],
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [providerId]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await api.put(`/providers/${providerId}`, {
        ...form,
        location: { city: form.city, address: form.address },
        years_experience: form.years_experience ? parseInt(form.years_experience) : null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  if (loading || !form) return (
    <div className="max-w-3xl mx-auto">
      <Skeleton className="h-10 w-48 mb-8" />
      <Card className="p-8"><Skeleton className="h-96 w-full" /></Card>
    </div>
  );

  const Field = ({ label, name, type = "text", rows, dir }: { label: string; name: string; type?: string; rows?: number; dir?: string }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {rows ? (
        <Textarea value={form[name] || ""} onChange={(e) => setForm({ ...form, [name]: e.target.value })} />
      ) : (
        <Input type={type} value={form[name] || ""} onChange={(e) => setForm({ ...form, [name]: e.target.value })} dir={dir} />
      )}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="mb-8">עריכת פרופיל</h1>

      <Card className="p-8">
        <div className="space-y-6">
          {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4 border border-red-100">{error}</div>}
          {saved && (
            <div className="bg-emerald-50 text-emerald-600 text-sm rounded-xl p-4 border border-emerald-100 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              הפרופיל עודכן בהצלחה
            </div>
          )}

          <h3 className="font-heading font-semibold text-carefd-navy">פרטים בסיסיים</h3>
          <Field label="שם העסק" name="business_name" />
          <Field label="תיאור קצר" name="description" rows={3} />
          <Field label="אודות" name="about" rows={4} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="שנות ניסיון" name="years_experience" type="number" />
            <Field label="עיר" name="city" />
          </div>
          <Field label="כתובת" name="address" />

          <Separator />

          <h3 className="font-heading font-semibold text-carefd-navy">פרטי קשר</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="טלפון" name="phone" dir="ltr" />
            <Field label="WhatsApp" name="whatsapp_number" dir="ltr" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="אימייל" name="email" type="email" dir="ltr" />
            <Field label="אתר אינטרנט" name="website" dir="ltr" />
          </div>

          <Button onClick={handleSave} className="w-full" size="lg" disabled={saving} data-testid="save-profile">
            {saving ? (
              <span className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
            ) : (
              <>
                <Save className="w-4 h-4 me-2" />
                שמור שינויים
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
