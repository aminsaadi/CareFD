"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, Crown, Gem, User, Plus, Edit, Save, X, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

const tierIcons: Record<string, React.ElementType> = { free: User, pro: Crown, premium: Gem };
const tierColors: Record<string, string> = {
  free: "bg-slate-50 text-slate-600 border-slate-200",
  pro: "bg-blue-50 text-blue-600 border-blue-200",
  premium: "bg-gradient-to-br from-carefd-teal/10 to-carefd-navy/10 text-carefd-teal border-carefd-teal/30",
};

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", tier: "pro", monthly_price: "", yearly_price: "", description: "", features: "" });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get<{ plans: any[] }>("/subscription-plans").catch(() => ({ plans: [] })),
      api.get<{ subscribers: any[] }>("/admin/subscriptions").catch(() => ({ subscribers: [] })),
    ]).then(([p, s]) => {
      setPlans((p as any).plans || []);
      setSubscribers((s as any).subscribers || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleEdit = (plan: any) => {
    setForm({
      name: plan.name || "", tier: plan.tier || "pro",
      monthly_price: plan.monthlyPrice || plan.monthly_price || "",
      yearly_price: plan.yearlyPrice || plan.yearly_price || "",
      description: plan.description || "",
      features: (plan.features || []).join(", "),
    });
    setEditingId(plan.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error("נא למלא שם"); return; }
    setSaving(true);
    try {
      const data = {
        ...form,
        monthly_price: parseFloat(form.monthly_price) || 0,
        yearly_price: parseFloat(form.yearly_price) || 0,
        features: form.features.split(",").map((f) => f.trim()).filter(Boolean),
      };
      if (editingId) { await api.put(`/admin/subscription-plans/${editingId}`, data); toast.success("עודכן"); }
      else { await api.post("/admin/subscription-plans", data); toast.success("נוצר"); }
      setShowForm(false); setEditingId(null); fetchData();
    } catch { toast.error("שגיאה"); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading font-semibold text-2xl">ניהול מנויים</h2>
        <Button size="sm" onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: "", tier: "pro", monthly_price: "", yearly_price: "", description: "", features: "" }); }}>
          <Plus className="w-4 h-4 me-1" />תוכנית חדשה
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="p-6 mb-6 space-y-4 border-2 border-carefd-teal">
          <h3 className="font-bold text-carefd-navy">{editingId ? "עריכת תוכנית" : "תוכנית חדשה"}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-sm font-medium">שם *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1"><label className="text-sm font-medium">רמה</label>
              <select value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="free">חינמי</option><option value="pro">פרו</option><option value="premium">פרמיום</option>
              </select>
            </div>
            <div className="space-y-1"><label className="text-sm font-medium">מחיר חודשי (₪)</label><Input type="number" value={form.monthly_price} onChange={(e) => setForm({ ...form, monthly_price: e.target.value })} /></div>
            <div className="space-y-1"><label className="text-sm font-medium">מחיר שנתי (₪)</label><Input type="number" value={form.yearly_price} onChange={(e) => setForm({ ...form, yearly_price: e.target.value })} /></div>
          </div>
          <div className="space-y-1"><label className="text-sm font-medium">תיאור</label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="space-y-1"><label className="text-sm font-medium">פיצ'רים (מופרדים בפסיק)</label><Input value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder="פרופיל מקודם, שירותים ללא הגבלה, תווית מומלץ" /></div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : <Save className="w-4 h-4 me-1" />}שמור</Button>
            <Button variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); }}><X className="w-4 h-4 me-1" />ביטול</Button>
          </div>
        </Card>
      )}

      {/* Plans */}
      <h3 className="font-heading font-semibold text-lg mb-4">תוכניות ({plans.length})</h3>
      {loading ? (
        <div className="grid md:grid-cols-3 gap-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full" />)}</div>
      ) : plans.length === 0 ? (
        <Card className="p-10 text-center"><CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400">אין תוכניות</p></Card>
      ) : (
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {plans.map((p) => {
            const Icon = tierIcons[p.tier] || User;
            return (
              <Card key={p.id} className={`p-6 border-2 ${tierColors[p.tier] || tierColors.free}`}>
                <div className="flex items-center justify-between mb-3">
                  <Icon className="w-8 h-8" />
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(p)}><Edit className="w-4 h-4" /></Button>
                </div>
                <h3 className="font-heading font-bold text-xl mb-1">{p.name}</h3>
                <p className="text-sm opacity-70 mb-4">{p.description || p.tier}</p>
                <div className="space-y-1 text-sm mb-4">
                  <p>חודשי: <span className="font-heading font-bold">₪{p.monthlyPrice || p.monthly_price || 0}</span></p>
                  <p>שנתי: <span className="font-heading font-bold">₪{p.yearlyPrice || p.yearly_price || 0}</span></p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(p.features || []).map((f: string) => <Badge key={f} variant="outline" className="text-[10px]"><Check className="w-3 h-3 me-1" />{f}</Badge>)}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Subscribers */}
      {subscribers.length > 0 && (
        <>
          <h3 className="font-heading font-semibold text-lg mb-4">מנויים פעילים ({subscribers.length})</h3>
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-100 text-slate-500 bg-carefd-stone/50"><th className="p-3 text-start font-medium">ספק</th><th className="p-3 text-start font-medium">תוכנית</th><th className="p-3 text-start font-medium">סטטוס</th><th className="p-3 text-start font-medium">תוקף</th></tr></thead>
                <tbody>
                  {subscribers.map((s: any) => (
                    <tr key={s.id} className="border-b border-slate-50 hover:bg-carefd-stone/30">
                      <td className="p-3 font-medium text-carefd-navy">{s.provider_name || s.providerName || "-"}</td>
                      <td className="p-3"><Badge variant="outline">{s.plan_name || s.tier || "-"}</Badge></td>
                      <td className="p-3"><Badge variant={s.status === "active" ? "success" : "outline"}>{s.status === "active" ? "פעיל" : s.status}</Badge></td>
                      <td className="p-3 text-slate-400">{s.expires_at ? new Date(s.expires_at).toLocaleDateString("he-IL") : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
