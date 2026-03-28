import { metricsService } from './metrics.service';

describe('Metrics Service', () => {
  beforeEach(() => {
    // Reset metrics before each test
    metricsService.reset();
  });

  describe('trackRequest', () => {
    it('should track successful requests', () => {
      metricsService.trackRequest(100, 200);
      metricsService.trackRequest(150, 200);
      metricsService.trackRequest(200, 200);

      const metrics = metricsService.getMetrics();

      expect(metrics.requestCount).toBe(3);
      expect(metrics.errorRate).toBe(0);
      expect(metrics.avgResponseTime).toBe(150); // (100 + 150 + 200) / 3
    });

    it('should track error requests (4xx status codes)', () => {
      metricsService.trackRequest(100, 200);
      metricsService.trackRequest(150, 400);
      metricsService.trackRequest(200, 404);

      const metrics = metricsService.getMetrics();

      expect(metrics.requestCount).toBe(3);
      expect(metrics.errorRate).toBe(66.67); // 2 errors out of 3 requests
      expect(metrics.avgResponseTime).toBe(150);
    });

    it('should track error requests (5xx status codes)', () => {
      metricsService.trackRequest(100, 200);
      metricsService.trackRequest(150, 500);
      metricsService.trackRequest(200, 503);

      const metrics = metricsService.getMetrics();

      expect(metrics.requestCount).toBe(3);
      expect(metrics.errorRate).toBe(66.67); // 2 errors out of 3 requests
    });

    it('should calculate average response time correctly', () => {
      metricsService.trackRequest(100, 200);
      metricsService.trackRequest(200, 200);
      metricsService.trackRequest(300, 200);

      const metrics = metricsService.getMetrics();

      expect(metrics.avgResponseTime).toBe(200); // (100 + 200 + 300) / 3
    });

    it('should keep only last 1000 response times', () => {
      // Track 1500 requests
      for (let i = 0; i < 1500; i++) {
        metricsService.trackRequest(100, 200);
      }

      const metrics = metricsService.getMetrics();

      expect(metrics.requestCount).toBe(1500);
      // avgResponseTime should still be calculated from last 1000 only
      expect(metrics.avgResponseTime).toBe(100);
    });

    it('should handle zero requests', () => {
      const metrics = metricsService.getMetrics();

      expect(metrics.requestCount).toBe(0);
      expect(metrics.errorRate).toBe(0);
      expect(metrics.avgResponseTime).toBe(0);
    });

    it('should calculate error rate as percentage', () => {
      // 1 error out of 4 requests = 25%
      metricsService.trackRequest(100, 200);
      metricsService.trackRequest(150, 200);
      metricsService.trackRequest(200, 200);
      metricsService.trackRequest(250, 500);

      const metrics = metricsService.getMetrics();

      expect(metrics.errorRate).toBe(25);
    });

    it('should round average response time to nearest integer', () => {
      metricsService.trackRequest(100, 200);
      metricsService.trackRequest(101, 200);
      metricsService.trackRequest(102, 200);

      const metrics = metricsService.getMetrics();

      expect(metrics.avgResponseTime).toBe(101); // (100 + 101 + 102) / 3 = 101
    });

    it('should track mixed success and error requests', () => {
      metricsService.trackRequest(100, 200);
      metricsService.trackRequest(150, 201);
      metricsService.trackRequest(200, 400);
      metricsService.trackRequest(250, 404);
      metricsService.trackRequest(300, 500);

      const metrics = metricsService.getMetrics();

      expect(metrics.requestCount).toBe(5);
      expect(metrics.errorRate).toBe(60); // 3 errors out of 5 requests
      expect(metrics.avgResponseTime).toBe(200); // (100 + 150 + 200 + 250 + 300) / 5
    });
  });

  describe('reset', () => {
    it('should reset all metrics to zero', () => {
      metricsService.trackRequest(100, 200);
      metricsService.trackRequest(150, 400);
      metricsService.trackRequest(200, 500);

      metricsService.reset();

      const metrics = metricsService.getMetrics();

      expect(metrics.requestCount).toBe(0);
      expect(metrics.errorRate).toBe(0);
      expect(metrics.avgResponseTime).toBe(0);
    });
  });

  describe('getMetrics', () => {
    it('should return current metrics snapshot', () => {
      metricsService.trackRequest(100, 200);
      metricsService.trackRequest(200, 200);

      const metrics1 = metricsService.getMetrics();
      expect(metrics1.requestCount).toBe(2);

      metricsService.trackRequest(300, 200);

      const metrics2 = metricsService.getMetrics();
      expect(metrics2.requestCount).toBe(3);
    });

    it('should format error rate to 2 decimal places', () => {
      // 1 error out of 3 requests = 33.333...%
      metricsService.trackRequest(100, 200);
      metricsService.trackRequest(150, 200);
      metricsService.trackRequest(200, 500);

      const metrics = metricsService.getMetrics();

      expect(metrics.errorRate).toBe(33.33);
    });
  });
});
