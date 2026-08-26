import { expect, test } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Observability - Token and Latency Tracking', () => {
  test('deve registrar consumo de tokens e latência da chamada', async () => {
    const client = new OpenAI();

    const model = 'gpt-5.6-luna';

    const question = 'Por quanto tempo a conta fica bloqueada após cinco tentativas inválidas?';

    const context = 'Após cinco tentativas inválidas de login, a conta é bloqueada por 30 minutos.';

    const start = Date.now();

    const response = await client.responses.create({
      model,
      instructions: 'Responda somente com base no contexto fornecido. ' + 'Seja direto e objetivo.',
      input: `
Contexto:
${context}

Pergunta:
${question}
      `,
    });

    const durationMs = Date.now() - start;

    const metrics = {
      model,
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
      totalTokens: response.usage?.total_tokens ?? 0,
      durationMs,
    };

    console.log('\n=== LLM Observability Metrics ===');
    console.log(metrics);

    expect(metrics.inputTokens).toBeGreaterThan(0);
    expect(metrics.outputTokens).toBeGreaterThan(0);
    expect(metrics.totalTokens).toBeGreaterThan(0);
    expect(metrics.durationMs).toBeGreaterThan(0);
  });
});
