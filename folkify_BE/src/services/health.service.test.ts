import { getHealthStatus } from './health.service';
import { databaseHealthCheck } from '../config/database';
import redisClient from '../config/redis';
import { aiGradingQueue, emailQueue } from '../config/queues';

// Mock dependencies
jest.mock('../config/database');
jest.mock('../config/redis');
jest.mock('../config/queues');
jest.mock('../utils/logger');

describe('Health Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getHealthStatus', () => {
    it('should return healthy status when all services are connected', async () => {
      // Mock all services as healthy
      (databaseHealthCheck as jest.Mock).mockResolvedValue(true);
      (redisClient.ping as jest.Mock).mockResolvedValue('PONG');
      (aiGradingQueue.count as jest.Mock).mockResolvedValue(0);
      (emailQueue.count as jest.Mock).mockResolvedValue(0);

      const result = await getHealthStatus();

      expect(result.status).toBe('healthy');
      expect(result.database).toBe('connected');
      expect(result.redis).toBe('connected');
      expect(result.queue).toBe('running');
      expect(result.diskSpace).toBeDefined();
      expect(result.uptime).toBeDefined();
    });

    it('should return unhealthy status when database is disconnected', async () => {
      // Mock database as unhealthy
      (databaseHealthCheck as jest.Mock).mockResolvedValue(false);
      (redisClient.ping as jest.Mock).mockResolvedValue('PONG');
      (aiGradingQueue.count as jest.Mock).mockResolvedValue(0);
      (emailQueue.count as jest.Mock).mockResolvedValue(0);

      const result = await getHealthStatus();

      expect(result.status).toBe('unhealthy');
      expect(result.database).toBe('disconnected');
      expect(result.redis).toBe('connected');
      expect(result.queue).toBe('running');
    });

    it('should return unhealthy status when Redis is disconnected', async () => {
      // Mock Redis as unhealthy
      (databaseHealthCheck as jest.Mock).mockResolvedValue(true);
      (redisClient.ping as jest.Mock).mockRejectedValue(new Error('Redis error'));
      (aiGradingQueue.count as jest.Mock).mockResolvedValue(0);
      (emailQueue.count as jest.Mock).mockResolvedValue(0);

      const result = await getHealthStatus();

      expect(result.status).toBe('unhealthy');
      expect(result.database).toBe('connected');
      expect(result.redis).toBe('disconnected');
      expect(result.queue).toBe('running');
    });

    it('should return unhealthy status when queue is stopped', async () => {
      // Mock queue as unhealthy
      (databaseHealthCheck as jest.Mock).mockResolvedValue(true);
      (redisClient.ping as jest.Mock).mockResolvedValue('PONG');
      (aiGradingQueue.count as jest.Mock).mockRejectedValue(new Error('Queue error'));

      const result = await getHealthStatus();

      expect(result.status).toBe('unhealthy');
      expect(result.database).toBe('connected');
      expect(result.redis).toBe('connected');
      expect(result.queue).toBe('stopped');
    });

    it('should handle database health check errors', async () => {
      // Mock database health check throwing error
      (databaseHealthCheck as jest.Mock).mockRejectedValue(new Error('DB error'));
      (redisClient.ping as jest.Mock).mockResolvedValue('PONG');
      (aiGradingQueue.count as jest.Mock).mockResolvedValue(0);
      (emailQueue.count as jest.Mock).mockResolvedValue(0);

      const result = await getHealthStatus();

      expect(result.status).toBe('unhealthy');
      expect(result.database).toBe('disconnected');
    });

    it('should include uptime in the response', async () => {
      // Mock all services as healthy
      (databaseHealthCheck as jest.Mock).mockResolvedValue(true);
      (redisClient.ping as jest.Mock).mockResolvedValue('PONG');
      (aiGradingQueue.count as jest.Mock).mockResolvedValue(0);
      (emailQueue.count as jest.Mock).mockResolvedValue(0);

      const result = await getHealthStatus();

      expect(result.uptime).toBeDefined();
      expect(typeof result.uptime).toBe('string');
      expect(result.uptime.length).toBeGreaterThan(0);
    });

    it('should include disk space in the response', async () => {
      // Mock all services as healthy
      (databaseHealthCheck as jest.Mock).mockResolvedValue(true);
      (redisClient.ping as jest.Mock).mockResolvedValue('PONG');
      (aiGradingQueue.count as jest.Mock).mockResolvedValue(0);
      (emailQueue.count as jest.Mock).mockResolvedValue(0);

      const result = await getHealthStatus();

      expect(result.diskSpace).toBeDefined();
      expect(typeof result.diskSpace).toBe('string');
    });
  });
});
