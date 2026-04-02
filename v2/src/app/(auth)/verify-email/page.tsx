"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FaCheckCircle, FaTimesCircle, FaSpinner } from "react-icons/fa";
import api from "@/lib/api-client";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-carefd-teal-pale to-white flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <FaSpinner className="text-5xl text-carefd-teal mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-bold text-carefd-navy mb-2">מאמת את כתובת הדואר...</h2>
            <p className="text-carefd-gray">אנא המתן רגע</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

type VerifyStatus = "loading" | "success" | "expired" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<VerifyStatus>("loading");
  const [email, setEmail] = useState("");
  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setStatus("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const verifyEmail = async () => {
    try {
      const res = await api.get<{ email?: string }>(`/auth/verify-email`, { token: token! });
      setEmail(res.email || "");
      setStatus("success");
    } catch (err: unknown) {
      const detail = (err as any)?.data?.detail;
      if (detail === "token_expired") {
        setStatus("expired");
      } else {
        setStatus("error");
      }
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-carefd-teal-pale to-white flex items-center justify-center p-4"
      dir="rtl"
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        data-testid="verify-email-page"
      >
        {status === "loading" && (
          <div>
            <FaSpinner className="text-5xl text-carefd-teal mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-bold text-carefd-navy mb-2">מאמת את כתובת הדואר...</h2>
            <p className="text-carefd-gray">אנא המתן רגע</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaCheckCircle className="text-4xl text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-carefd-navy mb-3">המייל אומת בהצלחה!</h2>
            <p className="text-carefd-gray mb-6">
              כתובת הדואר{" "}
              {email && <strong className="text-carefd-navy">{email}</strong>} אומתה. כעת תוכל
              להתחבר לחשבונך.
            </p>
            <Link
              href="/login"
              className="inline-block bg-carefd-teal text-white px-8 py-3 rounded-xl font-bold hover:bg-carefd-teal/90 transition text-lg"
              data-testid="go-to-login-btn"
            >
              התחבר לחשבון
            </Link>
          </div>
        )}

        {status === "expired" && (
          <div>
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaTimesCircle className="text-4xl text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-carefd-navy mb-3">הלינק פג תוקף</h2>
            <p className="text-carefd-gray mb-6">
              קישור האימות פג תוקפו. אנא בקש קישור אימות חדש מדף ההתחברות.
            </p>
            <Link
              href="/login"
              className="inline-block bg-carefd-teal text-white px-8 py-3 rounded-xl font-bold hover:bg-carefd-teal/90 transition"
              data-testid="go-to-login-expired-btn"
            >
              חזור להתחברות
            </Link>
          </div>
        )}

        {status === "error" && (
          <div>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaTimesCircle className="text-4xl text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-carefd-navy mb-3">שגיאה באימות</h2>
            <p className="text-carefd-gray mb-6">
              קישור האימות אינו תקין. ייתכן שכבר השתמשת בו.
            </p>
            <Link
              href="/login"
              className="inline-block bg-carefd-teal text-white px-8 py-3 rounded-xl font-bold hover:bg-carefd-teal/90 transition"
              data-testid="go-to-login-error-btn"
            >
              חזור להתחברות
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
