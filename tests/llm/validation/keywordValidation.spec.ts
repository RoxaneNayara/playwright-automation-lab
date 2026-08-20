import { test, expect } from '@playwright/test';

test.describe('LLM - Fundamentals - Keyword Validation', () => {
  test('deve demonstrar falso positivo na validação por palavra-chave', async () => {
    const simulatedResponse =
      'Smoke testing não valida funcionalidades principais antes de testes aprofundados.';

    const actualAnswer = simulatedResponse.trim().toLowerCase();

    const acceptedTerms = ['críticas', 'críticos', 'essenciais', 'principais', 'fundamentais'];

    const containsRelevantTerm = acceptedTerms.some((term) => actualAnswer.includes(term));

    const negativePatterns = ['não valida', 'não verifica', 'não testa', 'não confirma'];

    const containsContradiction = negativePatterns.some((pattern) =>
      actualAnswer.includes(pattern)
    );

    expect(containsRelevantTerm).toBeTruthy();
    expect(containsContradiction).toBeFalsy();
  });
});
