import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
        { id: 'verification', label: 'אימות ספקים', icon: FiShield, path: '/admin/verification', badge: true },
        { id: 'bookings', label: 'הזמנות', icon: FiCalendar, path: '/admin/bookings' },
      ]
    },
    {
      id: 'catalog',
      label: 'קטלוג',
      icon: FiTag,
      submenu: [
        { id: 'professions', label: 'מקצועות וקטגוריות', icon: FiGrid, path: '/admin/professions' },
        { id: 'regions', label: 'אזורים וערים', icon: FiMapPin, path: '/admin/regions' },
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
        { id: 'messages', label: 'הודעות', icon: FiMessageSquare, path: '/admin/messages' },
      ]
    },
    {
      id: 'settings',
      label: 'הגדרות',
      icon: FiSettings,
      submenu: [
        { id: 'site-settings', label: 'הגדרות אתר', icon: FiGlobe, path: '/admin/settings' },
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
    <div className="min-h-screen bg-slate-900 flex" dir="rtl">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 right-0 z-50 bg-slate-800 border-l border-slate-700 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
          {sidebarOpen && (
            <Link to="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CL</span>
              </div>
              <span className="text-white font-bold">Admin Panel</span>
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
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
                        ? 'bg-slate-700/50 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
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
                              ? 'bg-indigo-600 text-white'
                              : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                          }`}
                        >
                          <subItem.icon size={16} />
                          <span>{subItem.label}</span>
                          {subItem.badge && (
                            <span className="mr-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                              3
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
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
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
        <div className="p-4 border-t border-slate-700">
          <div className={`flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-medium">
                {user?.name?.[0] || 'A'}
              </span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user?.name || 'Admin'}</p>
                <p className="text-slate-400 text-xs truncate">{user?.email}</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <div className="mt-3 flex gap-2">
              <Link
                to="/"
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600 transition"
              >
                <FiGlobe size={14} />
                לאתר
              </Link>
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm hover:bg-red-600/30 transition"
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
        <header className="h-16 bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 flex items-center justify-between px-6 sticky top-0 z-40">
          <div>
            <h1 className="text-white font-semibold">פאנל ניהול</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition">
              <FiBell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition">
              <FiMessageSquare size={20} />
            </button>
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
