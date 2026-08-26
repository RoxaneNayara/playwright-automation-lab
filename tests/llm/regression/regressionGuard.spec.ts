import { expect, test } from '@playwright/test';

test.describe('LLM - Regression - Quality Guard', () => {
  test('deve impedir regressão de qualidade além da tolerância permitida', () => {
    const baselineScore = 0.95;
    const candidateScore = 0.91;

    const allowedRegression = 0.05;

    const minimumAcceptedScore = baselineScore - allowedRegression;

    console.log('\n=== Regression Guard ===');
    console.log({
      baselineScore,
      candidateScore,
      allowedRegression,
      minimumAcceptedScore,
    });

    expect(candidateScore).toBeGreaterThanOrEqual(minimumAcceptedScore);
  });
});
