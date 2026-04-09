import Link from "next/link";
import { Shield, Search, MapPin } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left branding panel - V1 style with gradient, 55% width */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-carefd-navy via-[#1a3a4f] to-carefd-teal">
        {/* Animated background shapes */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-carefd-teal/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-white/3 rounded-full blur-3xl" />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="flex flex-col justify-center px-12 xl:px-20 relative z-10 w-full">
          {/* Logo container - V1 style */}
          <div className="bg-white/10 backdrop-blur-md px-10 py-5 rounded-2xl border border-white/10 w-fit mb-10">
            <div className="inline-flex items-center gap-2">
              <span className="text-3xl font-heading font-bold text-white">Care</span>
              <span className="text-3xl font-heading font-bold text-carefd-teal-light">FD</span>
            </div>
          </div>

          <h1 className="text-4xl xl:text-5xl font-heading font-bold text-white mb-4 leading-tight">
            שירותי בריאות<br />פרמיום בישראל
          </h1>
          <p className="text-lg text-white/60 mb-10 max-w-md">
            הפלטפורמה המובילה לחיבור בין מטופלים לנותני שירותי בריאות מקצועיים ומאומתים
          </p>

          {/* Feature cards - V1 style with hover */}
          <div className="space-y-4">
            {[
              { icon: Search, label: "חיפוש לפי אזור", desc: "מצאו ספקים קרובים אליכם" },
              { icon: Shield, label: "ספקים מאומתים", desc: "כל הספקים עוברים אימות" },
              { icon: MapPin, label: "קרוב אליכם", desc: "שירותי בריאות בכל הארץ" },
            ].map((f) => (
              <div key={f.label} className="bg-white/10 backdrop-blur-sm p-5 rounded-2xl border border-white/10 hover:bg-white/15 transition-all flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-6 h-6 text-carefd-teal-light" />
                </div>
                <div>
                  <p className="text-white font-medium">{f.label}</p>
                  <p className="text-white/50 text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel - V1 style */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Mobile logo */}
        <div className="lg:hidden px-6 py-6">
          <Link href="/" className="inline-flex items-center gap-1">
            <span className="text-2xl font-heading font-bold text-carefd-navy">Care</span>
            <span className="text-2xl font-heading font-bold text-carefd-teal">FD</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
