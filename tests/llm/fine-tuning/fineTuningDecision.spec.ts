import { expect, test } from '@playwright/test';

type FineTuningDecisionInput = {
  baselineAccuracy: number;
  targetAccuracy: number;
  hasConsistencyProblems: boolean;
  promptIsTooLarge: boolean;
  inferenceCostIsTooHigh: boolean;
  latencyIsTooHigh: boolean;
  requiresHighlySpecificBehavior: boolean;
};

type FineTuningDecision = {
  recommended: boolean;
  reasons: string[];
};

const evaluateFineTuningNeed = (input: FineTuningDecisionInput): FineTuningDecision => {
  const reasons: string[] = [];

  if (input.baselineAccuracy < input.targetAccuracy) {
    reasons.push('Baseline abaixo da qualidade esperada.');
  }

  if (input.hasConsistencyProblems) {
    reasons.push('Comportamento inconsistente entre execuções.');
  }

  if (input.promptIsTooLarge) {
    reasons.push('Prompt excessivamente grande.');
  }

  if (input.inferenceCostIsTooHigh) {
    reasons.push('Custo de inferência acima do desejado.');
  }

  if (input.latencyIsTooHigh) {
    reasons.push('Latência acima do limite esperado.');
  }

  if (input.requiresHighlySpecificBehavior) {
    reasons.push('A tarefa exige comportamento altamente específico.');
  }

  return {
    recommended: reasons.length > 0,
    reasons,
  };
};

test.describe('LLM - Fine-tuning - Decision Gate', () => {
  test('não deve recomendar fine-tuning quando o baseline já atende aos critérios', () => {
    const decision = evaluateFineTuningNeed({
      baselineAccuracy: 1,
      targetAccuracy: 0.95,
      hasConsistencyProblems: false,
      promptIsTooLarge: false,
      inferenceCostIsTooHigh: false,
      latencyIsTooHigh: false,
      requiresHighlySpecificBehavior: false,
    });

    console.log('\n=== Fine-tuning Decision ===');
    console.log(decision);

    expect(decision.recommended).toBe(false);
    expect(decision.reasons).toHaveLength(0);
  });

  test('deve recomendar fine-tuning quando houver justificativa objetiva', () => {
    const decision = evaluateFineTuningNeed({
      baselineAccuracy: 0.82,
      targetAccuracy: 0.95,
      hasConsistencyProblems: true,
      promptIsTooLarge: false,
      inferenceCostIsTooHigh: false,
      latencyIsTooHigh: false,
      requiresHighlySpecificBehavior: true,
    });

    console.log('\n=== Fine-tuning Recommended ===');
    console.log(decision);

    expect(decision.recommended).toBe(true);

    expect(decision.reasons).toContain('Baseline abaixo da qualidade esperada.');

    expect(decision.reasons).toContain('Comportamento inconsistente entre execuções.');

    expect(decision.reasons).toContain('A tarefa exige comportamento altamente específico.');
  });
});
