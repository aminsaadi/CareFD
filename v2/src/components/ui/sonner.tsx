"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "rounded-xl shadow-soft-lg border border-slate-100 font-sans",
          title: "text-carefd-navy font-medium",
          description: "text-carefd-gray",
          success: "border-emerald-200 bg-emerald-50",
          error: "border-red-200 bg-red-50",
        },
      }}
      dir="rtl"
    />
  );
}
