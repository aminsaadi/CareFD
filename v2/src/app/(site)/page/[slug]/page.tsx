"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api-client";

export default function GenericPage() {
  const { slug } = useParams();
  const [page, setPage] = useState<{ title: string; content: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    // Try to fetch from API
    api.get<any>(`/admin/content/pages`).then((d: any) => {
      const found = d.pages?.find((p: any) => p.slug === slug);
      if (found) setPage(found);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full" /></div>;
  if (!page) return <div className="text-center py-20 text-gray-500">הדף לא נמצא</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-16" dir="rtl">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">{page.title}</h1>
      <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
    </div>
  );
}
