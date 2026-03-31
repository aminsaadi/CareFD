"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetch = (s = search) => {
    setLoading(true);
    const params: Record<string, string> = { limit: "20" };
    if (s) params.search = s;
    api.get<{ users: any[]; total: number }>("/admin/users", params).then((d) => { setUsers(d.users); setTotal(d.total); }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ניהול משתמשים ({total})</h1>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); fetch(); }} className="flex gap-2 mb-6">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חפש לפי שם או אימייל..." className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-teal-500" />
        <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded-lg">חפש</button>
      </form>
      {loading ? <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-200 rounded" />)}</div> : (
        <table className="w-full bg-white rounded-xl shadow-sm">
          <thead><tr className="border-b text-sm text-gray-500"><th className="p-3 text-right">שם</th><th className="p-3 text-right">אימייל</th><th className="p-3 text-right">תפקיד</th><th className="p-3 text-right">סטטוס</th><th className="p-3 text-right">תאריך</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3 text-sm">{u.email}</td>
                <td className="p-3"><span className="px-2 py-1 rounded-full text-xs bg-gray-100">{u.role}</span></td>
                <td className="p-3">{u.isSuspended ? <span className="text-red-600 text-xs">מושעה</span> : <span className="text-green-600 text-xs">פעיל</span>}</td>
                <td className="p-3 text-sm text-gray-400">{new Date(u.createdAt).toLocaleDateString("he-IL")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
