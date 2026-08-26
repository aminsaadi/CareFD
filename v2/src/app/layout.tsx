import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";

export const metadata: Metadata = {
  title: {
    default: "CaredZ - זירת המטפלים בישראל",
    template: "%s | CaredZ",
  },
  description: "CaredZ מחברת בין אנשים לנותני שירות בתחומי הרפואה, הבריאות והטיפול. חיפוש לפי מקצוע, התמחות, אזור ודרך מתן השירות.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl">
      <body className="font-sans antialiased">
        <AuthProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
