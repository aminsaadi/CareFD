"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import api from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import AdvancedSearch from "@/components/AdvancedSearch";
import {
  Search, MapPin, Star, Shield, Clock, Users,
  Heart, Stethoscope, Brain, Baby, Eye, Leaf,
  ArrowLeft, CheckCircle, ChevronDown,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  stethoscope: Stethoscope,
  brain: Brain,
  baby: Baby,
  eye: Eye,
  leaf: Leaf,
  heart: Heart,
};

// Profession pill colors - V1 soft-bg style
const professionColors = [
  "bg-blue-50 text-blue-600 shadow-soft hover:shadow-soft-md",
  "bg-pink-50 text-pink-600 shadow-soft hover:shadow-soft-md",
  "bg-cyan-50 text-cyan-600 shadow-soft hover:shadow-soft-md",
  "bg-green-50 text-green-600 shadow-soft hover:shadow-soft-md",
  "bg-purple-50 text-purple-600 shadow-soft hover:shadow-soft-md",
  "bg-orange-50 text-orange-600 shadow-soft hover:shadow-soft-md",
  "bg-emerald-50 text-emerald-600 shadow-soft hover:shadow-soft-md",
  "bg-amber-50 text-amber-600 shadow-soft hover:shadow-soft-md",
  "bg-rose-50 text-rose-600 shadow-soft hover:shadow-soft-md",
  "bg-indigo-50 text-indigo-600 shadow-soft hover:shadow-soft-md",
];

// Category grid gradient colors (for hover overlay)
const categoryColors = [
  "from-blue-500 to-cyan-500",
  "from-pink-500 to-rose-500",
  "from-green-500 to-emerald-500",
  "from-purple-500 to-violet-500",
  "from-orange-500 to-amber-500",
  "from-red-500 to-pink-500",
  "from-teal-500 to-cyan-500",
  "from-indigo-500 to-blue-500",
  "from-yellow-500 to-orange-500",
  "from-emerald-500 to-green-500",
];

