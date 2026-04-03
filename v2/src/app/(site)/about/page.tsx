import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Shield, Heart, Eye, Lightbulb, Users, MapPin, Star, Stethoscope } from "lucide-react";

const values = [
  { icon: Heart, title: "אכפתיות", desc: "אנחנו שמים את המטופלים והספקים במרכז. כל החלטה שלנו נעשית מתוך אכפתיות אמיתית." },
  { icon: Shield, title: "אמינות", desc: "כל הספקים עוברים תהליך אימות מקיף. אנחנו מחויבים לאמינות ושקיפות מלאה." },
  { icon: Eye, title: "שקיפות", desc: "ביקורות אמיתיות, מחירים גלויים ותהליכים ברורים. מה שאתם רואים זה מה שאתם מקבלים." },
  { icon: Lightbulb, title: "חדשנות", desc: "אנחנו ממשיכים להתפתח ולשפר את הפלטפורמה כדי לספק את השירות הטוב ביותר." },
];

const stats = [
  { icon: Users, value: "500+", label: "לקוחות מרוצים" },
  { icon: Stethoscope, value: "50+", label: "ספקים מאומתים" },
  { icon: MapPin, value: "20+", label: "ערים בישראל" },
  { icon: Star, value: "4.9", label: "דירוג ממוצע" },
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="section-padding bg-gradient-to-br from-carefd-teal-pale/20 via-white to-white">
        <div className="container-main max-w-4xl text-center">
          <h1 className="mb-6">אודות CareFD</h1>
          <p className="text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto">
            CareFD היא פלטפורמת שירותי בריאות פרמיום בישראל, המחברת בין מטופלים לנותני שירותים
            מקצועיים ומאומתים. המשימה שלנו היא להפוך את הגישה לשירותי בריאות איכותיים לפשוטה,
            נגישה ושקופה.
          </p>
        </div>
      </section>

      {/* Mission + Stats */}
      <section className="section-padding">
        <div className="container-main">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <h2 className="text-2xl font-bold text-carefd-navy mb-6">המשימה שלנו</h2>
              <p className="text-carefd-slate leading-relaxed mb-4">
                אנחנו מאמינים שכל אדם זכאי לגישה קלה ונוחה לשירותי בריאות איכותיים.
                CareFD נוצרה כדי לגשר על הפער בין מטופלים שמחפשים טיפול מקצועי לבין
                נותני שירותים מוסמכים ומנוסים.
              </p>
              <p className="text-carefd-slate leading-relaxed mb-4">
                הפלטפורמה שלנו מאפשרת חיפוש מתקדם, השוואת מחירים, קריאת ביקורות אמיתיות,
                והזמנת תורים - הכל במקום אחד.
              </p>
              <p className="text-carefd-slate leading-relaxed">
                אנחנו מחויבים לאיכות, שקיפות ובטיחות. כל ספק שירות עובר תהליך אימות מקיף
                לפני שהוא מופיע בפלטפורמה.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="bg-carefd-teal-pale/30 rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-6">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                      <stat.icon className="w-6 h-6 text-carefd-teal" />
                    </div>
                    <p className="text-3xl font-bold text-carefd-navy mb-1">{stat.value}</p>
                    <p className="text-sm text-carefd-gray">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-carefd-teal-pale/10">
        <div className="container-main">
          <h2 className="text-center mb-12">הערכים שלנו</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {values.map((v) => (
              <Card key={v.title} className="p-8 hover-lift text-center">
                <div className="w-16 h-16 bg-carefd-teal-pale rounded-full flex items-center justify-center mx-auto mb-4">
                  <v.icon className="w-7 h-7 text-carefd-teal" />
                </div>
                <h3 className="font-heading font-semibold text-lg text-carefd-navy mb-2">{v.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-carefd-navy">
        <div className="container-main text-center max-w-3xl">
          <h2 className="text-3xl font-bold text-white mb-4">מוכנים להתחיל?</h2>
          <p className="text-white/60 text-lg mb-8">
            הצטרפו לאלפי משתמשים שכבר מצאו את הספק המתאים להם
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-carefd-teal text-white px-8 py-3 rounded-xl font-semibold hover:bg-carefd-teal-medium transition-colors text-center"
            >
              הרשמו עכשיו
            </Link>
            <Link
              href="/providers"
              className="bg-white/10 text-white border border-white/20 px-8 py-3 rounded-xl font-semibold hover:bg-white/20 transition-colors text-center"
            >
              צפו בספקים
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
