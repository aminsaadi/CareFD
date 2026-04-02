"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Mail, Lock, LogIn } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "שגיאה בהתחברות");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-8 md:p-10 shadow-floating border-0">
      <div className="text-center mb-8">
        <h2 className="mb-2">ברוכים השבים</h2>
        <p className="text-slate-500">התחברו לחשבון שלכם</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4 border border-red-100" data-testid="login-error">
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
              data-testid="login-email"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-700">סיסמה</label>
            <Link href="/reset-password" className="text-xs text-carefd-teal hover:underline">
              שכחתם סיסמה?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="הזינו סיסמה"
              className="ps-11"
              required
              data-testid="login-password"
            />
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={loading} data-testid="login-submit">
          {loading ? (
            <span className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
          ) : (
            <>
              <LogIn className="w-4 h-4 me-2" />
              התחברות
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        אין לכם חשבון?{" "}
        <Link href="/register" className="text-carefd-navy font-semibold hover:underline">
          הרשמו עכשיו
        </Link>
      </p>
    </Card>
  );
}
