import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import NotificationBell from './NotificationBell';
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
    <nav className="bg-white/80 backdrop-blur-xl border-b border-carelink-stone shadow-soft sticky top-0 z-40" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex justify-between h-22">
          <div className="flex items-center">
            <Link to="/" className="flex items-center" data-testid="logo-link">
              <Logo />
            </Link>
            
            {/* Desktop navigation links */}
            <div className="hidden md:flex mr-12 gap-2">
              <Link
                to="/providers"
                className="text-carelink-charcoal hover:text-carelink-teal px-5 py-3 rounded-xl transition-all duration-300 font-medium hover:bg-carelink-stone/50"
                data-testid="nav-providers"
              >
                {t('providers')}
              </Link>
              <Link
                to="/services"
                className="text-carelink-charcoal hover:text-carelink-teal px-5 py-3 rounded-xl transition-all duration-300 font-medium hover:bg-carelink-stone/50"
                data-testid="nav-services"
              >
                {t('services')}
              </Link>
              {isAuthenticated && (
                <Link
                  to="/requests"
                  className="text-carelink-charcoal hover:text-carelink-teal px-5 py-3 rounded-xl transition-all duration-300 font-medium hover:bg-carelink-stone/50"
                  data-testid="nav-requests"
                >
                  {t('requests')}
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Icon */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-3 rounded-xl hover:bg-carelink-stone text-carelink-gray hover:text-carelink-teal transition-all duration-300"
              data-testid="search-icon-btn"
            >
              <FaSearch className="text-lg" />
            </button>

            {/* Notifications */}
            {isAuthenticated && <NotificationBell />}

            <LanguageSwitcher />
            
            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-3 mr-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to={user?.role === 'admin' ? '/admin/overview' : user?.role === 'provider' ? '/provider/dashboard' : '/dashboard'}
                    className="text-carelink-charcoal hover:text-carelink-teal transition-all duration-300 font-medium px-4 py-2"
                    data-testid="nav-dashboard"
                  >
                    {t('dashboard')}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="bg-carelink-deep text-white px-6 py-2.5 rounded-xl hover:bg-carelink-charcoal transition-all duration-300 font-medium shadow-soft hover:shadow-soft-md"
                    data-testid="logout-btn"
                  >
                    {t('logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-carelink-charcoal hover:text-carelink-teal transition-all duration-300 font-medium px-4 py-2"
                    data-testid="nav-login"
                  >
                    {t('login')}
                  </Link>
                  <Link
                    to="/register"
                    className="bg-carelink-deep text-white px-6 py-2.5 rounded-xl hover:bg-carelink-charcoal transition-all duration-300 font-medium shadow-soft hover:shadow-soft-md"
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
              className="md:hidden p-3 rounded-xl hover:bg-carelink-stone text-carelink-charcoal transition-all duration-300"
            >
              {mobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>

        {/* Search Bar (expandable) */}
        {showSearch && (
          <div className="pb-6 animate-fade-in">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חפש ספקים, שירותים..."
                className="input-premium pr-14"
                autoFocus
                data-testid="navbar-search-input"
              />
              <button
                type="submit"
                className="absolute left-5 rtl:left-auto rtl:right-5 top-1/2 -translate-y-1/2 text-carelink-teal hover:text-carelink-navy transition-colors"
              >
                <FaSearch />
              </button>
            </form>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-6 border-t border-carelink-stone pt-6 animate-fade-in">
            <div className="flex flex-col gap-2">
              <Link
                to="/providers"
                className="text-carelink-charcoal hover:text-carelink-teal px-4 py-3 rounded-xl transition-all duration-300 font-medium hover:bg-carelink-stone"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('providers')}
              </Link>
              <Link
                to="/services"
                className="text-carelink-charcoal hover:text-carelink-teal px-4 py-3 rounded-xl transition-all duration-300 font-medium hover:bg-carelink-stone"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('services')}
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/requests"
                    className="text-carelink-charcoal hover:text-carelink-teal px-4 py-3 rounded-xl transition-all duration-300 font-medium hover:bg-carelink-stone"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('requests')}
                  </Link>
                  <Link
                    to={user?.role === 'admin' ? '/admin/overview' : user?.role === 'provider' ? '/provider/dashboard' : '/dashboard'}
                    className="text-carelink-charcoal hover:text-carelink-teal px-4 py-3 rounded-xl transition-all duration-300 font-medium hover:bg-carelink-stone"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('dashboard')}
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="text-right text-red-600 hover:text-red-700 px-4 py-3 rounded-xl transition-all duration-300 font-medium hover:bg-red-50"
                  >
                    {t('logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-carelink-charcoal hover:text-carelink-teal px-4 py-3 rounded-xl transition-all duration-300 font-medium hover:bg-carelink-stone"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('login')}
                  </Link>
                  <Link
                    to="/register"
                    className="bg-carelink-deep text-white px-4 py-3 rounded-xl text-center font-medium shadow-soft"
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
