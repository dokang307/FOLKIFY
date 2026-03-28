import logger from '../utils/logger';

/**
 * Metrics Tracking Service
 * Validates: Requirements 23.1, 23.2, 23.3, 23.4, 23.8, 21.6, 21.7
 */

export interface MetricsData {
  requestCount: number;
  errorRate: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  cacheHitRate: number;
  slowQueryCount: number;
}

class MetricsService {
  private requestCount: number = 0;
  private errorCount: number = 0;
  private responseTimes: number[] = [];
  private readonly MAX_RESPONSE_TIMES = 1000;

  // Cache metrics
  private cacheHits: number = 0;
  private cacheMisses: number = 0;

  // Slow query tracking
  private slowQueryCount: number = 0;

  // Performance monitoring intervals
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly MONITORING_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Start performance monitoring
   * Monitors error rate, response times, and cache hit rate
   */
  startMonitoring(): void {
    if (this.monitoringInterval) {
      return; // Already monitoring
    }

    this.monitoringInterval = setInterval(() => {
      this.checkPerformanceThresholds();
    }, this.MONITORING_WINDOW_MS);

    logger.info('Performance monitoring started (5-minute intervals)');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('Performance monitoring stopped');
    }
  }

  /**
   * Check performance thresholds and log warnings
   * Requirements: 23.3, 23.4
   */
  private checkPerformanceThresholds(): void {
    const metrics = this.getMetrics();

    // Check error rate > 5%
    if (metrics.errorRate > 5) {
      logger.warn(
        `High error rate detected: ${metrics.errorRate}% (threshold: 5%) over last 5 minutes`
      );
    }

    // Check P95 response time > 1 second
    if (metrics.p95ResponseTime > 1000) {
      logger.warn(
        `High P95 response time detected: ${metrics.p95ResponseTime}ms (threshold: 1000ms) over last 5 minutes`
      );
    }

    // Check cache hit rate < 70%
    if (metrics.cacheHitRate < 70 && this.cacheHits + this.cacheMisses > 0) {
      logger.warn(
        `Low cache hit rate detected: ${metrics.cacheHitRate}% (threshold: 70%) over last 5 minutes`
      );
    }

    // Log slow query count if any
    if (this.slowQueryCount > 0) {
      logger.warn(
        `Slow queries detected: ${this.slowQueryCount} queries took >1s over last 5 minutes`
      );
    }
  }

  /**
   * Track a request
   */
  trackRequest(responseTime: number, statusCode: number): void {
    this.requestCount++;

    // Track response time
    this.responseTimes.push(responseTime);

    // Keep only last 1000 response times
    if (this.responseTimes.length > this.MAX_RESPONSE_TIMES) {
      this.responseTimes.shift();
    }

    // Track errors (4xx and 5xx status codes)
    if (statusCode >= 400) {
      this.errorCount++;
    }
  }

  /**
   * Track cache hit
   */
  trackCacheHit(): void {
    this.cacheHits++;
  }

  /**
   * Track cache miss
   */
  trackCacheMiss(): void {
    this.cacheMisses++;
  }

  /**
   * Track slow query (> 1 second)
   * Requirements: 21.6
   */
  trackSlowQuery(duration: number, query: string): void {
    this.slowQueryCount++;
    logger.warn(`Slow query detected (${duration}ms): ${query.substring(0, 200)}`);
  }

  /**
   * Calculate P95 response time
   */
  private calculateP95(): number {
    if (this.responseTimes.length === 0) return 0;

    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    return Math.round(sorted[p95Index] || 0);
  }

  /**
   * Get current metrics
   */
  getMetrics(): MetricsData {
    const avgResponseTime =
      this.responseTimes.length > 0
        ? Math.round(this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length)
        : 0;

    const errorRate =
      this.requestCount > 0
        ? parseFloat(((this.errorCount / this.requestCount) * 100).toFixed(2))
        : 0;

    const p95ResponseTime = this.calculateP95();

    const totalCacheRequests = this.cacheHits + this.cacheMisses;
    const cacheHitRate =
      totalCacheRequests > 0
        ? parseFloat(((this.cacheHits / totalCacheRequests) * 100).toFixed(2))
        : 0;

    return {
      requestCount: this.requestCount,
      errorRate,
      avgResponseTime,
      p95ResponseTime,
      cacheHitRate,
      slowQueryCount: this.slowQueryCount,
    };
  }

  /**
   * Reset metrics (for testing)
   */
  reset(): void {
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimes = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.slowQueryCount = 0;
  }
}

// Export singleton instance
export const metricsService = new MetricsService();
