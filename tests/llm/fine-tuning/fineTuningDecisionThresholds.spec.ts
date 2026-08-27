import { expect, test } from '@playwright/test';

type FineTuningMetrics = {
  baselineAccuracy: number;
  targetAccuracy: number;
  consistencyScore: number;
  minimumConsistencyScore: number;
  promptTokens: number;
  maximumPromptTokens: number;
  averageLatencyMs: number;
  maximumAverageLatencyMs: number;
};

const shouldRecommendFineTuning = (metrics: FineTuningMetrics): boolean => {
  return (
    metrics.baselineAccuracy < metrics.targetAccuracy ||
    metrics.consistencyScore < metrics.minimumConsistencyScore ||
    metrics.promptTokens > metrics.maximumPromptTokens ||
    metrics.averageLatencyMs > metrics.maximumAverageLatencyMs
  );
};

test.describe('LLM - Fine-tuning - Decision Thresholds', () => {
  test('não deve recomendar fine-tuning quando todas as métricas estão dentro dos limites', () => {
    const metrics: FineTuningMetrics = {
      baselineAccuracy: 1,
      targetAccuracy: 0.95,
      consistencyScore: 0.98,
      minimumConsistencyScore: 0.9,
      promptTokens: 350,
      maximumPromptTokens: 1000,
      averageLatencyMs: 1800,
      maximumAverageLatencyMs: 5000,
    };

    const recommended = shouldRecommendFineTuning(metrics);

    console.log('\n=== Fine-tuning Threshold Decision ===');
    console.log({
      metrics,
      recommended,
    });

    expect(recommended).toBe(false);
  });

  test('deve recomendar fine-tuning quando alguma métrica ultrapassar o limite definido', () => {
    const metrics: FineTuningMetrics = {
      baselineAccuracy: 0.87,
      targetAccuracy: 0.95,
      consistencyScore: 0.82,
      minimumConsistencyScore: 0.9,
      promptTokens: 1400,
      maximumPromptTokens: 1000,
      averageLatencyMs: 6200,
      maximumAverageLatencyMs: 5000,
    };

    const recommended = shouldRecommendFineTuning(metrics);

    console.log('\n=== Fine-tuning Threshold Alert ===');
    console.log({
      metrics,
      recommended,
    });

    expect(recommended).toBe(true);
  });
});
