import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import NotificationBell from './NotificationBell';
import { FaSearch, FaBars, FaTimes, FaComments } from 'react-icons/fa';
import api from '../utils/api';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadChats, setUnreadChats] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadChats();
    }
  }, [isAuthenticated]);

  const fetchUnreadChats = async () => {
    try {
      const response = await api.get('/chat/rooms');
      // Count rooms with unread messages (simplified - in real app would track read status)
      const rooms = response.data.rooms || [];
      setUnreadChats(rooms.length > 0 ? Math.min(rooms.length, 9) : 0);
    } catch (error) {
      console.error('Failed to fetch chat rooms:', error);
    }
  };

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
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center" data-testid="logo-link">
              <Logo />
            </Link>
            
            {/* Desktop navigation links */}
            <div className="hidden md:flex mr-10 gap-1">
              <Link
                to="/providers"
                className="text-carelink-slate hover:text-carelink-teal px-4 py-2 rounded-lg transition-colors font-medium hover:bg-carelink-teal-pale/20"
                data-testid="nav-providers"
              >
                ספקים
              </Link>
              <Link
                to="/services"
                className="text-carelink-slate hover:text-carelink-teal px-4 py-2 rounded-lg transition-colors font-medium hover:bg-carelink-teal-pale/20"
                data-testid="nav-services"
              >
                שירותים
              </Link>
              {isAuthenticated && (
                <Link
                  to="/requests"
                  className="text-carelink-slate hover:text-carelink-teal px-4 py-2 rounded-lg transition-colors font-medium hover:bg-carelink-teal-pale/20"
                  data-testid="nav-requests"
                >
                  בקשות
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Icon */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2.5 rounded-lg hover:bg-carelink-teal-pale/30 text-carelink-slate hover:text-carelink-teal transition-colors"
              data-testid="search-icon-btn"
            >
              <FaSearch className="text-lg" />
            </button>

            {/* Chat Messages Icon - Only when authenticated */}
            {isAuthenticated && (
              <Link
                to="/chats"
                className="relative p-2.5 rounded-lg hover:bg-carelink-teal-pale/30 text-carelink-slate hover:text-carelink-teal transition-colors"
                data-testid="chat-icon"
              >
                <FaComments className="text-lg" />
                {unreadChats > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {unreadChats}
                  </span>
                )}
              </Link>
            )}

            {/* Notifications */}
            {isAuthenticated && <NotificationBell />}
            
            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-3 mr-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to={user?.role === 'admin' ? '/admin/overview' : user?.role === 'provider' ? '/provider/dashboard' : '/dashboard'}
                    className="text-carelink-slate hover:text-carelink-teal transition-colors font-medium px-3 py-2"
                    data-testid="nav-dashboard"
                  >
                    לוח בקרה
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="bg-carelink-navy text-white px-5 py-2 rounded-lg hover:bg-carelink-slate transition-colors font-medium"
                    data-testid="logout-btn"
                  >
                    התנתקות
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-carelink-slate hover:text-carelink-teal transition-colors font-medium px-3 py-2"
                    data-testid="nav-login"
                  >
                    התחברות
                  </Link>
                  <Link
                    to="/register"
                    className="bg-carelink-teal text-white px-5 py-2.5 rounded-lg hover:bg-carelink-teal-medium transition-colors font-medium"
                    data-testid="nav-register"
                  >
                    הרשמה
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-lg hover:bg-carelink-teal-pale/30 text-carelink-slate"
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
                ספקים
              </Link>
              <Link
                to="/services"
                className="text-carelink-slate hover:text-carelink-teal px-3 py-2 transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                שירותים
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/requests"
                    className="text-carelink-slate hover:text-carelink-teal px-3 py-2 transition-colors font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    בקשות
                  </Link>
                  <Link
                    to="/chats"
                    className="text-carelink-slate hover:text-carelink-teal px-3 py-2 transition-colors font-medium flex items-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FaComments />
                    הודעות
                    {unreadChats > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadChats}</span>
                    )}
                  </Link>
                  <Link
                    to={user?.role === 'admin' ? '/admin/overview' : user?.role === 'provider' ? '/provider/dashboard' : '/dashboard'}
                    className="text-carelink-slate hover:text-carelink-teal px-3 py-2 transition-colors font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    לוח בקרה
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="text-right text-red-600 hover:text-red-700 px-3 py-2 transition-colors font-medium"
                  >
                    התנתקות
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-carelink-slate hover:text-carelink-teal px-3 py-2 transition-colors font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    התחברות
                  </Link>
                  <Link
                    to="/register"
                    className="bg-carelink-teal text-white px-3 py-2 rounded-lg text-center font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    הרשמה
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
