import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import Logo from './Logo';
import { FaSearch, FaBars, FaTimes } from 'react-icons/fa';

const Navbar = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/providers?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  return (
    <nav className="bg-white shadow-md border-b border-carelink-light-gray sticky top-0 z-40" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center" data-testid="logo-link">
              <Logo />
            </Link>
            
            {/* Desktop navigation links */}
            <div className="hidden md:flex ml-10 space-x-6 rtl:space-x-reverse">
              <Link
                to="/providers"
                className="text-carelink-slate hover:text-carelink-teal px-3 py-2 transition-colors font-medium"
                data-testid="nav-providers"
              >
                {t('providers')}
              </Link>
              <Link
                to="/services"
                className="text-carelink-slate hover:text-carelink-teal px-3 py-2 transition-colors font-medium"
                data-testid="nav-services"
              >
                {t('services')}
              </Link>
              {isAuthenticated && (
                <Link
                  to="/requests"
                  className="text-carelink-slate hover:text-carelink-teal px-3 py-2 transition-colors font-medium"
                  data-testid="nav-requests"
                >
                  {t('requests')}
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Icon */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 rounded-lg hover:bg-carelink-teal-pale/30 text-carelink-slate hover:text-carelink-teal transition-colors"
              data-testid="search-icon-btn"
            >
              <FaSearch className="text-lg" />
            </button>

            <LanguageSwitcher />
            
            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="text-carelink-slate hover:text-carelink-teal transition-colors font-medium"
                    data-testid="nav-dashboard"
                  >
                    {t('dashboard')}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="bg-carelink-navy text-white px-4 py-2 rounded-lg hover:bg-carelink-slate transition-colors font-medium"
                    data-testid="logout-btn"
                  >
                    {t('logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-carelink-slate hover:text-carelink-teal transition-colors font-medium"
                    data-testid="nav-login"
                  >
                    {t('login')}
                  </Link>
                  <Link
                    to="/register"
                    className="bg-carelink-teal text-white px-5 py-2 rounded-lg hover:bg-carelink-teal-medium transition-colors font-medium"
                    data-testid="nav-register"
                  >
                    {t('register')}
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-carelink-teal-pale/30 text-carelink-slate"
            >
              {mobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>

        {/* Search Bar (expandable) */}
        {showSearch && (
          <div className="pb-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חפש ספקים, שירותים..."
                className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-carelink-teal-pale focus:border-carelink-teal focus:outline-none"
                autoFocus
                data-testid="navbar-search-input"
              />
              <button
                type="submit"
                className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-carelink-teal hover:text-carelink-teal-medium"
              >
                <FaSearch />
              </button>
            </form>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-carelink-teal-pale pt-4">
            <div className="flex flex-col gap-2">
              <Link
                to="/providers"
                className="text-carelink-slate hover:text-carelink-teal px-3 py-2 transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('providers')}
              </Link>
              <Link
                to="/services"
                className="text-carelink-slate hover:text-carelink-teal px-3 py-2 transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('services')}
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/requests"
                    className="text-carelink-slate hover:text-carelink-teal px-3 py-2 transition-colors font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('requests')}
                  </Link>
                  <Link
                    to="/dashboard"
                    className="text-carelink-slate hover:text-carelink-teal px-3 py-2 transition-colors font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('dashboard')}
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="text-left text-red-600 hover:text-red-700 px-3 py-2 transition-colors font-medium"
                  >
                    {t('logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-carelink-slate hover:text-carelink-teal px-3 py-2 transition-colors font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('login')}
                  </Link>
                  <Link
                    to="/register"
                    className="bg-carelink-teal text-white px-3 py-2 rounded-lg text-center font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
