"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Mail, Lock, LogIn, Eye, EyeOff, AlertCircle, CheckCircle, Send } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api-client";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);

  // Forgot password modal
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailNotVerified(false);
    setLoading(true);
    try {
      await login(email, password);
      // Role-based redirect will happen via useEffect below
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err.message || "שגיאה בהתחברות";
      if (msg.includes("אימייל") || msg.includes("verify") || msg.includes("verification")) {
        setEmailNotVerified(true);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendingVerification(true);
    try {
      await api.post("/auth/resend-verification", { email });
      setError("");
      setEmailNotVerified(false);
      toast.success("נשלח אימייל אימות חדש. בדוק את תיבת הדואר שלך.");
    } catch {
      setError("שגיאה בשליחת אימייל אימות");
    } finally {
      setResendingVerification(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingReset(true);
    try {
      await api.post("/auth/forgot-password", { email: forgotEmail });
      setResetSent(true);
    } catch {
      setError("שגיאה בשליחת קישור לאיפוס סיסמה");
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <>
      <Card className="p-8 md:p-10 shadow-floating border-0">
        <div className="text-center mb-8">
          <h2 className="mb-2">ברוכים השבים</h2>
          <p className="text-slate-500">התחברו לחשבון שלכם</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4 border border-red-100 flex items-start gap-2" data-testid="login-error">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <span>{error}</span>
                {emailNotVerified && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendingVerification}
                    className="block mt-2 text-carefd-teal hover:underline font-medium text-xs"
                  >
                    {resendingVerification ? "שולח..." : "שלח אימייל אימות מחדש"}
                  </button>
                )}
              </div>
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
              <button
                type="button"
                onClick={() => { setShowForgotPassword(true); setForgotEmail(email); setResetSent(false); }}
                className="text-xs text-carefd-teal hover:underline"
              >
                שכחתם סיסמה?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="הזינו סיסמה"
                className="ps-11 pe-11"
                required
                data-testid="login-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute end-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
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

        <div className="mt-6 space-y-3 text-center text-sm">
          <p className="text-slate-500">
            אין לכם חשבון?{" "}
            <Link href="/register" className="text-carefd-navy font-semibold hover:underline">
              הרשמו עכשיו
            </Link>
          </p>
          <p className="text-slate-500">
            ספק שירות?{" "}
            <Link href="/register?role=provider" className="text-carefd-teal font-semibold hover:underline">
              הרשמו כספק
            </Link>
          </p>
        </div>
      </Card>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowForgotPassword(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {resetSent ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-carefd-navy mb-2">נשלח בהצלחה!</h3>
                <p className="text-carefd-gray mb-6">
                  קישור לאיפוס הסיסמה נשלח ל-<br />
                  <span className="font-medium text-carefd-navy" dir="ltr">{forgotEmail}</span>
                </p>
                <Button onClick={() => setShowForgotPassword(false)} className="w-full">
                  סגור
                </Button>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-carefd-teal-pale/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-7 h-7 text-carefd-teal" />
                </div>
                <h3 className="text-xl font-bold text-carefd-navy mb-2 text-center">שכחתם סיסמה?</h3>
                <p className="text-carefd-gray text-sm mb-6 text-center">
                  הזינו את כתובת האימייל שלכם ונשלח לכם קישור לאיפוס הסיסמה
                </p>
                <form onSubmit={handleForgotPassword}>
                  <div className="relative mb-4">
                    <Mail className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="ps-11"
                      dir="ltr"
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" className="flex-1" disabled={sendingReset}>
                      {sendingReset ? "שולח..." : "שלח קישור"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForgotPassword(false)}
                      className="flex-1"
                    >
                      ביטול
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
