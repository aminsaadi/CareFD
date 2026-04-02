"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search, MapPin, Star, Shield, Clock, Users,
  Heart, Stethoscope, Brain, Baby, Eye, Leaf,
  ArrowLeft, CheckCircle, ChevronLeft,
} from "lucide-react";
import type { Profession } from "@/lib/types";

const iconMap: Record<string, React.ElementType> = {
  stethoscope: Stethoscope,
  brain: Brain,
  baby: Baby,
  eye: Eye,
  leaf: Leaf,
  heart: Heart,
};

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

export default function Landing() {
  const [professions, setProfessions] = useState<any[]>(fallbackProfessions);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    api.get<{ professions: Profession[] }>("/professions")
      .then((d) => {
        if (d.professions?.length) setProfessions(d.professions);
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-stone-100 via-white to-white">
        <div className="container-main py-20 md:py-32">
          <div className="max-w-3xl">
            <Badge variant="accent" className="mb-6 text-sm px-4 py-1.5">
              <Shield className="w-3.5 h-3.5 me-1.5" />
              מטפלים מאומתים בלבד
            </Badge>

            <h1 className="text-balance mb-6">
              שירותי בריאות פרמיום{" "}
              <span className="text-accent">בדלת הבית</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl leading-relaxed">
              מצאו את המטפל המושלם מתוך מאות ספקי שירות מאומתים בכל רחבי ישראל.
              סיעוד, רפואה, שיקום ועוד - הכל במקום אחד.
            </p>

            {/* Search Box */}
            <div className="glass-card p-3 max-w-2xl flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="חפשו מקצוע, שירות או שם מטפל..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-12 border-0 bg-white/60 h-14"
                  data-testid="hero-search-input"
                />
              </div>
              <Button size="lg" asChild className="h-14 px-8" data-testid="hero-search-btn">
                <Link href={`/providers${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ""}`}>
                  חיפוש
                  <ChevronLeft className="w-4 h-4 ms-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 end-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 start-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
      </section>

      {/* Stats Bar */}
      <section className="border-y border-slate-100 bg-white">
        <div className="container-main py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="w-6 h-6 text-accent mx-auto mb-2" />
                <div className="text-2xl md:text-3xl font-heading font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Professions Grid */}
      <section className="section-padding bg-[var(--background-alt)]">
        <div className="container-main">
          <div className="text-center mb-12">
            <h2 className="mb-4">מצאו לפי תחום</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              בחרו את תחום הטיפול המתאים לכם ומצאו מטפלים מקצועיים באזורכם
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {professions.map((prof) => {
              const IconComp = iconMap[prof.icon] || Stethoscope;
              return (
                <Link
                  key={prof.profession_id}
                  href={`/providers?category=${prof.profession_id}`}
                  className="group"
                  data-testid={`profession-${prof.profession_id}`}
                >
                  <Card className="text-center p-6 hover-lift border-transparent hover:border-accent/30">
                    <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/20 transition-colors">
                      <IconComp className="w-7 h-7 text-accent" />
                    </div>
                    <h3 className="font-semibold text-primary text-sm">{prof.name}</h3>
                    {prof.specializations?.length > 0 && (
                      <p className="text-xs text-slate-400 mt-1">
                        {prof.specializations.length} התמחויות
                      </p>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
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
                  <div className="w-20 h-20 bg-secondary rounded-3xl flex items-center justify-center mx-auto group-hover:bg-accent/10 transition-colors">
                    <item.icon className="w-8 h-8 text-primary" />
                  </div>
                  <span className="absolute -top-2 -end-2 text-xs font-bold text-accent bg-accent/10 rounded-full w-7 h-7 flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-heading font-semibold text-primary mb-3">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-padding bg-[var(--background-alt)]">
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
                    <Star key={i} className="w-4 h-4 text-accent fill-accent" />
                  ))}
                </div>
                <p className="text-slate-600 leading-relaxed mb-6">&ldquo;{t.content}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center text-accent font-heading font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-primary text-sm">{t.name}</div>
                    <div className="text-xs text-slate-400">{t.role}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Provider Signup */}
      <section className="py-20 md:py-28 bg-primary text-white relative overflow-hidden">
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
        <div className="absolute top-0 end-0 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 start-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </section>
    </div>
  );
}
