import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";

export const metadata: Metadata = {
  title: "CareFD - שירותי בריאות פרמיום בישראל",
  description: "פלטפורמת שירותי בריאות מובילה בישראל. חיפוש מטפלים, אחיות, רופאים וספקי שירות בריאות מקצועיים.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl">
      <body className="font-body antialiased">
        <AuthProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
