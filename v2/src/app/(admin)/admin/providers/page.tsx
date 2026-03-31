"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api-client";

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    const params: Record<string, string> = { limit: "20" };
    if (search) params.search = search;
    if (filter) params.status = filter;
    api.get<{ providers: any[]; total: number }>("/admin/providers", params)
      .then((d) => { setProviders(d.providers); setTotal(d.total); })
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filter]);

  const handleVerify = async (id: string) => {
    await api.put(`/admin/providers/${id}`, { action: "verify" });
    fetchData();
  };

  const handleReject = async (id: string) => {
    const notes = prompt("סיבת הדחייה:");
    if (notes === null) return;
    await api.put(`/admin/providers/${id}`, { action: "reject", notes });
    fetchData();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">ניהול ספקים ({total})</h1>
      <div className="flex gap-2 mb-4">
        {[{ v: "", l: "הכל" }, { v: "pending", l: "ממתין" }, { v: "verified", l: "מאומת" }, { v: "rejected", l: "נדחה" }].map((f) => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`px-3 py-1.5 rounded-full text-sm ${filter === f.v ? "bg-teal-600 text-white" : "bg-white text-gray-600"}`}>{f.l}</button>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); fetchData(); }} className="flex gap-2 mb-6">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חפש..." className="flex-1 px-4 py-2 border rounded-lg" />
        <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded-lg">חפש</button>
      </form>
      {loading ? <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-200 rounded" />)}</div> : (
        <div className="space-y-3">
          {providers.map((p) => (
            <div key={p.id} className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold">{p.businessName || "ללא שם"}</h3>
                <p className="text-sm text-gray-500">{p.user?.email} • {p.city || ""}</p>
                <p className="text-xs text-gray-400">סטטוס: {p.verificationStatus}</p>
              </div>
              <div className="flex gap-2">
                {p.verificationStatus !== "verified" && (
                  <button onClick={() => handleVerify(p.id)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm">אמת</button>
                )}
                {!["verified","rejected"].includes(p.verificationStatus) && (
                  <button onClick={() => handleReject(p.id)} className="bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-sm">דחה</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
