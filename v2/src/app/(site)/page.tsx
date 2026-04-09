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
  ArrowLeft, ChevronLeft, ChevronRight, CheckCircle,
  ChevronDown,
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
          {/* Hero Content - Centered */}
          <div className="text-center max-w-4xl mx-auto mb-12 animate-fade-in">
            <Badge variant="accent" className="mb-6 text-sm px-5 py-2 inline-flex shadow-glow animate-float">
              <Shield className="w-3.5 h-3.5 me-1.5" />
              מטפלים מאומתים בלבד
            </Badge>

            <h1 className="text-balance mb-6 leading-tight">
              שירותי בריאות פרמיום{" "}
              <span className="text-carefd-teal-light relative">
                בדלת הבית
                <svg className="absolute -bottom-2 start-0 end-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path d="M2 6C50 2 150 2 198 6" stroke="#19B8BA" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
                </svg>
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/70 mb-0 max-w-2xl mx-auto leading-relaxed">
              מצאו את המטפל המושלם מתוך מאות ספקי שירות מאומתים בכל רחבי ישראל.
              סיעוד, רפואה, שיקום ועוד - הכל במקום אחד.
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-12 stagger-animation">
            {stats.map((stat, idx) => (
              <div
                key={stat.label}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 text-center hover:bg-white/15 transition-all duration-300 hover:-translate-y-1"
              >
                <stat.icon className="w-6 h-6 text-carefd-teal-light mx-auto mb-2" />
                <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-white/60 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Search Box - Full Width */}
          <div className="max-w-4xl mx-auto">
            <AdvancedSearch className="" />
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-10 justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Link
              href="/register"
              className="bg-carefd-teal text-white px-8 py-4 rounded-2xl font-semibold hover:bg-carefd-teal-medium transition-all text-center text-lg shadow-glow hover:shadow-lg hover:-translate-y-0.5"
            >
              התחל עכשיו
            </Link>
            <Link
              href="/providers"
              className="bg-white/10 text-white border border-white/20 px-8 py-3.5 rounded-xl font-semibold hover:bg-white/20 transition-colors text-center text-lg"
            >
              צפה בספקים
            </Link>
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

            <div className="grid md:grid-cols-3 gap-8 md:gap-12 stagger-animation">
              {[
                { step: "01", icon: Search, title: "חפשו", desc: "מצאו את המטפל המתאים לפי מקצוע, מיקום, דירוג וזמינות", color: "from-blue-500 to-indigo-500" },
                { step: "02", icon: Clock, title: "הזמינו", desc: "קבעו תור ישירות דרך הפלטפורמה בזמן שנוח לכם", color: "from-carefd-teal to-emerald-500" },
                { step: "03", icon: Heart, title: "קבלו טיפול", desc: "קבלו שירות מקצועי בבית, במרפאה או באופן מקוון", color: "from-amber-500 to-orange-500" },
              ].map((item) => (
                <div key={item.step} className="text-center group">
                  <div className="relative inline-block mb-6">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-soft group-hover:shadow-soft-lg transition-all duration-300 group-hover:-translate-y-2">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                        <item.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <span className="absolute -top-2 -end-2 text-xs font-bold text-white bg-carefd-navy rounded-full w-7 h-7 flex items-center justify-center shadow-sm">
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

      {/* Testimonials - Dark glass style like V1 */}
      <AnimatedSection>
        <section className="section-padding bg-carefd-navy">
          <div className="container-main">
            <div className="text-center mb-12">
              <h2 className="mb-4 text-white">מה הלקוחות שלנו אומרים</h2>
              <p className="text-carefd-teal-pale text-lg">אלפי לקוחות מרוצים כבר נהנים משירותים איכותיים</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 md:gap-8 stagger-animation">
              {testimonials.map((t) => (
                <div key={t.name} className="glass-card-dark p-8 hover-lift">
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-white leading-relaxed mb-6">&ldquo;{t.content}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-carefd-teal rounded-full flex items-center justify-center text-white font-heading font-bold text-lg">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">{t.name}</div>
                      <div className="text-xs text-carefd-teal-pale">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Request Banner */}
      <section className="py-10 bg-gradient-to-l from-carefd-teal via-carefd-teal-medium to-carefd-navy">
        <div className="container-main max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-right">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">לא מצאתם מה שחיפשתם?</h3>
              <p className="text-carefd-teal-pale text-lg">פרסמו בקשה וקבלו הצעות מספקים מתאימים ישירות אליכם</p>
            </div>
            <Link href="/open-requests?create=true"
              className="inline-flex items-center gap-2 bg-white text-carefd-teal px-8 py-4 rounded-xl font-bold text-lg hover:bg-carefd-teal-pale transition-all shadow-soft-lg hover-scale whitespace-nowrap">
              <Search className="w-5 h-5" />פרסם בקשה
            </Link>
          </div>
        </div>
      </section>

      {/* For Patients & Providers */}
      <AnimatedSection>
        <section className="section-padding bg-white">
          <div className="container-main">
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* For Patients */}
              <Card className="p-8 bg-gradient-to-br from-carefd-teal to-carefd-teal-medium text-white border-0 shadow-soft-lg hover-lift">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><Users className="w-6 h-6" /></div>
                  <h3 className="text-2xl font-bold">למטופלים</h3>
                </div>
                <ul className="space-y-3 mb-8">
                  {["חפש ספקי שירותי בריאות לפי מיקום והתמחות", "קרא ביקורות מאומתות וקבל החלטות מושכלות", "הזמן שירותים ישירות דרך הפלטפורמה", "נהל את התורים וההזמנות שלך במקום אחד"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-carefd-teal-pale mt-0.5 flex-shrink-0" /><span>{item}</span></li>
                  ))}
                </ul>
                <Link href="/register" className="inline-flex items-center gap-2 bg-white text-carefd-teal px-6 py-3 rounded-xl font-semibold hover:bg-carefd-teal-pale transition-all shadow-soft">
                  הרשם כמטופל <ArrowLeft className="w-4 h-4" />
                </Link>
              </Card>

              {/* For Providers */}
              <Card className="p-8 bg-gradient-to-br from-carefd-navy to-carefd-slate text-white border-0 shadow-soft-lg hover-lift">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><Stethoscope className="w-6 h-6" /></div>
                  <h3 className="text-2xl font-bold">לספקי שירות</h3>
                </div>
                <ul className="space-y-3 mb-8">
                  {["צור פרופיל מקצועי והצג את השירותים שלך", "הגע ללקוחות חדשים והרחב את העסק", "נהל את הזמינות והפגישות שלך בקלות", "בנה את המוניטין המקצועי שלך דרך ביקורות"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-carefd-teal-pale mt-0.5 flex-shrink-0" /><span>{item}</span></li>
                  ))}
                </ul>
                <Link href="/register?role=provider" className="inline-flex items-center gap-2 bg-carefd-teal text-white px-6 py-3 rounded-xl font-semibold hover:bg-carefd-teal-medium transition-all shadow-soft">
                  הרשם כספק <ArrowLeft className="w-4 h-4" />
                </Link>
              </Card>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* FAQ */}
      <AnimatedSection>
        <section className="section-padding bg-gradient-to-b from-white to-gray-50">
          <div className="container-main max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="mb-4">שאלות נפוצות</h2>
              <p className="text-slate-500 text-lg">תשובות לשאלות הנפוצות ביותר</p>
            </div>
            <div className="space-y-4">
              {[
                { q: "איך מוצאים מטפל סיעודי דרך CareFD?", a: "ניתן לחפש מטפלים לפי מקצוע, אזור גיאוגרפי ודירוג. כל הספקים עוברים תהליך אימות מסמכים ותעודות." },
                { q: "כמה עולה שירות סיעודי דרך הפלטפורמה?", a: "המחירים משתנים לפי סוג השירות והספק. ניתן לראות מחירים ולהשוות בין ספקים באתר. אין עלות לחיפוש והשוואה." },
                { q: "האם המטפלים באתר מאומתים?", a: "כן, כל ספק עובר תהליך אימות מסמכים ותעודות לפני שמאושר להציע שירותים. ניתן לזהות ספקים מאומתים לפי תג האימות בפרופיל." },
                { q: "באילו אזורים בישראל השירות זמין?", a: "CareFD פועלת בכל רחבי ישראל - מרכז, צפון, דרום, ירושלים, חיפה והסביבה. ניתן לחפש לפי עיר או אזור." },
                { q: "איך אני יכול להירשם כספק שירות?", a: "ההרשמה פשוטה וחינמית. לחצו על 'הרשמה כספק', מלאו את הפרטים, העלו מסמכים לאימות, וצוות שלנו יאשר את הפרופיל שלכם." },
              ].map((faq, idx) => (
                <FaqItem key={idx} question={faq.q} answer={faq.a} />
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
