import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-stone-100 via-white to-white flex flex-col">
      {/* Simple header */}
      <div className="container-main py-6">
        <Link href="/" className="inline-flex items-center gap-1">
          <span className="text-2xl font-heading font-bold text-primary">Care</span>
          <span className="text-2xl font-heading font-bold text-accent">FD</span>
        </Link>
      </div>

      {/* Centered content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
