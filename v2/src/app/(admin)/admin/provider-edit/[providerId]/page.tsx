"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Save, Loader2, ArrowRight, Eye, Shield, Award,
  User, MapPin, Phone, Mail, Globe, Star, CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminProviderEditPage() {
  const { providerId } = useParams();
  const router = useRouter();
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (!providerId) return;
    api.get<any>(`/providers/${providerId}`)
      .then((d) => { setProvider(d); setForm({ ...d }); })
      .catch(() => toast.error("ספק לא נמצא"))
      .finally(() => setLoading(false));
  }, [providerId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/providers/${providerId}`, {
        business_name: form.business_name,
        description: form.description,
        phone: form.phone,
        email: form.email,
        is_verified: form.is_verified,
        is_recommended: form.is_recommended,
        profession_name: form.profession_name,
        years_experience: form.years_experience ? parseInt(form.years_experience) : null,
      });
      toast.success("הספק עודכן בהצלחה!");
    } catch { toast.error("שגיאה בשמירה"); }
    finally { setSaving(false); }
  };

  const handleVerify = async () => {
    try {
      await api.put(`/admin/providers/${providerId}`, { action: "verify" });
      toast.success("הספק אומת"); setForm({ ...form, is_verified: true });
    } catch { toast.error("שגיאה"); }
  };

  const handleRecommend = async () => {
    try {
      await api.put(`/admin/providers/${providerId}`, { action: form.is_recommended ? "unrecommend" : "recommend" });
      toast.success(form.is_recommended ? "ההמלצה הוסרה" : "הספק סומן כמומלץ");
      setForm({ ...form, is_recommended: !form.is_recommended });
    } catch { toast.error("שגיאה"); }
  };

  if (loading) return <div><Skeleton className="h-10 w-64 mb-6" /><Skeleton className="h-96 w-full" /></div>;
  if (!provider) return <div className="text-center py-20 text-slate-400">ספק לא נמצא</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowRight className="w-4 h-4 me-1" />חזרה</Button>
        <h2 className="font-heading font-semibold text-2xl">עריכת ספק: {provider.business_name}</h2>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button size="sm" variant="outline" asChild><Link href={`/providers/${providerId}`}><Eye className="w-4 h-4 me-1" />צפה בפרופיל</Link></Button>
        <Button size="sm" variant="outline" asChild><Link href={`/provider/edit/${providerId}`}><User className="w-4 h-4 me-1" />עריכה מלאה</Link></Button>
        {!form.is_verified && <Button size="sm" className="bg-carefd-teal hover:bg-carefd-teal-medium" onClick={handleVerify}><Shield className="w-4 h-4 me-1" />אמת ספק</Button>}
        <Button size="sm" variant={form.is_recommended ? "ghost" : "outline"} className={form.is_recommended ? "text-amber-600" : ""} onClick={handleRecommend}>
          <Award className="w-4 h-4 me-1" />{form.is_recommended ? "הסר המלצה" : "המלץ"}
        </Button>
      </div>

      {/* Status Badges */}
      <div className="flex gap-2 mb-6">
        <Badge variant={form.is_verified ? "success" : "warning"}>{form.is_verified ? "מאומת" : "לא מאומת"}</Badge>
        {form.is_recommended && <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0"><Award className="w-3 h-3 me-1" />מומלץ</Badge>}
        {form.rating > 0 && <Badge variant="outline"><Star className="w-3 h-3 me-1 text-amber-400" />{(form.rating || 0).toFixed(1)}</Badge>}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <Card className="p-6 space-y-4">
          <h3 className="font-bold text-carefd-navy">פרטי עסק</h3>
          <div className="space-y-1"><label className="text-sm font-medium">שם העסק</label>
            <Input value={form.business_name || ""} onChange={(e) => setForm({ ...form, business_name: e.target.value })} /></div>
          <div className="space-y-1"><label className="text-sm font-medium">תיאור</label>
            <Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-h-[100px]" /></div>
          <div className="space-y-1"><label className="text-sm font-medium">מקצוע</label>
            <Input value={form.profession_name || ""} onChange={(e) => setForm({ ...form, profession_name: e.target.value })} /></div>
          <div className="space-y-1"><label className="text-sm font-medium">שנות ניסיון</label>
            <Input type="number" value={form.years_experience || ""} onChange={(e) => setForm({ ...form, years_experience: e.target.value })} /></div>
        </Card>

        {/* Contact */}
        <Card className="p-6 space-y-4">
          <h3 className="font-bold text-carefd-navy">פרטי קשר</h3>
          <div className="space-y-1"><label className="text-sm font-medium flex items-center gap-1"><Phone className="w-3.5 h-3.5" />טלפון</label>
            <Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" /></div>
          <div className="space-y-1"><label className="text-sm font-medium flex items-center gap-1"><Mail className="w-3.5 h-3.5" />אימייל</label>
            <Input value={form.email || form.user?.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} dir="ltr" /></div>
          <div className="space-y-1"><label className="text-sm font-medium flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />עיר</label>
            <Input value={form.location?.city || form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>

          {/* Toggles */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">הצג טלפון</span>
              <Switch checked={form.show_phone !== false} onCheckedChange={(v) => setForm({ ...form, show_phone: v })} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">הצג WhatsApp</span>
              <Switch checked={form.show_whatsapp !== false} onCheckedChange={(v) => setForm({ ...form, show_whatsapp: v })} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">הצג אימייל</span>
              <Switch checked={form.show_email !== false} onCheckedChange={(v) => setForm({ ...form, show_email: v })} />
            </div>
          </div>
        </Card>
      </div>

      {/* Save */}
      <div className="flex justify-end mt-6">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <Save className="w-5 h-5 me-2" />}
          {saving ? "שומר..." : "שמור שינויים"}
        </Button>
      </div>
    </div>
  );
}
