"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";

const PAGE_NAME = "PLACEHOLDER";

export default function AdminPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Each admin page will fetch its own data
    setLoading(false);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">ניהול {PAGE_NAME}</h1>
      {loading ? (
        <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-200 rounded" />)}</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-500">עמוד ניהול {PAGE_NAME} – בבנייה</p>
        </div>
      )}
    </div>
  );
}
