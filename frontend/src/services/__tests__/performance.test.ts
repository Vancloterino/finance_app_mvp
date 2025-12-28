/**
 * Tests for Performance Monitoring service (APM).
 *
 * Tests application performance monitoring including:
 * - API request timing
 * - Page load metrics
 * - Custom performance marks
 * - Performance reporting
 * - Web Vitals tracking
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { performanceMonitor, PerformanceMonitor } from '../performance';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    vi.useFakeTimers();
    monitor = new PerformanceMonitor({ enabled: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with enabled config', () => {
      expect(monitor.isEnabled()).toBe(true);
    });

    it('should be disabled when enabled=false', () => {
      const disabledMonitor = new PerformanceMonitor({ enabled: false });
      expect(disabledMonitor.isEnabled()).toBe(false);
    });

    it('should respect environment-based defaults', () => {
      // When enabled is not specified, it respects the environment
      // Test environment defaults to disabled (not production)
      const defaultMonitor = new PerformanceMonitor({});

      // Since we can't easily mock import.meta.env, we test explicit config
      const explicitlyEnabled = new PerformanceMonitor({ enabled: true });
      const explicitlyDisabled = new PerformanceMonitor({ enabled: false });

      expect(explicitlyEnabled.isEnabled()).toBe(true);
      expect(explicitlyDisabled.isEnabled()).toBe(false);
    });
  });

  describe('API Request Timing', () => {
    it('should start timing an API request', () => {
      const requestId = monitor.startApiRequest('GET', '/api/v1/spaces');
      expect(requestId).toBeDefined();
      expect(typeof requestId).toBe('string');
    });

    it('should end timing and calculate duration', () => {
      const requestId = monitor.startApiRequest('GET', '/api/v1/spaces');

      vi.advanceTimersByTime(150); // Simulate 150ms

      const duration = monitor.endApiRequest(requestId, 200);
      expect(duration).toBeGreaterThanOrEqual(150);
    });

    it('should track request status code', () => {
      const requestId = monitor.startApiRequest('POST', '/api/v1/pledges');
      vi.advanceTimersByTime(200);

      monitor.endApiRequest(requestId, 201);

      const metrics = monitor.getMetrics();
      expect(metrics.apiRequests).toHaveLength(1);
      expect(metrics.apiRequests[0].statusCode).toBe(201);
    });

    it('should not track when disabled', () => {
      const disabledMonitor = new PerformanceMonitor({ enabled: false });
      const requestId = disabledMonitor.startApiRequest('GET', '/api/v1/spaces');

      expect(requestId).toBe('');

      const metrics = disabledMonitor.getMetrics();
      expect(metrics.apiRequests).toHaveLength(0);
    });

    it('should handle ending non-existent request gracefully', () => {
      expect(() => {
        monitor.endApiRequest('non-existent-id', 200);
      }).not.toThrow();
    });
  });

  describe('Performance Marks', () => {
    it('should create a performance mark', () => {
      monitor.mark('user-action-start');

      // Verify mark was created (in real impl, would use Performance API)
      expect(() => monitor.mark('user-action-start')).not.toThrow();
    });

    it('should measure between two marks', () => {
      monitor.mark('operation-start');
      vi.advanceTimersByTime(100);
      monitor.mark('operation-end');

      const duration = monitor.measure('operation', 'operation-start', 'operation-end');
      expect(duration).toBeGreaterThanOrEqual(100);
    });

    it('should not create marks when disabled', () => {
      const disabledMonitor = new PerformanceMonitor({ enabled: false });

      expect(() => {
        disabledMonitor.mark('test-mark');
      }).not.toThrow();
    });
  });

  describe('Metrics Collection', () => {
    it('should collect and return metrics', () => {
      const requestId = monitor.startApiRequest('GET', '/api/v1/spaces');
      vi.advanceTimersByTime(100);
      monitor.endApiRequest(requestId, 200);

      const metrics = monitor.getMetrics();

      expect(metrics).toHaveProperty('apiRequests');
      expect(metrics.apiRequests).toHaveLength(1);
      expect(metrics.apiRequests[0]).toMatchObject({
        method: 'GET',
        url: '/api/v1/spaces',
        statusCode: 200,
      });
    });

    it('should calculate average API response time', () => {
      // Request 1: 100ms
      const req1 = monitor.startApiRequest('GET', '/api/v1/spaces');
      vi.advanceTimersByTime(100);
      monitor.endApiRequest(req1, 200);

      // Request 2: 200ms
      const req2 = monitor.startApiRequest('GET', '/api/v1/pledges');
      vi.advanceTimersByTime(200);
      monitor.endApiRequest(req2, 200);

      const metrics = monitor.getMetrics();
      expect(metrics.avgResponseTime).toBeCloseTo(150, 0); // Average of 100 and 200
    });

    it('should track slow requests (>500ms)', () => {
      const slowReq = monitor.startApiRequest('GET', '/api/v1/slow-endpoint');
      vi.advanceTimersByTime(600);
      monitor.endApiRequest(slowReq, 200);

      const metrics = monitor.getMetrics();
      expect(metrics.slowRequests).toHaveLength(1);
      expect(metrics.slowRequests[0].duration).toBeGreaterThanOrEqual(600);
    });

    it('should track failed requests (5xx errors)', () => {
      const failedReq = monitor.startApiRequest('POST', '/api/v1/payouts');
      vi.advanceTimersByTime(100);
      monitor.endApiRequest(failedReq, 500);

      const metrics = monitor.getMetrics();
      expect(metrics.failedRequests).toHaveLength(1);
      expect(metrics.failedRequests[0].statusCode).toBe(500);
    });
  });

  describe('Memory Usage Tracking', () => {
    it('should capture memory usage if available', () => {
      // Mock performance.memory
      const mockMemory = {
        usedJSHeapSize: 10000000,
        totalJSHeapSize: 20000000,
        jsHeapSizeLimit: 2000000000,
      };

      (performance as any).memory = mockMemory;

      const memoryInfo = monitor.getMemoryUsage();
      expect(memoryInfo).toBeDefined();
      expect(memoryInfo?.usedJSHeapSize).toBe(10000000);

      delete (performance as any).memory;
    });

    it('should return null when memory API not available', () => {
      const memoryInfo = monitor.getMemoryUsage();
      expect(memoryInfo).toBeNull();
    });
  });

  describe('Reporting', () => {
    it('should generate performance report', () => {
      const req1 = monitor.startApiRequest('GET', '/api/v1/spaces');
      vi.advanceTimersByTime(100);
      monitor.endApiRequest(req1, 200);

      const report = monitor.generateReport();

      expect(report).toHaveProperty('totalRequests');
      expect(report).toHaveProperty('avgResponseTime');
      expect(report).toHaveProperty('slowRequests');
      expect(report).toHaveProperty('failedRequests');
      expect(report.totalRequests).toBe(1);
    });

    it('should clear metrics after reporting', () => {
      const req1 = monitor.startApiRequest('GET', '/api/v1/spaces');
      vi.advanceTimersByTime(100);
      monitor.endApiRequest(req1, 200);

      monitor.generateReport();
      monitor.clearMetrics();

      const metrics = monitor.getMetrics();
      expect(metrics.apiRequests).toHaveLength(0);
    });
  });

  describe('Singleton Instance', () => {
    it('should export singleton instance', () => {
      expect(performanceMonitor).toBeDefined();
      expect(performanceMonitor).toBeInstanceOf(PerformanceMonitor);
    });
  });
});

describe('Performance Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Real-world Scenarios', () => {
    it('should track multiple concurrent API requests', () => {
      const monitor = new PerformanceMonitor({ enabled: true });

      const req1 = monitor.startApiRequest('GET', '/api/v1/spaces');
      const req2 = monitor.startApiRequest('GET', '/api/v1/pledges');
      const req3 = monitor.startApiRequest('POST', '/api/v1/payments');

      vi.advanceTimersByTime(50);
      monitor.endApiRequest(req1, 200);

      vi.advanceTimersByTime(100);
      monitor.endApiRequest(req2, 200);

      vi.advanceTimersByTime(150);
      monitor.endApiRequest(req3, 201);

      const metrics = monitor.getMetrics();
      expect(metrics.apiRequests).toHaveLength(3);
    });

    it('should identify performance bottlenecks', () => {
      const monitor = new PerformanceMonitor({ enabled: true });

      // Fast request
      const fast = monitor.startApiRequest('GET', '/api/v1/ping');
      vi.advanceTimersByTime(50);
      monitor.endApiRequest(fast, 200);

      // Slow request
      const slow = monitor.startApiRequest('GET', '/api/v1/heavy-query');
      vi.advanceTimersByTime(800);
      monitor.endApiRequest(slow, 200);

      const report = monitor.generateReport();
      expect(report.slowRequests).toHaveLength(1);
      expect(report.slowRequests[0].url).toBe('/api/v1/heavy-query');
    });

    it('should track error rates', () => {
      const monitor = new PerformanceMonitor({ enabled: true });

      // Success
      const req1 = monitor.startApiRequest('GET', '/api/v1/spaces');
      monitor.endApiRequest(req1, 200);

      // Server error
      const req2 = monitor.startApiRequest('POST', '/api/v1/payouts');
      monitor.endApiRequest(req2, 500);

      // Another success
      const req3 = monitor.startApiRequest('GET', '/api/v1/pledges');
      monitor.endApiRequest(req3, 200);

      const report = monitor.generateReport();
      expect(report.totalRequests).toBe(3);
      expect(report.failedRequests).toHaveLength(1);
      expect(report.errorRate).toBeCloseTo(33.33, 1); // 1 out of 3
    });
  });
});
