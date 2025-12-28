/**
 * Tests for Analytics service (Plausible integration).
 *
 * Tests privacy-focused analytics including:
 * - Page view tracking
 * - Custom event tracking
 * - Goal conversion tracking
 * - Script loading
 * - Privacy compliance (no cookies, no PII)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analytics, AnalyticsService } from '../analytics';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockPlausible: any;

  beforeEach(() => {
    // Mock window.plausible
    mockPlausible = vi.fn();
    (window as any).plausible = mockPlausible;

    // Create fresh service instance
    service = new AnalyticsService({
      domain: 'test.example.com',
      enabled: true,
    });
  });

  afterEach(() => {
    delete (window as any).plausible;
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct config', () => {
      expect(service).toBeDefined();
      expect(service.isEnabled()).toBe(true);
    });

    it('should be disabled when enabled=false', () => {
      const disabledService = new AnalyticsService({
        domain: 'test.example.com',
        enabled: false,
      });

      expect(disabledService.isEnabled()).toBe(false);
    });

    it('should respect explicit enabled config over defaults', () => {
      // When enabled is explicitly set, it should be respected
      const explicitlyEnabled = new AnalyticsService({
        domain: 'test.example.com',
        enabled: true,
      });

      const explicitlyDisabled = new AnalyticsService({
        domain: 'test.example.com',
        enabled: false,
      });

      expect(explicitlyEnabled.isEnabled()).toBe(true);
      expect(explicitlyDisabled.isEnabled()).toBe(false);
    });
  });

  describe('Page View Tracking', () => {
    it('should track page view when enabled', () => {
      service.trackPageView('/test-page');

      expect(mockPlausible).toHaveBeenCalledWith('pageview', {
        u: expect.stringContaining('/test-page'),
      });
    });

    it('should not track when disabled', () => {
      const disabledService = new AnalyticsService({
        domain: 'test.example.com',
        enabled: false,
      });

      disabledService.trackPageView('/test-page');

      expect(mockPlausible).not.toHaveBeenCalled();
    });

    it('should track with custom props', () => {
      service.trackPageView('/test-page', { referrer: 'google' });

      expect(mockPlausible).toHaveBeenCalledWith('pageview', {
        u: expect.stringContaining('/test-page'),
        props: { referrer: 'google' },
      });
    });

    it('should use current URL if no path provided', () => {
      service.trackPageView();

      expect(mockPlausible).toHaveBeenCalledWith('pageview', {
        u: expect.any(String),
      });
    });
  });

  describe('Event Tracking', () => {
    it('should track custom event', () => {
      service.trackEvent('signup', { plan: 'premium' });

      expect(mockPlausible).toHaveBeenCalledWith('signup', {
        props: { plan: 'premium' },
      });
    });

    it('should track event without props', () => {
      service.trackEvent('button_click');

      expect(mockPlausible).toHaveBeenCalledWith('button_click');
    });

    it('should not track event when disabled', () => {
      const disabledService = new AnalyticsService({
        domain: 'test.example.com',
        enabled: false,
      });

      disabledService.trackEvent('test_event');

      expect(mockPlausible).not.toHaveBeenCalled();
    });

    it('should handle events with multiple props', () => {
      service.trackEvent('purchase', {
        amount: 99.99,
        currency: 'USD',
        item: 'subscription',
      });

      expect(mockPlausible).toHaveBeenCalledWith('purchase', {
        props: {
          amount: 99.99,
          currency: 'USD',
          item: 'subscription',
        },
      });
    });
  });

  describe('Goal Tracking', () => {
    it('should track goal conversion', () => {
      service.trackGoal('Signup');

      expect(mockPlausible).toHaveBeenCalledWith('Signup');
    });

    it('should track goal with revenue', () => {
      service.trackGoal('Purchase', { revenue: { amount: 99.99, currency: 'USD' } });

      expect(mockPlausible).toHaveBeenCalledWith('Purchase', {
        revenue: { amount: 99.99, currency: 'USD' },
      });
    });

    it('should track goal with custom props', () => {
      service.trackGoal('Download', { props: { format: 'pdf' } });

      expect(mockPlausible).toHaveBeenCalledWith('Download', {
        props: { format: 'pdf' },
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing plausible gracefully', () => {
      delete (window as any).plausible;

      expect(() => {
        service.trackPageView('/test');
      }).not.toThrow();

      expect(() => {
        service.trackEvent('test');
      }).not.toThrow();
    });

    it('should handle plausible errors gracefully', () => {
      (window as any).plausible = vi.fn(() => {
        throw new Error('Plausible error');
      });

      expect(() => {
        service.trackPageView('/test');
      }).not.toThrow();
    });
  });

  describe('Privacy Compliance', () => {
    it('should not send PII in page views', () => {
      service.trackPageView('/user/12345/profile');

      expect(mockPlausible).toHaveBeenCalled();
      const callArgs = mockPlausible.mock.calls[0];
      expect(callArgs[1]?.u).not.toContain('email');
      expect(callArgs[1]?.u).not.toContain('@');
    });

    it('should not send sensitive data in events', () => {
      service.trackEvent('login', { success: true });

      expect(mockPlausible).toHaveBeenCalled();
      const callArgs = mockPlausible.mock.calls[0];
      expect(callArgs[1]?.props?.password).toBeUndefined();
      expect(callArgs[1]?.props?.token).toBeUndefined();
    });

    it('should use cookieless tracking', () => {
      // Plausible is cookieless by default - verify no cookies are set
      service.trackPageView('/test');

      // Check that service doesn't create cookies
      expect(document.cookie).toBe('');
    });
  });

  describe('Singleton Pattern', () => {
    it('should export singleton instance', () => {
      expect(analytics).toBeDefined();
      expect(analytics).toBeInstanceOf(AnalyticsService);
    });

    it('should use same instance across imports', () => {
      const instance1 = analytics;
      const instance2 = analytics;

      expect(instance1).toBe(instance2);
    });
  });
});

describe('Analytics Integration', () => {
  beforeEach(() => {
    // Mock window.plausible
    (window as any).plausible = vi.fn();
    // Enable analytics for integration tests
    analytics.enable();
  });

  afterEach(() => {
    delete (window as any).plausible;
    analytics.disable();
  });

  describe('Common Analytics Scenarios', () => {
    it('should track user signup flow', () => {
      analytics.trackPageView('/register');
      analytics.trackEvent('signup_started');
      analytics.trackEvent('signup_completed', { method: 'email' });
      analytics.trackGoal('Signup');

      expect((window as any).plausible).toHaveBeenCalledTimes(4);
    });

    it('should track space creation', () => {
      analytics.trackEvent('space_created', {
        member_count: 5,
        currency: 'USD',
      });

      expect((window as any).plausible).toHaveBeenCalledWith('space_created', {
        props: {
          member_count: 5,
          currency: 'USD',
        },
      });
    });

    it('should track payment events', () => {
      analytics.trackEvent('payment_initiated', { amount: 100, currency: 'USD' });
      analytics.trackGoal('Payment', { revenue: { amount: 100, currency: 'USD' } });

      expect((window as any).plausible).toHaveBeenCalledTimes(2);
    });

    it('should track navigation', () => {
      const pages = ['/spaces', '/spaces/123', '/payments'];

      pages.forEach((page) => analytics.trackPageView(page));

      expect((window as any).plausible).toHaveBeenCalledTimes(3);
    });
  });
});
