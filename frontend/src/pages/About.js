import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaHeart, FaUsers, FaShieldAlt, FaHandshake, FaLightbulb, FaStar } from 'react-icons/fa';

const About = () => {
  const values = [
    { icon: FaHeart, title: 'אכפתיות', desc: 'אנחנו מאמינים שכל אדם ראוי לטיפול איכותי ונגיש' },
    { icon: FaShieldAlt, title: 'אמינות', desc: 'כל הספקים שלנו עוברים תהליך אימות קפדני' },
    { icon: FaHandshake, title: 'שקיפות', desc: 'מחירים ברורים, ביקורות אמיתיות, ללא הפתעות' },
    { icon: FaLightbulb, title: 'חדשנות', desc: 'טכנולוגיה מתקדמת לחוויית משתמש מיטבית' }
  ];

  const team = [
    { name: 'ד"ר שרה כהן', role: 'מייסדת ומנכ"לית', image: '' },
    { name: 'יוסי לוי', role: 'סמנכ"ל טכנולוגיות', image: '' },
    { name: 'מיכל אברהם', role: 'מנהלת תפעול', image: '' }
  ];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-carelink-navy to-carelink-teal py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            אודות CareLink
          </h1>
          <p className="text-xl text-carelink-teal-pale max-w-3xl mx-auto">
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
              <h2 className="text-3xl font-bold text-carelink-navy mb-6">המשימה שלנו</h2>
              <p className="text-carelink-slate text-lg mb-4">
                CareLink נוסדה מתוך אמונה שכל אדם ראוי לגישה נוחה ומהירה לשירותי בריאות איכותיים.
              </p>
              <p className="text-carelink-slate text-lg mb-4">
                אנחנו מספקים פלטפורמה שמאפשרת למטופלים למצוא בקלות ספקי שירותים מאומתים, 
                להשוות ביניהם ולהזמין שירותים בלחיצת כפתור.
              </p>
              <p className="text-carelink-slate text-lg">
                לספקים, אנחנו מציעים כלים לניהול העסק, הרחבת קהל הלקוחות והתמקדות במה שהם עושים הכי טוב - לטפל באנשים.
              </p>
            </div>
            <div className="bg-carelink-teal-pale/30 rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4 bg-white rounded-xl shadow-md">
                  <div className="text-4xl font-bold text-carelink-teal">500+</div>
                  <div className="text-carelink-slate">לקוחות מרוצים</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow-md">
                  <div className="text-4xl font-bold text-carelink-teal">50+</div>
                  <div className="text-carelink-slate">ספקים מאומתים</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow-md">
                  <div className="text-4xl font-bold text-carelink-teal">20+</div>
                  <div className="text-carelink-slate">ערים בישראל</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow-md">
                  <div className="text-4xl font-bold text-carelink-teal">4.9</div>
                  <div className="text-carelink-slate flex items-center justify-center gap-1">
                    <FaStar className="text-amber-400" /> דירוג ממוצע
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-carelink-teal-pale/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-carelink-navy text-center mb-12">הערכים שלנו</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-md text-center hover:shadow-lg transition">
                <div className="w-16 h-16 mx-auto bg-carelink-teal-pale rounded-full flex items-center justify-center mb-4">
                  <value.icon className="text-3xl text-carelink-teal" />
                </div>
                <h3 className="text-xl font-bold text-carelink-navy mb-2">{value.title}</h3>
                <p className="text-carelink-slate">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-carelink-navy">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">מוכנים להתחיל?</h2>
          <p className="text-carelink-teal-pale text-lg mb-8">
            הצטרפו לאלפי משתמשים שכבר מצאו את הספקים המושלמים עבורם
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/providers" className="bg-carelink-teal text-white px-8 py-3 rounded-xl font-semibold hover:bg-carelink-teal-medium transition">
              חפש ספקים
            </a>
            <a href="/register/provider" className="bg-white/10 text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/20 transition border border-white/30">
              הצטרף כספק
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
