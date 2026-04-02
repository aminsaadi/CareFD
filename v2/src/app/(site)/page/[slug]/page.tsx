"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import DOMPurify from "dompurify";
import api from "@/lib/api-client";

interface PageData {
  title: string;
  content: string;
}

export default function GenericPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        const data = await api.get<PageData>(`/pages/${slug}`);
        setPage(data);
      } catch {
        setPage(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : page ? (
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">{page.title}</h1>
            <div
              className="prose prose-lg max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(page.content) }}
            />
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">הדף לא נמצא</p>
          </div>
        )}
      </main>
    </div>
  );
}
