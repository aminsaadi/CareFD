"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Plus, Trash2, X } from "lucide-react";

interface Region { id: string; name: string; nameEn?: string; cities: string[]; }

export default function AdminRegionsPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");

  const fetchData = () => {
    setLoading(true);
    api.get<{ regions: Region[] }>("/admin/regions").then((d) => setRegions(d.regions)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const addRegion = async () => {
    if (!newName.trim()) return;
    await api.post("/admin/regions", { name: newName });
    setNewName("");
    fetchData();
  };

  const deleteRegion = async (id: string) => {
    if (!confirm("למחוק אזור זה?")) return;
    await api.delete(`/admin/regions/${id}`);
    fetchData();
  };

  const addCity = async (regionId: string) => {
    const city = prompt("שם עיר:");
    if (!city) return;
    await api.put(`/admin/regions/${regionId}`, { action: "add_city", city });
    fetchData();
  };

  const removeCity = async (regionId: string, city: string) => {
    await api.put(`/admin/regions/${regionId}`, { action: "remove_city", city });
    fetchData();
  };

  return (
    <div>
      <h2 className="font-heading font-semibold text-2xl mb-6">ניהול אזורים</h2>

      <Card className="p-4 mb-6 flex gap-3">
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="שם אזור חדש..." className="flex-1 h-10"
          onKeyDown={(e) => e.key === "Enter" && addRegion()} data-testid="new-region-name" />
        <Button onClick={addRegion} size="sm"><Plus className="w-4 h-4 me-1" /> הוסף</Button>
      </Card>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : (
        <div className="space-y-3">
          {regions.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center"><MapPin className="w-5 h-5 text-accent" /></div>
                  <h3 className="font-semibold text-primary">{r.name}</h3>
                  <span className="text-xs text-slate-400">{r.cities.length} ערים</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => addCity(r.id)} className="text-accent"><Plus className="w-3 h-3 me-1" /> עיר</Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteRegion(r.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
              {r.cities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {r.cities.map((c) => (
                    <Badge key={c} variant="outline" className="gap-1">{c}<button onClick={() => removeCity(r.id, c)} className="hover:text-red-500"><X className="w-3 h-3" /></button></Badge>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
