import Link from "next/link";
import { Shield, Heart, Eye, Lightbulb, Users, MapPin, Star, Stethoscope, CheckCircle, ArrowLeft } from "lucide-react";

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
      {/* Hero - V1 style */}
      <section className="bg-gradient-to-br from-carefd-navy to-carefd-teal py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white font-heading mb-6">אודות CareFD</h1>
          <p className="text-lg md:text-xl text-carefd-teal-pale leading-relaxed max-w-2xl mx-auto">
            CareFD היא פלטפורמת שירותי בריאות פרמיום בישראל, המחברת בין מטופלים לנותני שירותים
            מקצועיים ומאומתים. המשימה שלנו היא להפוך את הגישה לשירותי בריאות איכותיים לפשוטה,
            נגישה ושקופה.
          </p>
        </div>
      </section>

      {/* Mission - V1 style with stats grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-carefd-navy font-heading mb-6">המשימה שלנו</h2>
              <p className="text-carefd-slate leading-relaxed mb-4">
                אנחנו מאמינים שכל אדם זכאי לגישה קלה ונוחה לשירותי בריאות איכותיים.
                CareFD נוצרה כדי לגשר על הפער בין מטופלים שמחפשים טיפול מקצועי לבין
                נותני שירותים מוסמכים ומנוסים.
              </p>
              <p className="text-carefd-slate leading-relaxed mb-6">
                הפלטפורמה שלנו מאפשרת חיפוש מתקדם, השוואת מחירים, קריאת ביקורות אמיתיות,
                והזמנת תורים - הכל במקום אחד.
              </p>
              <div className="space-y-3">
                {features.map((f) => (
                  <div key={f} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-carefd-teal flex-shrink-0" />
                    <span className="text-carefd-slate text-sm">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Grid - V1 style */}
            <div className="bg-carefd-teal-pale/30 rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center p-4 bg-white rounded-xl shadow-md">
                    <stat.icon className="w-8 h-8 text-carefd-teal mx-auto mb-2" />
                    <p className="text-3xl font-bold text-carefd-navy mb-1">{stat.value}</p>
                    <p className="text-sm text-carefd-gray">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values - V1 style */}
      <section className="py-16 bg-carefd-teal-pale/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-carefd-navy font-heading mb-4">הערכים שלנו</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-white p-6 rounded-2xl shadow-md text-center hover:shadow-lg transition group">
                <div className="w-16 h-16 mx-auto bg-carefd-teal-pale rounded-full flex items-center justify-center mb-4">
                  <v.icon className="w-8 h-8 text-carefd-teal" />
                </div>
                <h3 className="font-bold text-lg text-carefd-navy mb-3">{v.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - V1 style dark navy */}
      <section className="py-16 bg-carefd-navy">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">מוכנים להתחיל?</h2>
          <p className="text-carefd-teal-pale text-lg mb-8">
            הצטרפו לאלפי משתמשים שכבר מצאו את הספק המתאים להם
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="bg-carefd-teal text-white px-8 py-3 rounded-xl font-semibold hover:bg-carefd-teal-medium transition">
              הרשמו עכשיו
            </Link>
            <Link href="/providers" className="bg-white/10 text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/20 transition border border-white/30">
              צפו בספקים
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