const fallbackProfessions = [
  { profession_id: "1", name: "רפואה", icon: "stethoscope" },
  { profession_id: "2", name: "סיעוד", icon: "heart" },
  { profession_id: "3", name: "בריאות הנפש", icon: "brain" },
  { profession_id: "4", name: "מיילדות", icon: "baby" },
  { profession_id: "5", name: "אופטומטריה", icon: "eye" },
  { profession_id: "6", name: "רפואה משלימה", icon: "leaf" },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`bg-white rounded-2xl shadow-soft border-2 transition-all ${open ? "border-carefd-teal" : "border-transparent"}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-right">
        <span className="font-semibold text-carefd-navy text-base">{question}</span>
        <ChevronDown className={`w-5 h-5 text-carefd-teal transition-transform flex-shrink-0 ms-3 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-0 text-slate-500 leading-relaxed animate-fade-in">{answer}</div>
      )}
    </div>
  );
}

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

    api.get("/providers?recommended=true&limit=6")
      .then((d: any) => {
        if (d.providers?.length) setFeaturedProviders(d.providers);
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero Section - V1 style 2-column layout */}
      <section className="relative overflow-hidden bg-gradient-to-br from-carefd-navy via-carefd-slate to-carefd-teal text-white">
        {/* Background decorative elements - matching V1 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-carefd-teal rounded-full translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 opacity-5" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-white">
              {/* Badge with pulse dot - V1 style */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <span className="w-2 h-2 bg-carefd-teal rounded-full animate-pulse" />
                <span className="text-sm text-carefd-teal-pale">מטפלים מאומתים בלבד</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 font-heading leading-tight">
                מצא את שירותי
                <br />
                <span className="text-carefd-teal-light">הבריאות הטובים</span>
                <br />
                ביותר בישראל
              </h1>

              <p className="text-lg lg:text-xl mb-8 text-carefd-teal-pale max-w-xl leading-relaxed">
                פלטפורמה משולבת המחברת בין מטופלים לספקי שירותי בריאות איכותיים
              </p>

              {/* Search Box - V1 glass card style */}
              <div className="glass-card p-4 sm:p-5 rounded-2xl shadow-soft-xl mb-8">
                <AdvancedSearch compact className="" />
              </div>

              {/* CTA Buttons - V1 style */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register"
                  className="inline-flex items-center justify-center gap-2 bg-white text-carefd-teal px-10 py-4 rounded-xl font-bold text-lg hover:bg-carefd-teal-pale transition-all shadow-soft-lg btn-press hover-scale">
                  התחל עכשיו
                </Link>
                <Link href="/providers"
                  className="inline-flex items-center justify-center gap-2 bg-transparent text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-all border-2 border-white/30 btn-press">
                  צפה בספקים
                </Link>
              </div>
            </div>

            {/* Right Content - Stats Cards - V1 glass-card-dark style */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {stats.map((stat, idx) => (
                <AnimatedSection key={stat.label}>
                  <div className={`glass-card-dark p-6 rounded-2xl hover-lift ${idx % 2 === 1 ? "mt-8" : ""}`}>
                    <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                    <div className="text-carefd-teal-pale">{stat.label}</div>
                  </div>
                </AnimatedSection>
              ))}
            </div>

            {/* Mobile Stats */}
            <div className="grid grid-cols-2 gap-4 lg:hidden">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
                  <stat.icon className="w-6 h-6 text-carefd-teal-light mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-white/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Professions Row - V1 style soft color pills */}
      <AnimatedSection>
        <section className="py-8 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-carefd-navy">חפש לפי מקצוע</h3>
              <Link href="/providers" className="text-carefd-teal hover:text-carefd-teal-medium text-sm font-medium">
                כל המקצועות &larr;
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide stagger-animation">
              {professions.map((prof, idx) => {
                const colorClass = professionColors[idx % professionColors.length];
                const IconComp = iconMap[prof.icon] || Stethoscope;
                return (
                  <Link
                    key={prof.profession_id}
                    href={`/providers?search=${encodeURIComponent(prof.name)}`}
                    className={`flex-shrink-0 flex items-center gap-3 px-5 py-3 rounded-xl ${colorClass} transition-all btn-press`}
                  >
                    <IconComp className="w-5 h-5" />
                    <span className="font-medium whitespace-nowrap">{prof.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Categories Grid - V1 style with hover gradient */}
      <AnimatedSection>
        <section className="py-16 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-carefd-navy font-heading mb-4">קטגוריות שירותים</h2>
              <p className="text-carefd-slate max-w-2xl mx-auto">
                מצאו את השירות המתאים לכם מתוך מגוון רחב של קטגוריות
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {professions.map((prof, idx) => {
                const IconComp = iconMap[prof.icon] || Stethoscope;
                const gradColor = categoryColors[idx % categoryColors.length];
                return (
                  <Link
                    key={prof.profession_id}
                    href={`/services?category=${prof.profession_id}`}
                    className="group relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-5 text-center shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    data-testid={`category-${prof.profession_id}`}
                  >
                    {/* Gradient Background on Hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    <div className="relative z-10">
                      <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-carefd-teal/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
                        <IconComp className="w-6 h-6 text-carefd-teal group-hover:text-white transition-colors" />
                      </div>
                      <h3 className="font-bold text-carefd-navy group-hover:text-white transition-colors mb-1 text-base">
                        {prof.name}
                      </h3>
                      {prof.specializations?.length > 0 && (
                        <p className="text-xs text-carefd-gray group-hover:text-white/80 transition-colors line-clamp-2">
                          {prof.specializations.slice(0, 3).map((s: any) => s.name || s).join(", ")}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Featured Providers - V1 style */}
      <AnimatedSection>
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-carefd-navy font-heading mb-2">ספקים מומלצים</h2>
                <p className="text-carefd-slate">הספקים המובילים בפלטפורמה שלנו</p>
              </div>
              <Link href="/providers" className="hidden md:flex items-center gap-2 text-carefd-teal hover:text-carefd-teal-medium font-medium">
                צפה בכל הספקים
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>

            {featuredProviders.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProviders.slice(0, 3).map((provider) => (
                  <Link key={provider.provider_id} href={`/providers/${provider.provider_id}`} className="group">
                    <Card className="p-6 hover-lift border-2 border-transparent hover:border-carefd-teal/30">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-carefd-teal to-carefd-navy rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {(provider.business_name || "ס")[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-carefd-navy truncate group-hover:text-carefd-teal transition-colors">
                            {provider.business_name || "ספק שירותים"}
                          </h3>
                          <p className="text-sm text-carefd-teal font-medium">{provider.profession_name}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                              <span className="text-sm font-medium text-carefd-navy">{(provider.rating || 0).toFixed(1)}</span>
                            </div>
                            {provider.location?.city && (
                              <span className="text-xs text-carefd-gray flex items-center gap-1">
                                <MapPin className="w-3 h-3" />{provider.location.city}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-2xl">
                <Users className="mx-auto w-12 h-12 text-gray-300 mb-4" />
                <p className="text-carefd-slate text-lg mb-2">בקרוב יתווספו ספקים מומלצים...</p>
                <Link href="/register?role=provider" className="text-carefd-teal font-semibold hover:underline">הצטרפו כספק</Link>
              </div>
            )}

            <div className="mt-8 text-center md:hidden">
              <Link href="/providers" className="inline-flex items-center gap-2 text-carefd-teal font-semibold">
                צפה בכל הספקים <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Request Banner - V1 style */}
      <section className="py-10 bg-gradient-to-l from-carefd-teal via-carefd-teal-medium to-carefd-navy">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-right">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">לא מצאתם מה שחיפשתם?</h3>
              <p className="text-carefd-teal-pale text-lg">פרסמו בקשה וקבלו הצעות מספקים מתאימים ישירות אליכם</p>
            </div>
            <Link href="/open-requests?create=true"
              className="inline-flex items-center gap-2 bg-white text-carefd-teal px-8 py-4 rounded-xl font-bold text-lg hover:bg-carefd-teal-pale transition-all shadow-soft-lg btn-press hover-scale whitespace-nowrap">
              <Search className="w-5 h-5" />פרסם בקשה
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works - V1 style */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-carefd-navy font-heading mb-4">איך זה עובד?</h2>
              <p className="text-carefd-slate max-w-2xl mx-auto">שלושה צעדים פשוטים למציאת השירות המושלם</p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: "01", title: "חפש שירות", desc: "השתמשו במנוע החיפוש שלנו למציאת ספקים לפי מיקום, מקצוע או התמחות", icon: Search },
              { num: "02", title: "השווה והחלט", desc: "קראו ביקורות, בדקו דירוגים והשוו מחירים לבחירת הספק המתאים", icon: Star },
              { num: "03", title: "הזמן טיפול", desc: "צרו קשר ישירות או הזמינו דרך הפלטפורמה בזמן שנוח לכם", icon: CheckCircle },
            ].map((step, index) => (
              <AnimatedSection key={index}>
                <div className="relative text-center group">
                  <div className="shadow-soft w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-carefd-teal group-hover:scale-110 transition-all duration-300 bg-carefd-teal-pale/30">
                    <step.icon className="w-8 h-8 text-carefd-teal group-hover:text-white transition-colors" />
                  </div>
                  <span className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-2 bg-carefd-navy text-white text-sm font-bold px-3 py-1 rounded-full shadow-soft badge-glow">
                    {step.num}
                  </span>
                  <h3 className="text-xl font-bold text-carefd-navy mb-3">{step.title}</h3>
                  <p className="text-carefd-slate leading-relaxed">{step.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - V1 dark glass style */}
      <AnimatedSection>
        <section className="py-16 bg-carefd-navy">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white font-heading mb-4">מה הלקוחות שלנו אומרים</h2>
              <p className="text-carefd-teal-pale">אלפי לקוחות מרוצים כבר נהנים משירותים איכותיים</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 stagger-animation">
              {testimonials.map((t) => (
                <div key={t.name} className="glass-card-dark p-6 rounded-2xl hover-lift">
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-white mb-6 leading-relaxed">&ldquo;{t.content}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-carefd-teal rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{t.name}</div>
                      <div className="text-sm text-carefd-teal-pale">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* For Patients & Providers - V1 style */}
      <AnimatedSection>
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-carefd-teal to-carefd-teal-medium p-8 rounded-2xl text-white shadow-soft-lg hover-lift">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><Users className="w-6 h-6" /></div>
                  <h3 className="text-2xl font-bold">למטופלים</h3>
                </div>
                <ul className="space-y-4 mb-8">
                  {["חפש ספקי שירותי בריאות לפי מיקום והתמחות", "קרא ביקורות מאומתות וקבל החלטות מושכלות", "הזמן שירותים ישירות דרך הפלטפורמה", "נהל את התורים וההזמנות שלך במקום אחד"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-carefd-teal-pale mt-0.5 flex-shrink-0" /><span>{item}</span></li>
                  ))}
                </ul>
                <Link href="/register" className="inline-flex items-center gap-2 bg-white text-carefd-teal px-6 py-3 rounded-xl font-semibold hover:bg-carefd-teal-pale transition-all btn-press shadow-soft">
                  הרשם כמטופל <ArrowLeft className="w-4 h-4" />
                </Link>
              </div>

              <div className="bg-gradient-to-br from-carefd-navy to-carefd-slate p-8 rounded-2xl text-white shadow-soft-lg hover-lift">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><Stethoscope className="w-6 h-6" /></div>
                  <h3 className="text-2xl font-bold">לספקי שירות</h3>
                </div>
                <ul className="space-y-4 mb-8">
                  {["צור פרופיל מקצועי והצג את השירותים שלך", "הגע ללקוחות חדשים והרחב את העסק", "נהל את הזמינות והפגישות שלך בקלות", "בנה את המוניטין המקצועי שלך דרך ביקורות"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-carefd-teal-pale mt-0.5 flex-shrink-0" /><span>{item}</span></li>
                  ))}
                </ul>
                <Link href="/register?role=provider" className="inline-flex items-center gap-2 bg-carefd-teal text-white px-6 py-3 rounded-xl font-semibold hover:bg-carefd-teal-medium transition-all btn-press shadow-soft">
                  הרשם כספק <ArrowLeft className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* FAQ */}
      <AnimatedSection>
        <section className="py-16 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-3xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-carefd-navy font-heading mb-4">שאלות נפוצות</h2>
              <p className="text-carefd-slate">תשובות לשאלות הנפוצות ביותר</p>
            </div>
            <div className="space-y-4">
              {[
                { q: "איך מוצאים מטפל סיעודי דרך CareFD?", a: "ניתן לחפש מטפלים לפי מקצוע, אזור גיאוגרפי ודירוג. כל הספקים עוברים תהליך אימות מסמכים ותעודות." },
                { q: "כמה עולה שירות סיעודי דרך הפלטפורמה?", a: "המחירים משתנים לפי סוג השירות והספק. ניתן לראות מחירים ולהשוות בין ספקים באתר. אין עלות לחיפוש והשוואה." },
                { q: "האם המטפלים באתר מאומתים?", a: "כן, כל ספק עובר תהליך אימות מסמכים ותעודות לפני שמאושר להציע שירותים." },
                { q: "באילו אזורים בישראל השירות זמין?", a: "CareFD פועלת בכל רחבי ישראל - מרכז, צפון, דרום, ירושלים והסביבה." },
              ].map((faq, idx) => (
                <FaqItem key={idx} question={faq.q} answer={faq.a} />
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* CTA Section - V1 style */}
      <section className="py-16 bg-gradient-to-br from-carefd-teal via-carefd-teal-medium to-carefd-navy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">מוכנים להתחיל?</h2>
            <p className="text-xl text-carefd-teal-pale mb-10 max-w-2xl mx-auto">
              הצטרפו לאלפי משתמשים שכבר מצאו את הטיפול המושלם עבורם
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-carefd-teal px-10 py-4 rounded-xl font-bold text-lg hover:bg-carefd-teal-pale transition-all shadow-soft-lg btn-press hover-scale">
                הרשמה <ArrowLeft className="w-5 h-5" />
              </Link>
              <Link href="/login"
                className="inline-flex items-center justify-center gap-2 bg-transparent text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-all border-2 border-white/30 btn-press">
                התחברות
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
