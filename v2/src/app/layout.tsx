import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "CareFD - שירותי בריאות בישראל",
  description: "פלטפורמת שירותי בריאות מובילה בישראל. חיפוש מטפלים, אחיות, רופאים וספקי שירות בריאות.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl">
      <body className="font-sans antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <NotificationProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
