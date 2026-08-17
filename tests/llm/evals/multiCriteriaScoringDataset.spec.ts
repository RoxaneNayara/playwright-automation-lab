import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Evals - Multi Criteria Scoring Dataset', () => {
  const evaluationCases = [
    {
      name: 'resposta correta e completa',
      answer:
        'Smoke testing verifica rapidamente se funcionalidades principais ou críticas estão funcionando antes de testes mais aprofundados.',
      expectedRelevance: 2,
      expectedCompleteness: 2,
    },
    {
      name: 'resposta relevante, mas incompleta',
      answer:
        'Smoke testing é uma verificação rápida realizada antes da regressão.',
      expectedRelevance: 2,
      expectedCompleteness: 1,
    },
    {
      name: 'resposta fora do assunto',
      answer:
        'Teste de carga mede o comportamento do sistema sob alto volume de usuários.',
      expectedRelevance: 0,
      expectedCompleteness: 0,
    },
  ];

  for (const evaluationCase of evaluationCases) {
    test(`deve avaliar múltiplos critérios: ${evaluationCase.name}`, async () => {
      const client = new OpenAI();

      const response = await client.responses.create({
        model: 'gpt-5.6-luna',
        instructions:
          'Você é um avaliador de qualidade de software. ' +
          'Avalie a resposta em dois critérios independentes. ' +
          'RELEVÂNCIA: 0 = fora do assunto; 1 = parcialmente relacionada; 2 = diretamente relacionada à pergunta. ' +
          'COMPLETUDE: 0 = incorreta ou incompatível; 1 = parcialmente correta, mas incompleta; ' +
          '2 = correta e suficientemente completa, indicando que smoke testing verifica rapidamente ' +
          'funcionalidades principais, críticas ou essenciais antes de testes mais aprofundados. ' +
          'Não exija palavras exatas; avalie o significado. ' +
          'Responda somente no formato: relevancia=X;completude=Y',
        input: `
Pergunta:
Qual é o objetivo do smoke testing?

Resposta a avaliar:
${evaluationCase.answer}
        `,
      });

      console.log(response.usage);
      console.log(response.output_text);

      const evaluation = response.output_text.trim().toLowerCase();

      const relevanceMatch = evaluation.match(/relevancia=(\d)/);
      const completenessMatch = evaluation.match(/completude=(\d)/);

      expect(relevanceMatch).not.toBeNull();
      expect(completenessMatch).not.toBeNull();

      const relevanceScore = Number(relevanceMatch![1]);
      const completenessScore = Number(completenessMatch![1]);

      expect(relevanceScore).toBe(evaluationCase.expectedRelevance);
      expect(completenessScore).toBe(evaluationCase.expectedCompleteness);
    });
  }
});