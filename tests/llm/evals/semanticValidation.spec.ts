import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Fundamentals - Semantic Validation', () => {
  test('deve identificar semanticamente uma resposta incorreta', async () => {
    const client = new OpenAI();

    const answerToEvaluate =
      'Smoke testing não valida funcionalidades principais antes de testes aprofundados.';

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      instructions:
        'Você é um avaliador de qualidade de software. ' +
        'Avalie apenas se a resposta fornecida está conceitualmente correta. ' +
        'Responda somente com CORRETA ou INCORRETA.',
      input: `
Pergunta:
Qual é o objetivo do smoke testing?

Resposta a avaliar:
${answerToEvaluate}
      `,
    });

    console.log(response.usage);
    console.log(response.output_text);

    const evaluation = response.output_text.trim().toUpperCase();

    expect(evaluation).toBe('INCORRETA');
  });
});
