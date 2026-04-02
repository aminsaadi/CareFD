import { Card } from "@/components/ui/card";
import { Shield, Search, Calendar, MessageCircle, Star, Heart } from "lucide-react";

const features = [
  { icon: Search, title: "חיפוש חכם", desc: "מצאו מטפלים לפי מקצוע, מיקום ודירוג" },
  { icon: Calendar, title: "הזמנה מקוונת", desc: "הזמינו תורים ישירות דרך הפלטפורמה" },
  { icon: Heart, title: "שירות בבית", desc: "שירותי בריאות בבית, במרפאה ואונליין" },
  { icon: Star, title: "ביקורות אמיתיות", desc: "מערכת ביקורות ודירוגים אמינה" },
  { icon: MessageCircle, title: "תקשורת ישירה", desc: "צ'אט ישיר עם נותני השירות" },
  { icon: Shield, title: "מטפלים מאומתים", desc: "כל הספקים עוברים תהליך אימות מקצועי" },
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="section-padding bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-stone-100 via-white to-white">
        <div className="container-main max-w-4xl text-center">
          <h1 className="mb-6">אודות CareFD</h1>
          <p className="text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto">
            CareFD היא פלטפורמת שירותי בריאות פרמיום בישראל, המחברת בין מטופלים לנותני שירותים מקצועיים ומאומתים.
            המשימה שלנו היא להפוך את הגישה לשירותי בריאות איכותיים לפשוטה, נגישה ושקופה.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding">
        <div className="container-main">
          <h2 className="text-center mb-12">מה אנחנו מציעים</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="p-8 hover-lift">
                <div className="w-12 h-12 bg-carefd-teal/10 rounded-2xl flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-carefd-teal" />
                </div>
                <h3 className="font-heading font-semibold text-lg text-carefd-navy mb-2">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
