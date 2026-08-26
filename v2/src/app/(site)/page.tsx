"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import AdvancedSearch from "@/components/AdvancedSearch";
import {
  Search, MapPin, Clock, Heart, Stethoscope, Brain, Baby, Eye, Leaf,
  ArrowLeft, UserRoundSearch, HeartHandshake, Sparkles,
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

const benefits = [
  { icon: UserRoundSearch, title: "מוצאים את האדם המתאים", desc: "חיפוש לפי מקצוע, התמחות, אזור ודרך מתן השירות." },
  { icon: MapPin, title: "קרוב אליכם", desc: "איתור נותני שירות לפי עיר, אזור או מיקום נוכחי." },
  { icon: HeartHandshake, title: "חיבור פשוט", desc: "עוברים מפרופיל מקצועי לפנייה או להזמנת שירות בצורה ברורה." },
];

export default function Landing() {
  const [professions, setProfessions] = useState<any[]>(fallbackProfessions);

  useEffect(() => {
    api.get<{ professions: Profession[] }>("/professions")
      .then((d) => {
        if (d.professions?.length) setProfessions(d.professions.slice(0, 6));
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-bl from-carefd-navy via-[#17384c] to-[#157d86] text-white">
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_15%_15%,rgba(255,255,255,.12),transparent_30%),radial-gradient(circle_at_85%_70%,rgba(25,184,186,.18),transparent_30%)]" />
        <div className="container-main relative py-16 md:py-24 lg:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-carefd-teal" />
              זירת המטפלים בישראל
            </span>
            <h1 className="text-balance mb-5 text-white">
              מוצאים את נותן השירות
              <span className="block text-carefd-teal">המתאים לכם</span>
            </h1>
            <p className="mx-auto mb-9 max-w-2xl text-base leading-relaxed text-white/75 md:text-xl">
              חפשו מטפלים ונותני שירות בתחומי הרפואה, הבריאות והטיפול לפי מקצוע, התמחות, אזור ודרך מתן השירות.
            </p>
            <AdvancedSearch className="mx-auto max-w-4xl text-right" />
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/60">
              <span>חיפוש לפי אזור</span>
              <span className="hidden h-1 w-1 rounded-full bg-white/30 sm:block" />
              <span>מגוון תחומים</span>
              <span className="hidden h-1 w-1 rounded-full bg-white/30 sm:block" />
              <span>פרופילים מסודרים</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-white">
        <div className="container-main py-7 md:py-9">
          <div className="grid gap-5 md:grid-cols-3 md:gap-8">
            {benefits.map((item) => (
              <div key={item.title} className="flex items-start gap-4 rounded-2xl p-2 md:p-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-carefd-teal/10 text-carefd-teal">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="mb-1 text-base font-semibold tracking-normal text-carefd-navy md:text-lg">{item.title}</h2>
                  <p className="text-sm leading-relaxed text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-[var(--background-alt)]">
        <div className="container-main">
          <div className="mb-10 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="section-eyebrow">תחומים מובילים</span>
              <h2 className="mb-3">מה אתם מחפשים?</h2>
              <p className="max-w-2xl text-slate-500">בחרו תחום והמשיכו לרשימת נותני השירות הרלוונטיים.</p>
            </div>
            <Link href="/providers" className="inline-flex items-center gap-1.5 text-sm font-semibold text-carefd-teal hover:text-carefd-navy">
              לכל המטפלים <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 lg:grid-cols-6">
            {professions.map((prof) => {
              const IconComp = iconMap[prof.icon] || Stethoscope;
              return (
                <Link key={prof.profession_id} href={`/providers?category=${prof.profession_id}`} className="group" data-testid={`profession-${prof.profession_id}`}>
                  <Card className="h-full border-slate-100 p-5 text-center transition-all hover:-translate-y-0.5 hover:border-carefd-teal/25 hover:shadow-soft-md md:p-6">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-carefd-teal/10 transition-colors group-hover:bg-carefd-teal/15">
                      <IconComp className="h-7 w-7 text-carefd-teal" />
                    </div>
                    <h3 className="text-sm font-semibold text-carefd-navy md:text-base">{prof.name}</h3>
                    {prof.specializations?.length > 0 && <p className="mt-1 text-xs text-slate-400">{prof.specializations.length} התמחויות</p>}
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-main max-w-5xl">
          <div className="mb-12 text-center">
            <span className="section-eyebrow">פשוט להתחיל</span>
            <h2 className="mb-3">איך CaredZ עובדת?</h2>
            <p className="mx-auto max-w-2xl text-slate-500">שלושה צעדים קצרים מהחיפוש ועד ליצירת קשר עם נותן השירות.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 md:gap-8">
            {[
              { step: "01", icon: Search, title: "מחפשים", desc: "מגדירים תחום, שירות או אזור ומקבלים אפשרויות רלוונטיות." },
              { step: "02", icon: UserRoundSearch, title: "בוחרים", desc: "נכנסים לפרופילים, בודקים פרטים ומוצאים את ההתאמה הנכונה." },
              { step: "03", icon: Clock, title: "יוצרים קשר", desc: "פונים לנותן השירות או ממשיכים להזמנה בהתאם לאפשרויות הזמינות." },
            ].map((item) => (
              <div key={item.step} className="relative rounded-3xl border border-slate-100 bg-white p-7 shadow-soft md:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-carefd-teal/10 text-carefd-teal">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-bold text-slate-300">{item.step}</span>
                </div>
                <h3 className="mb-2 text-xl text-carefd-navy">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500 md:text-base">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-[var(--background-alt)]">
        <div className="container-main">
          <div className="grid items-center gap-10 overflow-hidden rounded-[2rem] bg-carefd-navy p-7 text-white md:grid-cols-[1.25fr_.75fr] md:p-12 lg:p-14">
            <div>
              <span className="mb-4 inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-carefd-teal">לנותני שירות</span>
              <h2 className="mb-4 text-white">המקצוע שלכם. הפרופיל שלכם. הקהל שלכם.</h2>
              <p className="mb-7 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
                הצטרפו ל-CaredZ, הציגו את תחומי הפעילות, ההתמחויות ואזורי השירות שלכם, והפכו את הדרך של לקוחות חדשים אליכם לפשוטה יותר.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="accent" size="lg" asChild data-testid="cta-provider-register">
                  <Link href="/register?role=provider">הצטרפות כנותן שירות <ArrowLeft className="ms-2 h-5 w-5" /></Link>
                </Button>
                <Button variant="secondary" size="lg" asChild className="border-white/15 bg-white/10 text-white hover:bg-white/15">
                  <Link href="/about">איך זה עובד?</Link>
                </Button>
              </div>
            </div>
            <div className="hidden md:flex justify-center">
              <div className="relative flex h-52 w-52 items-center justify-center rounded-[2.5rem] border border-white/10 bg-white/5">
                <div className="absolute h-36 w-36 rounded-full bg-carefd-teal/15 blur-2xl" />
                <Heart className="relative h-20 w-20 text-carefd-teal" strokeWidth={1.4} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
