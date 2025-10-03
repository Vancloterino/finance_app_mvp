import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { StripeProvider } from './context/StripeContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SpacesPage from './pages/SpacesPage';
import SpaceDetailPage from './pages/SpaceDetailPage';
import SpaceSettingsPage from './pages/SpaceSettingsPage';
import PaymentsPage from './pages/PaymentsPage';

function App() {
  return (
    <AppProvider>
      <StripeProvider>
        <Router>
          <Layout>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

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

            {/* Placeholder routes for development */}
            <Route path="/account" element={
              <ProtectedRoute>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">My Account</h1>
                  <p className="text-gray-600">Account management coming soon...</p>
                </div>
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
          </Layout>
        </Router>
      </StripeProvider>
    </AppProvider>
  );
}

export default App;