"use client";

import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Mail, CheckCircle, ArrowRight } from "lucide-react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { email });
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) return (
    <Card className="p-8 md:p-10 shadow-floating border-0 text-center">
      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-8 h-8 text-emerald-500" />
      </div>
      <h2 className="mb-2">הקישור נשלח</h2>
      <p className="text-slate-500 mb-6">
        אם הכתובת רשומה במערכת, נשלח אליה קישור לאיפוס סיסמה.
      </p>
      <Button variant="secondary" asChild>
        <Link href="/login">
          <ArrowRight className="w-4 h-4 me-2" />
          חזרה להתחברות
        </Link>
      </Button>
    </Card>
  );

  return (
    <Card className="p-8 md:p-10 shadow-floating border-0">
      <div className="text-center mb-8">
        <h2 className="mb-2">איפוס סיסמה</h2>
        <p className="text-slate-500">הזינו את כתובת האימייל ונשלח לכם קישור לאיפוס</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4 border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">אימייל</label>
          <div className="relative">
            <Mail className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="ps-11"
              dir="ltr"
              required
              data-testid="reset-email"
            />
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={loading} data-testid="reset-submit">
          {loading ? (
            <span className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
          ) : (
            "שלח קישור איפוס"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        <Link href="/login" className="text-primary font-semibold hover:underline">
          חזרה להתחברות
        </Link>
      </p>
    </Card>
  );
}
