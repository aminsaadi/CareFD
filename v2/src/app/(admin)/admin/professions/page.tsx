"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, Plus, Trash2, ChevronDown, ChevronLeft } from "lucide-react";

interface SubProfession { id: string; name: string; nameEn?: string; }
interface Profession { id: string; name: string; nameEn?: string; icon: string; specializations: string[]; sortOrder: number; subProfessions: SubProfession[]; }

export default function AdminProfessionsPage() {
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    api.get<{ professions: Profession[] }>("/admin/professions").then((d) => setProfessions(d.professions)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const addProfession = async () => {
    if (!newName.trim()) return;
    await api.post("/admin/professions", { name: newName });
    setNewName("");
    fetchData();
  };

  const deleteProfession = async (id: string) => {
    if (!confirm("למחוק מקצוע זה?")) return;
    await api.delete(`/admin/professions/${id}`);
    fetchData();
  };

  const addSubProfession = async (profId: string) => {
    const name = prompt("שם תת-מקצוע:");
    if (!name) return;
    await api.put(`/admin/professions/${profId}`, { action: "add_sub", name });
    fetchData();
  };

  return (
    <div>
      <h2 className="font-heading font-semibold text-2xl mb-6">ניהול מקצועות</h2>

      {/* Add new */}
      <Card className="p-4 mb-6 flex gap-3">
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="שם מקצוע חדש..." className="flex-1 h-10"
          onKeyDown={(e) => e.key === "Enter" && addProfession()} data-testid="new-profession-name" />
        <Button onClick={addProfession} size="sm" data-testid="add-profession">
          <Plus className="w-4 h-4 me-1" /> הוסף
        </Button>
      </Card>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : (
        <div className="space-y-3">
          {professions.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <div className="p-4 flex items-center justify-between">
                <button onClick={() => setExpandedId(expandedId === p.id ? null : p.id)} className="flex items-center gap-3 flex-1 text-start">
                  <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">{p.name}</h3>
                    <p className="text-xs text-slate-400">{p.subProfessions?.length || 0} תת-מקצועות</p>
                  </div>
                  {expandedId === p.id ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronLeft className="w-4 h-4 text-slate-400" />}
                </button>
                <Button variant="ghost" size="icon" onClick={() => deleteProfession(p.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {expandedId === p.id && (
                <div className="border-t border-slate-100 bg-secondary/30 p-4">
                  {p.subProfessions?.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {p.subProfessions.map((sub) => (
                        <div key={sub.id} className="flex items-center gap-2 ps-4">
                          <Badge variant="outline">{sub.name}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => addSubProfession(p.id)} className="text-accent">
                    <Plus className="w-3 h-3 me-1" /> הוסף תת-מקצוע
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
