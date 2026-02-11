import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';

const Navbar = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center" data-testid="logo-link">
              <span className="text-2xl font-bold text-blue-600">CareLink</span>
            </Link>
            
            {isAuthenticated && (
              <div className="hidden md:flex ml-10 space-x-8">
                <Link
                  to="/providers"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2"
                  data-testid="nav-providers"
                >
                  {t('providers')}
                </Link>
                <Link
                  to="/services"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2"
                  data-testid="nav-services"
                >
                  {t('services')}
                </Link>
                <Link
                  to="/requests"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2"
                  data-testid="nav-requests"
                >
                  {t('requests')}
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-blue-600"
                  data-testid="nav-dashboard"
                >
                  {t('dashboard')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  data-testid="logout-btn"
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600"
                  data-testid="nav-login"
                >
                  {t('login')}
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  data-testid="nav-register"
                >
                  {t('register')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;