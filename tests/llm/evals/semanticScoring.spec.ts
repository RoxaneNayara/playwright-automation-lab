import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Fundamentals - Semantic Scoring', () => {
  test('deve pontuar a completude de uma resposta parcialmente correta', async () => {
    const client = new OpenAI();

    const answerToEvaluate =
      'Smoke testing é uma verificação rápida realizada antes da regressão.';

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      instructions:
        'Você é um avaliador de qualidade de software. ' +
        'Avalie somente a COMPLETUDE da resposta sobre smoke testing. ' +
        'Use esta escala: ' +
        '0 = resposta incorreta ou incompatível com o objetivo do smoke testing; ' +
        '1 = resposta parcialmente correta, mas incompleta; ' +
        '2 = resposta correta e suficientemente completa, indicando que smoke testing ' +
        'verifica rapidamente funcionalidades principais, críticas ou essenciais antes de testes mais aprofundados. ' +
        'Não exija palavras exatas; avalie o significado. ' +
        'Responda somente com 0, 1 ou 2.',
      input: `
Pergunta:
Qual é o objetivo do smoke testing?

Resposta a avaliar:
${answerToEvaluate}
      `,
    });

    console.log(response.usage);
    console.log(response.output_text);

    const score = Number(response.output_text.trim());

    expect(score).toBe(1);
  });
});
