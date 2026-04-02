"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Plus, Trash2 } from "lucide-react";

export default function ProviderTeam() {
  const [members, setMembers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", phone: "", email: "" });

  const fetchTeam = () => { api.get<{ members: any[] }>("/team").then((d) => setMembers(d.members || [])).catch(() => {}); };
  useEffect(() => { fetchTeam(); }, []);

  const addMember = async () => {
    if (!form.name) return;
    await api.post("/team", form);
    setForm({ name: "", role: "", phone: "", email: "" });
    setShowForm(false);
    fetchTeam();
  };

  const removeMember = async (id: string) => { await api.delete(`/team/${id}`); fetchTeam(); };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-carefd-navy flex items-center gap-2"><Users className="w-5 h-5 text-carefd-teal" />צוות</h3>
        <Button variant="ghost" size="sm" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 me-1" />הוסף</Button>
      </div>
      {showForm && (
        <div className="space-y-3 mb-4 p-4 bg-carefd-stone rounded-xl">
          <div className="grid grid-cols-2 gap-3">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="שם" />
            <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="תפקיד" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="טלפון" dir="ltr" />
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="אימייל" dir="ltr" />
          </div>
          <div className="flex gap-2"><Button size="sm" onClick={addMember}>שמור</Button><Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>ביטול</Button></div>
        </div>
      )}
      {members.length === 0 ? <p className="text-carefd-gray text-sm text-center py-4">אין חברי צוות</p> : (
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between p-3 bg-carefd-stone/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Avatar className="w-9 h-9"><AvatarFallback className="text-sm">{m.name?.[0]}</AvatarFallback></Avatar>
                <div>
                  <p className="font-medium text-carefd-navy text-sm">{m.name}</p>
                  <p className="text-xs text-carefd-gray">{m.role}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeMember(m.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
