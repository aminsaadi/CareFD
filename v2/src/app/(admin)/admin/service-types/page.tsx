"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus, Edit2, Trash2, X, Check, Loader2, Home, Video, Building2, PhoneCall,
  Clock, Package, Truck, MapPin, ToggleLeft, ToggleRight,
} from "lucide-react";

interface ServiceType {
  id: string;
  name: string;
  name_en?: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  requires_location?: boolean;
  minimum_hours?: number;
  has_shipping?: boolean;
}

interface DeliveryType {
  id: string;
  name: string;
  name_en?: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  requires_address?: boolean;
}

const iconOptions = [
  { id: "home", icon: Home, label: "בית" },
  { id: "video", icon: Video, label: "וידאו" },
  { id: "building", icon: Building2, label: "מרפאה" },
  { id: "phone", icon: PhoneCall, label: "טלפון" },
  { id: "clock", icon: Clock, label: "שעון" },
  { id: "package", icon: Package, label: "חבילה" },
  { id: "truck", icon: Truck, label: "משלוח" },
  { id: "mapPin", icon: MapPin, label: "מיקום" },
];

export default function AdminServiceTypesPage() {
  const [activeTab, setActiveTab] = useState<"service" | "delivery">("service");
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [deliveryTypes, setDeliveryTypes] = useState<DeliveryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ServiceType | DeliveryType | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    name_en: "",
    description: "",
    icon: "home",
    is_active: true,
    requires_location: false,
    minimum_hours: 0,
    has_shipping: false,
    requires_address: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stRes, dtRes] = await Promise.all([
        api.get<{ service_types: ServiceType[] }>("/admin/service-types").catch(() => ({ service_types: [] })),
        api.get<{ delivery_types: DeliveryType[] }>("/admin/delivery-types").catch(() => ({ delivery_types: [] })),
      ]);
      setServiceTypes(stRes.service_types || []);
      setDeliveryTypes(dtRes.delivery_types || []);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (item: ServiceType | DeliveryType) => {
    setEditing(item);
    setIsNew(false);
    setForm({
      name: item.name,
      name_en: item.name_en || "",
      description: item.description || "",
      icon: item.icon || "home",
      is_active: item.is_active,
      requires_location: (item as ServiceType).requires_location || false,
      minimum_hours: (item as ServiceType).minimum_hours || 0,
      has_shipping: (item as ServiceType).has_shipping || false,
      requires_address: (item as DeliveryType).requires_address || false,
    });
  };

  const openNew = () => {
    setEditing({} as any);
    setIsNew(true);
    setForm({
      name: "", name_en: "", description: "", icon: "home", is_active: true,
      requires_location: false, minimum_hours: 0, has_shipping: false, requires_address: false,
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("נא למלא שם"); return; }
    setSaving(true);
    const endpoint = activeTab === "service" ? "/admin/service-types" : "/admin/delivery-types";
    try {
      if (isNew) {
        await api.post(endpoint, form);
        toast.success("נוצר בהצלחה");
      } else {
        await api.put(`${endpoint}/${(editing as any).id}`, form);
        toast.success("עודכן בהצלחה");
      }
      setEditing(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.detail || "שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("האם למחוק פריט זה?")) return;
    setDeleting(id);
    const endpoint = activeTab === "service" ? "/admin/service-types" : "/admin/delivery-types";
    try {
      await api.delete(`${endpoint}/${id}`);
      toast.success("נמחק בהצלחה");
      fetchData();
    } catch (err: any) {
      toast.error(err?.detail || "שגיאה במחיקה");
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (item: ServiceType | DeliveryType) => {
    const endpoint = activeTab === "service" ? "/admin/service-types" : "/admin/delivery-types";
    try {
      await api.put(`${endpoint}/${item.id}`, { ...item, is_active: !item.is_active });
      fetchData();
    } catch {
      toast.error("שגיאה בעדכון");
    }
  };

  const items = activeTab === "service" ? serviceTypes : deliveryTypes;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1>ניהול סוגי שירות</h1>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 me-2" />
          הוסף חדש
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("service")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === "service" ? "bg-carefd-teal text-white" : "bg-white text-carefd-gray border border-gray-200"
          }`}
        >
          סוגי שירות ({serviceTypes.length})
        </button>
        <button
          onClick={() => setActiveTab("delivery")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === "delivery" ? "bg-carefd-teal text-white" : "bg-white text-carefd-gray border border-gray-200"
          }`}
        >
          סוגי אספקה ({deliveryTypes.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-carefd-teal" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const iconDef = iconOptions.find((o) => o.id === item.icon);
            const Icon = iconDef?.icon || Home;
            return (
              <Card key={item.id} className={`p-4 ${!item.is_active ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-carefd-teal-pale/30 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-carefd-teal" />
                    </div>
                    <div>
                      <p className="font-semibold text-carefd-navy">{item.name}</p>
                      {item.name_en && <p className="text-xs text-carefd-gray">{item.name_en}</p>}
                    </div>
                  </div>
                  <Badge variant={item.is_active ? "success" : "outline"}>
                    {item.is_active ? "פעיל" : "מושבת"}
                  </Badge>
                </div>
                {item.description && (
                  <p className="text-sm text-carefd-gray mb-3 line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(item)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition text-carefd-gray"
                    title={item.is_active ? "השבת" : "הפעל"}
                  >
                    {item.is_active ? <ToggleRight className="w-5 h-5 text-carefd-teal" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button onClick={() => openEdit(item)} className="p-2 hover:bg-gray-100 rounded-lg transition text-blue-500">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deleting === item.id}
                    className="p-2 hover:bg-gray-100 rounded-lg transition text-red-500"
                  >
                    {deleting === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit/Create Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold text-carefd-navy">
                {isNew ? "הוספת סוג חדש" : "עריכת סוג"}
              </h3>
              <button onClick={() => setEditing(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-carefd-navy mb-2">שם (עברית)</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-carefd-navy mb-2">שם (אנגלית)</label>
                <Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-carefd-navy mb-2">תיאור</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-carefd-teal outline-none text-sm resize-none"
                />
              </div>

              {/* Icon Selection */}
              <div>
                <label className="block text-sm font-medium text-carefd-navy mb-2">אייקון</label>
                <div className="flex flex-wrap gap-2">
                  {iconOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setForm({ ...form, icon: opt.id })}
                      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition text-xs ${
                        form.icon === opt.id ? "bg-carefd-teal text-white" : "bg-gray-100 text-carefd-gray hover:bg-gray-200"
                      }`}
                    >
                      <opt.icon className="w-4 h-4" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 text-carefd-teal rounded"
                  />
                  <span className="text-sm text-carefd-navy">פעיל</span>
                </label>

                {activeTab === "service" && (
                  <>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.requires_location}
                        onChange={(e) => setForm({ ...form, requires_location: e.target.checked })}
                        className="w-4 h-4 text-carefd-teal rounded"
                      />
                      <span className="text-sm text-carefd-navy">דורש מיקום</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.has_shipping}
                        onChange={(e) => setForm({ ...form, has_shipping: e.target.checked })}
                        className="w-4 h-4 text-carefd-teal rounded"
                      />
                      <span className="text-sm text-carefd-navy">כולל משלוח</span>
                    </label>
                    <div>
                      <label className="block text-sm text-carefd-navy mb-1">מינימום שעות</label>
                      <Input
                        type="number"
                        min="0"
                        value={form.minimum_hours}
                        onChange={(e) => setForm({ ...form, minimum_hours: parseInt(e.target.value) || 0 })}
                        className="max-w-[120px]"
                      />
                    </div>
                  </>
                )}

                {activeTab === "delivery" && (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.requires_address}
                      onChange={(e) => setForm({ ...form, requires_address: e.target.checked })}
                      className="w-4 h-4 text-carefd-teal rounded"
                    />
                    <span className="text-sm text-carefd-navy">דורש כתובת</span>
                  </label>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Check className="w-4 h-4 me-2" />}
                  {isNew ? "צור" : "שמור"}
                </Button>
                <Button variant="outline" onClick={() => setEditing(null)}>ביטול</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
