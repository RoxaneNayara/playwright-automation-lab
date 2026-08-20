import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Fundamentals - Semantic Evaluation Dataset', () => {
  const evaluationCases = [
    {
      name: 'resposta correta',
      answer:
        'Smoke testing verifica rapidamente se as funcionalidades principais do sistema estão funcionando antes de testes mais aprofundados.',
      expected: 'CORRETA',
    },
    {
      name: 'resposta incorreta',
      answer: 'Smoke testing não valida funcionalidades principais antes de testes aprofundados.',
      expected: 'INCORRETA',
    },
    {
      name: 'resposta correta com palavras diferentes',
      answer:
        'Smoke testing faz uma checagem inicial para identificar se as partes mais importantes da aplicação estão operacionais.',
      expected: 'CORRETA',
    },
    {
      name: 'resposta parcialmente correta e incompleta',
      answer: 'Smoke testing é uma verificação rápida realizada antes da regressão.',
      expected: 'INCORRETA',
    },
  ];

  for (const evaluationCase of evaluationCases) {
    test(`deve avaliar semanticamente: ${evaluationCase.name}`, async () => {
      const client = new OpenAI();

      const response = await client.responses.create({
        model: 'gpt-5.6-luna',
        instructions:
          'Você é um avaliador de qualidade de software. ' +
          'Avalie a resposta usando exclusivamente a rubrica abaixo. ' +
          'Uma resposta deve ser considerada CORRETA quando afirmar que smoke testing ' +
          'serve para verificar rapidamente se funcionalidades principais, críticas ou essenciais ' +
          'do sistema estão funcionando antes de testes mais aprofundados. ' +
          'Considere INCORRETA uma resposta que negue esse objetivo, diga que smoke testing ' +
          'substitui testes completos ou regressão, apresente um objetivo incompatível ' +
          'ou seja incompleta a ponto de não indicar que o foco é verificar funcionalidades ' +
          'principais, críticas ou essenciais do sistema. ' +
          'Não exija palavras exatas; avalie o significado da resposta. ' +
          'Responda somente com CORRETA ou INCORRETA.',
        input: `
Pergunta:
Qual é o objetivo do smoke testing?

Resposta a avaliar:
${evaluationCase.answer}
        `,
      });

      console.log(response.usage);
      console.log(response.output_text);

      const evaluation = response.output_text.trim().toUpperCase();

      expect(evaluation).toBe(evaluationCase.expected);
    });
  }
});
