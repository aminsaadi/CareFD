"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api-client";

export default function VerifyEmailPage() {
  return <Suspense><VerifyEmailContent /></Suspense>;
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setMessage("טוקן חסר"); return; }
    api.get<{ message: string }>("/auth/verify-email", { token })
      .then((d) => { setStatus("success"); setMessage(d.message); })
      .catch((e) => { setStatus("error"); setMessage(e.message); });
  }, [token]);

  return (
    <div className="w-full max-w-md text-center" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {status === "loading" && <div className="animate-spin h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full mx-auto" />}
        {status === "success" && (
          <>
            <h1 className="text-2xl font-bold text-teal-600 mb-4">✓ האימייל אומת!</h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <Link href="/login" className="bg-teal-600 text-white px-6 py-2 rounded-xl hover:bg-teal-700 inline-block">התחברות</Link>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="text-2xl font-bold text-red-600 mb-4">שגיאה</h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <Link href="/login" className="text-teal-600 hover:underline">חזרה להתחברות</Link>
          </>
        )}
      </div>
    </div>
  );
}
