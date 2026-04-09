"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, UserX, UserCheck, Trash2, ChevronDown, Shield, User,
  Stethoscope, Eye, X, Mail, Phone, MapPin, Calendar, Hash,
  CheckCircle, Clock, XCircle, Edit,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const fetchUsers = (s = search, role = roleFilter) => {
    setLoading(true);
    const params: Record<string, string> = { limit: "50" };
    if (s) params.search = s;
    if (role) params.role = role;
    api.get<{ users: any[]; total: number }>("/admin/users", params)
      .then((d) => { setUsers(d.users || []); setTotal(d.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    try {
      await api.put(`/admin/users/${userId}`, { role: newRole });
      toast.success("התפקיד עודכן בהצלחה");
      fetchUsers();
    } catch { toast.error("שגיאה בעדכון תפקיד"); }
    finally { setActionLoading(null); }
  };

  const handleSuspend = async (userId: string, isSuspended: boolean) => {
    setActionLoading(userId);
    try {
      await api.put(`/admin/users/${userId}`, { is_suspended: !isSuspended });
      toast.success(isSuspended ? "המשתמש הופעל" : "המשתמש הושעה");
      fetchUsers();
    } catch { toast.error("שגיאה בעדכון סטטוס"); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`האם למחוק את המשתמש "${userName}"? פעולה זו לא ניתנת לביטול.`)) return;
    setActionLoading(userId);
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success("המשתמש נמחק");
      fetchUsers();
    } catch { toast.error("שגיאה במחיקת המשתמש"); }
    finally { setActionLoading(null); }
  };

  const getRoleIcon = (role: string) => {
    if (role === "admin") return <Shield className="w-3.5 h-3.5" />;
    if (role === "provider") return <Stethoscope className="w-3.5 h-3.5" />;
    return <User className="w-3.5 h-3.5" />;
  };

  const getRoleBadge = (role: string) => {
    const map: Record<string, { label: string; variant: "destructive" | "accent" | "outline" }> = {
      admin: { label: "מנהל", variant: "destructive" },
      provider: { label: "ספק", variant: "accent" },
      patient: { label: "משתמש", variant: "outline" },
    };
    const r = map[role] || { label: role, variant: "outline" as const };
    return <Badge variant={r.variant} className="gap-1">{getRoleIcon(role)} {r.label}</Badge>;
  };

  const getVerificationBadge = (u: any) => {
    if (u.is_verified || u.verification_status === "verified") return <Badge variant="success" className="gap-1"><CheckCircle className="w-3 h-3" />מאומת</Badge>;
    if (u.verification_status === "documents_submitted") return <Badge variant="warning" className="gap-1"><Clock className="w-3 h-3" />בתהליך</Badge>;
    return <Badge variant="outline" className="gap-1 text-slate-400"><XCircle className="w-3 h-3" />לא מאומת</Badge>;
  };

  const stats = {
    total: users.length,
    patients: users.filter((u) => u.role === "patient").length,
    providers: users.filter((u) => u.role === "provider").length,
    admins: users.filter((u) => u.role === "admin").length,
    suspended: users.filter((u) => u.is_suspended || u.isSuspended).length,
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-heading font-semibold text-2xl">ניהול משתמשים ({total})</h2>
          <p className="text-sm text-slate-400 mt-1">
            {stats.patients} משתמשים • {stats.providers} ספקים • {stats.admins} מנהלים
            {stats.suspended > 0 && <span className="text-red-400"> • {stats.suspended} מושעים</span>}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={(e) => { e.preventDefault(); fetchUsers(); }} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חפש לפי שם, אימייל או טלפון..." className="ps-10 h-10" />
          </div>
          <Button type="submit" size="sm">חפש</Button>
        </form>
        <div className="flex gap-2">
          {[{ v: "", l: "הכל" }, { v: "patient", l: "משתמשים" }, { v: "provider", l: "ספקים" }, { v: "admin", l: "מנהלים" }].map((f) => (
            <button key={f.v} onClick={() => { setRoleFilter(f.v); fetchUsers(search, f.v); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${roleFilter === f.v ? "bg-carefd-teal text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
          <Card className="w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-bold text-carefd-navy">פרטי משתמש</h3>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-carefd-teal to-carefd-navy flex items-center justify-center text-white text-2xl font-bold">
                {(selectedUser.name || "M")[0]}
              </div>
              <div>
                <h4 className="text-xl font-bold text-carefd-navy">{selectedUser.name || "ללא שם"}</h4>
                <p className="text-sm text-slate-400" dir="ltr">{selectedUser.email}</p>
                {selectedUser.user_number && <p className="text-xs text-carefd-teal font-mono mt-1">#{selectedUser.user_number}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-50 rounded-xl p-3"><p className="text-xs text-slate-400">תפקיד</p><div className="mt-1">{getRoleBadge(selectedUser.role)}</div></div>
              <div className="bg-slate-50 rounded-xl p-3"><p className="text-xs text-slate-400">סטטוס</p><div className="mt-1">{selectedUser.is_suspended || selectedUser.isSuspended ? <Badge variant="destructive">מושעה</Badge> : <Badge variant="success">פעיל</Badge>}</div></div>
              <div className="bg-slate-50 rounded-xl p-3"><p className="text-xs text-slate-400">אימות</p><div className="mt-1">{getVerificationBadge(selectedUser)}</div></div>
              <div className="bg-slate-50 rounded-xl p-3"><p className="text-xs text-slate-400">הצטרף</p><p className="text-sm font-medium mt-1">{selectedUser.createdAt || selectedUser.created_at ? new Date(selectedUser.createdAt || selectedUser.created_at).toLocaleDateString("he-IL") : "-"}</p></div>
            </div>
            <div className="space-y-2 mb-6">
              {(selectedUser.phone || selectedUser.personal_phone) && <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-slate-400" /><span dir="ltr">{selectedUser.phone || selectedUser.personal_phone}</span></div>}
              {(selectedUser.city || selectedUser.address) && <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-slate-400" /><span>{[selectedUser.city, selectedUser.address].filter(Boolean).join(", ")}</span></div>}
            </div>
            <div className="flex gap-2">
              {selectedUser.role === "provider" && selectedUser.provider_id && (
                <Button size="sm" variant="outline" asChild><Link href={`/admin/provider-edit/${selectedUser.provider_id}`}><Edit className="w-4 h-4 me-1" />ערוך ספק</Link></Button>
              )}
              <Button size="sm" variant={selectedUser.is_suspended ? "default" : "destructive"} onClick={() => { handleSuspend(selectedUser.id || selectedUser.user_id, selectedUser.is_suspended || selectedUser.isSuspended); setSelectedUser(null); }}>
                {selectedUser.is_suspended || selectedUser.isSuspended ? <><UserCheck className="w-4 h-4 me-1" />הפעל</> : <><UserX className="w-4 h-4 me-1" />השעה</>}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : users.length === 0 ? (
        <Card className="p-12 text-center"><User className="w-12 h-12 mx-auto mb-3 text-slate-300" /><p className="text-slate-400">לא נמצאו משתמשים</p></Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 bg-carefd-stone/50">
                  <th className="p-3 text-start font-medium">משתמש</th>
                  <th className="p-3 text-start font-medium">אימייל</th>
                  <th className="p-3 text-start font-medium">תפקיד</th>
                  <th className="p-3 text-start font-medium">סטטוס</th>
                  <th className="p-3 text-start font-medium">אימות</th>
                  <th className="p-3 text-start font-medium">הצטרף</th>
                  <th className="p-3 text-start font-medium">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const uid = u.id || u.user_id;
                  return (
                    <tr key={uid} className="border-b border-slate-50 hover:bg-carefd-stone/30 transition-colors cursor-pointer" onClick={() => setSelectedUser(u)}>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-carefd-teal to-carefd-navy flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {(u.name || "M")[0]}
                          </div>
                          <div>
                            <span className="font-medium text-carefd-navy block">{u.name || "ללא שם"}</span>
                            {u.user_number && <span className="text-[10px] text-carefd-teal font-mono">#{u.user_number}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-slate-500" dir="ltr">{u.email}</td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <select value={u.role} onChange={(e) => handleRoleChange(uid, e.target.value)} disabled={actionLoading === uid}
                          className="text-xs border-2 border-carefd-teal-pale/50 rounded-lg px-2 py-1 bg-white cursor-pointer hover:border-carefd-teal focus:border-carefd-teal focus:outline-none transition-all">
                          <option value="patient">משתמש</option><option value="provider">ספק</option><option value="admin">מנהל</option>
                        </select>
                      </td>
                      <td className="p-3">
                        {u.isSuspended || u.is_suspended ? <Badge variant="destructive">מושעה</Badge> : <Badge variant="success">פעיל</Badge>}
                      </td>
                      <td className="p-3">{getVerificationBadge(u)}</td>
                      <td className="p-3 text-slate-400 whitespace-nowrap text-xs">
                        {u.createdAt || u.created_at ? new Date(u.createdAt || u.created_at).toLocaleDateString("he-IL") : "-"}
                      </td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setSelectedUser(u)} title="פרטים"><Eye className="w-4 h-4 text-carefd-teal" /></Button>
                          <Button size="sm" variant="ghost"
                            className={u.isSuspended || u.is_suspended ? "text-green-600" : "text-amber-600"}
                            onClick={() => handleSuspend(uid, u.isSuspended || u.is_suspended)}
                            disabled={actionLoading === uid}
                            title={u.isSuspended || u.is_suspended ? "הפעל" : "השעה"}>
                            {u.isSuspended || u.is_suspended ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(uid, u.name)} disabled={actionLoading === uid} title="מחק">
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
