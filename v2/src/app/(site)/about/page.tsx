import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Shield, Heart, Eye, Lightbulb, Users, MapPin, Star, Stethoscope, ArrowLeft, CheckCircle } from "lucide-react";

const values = [
  { icon: Heart, title: "אכפתיות", desc: "אנחנו שמים את המטופלים והספקים במרכז. כל החלטה שלנו נעשית מתוך אכפתיות אמיתית.", color: "from-pink-500 to-rose-500" },
  { icon: Shield, title: "אמינות", desc: "כל הספקים עוברים תהליך אימות מקיף. אנחנו מחויבים לאמינות ושקיפות מלאה.", color: "from-carefd-teal to-emerald-500" },
  { icon: Eye, title: "שקיפות", desc: "ביקורות אמיתיות, מחירים גלויים ותהליכים ברורים. מה שאתם רואים זה מה שאתם מקבלים.", color: "from-blue-500 to-indigo-500" },
  { icon: Lightbulb, title: "חדשנות", desc: "אנחנו ממשיכים להתפתח ולשפר את הפלטפורמה כדי לספק את השירות הטוב ביותר.", color: "from-amber-500 to-orange-500" },
];

const stats = [
  { icon: Users, value: "500+", label: "לקוחות מרוצים" },
  { icon: Stethoscope, value: "50+", label: "ספקים מאומתים" },
  { icon: MapPin, value: "20+", label: "ערים בישראל" },
  { icon: Star, value: "4.9", label: "דירוג ממוצע" },
];

const features = [
  "חיפוש מתקדם לפי מקצוע, מיקום ודירוג",
  "תהליך אימות מקיף לכל ספק",
  "הזמנת תורים אונליין 24/7",
  "ביקורות ודירוגים אמיתיים",
  "שיחות צ'אט ישירות עם הספקים",
  "מערכת בקשות שירות חכמה",
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-carefd-navy via-[#1a3a4f] to-carefd-teal text-white">
        <div className="absolute inset-0">
          <div className="absolute top-20 start-20 w-96 h-96 bg-carefd-teal/15 rounded-full blur-3xl" />
          <div className="absolute bottom-10 end-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        </div>
        <div className="container-main py-20 md:py-28 relative z-10 max-w-4xl text-center">
          <h1 className="mb-6 text-white animate-fade-in">אודות CareFD</h1>
          <p className="text-lg md:text-xl text-white/70 leading-relaxed max-w-2xl mx-auto">
            CareFD היא פלטפורמת שירותי בריאות פרמיום בישראל, המחברת בין מטופלים לנותני שירותים
            מקצועיים ומאומתים. המשימה שלנו היא להפוך את הגישה לשירותי בריאות איכותיים לפשוטה,
            נגישה ושקופה.
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative -mt-12 z-20">
        <div className="container-main max-w-4xl">
          <div className="bg-white rounded-2xl shadow-floating p-6 md:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center group">
                  <div className="w-14 h-14 bg-carefd-teal/10 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-carefd-teal/20 transition-colors">
                    <stat.icon className="w-7 h-7 text-carefd-teal" />
                  </div>
                  <p className="text-3xl font-bold text-carefd-navy mb-1 font-heading">{stat.value}</p>
                  <p className="text-sm text-carefd-gray">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="section-padding">
        <div className="container-main">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <div>
              <span className="text-carefd-teal font-semibold text-sm tracking-wide mb-4 block">המשימה שלנו</span>
              <h2 className="text-3xl font-bold text-carefd-navy mb-6">לגשר על הפער בין מטופלים לספקים</h2>
              <p className="text-carefd-slate leading-relaxed mb-4">
                אנחנו מאמינים שכל אדם זכאי לגישה קלה ונוחה לשירותי בריאות איכותיים.
                CareFD נוצרה כדי לגשר על הפער בין מטופלים שמחפשים טיפול מקצועי לבין
                נותני שירותים מוסמכים ומנוסים.
              </p>
              <p className="text-carefd-slate leading-relaxed mb-6">
                הפלטפורמה שלנו מאפשרת חיפוש מתקדם, השוואת מחירים, קריאת ביקורות אמיתיות,
                והזמנת תורים - הכל במקום אחד.
              </p>

              {/* Features List */}
              <div className="space-y-3">
                {features.map((f) => (
                  <div key={f} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-carefd-teal flex-shrink-0" />
                    <span className="text-carefd-slate text-sm">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Image / Visual */}
            <div className="relative">
              <div className="bg-gradient-to-br from-carefd-teal-pale/40 to-carefd-teal/10 rounded-3xl p-8 md:p-12">
                <div className="bg-white rounded-2xl shadow-soft-lg p-8 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-carefd-teal to-carefd-navy rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow">
                    <Heart className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-carefd-navy mb-2">CareFD</h3>
                  <p className="text-carefd-gray">שירותי בריאות פרמיום בדלת הבית</p>
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    {stats.slice(0, 2).map((s) => (
                      <div key={s.label} className="bg-carefd-teal-pale/30 rounded-xl p-3">
                        <p className="text-xl font-bold text-carefd-navy">{s.value}</p>
                        <p className="text-xs text-carefd-gray">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Decorative dots */}
              <div className="absolute -top-4 -end-4 w-24 h-24 opacity-20" style={{ backgroundImage: "radial-gradient(circle, #19B8BA 2px, transparent 2px)", backgroundSize: "12px 12px" }} />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-gradient-to-b from-white to-carefd-teal-pale/10">
        <div className="container-main">
          <div className="text-center mb-14">
            <span className="text-carefd-teal font-semibold text-sm tracking-wide mb-3 block">מה מנחה אותנו</span>
            <h2 className="text-3xl font-bold text-carefd-navy">הערכים שלנו</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto stagger-animation">
            {values.map((v) => (
              <Card key={v.title} className="p-8 hover-lift text-center border-0 shadow-soft group">
                <div className={`w-16 h-16 bg-gradient-to-br ${v.color} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md group-hover:shadow-lg transition-shadow`}>
                  <v.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-heading font-semibold text-lg text-carefd-navy mb-3">{v.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-carefd-navy via-[#1a3a4f] to-carefd-teal relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 end-10 w-64 h-64 bg-carefd-teal/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 start-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="container-main text-center max-w-3xl relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">מוכנים להתחיל?</h2>
          <p className="text-white/60 text-lg mb-8">
            הצטרפו לאלפי משתמשים שכבר מצאו את הספק המתאים להם
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-carefd-teal text-white px-8 py-4 rounded-2xl font-semibold hover:bg-carefd-teal-medium transition-all text-center shadow-glow hover:shadow-lg hover:-translate-y-0.5"
            >
              הרשמו עכשיו
            </Link>
            <Link
              href="/providers"
              className="bg-white/10 text-white border border-white/20 px-8 py-4 rounded-2xl font-semibold hover:bg-white/20 transition-all text-center backdrop-blur-sm"
            >
              צפו בספקים
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
