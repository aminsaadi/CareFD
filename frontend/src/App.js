import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthCallback from './components/AuthCallback';
import CookieConsent from './components/CookieConsent';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
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
import './i18n';
import './App.css';

function AppRouter() {
  const location = useLocation();
  
  // Check URL fragment (not query params) for session_id
  // This must happen during render, not in useEffect, to avoid race conditions
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/register/provider" element={<ProviderRegister />} />
      <Route path="/providers" element={<Providers />} />
      <Route path="/services" element={<Services />} />
      <Route path="/providers/:providerId" element={<ProviderProfile />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Static Pages */}
      <Route path="/about" element={<About />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/contact" element={<Contact />} />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/providers"
        element={<Providers />}
      />
      <Route
        path="/services"
        element={<Services />}
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
        path="/provider/setup"
        element={
          <ProtectedRoute>
            <ProviderSetup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/providers/:providerId"
        element={<ProviderProfile />}
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
            <AdminOverview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/old"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/providers"
        element={
          <ProtectedRoute>
            <AdminProviders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/verification"
        element={
          <ProtectedRoute>
            <AdminVerification />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/bookings"
        element={
          <ProtectedRoute>
            <AdminBookings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/professions"
        element={
          <ProtectedRoute>
            <AdminProfessions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/regions"
        element={
          <ProtectedRoute>
            <AdminRegions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/pages"
        element={
          <ProtectedRoute>
            <AdminPages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/blog"
        element={
          <ProtectedRoute>
            <AdminBlog />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/ads"
        element={
          <ProtectedRoute>
            <AdminAds />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/featured"
        element={
          <ProtectedRoute>
            <AdminFeatured />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute>
            <AdminSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute>
            <AdminReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/services"
        element={
          <ProtectedRoute>
            <AdminServices />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/service-types"
        element={
          <ProtectedRoute>
            <AdminServiceTypes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/subscriptions"
        element={
          <ProtectedRoute>
            <AdminSubscriptions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/push-notifications"
        element={
          <ProtectedRoute>
            <AdminPushNotifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <ProtectedRoute>
            <AdminNotifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/messages"
        element={
          <ProtectedRoute>
            <AdminMessages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/providers/:providerId/edit"
        element={
          <ProtectedRoute>
            <AdminProviderEdit />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRouter />
        <CookieConsent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
