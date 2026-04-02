import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background-alt)] flex flex-col">
        <Navbar />
        <main className="flex-1 container-main py-8 md:py-12">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
