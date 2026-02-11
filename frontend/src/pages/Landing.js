import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Logo from '../components/Logo';

const Landing = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-carelink-teal-pale">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-carelink-navy via-carelink-slate to-carelink-teal text-white" data-testid="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white px-8 py-4 rounded-2xl shadow-xl">
                <Logo size="large" />
              </div>
            </div>
            <p className="text-sm text-carelink-teal-pale mb-4 font-medium uppercase tracking-wide">
              Connecting Care Providers
            </p>
            <h1 className="text-5xl font-bold mb-6 font-heading" data-testid="hero-title">
              {t('heroTitle')}
            </h1>
            <p className="text-xl mb-8 text-carelink-teal-pale max-w-2xl mx-auto" data-testid="hero-subtitle">
              {t('heroSubtitle')}
            </p>
            <Link
              to="/register"
              className="inline-block bg-carelink-teal text-white px-8 py-4 rounded-lg font-semibold hover:bg-carelink-teal-medium transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              data-testid="get-started-btn"
            >
              {t('getStarted')}
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-carelink-navy font-heading" data-testid="how-it-works-title">
          {t('howItWorks')}
        </h2>
        
        <div className="grid md:grid-cols-2 gap-12">
          {/* For Patients */}
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition border-2 border-carelink-teal-pale" data-testid="patients-card">
            <div className="flex items-center mb-4">
              <div className="bg-carelink-teal text-white p-3 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mr-3 text-carelink-navy font-heading">
                {t('forPatients')}
              </h3>
            </div>
            <ul className="space-y-3 text-carelink-slate">
              <li className="flex items-start">
                <span className="text-carelink-teal mr-2 text-xl">✓</span>
                <span>חפש ספקי שירותי בריאות לפי מיקום והתמחות</span>
              </li>
              <li className="flex items-start">
                <span className="text-carelink-teal mr-2 text-xl">✓</span>
                <span>פרסם בקשה וקבל הצעות ממספר ספקים</span>
              </li>
              <li className="flex items-start">
                <span className="text-carelink-teal mr-2 text-xl">✓</span>
                <span>הזמן שירותים ישירות דרך הפלטפורמה</span>
              </li>
              <li className="flex items-start">
                <span className="text-carelink-teal mr-2 text-xl">✓</span>
                <span>קרא ביקורות מאומתות</span>
              </li>
            </ul>
          </div>

          {/* For Providers */}
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition border-2 border-carelink-navy" data-testid="providers-card">
            <div className="flex items-center mb-4">
              <div className="bg-carelink-navy text-white p-3 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mr-3 text-carelink-navy font-heading">
                {t('forProviders')}
              </h3>
            </div>
            <ul className="space-y-3 text-carelink-slate">
              <li className="flex items-start">
                <span className="text-carelink-navy mr-2 text-xl">✓</span>
                <span>צור פרופיל מקצועי והצג את השירותים שלך</span>
              </li>
              <li className="flex items-start">
                <span className="text-carelink-navy mr-2 text-xl">✓</span>
                <span>הגש הצעות לבקשות פעילות</span>
              </li>
              <li className="flex items-start">
                <span className="text-carelink-navy mr-2 text-xl">✓</span>
                <span>נהל את הזמינות והפגישות שלך</span>
              </li>
              <li className="flex items-start">
                <span className="text-carelink-navy mr-2 text-xl">✓</span>
                <span>בנה את המוניטין המקצועי שלך</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-carelink-teal to-carelink-teal-light py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6 text-white font-heading">
            מוכנים להתחיל?
          </h2>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link
              to="/register"
              className="bg-white text-carelink-teal px-8 py-3 rounded-lg font-semibold hover:bg-carelink-teal-pale transition shadow-lg hover:shadow-xl"
              data-testid="cta-register-btn"
            >
              {t('register')}
            </Link>
            <Link
              to="/login"
              className="bg-carelink-navy text-white px-8 py-3 rounded-lg font-semibold hover:bg-carelink-slate transition border-2 border-white shadow-lg hover:shadow-xl"
              data-testid="cta-login-btn"
            >
              {t('login')}
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-carelink-navy text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center mb-4">
            <div className="bg-white px-6 py-2 rounded-lg">
              <Logo />
            </div>
          </div>
          <p className="text-center text-carelink-teal-light">
            © 2025 CareLink. Connecting Care Providers. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;