import { Card } from "@/components/ui/card";
import { Search, HeartHandshake, MapPin, Layers3, Users, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: Search,
    title: "חיפוש פשוט וממוקד",
    desc: "חיפוש נותני שירות לפי תחום, מקצוע, התמחות, אזור ודרך מתן השירות.",
  },
  {
    icon: Layers3,
    title: "מגוון תחומי טיפול",
    desc: "מקום אחד המרכז נותני שירות מעולמות הרפואה, הבריאות, הטיפול והרווחה.",
  },
  {
    icon: MapPin,
    title: "שירות שמתאים למקום שלכם",
    desc: "איתור שירותים בבית, בקליניקה, במוסד או מרחוק - בהתאם לאפשרויות שמציע כל נותן שירות.",
  },
  {
    icon: Users,
    title: "פרופילים ברורים",
    desc: "מידע מסודר על נותני השירות, תחומי העיסוק, ההתמחויות, אזורי השירות ודרכי יצירת הקשר.",
  },
  {
    icon: HeartHandshake,
    title: "חיבור ישיר",
    desc: "CaredZ נועדה לקצר את הדרך בין מי שמחפש שירות לבין אנשי המקצוע המתאימים לו.",
  },
  {
    icon: ShieldCheck,
    title: "שקיפות ואחריות",
    desc: "אנו פועלים להצגת מידע ברור ולעידוד שימוש אחראי בפלטפורמה, תוך שמירה על פרטיות המשתמשים.",
  },
];

export default function AboutPage() {
  return (
    <div>
      <section className="section-padding bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-stone-100 via-white to-white">
        <div className="container-main max-w-4xl text-center">
          <span className="inline-flex rounded-full bg-carefd-teal/10 px-4 py-2 text-sm font-semibold text-carefd-teal mb-5">
            זירת המטפלים בישראל
          </span>
          <h1 className="mb-6">אודות CaredZ</h1>
          <p className="text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
            CaredZ היא פלטפורמה דיגיטלית המחברת בין אנשים המחפשים שירותי רפואה, בריאות וטיפול לבין נותני שירות מקצועיים ברחבי ישראל.
            המטרה שלנו היא להפוך את תהליך החיפוש, ההיכרות והפנייה לנותן שירות לפשוט, נגיש, ברור ומהיר יותר.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-main max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-12 items-start mb-16">
            <div>
              <h2 className="mb-5">למה הקמנו את CaredZ?</h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  מציאת איש מקצוע מתאים בתחום הבריאות והטיפול יכולה להיות משימה מורכבת: צריך להבין מי נותן את השירות הנדרש, היכן הוא פועל, באילו תחומים הוא מתמחה ואיך ניתן לפנות אליו.
                </p>
                <p>
                  CaredZ מרכזת את המידע במקום אחד ומאפשרת ללקוחות להכיר נותני שירות, להשוות בין אפשרויות ולבחור את הדרך המתאימה עבורם ליצירת קשר ולקבלת שירות.
                </p>
              </div>
            </div>
            <Card className="p-8 border-0 shadow-floating bg-carefd-navy text-white">
              <h3 className="text-xl font-heading font-semibold mb-4 text-white">החזון שלנו</h3>
              <p className="text-slate-200 leading-relaxed">
                ליצור זירה דיגיטלית אמינה, נגישה ושימושית לעולם הרפואה והטיפול בישראל - כזו שמחברת בין צורך אמיתי לבין אנשי מקצוע ושירותים רלוונטיים, ומאפשרת לכל צד לנהל את החיבור בצורה פשוטה יותר.
              </p>
            </Card>
          </div>

          <h2 className="text-center mb-10">מה תמצאו ב-CaredZ?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="p-7 hover-lift">
                <div className="w-12 h-12 bg-carefd-teal/10 rounded-2xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-carefd-teal" />
                </div>
                <h3 className="font-heading font-semibold text-lg text-carefd-navy mb-2">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-slate-50">
        <div className="container-main max-w-4xl text-center">
          <h2 className="mb-5">חשוב לדעת</h2>
          <p className="text-slate-600 leading-relaxed">
            CaredZ היא פלטפורמת מידע וחיבור בין משתמשים לנותני שירות עצמאיים. אלא אם צוין במפורש אחרת, CaredZ אינה מעניקה בעצמה שירות רפואי או טיפולי, אינה מחליפה ייעוץ רפואי ואינה צד לטיפול המקצועי שמעניק נותן השירות. האחריות לבחירת נותן השירות ולקבלת השירות היא בהתאם לצרכים ולשיקול הדעת של המשתמש ובהתאם לתנאי הפלטפורמה.
          </p>
        </div>
      </section>
    </div>
  );
}
