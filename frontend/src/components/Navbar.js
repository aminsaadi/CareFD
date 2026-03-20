import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import NotificationBell from './NotificationBell';
import { FaSearch, FaBars, FaTimes, FaComments, FaUser, FaCog, FaSignOutAlt, FaTachometerAlt, FaChevronDown } from 'react-icons/fa';
import api from '../utils/api';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadChats, setUnreadChats] = useState(0);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadChats();
    }
  }, [isAuthenticated]);

  const fetchUnreadChats = async () => {
    try {
      const response = await api.get('/chat/rooms');
      const rooms = response.data.rooms || [];
      // Count rooms that actually have unread messages
      const unreadRooms = rooms.filter(room => room.unread_count > 0);
      setUnreadChats(unreadRooms.length);
    } catch (error) {
      console.error('Failed to fetch chat rooms:', error);
    }
  };

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (user?.role === 'admin') return '/admin/overview';
    if (user?.role === 'provider') return '/provider/dashboard';
    return '/dashboard';
  };

  const getUserInitials = () => {
    const name = user?.name || '';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return parts[0][0] + parts[1][0];
    return name.slice(0, 2);
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
            
            {/* Desktop Auth */}
            <div className="hidden md:flex items-center mr-2">
              {isAuthenticated ? (
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-carelink-teal-pale/30 transition-colors"
                    data-testid="profile-dropdown-btn"
                  >
                    {user?.picture ? (
                      <img
                        src={user.picture}
                        alt={user.name}
                        className="w-9 h-9 rounded-full object-cover border-2 border-carelink-teal"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-carelink-teal to-carelink-navy flex items-center justify-center text-white text-sm font-bold">
                        {getUserInitials()}
                      </div>
                    )}
                    <div className="text-right hidden lg:block">
                      <span className="text-sm font-medium text-carelink-navy leading-tight block">
                        שלום, {user?.name?.split(' ')[0] || 'משתמש'}
                      </span>
                      <span className="text-xs text-carelink-gray leading-tight block">
                        {user?.role === 'admin' ? 'מנהל' : user?.role === 'provider' ? 'ספק' : 'משתמש'}
                      </span>
                    </div>
                    <FaChevronDown className={`text-xs text-carelink-gray transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Profile Dropdown */}
                  {profileDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in">
                      {/* User info header */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          {user?.picture ? (
                            <img
                              src={user.picture}
                              alt={user.name}
                              className="w-11 h-11 rounded-full object-cover border-2 border-carelink-teal"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-carelink-teal to-carelink-navy flex items-center justify-center text-white font-bold">
                              {getUserInitials()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-carelink-navy text-sm truncate">{user?.name}</p>
                            <p className="text-xs text-carelink-gray truncate">{user?.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu items */}
                      <div className="py-1">
                        <Link
                          to={getDashboardPath()}
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-carelink-slate hover:bg-carelink-teal-pale/30 hover:text-carelink-teal transition-colors"
                          data-testid="nav-dashboard"
                        >
                          <FaTachometerAlt className="text-carelink-gray" />
                          <span>לוח בקרה</span>
                        </Link>
                        <Link
                          to="/dashboard?tab=overview"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-carelink-slate hover:bg-carelink-teal-pale/30 hover:text-carelink-teal transition-colors"
                        >
                          <FaUser className="text-carelink-gray" />
                          <span>הפרופיל שלי</span>
                        </Link>
                        <Link
                          to="/dashboard?tab=settings"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-carelink-slate hover:bg-carelink-teal-pale/30 hover:text-carelink-teal transition-colors"
                        >
                          <FaCog className="text-carelink-gray" />
                          <span>הגדרות</span>
                        </Link>
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-100 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          data-testid="logout-btn"
                        >
                          <FaSignOutAlt />
                          <span>התנתקות</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
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
                </div>
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
                  {/* Mobile user info */}
                  <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-carelink-teal-pale/20 rounded-xl">
                    {user?.picture ? (
                      <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full object-cover border-2 border-carelink-teal" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-carelink-teal to-carelink-navy flex items-center justify-center text-white font-bold">
                        {getUserInitials()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-carelink-navy text-sm">שלום, {user?.name || 'משתמש'}</p>
                      <p className="text-xs text-carelink-gray">{user?.email}</p>
                    </div>
                  </div>
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
                    to={getDashboardPath()}
                    className="text-carelink-slate hover:text-carelink-teal px-3 py-2 transition-colors font-medium flex items-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FaTachometerAlt />
                    לוח בקרה
                  </Link>
                  <Link
                    to="/dashboard?tab=overview"
                    className="text-carelink-slate hover:text-carelink-teal px-3 py-2 transition-colors font-medium flex items-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FaUser />
                    הפרופיל שלי
                  </Link>
                  <Link
                    to="/dashboard?tab=settings"
                    className="text-carelink-slate hover:text-carelink-teal px-3 py-2 transition-colors font-medium flex items-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FaCog />
                    הגדרות
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="text-right text-red-600 hover:text-red-700 px-3 py-2 transition-colors font-medium flex items-center gap-2"
                  >
                    <FaSignOutAlt />
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
