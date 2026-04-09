"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin, Twitter, Youtube, Smartphone, Download } from "lucide-react";
import Logo from "@/components/Logo";

export default function Footer() {
  const [settings, setSettings] = useState<any>({
    site_name: "CareFD",
    site_tagline: "Connecting Care Providers",
    contact_phone: "03-1234567",
    contact_email: "",
    contact_address: "תל אביב, ישראל",
    footer_text: "",
    social_facebook: "",
    social_instagram: "",
    social_twitter: "",
    social_linkedin: "",
    social_youtube: "",
  });
  const [regions, setRegions] = useState<any[]>([]);

  useEffect(() => {
    api.get("/settings/public")
      .then((d: any) => setSettings((prev: any) => ({ ...prev, ...d })))
      .catch(() => {});
    api.get("/regions")
      .then((d: any) => setRegions(d.regions || []))
      .catch(() => {});
  }, []);

  const socialLinks = [
    { key: "facebook", icon: Facebook, url: settings.social_facebook },
    { key: "instagram", icon: Instagram, url: settings.social_instagram },
    { key: "twitter", icon: Twitter, url: settings.social_twitter },
    { key: "linkedin", icon: Linkedin, url: settings.social_linkedin },
    { key: "youtube", icon: Youtube, url: settings.social_youtube },
  ].filter((s) => s.url);

  return (
    <footer className="bg-carefd-navy text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="md:col-span-1">
            <div className="bg-white px-4 py-2 rounded-lg inline-block mb-4">
              <Logo />
            </div>
            <p className="text-carefd-teal-light mb-4 text-sm">
              {settings.site_tagline || "Connecting Care Providers"}
            </p>
            <p className="text-carefd-light-gray text-sm">
              פלטפורמה משולבת המחברת בין מטופלים לספקי שירותי בריאות.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-carefd-teal">קישורים מהירים</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-carefd-light-gray hover:text-carefd-teal transition">בית</Link></li>
              <li><Link href="/providers" className="text-carefd-light-gray hover:text-carefd-teal transition">ספקים</Link></li>
              <li><Link href="/services" className="text-carefd-light-gray hover:text-carefd-teal transition">שירותים</Link></li>
              <li><Link href="/about" className="text-carefd-light-gray hover:text-carefd-teal transition">אודות</Link></li>
              <li><Link href="/contact" className="text-carefd-light-gray hover:text-carefd-teal transition">צור קשר</Link></li>
            </ul>
          </div>

          {/* Regions */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-carefd-teal">אזורים וערים</h3>
            <ul className="space-y-2">
              {regions.slice(0, 6).map((r: any, i: number) => (
                <li key={i}>
                  <Link
                    href={`/providers?city=${encodeURIComponent(r.name || r)}`}
                    className="text-carefd-light-gray hover:text-carefd-teal transition"
                  >
                    {r.name || r}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/providers" className="text-carefd-teal hover:text-carefd-teal-light transition text-sm">
                  כל האזורים
                </Link>
              </li>
            </ul>
          </div>

          {/* For Providers */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-carefd-teal">לספקים</h3>
            <ul className="space-y-2">
              <li><Link href="/register?role=provider" className="text-carefd-light-gray hover:text-carefd-teal transition">הירשם כספק</Link></li>
              <li><Link href="/provider/dashboard" className="text-carefd-light-gray hover:text-carefd-teal transition">דשבורד ספק</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-carefd-teal">צור קשר</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-carefd-light-gray">
                <Phone className="w-4 h-4 text-carefd-teal flex-shrink-0" />
                <span dir="ltr">{settings.contact_phone}</span>
              </li>
              <li className="flex items-center gap-2 text-carefd-light-gray">
                <Mail className="w-4 h-4 text-carefd-teal flex-shrink-0" />
                <span>{settings.contact_email}</span>
              </li>
              <li className="flex items-center gap-2 text-carefd-light-gray">
                <MapPin className="w-4 h-4 text-carefd-teal flex-shrink-0" />
                <span>{settings.contact_address}</span>
              </li>
            </ul>

            {/* Social Links */}
            <div className="flex gap-3 mt-4">
              {socialLinks.length > 0 ? (
                socialLinks.map((s) => (
                  <a
                    key={s.key}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-carefd-slate p-2 rounded-full hover:bg-carefd-teal transition-colors"
                  >
                    <s.icon className="w-4 h-4" />
                  </a>
                ))
              ) : (
                <>
                  <span className="bg-carefd-slate p-2 rounded-full opacity-50"><Facebook className="w-4 h-4" /></span>
                  <span className="bg-carefd-slate p-2 rounded-full opacity-50"><Instagram className="w-4 h-4" /></span>
                  <span className="bg-carefd-slate p-2 rounded-full opacity-50"><Linkedin className="w-4 h-4" /></span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Download App Banner */}
      <div className="border-t border-carefd-slate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-gradient-to-l from-carefd-teal/20 to-carefd-navy rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-carefd-teal/20 p-3 rounded-full">
                <Smartphone className="w-6 h-6 text-carefd-teal" />
              </div>
              <div>
                <h4 className="font-bold text-white text-lg">הורד את האפליקציה</h4>
                <p className="text-carefd-light-gray text-sm">גישה מהירה מהמסך הראשי של הטלפון</p>
              </div>
            </div>
            <button
              className="bg-carefd-teal text-white px-6 py-3 rounded-lg hover:bg-carefd-teal-medium transition-colors font-bold flex items-center gap-2 whitespace-nowrap"
              onClick={() => {
                if (typeof window !== "undefined" && "BeforeInstallPromptEvent" in window) {
                  // PWA install handled by browser
                }
              }}
            >
              <Download className="w-4 h-4" />
              התקן אפליקציה
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-carefd-slate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-carefd-light-gray text-sm">
              {settings.footer_text || `© ${new Date().getFullYear()} ${settings.site_name || "CareFD"}. כל הזכויות שמורות.`}
            </p>
            <div className="flex gap-6 text-sm flex-wrap justify-center">
              <Link href="/about" className="text-carefd-light-gray hover:text-carefd-teal transition">אודות</Link>
              <Link href="/privacy" className="text-carefd-light-gray hover:text-carefd-teal transition">מדיניות פרטיות</Link>
              <Link href="/terms" className="text-carefd-light-gray hover:text-carefd-teal transition">תנאי שימוש</Link>
              <Link href="/contact" className="text-carefd-light-gray hover:text-carefd-teal transition">צור קשר</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
