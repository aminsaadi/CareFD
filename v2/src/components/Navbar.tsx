"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FaSearch, FaBars, FaTimes, FaComments, FaUser, FaCog, FaSignOutAlt, FaTachometerAlt, FaChevronDown } from 'react-icons/fa';
import NotificationBell from '@/components/NotificationBell';
import api from '@/lib/api-client';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadChats, setUnreadChats] = useState(0);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadChats();
      const interval = setInterval(fetchUnreadChats, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchUnreadChats = async () => {
    try {
      const data = await api.get<{ rooms: Array<{ unread_count: number }> }>('/chat/rooms');
      const rooms = data.rooms || [];
      const unreadRooms = rooms.filter(room => room.unread_count > 0);
      setUnreadChats(unreadRooms.length);
    } catch {
      // Silent fail
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    await logout();
    router.push('/login');
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/providers?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  return (
    <nav className="bg-white shadow-md border-b border-carefd-light-gray sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-carefd-navy">CareFD</span>
            </Link>

            {/* Desktop navigation links */}
            <div className="hidden md:flex me-10 gap-1">
              <Link href="/providers" className="text-carefd-slate hover:text-carefd-teal px-4 py-2 rounded-lg transition-colors font-medium hover:bg-carefd-teal-pale/20">
                ספקים
              </Link>
              <Link href="/services" className="text-carefd-slate hover:text-carefd-teal px-4 py-2 rounded-lg transition-colors font-medium hover:bg-carefd-teal-pale/20">
                שירותים
              </Link>
              {isAuthenticated && (
                <Link href="/requests" className="text-carefd-slate hover:text-carefd-teal px-4 py-2 rounded-lg transition-colors font-medium hover:bg-carefd-teal-pale/20">
                  בקשות
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Icon */}
            <button onClick={() => setShowSearch(!showSearch)} className="p-2.5 rounded-lg hover:bg-carefd-teal-pale/30 text-carefd-slate hover:text-carefd-teal transition-colors">
              <FaSearch className="text-lg" />
            </button>

            {/* Chat Messages Icon */}
            {isAuthenticated && (
              <Link href="/chats" className="relative p-2.5 rounded-lg hover:bg-carefd-teal-pale/30 text-carefd-slate hover:text-carefd-teal transition-colors">
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
            <div className="hidden md:flex items-center me-2">
              {isAuthenticated ? (
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-carefd-teal-pale/30 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-carefd-teal to-carefd-navy flex items-center justify-center text-white text-sm font-bold">
                      {getUserInitials()}
                    </div>
                    <div className="text-right hidden lg:block">
                      <span className="text-sm font-medium text-carefd-navy leading-tight block">
                        שלום, {user?.name?.split(' ')[0] || 'משתמש'}
                      </span>
                      <span className="text-xs text-carefd-gray leading-tight block">
                        {user?.role === 'admin' ? 'מנהל' : user?.role === 'provider' ? 'ספק' : 'משתמש'}
                      </span>
                    </div>
                    <FaChevronDown className={`text-xs text-carefd-gray transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-carefd-teal to-carefd-navy flex items-center justify-center text-white font-bold">
                            {getUserInitials()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-carefd-navy text-sm truncate">{user?.name}</p>
                            <p className="text-xs text-carefd-gray truncate">{user?.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="py-1">
                        <Link href={getDashboardPath()} onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-carefd-slate hover:bg-carefd-teal-pale/30 hover:text-carefd-teal transition-colors">
                          <FaTachometerAlt className="text-carefd-gray" /><span>לוח בקרה</span>
                        </Link>
                        <Link href="/dashboard?tab=overview" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-carefd-slate hover:bg-carefd-teal-pale/30 hover:text-carefd-teal transition-colors">
                          <FaUser className="text-carefd-gray" /><span>הפרופיל שלי</span>
                        </Link>
                        <Link href="/dashboard?tab=settings" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-carefd-slate hover:bg-carefd-teal-pale/30 hover:text-carefd-teal transition-colors">
                          <FaCog className="text-carefd-gray" /><span>הגדרות</span>
                        </Link>
                      </div>
                      <div className="border-t border-gray-100 pt-1">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                          <FaSignOutAlt /><span>התנתקות</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/login" className="text-carefd-slate hover:text-carefd-teal transition-colors font-medium px-3 py-2">
                    התחברות
                  </Link>
                  <Link href="/register" className="bg-carefd-teal text-white px-5 py-2.5 rounded-lg hover:bg-carefd-teal-medium transition-colors font-medium">
                    הרשמה
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2.5 rounded-lg hover:bg-carefd-teal-pale/30 text-carefd-slate" aria-label={mobileMenuOpen ? 'סגור תפריט' : 'פתח תפריט'}>
              {mobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="pb-4">
            <form onSubmit={handleSearch} className="relative">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="חפש ספקים, שירותים..." className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-carefd-teal-pale focus:border-carefd-teal focus:outline-none" autoFocus />
              <button type="submit" className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-carefd-teal hover:text-carefd-teal-medium">
                <FaSearch />
              </button>
            </form>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-carefd-teal-pale pt-4">
            <div className="flex flex-col gap-2">
              <Link href="/providers" className="text-carefd-slate hover:text-carefd-teal px-3 py-2 transition-colors font-medium" onClick={() => setMobileMenuOpen(false)}>ספקים</Link>
              <Link href="/services" className="text-carefd-slate hover:text-carefd-teal px-3 py-2 transition-colors font-medium" onClick={() => setMobileMenuOpen(false)}>שירותים</Link>
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-carefd-teal-pale/20 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-carefd-teal to-carefd-navy flex items-center justify-center text-white font-bold">{getUserInitials()}</div>
                    <div>
                      <p className="font-semibold text-carefd-navy text-sm">שלום, {user?.name || 'משתמש'}</p>
                      <p className="text-xs text-carefd-gray">{user?.email}</p>
                    </div>
                  </div>
                  <Link href="/requests" className="text-carefd-slate hover:text-carefd-teal px-3 py-2 transition-colors font-medium" onClick={() => setMobileMenuOpen(false)}>בקשות</Link>
                  <Link href="/chats" className="text-carefd-slate hover:text-carefd-teal px-3 py-2 transition-colors font-medium flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                    <FaComments />הודעות{unreadChats > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadChats}</span>}
                  </Link>
                  <Link href={getDashboardPath()} className="text-carefd-slate hover:text-carefd-teal px-3 py-2 transition-colors font-medium flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}><FaTachometerAlt />לוח בקרה</Link>
                  <Link href="/dashboard?tab=overview" className="text-carefd-slate hover:text-carefd-teal px-3 py-2 transition-colors font-medium flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}><FaUser />הפרופיל שלי</Link>
                  <Link href="/dashboard?tab=settings" className="text-carefd-slate hover:text-carefd-teal px-3 py-2 transition-colors font-medium flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}><FaCog />הגדרות</Link>
                  <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="text-right text-red-600 hover:text-red-700 px-3 py-2 transition-colors font-medium flex items-center gap-2"><FaSignOutAlt />התנתקות</button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-carefd-slate hover:text-carefd-teal px-3 py-2 transition-colors font-medium" onClick={() => setMobileMenuOpen(false)}>התחברות</Link>
                  <Link href="/register" className="bg-carefd-teal text-white px-3 py-2 rounded-lg text-center font-medium" onClick={() => setMobileMenuOpen(false)}>הרשמה</Link>
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
