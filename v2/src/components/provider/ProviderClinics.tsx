"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Building2, Plus, Trash2, MapPin, Phone } from "lucide-react";

export default function ProviderClinics() {
  const [clinics, setClinics] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", city: "", address: "", phone: "" });

  const fetchClinics = () => { api.get<{ clinics: any[] }>("/clinics").then((d) => setClinics(d.clinics || [])).catch(() => {}); };
  useEffect(() => { fetchClinics(); }, []);

  const addClinic = async () => {
    if (!form.name) return;
    await api.post("/clinics", form);
    setForm({ name: "", city: "", address: "", phone: "" });
    setShowForm(false);
    fetchClinics();
  };

  const deleteClinic = async (id: string) => { await api.delete(`/clinics/${id}`); fetchClinics(); };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-carefd-navy flex items-center gap-2"><Building2 className="w-5 h-5 text-carefd-teal" />מרפאות</h3>
        <Button variant="ghost" size="sm" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 me-1" />הוסף</Button>
      </div>
      {showForm && (
        <div className="space-y-3 mb-4 p-4 bg-carefd-stone rounded-xl">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="שם מרפאה" />
          <div className="grid grid-cols-2 gap-3">
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="עיר" />
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="טלפון" dir="ltr" />
          </div>
          <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="כתובת" />
          <div className="flex gap-2"><Button size="sm" onClick={addClinic}>שמור</Button><Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>ביטול</Button></div>
        </div>
      )}
      {clinics.length === 0 ? <p className="text-carefd-gray text-sm text-center py-4">אין מרפאות</p> : (
        <div className="space-y-2">
          {clinics.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-3 bg-carefd-stone/50 rounded-xl">
              <div>
                <p className="font-medium text-carefd-navy text-sm">{c.name}</p>
                <p className="text-xs text-carefd-gray flex items-center gap-1"><MapPin className="w-3 h-3" />{c.city} {c.address}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => deleteClinic(c.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
