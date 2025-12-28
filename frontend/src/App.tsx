import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { StripeProvider } from './context/StripeContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import OnboardingTour from './components/onboarding/OnboardingTour';
import { usePageTracking } from './hooks/usePageTracking';

// Lazy-loaded pages for code splitting
const HomePage = React.lazy(() => import('./pages/HomePage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const SpacesPage = React.lazy(() => import('./pages/SpacesPage'));
const SpaceDetailPage = React.lazy(() => import('./pages/SpaceDetailPage'));
const SpaceSettingsPage = React.lazy(() => import('./pages/SpaceSettingsPage'));
const PaymentsPage = React.lazy(() => import('./pages/PaymentsPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const PrivacyPolicyPage = React.lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = React.lazy(() => import('./pages/TermsOfServicePage'));
const ContactPage = React.lazy(() => import('./pages/ContactPage'));
const HelpPage = React.lazy(() => import('./pages/HelpPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/ResetPasswordPage'));
const VerifyEmailPage = React.lazy(() => import('./pages/VerifyEmailPage'));
const ResendVerificationPage = React.lazy(() => import('./pages/ResendVerificationPage'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Component to enable page tracking inside Router
const AppContent = () => {
  usePageTracking();

  return (
    <>
      <Layout>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/resend-verification" element={<ResendVerificationPage />} />

            {/* Protected routes */}
            <Route path="/spaces" element={
              <ProtectedRoute>
                <SpacesPage />
              </ProtectedRoute>
            } />

            <Route path="/spaces/:spaceId" element={
              <ProtectedRoute>
                <SpaceDetailPage />
              </ProtectedRoute>
            } />

            <Route path="/spaces/:spaceId/settings" element={
              <ProtectedRoute>
                <SpaceSettingsPage />
              </ProtectedRoute>
            } />

            <Route path="/account" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />

            <Route path="/payments" element={
              <ProtectedRoute>
                <PaymentsPage />
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Settings</h1>
                  <p className="text-gray-600">Settings coming soon...</p>
                </div>
              </ProtectedRoute>
            } />

            {/* 404 route */}
            <Route path="*" element={
              <div className="p-6 text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
                <p className="text-gray-600">The page you're looking for doesn't exist.</p>
              </div>
            } />
          </Routes>
        </Suspense>
      </Layout>
      <OnboardingTour />
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <ToastProvider>
          <StripeProvider>
            <Router>
              <AppContent />
            </Router>
          </StripeProvider>
        </ToastProvider>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;