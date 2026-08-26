import { expect, test } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Observability - Latency Budget Guard', () => {
  test('deve impedir que a latência média da suíte ultrapasse o limite definido', async () => {
    test.setTimeout(120_000);

    const client = new OpenAI();

    const model = 'gpt-5.6-luna';

    const scenarios = [
      {
        question: 'Por quanto tempo a conta fica bloqueada após cinco tentativas inválidas?',
        context: 'Após cinco tentativas inválidas de login, a conta é bloqueada por 30 minutos.',
      },
      {
        question: 'O que acontece durante o período de bloqueio?',
        context: 'Durante o bloqueio, novas tentativas de autenticação não são permitidas.',
      },
      {
        question: 'Qual é o prazo médio para a primeira resposta do suporte?',
        context: 'O prazo médio para a primeira resposta é de até quatro horas úteis.',
      },
      {
        question: 'Em quais dias e horários o suporte funciona?',
        context: 'O suporte funciona de segunda a sexta das 8h às 18h.',
      },
    ];

    const durations: number[] = [];

    for (const scenario of scenarios) {
      const start = Date.now();

      await client.responses.create({
        model,
        instructions:
          'Responda somente com base no contexto fornecido. ' + 'Seja direto e objetivo.',
        input: `
Contexto:
${scenario.context}

Pergunta:
${scenario.question}
        `,
      });

      const durationMs = Date.now() - start;

      durations.push(durationMs);
    }

    const averageLatencyMs = durations.reduce((sum, value) => sum + value, 0) / durations.length;

    const maximumAverageLatencyMs = 5_000;

    console.log('\n=== Latency Budget Guard ===');
    console.log({
      model,
      totalRequests: scenarios.length,
      durations,
      averageLatencyMs,
      maximumAverageLatencyMs,
    });

    expect(averageLatencyMs).toBeLessThanOrEqual(maximumAverageLatencyMs);
  });
});
