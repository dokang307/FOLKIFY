import { aiGradingQueue, emailQueue } from './queues';

describe('Queue Configuration', () => {
  describe('aiGradingQueue', () => {
    it('should be defined', () => {
      expect(aiGradingQueue).toBeDefined();
    });

    it('should have add method', () => {
      expect(aiGradingQueue.add).toBeDefined();
      expect(typeof aiGradingQueue.add).toBe('function');
    });
  });

  describe('emailQueue', () => {
    it('should be defined', () => {
      expect(emailQueue).toBeDefined();
    });

    it('should have add method', () => {
      expect(emailQueue.add).toBeDefined();
      expect(typeof emailQueue.add).toBe('function');
    });
  });
});
