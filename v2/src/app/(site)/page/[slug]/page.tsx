"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DOMPurify from "dompurify";
import api from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

interface PageData {
  title: string;
  content: string;
  slug: string;
}

export default function GenericPage() {
  const { slug } = useParams();
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api.get<{ pages: PageData[] }>("/admin/content/pages").then((d) => {
      const found = d.pages?.find((p) => p.slug === slug);
      if (found) setPage({ ...found, content: DOMPurify.sanitize(found.content) });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="container-main py-20">
      <Skeleton className="h-10 w-64 mb-8" />
      <Skeleton className="h-4 w-full mb-3" />
      <Skeleton className="h-4 w-3/4 mb-3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );

  if (!page) return <div className="text-center py-20 text-slate-400">הדף לא נמצא</div>;

  return (
    <div className="container-main py-16 max-w-4xl">
      <h1 className="mb-8">{page.title}</h1>
      <div className="prose prose-lg max-w-none text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: page.content }} />
    </div>
  );
}
