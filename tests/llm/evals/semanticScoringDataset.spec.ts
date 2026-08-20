import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Fundamentals - Semantic Scoring Dataset', () => {
  const scoringCases = [
    {
      name: 'resposta incorreta',
      answer:
        'Smoke testing substitui a regressão completa e garante que todo o sistema está sem defeitos.',
      expectedScore: 0,
    },
    {
      name: 'resposta parcialmente correta',
      answer: 'Smoke testing é uma verificação rápida realizada antes da regressão.',
      expectedScore: 1,
    },
    {
      name: 'resposta correta e completa',
      answer:
        'Smoke testing verifica rapidamente se funcionalidades principais ou críticas estão funcionando antes de testes mais aprofundados.',
      expectedScore: 2,
    },
  ];

  for (const scoringCase of scoringCases) {
    test(`deve pontuar semanticamente: ${scoringCase.name}`, async () => {
      const client = new OpenAI();

      const response = await client.responses.create({
        model: 'gpt-5.6-luna',
        instructions:
          'Você é um avaliador de qualidade de software. ' +
          'Avalie somente a COMPLETUDE e correção da resposta sobre smoke testing. ' +
          'Use exclusivamente esta escala: ' +
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
${scoringCase.answer}
        `,
      });

      console.log(response.usage);
      console.log(response.output_text);

      const score = Number(response.output_text.trim());

      expect(score).toBe(scoringCase.expectedScore);
    });
  }
});
