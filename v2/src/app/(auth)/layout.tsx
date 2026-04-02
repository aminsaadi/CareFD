import Link from "next/link";
import { Shield, Search, MapPin } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left branding panel - hidden on mobile */}
      <div className="hidden lg:flex lg:w-[55%] bg-gradient-to-bl from-carefd-navy via-[#1a3a4f] to-carefd-teal relative overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute top-20 end-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 start-10 w-48 h-48 bg-carefd-teal/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 start-1/2 w-96 h-96 bg-white/3 rounded-full blur-3xl" />

        <div className="flex flex-col justify-center px-12 xl:px-20 relative z-10">
          {/* Logo */}
          <div className="glass-card-dark inline-flex items-center gap-2 px-5 py-3 rounded-2xl w-fit mb-10">
            <span className="text-2xl font-heading font-bold text-white">Care</span>
            <span className="text-2xl font-heading font-bold text-carefd-teal-light">FD</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-heading font-bold text-white mb-4 leading-tight">
            שירותי בריאות<br />פרמיום בישראל
          </h1>
          <p className="text-lg text-white/60 mb-10 max-w-md">
            הפלטפורמה המובילה לחיבור בין מטופלים לנותני שירותי בריאות מקצועיים ומאומתים
          </p>

          {/* Feature cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Search, label: "חיפוש לפי אזור" },
              { icon: Shield, label: "ספקים מאומתים" },
              { icon: MapPin, label: "קרוב אליכם" },
            ].map((f) => (
              <div key={f.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                <f.icon className="w-6 h-6 text-carefd-teal-light mx-auto mb-2" />
                <p className="text-white/80 text-xs font-medium">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Mobile logo */}
        <div className="lg:hidden container-main py-6">
          <Link href="/" className="inline-flex items-center gap-1">
            <span className="text-2xl font-heading font-bold text-carefd-navy">Care</span>
            <span className="text-2xl font-heading font-bold text-carefd-teal">FD</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
