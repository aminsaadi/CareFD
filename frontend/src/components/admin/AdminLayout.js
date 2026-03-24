import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
  FiHome, FiUsers, FiBriefcase, FiCalendar, FiGrid, FiMapPin,
  FiFileText, FiImage, FiSettings, FiMessageSquare, FiBell,
  FiDollarSign, FiShield, FiLogOut, FiMenu, FiX, FiChevronDown,
  FiBook, FiLayout, FiTag, FiStar, FiBarChart2, FiGlobe
} from 'react-icons/fi';

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState(['content', 'management']);
  const [badgeCounts, setBadgeCounts] = useState({ pendingReviews: 0, pendingVerifications: 0 });

  React.useEffect(() => {
    const fetchBadgeCounts = async () => {
      try {
        const [reviewsRes, providersRes] = await Promise.all([
          api.get('/admin/reviews?status=pending'),
          api.get('/admin/providers/pending')
        ]);
        setBadgeCounts({
          pendingReviews: reviewsRes.data.reviews?.length || 0,
          pendingVerifications: providersRes.data.total || 0
        });
      } catch (e) {
        console.warn('Failed to fetch badge counts:', e);
      }
    };
    fetchBadgeCounts();
    const interval = setInterval(fetchBadgeCounts, 60000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    {
      id: 'overview',
      label: 'סקירה כללית',
      icon: FiHome,
      path: '/admin'
    },
    {
      id: 'management',
      label: 'ניהול',
      icon: FiGrid,
      submenu: [
        { id: 'users', label: 'משתמשים', icon: FiUsers, path: '/admin/users' },
        { id: 'providers', label: 'ספקים', icon: FiBriefcase, path: '/admin/providers' },
        { id: 'verification', label: 'אימות ספקים', icon: FiShield, path: '/admin/verification', badgeKey: 'pendingVerifications' },
        { id: 'bookings', label: 'הזמנות', icon: FiCalendar, path: '/admin/bookings' },
        { id: 'reviews', label: 'ביקורות', icon: FiStar, path: '/admin/reviews', badgeKey: 'pendingReviews' },
        { id: 'services', label: 'שירותים', icon: FiTag, path: '/admin/services' },
      ]
    },
    {
      id: 'catalog',
      label: 'קטלוג',
      icon: FiTag,
      submenu: [
        { id: 'professions', label: 'מקצועות וקטגוריות', icon: FiGrid, path: '/admin/professions' },
        { id: 'regions', label: 'אזורים וערים', icon: FiMapPin, path: '/admin/regions' },
        { id: 'service-types', label: 'סוגי שירותים', icon: FiTag, path: '/admin/service-types' },
      ]
    },
    {
      id: 'content',
      label: 'תוכן',
      icon: FiFileText,
      submenu: [
        { id: 'pages', label: 'דפים סטטיים', icon: FiLayout, path: '/admin/pages' },
        { id: 'blog', label: 'בלוג', icon: FiBook, path: '/admin/blog' },
      ]
    },
    {
      id: 'marketing',
      label: 'שיווק',
      icon: FiStar,
      submenu: [
        { id: 'ads', label: 'פרסומות', icon: FiImage, path: '/admin/ads' },
        { id: 'featured', label: 'הבלטת ספקים', icon: FiStar, path: '/admin/featured' },
      ]
    },
    {
      id: 'business',
      label: 'עסקים',
      icon: FiDollarSign,
      submenu: [
        { id: 'subscriptions', label: 'מנויים', icon: FiDollarSign, path: '/admin/subscriptions' },
        { id: 'reports', label: 'דוחות', icon: FiBarChart2, path: '/admin/reports' },
      ]
    },
    {
      id: 'communication',
      label: 'תקשורת',
      icon: FiMessageSquare,
      submenu: [
        { id: 'notifications', label: 'הודעות מערכת', icon: FiBell, path: '/admin/notifications' },
        { id: 'push', label: 'התראות Push', icon: FiBell, path: '/admin/push-notifications' },
        { id: 'messages', label: 'הודעות', icon: FiMessageSquare, path: '/admin/messages' },
      ]
    },
    {
      id: 'settings',
      label: 'הגדרות',
      icon: FiSettings,
      submenu: [
        { id: 'site-settings', label: 'הגדרות אתר', icon: FiGlobe, path: '/admin/settings' },
        { id: 'app-settings', label: 'הגדרות אפליקציה', icon: FiLayout, path: '/admin/app-settings' },
      ]
    },
  ];

  const toggleMenu = (menuId) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/30 flex" dir="rtl">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 right-0 z-50 bg-white border-l border-gray-200 shadow-lg transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 bg-gradient-to-l from-carefd-teal/5 to-white">
          {sidebarOpen && (
            <Link to="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-carefd-teal to-carefd-navy rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CL</span>
              </div>
              <span className="text-carefd-navy font-bold">Admin Panel</span>
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-carefd-slate hover:text-carefd-navy hover:bg-carefd-teal/10 rounded-lg transition"
          >
            {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {menuItems.map((item) => (
            <div key={item.id} className="mb-1">
              {item.submenu ? (
                <>
                  <button
                    onClick={() => toggleMenu(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                      expandedMenus.includes(item.id)
                        ? 'bg-carefd-teal/10 text-carefd-navy'
                        : 'text-carefd-slate hover:text-carefd-navy hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} />
                      {sidebarOpen && <span>{item.label}</span>}
                    </div>
                    {sidebarOpen && (
                      <FiChevronDown 
                        size={16} 
                        className={`transition-transform ${expandedMenus.includes(item.id) ? 'rotate-180' : ''}`}
                      />
                    )}
                  </button>
                  {sidebarOpen && expandedMenus.includes(item.id) && (
                    <div className="mt-1 mr-4 space-y-1">
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.id}
                          to={subItem.path}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                            isActive(subItem.path)
                              ? 'bg-carefd-teal text-white shadow-md shadow-carefd-teal/30'
                              : 'text-carefd-slate hover:text-carefd-navy hover:bg-gray-50'
                          }`}
                        >
                          <subItem.icon size={16} />
                          <span>{subItem.label}</span>
                          {subItem.badgeKey && badgeCounts[subItem.badgeKey] > 0 && (
                            <span className="mr-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                              {badgeCounts[subItem.badgeKey]}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive(item.path)
                      ? 'bg-carefd-teal text-white shadow-md shadow-carefd-teal/30'
                      : 'text-carefd-slate hover:text-carefd-navy hover:bg-gray-50'
                  }`}
                >
                  <item.icon size={18} />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className={`flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-carefd-teal to-carefd-navy rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-medium">
                {user?.name?.[0] || 'A'}
              </span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-carefd-navy text-sm font-medium truncate">{user?.name || 'Admin'}</p>
                <p className="text-carefd-gray text-xs truncate">{user?.email}</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <div className="mt-3 flex gap-2">
              <Link
                to="/"
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 text-carefd-slate rounded-lg text-sm hover:bg-gray-50 transition"
              >
                <FiGlobe size={14} />
                לאתר
              </Link>
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm hover:bg-red-100 transition"
              >
                <FiLogOut size={14} />
                יציאה
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'mr-64' : 'mr-20'}`}>
        {/* Top Bar */}
        <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-40">
          <div>
            <h1 className="text-carefd-navy font-semibold">פאנל ניהול</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/admin/notifications"
              className="relative p-2 text-carefd-slate hover:text-carefd-navy hover:bg-carefd-teal/10 rounded-lg transition"
              title="הודעות מערכת"
            >
              <FiBell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Link>
            <Link 
              to="/admin/messages"
              className="relative p-2 text-carefd-slate hover:text-carefd-navy hover:bg-carefd-teal/10 rounded-lg transition"
              title="הודעות"
            >
              <FiMessageSquare size={20} />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
