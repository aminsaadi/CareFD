"use client";

import { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { FaHeart, FaShieldAlt, FaHandshake, FaLightbulb, FaStar } from "react-icons/fa";
import api from "@/lib/api-client";
import Link from "next/link";

interface DbPage {
  title: string;
  content: string;
}

export default function AboutPage() {
  const siteName = "CareFD";
  const [dbPage, setDbPage] = useState<DbPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const data = await api.get<DbPage>("/pages/about");
        if (data && data.content) {
          setDbPage(data);
        }
      } catch {
        // No DB content, use hardcoded fallback
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, []);

  const values = [
    { icon: FaHeart, title: "אכפתיות", desc: "אנחנו מאמינים שכל אדם ראוי לטיפול איכותי ונגיש" },
    { icon: FaShieldAlt, title: "אמינות", desc: "כל הספקים שלנו עוברים תהליך אימות קפדני" },
    { icon: FaHandshake, title: "שקיפות", desc: "מחירים ברורים, ביקורות אמיתיות, ללא הפתעות" },
    { icon: FaLightbulb, title: "חדשנות", desc: "טכנולוגיה מתקדמת לחוויית משתמש מיטבית" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white" dir="rtl">
        <div className="flex items-center justify-center h-96">
          <div className="w-12 h-12 border-4 border-carefd-teal border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // If DB has content for this page, render it
  if (dbPage) {
    return (
      <div className="min-h-screen bg-white" dir="rtl">
        <section className="bg-gradient-to-br from-carefd-navy to-carefd-teal py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {dbPage.title}
            </h1>
          </div>
        </section>
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div
              className="prose prose-lg max-w-none text-carefd-slate"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(dbPage.content) }}
            />
          </div>
        </section>
      </div>
    );
  }

  // Fallback: hardcoded content
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-carefd-navy to-carefd-teal py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            אודות {siteName}
          </h1>
          <p className="text-xl text-carefd-teal-pale max-w-3xl mx-auto">
            אנחנו מחברים בין מטופלים לספקי שירותי בריאות מובילים בישראל,
            כדי להנגיש טיפול איכותי לכל אחד.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-carefd-navy mb-6">המשימה שלנו</h2>
              <p className="text-carefd-slate text-lg mb-4">
                הפלטפורמה נוסדה מתוך אמונה שכל אדם ראוי לגישה נוחה ומהירה לשירותי בריאות איכותיים.
              </p>
              <p className="text-carefd-slate text-lg mb-4">
                אנחנו מספקים פלטפורמה שמאפשרת למטופלים למצוא בקלות ספקי שירותים מאומתים,
                להשוות ביניהם ולהזמין שירותים בלחיצת כפתור.
              </p>
              <p className="text-carefd-slate text-lg">
                לספקים, אנחנו מציעים כלים לניהול העסק, הרחבת קהל הלקוחות והתמקדות במה שהם עושים הכי טוב - לטפל באנשים.
              </p>
            </div>
            <div className="bg-carefd-teal-pale/30 rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4 bg-white rounded-xl shadow-md">
                  <div className="text-4xl font-bold text-carefd-teal">500+</div>
                  <div className="text-carefd-slate">לקוחות מרוצים</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow-md">
                  <div className="text-4xl font-bold text-carefd-teal">50+</div>
                  <div className="text-carefd-slate">ספקים מאומתים</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow-md">
                  <div className="text-4xl font-bold text-carefd-teal">20+</div>
                  <div className="text-carefd-slate">ערים בישראל</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow-md">
                  <div className="text-4xl font-bold text-carefd-teal">4.9</div>
                  <div className="text-carefd-slate flex items-center justify-center gap-1">
                    <FaStar className="text-amber-400" /> דירוג ממוצע
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-carefd-teal-pale/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-carefd-navy text-center mb-12">הערכים שלנו</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-md text-center hover:shadow-lg transition">
                <div className="w-16 h-16 mx-auto bg-carefd-teal-pale rounded-full flex items-center justify-center mb-4">
                  <value.icon className="text-3xl text-carefd-teal" />
                </div>
                <h3 className="text-xl font-bold text-carefd-navy mb-2">{value.title}</h3>
                <p className="text-carefd-slate">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-carefd-navy">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">מוכנים להתחיל?</h2>
          <p className="text-carefd-teal-pale text-lg mb-8">
            הצטרפו לאלפי משתמשים שכבר מצאו את הספקים המושלמים עבורם
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/providers" className="bg-carefd-teal text-white px-8 py-3 rounded-xl font-semibold hover:bg-carefd-teal-medium transition">
              חפש ספקים
            </Link>
            <Link href="/register" className="bg-white/10 text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/20 transition border border-white/30">
              הצטרף כספק
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
