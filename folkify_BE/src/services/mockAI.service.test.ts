import { generateMockAIResult } from './mockAI.service';

describe('MockAI Service', () => {
  describe('generateMockAIResult', () => {
    it('should generate scores between 60-95', () => {
      const result = generateMockAIResult();

      expect(result.criteria_scores.rhythm).toBeGreaterThanOrEqual(60);
      expect(result.criteria_scores.rhythm).toBeLessThanOrEqual(95);

      expect(result.criteria_scores.pitch).toBeGreaterThanOrEqual(60);
      expect(result.criteria_scores.pitch).toBeLessThanOrEqual(95);

      expect(result.criteria_scores.technique).toBeGreaterThanOrEqual(60);
      expect(result.criteria_scores.technique).toBeLessThanOrEqual(95);

      expect(result.criteria_scores.expression).toBeGreaterThanOrEqual(60);
      expect(result.criteria_scores.expression).toBeLessThanOrEqual(95);
    });

    it('should calculate overall score as average of criteria scores', () => {
      const result = generateMockAIResult();

      const { rhythm, pitch, technique, expression } = result.criteria_scores;
      const expectedAverage = Math.round((rhythm + pitch + technique + expression) / 4);

      expect(result.overall_score).toBe(expectedAverage);
    });

    it('should return feedback string', () => {
      const result = generateMockAIResult();

      expect(result.feedback).toBeDefined();
      expect(typeof result.feedback).toBe('string');
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('should return array of suggestions', () => {
      const result = generateMockAIResult();

      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should generate different results on multiple calls', () => {
      const result1 = generateMockAIResult();
      const result2 = generateMockAIResult();

      // At least one score should be different (very high probability with random generation)
      const scoresAreDifferent =
        result1.criteria_scores.rhythm !== result2.criteria_scores.rhythm ||
        result1.criteria_scores.pitch !== result2.criteria_scores.pitch ||
        result1.criteria_scores.technique !== result2.criteria_scores.technique ||
        result1.criteria_scores.expression !== result2.criteria_scores.expression;

      expect(scoresAreDifferent).toBe(true);
    });
  });
});
