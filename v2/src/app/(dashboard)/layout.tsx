import ProtectedRoute from "@/components/ProtectedRoute";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto w-full px-4 py-8">{children}</div>
      </div>
    </ProtectedRoute>
  );
}
