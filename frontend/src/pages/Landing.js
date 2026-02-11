import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';

const Landing = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white" data-testid="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6" data-testid="hero-title">
              {t('heroTitle')}
            </h1>
            <p className="text-xl mb-8 text-blue-100" data-testid="hero-subtitle">
              {t('heroSubtitle')}
            </p>
            <Link
              to="/register"
              className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition"
              data-testid="get-started-btn"
            >
              {t('getStarted')}
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12" data-testid="how-it-works-title">
          {t('howItWorks')}
        </h2>
        
        <div className="grid md:grid-cols-2 gap-12">
          {/* For Patients */}
          <div className="bg-white p-8 rounded-lg shadow-md" data-testid="patients-card">
            <h3 className="text-2xl font-bold mb-4 text-blue-600">
              {t('forPatients')}
            </h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                חפש ספקי שירותי בריאות לפי מיקום והתמחות
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                פרסם בקשה וקבל הצעות ממספר ספקים
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                הזמן שירותים ישירות דרך הפלטפורמה
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                קרא ביקורות מאומתות
              </li>
            </ul>
          </div>

          {/* For Providers */}
          <div className="bg-white p-8 rounded-lg shadow-md" data-testid="providers-card">
            <h3 className="text-2xl font-bold mb-4 text-green-600">
              {t('forProviders')}
            </h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                צור פרופיל מקצועי והצג את השירותים שלך
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                הגש הצעות לבקשות פעילות
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                נהל את הזמינות והפגישות שלך
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                בנה את המוניטין המקצועי שלך
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">
            מוכנים להתחיל?
          </h2>
          <div className="flex justify-center gap-4">
            <Link
              to="/register"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              data-testid="cta-register-btn"
            >
              {t('register')}
            </Link>
            <Link
              to="/login"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition border-2 border-blue-600"
              data-testid="cta-login-btn"
            >
              {t('login')}
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>© 2025 CareLink. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;