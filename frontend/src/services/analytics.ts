/**
 * Privacy-focused analytics service using Plausible.
 *
 * Plausible is a lightweight, privacy-friendly alternative to Google Analytics:
 * - No cookies
 * - No personal data collection
 * - GDPR, CCPA, PECR compliant
 * - Lightweight (<1KB script)
 */

interface AnalyticsConfig {
  domain: string;
  enabled?: boolean;
  apiHost?: string;
}

interface PlausibleEvent {
  u?: string; // URL
  props?: Record<string, any>;
  revenue?: {
    amount: number;
    currency: string;
  };
}

declare global {
  interface Window {
    plausible?: (event: string, options?: PlausibleEvent) => void;
  }
}

export class AnalyticsService {
  private config: AnalyticsConfig;
  private enabled: boolean;

  constructor(config: AnalyticsConfig) {
    this.config = config;

    // Disable in development by default
    const isDevelopment = import.meta.env.MODE === 'development';
    this.enabled = config.enabled !== undefined ? config.enabled : !isDevelopment;
  }

  /**
   * Check if analytics is enabled.
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Track a page view.
   *
   * @param path - Optional path to track (defaults to current URL)
   * @param props - Optional custom properties
   */
  trackPageView(path?: string, props?: Record<string, any>): void {
    if (!this.enabled) return;

    try {
      const url = path ? `${window.location.origin}${path}` : window.location.href;

      const options: PlausibleEvent = { u: url };
      if (props) {
        options.props = props;
      }

      window.plausible?.('pageview', options);
    } catch (error) {
      // Silently fail - analytics should never break the app
      console.debug('Analytics error:', error);
    }
  }

  /**
   * Track a custom event.
   *
   * @param eventName - Name of the event (e.g., 'signup', 'purchase')
   * @param props - Optional event properties
   */
  trackEvent(eventName: string, props?: Record<string, any>): void {
    if (!this.enabled) return;

    try {
      if (props) {
        window.plausible?.(eventName, { props });
      } else {
        window.plausible?.(eventName);
      }
    } catch (error) {
      console.debug('Analytics error:', error);
    }
  }

  /**
   * Track a goal conversion.
   *
   * Goals are special events that you've configured in Plausible dashboard.
   *
   * @param goalName - Name of the goal (e.g., 'Signup', 'Purchase')
   * @param options - Optional revenue or custom props
   */
  trackGoal(
    goalName: string,
    options?: {
      revenue?: { amount: number; currency: string };
      props?: Record<string, any>;
    }
  ): void {
    if (!this.enabled) return;

    try {
      if (options) {
        window.plausible?.(goalName, options);
      } else {
        window.plausible?.(goalName);
      }
    } catch (error) {
      console.debug('Analytics error:', error);
    }
  }

  /**
   * Enable analytics tracking.
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable analytics tracking.
   */
  disable(): void {
    this.enabled = false;
  }
}

// Export singleton instance
export const analytics = new AnalyticsService({
  domain: window.location.hostname,
  // Enable in production, disable in development
  enabled: import.meta.env.MODE === 'production',
});

// Convenience exports for common events
export const trackPageView = (path?: string, props?: Record<string, any>) =>
  analytics.trackPageView(path, props);

export const trackEvent = (eventName: string, props?: Record<string, any>) =>
  analytics.trackEvent(eventName, props);

export const trackGoal = (
  goalName: string,
  options?: { revenue?: { amount: number; currency: string }; props?: Record<string, any> }
) => analytics.trackGoal(goalName, options);
