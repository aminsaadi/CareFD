"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, UserX, UserCheck, Trash2, ChevronDown, Shield, User, Stethoscope } from "lucide-react";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success("התפקיד עודכן בהצלחה");
      fetchUsers();
    } catch { toast.error("שגיאה בעדכון תפקיד"); }
    finally { setActionLoading(null); }
  };

  const handleSuspend = async (userId: string, isSuspended: boolean) => {
    setActionLoading(userId);
    try {
      await api.put(`/admin/users/${userId}/suspend`, { suspended: !isSuspended });
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

  return (
    <div>
      <h2 className="font-heading font-semibold text-2xl mb-6">ניהול משתמשים ({total})</h2>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={(e) => { e.preventDefault(); fetchUsers(); }} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חפש לפי שם או אימייל..." className="ps-10 h-10" />
          </div>
          <Button type="submit" size="sm">חפש</Button>
        </form>
        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); fetchUsers(search, e.target.value); }}
            className="appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2 pe-10 text-sm font-medium text-carefd-navy cursor-pointer hover:border-carefd-teal transition focus:outline-none focus:ring-2 focus:ring-carefd-teal/30"
          >
            <option value="">כל התפקידים</option>
            <option value="patient">משתמשים</option>
            <option value="provider">ספקים</option>
            <option value="admin">מנהלים</option>
          </select>
          <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : users.length === 0 ? (
        <Card className="p-12 text-center">
          <User className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-400">לא נמצאו משתמשים</p>
        </Card>
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
                  <th className="p-3 text-start font-medium">הצטרף</th>
                  <th className="p-3 text-start font-medium">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id || u.user_id} className="border-b border-slate-50 hover:bg-carefd-stone/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-carefd-teal to-carefd-navy flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {(u.name || "M")[0]}
                        </div>
                        <span className="font-medium text-carefd-navy">{u.name || "ללא שם"}</span>
                      </div>
                    </td>
                    <td className="p-3 text-slate-500" dir="ltr">{u.email}</td>
                    <td className="p-3">{getRoleBadge(u.role)}</td>
                    <td className="p-3">
                      {u.isSuspended || u.is_suspended ? (
                        <Badge variant="destructive">מושעה</Badge>
                      ) : u.email_verified === false ? (
                        <Badge variant="warning">לא מאומת</Badge>
                      ) : (
                        <Badge variant="success">פעיל</Badge>
                      )}
                    </td>
                    <td className="p-3 text-slate-400 whitespace-nowrap">
                      {u.createdAt || u.created_at ? new Date(u.createdAt || u.created_at).toLocaleDateString("he-IL") : "-"}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {/* Role change */}
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id || u.user_id, e.target.value)}
                          disabled={actionLoading === (u.id || u.user_id)}
                          className="text-xs border border-slate-200 rounded px-2 py-1 bg-white cursor-pointer hover:border-carefd-teal focus:outline-none"
                        >
                          <option value="patient">משתמש</option>
                          <option value="provider">ספק</option>
                          <option value="admin">מנהל</option>
                        </select>
                        {/* Suspend/Activate */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className={u.isSuspended || u.is_suspended ? "text-green-600 hover:text-green-700" : "text-amber-600 hover:text-amber-700"}
                          onClick={() => handleSuspend(u.id || u.user_id, u.isSuspended || u.is_suspended)}
                          disabled={actionLoading === (u.id || u.user_id)}
                          title={u.isSuspended || u.is_suspended ? "הפעל" : "השעה"}
                        >
                          {u.isSuspended || u.is_suspended ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                        </Button>
                        {/* Delete */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleDelete(u.id || u.user_id, u.name)}
                          disabled={actionLoading === (u.id || u.user_id)}
                          title="מחק"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
