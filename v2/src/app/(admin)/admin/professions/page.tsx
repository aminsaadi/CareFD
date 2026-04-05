"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  GraduationCap, Plus, Trash2, Pencil, ChevronDown, ChevronLeft,
  Search, Layers, Tag, Loader2,
} from "lucide-react";
import { toast } from "sonner";

/* ---------- types ---------- */
interface Category { category_id: string; name: string; name_en?: string }
interface SubProfession {
  sub_profession_id: string; name: string; name_en?: string;
  categories?: Category[];
}
interface Profession {
  profession_id: string; name: string; name_en?: string;
  specializations?: string[]; sub_professions?: SubProfession[];
}

type ModalMode =
  | { kind: "add-profession" }
  | { kind: "add-sub"; profId: string }
  | { kind: "add-category"; subId: string }
  | { kind: "edit-profession"; id: string }
  | { kind: "edit-sub"; id: string }
  | { kind: "edit-category"; id: string };

/* ================================================================ */
export default function AdminProfessionsPage() {
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedProf, setExpandedProf] = useState<string | null>(null);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  // modal state
  const [modal, setModal] = useState<ModalMode | null>(null);
  const [formName, setFormName] = useState("");
  const [formNameEn, setFormNameEn] = useState("");
  const [formSpecs, setFormSpecs] = useState("");
  const [saving, setSaving] = useState(false);

  // confirm-delete state
  const [deleting, setDeleting] = useState<{ type: string; id: string; label: string } | null>(null);

  /* ---------- fetch ---------- */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const d = await api.get<{ professions: Profession[] }>("/admin/professions");
      setProfessions(d.professions ?? []);
    } catch {
      toast.error("שגיאה בטעינת המקצועות");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ---------- filtered ---------- */
  const filtered = professions.filter(
    (p) =>
      p.name?.includes(search) ||
      p.name_en?.toLowerCase().includes(search.toLowerCase()),
  );

  /* ---------- open modal helpers ---------- */
  const openAdd = (mode: ModalMode) => {
    setFormName(""); setFormNameEn(""); setFormSpecs("");
    setModal(mode);
  };

  const openEdit = (mode: ModalMode, item: { name: string; name_en?: string; specializations?: string[] }) => {
    setFormName(item.name ?? "");
    setFormNameEn(item.name_en ?? "");
    setFormSpecs((item.specializations ?? []).join(", "));
    setModal(mode);
  };

  /* ---------- save (add / edit) ---------- */
  const handleSave = async () => {
    if (!modal || !formName.trim()) { toast.error("נא להזין שם"); return; }
    setSaving(true);
    try {
      const specs = formSpecs.split(",").map((s) => s.trim()).filter(Boolean);
      switch (modal.kind) {
        case "add-profession":
          await api.post("/admin/professions", { name: formName, name_en: formNameEn, specializations: specs });
          toast.success("המקצוע נוסף בהצלחה"); break;
        case "add-sub":
          await api.post(`/admin/professions/${modal.profId}/sub-professions`, { name: formName, name_en: formNameEn });
          toast.success("תת-מקצוע נוסף בהצלחה"); break;
        case "add-category":
          await api.post(`/admin/sub-professions/${modal.subId}/categories`, { name: formName, name_en: formNameEn });
          toast.success("קטגוריה נוספה בהצלחה"); break;
        case "edit-profession":
          await api.put(`/admin/professions/${modal.id}`, { name: formName, name_en: formNameEn, specializations: specs });
          toast.success("המקצוע עודכן בהצלחה"); break;
        case "edit-sub":
          await api.put(`/admin/sub-professions/${modal.id}`, { name: formName, name_en: formNameEn });
          toast.success("תת-מקצוע עודכן בהצלחה"); break;
        case "edit-category":
          await api.put(`/admin/categories/${modal.id}`, { name: formName, name_en: formNameEn });
          toast.success("קטגוריה עודכנה בהצלחה"); break;
      }
      setModal(null);
      fetchData();
    } catch { toast.error("שגיאה בשמירה"); }
    finally { setSaving(false); }
  };

  /* ---------- delete ---------- */
  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await api.delete(`/admin/${deleting.type}/${deleting.id}`);
      toast.success("נמחק בהצלחה");
      fetchData();
    } catch { toast.error("שגיאה במחיקה"); }
    finally { setDeleting(null); }
  };

  /* ---------- modal title ---------- */
  const modalTitle = modal
    ? { "add-profession": "הוסף מקצוע חדש", "add-sub": "הוסף תת-מקצוע", "add-category": "הוסף קטגוריה",
        "edit-profession": "עריכת מקצוע", "edit-sub": "עריכת תת-מקצוע", "edit-category": "עריכת קטגוריה",
      }[modal.kind]
    : "";
  const showSpecs = modal?.kind === "add-profession" || modal?.kind === "edit-profession";

  /* ================================================================ */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-semibold text-2xl text-carefd-navy">מקצועות וקטגוריות</h2>
          <p className="text-sm text-slate-500 mt-1">ניהול מקצועות, תת-מקצועות וקטגוריות שירות</p>
        </div>
        <Button onClick={() => openAdd({ kind: "add-profession" })} data-testid="add-profession-btn">
          <Plus className="w-4 h-4 me-1" /> הוסף מקצוע
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="חפש מקצוע..." className="ps-10 h-10"
            data-testid="search-profession-input"
          />
        </div>
      </Card>

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <GraduationCap className="mx-auto w-12 h-12 text-slate-300 mb-3" />
          <p className="text-slate-500">לא נמצאו מקצועות</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((prof) => (
            <Card key={prof.profession_id} className="overflow-hidden" data-testid={`profession-${prof.profession_id}`}>
              {/* Profession row */}
              <div className="p-4 flex items-center justify-between hover:bg-slate-50/40 transition cursor-pointer"
                onClick={() => setExpandedProf(expandedProf === prof.profession_id ? null : prof.profession_id)}>
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-carefd-teal/10 rounded-xl flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-carefd-teal" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-carefd-navy">{prof.name}</h3>
                    <p className="text-xs text-slate-400">
                      {prof.name_en}{prof.sub_professions?.length ? ` \u00b7 ${prof.sub_professions.length} תת-מקצועות` : ""}
                      {prof.specializations?.length ? ` \u00b7 ${prof.specializations.length} התמחויות` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-carefd-teal"
                    onClick={(e) => { e.stopPropagation(); openEdit({ kind: "edit-profession", id: prof.profession_id }, prof); }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500"
                    onClick={(e) => { e.stopPropagation(); setDeleting({ type: "professions", id: prof.profession_id, label: prof.name }); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  {expandedProf === prof.profession_id
                    ? <ChevronDown className="w-4 h-4 text-slate-400" />
                    : <ChevronLeft className="w-4 h-4 text-slate-400" />}
                </div>
              </div>

              {/* Expanded: specializations + sub-professions */}
              {expandedProf === prof.profession_id && (
                <div className="border-t border-slate-100 bg-carefd-teal-pale/20 p-4 space-y-4">
                  {/* Specializations */}
                  {(prof.specializations?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-2">התמחויות</p>
                      <div className="flex flex-wrap gap-2">
                        {prof.specializations!.map((s, i) => (
                          <Badge key={i} variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sub-professions */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-slate-500">תת-מקצועות</p>
                      <Button variant="ghost" size="sm" className="text-carefd-teal h-7 text-xs"
                        onClick={() => openAdd({ kind: "add-sub", profId: prof.profession_id })}>
                        <Plus className="w-3 h-3 me-1" /> הוסף
                      </Button>
                    </div>

                    {(prof.sub_professions?.length ?? 0) === 0 ? (
                      <p className="text-xs text-slate-400 ps-2">אין תת-מקצועות</p>
                    ) : (
                      <div className="space-y-2">
                        {prof.sub_professions!.map((sub) => (
                          <div key={sub.sub_profession_id} className="bg-white rounded-lg border border-slate-100 overflow-hidden">
                            {/* Sub row */}
                            <div className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50/40 transition"
                              onClick={() => setExpandedSub(expandedSub === sub.sub_profession_id ? null : sub.sub_profession_id)}>
                              <div className="flex items-center gap-2">
                                <Tag className="w-4 h-4 text-purple-500" />
                                <span className="text-sm font-medium text-carefd-navy">{sub.name}</span>
                                {sub.name_en && <span className="text-xs text-slate-400">({sub.name_en})</span>}
                                <Badge variant="outline" className="text-[10px] h-5">{sub.categories?.length ?? 0} קטגוריות</Badge>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-purple-500"
                                  onClick={(e) => { e.stopPropagation(); openEdit({ kind: "edit-sub", id: sub.sub_profession_id }, sub); }}>
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500"
                                  onClick={(e) => { e.stopPropagation(); setDeleting({ type: "sub-professions", id: sub.sub_profession_id, label: sub.name }); }}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                                {expandedSub === sub.sub_profession_id
                                  ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                  : <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />}
                              </div>
                            </div>

                            {/* Categories */}
                            {expandedSub === sub.sub_profession_id && (
                              <div className="border-t border-slate-100 px-6 py-3 bg-slate-50/50 space-y-2">
                                {(sub.categories?.length ?? 0) === 0 ? (
                                  <p className="text-xs text-slate-400">אין קטגוריות</p>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {sub.categories!.map((cat) => (
                                      <div key={cat.category_id}
                                        className="group inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg text-xs">
                                        <Layers className="w-3 h-3" />
                                        {cat.name}
                                        {cat.name_en && <span className="text-emerald-400">({cat.name_en})</span>}
                                        <button className="opacity-0 group-hover:opacity-100 text-emerald-400 hover:text-red-500 transition"
                                          onClick={() => setDeleting({ type: "categories", id: cat.category_id, label: cat.name })}>
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <Button variant="ghost" size="sm" className="text-emerald-600 h-7 text-xs"
                                  onClick={() => openAdd({ kind: "add-category", subId: sub.sub_profession_id })}>
                                  <Plus className="w-3 h-3 me-1" /> הוסף קטגוריה
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* ---- Add / Edit modal ---- */}
      <Dialog open={!!modal} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
            <DialogDescription>הזן את הפרטים ולחץ שמור</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm text-slate-600 mb-1 block">שם בעברית *</label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="הזן שם..." data-testid="modal-name" />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">שם באנגלית</label>
              <Input value={formNameEn} onChange={(e) => setFormNameEn(e.target.value)} placeholder="Enter name..." dir="ltr" data-testid="modal-name-en" />
            </div>
            {showSpecs && (
              <div>
                <label className="text-sm text-slate-600 mb-1 block">התמחויות (מופרדות בפסיקים)</label>
                <Input value={formSpecs} onChange={(e) => setFormSpecs(e.target.value)} placeholder="התמחות 1, התמחות 2..." data-testid="modal-specs" />
                <p className="text-[11px] text-slate-400 mt-1">יוצגו כאופציות בפרופיל הספק</p>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setModal(null)}>ביטול</Button>
            <Button className="flex-1" disabled={!formName.trim() || saving} onClick={handleSave} data-testid="modal-save">
              {saving && <Loader2 className="w-4 h-4 me-1 animate-spin" />}
              {modal?.kind.startsWith("edit") ? "שמור" : "הוסף"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ---- Delete confirmation dialog ---- */}
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>אישור מחיקה</DialogTitle>
            <DialogDescription>האם למחוק את &quot;{deleting?.label}&quot;? פעולה זו אינה ניתנת לביטול.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setDeleting(null)}>ביטול</Button>
            <Button variant="destructive" className="flex-1" onClick={confirmDelete}>מחק</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
