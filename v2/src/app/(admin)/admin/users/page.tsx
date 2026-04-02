"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUsers = (s = search) => {
    setLoading(true);
    const params: Record<string, string> = { limit: "20" };
    if (s) params.search = s;
    api.get<{ users: any[]; total: number }>("/admin/users", params).then((d) => { setUsers(d.users); setTotal(d.total); }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  return (
    <div>
      <h2 className="font-heading font-semibold text-2xl mb-6">ניהול משתמשים ({total})</h2>

      <form onSubmit={(e) => { e.preventDefault(); fetchUsers(); }} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חפש לפי שם או אימייל..." className="ps-10 h-10" />
        </div>
        <Button type="submit" size="sm">חפש</Button>
      </form>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : (
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 text-slate-500 bg-carefd-stone/50"><th className="p-3 text-start font-medium">שם</th><th className="p-3 text-start font-medium">אימייל</th><th className="p-3 text-start font-medium">תפקיד</th><th className="p-3 text-start font-medium">סטטוס</th><th className="p-3 text-start font-medium">תאריך</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-carefd-stone/30 transition-colors">
                  <td className="p-3 font-medium text-carefd-navy">{u.name}</td>
                  <td className="p-3 text-slate-500" dir="ltr">{u.email}</td>
                  <td className="p-3"><Badge variant="outline">{u.role}</Badge></td>
                  <td className="p-3">{u.isSuspended ? <Badge variant="destructive">מושעה</Badge> : <Badge variant="success">פעיל</Badge>}</td>
                  <td className="p-3 text-slate-400">{new Date(u.createdAt).toLocaleDateString("he-IL")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
