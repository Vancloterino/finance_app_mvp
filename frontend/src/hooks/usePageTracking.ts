/**
 * Hook for automatic page view tracking.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '../services/analytics';

/**
 * Automatically track page views on route changes.
 */
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    analytics.trackPageView(location.pathname + location.search);
  }, [location]);
};
