import Navbar from "@/components/Navbar";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12">{children}</main>
    </div>
  );
}
