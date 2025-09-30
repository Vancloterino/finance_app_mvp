import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import LoadingSpinner from './ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { state } = useApp();
  const location = useLocation();

  // Show loading while checking authentication
  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!state.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;