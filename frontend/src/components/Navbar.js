import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import Logo from './Logo';

const Navbar = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md border-b border-carelink-light-gray" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center" data-testid="logo-link">
              <Logo />
            </Link>
            
            {isAuthenticated && (\n              <div className="hidden md:flex ml-10 space-x-8 rtl:space-x-reverse">
                <Link
                  to="/providers"
                  className="text-carelink-slate hover:text-carelink-teal px-3 py-2 transition-colors"
                  data-testid="nav-providers"
                >
                  {t('providers')}
                </Link>
                <Link
                  to="/services"
                  className="text-carelink-slate hover:text-carelink-teal px-3 py-2 transition-colors"
                  data-testid="nav-services"
                >
                  {t('services')}
                </Link>
                <Link
                  to="/requests"
                  className="text-carelink-slate hover:text-carelink-teal px-3 py-2 transition-colors"
                  data-testid="nav-requests"
                >
                  {t('requests')}
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <LanguageSwitcher />
            
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-carelink-slate hover:text-carelink-teal transition-colors"
                  data-testid="nav-dashboard"
                >
                  {t('dashboard')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                  data-testid="logout-btn"
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-carelink-slate hover:text-carelink-teal transition-colors"
                  data-testid="nav-login"
                >
                  {t('login')}
                </Link>
                <Link
                  to="/register"
                  className="bg-carelink-teal text-white px-4 py-2 rounded hover:bg-carelink-teal-medium transition-colors"
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