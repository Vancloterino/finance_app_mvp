/**
 * Application Performance Monitoring (APM) service.
 *
 * Lightweight performance monitoring for tracking:
 * - API request timing
 * - Slow requests (>500ms)
 * - Failed requests (5xx errors)
 * - Memory usage
 * - Custom performance marks
 */

interface PerformanceConfig {
  enabled?: boolean;
  slowRequestThreshold?: number; // milliseconds
}

interface ApiRequestMetric {
  id: string;
  method: string;
  url: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  statusCode?: number;
}

interface PerformanceMetrics {
  apiRequests: ApiRequestMetric[];
  slowRequests: ApiRequestMetric[];
  failedRequests: ApiRequestMetric[];
  avgResponseTime: number;
}

interface PerformanceReport {
  totalRequests: number;
  avgResponseTime: number;
  slowRequests: ApiRequestMetric[];
  failedRequests: ApiRequestMetric[];
  errorRate: number;
  timestamp: string;
}

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export class PerformanceMonitor {
  private enabled: boolean;
  private slowRequestThreshold: number;
  private activeRequests: Map<string, ApiRequestMetric>;
  private completedRequests: ApiRequestMetric[];
  private performanceMarks: Map<string, number>;

  constructor(config: PerformanceConfig) {
    // Disable in development by default
    const isDevelopment = import.meta.env.MODE === 'development';
    this.enabled = config.enabled !== undefined ? config.enabled : !isDevelopment;
    this.slowRequestThreshold = config.slowRequestThreshold || 500;
    this.activeRequests = new Map();
    this.completedRequests = [];
    this.performanceMarks = new Map();
  }

  /**
   * Check if monitoring is enabled.
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Start timing an API request.
   *
   * @param method - HTTP method
   * @param url - Request URL
   * @returns Request ID for tracking
   */
  startApiRequest(method: string, url: string): string {
    if (!this.enabled) return '';

    const id = `${method}-${url}-${Date.now()}-${Math.random()}`;
    const metric: ApiRequestMetric = {
      id,
      method,
      url,
      startTime: performance.now(),
    };

    this.activeRequests.set(id, metric);
    return id;
  }

  /**
   * End timing an API request.
   *
   * @param requestId - Request ID from startApiRequest
   * @param statusCode - HTTP status code
   * @returns Duration in milliseconds
   */
  endApiRequest(requestId: string, statusCode: number): number {
    if (!this.enabled || !requestId) return 0;

    const metric = this.activeRequests.get(requestId);
    if (!metric) return 0;

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;
    metric.statusCode = statusCode;

    this.activeRequests.delete(requestId);
    this.completedRequests.push(metric);

    return duration;
  }

  /**
   * Create a performance mark.
   *
   * @param name - Mark name
   */
  mark(name: string): void {
    if (!this.enabled) return;

    try {
      this.performanceMarks.set(name, performance.now());
      if (performance.mark) {
        performance.mark(name);
      }
    } catch (error) {
      console.debug('Performance mark error:', error);
    }
  }

  /**
   * Measure duration between two marks.
   *
   * @param name - Measure name
   * @param startMark - Start mark name
   * @param endMark - End mark name
   * @returns Duration in milliseconds
   */
  measure(name: string, startMark: string, endMark: string): number {
    if (!this.enabled) return 0;

    try {
      const startTime = this.performanceMarks.get(startMark);
      const endTime = this.performanceMarks.get(endMark);

      if (startTime === undefined || endTime === undefined) {
        return 0;
      }

      const duration = endTime - startTime;

      if (performance.measure) {
        performance.measure(name, startMark, endMark);
      }

      return duration;
    } catch (error) {
      console.debug('Performance measure error:', error);
      return 0;
    }
  }

  /**
   * Get current performance metrics.
   */
  getMetrics(): PerformanceMetrics {
    const slowRequests = this.completedRequests.filter(
      (req) => req.duration && req.duration > this.slowRequestThreshold
    );

    const failedRequests = this.completedRequests.filter(
      (req) => req.statusCode && req.statusCode >= 500
    );

    const totalDuration = this.completedRequests.reduce(
      (sum, req) => sum + (req.duration || 0),
      0
    );

    const avgResponseTime =
      this.completedRequests.length > 0 ? totalDuration / this.completedRequests.length : 0;

    return {
      apiRequests: [...this.completedRequests],
      slowRequests,
      failedRequests,
      avgResponseTime,
    };
  }

  /**
   * Get memory usage information (Chrome only).
   */
  getMemoryUsage(): MemoryInfo | null {
    try {
      const memory = (performance as any).memory;
      if (memory) {
        return {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        };
      }
    } catch (error) {
      console.debug('Memory API not available:', error);
    }
    return null;
  }

  /**
   * Generate performance report.
   */
  generateReport(): PerformanceReport {
    const metrics = this.getMetrics();
    const errorRate =
      metrics.apiRequests.length > 0
        ? (metrics.failedRequests.length / metrics.apiRequests.length) * 100
        : 0;

    return {
      totalRequests: metrics.apiRequests.length,
      avgResponseTime: metrics.avgResponseTime,
      slowRequests: metrics.slowRequests,
      failedRequests: metrics.failedRequests,
      errorRate,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Clear collected metrics.
   */
  clearMetrics(): void {
    this.completedRequests = [];
    this.performanceMarks.clear();
  }

  /**
   * Enable monitoring.
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable monitoring.
   */
  disable(): void {
    this.enabled = false;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor({
  enabled: import.meta.env.MODE === 'production',
  slowRequestThreshold: 500,
});

// Convenience exports
export const startApiRequest = (method: string, url: string) =>
  performanceMonitor.startApiRequest(method, url);

export const endApiRequest = (requestId: string, statusCode: number) =>
  performanceMonitor.endApiRequest(requestId, statusCode);

export const markPerformance = (name: string) => performanceMonitor.mark(name);

export const measurePerformance = (name: string, startMark: string, endMark: string) =>
  performanceMonitor.measure(name, startMark, endMark);

export const getPerformanceReport = () => performanceMonitor.generateReport();
