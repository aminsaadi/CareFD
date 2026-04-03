"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdvancedSearch from "@/components/AdvancedSearch";
import {
  Search, MapPin, Star, Shield, Clock, Users,
  Heart, Stethoscope, Brain, Baby, Eye, Leaf,
  ArrowLeft, ChevronLeft, ChevronRight,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  stethoscope: Stethoscope,
  brain: Brain,
  baby: Baby,
  eye: Eye,
  leaf: Leaf,
  heart: Heart,
};

// Profession card colors (matching v1 professionColors)
const professionColors = [
  "from-blue-500 to-blue-600",
  "from-teal-500 to-teal-600",
  "from-purple-500 to-purple-600",
  "from-pink-500 to-pink-600",
  "from-orange-500 to-orange-600",
  "from-green-500 to-green-600",
  "from-indigo-500 to-indigo-600",
  "from-red-500 to-red-600",
  "from-amber-500 to-amber-600",
  "from-cyan-500 to-cyan-600",
];

const fallbackProfessions = [
  { profession_id: "1", name: "רפואה", icon: "stethoscope" },
  { profession_id: "2", name: "סיעוד", icon: "heart" },
  { profession_id: "3", name: "בריאות הנפש", icon: "brain" },
  { profession_id: "4", name: "מיילדות", icon: "baby" },
  { profession_id: "5", name: "אופטומטריה", icon: "eye" },
  { profession_id: "6", name: "רפואה משלימה", icon: "leaf" },
];

const testimonials = [
  { name: "שרה לוי", role: "בת של מטופלת", content: "מצאנו מטפלת סיעודית מדהימה לאמא שלי תוך יום אחד. השירות מקצועי ואמין!", rating: 5, avatar: "ש" },
  { name: "דוד כהן", role: "מטופל", content: "אחרי ניתוח ברך, הפיזיותרפיסט שמצאתי כאן עזר לי לחזור ללכת תוך חודשיים.", rating: 5, avatar: "ד" },
  { name: "רחל אברהם", role: "ספקית שירות", content: "הפלטפורמה עזרה לי להגיע ללקוחות חדשים ולפתח את העסק שלי בצורה משמעותית.", rating: 5, avatar: "ר" },
];

const stats = [
  { label: "מטפלים מאומתים", value: "500+", icon: Shield },
  { label: "שירותים זמינים", value: "1,200+", icon: Stethoscope },
  { label: "לקוחות מרוצים", value: "5,000+", icon: Users },
  { label: "ערים בכל הארץ", value: "200+", icon: MapPin },
];

