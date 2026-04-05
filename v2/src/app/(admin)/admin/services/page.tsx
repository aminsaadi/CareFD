"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Wrench, Eye, Trash2, ToggleLeft, ToggleRight, ChevronDown } from "lucide-react";
import { toast } from "sonner";

const categoryNames: Record<string, string> = {
  visit: "שירות ביקור", hourly: "שירות שעתי", consultation: "ייעוץ", product: "מוצר",
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = (s = search, cat = categoryFilter) => {
    setLoading(true);
    const params: Record<string, string> = { limit: "50" };
    if (s) params.search = s;
    if (cat) params.category = cat;
    api.get<{ services: any[]; total: number }>("/services", params)
      .then((d) => { setServices(d.services || []); setTotal(d.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [categoryFilter]);

  const toggleActive = async (serviceId: string, currentActive: boolean) => {
    try {
      await api.put(`/services/${serviceId}`, { is_active: !currentActive });
      toast.success(currentActive ? "השירות הושבת" : "השירות הופעל");
      fetchData();
    } catch { toast.error("שגיאה בעדכון"); }
  };

  const deleteService = async (serviceId: string) => {
    if (!confirm("האם למחוק שירות זה?")) return;
    try {
      await api.delete(`/services/${serviceId}`);
      toast.success("השירות נמחק");
      fetchData();
    } catch { toast.error("שגיאה במחיקה"); }
  };

  return (
    <div>
      <h2 className="font-heading font-semibold text-2xl mb-6">ניהול שירותים ({total})</h2>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={(e) => { e.preventDefault(); fetchData(); }} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חפש שירות..." className="ps-10 h-10" />
          </div>
          <Button type="submit" size="sm">חפש</Button>
        </form>
        <div className="relative">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            className="appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2 pe-10 text-sm font-medium cursor-pointer hover:border-carefd-teal focus:outline-none">
            <option value="">כל הקטגוריות</option>
            <option value="visit">שירות ביקור</option>
            <option value="hourly">שירות שעתי</option>
            <option value="consultation">ייעוץ</option>
            <option value="product">מוצר</option>
          </select>
          <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : services.length === 0 ? (
        <Card className="p-12 text-center">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400">אין שירותים</p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 bg-carefd-stone/50">
                  <th className="p-3 text-start font-medium">שם</th>
                  <th className="p-3 text-start font-medium">ספק</th>
                  <th className="p-3 text-start font-medium">מחיר</th>
                  <th className="p-3 text-start font-medium">קטגוריה</th>
                  <th className="p-3 text-start font-medium">סטטוס</th>
                  <th className="p-3 text-start font-medium">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => {
                  const id = s.service_id || s.id;
                  const isActive = s.isActive !== false && s.is_active !== false;
                  return (
                    <tr key={id} className="border-b border-slate-50 hover:bg-carefd-stone/30 transition-colors">
                      <td className="p-3 font-medium text-carefd-navy">{s.name}</td>
                      <td className="p-3 text-slate-500">
                        {s.provider?.business_name || s.providerName || "-"}
                      </td>
                      <td className="p-3 font-heading font-medium text-green-600">₪{s.price}</td>
                      <td className="p-3">
                        <Badge variant="outline">{categoryNames[s.serviceCategory || s.service_category] || s.serviceCategory || s.service_category || "-"}</Badge>
                      </td>
                      <td className="p-3">
                        {isActive ? <Badge variant="success">פעיל</Badge> : <Badge variant="outline">לא פעיל</Badge>}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => toggleActive(id, isActive)}
                            title={isActive ? "השבת" : "הפעל"}>
                            {isActive ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                          </Button>
                          {s.provider_id && (
                            <Button size="sm" variant="ghost" asChild title="צפה בספק">
                              <Link href={`/providers/${s.provider_id}`}><Eye className="w-4 h-4" /></Link>
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="text-red-500" onClick={() => deleteService(id)} title="מחק">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
