import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8" data-testid="dashboard-header">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('welcome')}, {user?.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            {user?.role === 'provider' ? t('forProviders') : t('forPatients')}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            to="/providers"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition"
            data-testid="dashboard-providers-card"
          >
            <div className="text-blue-600 text-3xl mb-2">👨‍⚕️</div>
            <h3 className="text-xl font-semibold mb-2">{t('providers')}</h3>
            <p className="text-gray-600">חפש ספקי שירותים</p>
          </Link>

          <Link
            to="/services"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition"
            data-testid="dashboard-services-card"
          >
            <div className="text-green-600 text-3xl mb-2">🏥</div>
            <h3 className="text-xl font-semibold mb-2">{t('services')}</h3>
            <p className="text-gray-600">עיין בשירותים זמינים</p>
          </Link>

          <Link
            to="/requests"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition"
            data-testid="dashboard-requests-card"
          >
            <div className="text-purple-600 text-3xl mb-2">📝</div>
            <h3 className="text-xl font-semibold mb-2">{t('requests')}</h3>
            <p className="text-gray-600">פרסם או צפה בבקשות</p>
          </Link>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-lg shadow-md p-6" data-testid="user-info-card">
          <h2 className="text-2xl font-bold mb-4">{t('myProfile')}</h2>
          <div className="space-y-3">
            <div>
              <span className="font-medium">{t('name')}:</span> {user?.name}
            </div>
            <div>
              <span className="font-medium">{t('email')}:</span> {user?.email}
            </div>
            <div>
              <span className="font-medium">תפקיד:</span>{' '}
              {user?.role === 'provider' ? 'ספק שירותים' : 'מטופל'}
            </div>
          </div>
          
          {user?.role === 'provider' && (
            <div className="mt-6">
              <Link
                to="/provider/setup"
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 inline-block"
                data-testid="setup-provider-btn"
              >
                השלם את פרופיל הספק
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;