// Scroll animation hook
function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function Landing() {
  const [professions, setProfessions] = useState<any[]>(fallbackProfessions);
  const [featuredProviders, setFeaturedProviders] = useState<any[]>([]);

  useEffect(() => {
    api.get("/professions")
      .then((d: any) => {
        if (d.professions?.length) setProfessions(d.professions);
      })
      .catch(() => {});

    // Fetch featured/recommended providers
    api.get("/providers?recommended=true&limit=6")
      .then((d: any) => {
        if (d.providers?.length) setFeaturedProviders(d.providers);
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-carefd-navy via-[#1a3a4f] to-carefd-teal text-white">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 end-20 w-96 h-96 bg-carefd-teal/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 start-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 start-1/3 w-80 h-80 bg-carefd-navy/30 rounded-full blur-3xl" />
          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="container-main py-20 md:py-32 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="accent" className="mb-6 text-sm px-4 py-1.5">
                <Shield className="w-3.5 h-3.5 me-1.5" />
                מטפלים מאומתים בלבד
              </Badge>

              <h1 className="text-balance mb-6">
                שירותי בריאות פרמיום{" "}
                <span className="text-carefd-teal-light">בדלת הבית</span>
              </h1>

              <p className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl leading-relaxed">
                מצאו את המטפל המושלם מתוך מאות ספקי שירות מאומתים בכל רחבי ישראל.
                סיעוד, רפואה, שיקום ועוד - הכל במקום אחד.
              </p>

              {/* Search Box */}
              <AdvancedSearch className="max-w-2xl" />

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Link
                  href="/register"
                  className="bg-carefd-teal text-white px-6 py-3 rounded-xl font-semibold hover:bg-carefd-teal-medium transition-colors text-center"
                >
                  התחל עכשיו
                </Link>
                <Link
                  href="/providers"
                  className="bg-white/10 text-white border border-white/20 px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-colors text-center"
                >
                  צפה בספקים
                </Link>
              </div>
            </div>

            {/* Right side stats grid (desktop only) */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {stats.map((stat, idx) => (
                <div
                  key={stat.label}
                  className={`bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 ${
                    idx === 0 ? "animate-float" : ""
                  }`}
                  style={{ animationDelay: `${idx * 0.5}s` }}
                >
                  <stat.icon className="w-8 h-8 text-carefd-teal-light mb-3" />
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-white/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar (mobile only - desktop shows in hero) */}
      <section className="border-y border-slate-100 bg-white lg:hidden">
        <div className="container-main py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="w-6 h-6 text-carefd-teal mx-auto mb-2" />
                <div className="text-2xl font-heading font-bold text-carefd-navy">{stat.value}</div>
                <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Professions Row (colored pills) */}
      <AnimatedSection>
        <section className="py-8 bg-white overflow-hidden">
          <div className="container-main">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {professions.map((prof, idx) => {
                const colorClass = professionColors[idx % professionColors.length];
                return (
                  <Link
                    key={prof.profession_id}
                    href={`/providers?category=${prof.profession_id}`}
                    className={`flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-medium text-sm bg-gradient-to-r ${colorClass} hover:shadow-lg transition-shadow`}
                  >
                    {prof.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Professions Grid */}
      <AnimatedSection>
        <section className="section-padding bg-gradient-to-b from-white to-gray-50">
          <div className="container-main">
            <div className="text-center mb-12">
              <h2 className="mb-4">מצאו לפי תחום</h2>
              <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                בחרו את תחום הטיפול המתאים לכם ומצאו מטפלים מקצועיים באזורכם
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              {professions.map((prof, idx) => {
                const IconComp = iconMap[prof.icon] || Stethoscope;
                const colorClass = professionColors[idx % professionColors.length];
                return (
                  <Link
                    key={prof.profession_id}
                    href={`/providers?category=${prof.profession_id}`}
                    className="group"
                    data-testid={`profession-${prof.profession_id}`}
                  >
                    <Card className="text-center p-6 hover-lift border-transparent hover:border-carefd-teal/30 relative overflow-hidden">
                      {/* Hover gradient overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} opacity-0 group-hover:opacity-10 transition-opacity`} />
                      <div className="relative z-10">
                        <div className="w-14 h-14 bg-carefd-teal/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-carefd-teal/20 transition-colors">
                          <IconComp className="w-7 h-7 text-carefd-teal" />
                        </div>
                        <h3 className="font-semibold text-carefd-navy text-sm">{prof.name}</h3>
                        {prof.specializations?.length > 0 && (
                          <p className="text-xs text-slate-400 mt-1">
                            {prof.specializations.length} התמחויות
                          </p>
                        )}
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Featured Providers */}
      {featuredProviders.length > 0 && (
        <AnimatedSection>
          <section className="section-padding bg-white">
            <div className="container-main">
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="mb-2">ספקים מומלצים</h2>
                  <p className="text-slate-500">ספקי השירות המובילים שלנו</p>
                </div>
                <Link
                  href="/providers?recommended=true"
                  className="text-carefd-teal font-medium hover:underline flex items-center gap-1"
                >
                  צפו בכולם
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProviders.slice(0, 6).map((provider) => (
                  <Link
                    key={provider.provider_id}
                    href={`/providers/${provider.provider_id}`}
                    className="group"
                  >
                    <Card className="p-6 hover-lift">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-carefd-teal to-carefd-navy rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {(provider.business_name || "ס")[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-carefd-navy truncate group-hover:text-carefd-teal transition-colors">
                            {provider.business_name || "ספק שירותים"}
                          </h3>
                          <p className="text-sm text-carefd-teal font-medium">
                            {provider.profession_name}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                              <span className="text-sm font-medium text-carefd-navy">
                                {(provider.rating || 0).toFixed(1)}
                              </span>
                            </div>
                            {provider.location?.city && (
                              <span className="text-xs text-carefd-gray flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {provider.location.city}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </AnimatedSection>
      )}

      {/* How It Works */}
      <AnimatedSection>
        <section className="section-padding">
          <div className="container-main">
            <div className="text-center mb-16">
              <h2 className="mb-4">איך זה עובד?</h2>
              <p className="text-slate-500 text-lg">שלושה צעדים פשוטים לקבלת טיפול מקצועי</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              {[
                { step: "01", icon: Search, title: "חפשו", desc: "מצאו את המטפל המתאים לפי מקצוע, מיקום, דירוג וזמינות" },
                { step: "02", icon: Clock, title: "הזמינו", desc: "קבעו תור ישירות דרך הפלטפורמה בזמן שנוח לכם" },
                { step: "03", icon: Heart, title: "קבלו טיפול", desc: "קבלו שירות מקצועי בבית, במרפאה או באופן מקוון" },
              ].map((item) => (
                <div key={item.step} className="text-center group">
                  <div className="relative inline-block mb-6">
                    <div className="w-20 h-20 bg-carefd-stone rounded-3xl flex items-center justify-center mx-auto group-hover:bg-carefd-teal/10 transition-colors">
                      <item.icon className="w-8 h-8 text-carefd-navy" />
                    </div>
                    <span className="absolute -top-2 -end-2 text-xs font-bold text-carefd-teal bg-carefd-teal/10 rounded-full w-7 h-7 flex items-center justify-center">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-heading font-semibold text-carefd-navy mb-3">{item.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Testimonials */}
      <AnimatedSection>
        <section className="section-padding bg-gradient-to-b from-gray-50 to-white">
          <div className="container-main">
            <div className="text-center mb-12">
              <h2 className="mb-4">מה אומרים עלינו</h2>
              <p className="text-slate-500 text-lg">חוויות של לקוחות ומטפלים מרוצים</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              {testimonials.map((t) => (
                <Card key={t.name} className="p-8">
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-carefd-teal fill-carefd-teal" />
                    ))}
                  </div>
                  <p className="text-slate-600 leading-relaxed mb-6">&ldquo;{t.content}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-carefd-teal-pale rounded-full flex items-center justify-center text-carefd-teal font-heading font-bold">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-carefd-navy text-sm">{t.name}</div>
                      <div className="text-xs text-slate-400">{t.role}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* CTA - Provider Signup */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-carefd-navy via-carefd-navy to-carefd-teal text-white relative overflow-hidden">
        <div className="container-main relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-white mb-6">אתם מטפלים? הצטרפו אלינו</h2>
            <p className="text-xl text-slate-300 mb-10 leading-relaxed">
              הרשמו בחינם וקבלו חשיפה לאלפי מטופלים פוטנציאליים. פרופיל מקצועי, ניהול תורים, ועוד.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="accent" size="lg" asChild data-testid="cta-provider-register">
                <Link href="/register?role=provider">
                  הרשמה כספק שירות
                  <ArrowLeft className="w-5 h-5 ms-2" />
                </Link>
              </Button>
              <Button variant="secondary" size="lg" asChild className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                <Link href="/about">למידע נוסף</Link>
              </Button>
            </div>
          </div>
        </div>
        {/* Decorative */}
        <div className="absolute top-0 end-0 w-72 h-72 bg-carefd-teal/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 start-0 w-96 h-96 bg-carefd-teal/5 rounded-full blur-3xl" />
      </section>
    </div>
  );
}
