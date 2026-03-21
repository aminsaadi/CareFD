import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { SiteSettingsProvider, useSiteSettings } from './context/SiteSettingsContext';
import ProtectedRoute from './components/ProtectedRoute';
import CookieConsent from './components/CookieConsent';
import AccessibilityWidget from './components/AccessibilityWidget';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import ProviderRegister from './pages/ProviderRegister';
import Dashboard from './pages/Dashboard';
import Providers from './pages/Providers';
import Services from './pages/Services';
import Requests from './pages/Requests';
import ProviderSetup from './pages/ProviderSetup';
import ProviderProfile from './pages/ProviderProfile';
import ProviderEdit from './pages/ProviderEdit';
import BookService from './pages/BookService';
import MyBookings from './pages/MyBookings';
import RequestDetails from './pages/RequestDetails';
import ChatRoom from './pages/ChatRoom';
import ChatList from './pages/ChatList';
import ProviderDashboard from './pages/ProviderDashboard';
import AdminDashboard from './pages/AdminDashboard';
// Static Pages
import About from './pages/About';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Contact from './pages/Contact';
// New Admin Pages
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminProviders from './pages/admin/AdminProviders';
import AdminBookings from './pages/admin/AdminBookings';
import AdminVerification from './pages/admin/AdminVerification';
import AdminProfessions from './pages/admin/AdminProfessions';
import AdminRegions from './pages/admin/AdminRegions';
import AdminPages from './pages/admin/AdminPages';
import AdminBlog from './pages/admin/AdminBlog';
import AdminAds from './pages/admin/AdminAds';
import AdminFeatured from './pages/admin/AdminFeatured';
import AdminSettings from './pages/admin/AdminSettings';
import AdminReports from './pages/admin/AdminReports';
import AdminServices from './pages/admin/AdminServices';
import AdminServiceTypes from './pages/admin/AdminServiceTypes';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';
import AdminPushNotifications from './pages/admin/AdminPushNotifications';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminMessages from './pages/admin/AdminMessages';
import AdminProviderEdit from './pages/admin/AdminProviderEdit';
import Notifications from './pages/Notifications';
import VerificationRequest from './pages/VerificationRequest';
import WriteReview from './pages/WriteReview';
import AdminReviews from './pages/admin/AdminReviews';
import ScrollToTop from './components/ScrollToTop';
import SplashScreen, { shouldShowSplash } from './components/SplashScreen';
import GenericPage from './pages/GenericPage';
import './i18n';
import './App.css';

const RoleRedirect = ({ children, providerPath, adminPath }) => {
  const { user } = useAuth();
  if (user?.role === 'provider' && providerPath) {
    return <Navigate to={providerPath + (window.location.search || '')} replace />;
  }
  if (user?.role === 'admin' && adminPath) {
    return <Navigate to={adminPath} replace />;
  }
  return children;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-6">הדף לא נמצא</p>
      <a href="/" className="bg-carelink-teal text-white px-6 py-3 rounded-lg hover:bg-carelink-teal-medium transition">
        חזרה לדף הבית
      </a>
    </div>
  </div>
);

function AppRouter() {
  const [showSplash, setShowSplash] = React.useState(() => shouldShowSplash());

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <>
    <ScrollToTop />
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/register/provider" element={<ProviderRegister />} />
      <Route path="/providers" element={<Providers />} />
      <Route path="/services" element={<Services />} />
      <Route path="/providers/:providerId" element={<ProviderProfile />} />
      {/* Static Pages */}
      <Route path="/about" element={<About />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/contact" element={<Contact />} />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleRedirect providerPath="/provider/dashboard" adminPath="/admin/overview">
              <Dashboard />
            </RoleRedirect>
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests"
        element={
          <ProtectedRoute>
            <Requests />
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests/new"
        element={<Navigate to="/requests?create=true" replace />}
      />
      <Route
        path="/provider/setup"
        element={
          <ProtectedRoute>
            <ProviderSetup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/provider/edit/:providerId"
        element={
          <ProtectedRoute>
            <ProviderEdit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/book/:serviceId"
        element={<BookService />}
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <MyBookings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/review/:bookingId"
        element={
          <ProtectedRoute>
            <WriteReview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/verify-account"
        element={
          <ProtectedRoute>
            <VerificationRequest />
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests/:requestId"
        element={
          <ProtectedRoute>
            <RequestDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chats"
        element={
          <ProtectedRoute>
            <ChatList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:roomId"
        element={
          <ProtectedRoute>
            <ChatRoom />
          </ProtectedRoute>
        }
      />
      <Route
        path="/provider/dashboard"
        element={
          <ProtectedRoute>
            <ProviderDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminRoute><AdminOverview /></AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/overview"
        element={
          <ProtectedRoute>
            <AdminRoute><AdminOverview /></AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/old"
        element={
          <ProtectedRoute>
            <AdminRoute><AdminDashboard /></AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <AdminRoute><AdminUsers /></AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/providers"
        element={
          <ProtectedRoute>
            <AdminRoute><AdminProviders /></AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/verification"
        element={
          <ProtectedRoute>
            <AdminRoute><AdminVerification /></AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/bookings"
        element={
          <ProtectedRoute>
            <AdminRoute><AdminBookings /></AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/professions"
        element={
          <ProtectedRoute>
            <AdminRoute><AdminProfessions /></AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/regions"
        element={
          <ProtectedRoute>
            <AdminRoute><AdminRegions /></AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/pages"
        element={
          <ProtectedRoute>
            <AdminRoute><AdminPages /></AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/blog"
        element={
          <ProtectedRoute>
            <AdminRoute><AdminBlog /></AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/ads"
        element={
          <ProtectedRoute>
            <AdminRoute><AdminAds /></AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/featured"
        element={
          <ProtectedRoute>
            <AdminRoute><AdminFeatured /></AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute>
            <AdminRoute><AdminSettings /></AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute>
            <AdminRoute><AdminReports /></AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/services"
        element={
          <ProtectedRoute>
            <AdminRoute><AdminServices /></AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/service-types"
        element={
          <ProtectedRoute>
            <AdminRoute><AdminServiceTypes /></AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/subscriptions"
        element={
          <ProtectedRoute>
            <AdminRoute><AdminSubscriptions /></AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/push-notifications"
        element={
          <ProtectedRoute>
            <AdminRoute><AdminPushNotifications /></AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <ProtectedRoute>
            <AdminRoute><AdminNotifications /></AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/messages"
        element={
          <ProtectedRoute>
            <AdminRoute><AdminMessages /></AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reviews"
        element={
          <ProtectedRoute>
            <AdminRoute><AdminReviews /></AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/providers/:providerId/edit"
        element={
          <ProtectedRoute>
            <AdminRoute><AdminProviderEdit /></AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route path="/page/:slug" element={<GenericPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  );
}

function DynamicFavicon() {
  const { settings } = useSiteSettings();

  useEffect(() => {
    if (settings.favicon_url) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = settings.favicon_url;
      link.type = '';
    }
  }, [settings.favicon_url]);

  return null;
}

function App() {
  return (
    <SiteSettingsProvider>
      <DynamicFavicon />
      <AuthProvider>
        <BrowserRouter>
          <NotificationProvider>
            <AppRouter />
            <CookieConsent />
            <AccessibilityWidget />
          </NotificationProvider>
        </BrowserRouter>
      </AuthProvider>
    </SiteSettingsProvider>
  );
}

export default App;
