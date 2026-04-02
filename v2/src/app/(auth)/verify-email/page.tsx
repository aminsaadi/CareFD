"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

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
    <Card className="p-8 md:p-10 shadow-floating border-0 text-center">
      {status === "loading" && (
        <div className="py-8">
          <span className="animate-spin inline-block rounded-full h-10 w-10 border-4 border-primary/20 border-t-primary" />
          <p className="text-slate-500 mt-4">מאמת את כתובת האימייל...</p>
        </div>
      )}
      {status === "success" && (
        <div className="py-4">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="mb-2">האימייל אומת בהצלחה</h2>
          <p className="text-slate-500 mb-6">{message}</p>
          <Button asChild>
            <Link href="/login">המשיכו להתחברות</Link>
          </Button>
        </div>
      )}
      {status === "error" && (
        <div className="py-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="mb-2">שגיאה באימות</h2>
          <p className="text-slate-500 mb-6">{message}</p>
          <Button variant="secondary" asChild>
            <Link href="/login">חזרה להתחברות</Link>
          </Button>
        </div>
      )}
    </Card>
  );
}
