"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Plus, Trash2, X, Edit, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Region { id: string; name: string; nameEn?: string; cities: string[]; }

export default function AdminRegionsPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newCityInputs, setNewCityInputs] = useState<Record<string, string>>({});
  const [editingRegion, setEditingRegion] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = () => {
    setLoading(true);
    api.get<{ regions: Region[] }>("/admin/regions")
      .then((d) => setRegions(d.regions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const addRegion = async () => {
    if (!newName.trim()) { toast.error("נא להזין שם אזור"); return; }
    setSaving(true);
    try {
      await api.post("/admin/regions", { name: newName, cities: [] });
      toast.success("האזור נוסף בהצלחה");
      setNewName("");
      fetchData();
    } catch { toast.error("שגיאה בהוספת אזור"); }
    finally { setSaving(false); }
  };

  const updateRegionName = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await api.put(`/admin/regions/${id}`, { name: editName });
      toast.success("השם עודכן");
      setEditingRegion(null);
      fetchData();
    } catch { toast.error("שגיאה בעדכון"); }
  };

  const deleteRegion = async (id: string) => {
    if (!confirm("האם למחוק אזור זה? כל הערים שלו יימחקו.")) return;
    try {
      await api.delete(`/admin/regions/${id}`);
      toast.success("האזור נמחק");
      fetchData();
    } catch { toast.error("שגיאה במחיקת אזור"); }
  };

  const addCity = async (regionId: string) => {
    const city = newCityInputs[regionId]?.trim();
    if (!city) { toast.error("נא להזין שם עיר"); return; }
    try {
      await api.post(`/admin/regions/${regionId}/cities`, { city });
      toast.success(`${city} נוספה`);
      setNewCityInputs((p) => ({ ...p, [regionId]: "" }));
      fetchData();
    } catch { toast.error("שגיאה בהוספת עיר"); }
  };

  const removeCity = async (regionId: string, city: string) => {
    try {
      await api.delete(`/admin/regions/${regionId}/cities/${encodeURIComponent(city)}`);
      toast.success(`${city} הוסרה`);
      fetchData();
    } catch { toast.error("שגיאה בהסרת עיר"); }
  };

  return (
    <div>
      <h2 className="font-heading font-semibold text-2xl mb-6">ניהול אזורים ({regions.length})</h2>

      <Card className="p-4 mb-6 flex gap-3">
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="שם אזור חדש..."
          className="flex-1 h-10" onKeyDown={(e) => e.key === "Enter" && addRegion()} />
        <Button onClick={addRegion} size="sm" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : <Plus className="w-4 h-4 me-1" />} הוסף
        </Button>
      </Card>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : regions.length === 0 ? (
        <Card className="p-10 text-center">
          <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400">אין אזורים</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {regions.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-carefd-teal/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-carefd-teal" />
                  </div>
                  {editingRegion === r.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-9 flex-1"
                        onKeyDown={(e) => e.key === "Enter" && updateRegionName(r.id)} autoFocus />
                      <Button size="sm" variant="ghost" onClick={() => updateRegionName(r.id)}><Save className="w-4 h-4 text-green-600" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingRegion(null)}><X className="w-4 h-4" /></Button>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-semibold text-carefd-navy">{r.name}</h3>
                      <span className="text-xs text-slate-400">{r.cities?.length || 0} ערים</span>
                    </>
                  )}
                </div>
                <div className="flex gap-1">
                  {editingRegion !== r.id && (
                    <Button variant="ghost" size="sm" onClick={() => { setEditingRegion(r.id); setEditName(r.name); }} title="ערוך">
                      <Edit className="w-4 h-4 text-slate-400" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => deleteRegion(r.id)} className="text-red-400 hover:text-red-600" title="מחק">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Cities */}
              {(r.cities?.length || 0) > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {r.cities.map((c) => (
                    <Badge key={c} variant="outline" className="gap-1 py-1">
                      {c}
                      <button onClick={() => removeCity(r.id, c)} className="hover:text-red-500 transition ms-1">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Add City Input */}
              <div className="flex gap-2">
                <Input
                  value={newCityInputs[r.id] || ""}
                  onChange={(e) => setNewCityInputs((p) => ({ ...p, [r.id]: e.target.value }))}
                  placeholder="הוסף עיר..."
                  className="h-8 text-sm flex-1"
                  onKeyDown={(e) => e.key === "Enter" && addCity(r.id)}
                />
                <Button size="sm" variant="ghost" onClick={() => addCity(r.id)} className="text-carefd-teal h-8">
                  <Plus className="w-3 h-3 me-1" /> הוסף
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
