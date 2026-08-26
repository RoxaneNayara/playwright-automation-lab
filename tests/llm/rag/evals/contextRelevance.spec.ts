import { expect, test } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - RAG Evals - Context Relevance', () => {
  test('deve atribuir score alto para contexto relevante à pergunta', async () => {
    const client = new OpenAI();

    const question = 'Por quanto tempo a conta fica bloqueada após cinco tentativas inválidas?';

    const context = 'Após cinco tentativas inválidas de login, a conta é bloqueada por 30 minutos.';

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      instructions:
        'Você é um avaliador de relevância de contexto em um sistema RAG. ' +
        'Avalie se o contexto fornecido contém informação útil e diretamente relacionada para responder à pergunta. ' +
        'Não avalie a resposta final da LLM; avalie somente a qualidade e relevância do contexto recuperado. ' +
        'Retorne somente JSON válido no formato: ' +
        '{"score": number, "reason": string}. ' +
        'O score deve variar de 0 a 1, onde 1 significa contexto totalmente relevante.',
      input: `
Pergunta:
${question}

Contexto recuperado:
${context}
      `,
    });

    const evaluation = JSON.parse(response.output_text.trim()) as {
      score: number;
      reason: string;
    };

    console.log('Relevant context evaluation:', evaluation);

    expect(evaluation.score).toBeGreaterThanOrEqual(0.9);
    expect(evaluation.reason.length).toBeGreaterThan(0);
  });

  test('deve atribuir score baixo para contexto irrelevante à pergunta', async () => {
    const client = new OpenAI();

    const question = 'Por quanto tempo a conta fica bloqueada após cinco tentativas inválidas?';

    const context =
      'O suporte funciona de segunda a sexta das 8h às 18h. ' +
      'Solicitações críticas recebem prioridade no atendimento.';

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      instructions:
        'Você é um avaliador de relevância de contexto em um sistema RAG. ' +
        'Avalie se o contexto fornecido contém informação útil e diretamente relacionada para responder à pergunta. ' +
        'Não avalie a resposta final da LLM; avalie somente a qualidade e relevância do contexto recuperado. ' +
        'Retorne somente JSON válido no formato: ' +
        '{"score": number, "reason": string}. ' +
        'O score deve variar de 0 a 1, onde 1 significa contexto totalmente relevante.',
      input: `
Pergunta:
${question}

Contexto recuperado:
${context}
      `,
    });

    const evaluation = JSON.parse(response.output_text.trim()) as {
      score: number;
      reason: string;
    };

    console.log('Irrelevant context evaluation:', evaluation);

    expect(evaluation.score).toBeLessThanOrEqual(0.3);
    expect(evaluation.reason.length).toBeGreaterThan(0);
  });
});
