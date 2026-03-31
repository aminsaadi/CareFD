"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import type { Profession } from "@/lib/types";

export default function Landing() {
  const [professions, setProfessions] = useState<Profession[]>([]);

  useEffect(() => {
    api.get<{ professions: Profession[] }>("/professions").then((d) => setProfessions(d.professions)).catch(() => {});
  }, []);

  return (
    <div dir="rtl">
      {/* Hero */}
      <section className="bg-gradient-to-bl from-teal-600 to-teal-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">מצאו את המטפל המושלם</h1>
          <p className="text-xl md:text-2xl text-teal-100 mb-10 max-w-3xl mx-auto">
            פלטפורמת שירותי בריאות מובילה בישראל. אלפי מטפלים מקצועיים במרחק קליק.
          </p>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-4 flex gap-3">
            <input type="text" placeholder="חפשו מקצוע, שירות או שם מטפל..." className="flex-1 px-4 py-3 text-gray-700 rounded-xl border-2 border-teal-100 focus:border-teal-500 focus:outline-none text-right" />
            <Link href="/providers" className="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700 transition-colors whitespace-nowrap">
              חיפוש
            </Link>
          </div>
        </div>
      </section>

      {/* Professions */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">מצאו לפי מקצוע</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {professions.map((prof) => (
              <Link key={prof.profession_id} href={`/providers?category=${prof.profession_id}`}
                className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow border border-gray-100 hover:border-teal-200">
                <div className="text-3xl mb-3">🏥</div>
                <h3 className="font-semibold text-gray-800">{prof.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{prof.specializations?.length || 0} התמחויות</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">איך זה עובד?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "חפשו", desc: "מצאו את המטפל המתאים לפי מקצוע, מיקום ודירוג" },
              { step: "2", title: "הזמינו", desc: "קבעו תור ישירות דרך האתר בלחיצה אחת" },
              { step: "3", title: "קבלו טיפול", desc: "קבלו שירות מקצועי בבית, במרפאה או אונליין" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-teal-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">אתם מטפלים? הצטרפו אלינו!</h2>
          <p className="text-xl text-teal-100 mb-8">הרשמו בחינם וקבלו חשיפה לאלפי מטופלים פוטנציאליים</p>
          <Link href="/register?role=provider" className="bg-white text-teal-700 px-10 py-4 rounded-xl font-bold text-lg hover:bg-teal-50 transition-colors inline-block">
            הרשמה כספק שירות
          </Link>
        </div>
      </section>
    </div>
  );
}
