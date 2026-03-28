/**
 * Mock AI Grading Service
 * Generates random scores for development/testing purposes
 * Requirements: 4.5, 4.6, 4.9
 */

export interface MockAIResult {
  overall_score: number;
  criteria_scores: {
    rhythm: number;
    pitch: number;
    technique: number;
    expression: number;
  };
  feedback: string;
  suggestions: string[];
}

/**
 * Generate mock AI grading result with random scores (60-95)
 * @returns Mock AI grading result
 */
export function generateMockAIResult(): MockAIResult {
  // Generate random scores between 60-95 for each criterion
  const rhythm = Math.floor(Math.random() * 36) + 60;
  const pitch = Math.floor(Math.random() * 36) + 60;
  const technique = Math.floor(Math.random() * 36) + 60;
  const expression = Math.floor(Math.random() * 36) + 60;

  // Calculate overall score as average
  const overall = Math.round((rhythm + pitch + technique + expression) / 4);

  // Generate generic feedback based on overall score
  let feedback: string;
  if (overall >= 85) {
    feedback =
      'Excellent performance! Your technique and musicality are impressive. Keep up the great work and continue refining your skills.';
  } else if (overall >= 75) {
    feedback =
      'Good performance overall. You demonstrate solid understanding of the fundamentals. Focus on the areas highlighted below to improve further.';
  } else if (overall >= 65) {
    feedback =
      'Fair performance with room for improvement. Review the fundamentals and practice the suggested exercises to strengthen your skills.';
  } else {
    feedback =
      'Your performance shows potential but needs more practice. Focus on the basics and work through the improvement suggestions below.';
  }

  // Generate generic improvement suggestions
  const suggestions: string[] = [];

  if (rhythm < 75) {
    suggestions.push('Practice with a metronome to improve rhythm accuracy and timing');
  }
  if (pitch < 75) {
    suggestions.push('Work on pitch accuracy through ear training exercises');
  }
  if (technique < 75) {
    suggestions.push('Focus on proper hand positioning and finger technique');
  }
  if (expression < 75) {
    suggestions.push('Add more dynamic variation and emotional expression to your playing');
  }

  // Add general suggestions if score is good
  if (suggestions.length === 0) {
    suggestions.push('Continue practicing daily to maintain your skill level');
    suggestions.push('Try more challenging pieces to further develop your abilities');
    suggestions.push('Record yourself regularly to track your progress');
  }

  return {
    overall_score: overall,
    criteria_scores: {
      rhythm,
      pitch,
      technique,
      expression,
    },
    feedback,
    suggestions,
  };
}
